import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { getStorageInfo } from "../controllers/storageController.js";

const router = express.Router();

router.get("/", verifyToken, getStorageInfo);

export default router;