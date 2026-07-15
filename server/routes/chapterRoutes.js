import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import verifyToken from "../middleware/verifyToken.js";
import { checkPermission } from "../middleware/checkPermission.js";
import { checkSubscription } from "../middleware/checkSubscription.js";

import {
    addChapter,
    addMultipleChapters,
    getChaptersByCourseSlug,
    updateChapter,
    deleteChapter,
    getChapterBySlug,
    updateChapterContent,
} from "../controllers/chapterController.js";

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();

        let uploadPath = "uploads/chapters/others";

        if (
            [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"].includes(ext)
        ) {
            uploadPath = "uploads/chapters/docs";
        } else if ([".mp4", ".mov", ".avi", ".mkv"].includes(ext)) {
            uploadPath = "uploads/chapters/videos";
        } else if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
            uploadPath = "uploads/chapters/images";
        }

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// Admin/Faculty - Create chapter
router.post(
    "/add",
    verifyToken,
    checkSubscription,
    checkPermission("chapter.create"),
    upload.array("files"),
    addChapter
);

// Admin/Faculty - Create multiple chapters
router.post(
    "/add-multiple",
    verifyToken,
    checkSubscription,
    checkPermission("chapter.create"),
    upload.any(),
    addMultipleChapters
);

// Admin/Faculty - Update chapter
router.post(
    "/update",
    verifyToken,
    checkSubscription,
    checkPermission("chapter.update"),
    upload.array("files"),
    updateChapter
);

// Admin/Faculty - Delete chapter
router.post(
    "/delete",
    verifyToken,
    checkPermission("chapter.delete"),
    deleteChapter
);

// User + Admin - View chapters of course
router.get(
    "/course/:courseSlug",
    verifyToken,
    getChaptersByCourseSlug
);

// Admin/Faculty - Update only chapter content
router.post(
    "/update-content",
    verifyToken,
    checkSubscription,
    checkPermission("chapter.update"),
    updateChapterContent
);

// User + Admin - View single chapter
router.get(
    "/:slug",
    verifyToken,
    getChapterBySlug
);

export default router;