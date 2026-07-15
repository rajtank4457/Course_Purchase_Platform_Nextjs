import { asyncHandler } from "../helpers/asyncHandler.js";
import { getDb, findOne, runQuery, insertRow, updateRow, deleteRow } from "../helpers/dbHelper.js";
import { sendError } from "../helpers/responseHelper.js";
import { insertChapterFiles } from "../helpers/fileHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";

const isAdminUser = (req) =>
  ["admin", "super_admin"].includes(req.userType) ||
  ["admin", "super_admin"].includes(req.userRole);

const chapterData = ({
  courseId,
  organizationId,
  chapterName,
  chapterDesc,
  videoUrl,
  chapterSlug,
  content,
}) => ({
  courseId,
  organizationId,
  chapterName,
  chapterDesc,
  videoUrl: videoUrl || null,
  slug: chapterSlug,
  content: content || "",
});

const validateChapter = ({ courseId, chapterName, chapterDesc, chapterSlug }, isNew = true) => {
  if (isNew && !courseId) return "Course ID is required";
  if (!chapterName || !chapterDesc || !chapterSlug) {
    return "Chapter name, description and slug are required";
  }
  return null;
};

const addChapterRow = async (db, body, files = [], organizationId) => {
  const result = await insertRow("chapter_details", {
    ...chapterData({
      ...body,
      organizationId,
    }),
  });

  await insertChapterFiles(db, result.insertId, files, organizationId);

  return result.insertId;
};

export const addChapter = asyncHandler(async (req, res) => {
  if (!isAdminUser(req)) return sendError(res, "Only admins can add chapters", 403);

  const error = validateChapter(req.body);
  if (error) return sendError(res, error, 400);

  const db = await getDb();

  const course = await findOne(`SELECT courseId 
    FROM course_details 
    WHERE courseId = ?
    AND organizationId = ? `, [req.body.courseId, req.organizationId]);
  if (!course) return sendError(res, "Course not found", 404);

  const exists = await findOne(`SELECT chId FROM chapter_details WHERE slug = ? AND organizationId = ?`, [req.body.chapterSlug, req.organizationId]);
  if (exists) return sendError(res, "Chapter slug already exists", 409);

  const chId = await addChapterRow(db, req.body, req.files || [], req.organizationId);

  return sendEncrypted(res, 201, {
    success: true,
    message: "Chapter added successfully",
    data: { chId, totalFiles: req.files?.length || 0 },
  });
});

export const addMultipleChapters = asyncHandler(async (req, res) => {
  if (!isAdminUser(req)) return sendError(res, "Only admins can add chapters", 403);

  const { courseId, chapters } = req.body;
  if (!courseId || !chapters) return sendError(res, "Course and chapters are required", 400);

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

  const course = await findOne(`SELECT courseId FROM course_details WHERE courseId = ? AND organizationId = ?`, [courseId, req.organizationId]);
  if (!course) return sendError(res, "Course not found", 404);

  for (let i = 0; i < parsedChapters.length; i++) {
    const chapter = parsedChapters[i];

    const error = validateChapter(
      { courseId, chapterName: chapter.chapterName, chapterDesc: chapter.chapterDesc, chapterSlug: chapter.slug },
      true
    );

    if (error) return sendError(res, `Chapter ${i + 1}: name, description and slug are required`, 400);

    const exists = await findOne(`SELECT chId FROM chapter_details WHERE slug = ? AND organizationId = ?`, [chapter.slug, req.organizationId]);
    if (exists) return sendError(res, `Chapter slug already exists: ${chapter.slug}`, 409);

    const chapterFiles = (req.files || []).filter((file) => file.fieldname === `chapterFiles_${i}`);

    await addChapterRow(
      db,
      {
        courseId,
        chapterName: chapter.chapterName,
        chapterDesc: chapter.chapterDesc,
        videoUrl: chapter.videoUrl,
        chapterSlug: chapter.slug,
        content: chapter.content,
      },
      chapterFiles,
      req.organizationId
    );
  }

  return sendEncrypted(res, 201, {
    success: true,
    message: "All chapters added successfully",
    data: {},
  });
});

export const updateChapter = asyncHandler(async (req, res) => {
  if (!isAdminUser(req)) return sendError(res, "Only admins can manage chapters", 403);

  const { slug, chapterSlug } = req.body;
  const files = req.files || [];
  const db = await getDb();

  const error = validateChapter(req.body, !slug || slug === "new");
  if (error) return sendError(res, error, 400);

  if (!slug || slug === "new") {
    const course = await findOne(`SELECT courseId 
      FROM course_details 
      WHERE courseId = ? 
      AND organizationId = ? `, [req.body.courseId, req.organizationId]);
    if (!course) return sendError(res, "Course not found", 404);

    const exists = await findOne(`SELECT chId FROM chapter_details WHERE slug = ? AND organizationId = ?`, [chapterSlug, req.organizationId]);
    if (exists) return sendError(res, "Chapter slug already exists", 409);

    const chId = await addChapterRow(db, req.body, files, req.organizationId);

    return sendEncrypted(res, 201, {
      success: true,
      message: "Chapter added successfully",
      data: { chId, addedFiles: files.length },
    });
  }

  const chapter = await findOne(`SELECT chId FROM chapter_details WHERE slug = ? AND organizationId = ?`, [slug, req.organizationId]);
  if (!chapter) return sendError(res, "Chapter not found", 404);

  const slugExists = await findOne(
    `SELECT chId FROM chapter_details WHERE slug = ? AND chId != ? AND organizationId = ?`,
    [chapterSlug, chapter.chId, req.organizationId]
  );
  if (slugExists) return sendError(res, "Chapter slug already exists", 409);

  await updateRow(
    "chapter_details",
    {
      chapterName: req.body.chapterName,
      chapterDesc: req.body.chapterDesc,
      videoUrl: req.body.videoUrl || null,
      slug: chapterSlug,
      content: req.body.content || "",
    },
    "chId = ?",
    [chapter.chId]
  );

  await insertChapterFiles(
    db,
    chapter.chId,
    files,
    req.organizationId
  );

  return sendEncrypted(res, 200, {
    success: true,
    message: "Chapter updated successfully",
    data: { chId: chapter.chId, newSlug: chapterSlug, addedFiles: files.length },
  });
});

export const getChaptersByCourseSlug = asyncHandler(async (req, res) => {
  const { courseSlug } = req.params;
  if (!courseSlug) return sendError(res, "Course slug is required", 400);

  const course = await findOne(
    `SELECT courseId, courseName, courseSlug, courseType FROM course_details WHERE courseSlug = ? AND organizationId = ? LIMIT 1`,
    [courseSlug, req.organizationId]
  );

  if (!course) return sendError(res, "Course not found", 404);

  if (!isAdminUser(req) && Number(course.courseType) === 1) {
    const library = await findOne(
      `SELECT libraryId FROM user_library WHERE userId = ? AND courseId = ? AND organizationId = ? LIMIT 1`,
      [req.userId, course.courseId, req.organizationId]
    );

    if (!library) return sendError(res, "Please purchase this course first", 403);
  }

  const chapters = await runQuery(
    `
    SELECT chId, courseId, chapterName, chapterDesc, videoUrl, slug, content, createdAt
    FROM chapter_details
    WHERE courseId = ? AND organizationId = ?
  ORDER BY chId ASC
  `,
    [course.courseId, req.organizationId]
  );

  return res.status(200).json({
    success: true,
    message: "Chapters fetched successfully",
    course,
    data: chapters,
  });
});

export const deleteChapter = asyncHandler(async (req, res) => {
  if (!isAdminUser(req)) return sendError(res, "Only admins can delete chapters", 403);
  if (!req.body.chId) return sendError(res, "Chapter ID is required", 400);

  await deleteRow("chapter_sources", "chId = ? AND organizationId = ?", [req.body.chId, req.organizationId]);

  const result = await deleteRow("chapter_details", "chId = ? AND organizationId = ?", [req.body.chId, req.organizationId]);

  if (result.affectedRows === 0) return sendError(res, "Chapter not found", 404);

  return sendEncrypted(res, 200, {
    success: true,
    message: "Chapter deleted successfully",
    data: {},
  });
});

export const getChapterBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  if (!slug) return sendError(res, "Chapter slug is required", 400);

  const chapter = await findOne(
    `
    SELECT chId, courseId, chapterName, chapterDesc, content, videoUrl, slug, createdAt
    FROM chapter_details
    WHERE slug = ? AND organizationId = ?
    LIMIT 1
    `,
    [slug, req.organizationId]
  );

  if (!chapter) return sendError(res, "Chapter not found", 404);

  chapter.sources = await runQuery(
    `
    SELECT csId, chId, fileName, fileType, filePath, extension, canPreview, createdAt
    FROM chapter_sources
    WHERE chId = ? AND organizationId = ?
  ORDER BY csId DESC
  `,
    [chapter.chId, req.organizationId]
  );

  return sendEncrypted(res, 200, {
    success: true,
    message: "Chapter fetched successfully",
    data: chapter,
  });
});

export const updateChapterContent = asyncHandler(async (req, res) => {
  if (!isAdminUser(req)) return sendError(res, "Only admins can update chapter content", 403);
  if (!req.body.slug) return sendError(res, "Chapter slug is required", 400);

  const result = await updateRow(
    "chapter_details",
    { content: req.body.content || "" },
    "slug = ? AND organizationId = ?",
    [req.body.slug, req.organizationId]
  );

  if (result.affectedRows === 0) return sendError(res, "Chapter not found", 404);

  return sendEncrypted(res, 200, {
    success: true,
    message: "Content saved successfully",
    data: {},
  });
});