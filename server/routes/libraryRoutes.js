import express from "express";
import verifyToken from "../middleware/verifyToken.js";

import {
  addToLibrary,
  getLibraryCourses,
} from "../controllers/libraryController.js";

const router = express.Router();

router.post("/add", verifyToken, addToLibrary);

router.get("/", verifyToken, getLibraryCourses);

export default router;