import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { checkPermission } from "../middleware/checkPermission.js";
import { checkSubscription } from "../middleware/checkSubscription.js";
import multer from "multer";
import path from "path";

import {
  getCourses,
  getCourseById,
  addCourse,
  updateCourse,
  deleteCourse,
  getCoursesWithChapters,
} from "../controllers/courseController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

/*
|--------------------------------------------------------------------------
| Course View Routes (Student + Admin)
|--------------------------------------------------------------------------
*/

router.get("/", verifyToken, getCourses);

router.get(
  "/with-chapters",
  verifyToken,
  getCoursesWithChapters
);

router.get(
  "/:courseId",
  verifyToken,
  getCourseById
);

/*Admin / Faculty Routes*/

router.post(
  "/add",
  verifyToken,
  checkSubscription,
  checkPermission("course.create"),
  upload.single("courseImg"),
  addCourse
);

router.post(
  "/update",
  verifyToken,
  checkSubscription,
  checkPermission("course.update"),
  upload.single("courseImg"),
  updateCourse
);

router.post(
  "/delete",
  verifyToken,
  checkPermission("course.delete"),
  deleteCourse
);

export default router;