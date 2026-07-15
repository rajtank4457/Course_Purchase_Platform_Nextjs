import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { checkPermission } from "../middleware/checkPermission.js";
import { getDashboardStats } from "../controllers/dashboardController.js";

const router = express.Router();

router.get(
    "/stats",
    verifyToken,
    checkPermission("dashboard.view"),
    getDashboardStats
);

export default router;