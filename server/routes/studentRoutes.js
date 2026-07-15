import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { checkPermission } from "../middleware/checkPermission.js";
import { checkSubscription } from "../middleware/checkSubscription.js";

import {
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  getStudentDetailsWithCourses,
  getStudentCourseProgress,
  resetStudentCourseProgress,
  resetStudentAllProgress,
  resetChapterProgress,
  removeStudentCourse,
} from "../controllers/studentController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| View Student
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  verifyToken,
  checkPermission("student.view"),
  getStudents
);

router.get(
  "/:userId/details",
  verifyToken,
  checkPermission("student.view"),
  getStudentDetailsWithCourses
);

router.get(
  "/:userId/course/:courseId/progress",
  verifyToken,
  checkPermission("student.view"),
  getStudentCourseProgress
);

/*
|--------------------------------------------------------------------------
| Create Student
|--------------------------------------------------------------------------
*/

router.post(
  "/add",
  verifyToken,
  checkSubscription,
  checkPermission("student.create"),
  addStudent
);

/*
|--------------------------------------------------------------------------
| Update Student
|--------------------------------------------------------------------------
*/

router.post(
  "/update",
  verifyToken,
  checkSubscription,
  checkPermission("student.update"),
  updateStudent
);

router.post(
  "/reset-course-progress",
  verifyToken,
  checkSubscription,
  checkPermission("student.update"),
  resetStudentCourseProgress
);

router.post(
  "/reset-chapter-progress",
  verifyToken,
  checkSubscription,
  checkPermission("student.update"),
  resetChapterProgress
);

router.post(
  "/reset-all-progress",
  verifyToken,
  checkSubscription,
  checkPermission("student.update"),
  resetStudentAllProgress
);

router.post(
  "/remove-course",
  verifyToken,
  checkSubscription,
  checkPermission("student.update"),
  removeStudentCourse
);

/*
|--------------------------------------------------------------------------
| Delete Student
|--------------------------------------------------------------------------
*/

router.post(
  "/delete",  
  verifyToken,
  checkPermission("student.delete"),
  deleteStudent
);

export default router;