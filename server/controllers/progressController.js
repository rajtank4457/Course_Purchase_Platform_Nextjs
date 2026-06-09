import { connectToDatabase } from "../lib/db.js";

export const getAllProgress = async (req, res) => {
  try {
    const userId = req.userId;

    const db = await connectToDatabase();

    const [rows] = await db.query(
      `
      SELECT chId, progress
      FROM user_chapter_progress
      WHERE userId = ?
      `,
      [userId]
    );

    const progressMap = {};

    rows.forEach((row) => {
      progressMap[row.chId] = Number(row.progress || 0);
    });

    return res.json({
      success: true,
      data: progressMap,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const getChapterProgress = async (req, res) => {
  try {
    const { chId } = req.params;
    const userId = req.userId;

    const db = await connectToDatabase();

    const [rows] = await db.query(
      `
      SELECT *
      FROM user_chapter_progress
      WHERE userId = ? AND chId = ?
      `,
      [userId, chId]
    );

    return res.json({
      success: true,
      data: rows[0] || {
        progress: 0,
        descDone: 0,
        notesProgress: 0,
        videoProgress: 0,
        sourceProgress: 0,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const saveChapterProgress = async (req, res) => {
  try {
    const userId = req.userId;

    const {
      courseId,
      chId,
      progress,
      descDone,
      notesProgress,
      videoProgress,
      sourceProgress,
    } = req.body;

    if (!courseId || !chId) {
      return res.status(400).json({
        success: false,
        message: "courseId and chId are required",
      });
    }

    const db = await connectToDatabase();

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
        progress = VALUES(progress),
        descDone = VALUES(descDone),
        notesProgress = VALUES(notesProgress),
        videoProgress = VALUES(videoProgress),
        sourceProgress = VALUES(sourceProgress)
      `,
      [
        userId,
        courseId,
        chId,
        Number(progress || 0),
        descDone ? 1 : 0,
        Number(notesProgress || 0),
        Number(videoProgress || 0),
        Number(sourceProgress || 0),
      ]
    );

    return res.json({
      success: true,
      message: "Progress saved successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};