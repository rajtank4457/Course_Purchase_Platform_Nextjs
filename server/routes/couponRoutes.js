import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { checkPermission } from "../middleware/checkPermission.js";
import { checkSubscription } from "../middleware/checkSubscription.js";

import {
  getCoupons,
  addCoupon,
  validateCoupon,
  updateCouponUsage,
} from "../controllers/couponController.js";

const router = express.Router();

// Admin/Faculty
router.get(
  "/",
  verifyToken,
  checkPermission("coupon.view"),
  getCoupons
);

router.post(
  "/add",
  verifyToken,
  checkSubscription,
  checkPermission("coupon.create"),
  addCoupon
);

// User side
router.post("/validate", verifyToken, validateCoupon);
router.post("/usage", verifyToken, updateCouponUsage);

export default router;