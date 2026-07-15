import { getDb } from "../helpers/dbHelper.js";
import { sendError } from "../helpers/responseHelper.js";

export const checkPermission = (permissionKey) => {
  return async (req, res, next) => {
    try {
      if (req.userType !== "admin") {
        return sendError(res, "Only admin can access this route", 403);
      }

      if (req.userRole === "super_admin") {
        return next();
      }

      const db = await getDb();

      const [rows] = await db.query(
        `
        SELECT p.permissionKey
        FROM admins a
        JOIN role_permissions rp ON a.roleId = rp.roleId
        JOIN permissions p ON rp.permissionId = p.permissionId
        WHERE a.adminId = ?
        AND p.permissionKey = ?
        AND a.approvalStatus = 'APPROVED'
        AND a.isActive = 1
        LIMIT 1
        `,
        [req.userId, permissionKey]
      );

      if (!rows.length) {
        return sendError(res, "You do not have permission for this action", 403);
      }

      next();
    } catch (error) {
      return sendError(res, "Permission check failed", 500);
    }
  };
};