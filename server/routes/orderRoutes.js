import express from "express";
import verifyToken from "../middleware/verifyToken.js";

import {
  getOrders,
  getOrderDetails,
  getAllOrders,
  getAdminOrderDetails,
  downloadInvoice,
} from "../controllers/orderController.js";

const router = express.Router();

router.get("/", verifyToken, getOrders);

router.get("/all", verifyToken, getAllOrders);

router.get("/admin/:orderId", verifyToken, getAdminOrderDetails);

router.get("/:orderId", verifyToken, getOrderDetails);

router.get("/:orderId/invoice", verifyToken, downloadInvoice);


export default router;