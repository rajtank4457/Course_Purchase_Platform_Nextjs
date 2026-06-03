import express from "express";
import verifyToken from "../middleware/verifyToken.js";

import {
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController.js";

const router = express.Router();


router.get("/",verifyToken,getStudents);

router.post("/add",
verifyToken,
addStudent);

router.post("/update",
verifyToken,
updateStudent);

router.post("/delete",
verifyToken,
deleteStudent);

export default router;