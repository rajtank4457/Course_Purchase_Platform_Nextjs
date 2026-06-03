import express from "express";
import verifyToken from "../middleware/verifyToken.js";

import {
  validateCoupon,
  updateCouponUsage,
} from "../controllers/couponController.js";

const router = express.Router();

router.post("/validate", verifyToken, validateCoupon);

router.post("/usage", verifyToken, updateCouponUsage);

export default router;