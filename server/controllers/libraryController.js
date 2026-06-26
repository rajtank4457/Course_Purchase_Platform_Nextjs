import { asyncHandler } from "../helpers/asyncHandler.js";
import { getDb } from "../helpers/dbHelper.js";
import { sendError } from "../helpers/responseHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";
import { requireUser } from "../helpers/authHelper.js";

export const addToLibrary = asyncHandler(async (req, res) => {
  if (!requireUser(req, res)) return;

  const { courseId } = req.body;

  if (!courseId) {
    return sendError(res, "Course ID is required", 400);
  }

  const db = await getDb();

  const [courseRows] = await db.query(
    `
    SELECT courseId, courseType
    FROM course_details
    WHERE courseId = ?
    LIMIT 1
    `,
    [courseId]
  );

  if (courseRows.length === 0) {
    return sendError(res, "Course not found", 404);
  }

  if (Number(courseRows[0].courseType) !== 0) {
    return sendError(res, "Only free courses can be added to library", 400);
  }

  await db.query(
    `
    INSERT INTO user_library (userId, courseId)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE addedAt = addedAt
    `,
    [req.userId, courseId]
  );

  return sendEncrypted(res, 200, {
    success: true,
    message: "Course added to library",
    data: {},
  });
});

export const getLibraryCourses = asyncHandler(async (req, res) => {
  if (!requireUser(req, res)) return;

  const db = await getDb();

  const [courses] = await db.query(
    `
    SELECT 
      cd.courseId,
      cd.courseName,
      cd.courseDesc,
      cd.courseType,
      cd.courseSlug,
      cd.coursePrice,
      cd.courseImg,
      cd.createdAt
    FROM user_library ul
    INNER JOIN course_details cd
      ON cd.courseId = ul.courseId
    WHERE ul.userId = ?
    ORDER BY ul.addedAt DESC
    `,
    [req.userId]
  );

  if (courses.length === 0) {
    return sendEncrypted(res, 200, {
      success: true,
      message: "Library courses fetched successfully",
      data: [],
    });
  }

  const courseIds = courses.map((course) => course.courseId);

  const [chapters] = await db.query(
    `
    SELECT
      chId,
      courseId,
      chapterName,
      chapterDesc,
      videoUrl,
      slug,
      createdAt
    FROM chapter_details
    WHERE courseId IN (?)
    ORDER BY createdAt ASC
    `,
    [courseIds]
  );

  const result = courses.map((course) => {
    const courseChapters = chapters.filter(
      (chapter) => chapter.courseId === course.courseId
    );

    return {
      ...course,
      chapters: courseChapters,
      chapterCount: courseChapters.length,
    };
  });

  return sendEncrypted(res, 200, {
    success: true,
    message: "Library courses fetched successfully",
    data: result,
  });
});