import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UAParser } from "ua-parser-js";
import {
    createLoginToken,
    deactivateOldSessions,
    createUserSession,
    endSessionByToken,
} from "../helpers/sessionHelper.js";
import { asyncHandler } from "../helpers/asyncHandler.js";
import { getDb, findOne, insertRow } from "../helpers/dbHelper.js";
import { sendError } from "../helpers/responseHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";

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

    return sendEncrypted(res, 200, {
        success: true,
        message: "Session token created",
        data: {
            token,
        },
    });
});

export const register = asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return sendError(res, "Session token missing", 401);
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_KEY);

    if (decoded.purpose !== "guest_session" || decoded.type !== "guest") {
        return sendError(res, "Invalid session token", 403);
    }

    const {
        firstName,
        lastName,
        email,
        password,
        organizationId,
        phoneNo,
        address,
        city,
        state,
        dob,
        deviceId,
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

    const result = await insertRow("user_details", {
        firstName,
        lastName: lastName || null,
        email,
        password: hashPassword,
        organizationId: req.organizationId || organizationId,
        phoneNo: phoneNo || null,
        address: address || null,
        city: city || null,
        state: state || null,
        dob: dob || null,
        deviceId: deviceId || null,
        isActive: 1,
    });

    const loginToken = createLoginToken({
        id: result.insertId,
        userId: result.insertId,
        email,
        role: "user",
        type: "user",
        organizationId: req.organizationId || organizationId || null,
        isOwner: 0,
        roleId: null,
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

    return sendEncrypted(res, 201, {
        success: true,
        message: "User Registered Successfully",
        data: {
            token: loginToken,
            role: "user",
            type: "user",
            user: {
                userId: result.insertId,
                firstName,
                lastName,
                email,
                organizationId: req.organizationId || organizationId || null,
                role: "user",
                type: "user",
            }
        },
    });
});

export const adminRegister = asyncHandler(async (req, res) => {
    const {
        adminName,
        gender,
        phNo,
        email,
        password,
        organizationName,
    } = req.body;

    const requestedRole = req.body.role;

    if (requestedRole && requestedRole !== "admin") {
        return sendError(
            res,
            "Faculty cannot register publicly. Faculty must be added by organization admin.",
            403
        );
    }

    if (!adminName || !email || !password || !organizationName) {
        return sendError(res, "Admin name, email, password and organization name are required", 400);
    }

    const role = "admin";

    const db = await getDb();

    const [exists] = await db.query(
        `SELECT adminId FROM admins WHERE email = ? LIMIT 1`,
        [email]
    );

    if (exists.length) {
        return sendError(res, "Email already exists", 409);
    }

    const [roleRows] = await db.query(
        `SELECT roleId FROM roles WHERE LOWER(roleName) = 'admin' LIMIT 1`
    );

    if (!roleRows.length) {
        return sendError(res, "Admin role not found", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
        `
        INSERT INTO admins
        (
        adminName,
        gender,
        phNo,
        email,
        password,
        role,
        roleId,
        organizationId,
        isOwner,
        createdBy,
        approvalStatus,
        subscriptionStatus,
        isActive
        )
        VALUES (?, ?, ?, ?, ?, 'admin', ?, NULL, 1, NULL, 'PENDING', 'NONE', 0)
        `,
        [
            adminName,
            gender || null,
            phNo || null,
            email,
            hashedPassword,
            roleRows[0].roleId,
        ]
    );

    await db.query(
        `
    INSERT INTO organizations
    (
      organizationName,
      ownerAdminId,
      status
    )
    VALUES (?, ?, 'SUSPENDED')
    `,
        [organizationName, result.insertId]
    );

    const [orgRows] = await db.query(
        `SELECT organizationId FROM organizations WHERE ownerAdminId = ? LIMIT 1`,
        [result.insertId]
    );

    await db.query(
        `
    UPDATE admins
    SET organizationId = ?
    WHERE adminId = ?
    `,
        [orgRows[0].organizationId, result.insertId]
    );

    return sendEncrypted(res, 201, {
        success: true,
        message:
            "Organization registration request sent to Super Admin. After approval, subscription purchase is required.",
        data: {
            adminId: result.insertId,
            organizationId: orgRows[0].organizationId,
            role,
        },
    });
});

export const login = asyncHandler(async (req, res) => {
    const { email, password, deviceId } = req.body;

    if (!email || !password) {
        return sendError(res, "Email and password are required", 400);
    }


    const db = await getDb();

    const admin = await findOne(
        `SELECT * FROM admins WHERE email = ? LIMIT 1`,
        [email]
    );

    if (admin) {
        if (admin.role !== "super_admin" && admin.approvalStatus === "PENDING") {
            return sendError(
                res,
                "Your account is waiting for Super Admin approval",
                403
            );
        }

        if (admin.role !== "super_admin" && admin.approvalStatus === "REJECTED") {
            return sendError(res, "Your registration request was rejected", 403);
        }

        if (admin.role !== "super_admin" && admin.approvalStatus !== "APPROVED") {
            return sendError(res, "Your account is not approved", 403);
        }

        if (Number(admin.isActive) === 0) {
            return sendError(res, "Admin account is inactive", 403);
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return sendError(res, "Password not matching", 401);
        }

        let subscriptionStatus = "INACTIVE";
        let needsSubscription = false;

        if (admin.role === "super_admin") {
            subscriptionStatus = "ACTIVE";
            needsSubscription = false;
        } else {
            const [subscriptionRows] = await db.query(
                `
                SELECT 
                    os.subscriptionId,
                    os.paymentStatus,
                    os.isActive,
                    os.startDate,
                    os.endDate,
                    os.planId
                FROM organization_subscriptions os
                WHERE os.organizationId = ?
                AND os.paymentStatus = 'success'
                AND os.isActive = 1
                AND os.endDate >= NOW()
                ORDER BY os.subscriptionId DESC
                LIMIT 1
                `,
                [admin.organizationId]
            );

            const activeSubscription = subscriptionRows[0];

            subscriptionStatus = activeSubscription ? "ACTIVE" : "INACTIVE";
            needsSubscription = !activeSubscription;

            await db.query(
                `
                UPDATE admins
                SET subscriptionStatus = ?
                WHERE adminId = ?
                `,
                [subscriptionStatus, admin.adminId]
            );
        }

        const token = createLoginToken({
            id: admin.adminId,
            userId: admin.adminId,
            email: admin.email,
            role: admin.role,
            roleId: admin.roleId || null,
            organizationId: admin.organizationId || null,
            isOwner: admin.isOwner || 0,
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

        let permissions = [];

        if (admin.role === "super_admin") {
            const [permissionRows] = await db.query(`
            SELECT permissionKey
            FROM permissions
        `);

            permissions = permissionRows.map((item) => item.permissionKey);
        } else if (admin.roleId && subscriptionStatus === "ACTIVE") {
            const [permissionRows] = await db.query(
                `
                SELECT DISTINCT p.permissionKey
                FROM role_permissions rp
                JOIN permissions p 
                    ON p.permissionId = rp.permissionId
                JOIN organization_subscriptions os
                    ON os.organizationId = ?
                JOIN subscription_plan_permissions pp
                    ON pp.planId = os.planId
                    AND pp.permissionId = p.permissionId
                WHERE rp.roleId = ?
                AND os.paymentStatus = 'success'
                AND os.isActive = 1
                AND os.endDate >= NOW()
                AND pp.isEnabled = 1
                `,
                [admin.organizationId, admin.roleId]
            );

            permissions = permissionRows.map((item) => item.permissionKey);
        }

        return sendEncrypted(res, 200, {
            success: true,
            message: needsSubscription
                ? "Login successful. Subscription required before dashboard access."
                : "Admin Login Successful",
            data: {
                token,
                role: admin.role,
                type: "admin",
                needsSubscription,
                permissions,
                user: {
                    userId: admin.adminId,
                    adminId: admin.adminId,
                    adminName: admin.adminName,
                    email: admin.email,
                    role: admin.role,
                    roleId: admin.roleId || null,
                    organizationId: admin.organizationId,
                    isOwner: admin.isOwner,
                    approvalStatus: admin.approvalStatus,
                    subscriptionStatus,
                    type: "admin",
                    permissions,
                },
            },
        });
    }

    const user = await findOne(
        `SELECT * FROM user_details WHERE email = ? LIMIT 1`,
        [email]
    );

    if (!user) {
        return sendError(res, "User/Admin not registered", 404);
    }

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

        organizationId: user.organizationId,
        isOwner: 0,
        roleId: null,
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

    // user login
    return sendEncrypted(res, 200, {
        success: true,
        message: "User Login Successful",
        data: {
            token,
            role: "user",
            type: "user",
            user: {
                userId: user.userId,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                organizationId: user.organizationId,
                role: "user",
                type: "user",
                isActive: user.isActive,
            },
        },
    });
});

export const logout = asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;

    const token =
        authHeader && authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : null;

    const db = await getDb();

    if (token) {
        await endSessionByToken(db, token);
    }

    return sendEncrypted(res, 200, {
        success: true,
        message: "Logout Successful",
        data: {},
    });
});

export const home = asyncHandler(async (req, res) => {
    const db = await getDb();

    if (req.userType === "admin") {
        const [rows] = await db.query(
            `
            SELECT
                adminId,
                adminName,
                email,
                role,
                roleId,
                organizationId,
                isOwner,
                approvalStatus,
                subscriptionStatus,
                isActive
            FROM admins
            WHERE adminId = ?
            LIMIT 1
            `,
            [req.userId]
        );

        if (!rows.length) {
            return sendError(res, "Admin not registered", 404);
        }

        return sendEncrypted(res, 200, {
            success: true,
            message: "Admin fetched successfully",
            user: {
                ...rows[0],
                type: "admin",
            },
        });
    }

    const [rows] = await db.query(
        `
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
        organizationId,
        isActive
        FROM user_details
        WHERE userId = ?
        LIMIT 1
        `,
        [req.userId]
    );

    if (!rows.length) {
        return sendError(res, "User not registered", 404);
    }

    return sendEncrypted(res, 200, {
        success: true,
        message: "User fetched successfully",
        user: {
            ...rows[0],
            role: "user",
            type: "user",
        },
    });
});