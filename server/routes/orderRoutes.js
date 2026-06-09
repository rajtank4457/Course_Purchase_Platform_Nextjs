import express from "express";
import verifyToken from "../middleware/verifyToken.js";

import {
  getOrders,
  getOrderDetails,
  getAllOrders,
  getAdminOrderDetails,
} from "../controllers/orderController.js";

const router = express.Router();

router.get("/", verifyToken, getOrders);

router.get("/all", verifyToken, getAllOrders);

router.get("/admin/:orderId", verifyToken, getAdminOrderDetails);

router.get("/:orderId", verifyToken, getOrderDetails);


export default router;