import express from "express";
import verifyToken from "../middleware/verifyToken.js";

import {
  getMyNotifications,
  markNotificationRead,
  clearAllNotifications,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", verifyToken, getMyNotifications);

router.post(
  "/mark-read",
  verifyToken,
  markNotificationRead
);

router.delete("/clear-all", verifyToken, clearAllNotifications);

export default router;