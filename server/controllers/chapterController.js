import path from "path";
import connectToDatabase from "../lib/db.js";

export const addChapter = async (req, res) => {
    try {
        const {
            courseId,
            chapterName,
            chapterDesc,
            videoUrl,
            chapterSlug,
        } = req.body;

        if (req.userType !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can add chapters",
            });
        }

        if (!courseId || !chapterName || !chapterDesc || !chapterSlug) {
            return res.status(400).json({
                success: false,
                message: "Course, chapter name, description and slug are required",
            });
        }

        const db = await connectToDatabase();

        const [courseExists] = await db.query(
            `SELECT courseId FROM course_details WHERE courseId = ?`,
            [courseId]
        );

        if (courseExists.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        const [exists] = await db.query(
            `SELECT chId FROM chapter_details WHERE slug = ?`,
            [chapterSlug]
        );

        if (exists.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Chapter slug already exists",
            });
        }

        const [result] = await db.query(
            `
      INSERT INTO chapter_details
      (
        courseId,
        chapterName,
        chapterDesc,
        videoUrl,
        slug
      )
      VALUES (?, ?, ?, ?, ?)
      `,
            [
                courseId,
                chapterName,
                chapterDesc,
                videoUrl || null,
                chapterSlug,
            ]
        );

        const chId = result.insertId;
        const files = req.files || [];

        if (files.length > 0) {
            const fileValues = files.map((file) => {
                const extension = path.extname(file.originalname).replace(".", "");

                return [
                    chId,
                    file.originalname,
                    file.mimetype,
                    file.path.replace(/\\/g, "/"),
                    extension,
                    1,
                ];
            });

            await db.query(
                `
        INSERT INTO chapter_sources
        (
          chId,
          fileName,
          fileType,
          filePath,
          extension,
          canPreview
        )
        VALUES ?
        `,
                [fileValues]
            );
        }

        return res.status(201).json({
            success: true,
            message: "Chapter added successfully",
            chId,
            totalFiles: files.length,
        });
    } catch (err) {
        console.log("ADD CHAPTER ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const addMultipleChapters = async (req, res) => {
    try {
        if (req.userType !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admin can add chapters",
            });
        }

        const { courseId, chapters } = req.body;

        if (!courseId || !chapters) {
            return res.status(400).json({
                success: false,
                message: "Course and chapters are required",
            });
        }

        const parsedChapters = JSON.parse(chapters);

        const db = await connectToDatabase();

        for (let i = 0; i < parsedChapters.length; i++) {
            const chapter = parsedChapters[i];

            const [result] = await db.query(
                `
            INSERT INTO chapter_details
                (
                courseId,
                chapterName,
                chapterDesc,
                videoUrl,
                slug,
                content
                )
                VALUES (?, ?, ?, ?, ?, ?)
            `,
                [
                    courseId,
                    chapter.chapterName,
                    chapter.chapterDesc,
                    chapter.videoUrl,
                    chapter.slug,
                    chapter.content || "",
                ]
            );

            const chapterId = result.insertId;

            const files = req.files.filter(
                (file) => file.fieldname === `chapterFiles_${i}`
            );

            for (const file of files) {
                const extension = file.originalname.split(".").pop();

                await db.query(
                    `
            INSERT INTO chapter_sources
                (
                chId,
                fileName,
                fileType,
                filePath,
                extension,
                canPreview
                )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
                    [
                        chapterId,
                        file.originalname,
                        file.mimetype,
                        file.filename,
                        extension,
                        1,
                    ]
                );
            }
        }

        return res.status(201).json({
            success: true,
            message: "All chapters added successfully",
        });
    } catch (err) {
        console.error("ADD MULTIPLE CHAPTER ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Failed to add chapters",
            error: err.message,
        });
    }
};

export const updateChapter = async (req, res) => {
    try {
        const {
            slug,
            chapterName,
            chapterDesc,
            videoUrl,
            chapterSlug,
            content,
        } = req.body;

        if (req.userType !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can update chapters",
            });
        }

        if (!slug || !chapterName || !chapterDesc || !chapterSlug) {
            return res.status(400).json({
                success: false,
                message: "Chapter name, description and slug are required",
            });
        }

        const db = await connectToDatabase();

        const [chapterRows] = await db.query(
            `SELECT chId FROM chapter_details WHERE slug = ?`,
            [slug]
        );

        if (chapterRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Chapter not found",
            });
        }

        const chId = chapterRows[0].chId;

        const [slugExists] = await db.query(
            `
      SELECT chId 
      FROM chapter_details 
      WHERE slug = ? AND chId != ?
      `,
            [chapterSlug, chId]
        );

        if (slugExists.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Chapter slug already exists",
            });
        }

        await db.query(
            `
      UPDATE chapter_details
      SET
        chapterName = ?,
        chapterDesc = ?,
        videoUrl = ?,
        slug = ?,
        content = ?
      WHERE chId = ?
      `,
            [
                chapterName,
                chapterDesc,
                videoUrl || null,
                chapterSlug,
                content || "",
                chId,
            ]
        );

        const files = req.files || [];

        if (files.length > 0) {
            const fileValues = files.map((file) => {
                const extension = path.extname(file.originalname).replace(".", "");

                return [
                    chId,
                    file.originalname,
                    file.mimetype,
                    file.path.replace(/\\/g, "/"),
                    extension,
                    1,
                ];
            });

            await db.query(
                `
        INSERT INTO chapter_sources
        (
          chId,
          fileName,
          fileType,
          filePath,
          extension,
          canPreview
        )
        VALUES ?
        `,
                [fileValues]
            );
        }

        return res.status(200).json({
            success: true,
            message: "Chapter updated successfully",
            chId,
            newSlug: chapterSlug,
            addedFiles: files.length,
        });
    } catch (err) {
        console.log("UPDATE CHAPTER ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const getChaptersByCourseSlug = async (req, res) => {
    try {
        const { courseSlug } = req.params;

        const db = await connectToDatabase();

        const [courseRows] = await db.query(
            `
      SELECT 
        courseId, 
        courseName, 
        courseSlug,
        courseType
      FROM course_details 
      WHERE courseSlug = ?
      `,
            [courseSlug]
        );

        if (courseRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        const course = courseRows[0];

        const isAdmin = req.userType === "admin";

        if (!isAdmin && Number(course.courseType) === 1) {
            const [library] = await db.query(
                `
        SELECT libraryId
        FROM user_library
        WHERE userId = ? AND courseId = ?
        `,
                [req.userId, course.courseId]
            );

            if (library.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "Please purchase this course first",
                });
            }
        }

        const [chapters] = await db.query(
            `
      SELECT 
        chId,
        courseId,
        chapterName,
        chapterDesc,
        videoUrl,
        slug,
        content,
        createdAt
      FROM chapter_details
      WHERE courseId = ?
      ORDER BY chId ASC
      `,
            [course.courseId]
        );

        return res.status(200).json({
            success: true,
            course,
            data: chapters,
        });
    } catch (err) {
        console.error("GET CHAPTERS BY COURSE SLUG ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const deleteChapter = async (req, res) => {
    try {
        const { chId } = req.body;

        if (req.userType !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can delete chapters",
            });
        }

        if (!chId) {
            return res.status(400).json({
                success: false,
                message: "Chapter ID is required",
            });
        }

        const db = await connectToDatabase();

        const [exists] = await db.query(
            `SELECT chId FROM chapter_details WHERE chId = ?`,
            [chId]
        );

        if (exists.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Chapter not found",
            });
        }

        await db.query(`DELETE FROM chapter_sources WHERE chId = ?`, [chId]);
        await db.query(`DELETE FROM chapter_details WHERE chId = ?`, [chId]);

        return res.status(200).json({
            success: true,
            message: "Chapter deleted successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const getChapterBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const db = await connectToDatabase();

        const [rows] = await db.query(
            `
      SELECT
        chId,
        courseId,
        chapterName,
        chapterDesc,
        content,
        videoUrl,
        slug,
        createdAt
      FROM chapter_details
      WHERE slug = ?
      `,
            [slug]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Chapter not found",
            });
        }

        const chapter = rows[0];

        const [sources] = await db.query(
            `
      SELECT
        csId,
        chId,
        fileName,
        fileType,
        filePath,
        extension,
        canPreview,
        createdAt
      FROM chapter_sources
      WHERE chId = ?
      ORDER BY csId DESC
      `,
            [chapter.chId]
        );

        return res.json({
            success: true,
            data: {
                ...chapter,
                sources,
            },
        });
    } catch (err) {
        console.error("GET CHAPTER BY SLUG ERROR:", err);

        return res.status(500).json({
            success: false,
            error: err.message,
        });
    }
};

export const updateChapterContent = async (req, res) => {
    try {
        const { slug, content } = req.body;

        if (req.userType !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can update chapter content",
            });
        }

        if (!slug) {
            return res.status(400).json({
                success: false,
                message: "Chapter slug is required",
            });
        }

        const db = await connectToDatabase();

        await db.query(
            `UPDATE chapter_details SET content = ? WHERE slug = ?`,
            [content || "", slug]
        );

        return res.status(200).json({
            success: true,
            message: "Content saved successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};