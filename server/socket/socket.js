import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "../lib/db.js";

let io;

/*Initialize Socket*/

export const initSocket = (server) => {

    io = new Server(server, {
        cors: {
            origin: "http://localhost:3000",
            credentials: true,
            methods: ["GET", "POST"],
        },
    });

    io.use(socketAuth);

    io.on("connection", handleConnection);

    console.log("✅ Socket.IO Initialized");

    return io;
};

/*Get IO Instance*/

export const getIO = () => io;

/*Socket Authentication*/

async function socketAuth(socket, next) {

    try {

        const token =
            socket.handshake.auth?.token ||
            socket.handshake.headers.authorization?.replace("Bearer ", "");

        if (!token) {
            return next(new Error("Unauthorized"));
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_KEY
        );

        const db = await connectToDatabase();

        const [sessions] = await db.query(
            `
            SELECT
                sessionId,
                isActive
            FROM user_sessions
            WHERE token=?
            LIMIT 1
            `,
            [token]
        );

        if (!sessions.length) {
            return next(new Error("Session not found"));
        }

        if (!sessions[0].isActive) {
            return next(new Error("Session expired"));
        }

        socket.user = {

            userId: decoded.id,

            userType: decoded.type,

            userRole: decoded.role,

            organizationId: decoded.organizationId,

            roleId: decoded.roleId,

            isOwner: decoded.isOwner,
        };

        next();

    }
    catch (err) {

        console.log(err);

        next(new Error("Authentication Failed"));

    }

}

/*Connection*/

async function handleConnection(socket) {

    const db = await connectToDatabase();

    const {
        userId,
        userType,
        userRole,
        organizationId,
    } = socket.user;

    console.log(
        `✅ Socket Connected : ${userId} (${userRole})`
    );

    socket.emit("connected", {

        success: true,

        userId,

        userRole,

        userType,

        organizationId,

    });

    /*Personal Room*/

    const personalRoom =
        `org_${organizationId}_${userType}_${userId}`;

    socket.join(personalRoom);

    /*Organization Room*/

    socket.join(
        `organization_${organizationId}`
    );

    /*Existing Notification Rooms*/

    socket.join(`user_${userId}`);

    if (
        userRole === "admin" ||
        userRole === "super_admin"
    ) {
        socket.join("admins");
    }

    /*Save Online Status*/

    await db.query(
        `
        INSERT INTO chat_online_users
        (
            userId,
            userType,
            userRole,
            organizationId,
            socketId,
            isOnline,
            lastSeen
        )
        VALUES
        (?, ?, ?, ?, ?, 1, NULL)

        ON DUPLICATE KEY UPDATE

            socketId=VALUES(socketId),
            isOnline=1,
            lastSeen=NULL
        `,
        [
            userId,
            userType,
            userRole,
            organizationId,
            socket.id,
        ]
    );

    /* Send current online users to newly connected user */

    const [onlineUsers] = await db.query(
        `
        SELECT
            userId,
            userRole,
            userType
        FROM chat_online_users
        WHERE
        organizationId=?
        AND isOnline=1
        `,
        [organizationId]
    );

    socket.emit("onlineUsers", onlineUsers);

    /*Notify Organization*/

    socket
        .to(`organization_${organizationId}`)
        .emit("userOnline", {

            userId,

            userRole,

            userType,

        });

    /* Join Conversation */

    socket.on(
        "joinConversation",
        async (conversationId) => {

            try {

                const [conversation] =
                    await db.query(
                        `
                        SELECT
                            conversationId
                        FROM chat_conversations
                        WHERE
                            conversationId=?
                        AND organizationId=?
                        AND
                        (
                            facultyId=?
                            OR
                            studentId=?
                        )
                        LIMIT 1
                        `,
                        [
                            conversationId,
                            organizationId,
                            userId,
                            userId,
                        ]
                    );

                if (!conversation.length) {

                    return socket.emit(
                        "socketError",
                        "Conversation not found."
                    );

                }

                socket.join(
                    `conversation_${conversationId}`
                );

                socket.emit("joinedConversation", {
                    conversationId,
                });

                console.log(
                    `User ${userId} joined conversation ${conversationId}`
                );

            }
            catch (err) {

                console.log(err);

            }

        }
    );

    /*Leave Conversation*/

    socket.on(
        "leaveConversation",
        (conversationId) => {

            socket.leave(
                `conversation_${conversationId}`
            );

            console.log(
                `User ${userId} left conversation ${conversationId}`
            );

        }
    );

    /*Typing*/

    socket.on(
        "typing",
        ({ conversationId }) => {

            socket
                .to(`conversation_${conversationId}`)
                .emit("typing", {

                    conversationId,

                    senderId: userId,

                    senderRole: userRole,

                    senderType: userType,

                });

        }
    );

    /*Stop Typing*/

    socket.on(
        "stopTyping",
        ({ conversationId }) => {

            socket
                .to(`conversation_${conversationId}`)
                .emit("stopTyping", {

                    conversationId,

                    senderId: userId,

                });

        }
    );

    /*New Message Relay*/

    socket.on(
        "newMessage",
        (message) => {

            io.to(
                `conversation_${message.conversationId}`
            ).emit(
                "newMessage",
                message
            );

        }
    );

    /*Messages Read*/

    socket.on(
        "messagesRead",
        ({ conversationId }) => {

            io.to(
                `conversation_${conversationId}`
            ).emit(
                "messagesRead",
                {

                    conversationId,

                    readBy: userId,

                    readAt: new Date(),

                }
            );

        }
    );

    /*Edit Message*/

    socket.on(
        "editMessage",
        (data) => {

            io.to(
                `conversation_${data.conversationId}`
            ).emit(
                "messageEdited",
                data
            );

        }
    );

    /*Delete Message*/

    socket.on(
        "deleteMessage",
        (data) => {

            io.to(
                `conversation_${data.conversationId}`
            ).emit(
                "messageDeleted",
                data
            );

        }
    );

    /*Message Reaction*/

    socket.on(
        "messageReaction",
        (data) => {

            io.to(
                `conversation_${data.conversationId}`
            ).emit(
                "messageReaction",
                data
            );

        }
    );

    /*Frontend should emit every 60 seconds while connected.*/

    socket.on(
        "heartbeat",
        async () => {

            try {

                await db.query(
                    `
                    UPDATE chat_online_users
                    SET
                        isOnline=1,
                        lastSeen=NULL
                    WHERE socketId=?
                    `,
                    [
                        socket.id
                    ]
                );

                socket.emit("heartbeatAck");

            }
            catch (err) {

                console.log(err);

            }

        }
    );

    /* Disconnect */

    socket.on(
        "disconnect",
        async () => {

            console.log(
                `Socket Disconnected : ${userId}`
            );

            try {

                await db.query(
                    `
            UPDATE chat_online_users
            SET

                isOnline=0,

                lastSeen=NOW()

            WHERE

                userId=?

            AND organizationId=?
            `,
                    [
                        userId,
                        organizationId
                    ]
                );

                socket
                    .to(`organization_${organizationId}`)
                    .emit(
                        "userOffline",
                        {

                            userId,

                            userRole,

                            userType,

                            lastSeen: new Date()

                        }
                    );

            }
            catch (err) {

                console.log(err);

            }

        }
    );
}