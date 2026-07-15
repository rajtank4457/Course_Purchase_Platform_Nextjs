import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { checkPermission } from "../middleware/checkPermission.js";
import { checkSubscription } from "../middleware/checkSubscription.js";

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
  getAllExams,
  deleteExam,
  getExamById,
  updateExam,
  getPendingEssayAttempts,
  getEssayCheckDetails,
  checkEssayManually,
  updateQuestionSequence,
} from "../controllers/examController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Student/User Exam Routes
|--------------------------------------------------------------------------
*/

router.get("/available", verifyToken, getAvailableExams);

router.get("/:examId/start-info", verifyToken, getExamStartInfo);

router.post("/start", verifyToken, startExam);

router.get("/:examId/attempt", verifyToken, getExamAttemptQuestions);

router.post("/submit", verifyToken, submitExam);

router.get("/result/:attemptId", verifyToken, getExamResult);

/*
|--------------------------------------------------------------------------
| Admin/Faculty Exam Routes
|--------------------------------------------------------------------------
*/

router.get(
  "/admin/pending-essays",
  verifyToken,
  checkPermission("exam.check"),
  getPendingEssayAttempts
);

router.get(
  "/admin/essay-check/:attemptId",
  verifyToken,
  checkPermission("exam.check"),
  getEssayCheckDetails
);

router.post(
  "/admin/check-essay",
  verifyToken,
  checkPermission("exam.check"),
  checkEssayManually
);

router.post(
  "/add",
  verifyToken,
  checkSubscription,
  checkPermission("exam.create"),
  addExam
);

router.post(
  "/questions/add",
  verifyToken,
  checkSubscription,
  checkPermission("exam.create"),
  addExamQuestion
);

router.post(
  "/access-rules/update",
  verifyToken,
  checkSubscription,
  checkPermission("exam.update"),
  updateExamAccessRules
);

router.post(
  "/publish",
  verifyToken,
  checkSubscription,
  checkPermission("exam.update"),
  publishExam
);

router.get(
  "/all",
  verifyToken,
  checkPermission("exam.view"),
  getAllExams
);

router.get(
  "/:examId/questions",
  verifyToken,
  checkPermission("exam.view"),
  getExamQuestionsAdmin
);

router.get(
  "/:examId",
  verifyToken,
  checkPermission("exam.view"),
  getExamById
);

router.post(
  "/update",
  verifyToken,
  checkSubscription,
  checkPermission("exam.update"),
  updateExam
);

router.post(
  "/delete",
  verifyToken,
  checkPermission("exam.delete"),
  deleteExam
);

router.post(
  "/questions/update",
  verifyToken,
  checkSubscription,
  checkPermission("exam.update"),
  updateExamQuestion
);

router.post(
  "/questions/delete",
  verifyToken,
  checkPermission("exam.delete"),
  deleteExamQuestion
);

router.post(
  "/questions/sequence/update",
  verifyToken,
  checkSubscription,
  checkPermission("exam.update"),
  updateQuestionSequence
);

export default router;