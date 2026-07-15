import express from 'express'

import {
    sessionToken,
    register,
    adminRegister,
    login,
    logout,
    home,
} from "../controllers/authController.js";

import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/session-token", sessionToken);
router.post("/register", register);
router.post("/admin-register", adminRegister);
router.post("/login", login);
router.post("/logout", logout);
router.get("/home",verifyToken, home);

export default router;