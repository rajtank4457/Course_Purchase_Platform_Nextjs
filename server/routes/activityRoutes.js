import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { checkPermission } from "../middleware/checkPermission.js";
import {
  getStudentsForActivity,
  getSingleUserActivityDashboard,
  trackPageActivity,
} from "../controllers/activityController.js";

const router = express.Router();

router.get(
  "/students",
  verifyToken,
  checkPermission("analytics.view"),
  getStudentsForActivity
);

router.get(
  "/dashboard/:userId",
  verifyToken,
  checkPermission("analytics.view"),
  getSingleUserActivityDashboard
);

router.post(
  "/track-page",
  verifyToken,
  trackPageActivity
);

export default router; 