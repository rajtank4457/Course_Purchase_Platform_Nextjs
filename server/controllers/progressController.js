import { asyncHandler } from "../helpers/asyncHandler.js";
import { getDb } from "../helpers/dbHelper.js";
import { sendSuccess, sendError } from "../helpers/responseHelper.js";
import { requireUser } from "../helpers/authHelper.js";

export const getAllProgress = asyncHandler(async (req, res) => {
  if (!requireUser(req, res)) return;

  const db = await getDb();

  const [rows] = await db.query(
    `
    SELECT chId, progress
    FROM user_chapter_progress
    WHERE userId = ?
    `,
    [req.userId]
  );

  const progressMap = {};

  rows.forEach((row) => {
    progressMap[row.chId] = Number(row.progress || 0);
  });

  return sendSuccess(res, progressMap, "Progress fetched successfully");
});

export const getChapterProgress = asyncHandler(async (req, res) => {
  if (!requireUser(req, res)) return;

  const { chId } = req.params;

  if (!chId) {
    return sendError(res, "Chapter ID is required", 400);
  }

  const db = await getDb();

  const [rows] = await db.query(
    `
    SELECT *
    FROM user_chapter_progress
    WHERE userId = ? AND chId = ?
    LIMIT 1
    `,
    [req.userId, chId]
  );

  const progressData = rows[0] || {
    progress: 0,
    descDone: 0,
    notesProgress: 0,
    videoProgress: 0,
    sourceProgress: 0,
  };

  return sendSuccess(res, progressData, "Chapter progress fetched successfully");
});

export const saveChapterProgress = asyncHandler(async (req, res) => {
  if (!requireUser(req, res)) return;

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

  const db = await getDb();

  await db.query(
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

  return sendSuccess(res, {}, "Progress saved successfully");
});