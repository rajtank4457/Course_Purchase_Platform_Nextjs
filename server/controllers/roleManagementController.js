import connectToDatabase from "../lib/db.js";

export const getOrganizations = async (req, res) => {
    try {

        const db = await connectToDatabase();

        const [rows] = await db.query(
            `
            SELECT
                organizationId,
                organizationName
            FROM organizations
            WHERE status='ACTIVE'
            AND isDefault = 0
            ORDER BY organizationName ASC
            `
        );

        return res.status(200).json({
            success: true,
            data: rows,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getRolesByOrganization = async (req, res) => {
    try {
        const db = await connectToDatabase();

        const { organizationId } = req.params;

        const [rows] = await db.query(
            `
      SELECT
          a.adminId,
          a.adminName,
          a.email,
          a.gender,
          a.role,
          a.roleId,
          a.isActive,
          a.organizationId,

          COUNT(DISTINCT rp.permissionId) AS permissionCount

      FROM admins a

      LEFT JOIN role_permissions rp
          ON rp.roleId = a.roleId

      WHERE
          a.organizationId = ?
          AND a.approvalStatus='APPROVED'

      GROUP BY
          a.adminId

      ORDER BY
          FIELD(a.role,'super_admin','admin','faculty'),
          a.adminName
      `,
            [organizationId]
        );

        return res.json({
            success: true,
            data: rows,
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getRolePermissions = async (req, res) => {
    try {
        const db = await connectToDatabase();
        const { roleId } = req.params;

        /* ---------------------------------------
            Get all permissions
        --------------------------------------- */

        const [permissions] = await db.query(
            `
        SELECT
            permissionId,
            permissionKey,
            permissionName,
            moduleName
        FROM permissions
        ORDER BY moduleName, permissionName
      `
        );

        /* ---------------------------------------
            Get assigned permissions
        --------------------------------------- */

        const [assigned] = await db.query(
            `
        SELECT permissionId
        FROM role_permissions
        WHERE roleId=?
      `,
            [roleId]
        );

        const assignedSet = new Set(
            assigned.map((item) => item.permissionId)
        );

        /* ---------------------------------------
            Group Permissions
        --------------------------------------- */

        const modules = {};

        permissions.forEach((permission) => {
            const [feature, action] =
                permission.permissionKey.split(".");

            const moduleName = permission.moduleName;

            if (!modules[moduleName]) {
                modules[moduleName] = {
                    moduleName,
                    features: {},
                };
            }

            if (!modules[moduleName].features[feature]) {
                modules[moduleName].features[feature] = {
                    featureId: feature,

                    featureName:
                        feature.charAt(0).toUpperCase() +
                        feature.slice(1),

                    permissions: {},
                };
            }

            modules[moduleName].features[
                feature
            ].permissions[action] = {
                permissionId: permission.permissionId,

                allowed: assignedSet.has(
                    permission.permissionId
                ),
            };
        });

        /* ---------------------------------------
            Convert Object to Array
        --------------------------------------- */

        const result = Object.values(modules).map(
            (module) => ({
                moduleName: module.moduleName,

                features: Object.values(module.features),
            })
        );

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const updateRolePermissions = async (req, res) => {
    const db = await connectToDatabase();

    try {
        const { roleId } = req.params;
        const { permissions } = req.body;

        if (!Array.isArray(permissions)) {
            return res.status(400).json({
                success: false,
                message: "Permissions are required",
            });
        }

        await db.beginTransaction();

        const [role] = await db.query(
            `
            SELECT roleId
            FROM roles
            WHERE roleId=?
            `,
            [roleId]
        );

        if (role.length === 0) {
            await db.rollback();

            return res.status(404).json({
                success: false,
                message: "Role not found",
            });
        }

        await db.query(
            `
            DELETE FROM role_permissions
            WHERE roleId=?
            `,
            [roleId]
        );

        const selectedPermissions = permissions.filter(
            (item) => item.allowed
        );

        if (selectedPermissions.length > 0) {

            const values = selectedPermissions.map((item) => [
                roleId,
                item.permissionId,
            ]);

            await db.query(
                `
                INSERT INTO role_permissions
                (roleId, permissionId)
                VALUES ?
                `,
                [values]
            );
        }

        await db.commit();

        return res.json({
            success: true,
            message: "Permissions updated successfully",
        });

    } catch (err) {

        await db.rollback();

        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};