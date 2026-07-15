import express from "express";
import {
    getOrganizations,
    getRolesByOrganization,
    getRolePermissions,
    updateRolePermissions,
} from "../controllers/roleManagementController.js";
import verifyToken from "../middleware/verifyToken.js";
import verifySuperAdmin from "../middleware/verifySuperAdmin.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Organization
|--------------------------------------------------------------------------
*/

router.get(
    "/organizations",
    verifyToken,
    verifySuperAdmin,
    getOrganizations
);

/*
|--------------------------------------------------------------------------
| Roles
|--------------------------------------------------------------------------
*/

router.get(
    "/roles/:organizationId",
    verifyToken,
    verifySuperAdmin,
    getRolesByOrganization
);

/*
|--------------------------------------------------------------------------
| Permissions
|--------------------------------------------------------------------------
*/

router.get(
    "/permissions/:roleId",
    verifyToken,
    verifySuperAdmin,
    getRolePermissions
);

router.put(
    "/permissions/:roleId",
    verifyToken,
    verifySuperAdmin,
    updateRolePermissions
);

export default router;