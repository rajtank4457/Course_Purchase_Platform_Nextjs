import bcrypt from "bcrypt";
import { asyncHandler } from "../helpers/asyncHandler.js";
import { getDb } from "../helpers/dbHelper.js";
import { sendSuccess, sendError } from "../helpers/responseHelper.js";
import { requireAdmin } from "../helpers/authHelper.js";

export const getAdmins = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const db = await getDb();

  const [rows] = await db.query(`
    SELECT 
      adminId,
      adminName,
      gender,
      phNo,
      email,
      isActive,
      role
    FROM admins
    ORDER BY adminId DESC
  `);

  return sendSuccess(res, { data: rows }, "Admins fetched successfully");
});

export const addAdmin = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { password, adminName, gender, phNo, email, isActive, role } = req.body;

  if (!password || !adminName || !email) {
    return sendError(res, "Name, email and password are required", 400);
  }

  const db = await getDb();

  const [exists] = await db.query(
    `SELECT adminId FROM admins WHERE email = ? LIMIT 1`,
    [email]
  );

  if (exists.length > 0) {
    return sendError(res, "Admin email already exists", 409);
  }

  const hashPassword = await bcrypt.hash(password, 10);

  await db.query(
    `
    INSERT INTO admins
    (password, adminName, gender, phNo, email, isActive, role)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      hashPassword,
      adminName,
      gender || null,
      phNo || null,
      email,
      isActive ?? 1,
      role || "admin",
    ]
  );

  return sendSuccess(res, {}, "Admin added successfully", 201);
});

export const updateAdmin = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { adminId, adminName, gender, phNo, email, isActive, role } = req.body;

  if (!adminId) {
    return sendError(res, "Admin ID is required", 400);
  }

  const db = await getDb();

  await db.query(
    `
    UPDATE admins SET
      adminName = ?,
      gender = ?,
      phNo = ?,
      email = ?,
      isActive = ?,
      role = ?
    WHERE adminId = ?
    `,
    [
      adminName,
      gender || null,
      phNo || null,
      email,
      isActive ?? 1,
      role || "admin",
      adminId,
    ]
  );

  return sendSuccess(res, {}, "Admin updated successfully");
});

export const deleteAdmin = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { adminId } = req.body;

  if (!adminId) {
    return sendError(res, "Admin ID is required", 400);
  }

  const db = await getDb();

  const [result] = await db.query(
    `DELETE FROM admins WHERE adminId = ?`,
    [adminId]
  );

  if (result.affectedRows === 0) {
    return sendError(res, "Admin not found", 404);
  }

  return sendSuccess(res, {}, "Admin deleted successfully");
});