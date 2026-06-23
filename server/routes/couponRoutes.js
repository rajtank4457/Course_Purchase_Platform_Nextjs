import express from "express";
import verifyToken from "../middleware/verifyToken.js";

import {
  getCoupons,
  addCoupon,
  validateCoupon,
  updateCouponUsage,
} from "../controllers/couponController.js";

const router = express.Router();

router.get("/", verifyToken, getCoupons);

router.post("/add", verifyToken, addCoupon);

router.post("/validate", verifyToken, validateCoupon);

router.post("/usage", verifyToken, updateCouponUsage);

export default router;