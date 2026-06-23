import { asyncHandler } from "../helpers/asyncHandler.js";
import { getDb } from "../helpers/dbHelper.js";
import { sendSuccess, sendError } from "../helpers/responseHelper.js";
import { insertChapterFiles } from "../helpers/fileHelper.js";

const isAdminUser = (req) => {
  return (
    req.userType === "admin" ||
    req.userType === "super_admin" ||
    req.userRole === "admin" ||
    req.userRole === "super_admin"
  );
};

export const addChapter = asyncHandler(async (req, res) => {
  if (!isAdminUser(req)) {
    return sendError(res, "Only admins can add chapters", 403);
  }

  const {
    courseId,
    chapterName,
    chapterDesc,
    videoUrl,
    chapterSlug,
    content,
  } = req.body;

  if (!courseId || !chapterName || !chapterDesc || !chapterSlug) {
    return sendError(
      res,
      "Course, chapter name, description and slug are required",
      400
    );
  }

  const db = await getDb();

  const [courseExists] = await db.query(
    `SELECT courseId FROM course_details WHERE courseId = ?`,
    [courseId]
  );

  if (courseExists.length === 0) {
    return sendError(res, "Course not found", 404);
  }

  const [exists] = await db.query(
    `SELECT chId FROM chapter_details WHERE slug = ?`,
    [chapterSlug]
  );

  if (exists.length > 0) {
    return sendError(res, "Chapter slug already exists", 409);
  }

  const [result] = await db.query(
    `
    INSERT INTO chapter_details
    (courseId, chapterName, chapterDesc, videoUrl, slug, content)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      courseId,
      chapterName,
      chapterDesc,
      videoUrl || null,
      chapterSlug,
      content || "",
    ]
  );

  await insertChapterFiles(db, result.insertId, req.files || []);

  return sendSuccess(
    res,
    {
      chId: result.insertId,
      totalFiles: req.files?.length || 0,
    },
    "Chapter added successfully",
    201
  );
});

export const addMultipleChapters = asyncHandler(async (req, res) => {
  if (!isAdminUser(req)) {
    return sendError(res, "Only admins can add chapters", 403);
  }

  const { courseId, chapters } = req.body;

  if (!courseId || !chapters) {
    return sendError(res, "Course and chapters are required", 400);
  }

  let parsedChapters;

  try {
    parsedChapters = JSON.parse(chapters);
  } catch {
    return sendError(res, "Invalid chapters format", 400);
  }

  if (!Array.isArray(parsedChapters) || parsedChapters.length === 0) {
    return sendError(res, "At least one chapter is required", 400);
  }

  const db = await getDb();

  const [courseExists] = await db.query(
    `SELECT courseId FROM course_details WHERE courseId = ?`,
    [courseId]
  );

  if (courseExists.length === 0) {
    return sendError(res, "Course not found", 404);
  }

  for (let i = 0; i < parsedChapters.length; i++) {
    const chapter = parsedChapters[i];

    if (!chapter.chapterName || !chapter.chapterDesc || !chapter.slug) {
      return sendError(
        res,
        `Chapter ${i + 1}: name, description and slug are required`,
        400
      );
    }

    const [exists] = await db.query(
      `SELECT chId FROM chapter_details WHERE slug = ?`,
      [chapter.slug]
    );

    if (exists.length > 0) {
      return sendError(res, `Chapter slug already exists: ${chapter.slug}`, 409);
    }

    const [result] = await db.query(
      `
      INSERT INTO chapter_details
      (courseId, chapterName, chapterDesc, videoUrl, slug, content)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        courseId,
        chapter.chapterName,
        chapter.chapterDesc,
        chapter.videoUrl || null,
        chapter.slug,
        chapter.content || "",
      ]
    );

    const chapterFiles = (req.files || []).filter(
      (file) => file.fieldname === `chapterFiles_${i}`
    );

    await insertChapterFiles(db, result.insertId, chapterFiles);
  }

  return sendSuccess(res, {}, "All chapters added successfully", 201);
});

export const updateChapter = asyncHandler(async (req, res) => {
  if (!isAdminUser(req)) {
    return sendError(res, "Only admins can manage chapters", 403);
  }

  const {
    slug,
    courseId,
    chapterName,
    chapterDesc,
    videoUrl,
    chapterSlug,
    content,
  } = req.body;

  if (!chapterName || !chapterDesc || !chapterSlug) {
    return sendError(res, "Chapter name, description and slug are required", 400);
  }

  const db = await getDb();
  const files = req.files || [];

  if (!slug || slug === "new") {
    if (!courseId) {
      return sendError(res, "Course ID is required to add chapter", 400);
    }

    const [courseExists] = await db.query(
      `SELECT courseId FROM course_details WHERE courseId = ?`,
      [courseId]
    );

    if (courseExists.length === 0) {
      return sendError(res, "Course not found", 404);
    }

    const [exists] = await db.query(
      `SELECT chId FROM chapter_details WHERE slug = ?`,
      [chapterSlug]
    );

    if (exists.length > 0) {
      return sendError(res, "Chapter slug already exists", 409);
    }

    const [result] = await db.query(
      `
      INSERT INTO chapter_details
      (courseId, chapterName, chapterDesc, videoUrl, slug, content)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        courseId,
        chapterName,
        chapterDesc,
        videoUrl || null,
        chapterSlug,
        content || "",
      ]
    );

    await insertChapterFiles(db, result.insertId, files);

    return sendSuccess(
      res,
      {
        chId: result.insertId,
        addedFiles: files.length,
      },
      "Chapter added successfully",
      201
    );
  }

  const [chapterRows] = await db.query(
    `SELECT chId FROM chapter_details WHERE slug = ?`,
    [slug]
  );

  if (chapterRows.length === 0) {
    return sendError(res, "Chapter not found", 404);
  }

  const chId = chapterRows[0].chId;

  const [slugExists] = await db.query(
    `SELECT chId FROM chapter_details WHERE slug = ? AND chId != ?`,
    [chapterSlug, chId]
  );

  if (slugExists.length > 0) {
    return sendError(res, "Chapter slug already exists", 409);
  }

  await db.query(
    `
    UPDATE chapter_details
    SET chapterName = ?, chapterDesc = ?, videoUrl = ?, slug = ?, content = ?
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

  await insertChapterFiles(db, chId, files);

  return sendSuccess(
    res,
    {
      chId,
      newSlug: chapterSlug,
      addedFiles: files.length,
    },
    "Chapter updated successfully"
  );
});

export const getChaptersByCourseSlug = asyncHandler(async (req, res) => {
  const { courseSlug } = req.params;

  if (!courseSlug) {
    return sendError(res, "Course slug is required", 400);
  }

  const db = await getDb();

  const [courseRows] = await db.query(
    `
    SELECT 
      courseId,
      courseName,
      courseSlug,
      courseType
    FROM course_details
    WHERE courseSlug = ?
    LIMIT 1
    `,
    [courseSlug]
  );

  if (courseRows.length === 0) {
    return sendError(res, "Course not found", 404);
  }

  const course = courseRows[0];

  if (!isAdminUser(req) && Number(course.courseType) === 1) {
    const [library] = await db.query(
      `
      SELECT libraryId
      FROM user_library
      WHERE userId = ? AND courseId = ?
      LIMIT 1
      `,
      [req.userId, course.courseId]
    );

    if (library.length === 0) {
      return sendError(res, "Please purchase this course first", 403);
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

  // Kept same response shape as your working frontend.
  return res.status(200).json({
    success: true,
    message: "Chapters fetched successfully",
    course,
    data: chapters,
  });
});

export const deleteChapter = asyncHandler(async (req, res) => {
  if (!isAdminUser(req)) {
    return sendError(res, "Only admins can delete chapters", 403);
  }

  const { chId } = req.body;

  if (!chId) {
    return sendError(res, "Chapter ID is required", 400);
  }

  const db = await getDb();

  await db.query(`DELETE FROM chapter_sources WHERE chId = ?`, [chId]);

  const [result] = await db.query(
    `DELETE FROM chapter_details WHERE chId = ?`,
    [chId]
  );

  if (result.affectedRows === 0) {
    return sendError(res, "Chapter not found", 404);
  }

  return sendSuccess(res, {}, "Chapter deleted successfully");
});

export const getChapterBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  if (!slug) {
    return sendError(res, "Chapter slug is required", 400);
  }

  const db = await getDb();

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
    LIMIT 1
    `,
    [slug]
  );

  if (rows.length === 0) {
    return sendError(res, "Chapter not found", 404);
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

  return sendSuccess(
    res,
    {
      ...chapter,
      sources,
    },
    "Chapter fetched successfully"
  );
});

export const updateChapterContent = asyncHandler(async (req, res) => {
  if (!isAdminUser(req)) {
    return sendError(res, "Only admins can update chapter content", 403);
  }

  const { slug, content } = req.body;

  if (!slug) {
    return sendError(res, "Chapter slug is required", 400);
  }

  const db = await getDb();

  const [result] = await db.query(
    `UPDATE chapter_details SET content = ? WHERE slug = ?`,
    [content || "", slug]
  );

  if (result.affectedRows === 0) {
    return sendError(res, "Chapter not found", 404);
  }

  return sendSuccess(res, {}, "Content saved successfully");
});