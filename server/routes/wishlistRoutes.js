import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    getWishlistCount,
} from "../controllers/wishlistController.js";

const router = express.Router();

router.get("/", verifyToken, getWishlist);
router.get("/count", verifyToken, getWishlistCount);
router.post("/add", verifyToken, addToWishlist);
router.post("/remove", verifyToken, removeFromWishlist);

export default router;