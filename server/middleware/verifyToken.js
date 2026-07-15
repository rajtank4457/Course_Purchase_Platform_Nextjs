import jwt from "jsonwebtoken";
import { connectToDatabase } from "../lib/db.js";

const INACTIVITY_LIMIT = 12 * 60 * 60 * 1000;

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Please login first",
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_KEY);

        if (decoded.type === "guest") {
            return res.status(401).json({
                success: false,
                message: "Please login first",
            });
        }

        const db = await connectToDatabase();

        const [sessions] = await db.query(
            `
      SELECT sessionId, userId, adminId, userType, isActive, lastActivity
      FROM user_sessions
      WHERE token = ?
      AND isActive = 1
      LIMIT 1
      `,
            [token]
        );

        if (!sessions.length) {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please login again.",
            });
        }

        const session = sessions[0];

        const lastActivityTime = new Date(session.lastActivity).getTime();
        const now = Date.now();

        if (now - lastActivityTime > INACTIVITY_LIMIT) {
            await db.query(
                `
        UPDATE user_sessions
        SET isActive = 0,
            endedAt = NOW()
        WHERE sessionId = ?
        `,
                [session.sessionId]
            );

            return res.status(401).json({
                success: false,
                message: "Session expired due to inactivity.",
            });
        }

        await db.query(
            `
      UPDATE user_sessions
      SET lastActivity = NOW()
      WHERE sessionId = ?
      `,
            [session.sessionId]
        );

        req.user = decoded;

        req.userId = decoded.id;
        req.userType = decoded.type;
        req.userRole = decoded.role;

        req.organizationId = decoded.organizationId || null;
        req.isOwner = decoded.isOwner || 0;
        req.roleId = decoded.roleId || null;

        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired session",
        });
    }
};

export default verifyToken;