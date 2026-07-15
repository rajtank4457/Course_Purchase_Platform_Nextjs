import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { checkPermission } from "../middleware/checkPermission.js";

import {
  markAttendanceLogin,
  markAttendanceLogout,
  getMyAttendance,
  getMyStudyTime,
  getAdminAttendance,
  updateAttendanceStatus,
  createManualAttendance,
} from "../controllers/attendanceController.js";

const router = express.Router();

// User/Student side
router.post("/login", verifyToken, markAttendanceLogin);
router.post("/logout", verifyToken, markAttendanceLogout);
router.get("/my", verifyToken, getMyAttendance);
router.get("/study-time", verifyToken, getMyStudyTime);

// Admin/Faculty side
router.get(
  "/admin",
  verifyToken,
  checkPermission("attendance.view"),
  getAdminAttendance
);

router.post(
  "/admin/update-status",
  verifyToken,
  checkPermission("attendance.update"),
  updateAttendanceStatus
);

router.post(
  "/admin/manual",
  verifyToken,
  checkPermission("attendance.create"),
  createManualAttendance
);

export default router;