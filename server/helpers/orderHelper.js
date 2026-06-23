export const addOrderCoursesToLibrary = async (db, userId, orderId) => {
  const [items] = await db.query(
    `
    SELECT courseId
    FROM order_items
    WHERE orderId = ?
    `,
    [orderId]
  );

  for (const item of items) {
    await db.query(
      `
      INSERT INTO user_library (userId, courseId)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE addedAt = addedAt
      `,
      [userId, item.courseId]
    );
  }
};

export const clearUserCart = async (db, userId) => {
  await db.query(
    `
    DELETE FROM cart
    WHERE userId = ?
    `,
    [userId]
  );
};

export const createOrderItems = async (db, orderId, cartItems = []) => {
  for (const item of cartItems) {
    await db.query(
      `
      INSERT INTO order_items
      (
        orderId,
        courseId,
        courseName,
        quantity,
        price
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [orderId, item.courseId, item.courseName, 1, item.coursePrice]
    );
  }
};