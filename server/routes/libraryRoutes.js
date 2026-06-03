import express from "express";
import verifyToken from "../middleware/verifyToken.js";

import {
  addToLibrary,
  getMyLibrary,
} from "../controllers/libraryController.js";

const router = express.Router();

router.post("/add", verifyToken, addToLibrary);

router.get("/", verifyToken, getMyLibrary);

export default router;