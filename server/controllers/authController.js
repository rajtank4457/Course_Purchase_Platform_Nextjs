import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UAParser } from "ua-parser-js";
import { asyncHandler } from "../helpers/asyncHandler.js";
import { getDb } from "../helpers/dbHelper.js";
import { sendSuccess, sendError } from "../helpers/responseHelper.js";
import {
    createLoginToken,
    setAuthCookie,
    clearAuthCookie,
    deactivateOldSessions,
    createUserSession,
    endSessionByToken,
} from "../helpers/sessionHelper.js";

export const sessionToken = asyncHandler(async (req, res) => {
    const { publicToken } = req.body;

    if (publicToken !== process.env.PUBLIC_REGISTER_TOKEN) {
        return sendError(res, "Invalid public token", 401);
    }

    const token = jwt.sign(
        {
            purpose: "guest_session",
            type: "guest",
        },
        process.env.JWT_KEY,
        { expiresIn: "1d" }
    );

    res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
    });

    return sendSuccess(res, {}, "Session token created");
});

export const register = asyncHandler(async (req, res) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return sendError(res, "Session token missing", 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);

    if (decoded.purpose !== "guest_session") {
        return sendError(res, "Invalid session token", 403);
    }

    const {
        firstName,
        lastName,
        email,
        password,
        phoneNo,
        address,
        city,
        state,
        dob,
    } = req.body;

    if (!firstName || !email || !password) {
        return sendError(res, "First name, email and password are required", 400);
    }

    const db = await getDb();

    const [exists] = await db.query(
        `SELECT userId FROM user_details WHERE email = ? LIMIT 1`,
        [email]
    );

    if (exists.length > 0) {
        return sendError(res, "User already registered", 409);
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
        `
    INSERT INTO user_details
    (
      firstName, lastName, email, password, phoneNo,
      address, city, state, dob, isActive
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `,
        [
            firstName,
            lastName || null,
            email,
            hashPassword,
            phoneNo || null,
            address || null,
            city || null,
            state || null,
            dob || null,
        ]
    );

    const loginToken = createLoginToken({
        id: result.insertId,
        userId: result.insertId,
        email,
        role: "user",
        type: "user",
    });

    await deactivateOldSessions(db, {
        userId: result.insertId,
        userType: "user",
    });

    await createUserSession(db, {
        userId: result.insertId,
        userType: "user",
        token: loginToken,
    });

    setAuthCookie(res, loginToken);

    return sendSuccess(
        res,
        {
            role: "user",
            type: "user",
            user: {
                userId: result.insertId,
                firstName,
                lastName,
                email,
                role: "user",
                type: "user",
            },
        },
        "User Registered Successfully",
        201
    );
});

export const login = asyncHandler(async (req, res) => {
    const { email, password, deviceId } = req.body;

    if (!email || !password) {
        return sendError(res, "Email and password are required", 400);
    }

    const db = await getDb();

    const [adminRows] = await db.query(
        `SELECT * FROM admins WHERE email = ? LIMIT 1`,
        [email]
    );

    if (adminRows.length > 0) {
        const admin = adminRows[0];

        if (Number(admin.isActive) === 0) {
            return sendError(res, "Admin account is inactive", 403);
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return sendError(res, "Password not matching", 401);
        }

        const token = createLoginToken({
            id: admin.adminId,
            email: admin.email,
            role: admin.role,
            type: "admin",
        });

        await deactivateOldSessions(db, {
            adminId: admin.adminId,
            userType: "admin",
        });

        await createUserSession(db, {
            adminId: admin.adminId,
            userType: "admin",
            token,
        });

        setAuthCookie(res, token);

        return sendSuccess(
            res,
            {
                role: admin.role,
                type: "admin",
                user: {
                    adminId: admin.adminId,
                    adminName: admin.adminName,
                    email: admin.email,
                    role: admin.role,
                    type: "admin",
                },
            },
            "Admin Login Successful"
        );
    }

    const [userRows] = await db.query(
        `SELECT * FROM user_details WHERE email = ? LIMIT 1`,
        [email]
    );

    if (userRows.length === 0) {
        return sendError(res, "User/Admin not registered", 404);
    }

    const user = userRows[0];

    if (Number(user.isActive) === 0) {
        return sendError(res, "User account is inactive", 403);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return sendError(res, "Password not matching", 401);
    }

    const token = createLoginToken({
        id: user.userId,
        userId: user.userId,
        email: user.email,
        role: "user",
        type: "user",
    });

    await deactivateOldSessions(db, {
        userId: user.userId,
        userType: "user",
    });

    await createUserSession(db, {
        userId: user.userId,
        userType: "user",
        token,
    });

    setAuthCookie(res, token);

    const ipAddress =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.headers["x-real-ip"] ||
        req.socket.remoteAddress ||
        req.ip ||
        "Unknown";

    const userAgent = req.headers["user-agent"] || "Unknown";
    const parser = new UAParser(userAgent);
    const deviceInfo = parser.getResult();
    const deviceType = deviceInfo.device.type || "desktop";

    await db.query(
        `
    INSERT INTO users
    (userId, ip_address, device_type, device_id, user_agent)
    VALUES (?, ?, ?, ?, ?)
    `,
        [user.userId, ipAddress, deviceType, deviceId || null, userAgent]
    );

    return sendSuccess(
        res,
        {
            role: "user",
            type: "user",
            user: {
                userId: user.userId,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: "user",
                type: "user",
                isActive: user.isActive,
            },
        },
        "User Login Successful"
    );
});

export const logout = asyncHandler(async (req, res) => {
    const token = req.cookies?.auth_token;
    const db = await getDb();

    await endSessionByToken(db, token);

    clearAuthCookie(res);

    return sendSuccess(res, {}, "Logout Successful");
});

export const home = asyncHandler(async (req, res) => {
    const db = await getDb();

    if (req.userType === "admin") {
        const [rows] = await db.query(
            `
      SELECT adminId, adminName, email, role, isActive
      FROM admins
      WHERE adminId = ?
      `,
            [req.userId]
        );

        if (rows.length === 0) {
            return sendError(res, "Admin not registered", 404);
        }

        return res.status(200).json({
            user: {
                ...rows[0],
                type: "admin",
            },
        });
    }

    const [rows] = await db.query(
        `
    SELECT 
      userId, firstName, lastName, email, phoneNo,
      address, city, state, dob, isActive
    FROM user_details
    WHERE userId = ?
    `,
        [req.userId]
    );

    if (rows.length === 0) {
        return sendError(res, "User not registered", 404);
    }

    return res.status(200).json({
        user: {
            ...rows[0],
            role: "user",
            type: "user",
        },
    });
});