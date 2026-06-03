import express from "express";
import verifyToken from "../middleware/verifyToken.js";

import {
  createOrder,
  verifyCartPayment,
  paymentFailed,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-order", verifyToken, createOrder);

router.post("/verify", verifyToken, verifyCartPayment);

router.post("/failed", verifyToken, paymentFailed);

export default router;