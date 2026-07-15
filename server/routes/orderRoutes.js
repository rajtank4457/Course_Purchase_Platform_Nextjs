import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { checkPermission } from "../middleware/checkPermission.js";

import {
  getOrders,
  getOrderDetails,
  getAllOrders,
  getAdminOrderDetails,
  downloadInvoice,
} from "../controllers/orderController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Admin/Faculty Routes
|--------------------------------------------------------------------------
*/

// All orders
router.get(
  "/all",
  verifyToken,
  checkPermission("order.view"),
  getAllOrders
);

// Particular order
router.get(
  "/admin/:orderId",
  verifyToken,
  checkPermission("order.view"),
  getAdminOrderDetails
);



/*
|--------------------------------------------------------------------------
| Student/User Routes
|--------------------------------------------------------------------------
*/

// Logged-in user's orders
router.get("/", verifyToken, getOrders);

// Logged-in user's order details
router.get("/:orderId", verifyToken, getOrderDetails);

// Logged-in user's invoice
router.get(
  "/:orderId/invoice",
  verifyToken,
  downloadInvoice
);

export default router;