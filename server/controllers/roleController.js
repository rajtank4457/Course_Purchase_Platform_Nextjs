import { asyncHandler } from "../helpers/asyncHandler.js";
import { getDb } from "../helpers/dbHelper.js";
import { sendError } from "../helpers/responseHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";


export const getRoles = asyncHandler(async (req, res) => {
    const db = await getDb();

    if (!req.organizationId && req.userRole !== "super_admin") {
        return sendError(res, "Organization not found", 400);
    }

    const [roles] = await db.query(
        `
        SELECT roleId, roleName, description, isActive, createdAt
        FROM roles
        WHERE organizationId = ?
        ORDER BY roleId DESC
        `,
        [req.organizationId]
    );

    return sendEncrypted(res, 200, {
        success: true,
        message: "Roles fetched successfully",
        data: roles,
    });
});

export const addRole = asyncHandler(async (req, res) => {
    const { roleName, description } = req.body;

    if (!req.organizationId && req.userRole !== "super_admin") {
        return sendError(res, "Organization not found", 400);
    }

    if (!roleName) {
        return sendError(res, "Role name is required", 400);
    }

    const db = await getDb();

    const [exists] = await db.query(
        `
        SELECT roleId
        FROM roles
        WHERE roleName = ?
            AND organizationId = ?
        LIMIT 1
        `,
        [roleName, req.organizationId]
    );

    if (exists.length) {
        return sendError(res, "Role already exists", 409);
    }

    await db.query(
        `
        INSERT INTO roles (roleName, description, isActive, organizationId)
        VALUES (?, ?, 1, ?)
        `,
        [roleName, description || null, req.organizationId]
    );

    return sendEncrypted(res, 201, {
        success: true,
        message: "Role added successfully",
    });
});

export const updateRole = asyncHandler(async (req, res) => {
    const { roleId } = req.params;
    const { roleName, description, isActive } = req.body;

    if (!req.organizationId && req.userRole !== "super_admin") {
        return sendError(res, "Organization not found", 400);
    }

    if (!roleName) {
        return sendError(res, "Role name is required", 400);
    }

    const db = await getDb();

    const [exists] = await db.query(
        `
        SELECT roleId
        FROM roles
        WHERE roleId = ?
            AND organizationId = ?
        LIMIT 1
        `,
        [roleId, req.organizationId]
    );

    if (!exists.length) {
        return sendError(res, "Role not found", 404);
    }

    await db.query(
        `
        UPDATE roles
        SET roleName = ?,
            description = ?,
            isActive = ?
        WHERE roleId = ?
            AND organizationId = ?
        `,
        [roleName, description || null, isActive ?? 1, roleId, req.organizationId]
    );

    return sendEncrypted(res, 200, {
        success: true,
        message: "Role updated successfully",
    });
});

export const getPermissions = asyncHandler(async (req, res) => {
    const db = await getDb();

    if (!req.organizationId && req.userRole !== "super_admin") {
        return sendError(res, "Organization not found", 400);
    }

    const [permissions] = await db.query(`
    SELECT permissionId, permissionKey, permissionName, moduleName
    FROM permissions
    ORDER BY moduleName ASC, permissionKey ASC
  `);

    return sendEncrypted(res, 200, {
        success: true,
        message: "Permissions fetched successfully",
        data: permissions,
    });
});

export const assignPermissionsToRole = asyncHandler(async (req, res) => {
    const { roleId } = req.params;
    const { permissionIds } = req.body;

    if (!req.organizationId && req.userRole !== "super_admin") {
        return sendError(res, "Organization not found", 400);
    }

    if (!Array.isArray(permissionIds)) {
        return sendError(res, "permissionIds must be an array", 400);
    }

    const db = await getDb();

    const [role] = await db.query(
        `
        SELECT roleId
        FROM roles
        WHERE roleId = ?
            AND organizationId = ?
        LIMIT 1
        `,
        [roleId, req.organizationId]
    );

    if (!role.length) {
        return sendError(res, "Role not found", 404);
    }

    await db.query(`DELETE FROM role_permissions WHERE roleId = ?`, [roleId]);

    if (permissionIds.length) {
        const values = permissionIds.map((permissionId) => [
            roleId,
            permissionId,
        ]);

        await db.query(
            `
      INSERT INTO role_permissions (roleId, permissionId)
      VALUES ?
      `,
            [values]
        );
    }

    return sendEncrypted(res, 200, {
        success: true,
        message: "Permissions assigned successfully",
    });
});

export const assignRoleToAdmin = asyncHandler(async (req, res) => {
    const { adminId } = req.params;
    const { roleId } = req.body;

    if (!req.organizationId && req.userRole !== "super_admin") {
        return sendError(res, "Organization not found", 400);
    }

    if (!roleId) {
        return sendError(res, "roleId is required", 400);
    }

    const db = await getDb();

    const [admin] = await db.query(
        `
        SELECT adminId, role
        FROM admins
        WHERE adminId = ?
            AND organizationId = ?
            AND role IN ('admin', 'faculty')
        LIMIT 1
        `,
        [adminId, req.organizationId]
    );

    if (!admin.length) {
        return sendError(res, "Admin or faculty not found", 404);
    }

    const [role] = await db.query(
        `
        SELECT roleId
        FROM roles
        WHERE roleId = ?
            AND organizationId = ?
            AND isActive = 1
        LIMIT 1
        `,
        [roleId, req.organizationId]
    );

    if (!role.length) {
        return sendError(res, "Role not found or inactive", 404);
    }

    await db.query(
        `
        UPDATE admins
        SET roleId = ?
        WHERE adminId = ?
            AND organizationId = ?
        `,
        [roleId, adminId, req.organizationId]
    );

    return sendEncrypted(res, 200, {
        success: true,
        message: "Role assigned successfully",
    });
});