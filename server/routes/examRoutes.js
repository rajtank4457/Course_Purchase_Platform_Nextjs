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
  updateExamAccessRules,
  getExamQuestionsAdmin,
  updateExamQuestion,
  deleteExamQuestion,
  getAllExams, deleteExam,
  getExamById,
  updateExam,
  getPendingEssayAttempts,
  getEssayCheckDetails,
  checkEssayManually,
  updateQuestionSequence,
} from "../controllers/examController.js";

const router = express.Router();

router.get("/available", verifyToken, getAvailableExams);

router.post("/add", verifyToken, addExam);

router.post("/questions/add", verifyToken, addExamQuestion);

router.post(
  "/access-rules/update",
  verifyToken,
  updateExamAccessRules
);

router.post("/publish", verifyToken, publishExam);

router.get("/:examId/start-info", verifyToken, getExamStartInfo);

router.post("/start", verifyToken, startExam);

router.get("/:examId/attempt", verifyToken, getExamAttemptQuestions);

router.post("/submit", verifyToken, submitExam);

router.get(
  "/admin/pending-essays",
  verifyToken,
  getPendingEssayAttempts
);

router.get(
  "/admin/essay-check/:attemptId",
  verifyToken,
  getEssayCheckDetails
);

router.post(
  "/admin/check-essay",
  verifyToken,
  checkEssayManually
);

router.get("/result/:attemptId", verifyToken, getExamResult);

router.get("/:examId/questions", verifyToken, getExamQuestionsAdmin);

router.get("/all", verifyToken, getAllExams);

router.post("/update", verifyToken, updateExam);

router.post("/delete", verifyToken, deleteExam);

router.get("/:examId", verifyToken, getExamById);

router.post("/questions/update", verifyToken, updateExamQuestion);

router.post("/questions/delete", verifyToken, deleteExamQuestion);

router.post("/questions/sequence/update", verifyToken, updateQuestionSequence);

export default router;