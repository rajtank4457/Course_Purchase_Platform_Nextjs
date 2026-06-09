import express from "express";
import verifyToken from "../middleware/verifyToken.js";

import {
  addExam,
  addExamQuestion,
  publishExam,
} from "../controllers/examController.js";

const router = express.Router();

router.post("/add", verifyToken, addExam);

router.post("/questions/add", verifyToken, addExamQuestion);

router.post("/publish", verifyToken, publishExam);

export default router;