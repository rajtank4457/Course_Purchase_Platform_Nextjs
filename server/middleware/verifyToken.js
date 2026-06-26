
// import jwt from 'jsonwebtoken'

// const verifyToken = async (req, res, next) => {
//     try {
//         const token = req.cookies.auth_token;

//         if (!token) {
//             return res.status(403).json({ message: "No Token Provided" });
//         }

//         const decoded = jwt.verify(token, process.env.JWT_KEY);

//         if (decoded.type === "guest") {
//             return res.status(401).json({ message: "Please login first" });
//         }

//         req.user = decoded;
//         req.userId = decoded.id;
//         req.userType = decoded.type;
//         req.userRole = decoded.role;

//         next();
//     } catch (err) {
//         return res.status(401).json({ message: "Invalid Token" });
//     }
// };

// export default verifyToken;

import jwt from "jsonwebtoken";
import { connectToDatabase } from "../lib/db.js";

const INACTIVITY_LIMIT = 30 * 60 * 1000;

const clearAuthCookie = (res) => {
    res.clearCookie("auth_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });
};

const verifyToken = async (req, res, next) => {
    try {
        const token = req.cookies?.auth_token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Please login first",
            });
        }

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

        if (sessions.length === 0) {
            clearAuthCookie(res);

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
        SET isActive = 0, endedAt = NOW()
        WHERE sessionId = ?
        `,
                [session.sessionId]
            );

            clearAuthCookie(res);

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

        next();
    } catch (err) {
        clearAuthCookie(res);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired session",
        });
    }
};

export default verifyToken;