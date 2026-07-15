import { asyncHandler } from "../helpers/asyncHandler.js";
import { runQuery } from "../helpers/dbHelper.js";
import { sendError } from "../helpers/responseHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";
import { requireUser } from "../helpers/authHelper.js";

export const getAllProgress = asyncHandler(async (req, res) => {
  if (!requireUser(req, res)) return;

  if (!req.organizationId) {
    return sendError(res, "Organization not found", 400);
  }

  const rows = await runQuery(
    `
    SELECT ucp.chId, ucp.progress
    FROM user_chapter_progress ucp
    INNER JOIN course_details cd
      ON cd.courseId = ucp.courseId
    WHERE ucp.userId = ?
      AND cd.organizationId = ?
    `,
    [req.userId, req.organizationId]
  );

  const progressMap = {};

  rows.forEach((row) => {
    progressMap[row.chId] = Number(row.progress || 0);
  });

  return sendEncrypted(res, 200, {
    success: true,
    message: "Progress fetched successfully",
    data: progressMap,
  });
});

export const getChapterProgress = asyncHandler(async (req, res) => {
  if (!requireUser(req, res)) return;

  if (!req.organizationId) {
    return sendError(res, "Organization not found", 400);
  }

  const { chId } = req.params;

  if (!chId) {
    return sendError(res, "Chapter ID is required", 400);
  }

  const rows = await runQuery(
    `
    SELECT ucp.*
    FROM user_chapter_progress ucp
    INNER JOIN course_details cd
      ON cd.courseId = ucp.courseId
    WHERE ucp.userId = ?
      AND ucp.chId = ?
      AND cd.organizationId = ?
    LIMIT 1
    `,
    [req.userId, chId, req.organizationId]
  );

  const progressData = rows[0] || {
    progress: 0,
    descDone: 0,
    notesProgress: 0,
    videoProgress: 0,
    sourceProgress: 0,
  };

  return sendEncrypted(res, 200, {
    success: true,
    message: "Chapter progress fetched successfully",
    data: progressData,
  });
});

export const saveChapterProgress = asyncHandler(async (req, res) => {
  if (!requireUser(req, res)) return;

  if (!req.organizationId) {
    return sendError(res, "Organization not found", 400);
  }

  let {
    courseId,
    chId,
    progress,
    descDone,
    notesProgress,
    videoProgress,
    sourceProgress,
  } = req.body;

  if (!courseId || !chId) {
    return sendError(res, "courseId and chId are required", 400);
  }

  const courseRows = await runQuery(
    `
    SELECT courseId
    FROM course_details
    WHERE courseId = ?
      AND organizationId = ?
    LIMIT 1
    `,
    [courseId, req.organizationId]
  );

  if (courseRows.length === 0) {
    return sendError(res, "Course not found in your organization", 404);
  }

  const chapterRows = await runQuery(
    `
    SELECT chId
    FROM chapter_details
    WHERE chId = ?
      AND courseId = ?
    LIMIT 1
    `,
    [chId, courseId]
  );

  if (chapterRows.length === 0) {
    return sendError(res, "Chapter not found in this course", 404);
  }

  progress = Number(progress || 0);
  notesProgress = Number(notesProgress || 0);
  videoProgress = Number(videoProgress || 0);
  sourceProgress = Number(sourceProgress || 0);
  descDone = descDone ? 1 : 0;

  if (progress >= 100) {
    progress = 100;
    descDone = 1;
    notesProgress = 25;
    videoProgress = 25;
    sourceProgress = 25;
  }

  await runQuery(
    `
    INSERT INTO user_chapter_progress
    (
      userId,
      courseId,
      chId,
      progress,
      descDone,
      notesProgress,
      videoProgress,
      sourceProgress
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      progress = GREATEST(progress, VALUES(progress)),
      descDone = GREATEST(descDone, VALUES(descDone)),
      notesProgress = GREATEST(notesProgress, VALUES(notesProgress)),
      videoProgress = GREATEST(videoProgress, VALUES(videoProgress)),
      sourceProgress = GREATEST(sourceProgress, VALUES(sourceProgress))
    `,
    [
      req.userId,
      courseId,
      chId,
      progress,
      descDone,
      notesProgress,
      videoProgress,
      sourceProgress,
    ]
  );

  return sendEncrypted(res, 200, {
    success: true,
    message: "Progress saved successfully",
    data: {},
  });
});