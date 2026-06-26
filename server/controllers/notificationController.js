import { asyncHandler } from "../helpers/asyncHandler.js";
import { getDb } from "../helpers/dbHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";

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

  return sendEncrypted(res, 200, {
    success: true,
    message: "Notifications fetched",
    data: {
      data: rows,
    },
  });
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

  return sendEncrypted(res, 200, {
    success: true,
    message: "Notification marked as read",
    data: {},
  });
});

export const clearAllNotifications = asyncHandler(async (req, res) => {
  const db = await getDb();

  await db.query(
    `DELETE FROM notifications WHERE userId = ?`,
    [req.userId]
  );

  return sendEncrypted(res, 200, {
    success: true,
    message: "Notifications cleared successfully",
    data: {},
  });
});