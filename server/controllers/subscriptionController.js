import crypto from "crypto";
import Razorpay from "razorpay";
import { asyncHandler } from "../helpers/asyncHandler.js";
import { getDb } from "../helpers/dbHelper.js";
import { sendError } from "../helpers/responseHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const getSubscriptionPlans = asyncHandler(async (req, res) => {
    const db = await getDb();

    const [plans] = await db.query(`
        SELECT
            sp.*,
        COUNT(os.subscriptionId) AS subscribers,
        COALESCE(COUNT(os.subscriptionId) * sp.price,0) AS revenue
        FROM subscription_plans sp
        LEFT JOIN organization_subscriptions os
        ON os.planId = sp.planId
        AND os.paymentStatus='success'
        AND os.isActive=1
        GROUP BY sp.planId
        ORDER BY sp.price;
        `);

    return sendEncrypted(res, 200, {
        success: true,
        message: "Subscription plans fetched successfully",
        data: plans,
    });
});

export const getSubscriptionPlanById = asyncHandler(async (req, res) => {
    const { planId } = req.params;

    const db = await getDb();

    const [plans] = await db.query(
        `
        SELECT *
        FROM subscription_plans
        WHERE planId = ?
        LIMIT 1
        `,
        [planId]
    );

    if (!plans.length) {
        return sendError(res, "Subscription plan not found", 404);
    }

    const plan = plans[0];

    const [permissionRows] = await db.query(
        `
        SELECT
            p.permissionId,
            p.permissionName
        FROM subscription_plan_permissions spp
        INNER JOIN permissions p
            ON p.permissionId = spp.permissionId
        WHERE spp.planId = ?
        AND spp.isEnabled = 1
        ORDER BY p.permissionName;
        `,
        [planId]
    );

    plan.permissions = permissionRows.map(
        (p) => p.permissionId
    );

    plan.permissionNames = permissionRows.map(
        (p) => p.permissionName
    );

    return sendEncrypted(res, 200, {
        success: true,
        message: "Subscription plan fetched successfully",
        data: plan,
    });
});

export const getSubscriptionPermissions = asyncHandler(async (req, res) => {
    const db = await getDb();

    const [permissions] = await db.query(`
        SELECT
            permissionId,
            permissionKey,
            permissionName,
            moduleName
        FROM permissions
        ORDER BY moduleName ASC, permissionName ASC
    `);

    return sendEncrypted(res, 200, {
        success: true,
        message: "Permissions fetched successfully",
        data: permissions,
    });
});

export const getSubscriptionPlanPermissions = asyncHandler(async (req, res) => {
    const { planId } = req.params;

    const db = await getDb();

    const [permissions] = await db.query(
        `
        SELECT
            p.permissionId,
            p.permissionKey,
            p.permissionName,
            p.moduleName,
            IFNULL(spp.isEnabled,0) AS isEnabled
        FROM permissions p
        LEFT JOIN subscription_plan_permissions spp
            ON spp.permissionId = p.permissionId
            AND spp.planId = ?
        ORDER BY p.permissionName
        `,
        [planId]
    );

    return sendEncrypted(res, 200, {
        success: true,
        message: "Plan permissions fetched successfully",
        data: permissions,
    });
});

export const addSubscriptionPlan = asyncHandler(async (req, res) => {
    const {
        planName,
        targetRole,
        price,
        durationDays,
        maxCourses,
        maxChapters,
        maxStudents,
        maxFaculty,
        maxExams,
        storageLimit,
        maxFileUploadSize,
        isActive,
        permissions = [],
    } = req.body;

    if (!planName || !price || !durationDays) {
        return sendError(
            res,
            "Plan name, price and duration are required",
            400
        );
    }

    const db = await getDb();

    await db.beginTransaction();

    try {

        const [result] = await db.query(
            `
            INSERT INTO subscription_plans
            (
                planName,
                targetRole,
                price,
                durationDays,
                maxCourses,
                maxChapters,
                maxStudents,
                maxFaculty,
                maxExams,
                storageLimit,
                maxFileUploadSize,
                isActive
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                planName,
                targetRole || "both",
                price,
                durationDays,
                maxCourses || 0,
                maxChapters || 0,
                maxStudents || 0,
                maxFaculty || 0,
                maxExams || 0,
                storageLimit,
                maxFileUploadSize,
                isActive ?? 1,
            ]
        );

        const planId = result.insertId;

        if (permissions.length > 0) {

            const values = permissions.map(permissionId => [
                planId,
                permissionId,
                1,
            ]);

            await db.query(
                `
                INSERT INTO subscription_plan_permissions
                (
                    planId,
                    permissionId,
                    isEnabled
                )
                VALUES ?
                `,
                [values]
            );
        }

        await db.commit();

        return sendEncrypted(res, 201, {
            success: true,
            message: "Subscription plan added successfully",
        });

    } catch (err) {

        await db.rollback();
        throw err;
    }
});

export const updateSubscriptionPlan = asyncHandler(async (req, res) => {
    const { planId } = req.params;

    const {
        planName,
        targetRole,
        price,
        durationDays,
        maxCourses,
        maxChapters,
        maxStudents,
        maxFaculty,
        maxExams,
        storageLimit,
        maxFileUploadSize,
        isActive,
        permissions = [],
    } = req.body;

    const db = await getDb();

    const [exists] = await db.query(
        `
        SELECT planId
        FROM subscription_plans
        WHERE planId=?
        LIMIT 1
        `,
        [planId]
    );

    if (!exists.length) {
        return sendError(res, "Subscription plan not found", 404);
    }

    await db.beginTransaction();

    try {

        const [result] = await db.query(
            `
            UPDATE subscription_plans
            SET
                planName=?,
                targetRole=?,
                price=?,
                durationDays=?,
                maxCourses=?,
                maxChapters=?,
                maxStudents=?,
                maxFaculty=?,
                maxExams=?,
                storageLimit=?,
                maxFileUploadSize=?,
                isActive=?
            WHERE planId=?
            `,
            [
                planName,
                targetRole,
                price,
                durationDays,
                maxCourses,
                maxChapters,
                maxStudents,
                maxFaculty,
                maxExams,
                storageLimit,
                maxFileUploadSize,
                isActive,
                planId,
            ]
        );

        await db.query(
            `
            DELETE
            FROM subscription_plan_permissions
            WHERE planId=?
            `,
            [planId]
        );

        if (permissions.length > 0) {

            const values = permissions.map(permissionId => [
                planId,
                permissionId,
                1,
            ]);

            await db.query(
                `
                INSERT INTO subscription_plan_permissions
                (
                    planId,
                    permissionId,
                    isEnabled
                )
                VALUES ?
                `,
                [values]
            );
        }

        await db.commit();

        return sendEncrypted(res, 200, {
            success: true,
            message: "Subscription plan updated successfully",
        });

    } catch (err) {

        await db.rollback();
        throw err;
    }
});

export const updateSubscriptionPlanPermissions = asyncHandler(async (req, res) => {
    const { planId } = req.params;
    const { permissions } = req.body;

    const db = await getDb();

    await db.beginTransaction();

    try {

        await db.query(
            `
            DELETE FROM subscription_plan_permissions
            WHERE planId=?
            `,
            [planId]
        );

        if (Array.isArray(permissions) && permissions.length > 0) {

            const values = permissions.map(permissionId => [
                planId,
                permissionId,
                1,
            ]);

            await db.query(
                `
                INSERT INTO subscription_plan_permissions
                (
                    planId,
                    permissionId,
                    isEnabled
                )
                VALUES ?
                `,
                [values]
            );
        }

        await db.commit();

        return sendEncrypted(res, 200, {
            success: true,
            message: "Plan permissions updated successfully"
        });

    } catch (err) {

        await db.rollback();

        throw err;
    }
});

export const createSubscriptionOrder = asyncHandler(async (req, res) => {
    const { planId } = req.body;
    const adminId = req.userId;
    const organizationId = req.organizationId;

    if (!organizationId) {
        return sendError(res, "Organization not found", 400);
    }

    if (req.userType !== "admin") {
        return sendError(res, "Only admin or faculty can buy subscription", 403);
    }

    if (req.userRole === "super_admin") {
        return sendError(res, "Super Admin does not need subscription", 400);
    }

    const db = await getDb();

    const [plans] = await db.query(
        `
        SELECT *
        FROM subscription_plans
        WHERE planId = ?
        AND isActive = 1
        LIMIT 1
        `,
        [planId]
    );

    if (!plans.length) {
        return sendError(res, "Subscription plan not found", 404);
    }

    const plan = plans[0];

    const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(Number(plan.price) * 100),
        currency: "INR",
        receipt: `org_sub_${organizationId}_${Date.now()}`,
    });

    const [result] = await db.query(
        `
        INSERT INTO organization_subscriptions
        (
            organizationId,
            planId,
            razorpayOrderId,
            paymentStatus,
            isActive,
            startDate,
            endDate
        )
        VALUES (?, ?, ?, 'pending', 0, NULL, NULL)
        `,
        [organizationId, planId, razorpayOrder.id]
    );

    return sendEncrypted(res, 201, {
        success: true,
        message: "Subscription order created successfully",
        data: {
            subscriptionId: result.insertId,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.RAZORPAY_KEY_ID,
            plan,
        },
    });
});

export const verifySubscriptionPayment = asyncHandler(async (req, res) => {
    const {
        subscriptionId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
    } = req.body;

    const adminId = req.userId;
    const organizationId = req.organizationId;

    if (!organizationId) {
        return sendError(res, "Organization not found", 400);
    }

    if (
        !subscriptionId ||
        !razorpayOrderId ||
        !razorpayPaymentId ||
        !razorpaySignature
    ) {
        return sendError(res, "Payment verification data missing", 400);
    }

    const db = await getDb();

    const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

    if (generatedSignature !== razorpaySignature) {
        return sendError(res, "Invalid payment signature", 400);
    }

    const [rows] = await db.query(
        `
        SELECT 
            s.subscriptionId,
            s.organizationId,
            s.planId,
            s.razorpayOrderId,
            sp.durationDays
        FROM organization_subscriptions s
        JOIN subscription_plans sp ON s.planId = sp.planId
        WHERE s.subscriptionId = ?
        AND s.organizationId = ?
        AND s.razorpayOrderId = ?
        LIMIT 1
        `,
        [subscriptionId, organizationId, razorpayOrderId]
    );

    if (!rows.length) {
        return sendError(res, "Subscription order not found", 404);
    }

    const subscription = rows[0];

    await db.query(
        `
        UPDATE organization_subscriptions
        SET isActive = 0
        WHERE organizationId = ?
        `,
        [organizationId]
    );

    await db.query(
        `
        UPDATE organization_subscriptions
        SET paymentStatus = 'success',
            isActive = 1,
            startDate = NOW(),
            endDate = DATE_ADD(NOW(), INTERVAL ? DAY),
            razorpayPaymentId = ?,
            razorpaySignature = ?
        WHERE subscriptionId = ?
        `,
        [
            subscription.durationDays,
            razorpayPaymentId,
            razorpaySignature,
            subscription.subscriptionId,
        ]
    );

    await db.query(
        `
        UPDATE admins
        SET subscriptionStatus = 'ACTIVE'
        WHERE organizationId = ?
        `,
        [organizationId]
    );

    const [adminRows] = await db.query(
        `
        SELECT adminId, role, roleId
        FROM admins
        WHERE adminId = ?
        LIMIT 1
        `,
        [adminId]
    );

    const admin = adminRows[0];

    let permissions = [];

    if (admin?.role === "super_admin") {
        const [permissionRows] = await db.query(`
            SELECT permissionKey
            FROM permissions
        `);

        permissions = permissionRows.map((item) => item.permissionKey);
    } else if (admin?.roleId) {
        const [permissionRows] = await db.query(
            `
            SELECT DISTINCT p.permissionKey
            FROM role_permissions rp
            JOIN permissions p 
                ON p.permissionId = rp.permissionId
            JOIN subscription_plan_permissions pp 
                ON pp.permissionId = p.permissionId
            JOIN organization_subscriptions s 
                ON s.planId = pp.planId
            WHERE rp.roleId = ?
            AND s.organizationId = ?
            AND s.paymentStatus = 'success'
            AND s.isActive = 1
            AND s.endDate >= NOW()
            AND pp.isEnabled = 1
            `,
            [admin.roleId, organizationId]
        );

        permissions = permissionRows.map((item) => item.permissionKey);
    }

    return sendEncrypted(res, 200, {
        success: true,
        message: "Subscription activated successfully",
        data: {
            subscriptionStatus: "ACTIVE",
            needsSubscription: false,
            permissions,
        },
    });
});

export const getMySubscription = asyncHandler(async (req, res) => {

    const db = await getDb();

    if (!req.organizationId) {
        return sendError(res, "Organization not found", 400);
    }

    const [rows] = await db.query(
        `
        SELECT
            s.subscriptionId,
            s.organizationId,
            s.planId,
            s.paymentStatus,
            s.isActive,
            s.startDate,
            s.endDate,

            sp.planName,
            sp.targetRole,
            sp.price,
            sp.durationDays,
            sp.maxCourses,
            sp.maxChapters,
            sp.maxStudents,
            sp.maxFaculty,
            sp.maxExams,
            sp.storageLimit,
            sp.maxFileUploadSize

        FROM organization_subscriptions s

        JOIN subscription_plans sp
            ON sp.planId=s.planId

        WHERE s.organizationId=?

        ORDER BY s.subscriptionId DESC

        LIMIT 1
        `,
        [req.organizationId]
    );

    if (!rows.length) {

        return sendEncrypted(res, 200, {
            success: true,
            message: "No subscription found",
            data: null,
        });
    }

    const subscription = rows[0];

    const [permissionRows] = await db.query(
        `
        SELECT
            p.permissionId,
            p.permissionKey,
            p.permissionName
        FROM subscription_plan_permissions spp
        JOIN permissions p
            ON p.permissionId = spp.permissionId
        WHERE spp.planId = ?
        AND spp.isEnabled = 1
        ORDER BY p.permissionName
        `,
        [subscription.planId]
    );

    subscription.permissions = permissionRows;

    return sendEncrypted(res, 200, {
        success: true,
        message: "My subscription fetched successfully",
        data: subscription,
    });
});

export const getAdminSubscription = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const db = await getDb();

    const finalOrganizationId =
        req.userRole === "super_admin" ? organizationId : req.organizationId;

    if (!finalOrganizationId) {
        return sendError(res, "Organization not found", 400);
    }

    const [rows] = await db.query(
        `
        SELECT
            s.subscriptionId,
            s.organizationId,
            s.planId,
            s.paymentStatus,
            s.isActive,
            s.startDate,
            s.endDate,
            sp.planName,
            sp.price,
            sp.durationDays
        FROM organization_subscriptions s
        JOIN subscription_plans sp ON s.planId = sp.planId
        WHERE s.organizationId = ?
        ORDER BY s.subscriptionId DESC
        `,
        [finalOrganizationId]
    );

    return sendEncrypted(res, 200, {
        success: true,
        message: "Organization subscription fetched successfully",
        data: rows,
    });
});