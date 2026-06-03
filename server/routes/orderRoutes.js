import express from "express";
import verifyToken from "../middleware/verifyToken.js";

import {
  getOrders,
  getOrderDetails,
} from "../controllers/orderController.js";

const router = express.Router();

router.get("/", verifyToken, getOrders);

router.get("/:orderId", verifyToken, getOrderDetails);

export default router;