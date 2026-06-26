import express from "express";
import {
  getStudentsForActivity,
  getSingleUserActivityDashboard,
} from "../controllers/activityController.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/students", verifyToken, getStudentsForActivity);
router.get("/dashboard/:userId", verifyToken, getSingleUserActivityDashboard);

export default router;