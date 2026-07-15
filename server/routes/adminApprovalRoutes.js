import express from "express";
import {
  getPendingAdminRequests,
  approveAdminRequest,
  rejectAdminRequest,
} from "../controllers/adminApprovalController.js";

import verifyToken from "../middleware/verifyToken.js";
import { checkPermission } from "../middleware/checkPermission.js";

const router = express.Router();

// View pending registration requests
router.get(
  "/pending",
  verifyToken,
  checkPermission("adminApproval.view"),
  getPendingAdminRequests
);

// Approve Admin/Faculty
router.post(
  "/approve/:adminId",
  verifyToken,
  checkPermission("adminApproval.approve"),
  approveAdminRequest
);

// Reject Admin/Faculty
router.post(
  "/reject/:adminId",
  verifyToken,
  checkPermission("adminApproval.reject"),
  rejectAdminRequest
);

export default router;