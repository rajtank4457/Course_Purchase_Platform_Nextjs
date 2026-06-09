import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import verifyToken from "../middleware/verifyToken.js";
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
        } else if (
            [".mp4", ".mov", ".avi", ".mkv"].includes(ext)
        ) {
            uploadPath = "uploads/chapters/videos";
        } else if (
            [".jpg", ".jpeg", ".png", ".webp"].includes(ext)
        ) {
            uploadPath = "uploads/chapters/images";
        }

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + "-" + Math.round(Math.random() * 1e9);

        cb(null, uniqueName + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

router.post(
    "/add",
    verifyToken,
    upload.array("files"),
    addChapter
);

router.post(
    "/add-multiple",
    verifyToken,
    upload.any(),
    addMultipleChapters
);

router.post(
    "/update",
    verifyToken,
    upload.array("files"),
    updateChapter
);

router.post(
    "/delete",
    verifyToken,
    deleteChapter
);

router.get(
    "/course/:courseSlug",
    verifyToken,
    getChaptersByCourseSlug
);

router.get(
    "/:slug",
    verifyToken,
    getChapterBySlug
);

router.post("/update-content", verifyToken, updateChapterContent);

export default router;