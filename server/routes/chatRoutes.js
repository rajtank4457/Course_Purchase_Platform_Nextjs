import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import uploadChatFile from "../middleware/uploadChatFile.js";
import {
    getUsers,
    getConversations,
    getMessages,
    createConversation,
    sendMessage,
    markAsRead,
} from "../controllers/chatController.js";

const router = express.Router();

router.use(verifyToken);

router.get("/users", getUsers);

router.get("/conversations", getConversations);

router.get("/messages/:conversationId", getMessages);

router.post("/conversation", createConversation);

router.post(
    "/send",
    uploadChatFile.single("file"),
    sendMessage
);

router.put("/read/:conversationId", markAsRead);

export default router;