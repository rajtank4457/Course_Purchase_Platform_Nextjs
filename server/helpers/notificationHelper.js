export const createNotification = async (
  db,
  {
    userId,
    title,
    message,
    type,
    examId = null,
    attemptId = null,
  }
) => {
  const [result] = await db.query(
    `
    INSERT INTO notifications
    (userId, title, message, type, examId, attemptId, isRead)
    VALUES (?, ?, ?, ?, ?, ?, 0)
    `,
    [userId, title, message, type, examId, attemptId]
  );

  return result.insertId;
};

export const emitUserNotification = (
  io,
  userId,
  notification
) => {
  io?.to(`user_${userId}`).emit("newNotification", {
    ...notification,
    isRead: 0,
    createdAt: new Date().toISOString(),
  });
};

export const notifyUser = async (
  db,
  io,
  {
    userId,
    title,
    message,
    type,
    examId = null,
    attemptId = null,
  }
) => {
  const notificationId = await createNotification(db, {
    userId,
    title,
    message,
    type,
    examId,
    attemptId,
  });

  emitUserNotification(io, userId, {
    notificationId,
    title,
    message,
    type,
    examId,
    attemptId,
  });

  return notificationId;
};