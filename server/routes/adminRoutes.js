import express from "express";
import verifyToken from "../middleware/verifyToken.js";

import {
  getAdmins,
  addAdmin,
  updateAdmin,
  deleteAdmin,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/", verifyToken, getAdmins);

router.post("/add", verifyToken, addAdmin);

router.post("/update", verifyToken, updateAdmin);

router.post("/delete", verifyToken, deleteAdmin);

export default router;