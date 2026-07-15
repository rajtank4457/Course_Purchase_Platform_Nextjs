import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { checkPermission } from "../middleware/checkPermission.js";

import {
    getRoles,
    addRole,
    updateRole,
    getPermissions,
    assignPermissionsToRole,
    assignRoleToAdmin,
} from "../controllers/roleController.js";

const router = express.Router();

router.get(
    "/",
    verifyToken,
    checkPermission("role.manage"),
    getRoles
);

router.post(
    "/add",
    verifyToken,
    checkPermission("role.manage"),
    addRole
);

router.put(
    "/update/:roleId",
    verifyToken,
    checkPermission("role.manage"),
    updateRole
);

router.get(
    "/permissions",
    verifyToken,
    checkPermission("role.manage"),
    getPermissions
);

router.post(
    "/assign-permissions/:roleId",
    verifyToken,
    checkPermission("role.manage"),
    assignPermissionsToRole
);

router.post(
    "/assign-role/:adminId",
    verifyToken,
    checkPermission("role.manage"),
    assignRoleToAdmin
);

export default router;