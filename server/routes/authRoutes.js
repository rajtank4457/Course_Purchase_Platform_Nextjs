import express from 'express'
import { connectToDatabase } from '../lib/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import { UAParser } from "ua-parser-js";

const router = express.Router();

router.post("/session-token", (req, res) => {
    const { publicToken } = req.body;

    if (publicToken !== process.env.PUBLIC_REGISTER_TOKEN) {
        return res.status(401).json({ message: "Invalid public token" });
    }

    const sessionToken = jwt.sign(
        {
            purpose: "guest_session",
            type: "guest",
        },
        process.env.JWT_KEY,
        { expiresIn: "1d" }
    );

    res.cookie("auth_token", sessionToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
        message: "Session token created",
    });
});

router.post("/register", async (req, res) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).json({ message: "Session token missing" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);

        if (decoded.purpose !== "guest_session") {
            return res.status(403).json({ message: "Invalid session token" });
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
            deviceId,
        } = req.body;

        const db = await connectToDatabase();

        const [rows] = await db.query(
            "SELECT * FROM user_details WHERE email = ?",
            [email]
        );

        if (rows.length > 0) {
            return res.status(409).json({ message: "User Already Registered" });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO user_details
      (
        firstName,
        lastName,
        email,
        password,
        phoneNo,
        address,
        city,
        state,
        dob,
        isActive
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                firstName,
                lastName,
                email,
                hashPassword,
                phoneNo,
                address,
                city,
                state,
                dob,
                1,
            ]
        );

        const loginToken = jwt.sign(
            {
                id: result.insertId,
                userId: result.insertId,
                email,
                role: "user",
                type: "user",
            },
            process.env.JWT_KEY,
            { expiresIn: "1d" }
        );

        res.cookie("auth_token", loginToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000,
        });

        return res.status(201).json({
            message: "User Registered Successfully",
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
        });
    } catch (err) {
        console.log(err);

        return res.status(401).json({
            message: "Invalid or expired session token",
            error: err.message,
        });
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const db = await connectToDatabase();

        // Admin login
        const [adminRows] = await db.query(
            "SELECT * FROM admins WHERE email = ?",
            [email]
        );

        if (adminRows.length > 0) {
            const admin = adminRows[0];

            const isMatch = await bcrypt.compare(password, admin.password);

            if (!isMatch) {
                return res.status(401).json({ message: "Password not Matching" });
            }

            const token = jwt.sign(
                {
                    id: admin.adminId,
                    email: admin.email,
                    role: admin.role,
                    type: "admin",
                },
                process.env.JWT_KEY,
                { expiresIn: "3h" }
            );

            res.cookie("auth_token", token, {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                maxAge: 3 * 60 * 60 * 1000,
            });

            return res.status(200).json({
                message: "Admin Login Successful",
                role: admin.role,
                type: "admin",
                user: {
                    adminId: admin.adminId,
                    adminName: admin.adminName,
                    email: admin.email,
                    role: admin.role,
                    type: "admin",
                },
            });
        }

        // User login from user_details
        const [userRows] = await db.query(
            "SELECT * FROM user_details WHERE email = ?",
            [email]
        );

        if (userRows.length === 0) {
            return res.status(404).json({
                message: "User/Admin not Registered",
            });
        }

        const user = userRows[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Password not Matching" });
        }

        const token = jwt.sign(
            {
                id: user.userId,
                email: user.email,
                role: "user",
                type: "user",
            },
            process.env.JWT_KEY,
            { expiresIn: "3h" }
        );

        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 3 * 60 * 60 * 1000,
        });

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
            (
                userId,
                ip_address,
                device_type,
                device_id,
                user_agent
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                user.userId,
                ipAddress,
                deviceType,
                req.body.deviceId || null,
                userAgent,
            ]
        );

        return res.status(200).json({
            message: "User Login Successful",
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
        });
    } catch (err) {
        return res.status(500).json({
            message: "Server Error",
            error: err.message,
        });
    }
});

router.post("/logout", async (req, res) => {
    try {
        res.clearCookie("auth_token", {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
        });

        return res.status(200).json({
            message: "Logout Successful",
        });
    } catch (err) {
        return res.status(500).json({
            message: "Server Error",
            error: err.message,
        });
    }
});

const verifyToken = async (req, res, next) => {
    try {
        const token = req.cookies.auth_token;

        if (!token) {
            return res.status(403).json({ message: "No Token Provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_KEY);

        if (decoded.type === "guest") {
            return res.status(401).json({ message: "Please login first" });
        }

        req.user = decoded;
        req.userId = decoded.id;
        req.userType = decoded.type;
        req.userRole = decoded.role;

        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid Token" });
    }
};

router.get("/home", verifyToken, async (req, res) => {
    try {
        const db = await connectToDatabase();

        let rows = [];

        if (req.userType === "admin") {
            const [adminRows] = await db.query(
                "SELECT adminId, adminName, email, role, isActive FROM admins WHERE adminId = ?",
                [req.userId]
            );

            rows = adminRows;
        } else {
            const [userRows] = await db.query(
                `SELECT 
          userId,
          firstName,
          lastName,
          email,
          phoneNo,
          address,
          city,
          state,
          dob,
          isActive
        FROM user_details 
        WHERE userId = ?`,
                [req.userId]
            );

            rows = userRows.map((user) => ({
                ...user,
                role: "user",
                type: "user",
            }));
        }

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not registered" });
        }

        return res.status(200).json({ user: rows[0] });
    } catch (err) {
        return res.status(500).json({
            message: "Server Error",
            error: err.message,
        });
    }
});

router.get("/user_details", verifyToken, async (req, res) => {
    try {
        const db = await connectToDatabase();

        const [rows] = await db.query(`
      SELECT 
        userId,
        firstName,
        lastName,
        email,
        phoneNo,
        address,
        city,
        state,
        dob,
        isActive
      FROM user_details
      ORDER BY userId DESC
    `);

        return res.status(200).json(rows);
    } catch (err) {
        return res.status(500).json({
            message: "Server Error",
            error: err.message,
        });
    }
});

router.get("/admins", verifyToken, async (req, res) => {
    try {
        const db = await connectToDatabase();

        const [rows] = await db.query(`
            SELECT 
                adminId,
                adminName,
                password,
                gender,
                phNo,
                email,
                isActive,
                role
            FROM admins
            ORDER BY adminId DESC
        `);

        return res.status(200).json(rows);

    } catch (err) {
        return res.status(500).json({
            message: "Server Error",
            error: err.message,
        });
    }
});

router.post("/add-student", verifyToken, async (req, res) => {
    try {
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
            isActive,
        } = req.body;

        const db = await connectToDatabase();

        const hashPassword = await bcrypt.hash(password, 10);

        await db.query(
            `
      INSERT INTO user_details
      (
        firstName,
        lastName,
        email,
        password,
        phoneNo,
        address,
        city,
        state,
        dob,
        isActive
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
            [
                firstName,
                lastName,
                email,
                hashPassword,
                phoneNo,
                address,
                city,
                state,
                dob,
                isActive ?? 1,
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Student added successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
});

router.post("/update-student", verifyToken, async (req, res) => {
    try {
        const {
            userId,
            firstName,
            lastName,
            email,
            phoneNo,
            address,
            city,
            state,
            dob,
            isActive,
        } = req.body;

        const db = await connectToDatabase();

        await db.query(
            `
      UPDATE user_details
      SET
        firstName = ?,
        lastName = ?,
        email = ?,
        phoneNo = ?,
        address = ?,
        city = ?,
        state = ?,
        dob = ?,
        isActive = ?
      WHERE userId = ?
      `,
            [
                firstName,
                lastName,
                email,
                phoneNo,
                address,
                city,
                state,
                dob,
                isActive,
                userId,
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Student updated successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
});

router.post("/delete-student", verifyToken, async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required",
            });
        }

        const db = await connectToDatabase();

        const [result] = await db.query(
            "DELETE FROM user_details WHERE userId = ?",
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Student deleted successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
});

router.post("/add-admin", verifyToken, async (req, res) => {
    try {
        const { password, adminName, gender, phNo, email, isActive, role } =
            req.body;

        const db = await connectToDatabase();

        const hashPassword = await bcrypt.hash(password, 10);

        await db.query(
            `
      INSERT INTO admins
      (
        password,
        adminName,
        gender,
        phNo,
        email,
        isActive,
        role
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
            [
                hashPassword,
                adminName,
                gender,
                phNo,
                email,
                isActive ?? 1,
                role || "admin",
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Admin added successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
});

router.post("/update-admin", verifyToken, async (req, res) => {
    try {
        const {  adminId, adminName, gender, phNo, email, isActive, role } =
            req.body;

        const db = await connectToDatabase();

        await db.query(
            `
      UPDATE admins SET
        adminName = ?,
        gender = ?,
        phNo = ?,
        email = ?,
        isActive = ?,
        role = ? 
        WHERE adminId = ?;
      `,
            [
                adminName,
                gender,
                phNo,
                email,
                isActive ?? 1,
                role || "admin",
                adminId,
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Admin Updated successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
});

router.post("/delete-admin", verifyToken, async (req, res) => {
    try {
        const { adminId } = req.body;

        if (!adminId) {
            return res.status(400).json({
                success: false,
                message: "Admin ID is required",
            });
        }

        const db = await connectToDatabase();

        const [result] = await db.query(
            "DELETE FROM admins WHERE adminId = ?",
            [adminId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Admin deleted successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
});

export default router;