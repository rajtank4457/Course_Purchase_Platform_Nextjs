import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { checkPermission } from "../middleware/checkPermission.js";
import { checkSubscription } from "../middleware/checkSubscription.js";

import {
  getAdmins,
  addAdmin,
  addFaculty,
  updateAdmin,
  deleteAdmin,
} from "../controllers/adminController.js";

const router = express.Router();

// View Admins
router.get(
  "/",
  verifyToken,
  checkPermission("admin.view"),
  getAdmins
);

// Create Admin
router.post(
  "/add",
  verifyToken,
  checkSubscription,
  checkPermission("admin.create"),
  addAdmin
);

router.post(
  "/add-faculty",
  verifyToken,
  checkPermission("admin.create"),
  addFaculty
);

// Update Admin
router.post(
  "/update",
  verifyToken,
  checkSubscription,
  checkPermission("admin.update"),
  updateAdmin
);

// Delete Admin
router.post(
  "/delete",
  verifyToken,
  checkPermission("admin.delete"),
  deleteAdmin
);

export default router;