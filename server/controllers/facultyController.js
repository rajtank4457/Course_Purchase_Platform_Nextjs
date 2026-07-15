import bcrypt from "bcrypt";
import { asyncHandler } from "../helpers/asyncHandler.js";
import { runQuery, findOne } from "../helpers/dbHelper.js";
import { sendError } from "../helpers/responseHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";
import { requireAdmin } from "../helpers/authHelper.js";

const isSuperAdmin = (req) => req.userRole === "super_admin";

const orgFilter = (req) => {
  if (isSuperAdmin(req)) return "";
  return "AND organizationId = ?";
};

const orgParam = (req) => {
  return isSuperAdmin(req) ? [] : [req.organizationId];
};

const canManageFaculty = (req) => {
  return req.userRole === "super_admin" ||
    (req.userRole === "admin" && req.isOwner === 1);
}

export const getFaculty = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const rows = await runQuery(
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
      organizationId
    FROM admins
    WHERE role = 'faculty'
    ${orgFilter(req)}
    ORDER BY adminId DESC
    `,
    orgParam(req)
  );

  return sendEncrypted(res, 200, {
    success: true,
    message: "Faculty fetched successfully",
    data: rows,
  });
});

export const addFaculty = asyncHandler(async (req, res) => {
  if (!canManageFaculty(req)) {
    return sendError(
      res,
      "Only Organization Admin can add faculty.",
      403
    );
  }

  const {
    adminName,
    gender,
    phNo,
    email,
    password,
    isActive,
    organizationId,
  } = req.body;

  const finalOrganizationId = isSuperAdmin(req)
    ? organizationId
    : req.organizationId;

  if (!finalOrganizationId) {
    return sendError(res, "Organization is required", 400);
  }

  if (!adminName || !email || !password) {
    return sendError(res, "Name, email and password are required", 400);
  }

  const exists = await findOne(
    `
    SELECT adminId
    FROM admins
    WHERE email = ?
    LIMIT 1
    `,
    [email]
  );

  if (exists) {
    return sendError(res, "Faculty email already exists", 409);
  }

  // Get Faculty Role ID automatically
  const facultyRole = await findOne(
    `
    SELECT roleId
    FROM roles
    WHERE LOWER(roleName) = 'faculty'
    LIMIT 1
    `
  );

  if (!facultyRole) {
    return sendError(res, "Faculty role not found", 500);
  }

  const hashPassword = await bcrypt.hash(password, 10);

  await runQuery(
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
      isActive,
      organizationId,
      approvalStatus,
      subscriptionStatus
    )
    VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', 'ACTIVE')
    `,
    [
      adminName,
      gender || null,
      phNo || null,
      email,
      hashPassword,
      "faculty",
      facultyRole.roleId,
      isActive ?? 1,
      finalOrganizationId,
    ]
  );

  return sendEncrypted(res, 201, {
    success: true,
    message: "Faculty added successfully",
    data: {},
  });
});

export const updateFaculty = asyncHandler(async (req, res) => {
  if (!canManageFaculty(req)) {
    return sendError(
      res,
      "Only Organization Admin can add faculty.",
      403
    );
  }

  const {
    adminId,
    adminName,
    gender,
    phNo,
    email,
    isActive,
    roleId,
  } = req.body;

  if (!adminId) {
    return sendError(res, "Faculty ID is required", 400);
  }

  if (!adminName || !email) {
    return sendError(res, "Name and email are required", 400);
  }

  const exists = await runQuery(
    `
    SELECT adminId
    FROM admins
    WHERE email = ?
      AND adminId != ?
    LIMIT 1
    `,
    [email, adminId]
  );

  if (exists.length > 0) {
    return sendError(res, "Email already used by another faculty", 409);
  }

  const result = await runQuery(
    `
    UPDATE admins
    SET adminName = ?,
        gender = ?,
        phNo = ?,
        email = ?,
        roleId = ?,
        isActive = ?
    WHERE adminId = ?
      AND role = 'faculty'
      ${orgFilter(req)}
    `,
    [
      adminName,
      gender || null,
      phNo || null,
      email,
      roleId || null,
      isActive ?? 1,
      adminId,
      ...orgParam(req),
    ]
  );

  if (result.affectedRows === 0) {
    return sendError(res, "Faculty not found", 404);
  }

  return sendEncrypted(res, 200, {
    success: true,
    message: "Faculty updated successfully",
    data: {},
  });
});

export const deleteFaculty = asyncHandler(async (req, res) => {
  if (!canManageFaculty(req)) {
    return sendError(
      res,
      "Only Organization Admin can add faculty.",
      403
    );
  }

  const { adminId } = req.body;

  if (!adminId) {
    return sendError(res, "Faculty ID is required", 400);
  }

  const result = await runQuery(
    `
    DELETE FROM admins
    WHERE adminId = ?
      AND role = 'faculty'
      ${orgFilter(req)}
    `,
    [adminId, ...orgParam(req)]
  );

  if (result.affectedRows === 0) {
    return sendError(res, "Faculty not found", 404);
  }

  return sendEncrypted(res, 200, {
    success: true,
    message: "Faculty deleted successfully",
    data: {},
  });
});