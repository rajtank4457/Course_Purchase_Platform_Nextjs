import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { checkPermission } from "../middleware/checkPermission.js";
import { checkSubscription } from "../middleware/checkSubscription.js";

import {
  getFaculty,
  addFaculty,
  updateFaculty,
  deleteFaculty,
} from "../controllers/facultyController.js";

const router = express.Router();

router.get(
  "/",
  verifyToken,
  checkPermission("faculty.view"),
  getFaculty
);

router.post(
  "/add",
  verifyToken,
  checkPermission("faculty.create"),
  checkSubscription,
  addFaculty
);

router.post(
  "/update",
  verifyToken,
  checkPermission("faculty.update"),
  checkSubscription,
  updateFaculty
);

router.post(
  "/delete",
  verifyToken,
  checkPermission("faculty.delete"),
  deleteFaculty
);

export default router;