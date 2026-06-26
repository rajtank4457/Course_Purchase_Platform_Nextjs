import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { downloadCourseCertificate } from "../controllers/certificateController.js";

const router = express.Router();

router.get(
  "/course/:courseId/download",
  verifyToken,
  downloadCourseCertificate
);

export default router;