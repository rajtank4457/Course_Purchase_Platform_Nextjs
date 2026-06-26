import { asyncHandler } from "../helpers/asyncHandler.js";
import { getDb } from "../helpers/dbHelper.js";
import { sendError } from "../helpers/responseHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";

const isAdminUser = (req) => {
    return (
        req.userType === "admin" ||
        req.userType === "super_admin" ||
        req.userRole === "admin" ||
        req.userRole === "super_admin"
    );
};

export const getCourses = asyncHandler(async (req, res) => {
    const db = await getDb();

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
        [req.userId || 0]
    );

    return sendEncrypted(res, 200, {
        success: true,
        message: "Courses fetched successfully",
        data: rows,
    });
});

export const getCoursesWithChapters = asyncHandler(async (req, res) => {
    const db = await getDb();

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
        chapters: chapters.filter((chapter) => chapter.courseId === course.courseId),
    }));

    return sendEncrypted(res, 200, {
        success: true,
        message: "Courses with chapters fetched successfully",
        data: result,
    });
});

export const getCourseById = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    if (!courseId) {
        return sendError(res, "Course ID is required", 400);
    }

    const db = await getDb();

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
    LIMIT 1
    `,
        [courseId]
    );

    if (rows.length === 0) {
        return sendError(res, "Course not found", 404);
    }

    return sendEncrypted(res, 200, {
        success: true,
        message: "Course fetched successfully",
        data: rows[0],
    });
});

export const addCourse = asyncHandler(async (req, res) => {
    if (!isAdminUser(req)) {
        return sendError(res, "Only admins can add courses", 403);
    }

    const { courseName, courseDesc, courseType, courseSlug, coursePrice } =
        req.body;

    if (!req.userId) {
        return sendError(res, "Admin ID not found in token", 401);
    }

    if (!courseName || !courseDesc || !courseSlug) {
        return sendError(res, "Course name, description and slug are required", 400);
    }

    const db = await getDb();

    const [exists] = await db.query(
        `SELECT courseId FROM course_details WHERE courseSlug = ? LIMIT 1`,
        [courseSlug]
    );

    if (exists.length > 0) {
        return sendError(res, "Course slug already exists", 409);
    }

    const courseImg = req.file ? req.file.filename : null;

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
            req.userId,
            courseName,
            courseDesc,
            Number(courseType) || 0,
            courseSlug,
            Number(courseType) === 1 ? Number(coursePrice || 0) : 0,
            courseImg,
        ]
    );

    return sendEncrypted(res, 201, {
        success: true,
        message: "Course added successfully",
        data: {
            courseId: result.insertId,
            adminId: req.userId,
        },
    });
});

export const updateCourse = asyncHandler(async (req, res) => {
    if (!isAdminUser(req)) {
        return sendError(res, "Only admins can update courses", 403);
    }

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
        return sendError(res, "Course ID is required", 400);
    }

    if (!courseName || !courseDesc || !courseSlug) {
        return sendError(res, "Course name, description and slug are required", 400);
    }

    const db = await getDb();

    const [slugExists] = await db.query(
        `
    SELECT courseId 
    FROM course_details 
    WHERE courseSlug = ? AND courseId != ?
    LIMIT 1
    `,
        [courseSlug, courseId]
    );

    if (slugExists.length > 0) {
        return sendError(res, "Course slug already exists", 409);
    }

    const newImage = req.file ? req.file.filename : oldCourseImg || null;

    const [result] = await db.query(
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

    if (result.affectedRows === 0) {
        return sendError(res, "Course not found", 404);
    }

    return sendEncrypted(res, 200, {
        success: true,
        message: "Course updated successfully",
        data: {
            courseImg: newImage,
        },
    });
});

export const deleteCourse = asyncHandler(async (req, res) => {
    if (!isAdminUser(req)) {
        return sendError(res, "Only admins can delete courses", 403);
    }

    const { courseId } = req.body;

    if (!courseId) {
        return sendError(res, "Course ID is required", 400);
    }

    const db = await getDb();

    const [result] = await db.query(
        `DELETE FROM course_details WHERE courseId = ?`,
        [courseId]
    );

    if (result.affectedRows === 0) {
        return sendError(res, "Course not found", 404);
    }

    return sendEncrypted(res, 200, {
        success: true,
        message: "Course deleted successfully",
        data: {},
    });
});