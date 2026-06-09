import express from "express";
import verifyToken from "../middleware/verifyToken.js";

import {
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  getStudentDetailsWithCourses,
  getStudentCourseProgress,
  resetStudentCourseProgress,
  resetStudentAllProgress,  
} from "../controllers/studentController.js";

const router = express.Router();


router.get("/", verifyToken, getStudents);

router.post("/add",
  verifyToken,
  addStudent);

router.post("/update",
  verifyToken,
  updateStudent);

router.post("/delete",
  verifyToken,
  deleteStudent);

router.get("/:userId/details", verifyToken, getStudentDetailsWithCourses);

router.get(
  "/:userId/course/:courseId/progress",
  verifyToken,
  getStudentCourseProgress
);

router.post("/reset-course-progress", verifyToken, resetStudentCourseProgress);

router.post("/reset-all-progress", verifyToken, resetStudentAllProgress);

export default router;