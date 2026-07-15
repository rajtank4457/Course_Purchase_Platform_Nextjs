import { asyncHandler } from "../helpers/asyncHandler.js";
import { getDb } from "../helpers/dbHelper.js";
import { sendError } from "../helpers/responseHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";

const requireSuperAdmin = (req, res) => {
    if (req.userType !== "admin" || req.userRole !== "super_admin") {
        sendError(res, "Only Super Admin can perform this action", 403);
        return false;
    }

    return true;
};

export const getPendingAdminRequests = asyncHandler(async (req, res) => {
    if (!requireSuperAdmin(req, res)) return;

    const db = await getDb();

    const [rows] = await db.query(`
    SELECT
      adminId,
      adminName,
      gender,
      phNo,
      email,
      role,
      roleId,
      approvalStatus,
      subscriptionStatus,
      isActive,
      createdAt
    FROM admins
    WHERE approvalStatus = 'PENDING'
    AND role IN ('admin', 'faculty')
    ORDER BY adminId DESC
  `);

    return sendEncrypted(res, 200, {
        success: true,
        message: "Pending approval requests fetched successfully",
        data: rows,
    });
});

export const approveAdminRequest = asyncHandler(async (req, res) => {
    if (!requireSuperAdmin(req, res)) return;

    const { adminId } = req.params;
    const superAdminId = req.userId;

    const db = await getDb();

    const [exists] = await db.query(
        `
        SELECT adminId, approvalStatus, role
        FROM admins
        WHERE adminId = ?
        AND role IN ('admin', 'faculty')
        LIMIT 1
        `,
        [adminId]
    );

    if (!exists.length) {
        return sendError(res, "Approval request not found", 404);
    }

    if (exists[0].approvalStatus === "APPROVED") {
        return sendError(res, "Account is already approved", 400);
    }

    await db.query(
        `
        UPDATE admins
        SET approvalStatus = 'APPROVED',
            approvedBy = ?,
            approvedAt = NOW(),
            rejectReason = NULL,
            isActive = 1
        WHERE adminId = ?
        AND role IN ('admin', 'faculty')
        `,
        [superAdminId, adminId]
    );

    await db.query(
        `
        UPDATE organizations
        SET status = 'ACTIVE'
        WHERE ownerAdminId = ?
        `,
        [adminId]
    );

    return sendEncrypted(res, 200, {
        success: true,
        message:
            "Account approved successfully. Subscription purchase is required before login.",
    });
});

export const rejectAdminRequest = asyncHandler(async (req, res) => {
    if (!requireSuperAdmin(req, res)) return;

    const { adminId } = req.params;
    const { rejectReason } = req.body;

    const db = await getDb();

    const [exists] = await db.query(
        `
    SELECT adminId, approvalStatus, role
    FROM admins
    WHERE adminId = ?
    AND role IN ('admin', 'faculty')
    LIMIT 1
    `,
        [adminId]
    );

    if (!exists.length) {
        return sendError(res, "Approval request not found", 404);
    }

    if (exists[0].approvalStatus === "REJECTED") {
        return sendError(res, "Account is already rejected", 400);
    }

    await db.query(
        `
    UPDATE admins
    SET approvalStatus = 'REJECTED',
        approvedBy = NULL,
        approvedAt = NULL,
        rejectReason = ?,
        isActive = 0
    WHERE adminId = ?
    AND role IN ('admin', 'faculty')
    `,
        [rejectReason || "Rejected by Super Admin", adminId]
    );


    await db.query(
        `
        UPDATE organizations
        SET status = 'SUSPENDED'
        WHERE ownerAdminId = ?
        `,
        [adminId]
    );

    return sendEncrypted(res, 200, {
        success: true,
        message: "Account rejected successfully",
    });
});