import express from "express";
import verifyToken from "../middleware/verifyToken.js";

// import {
//   getCourses,
//   getCourseById,
//   addCourse,
//   updateCourse,
//   deleteCourse,
// } from "../controllers/courseController.js";
import {
  getCourses
} from "../controllers/courseController.js";

const router = express.Router();

router.get("/", verifyToken, getCourses);

// router.get("/:courseId", verifyToken, getCourseById);

// router.post("/add", verifyToken, addCourse);

// router.post("/update", verifyToken, updateCourse);

// router.post("/delete", verifyToken, deleteCourse);

export default router;