import bcrypt from "bcrypt";
import { asyncHandler } from "../helpers/asyncHandler.js";
import { runQuery, getDb } from "../helpers/dbHelper.js";
import { sendError } from "../helpers/responseHelper.js";
import { requireAdmin } from "../helpers/authHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";

export const getAdmins = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) return;

  let rows;

  if (req.userRole === "super_admin") {
    rows = await runQuery(`
      SELECT 
        adminId,
        adminName,
        gender,
        phNo,
        email,
        isActive,
        role,
        roleId,
        organizationId,
        isOwner,
        approvalStatus,
        subscriptionStatus
      FROM admins
      ORDER BY adminId DESC
    `);
  } else {
    if (!req.organizationId) {
      return sendError(res, "Organization not found", 400);
    }

    rows = await runQuery(
      `
      SELECT 
        adminId,
        adminName,
        gender,
        phNo,
        email,
        isActive,
        role,
        roleId,
        organizationId,
        isOwner,
        approvalStatus,
        subscriptionStatus
      FROM admins
      WHERE organizationId = ?
      ORDER BY adminId DESC
      `,
      [req.organizationId]
    );
  }

  return sendEncrypted(res, 200, {
    success: true,
    message: "Admins fetched successfully",
    data: rows,
  });
});

export const addAdmin = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) return;

  if (!req.organizationId && req.userRole !== "super_admin") {
    return sendError(res, "Organization not found", 400);
  }

  const {
    password,
    adminName,
    gender,
    phNo,
    email,
    isActive,
    role,
    roleId,
  } = req.body;

  if (!password || !adminName || !email) {
    return sendError(res, "Name, email and password are required", 400);
  }

  const finalRole = role || "admin";

  const exists = await runQuery(
    `SELECT adminId FROM admins WHERE email = ? LIMIT 1`,
    [email]
  );

  if (exists.length > 0) {
    return sendError(res, "Admin email already exists", 409);
  }

  const hashPassword = await bcrypt.hash(password, 10);

  await runQuery(
    `
    INSERT INTO admins
    (
      password,
      adminName,
      gender,
      phNo,
      email,
      isActive,
      role,
      roleId,
      organizationId,
      isOwner,
      createdBy,
      approvalStatus,
      subscriptionStatus
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'APPROVED', 'ACTIVE')
    `,
    [
      hashPassword,
      adminName,
      gender || null,
      phNo || null,
      email,
      isActive ?? 1,
      finalRole,
      roleId || null,
      req.organizationId || null,
      req.userId,
    ]
  );

  return sendEncrypted(res, 201, {
    success: true,
    message: "Admin added successfully",
    data: {},
  });
});

export const addFaculty = asyncHandler(async (req, res) => {
  const db = await getDb();

  if (req.userType !== "admin") {
    return sendError(res, "Only admin can add faculty", 403);
  }

  if (!req.organizationId) {
    return sendError(res, "Organization not found", 400);
  }

  const [planRows] = await db.query(
    `
    SELECT sp.maxFaculty
    FROM organization_subscriptions os
    JOIN subscription_plans sp ON sp.planId = os.planId
    WHERE os.organizationId = ?
      AND os.paymentStatus = 'success'
      AND os.isActive = 1
      AND os.endDate >= NOW()
    LIMIT 1
    `,
    [req.organizationId]
  );

  if (!planRows.length) {
    return sendError(res, "Active organization subscription required", 403);
  }

  const [countRows] = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM admins
    WHERE organizationId = ?
      AND role = 'faculty'
      AND isActive = 1
    `,
    [req.organizationId]
  );

  if (Number(countRows[0].total) >= Number(planRows[0].maxFaculty)) {
    return sendError(res, "Faculty limit reached. Please upgrade your plan.", 403);
  }

  const { adminName, gender, phNo, email, password } = req.body;

  if (!adminName || !email || !password) {
    return sendError(res, "Faculty name, email and password are required", 400);
  }

  const [exists] = await db.query(
    `
    SELECT adminId
    FROM admins
    WHERE email = ?
    LIMIT 1
    `,
    [email]
  );

  if (exists.length) {
    return sendError(res, "Faculty email already exists", 409);
  }

  const [roleRows] = await db.query(
    `
    SELECT roleId
    FROM roles
    WHERE LOWER(roleName) = 'faculty'
      AND organizationId = ?
    LIMIT 1
    `,
    [req.organizationId]
  );

  if (!roleRows.length) {
    return sendError(res, "Faculty role not found", 400);
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
    VALUES (?, ?, ?, ?, ?, 'faculty', ?, ?, 0, ?, 'APPROVED', 'ACTIVE', 1)
    `,
    [
      adminName,
      gender || null,
      phNo || null,
      email,
      hashedPassword,
      roleRows[0].roleId,
      req.organizationId,
      req.userId,
    ]
  );

  await db.query(
    `
    INSERT INTO notifications
    (
      adminId,
      title,
      message,
      type,
      isRead,
      organizationId
    )
    VALUES (?, ?, ?, ?, 0, ?)
    `,
    [
      result.insertId,
      "Faculty Account Created",
      "Your faculty account has been created successfully.",
      "faculty",
      req.organizationId,
    ]
  );

  return sendEncrypted(res, 201, {
    success: true,
    message: "Faculty added successfully.",
    data: {
      facultyId: result.insertId,
    },
  });
});

export const updateAdmin = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { adminId, adminName, gender, phNo, email, isActive, role, roleId } =
    req.body;

  if (!adminId) {
    return sendError(res, "Admin ID is required", 400);
  }

  let existing;

  if (req.userRole === "super_admin") {
    existing = await runQuery(
      `
      SELECT adminId, role, isOwner, organizationId
      FROM admins
      WHERE adminId = ?
      LIMIT 1
      `,
      [adminId]
    );
  } else {
    existing = await runQuery(
      `
      SELECT adminId, role, isOwner, organizationId
      FROM admins
      WHERE adminId = ?
        AND organizationId = ?
      LIMIT 1
      `,
      [adminId, req.organizationId]
    );
  }

  if (!existing.length) {
    return sendError(res, "Admin not found in your organization", 404);
  }

  if (existing[0].isOwner === 1 && req.userRole !== "super_admin") {
    return sendError(res, "Owner account cannot be updated by admin", 403);
  }

  await runQuery(
    `
    UPDATE admins SET
      adminName = ?,
      gender = ?,
      phNo = ?,
      email = ?,
      isActive = ?,
      role = ?,
      roleId = ?
    WHERE adminId = ?
    `,
    [
      adminName,
      gender || null,
      phNo || null,
      email,
      isActive ?? 1,
      role || "admin",
      roleId || null,
      adminId,
    ]
  );

  return sendEncrypted(res, 200, {
    success: true,
    message: "Admin updated successfully",
    data: {},
  });
});

export const deleteAdmin = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { adminId } = req.body;

  if (!adminId) {
    return sendError(res, "Admin ID is required", 400);
  }

  let existing;

  if (req.userRole === "super_admin") {
    existing = await runQuery(
      `
      SELECT adminId, isOwner, organizationId
      FROM admins
      WHERE adminId = ?
      LIMIT 1
      `,
      [adminId]
    );
  } else {
    existing = await runQuery(
      `
      SELECT adminId, isOwner, organizationId
      FROM admins
      WHERE adminId = ?
        AND organizationId = ?
      LIMIT 1
      `,
      [adminId, req.organizationId]
    );
  }

  if (!existing.length) {
    return sendError(res, "Admin not found in your organization", 404);
  }

  if (existing[0].isOwner === 1) {
    return sendError(res, "Organization owner cannot be deleted", 403);
  }

  const result = await runQuery(
    `
    DELETE FROM admins
    WHERE adminId = ?
    `,
    [adminId]
  );

  if (result.affectedRows === 0) {
    return sendError(res, "Admin not found", 404);
  }

  return sendEncrypted(res, 200, {
    success: true,
    message: "Admin deleted successfully",
    data: {},
  });
});