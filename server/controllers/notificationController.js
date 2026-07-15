import { asyncHandler } from "../helpers/asyncHandler.js";
import { runQuery } from "../helpers/dbHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";

export const getMyNotifications = asyncHandler(async (req, res) => {

  const rows = await runQuery(
    `
    SELECT
        notificationId,
        userId,
        organizationId,
        title,
        message,
        type,
        examId,
        attemptId,
        isRead,
        createdAt
    FROM notifications
    WHERE userId = ?
    AND organizationId = ?
    ORDER BY notificationId DESC;
    `,
    [req.userId, req.organizationId]
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

  await runQuery(
    `
    UPDATE notifications
    SET isRead = 1
    WHERE notificationId = ?
      AND userId = ?
      AND organizationId = ?
    `,
    [notificationId, req.userId, req.organizationId]
  );

  return sendEncrypted(res, 200, {
    success: true,
    message: "Notification marked as read",
    data: {},
  });
});

export const clearAllNotifications = asyncHandler(async (req, res) => {
  await runQuery(
    `
    DELETE FROM notifications
    WHERE userId = ?
      AND organizationId = ?
    `,
    [req.userId, req.organizationId]
  );

  return sendEncrypted(res, 200, {
    success: true,
    message: "Notifications cleared successfully",
    data: {},
  });
});