import { asyncHandler } from "../helpers/asyncHandler.js";
import { getDb } from "../helpers/dbHelper.js";
import { sendSuccess, sendError } from "../helpers/responseHelper.js";
import { requireUser } from "../helpers/authHelper.js";

export const addToCart = asyncHandler(async (req, res) => {
    if (!requireUser(req, res)) return;

    const { courseId } = req.body;

    if (!courseId) {
        return sendError(res, "Course ID is required", 400);
    }

    const db = await getDb();

    const [courseRows] = await db.query(
        `
    SELECT courseId, courseType, coursePrice
    FROM course_details
    WHERE courseId = ?
    `,
        [courseId]
    );

    if (courseRows.length === 0) {
        return sendError(res, "Course not found", 404);
    }

    const course = courseRows[0];

    if (Number(course.courseType) === 0) {
        return sendError(res, "Free course cannot be added to cart. Add it to library.", 400);
    }

    await db.query(
        `
    INSERT INTO cart (userId, courseId, quantity, price)
    VALUES (?, ?, 1, ?)
    ON DUPLICATE KEY UPDATE updatedAt = CURRENT_TIMESTAMP
    `,
        [req.userId, courseId, course.coursePrice]
    );

    return sendSuccess(res, {}, "Course added to cart");
});

export const getCart = asyncHandler(async (req, res) => {
    if (!requireUser(req, res)) return;

    const db = await getDb();

    const [rows] = await db.query(
        `
    SELECT 
      c.cartId,
      c.userId,
      c.courseId,
      c.price,
      c.createdAt,
      cd.courseName,
      cd.courseDesc,
      cd.courseImg,
      cd.courseSlug,
      cd.courseType,
      cd.coursePrice
    FROM cart c
    JOIN course_details cd ON c.courseId = cd.courseId
    WHERE c.userId = ?
    ORDER BY c.createdAt DESC
    `,
        [req.userId]
    );

    return sendSuccess(res, rows, "Cart fetched successfully");
});

export const getCartCount = asyncHandler(async (req, res) => {
    if (!requireUser(req, res)) return;

    const db = await getDb();

    const [rows] = await db.query(
        `SELECT COUNT(*) AS count FROM cart WHERE userId = ?`,
        [req.userId]
    );

    return sendSuccess(res, { count: rows[0].count }, "Cart count fetched");
});

export const removeCartItem = asyncHandler(async (req, res) => {
    if (!requireUser(req, res)) return;

    const { cartId } = req.params;

    const db = await getDb();

    const [result] = await db.query(
        `DELETE FROM cart WHERE cartId = ? AND userId = ?`,
        [cartId, req.userId]
    );

    if (result.affectedRows === 0) {
        return sendError(res, "Cart item not found", 404);
    }

    return sendSuccess(res, {}, "Course removed from cart");
});