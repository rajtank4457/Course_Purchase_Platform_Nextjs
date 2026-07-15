import { asyncHandler } from "../helpers/asyncHandler.js";
import {
    runQuery,
    findOne,
    insertRow,
    updateRow,
    deleteRow,
} from "../helpers/dbHelper.js";
import { sendError } from "../helpers/responseHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";

const isAdminUser = (req) =>
    ["admin", "super_admin"].includes(req.userType) ||
    ["admin", "super_admin"].includes(req.userRole);

const coursePriceValue = (courseType, coursePrice) =>
    Number(courseType) === 1 ? Number(coursePrice || 0) : 0;

const requireOrganization = (req, res) => {
    if (req.userRole === "super_admin") return true;

    if (!req.organizationId) {
        sendError(res, "Organization not found", 400);
        return false;
    }

    return true;
};

export const getCourses = asyncHandler(async (req, res) => {
    if (!requireOrganization(req, res)) return;

    const rows = await runQuery(
        `
    SELECT 
      cd.courseId,
      cd.organizationId,
      cd.courseName,
      cd.courseDesc,
      cd.courseType,
      cd.courseSlug,
      cd.coursePrice,
      cd.courseImg,
      cd.createdAt,
      CASE WHEN ul.libraryId IS NOT NULL THEN 1 ELSE 0 END AS hasCourse,
      CASE WHEN w.wishlistId IS NOT NULL THEN 1 ELSE 0 END AS hasWishlist,
      COUNT(ch.chId) AS chapterCount
    FROM course_details cd
    LEFT JOIN user_library ul
      ON ul.courseId = cd.courseId
     AND ul.userId = ?
     AND ul.organizationId = cd.organizationId
    LEFT JOIN wishlist w
      ON w.courseId = cd.courseId
     AND w.userId = ?
     AND w.organizationId = cd.organizationId
    LEFT JOIN chapter_details ch
      ON ch.courseId = cd.courseId
     AND ch.organizationId = cd.organizationId
    WHERE cd.organizationId = ?
    GROUP BY
      cd.courseId,
      cd.organizationId,
      cd.courseName,
      cd.courseDesc,
      cd.courseType,
      cd.courseSlug,
      cd.coursePrice,
      cd.courseImg,
      cd.createdAt,
      ul.libraryId,
      w.wishlistId
    ORDER BY cd.createdAt DESC
    `,
        [req.userId || 0, req.userId || 0, req.organizationId]
    );

    return sendEncrypted(res, 200, {
        success: true,
        message: "Courses fetched successfully",
        data: rows,
    });
});

export const getCoursesWithChapters = asyncHandler(async (req, res) => {
    if (!requireOrganization(req, res)) return;

    const courses = await runQuery(
        `
    SELECT courseId, organizationId, courseName
    FROM course_details
    WHERE organizationId = ?
    ORDER BY courseName ASC
    `,
        [req.organizationId]
    );

    const chapters = await runQuery(
        `
    SELECT chId, courseId, organizationId, chapterName
    FROM chapter_details
    WHERE organizationId = ?
    ORDER BY chId ASC
    `,
        [req.organizationId]
    );

    return sendEncrypted(res, 200, {
        success: true,
        message: "Courses with chapters fetched successfully",
        data: courses.map((course) => ({
            ...course,
            chapters: chapters.filter(
                (chapter) => chapter.courseId === course.courseId
            ),
        })),
    });
});

export const getCourseById = asyncHandler(async (req, res) => {
    if (!requireOrganization(req, res)) return;

    const { courseId } = req.params;

    if (!courseId) {
        return sendError(res, "Course ID is required", 400);
    }

    const course = await findOne(
        `
    SELECT 
      courseId,
      organizationId,
      courseName,
      courseDesc,
      courseType,
      courseSlug,
      coursePrice,
      courseImg,
      createdAt
    FROM course_details
    WHERE courseId = ?
      AND organizationId = ?
    LIMIT 1
    `,
        [courseId, req.organizationId]
    );

    if (!course) {
        return sendError(res, "Course not found", 404);
    }

    return sendEncrypted(res, 200, {
        success: true,
        message: "Course fetched successfully",
        data: course,
    });
});

export const addCourse = asyncHandler(async (req, res) => {
    if (!isAdminUser(req)) {
        return sendError(res, "Only admins can add courses", 403);
    }

    if (!requireOrganization(req, res)) return;

    const { courseName, courseDesc, courseType, courseSlug, coursePrice } =
        req.body;

    if (!req.userId) {
        return sendError(res, "Admin ID not found in token", 401);
    }

    if (!courseName || !courseDesc || !courseSlug) {
        return sendError(res, "Course name, description and slug are required", 400);
    }

    const exists = await findOne(
        `
    SELECT courseId
    FROM course_details
    WHERE courseSlug = ?
      AND organizationId = ?
    LIMIT 1
    `,
        [courseSlug, req.organizationId]
    );

    if (exists) {
        return sendError(res, "Course slug already exists", 409);
    }

    const result = await insertRow("course_details", {
        organizationId: req.organizationId,
        adminId: req.userId,
        courseName,
        courseDesc,
        courseType: Number(courseType) || 0,
        courseSlug,
        coursePrice: coursePriceValue(courseType, coursePrice),
        courseImg: req.file ? req.file.filename : null,
        thumbnailSize: req.file ? req.file.size : 0,
    });

    return sendEncrypted(res, 201, {
        success: true,
        message: "Course added successfully",
        data: {
            courseId: result.insertId,
            adminId: req.userId,
            organizationId: req.organizationId,
        },
    });
});

export const updateCourse = asyncHandler(async (req, res) => {
    if (!isAdminUser(req)) {
        return sendError(res, "Only admins can update courses", 403);
    }

    if (!requireOrganization(req, res)) return;

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

    const slugExists = await findOne(
        `
    SELECT courseId
    FROM course_details
    WHERE courseSlug = ?
      AND organizationId = ?
      AND courseId != ?
    LIMIT 1
    `,
        [courseSlug, req.organizationId, courseId]
    );

    if (slugExists) {
        return sendError(res, "Course slug already exists", 409);
    }

    const newImage = req.file ? req.file.filename : oldCourseImg || null;

    const newThumbnailSize = req.file
        ? req.file.size
        : undefined;

    const updateData = {
        courseName,
        courseDesc,
        courseType: Number(courseType),
        courseSlug,
        coursePrice: coursePriceValue(courseType, coursePrice),
        courseImg: newImage,
    };

    if (req.file) {
        updateData.thumbnailSize = req.file.size;
    }

    const result = await updateRow(
        "course_details",
        updateData,
        "courseId = ? AND organizationId = ?",
        [courseId, req.organizationId]
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

    if (!requireOrganization(req, res)) return;

    const { courseId } = req.body;

    if (!courseId) {
        return sendError(res, "Course ID is required", 400);
    }

    await deleteRow(
        "chapter_sources",
        `
    organizationId = ?
    AND chId IN (
      SELECT chId
      FROM chapter_details
      WHERE courseId = ?
        AND organizationId = ?
    )
    `,
        [req.organizationId, courseId, req.organizationId]
    );

    await deleteRow(
        "chapter_details",
        "courseId = ? AND organizationId = ?",
        [courseId, req.organizationId]
    );

    const result = await deleteRow(
        "course_details",
        "courseId = ? AND organizationId = ?",
        [courseId, req.organizationId]
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