import { asyncHandler } from "../helpers/asyncHandler.js";
import { getDb } from "../helpers/dbHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";
import { sendError } from "../helpers/responseHelper.js";
import { getIO } from "../socket/socket.js";

export const getUsers = asyncHandler(async (req, res) => {

    const db = await getDb();

    const organizationId = req.organizationId;
    const userRole = req.userRole;

    let users = [];

    // ===============================
    // Faculty -> Students
    // ===============================

    if (userRole === "faculty") {

        const [rows] = await db.query(
            `
            SELECT
                userId,
                firstName,
                lastName,
                email
            FROM user_details
            WHERE organizationId=?
            ORDER BY firstName,lastName
            `,
            [organizationId]
        );

        users = rows.map(user => ({
            userId: user.userId,
            name: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email,
            profileImage: null,
            role: "student",
        }));
    }

    // ===============================
    // Student -> Faculty
    // ===============================

    else {

        const [rows] = await db.query(
            `
            SELECT
                adminId,
                adminName,
                email,
                NULL AS profileImage
            FROM admins
            WHERE
                organizationId=?
                AND role='faculty'
                AND approvalStatus='APPROVED'
                AND isActive=1
            ORDER BY adminName
            `,
            [organizationId]
        );

        users = rows.map(user => ({
            userId: user.adminId,
            name: user.adminName,
            email: user.email,
            profileImage: user.profileImage,
            role: "faculty"
        }));
    }

    return sendEncrypted(res, 200, {
        success: true,
        data: users
    });

});

export const createConversation = asyncHandler(async (req, res) => {

    const db = await getDb();
    const organizationId = req.organizationId;
    const userId = req.userId;
    const userRole = req.userRole;
    const { receiverId } = req.body;

    if (!receiverId) {

        return sendError(
            res,
            "Receiver is required",
            400
        );

    }

    let facultyId;
    let studentId;

    // Logged in Faculty

    if (userRole === "faculty") {
        facultyId = userId;
        studentId = receiverId;
    }

    // Logged in Student
    else {
        facultyId = receiverId;
        studentId = userId;
    }

    // ====================================
    // Verify both belong to same organization
    // ====================================

    const [faculty] = await db.query(
        `
        SELECT adminId
        FROM admins
        WHERE
        adminId=?
        AND organizationId=?
        AND role='faculty'
        LIMIT 1
        `,
        [
            facultyId,
            organizationId
        ]
    );

    if (!faculty.length) {

        return sendError(
            res,
            "Faculty not found",
            404
        );

    }

    const [student] = await db.query(
        `
        SELECT userId
        FROM user_details
        WHERE
        userId=?
        AND organizationId=?
        LIMIT 1
        `,
        [
            studentId,
            organizationId
        ]
    );

    if (!student.length) {

        return sendError(
            res,
            "Student not found",
            404
        );

    }

    // ====================================
    // Already exists?
    // ====================================

    const [conversation] = await db.query(
        `
        SELECT *
        FROM chat_conversations
        WHERE
        organizationId=?
        AND facultyId=?
        AND studentId=?
        LIMIT 1
        `,
        [
            organizationId,
            facultyId,
            studentId
        ]
    );

    if (conversation.length) {

        return sendEncrypted(res, 200, {
            success: true,
            message: "Conversation already exists",
            data: conversation[0]
        });

    }

    // ====================================
    // Create Conversation
    // ====================================

    const [result] = await db.query(
        `
        INSERT INTO chat_conversations
        (
            organizationId,
            facultyId,
            studentId
        )
        VALUES
        (?, ?, ?)
        `,
        [
            organizationId,
            facultyId,
            studentId
        ]
    );

    const [newConversation] = await db.query(
        `
        SELECT *
        FROM chat_conversations
        WHERE conversationId=?
        `,
        [
            result.insertId
        ]
    );

    return sendEncrypted(res, 201, {

        success: true,

        message: "Conversation created successfully",

        data: newConversation[0]

    });

});

export const getConversations = asyncHandler(async (req, res) => {

    const db = await getDb();

    const organizationId = req.organizationId;
    const userId = req.userId;
    const userRole = req.userRole;

    let query = "";
    let params = [];

    // ==========================
    // Faculty
    // ==========================

    if (userRole === "faculty") {

        query = `
            SELECT
                c.conversationId,
                c.lastMessage,
                c.lastMessageType,
                c.lastMessageAt,
                u.userId,
                CONCAT(u.firstName,' ',u.lastName) AS name,
                u.email,
                NULL AS profileImage,
                (
                    SELECT COUNT(*)
                    FROM chat_messages cm
                    WHERE
                        cm.conversationId=c.conversationId
                        AND cm.receiverId=?
                        AND cm.receiverRole='faculty'
                        AND cm.isSeen=0
                ) AS unreadCount
            FROM chat_conversations c
            INNER JOIN user_details u
                ON u.userId=c.studentId
            WHERE
                c.organizationId=?  
                AND c.facultyId=?
            ORDER BY
                c.lastMessageAt DESC,
                c.updatedAt DESC
        `;

        params = [
            userId,
            organizationId,
            userId
        ];
    }

    // ==========================
    // Student
    // ==========================

    else {

        query = `
                SELECT
                    c.conversationId,
                    c.lastMessage,
                    c.lastMessageType,
                    c.lastMessageAt,

                    a.adminId AS userId,
                    a.adminName AS name,
                    a.email,
                    NULL AS profileImage,

                    (
                        SELECT COUNT(*)
                        FROM chat_messages cm
                        WHERE
                            cm.conversationId = c.conversationId
                            AND cm.receiverId = ?
                            AND cm.receiverRole = 'student'
                            AND cm.isSeen = 0
                    ) AS unreadCount

                FROM chat_conversations c

                INNER JOIN admins a
                    ON a.adminId = c.facultyId

                WHERE
                    c.organizationId = ?
                    AND c.studentId = ?

                ORDER BY
                    c.lastMessageAt DESC,
                    c.updatedAt DESC
                `;

        params = [
            userId,
            organizationId,
            userId
        ];
    }

    const [rows] = await db.query(query, params);

    return sendEncrypted(res, 200, {
        success: true,
        data: rows
    });

});

export const getMessages = asyncHandler(async (req, res) => {

    const db = await getDb();

    const { conversationId } = req.params;

    const organizationId = req.organizationId;
    const userId = req.userId;

    // ===================================
    // Security Check
    // ===================================

    const [conversation] = await db.query(
        `
        SELECT *
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
            userId
        ]
    );

    if (!conversation.length) {

        return sendError(
            res,
            "Conversation not found",
            404
        );

    }

    // ===================================
    // Messages
    // ===================================

    const [messages] = await db.query(
        `
        SELECT

            m.messageId,
            m.conversationId,
            m.senderId,
            m.senderRole,
            m.receiverId,
            m.receiverRole,
            m.replyToMessageId,

            m.message,
            m.messageType,

            m.fileUrl,
            m.fileName,
            m.fileSize,

            m.isSeen,
            m.seenAt,
            m.createdAt,

            r.message AS replyMessage,
            r.senderId AS replySenderId,
            r.senderRole AS replySenderRole,
            r.messageType AS replyMessageType,
            r.fileName AS replyFileName,
            r.fileUrl AS replyFileUrl

        FROM chat_messages m

        LEFT JOIN chat_messages r
        ON r.messageId = m.replyToMessageId

        WHERE
            m.conversationId=?
            AND m.organizationId=?

        ORDER BY m.createdAt ASC
        `,
        [
            conversationId,
            organizationId
        ]
    );

    return sendEncrypted(res, 200, {
        success: true,
        data: messages
    });

});

export const sendMessage = asyncHandler(async (req, res) => {

    const db = await getDb();

    const io = getIO();

    const organizationId = req.organizationId;
    const senderId = req.userId;
    const senderRole = req.userRole;

    const {

        conversationId,

        message,

        replyToMessageId = null,

        messageType = "text",

    } = req.body;

    console.log(req.body.message);

    let fileUrl = null;
    let fileName = null;
    let fileSize = null;

    if (req.file) {

        fileUrl = `/uploads/chat/${req.file.filename}`;

        fileName = req.file.originalname;

        fileSize = req.file.size;

    }

    if (!conversationId) {

        return sendError(
            res,
            "Conversation is required",
            400
        );

    }

    if (!message && !fileUrl) {

        return sendError(
            res,
            "Message is required",
            400
        );

    }

    //--------------------------------------------------
    // Verify Conversation
    //--------------------------------------------------

    const [conversation] = await db.query(
        `
        SELECT *
        FROM chat_conversations
        WHERE
            conversationId=?
        AND organizationId=?
        LIMIT 1
        `,
        [
            conversationId,
            organizationId
        ]
    );

    if (!conversation.length) {

        return sendError(
            res,
            "Conversation not found",
            404
        );

    }

    const chat = conversation[0];

    //--------------------------------------------------
    // Verify Sender
    //--------------------------------------------------

    let receiverId;
    let receiverRole;

    if (senderRole === "faculty") {

        if (Number(chat.facultyId) !== Number(senderId)) {
            return sendError(res, "Unauthorized", 403);
        }

        receiverId = chat.studentId;
        receiverRole = "student";

    } else {

        if (Number(chat.studentId) !== Number(senderId)) {
            return sendError(res, "Unauthorized", 403);
        }

        receiverId = chat.facultyId;
        receiverRole = "faculty";

    }

    //--------------------------------------------------
    // Insert Message
    //--------------------------------------------------

    const [result] = await db.query(
        `
        INSERT INTO chat_messages
        (
            conversationId,
            organizationId,
            senderId,
            senderRole,
            receiverId,
            receiverRole,
            replyToMessageId,
            message,
            messageType,
            fileUrl,
            fileName,
            fileSize
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            conversationId,
            organizationId,
            senderId,
            senderRole,
            receiverId,
            receiverRole,
            replyToMessageId,
            message || null,
            messageType,
            fileUrl,
            fileName,
            fileSize
        ]
    );

    //--------------------------------------------------
    // Fetch Inserted Message
    //--------------------------------------------------

    const [messages] = await db.query(
        `
    SELECT
        m.*,

        r.message AS replyMessage,
        r.senderId AS replySenderId,
        r.senderRole AS replySenderRole,
        r.messageType AS replyMessageType,
        r.fileName AS replyFileName

    FROM chat_messages m

    LEFT JOIN chat_messages r
        ON r.messageId = m.replyToMessageId

    WHERE m.messageId = ?
    `,
        [
            result.insertId
        ]
    );

    const newMessage = messages[0];

    //--------------------------------------------------
    // Update Conversation
    //--------------------------------------------------

    await db.query(
        `
        UPDATE chat_conversations
        SET

            lastMessage=?,

            lastMessageType=?,

            lastSenderRole=?,

            lastMessageAt=NOW()

        WHERE conversationId=?
        `,
        [
            message || fileName || messageType,
            messageType,
            senderRole,
            conversationId
        ]
    );

    //--------------------------------------------------
    // Receiver Room
    //--------------------------------------------------

    const receiverRoom =
        `org_${organizationId}_${receiverRole}_${receiverId}`;

    //--------------------------------------------------
    // Sender Room
    //--------------------------------------------------

    const senderRoom =
        `org_${organizationId}_${senderRole}_${senderId}`;

    //--------------------------------------------------
    // Conversation Room
    //--------------------------------------------------

    const conversationRoom =
        `conversation_${conversationId}`;

    //--------------------------------------------------
    // Real Time Message
    //--------------------------------------------------

    io.to(conversationRoom).emit(
        "newMessage",
        newMessage
    );

    //--------------------------------------------------
    // Conversation Refresh
    //--------------------------------------------------

    io.to(receiverRoom).emit(
        "conversationUpdated",
        {
            conversationId
        }
    );

    //--------------------------------------------------
    // Response
    //--------------------------------------------------

    return sendEncrypted(
        res,
        201,
        {
            success: true,
            message: "Message sent successfully",
            data: newMessage
        }
    );

});

export const markAsRead = asyncHandler(async (req, res) => {

    const db = await getDb();

    const organizationId = req.organizationId;
    const userId = req.userId;
    const userRole = req.userRole;

    const { conversationId } = req.body;

    if (!conversationId) {

        return sendError(
            res,
            "Conversation is required",
            400
        );

    }

    //-------------------------------------
    // Verify Conversation
    //-------------------------------------

    const [conversation] = await db.query(
        `
        SELECT *
        FROM chat_conversations
        WHERE
        conversationId=?
        AND organizationId=?
        AND (
            facultyId=?
            OR studentId=?
        )
        LIMIT 1
        `,
        [
            conversationId,
            organizationId,
            userId,
            userId
        ]
    );

    if (!conversation.length) {

        return sendError(
            res,
            "Conversation not found",
            404
        );

    }

    //-------------------------------------
    // Mark Messages Read
    //-------------------------------------

    await db.query(
        `
        UPDATE chat_messages
        SET
            isSeen = 1,
            seenAt = NOW()
        WHERE
            conversationId = ?
            AND receiverId = ?
            AND receiverRole = ?
            AND isSeen = 0
        `,
        [
            conversationId,
            userId,
            userRole
        ]
    );

    //-------------------------------------
    // Get Sender
    //-------------------------------------

    const chat = conversation[0];

    let senderId;
    let senderRole;

    if (userRole === "faculty") {

        senderId = chat.studentId;
        senderRole = "student";

    } else {

        senderId = chat.facultyId;
        senderRole = "faculty";

    }

    //-------------------------------------
    // Socket Event
    //-------------------------------------

    const io = getIO();

    io.to(`org_${organizationId}_${senderRole}_${senderId}`).emit(
        "messagesRead",
        {
            conversationId,
            readBy: userId,
            readByRole: userRole,
        }
    );

    //-------------------------------------

    return sendEncrypted(res, 200, {

        success: true,

        message: "Messages marked as read"

    });

});