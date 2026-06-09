// routes/dashboardRoutes.js
import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { getDashboardStats } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/stats", verifyToken, getDashboardStats);

export default router;