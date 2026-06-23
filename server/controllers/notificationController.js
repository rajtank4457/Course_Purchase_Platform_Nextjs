import { asyncHandler } from "../helpers/asyncHandler.js";
import { getDb } from "../helpers/dbHelper.js";
import { sendSuccess } from "../helpers/responseHelper.js";

export const getMyNotifications = asyncHandler(async (req, res) => {
  const db = await getDb();

  const [rows] = await db.query(
    `
    SELECT
      notificationId, title, message, type,
      examId, attemptId, isRead, createdAt
    FROM notifications
    WHERE userId = ?
    ORDER BY notificationId DESC
    LIMIT 30
    `,
    [req.userId]
  );

  return sendSuccess(res, { data: rows }, "Notifications fetched");
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.body;
  const db = await getDb();

  await db.query(
    `
    UPDATE notifications
    SET isRead = 1
    WHERE notificationId = ?
    AND userId = ?
    `,
    [notificationId, req.userId]
  );

  return sendSuccess(res, {}, "Notification marked as read");
});

export const clearAllNotifications = asyncHandler(async (req, res) => {
  const db = await getDb();

  await db.query(
    `DELETE FROM notifications WHERE userId = ?`,
    [req.userId]
  );

  return sendSuccess(res, {}, "Notifications cleared successfully");
});