import { runQuery } from "./dbHelper.js";

export const addOrderCoursesToLibrary = async (
  userId,
  orderId,
  organizationId
) => {
  const items = await runQuery(
    `
    SELECT courseId
    FROM order_items
    WHERE orderId = ?
      AND organizationId = ?
    `,
    [orderId, organizationId]
  );

  for (const item of items) {
    await runQuery(
      `
      INSERT INTO user_library
      (userId, courseId)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE addedAt = addedAt
      `,
      [userId, item.courseId]
    );
  }
};

export const clearUserCart = async (
  userId,
  organizationId
) => {
  await runQuery(
    `
    DELETE FROM cart
    WHERE userId = ?
      AND organizationId = ?
    `,
    [userId, organizationId]
  );
};

export const createOrderItems = async (
  orderId,
  organizationId,
  cartItems = []
) => {
  for (const item of cartItems) {
    await runQuery(
      `
      INSERT INTO order_items
      (
        orderId,
        organizationId,
        courseId,
        courseName,
        quantity,
        price
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        orderId,
        organizationId,
        item.courseId,
        item.courseName,
        1,
        item.coursePrice,
      ]
    );

    console.log("Organization:", organizationId);
    console.log("Items:", cartItems);
  }
};