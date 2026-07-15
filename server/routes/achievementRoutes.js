import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { checkAchievements } from "../controllers/achievementController.js";

const router = express.Router();

router.get("/", verifyToken, checkAchievements);

export default router;