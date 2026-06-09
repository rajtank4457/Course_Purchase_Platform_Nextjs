
import { connectToDatabase } from "../lib/db.js";


export const getCourses = async (req, res) => {
    try {
        const db = await connectToDatabase();

        const [rows] = await db.query(
            `
      SELECT 
        cd.courseId,
        cd.courseName,
        cd.courseDesc,
        cd.courseType,
        cd.courseSlug,
        cd.coursePrice,
        cd.courseImg,
        cd.createdAt,

        CASE 
          WHEN ul.libraryId IS NOT NULL THEN 1
          ELSE 0
        END AS hasCourse,

        COUNT(ch.chId) AS chapterCount

      FROM course_details cd

      LEFT JOIN user_library ul
        ON ul.courseId = cd.courseId
        AND ul.userId = ?

      LEFT JOIN chapter_details ch
        ON ch.courseId = cd.courseId

      GROUP BY
        cd.courseId,
        cd.courseName,
        cd.courseDesc,
        cd.courseType,
        cd.courseSlug,
        cd.coursePrice,
        cd.courseImg,
        cd.createdAt,
        ul.libraryId

      ORDER BY cd.createdAt DESC
      `,
            [req.userId]
        );

        return res.status(200).json({
            success: true,
            data: rows,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const getCoursesWithChapters = async (req, res) => {
    try {
        const db = await connectToDatabase();

        const [courses] = await db.query(`
      SELECT
        courseId,
        courseName
      FROM course_details
      ORDER BY courseName ASC
    `);

        const [chapters] = await db.query(`
      SELECT
        chId,
        courseId,
        chapterName
      FROM chapter_details
      ORDER BY chId ASC
    `);

        const result = courses.map((course) => ({
            ...course,
            chapters: chapters.filter(
                (chapter) => chapter.courseId === course.courseId
            ),
        }));

        return res.json({
            success: true,
            data: result,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const getCourseById = async (req, res) => {
    try {
        const { courseId } = req.params;

        const db = await connectToDatabase();

        const [rows] = await db.query(
            `
      SELECT
        courseId,
        courseName,
        courseDesc,
        courseType,
        courseSlug,
        coursePrice,
        courseImg,
        createdAt
      FROM course_details
      WHERE courseId = ?
      `,
            [courseId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: rows[0],
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const addCourse = async (req, res) => {
    try {
        const {
            courseName,
            courseDesc,
            courseType,
            courseSlug,
            coursePrice,
        } = req.body;

        if (req.userType !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can add courses",
            });
        }

        const adminId = req.userId;

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: "Admin ID not found in token",
            });
        }

        if (!courseName || !courseDesc || !courseSlug) {
            return res.status(400).json({
                success: false,
                message: "Course name, description and slug are required",
            });
        }

        const courseImg = req.file ? req.file.filename : null;

        const db = await connectToDatabase();

        const [exists] = await db.query(
            `SELECT courseId FROM course_details WHERE courseSlug = ?`,
            [courseSlug]
        );

        if (exists.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Course slug already exists",
            });
        }

        const [result] = await db.query(
            `
      INSERT INTO course_details
      (
        adminId,
        courseName,
        courseDesc,
        courseType,
        courseSlug,
        coursePrice,
        courseImg
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
            [
                adminId,
                courseName,
                courseDesc,
                Number(courseType) || 0,
                courseSlug,
                Number(courseType) === 1 ? Number(coursePrice || 0) : 0,
                courseImg,
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Course added successfully",
            courseId: result.insertId,
            adminId,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const updateCourse = async (req, res) => {
    try {
        const {
            courseId,
            courseName,
            courseDesc,
            courseType,
            courseSlug,
            coursePrice,
            oldCourseImg,
        } = req.body;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "Course ID is required",
            });
        }

        const newImage = req.file ? req.file.filename : oldCourseImg || null;

        const db = await connectToDatabase();

        await db.query(
            `
      UPDATE course_details
      SET
        courseName = ?,
        courseDesc = ?,
        courseType = ?,
        courseSlug = ?,
        coursePrice = ?,
        courseImg = ?
      WHERE courseId = ?
      `,
            [
                courseName,
                courseDesc,
                Number(courseType),
                courseSlug,
                Number(courseType) === 1 ? Number(coursePrice || 0) : 0,
                newImage,
                courseId,
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Course updated successfully",
            courseImg: newImage,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.body;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "Course ID is required",
            });
        }

        const db = await connectToDatabase();

        const [result] = await db.query(
            `DELETE FROM course_details WHERE courseId = ?`,
            [courseId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

