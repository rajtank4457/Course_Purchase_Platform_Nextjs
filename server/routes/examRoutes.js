import express from "express";
import verifyToken from "../middleware/verifyToken.js";

import {
  addExam,
  addExamQuestion,
  publishExam,
  getAvailableExams,
  getExamStartInfo,
  startExam,
  getExamAttemptQuestions,
  submitExam,
  getExamResult,
} from "../controllers/examController.js";

const router = express.Router();

router.get("/available", verifyToken, getAvailableExams);

router.post("/add", verifyToken, addExam);

router.post("/questions/add", verifyToken, addExamQuestion);

router.post("/publish", verifyToken, publishExam);

router.get("/:examId/start-info", verifyToken, getExamStartInfo);

router.post("/start", verifyToken, startExam);

router.get("/:examId/attempt", verifyToken, getExamAttemptQuestions);

router.post("/submit", verifyToken, submitExam);

router.get("/result/:attemptId", verifyToken, getExamResult);

export default router;