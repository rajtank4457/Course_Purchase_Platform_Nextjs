import express from "express";
import verifyToken from "../middleware/verifyToken.js";

import {
  addToCart,
  getCart,
  getCartCount,
  removeCartItem,
} from "../controllers/cartController.js";

const router = express.Router();

router.post("/add", verifyToken, addToCart);

router.get("/", verifyToken, getCart);

router.get("/count", verifyToken, getCartCount);

router.delete("/:cartId", verifyToken, removeCartItem);

export default router;