import express from "express";
import verifyToken from "../middleware/verifyToken.js";

import {
  getAllProgress,
  getChapterProgress,
  saveChapterProgress,
} from "../controllers/progressController.js";

const router = express.Router();

router.get("/", verifyToken, getAllProgress);

router.get("/chapter/:chId", verifyToken, getChapterProgress);

router.post("/chapter/save", verifyToken, saveChapterProgress);

export default router;