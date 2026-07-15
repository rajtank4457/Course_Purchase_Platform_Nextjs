import { asyncHandler } from "../helpers/asyncHandler.js";
import { findOne, runQuery, deleteRow } from "../helpers/dbHelper.js";
import { sendError } from "../helpers/responseHelper.js";
import { requireUser } from "../helpers/authHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";

export const addToCart = asyncHandler(async (req, res) => {
    if (!requireUser(req, res)) return;

    const { courseId } = req.body;

    if (!courseId) {
        return sendError(res, "Course ID is required", 400);
    }

    const course = await findOne(
        `
    SELECT courseId, courseType, coursePrice
    FROM course_details
    WHERE courseId = ?
    AND organizationId = ?
    `,
        [courseId, req.organizationId]
    );

    if (!course) {
        return sendError(res, "Course not found in your organization", 404);
    }

    if (Number(course.courseType) === 0) {
        return sendError(res, "Free course cannot be added to cart. Add it to library.", 400);
    }

    await runQuery(
        `
    INSERT INTO cart (userId, organizationId, courseId, quantity, price)
    VALUES (?, ?, ?, 1, ?)
    ON DUPLICATE KEY UPDATE updatedAt = CURRENT_TIMESTAMP
    `,
        [req.userId, req.organizationId, courseId, course.coursePrice]
    );

    return sendEncrypted(res, 200, {
        success: true,
        message: "Course added to cart",
        data: {},
    });
});

export const getCart = asyncHandler(async (req, res) => {
    if (!requireUser(req, res)) return;

    const rows = await runQuery(
        `
    SELECT 
      c.cartId,
      c.userId,
      c.organizationId,
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
    JOIN course_details cd 
      ON c.courseId = cd.courseId
     AND cd.organizationId = c.organizationId
    WHERE c.userId = ?
    AND c.organizationId = ?
    ORDER BY c.createdAt DESC
    `,
        [req.userId, req.organizationId]
    );

    return sendEncrypted(res, 200, {
        success: true,
        message: "Cart fetched successfully",
        data: rows,
    });
});

export const getCartCount = asyncHandler(async (req, res) => {
    if (!requireUser(req, res)) return;

    const row = await findOne(
        `
    SELECT COUNT(*) AS count 
    FROM cart 
    WHERE userId = ?
    AND organizationId = ?
    `,
        [req.userId, req.organizationId]
    );

    return sendEncrypted(res, 200, {
        success: true,
        message: "Cart count fetched",
        data: {
            count: row?.count || 0,
        },
    });
});

export const removeCartItem = asyncHandler(async (req, res) => {
    if (!requireUser(req, res)) return;

    const result = await deleteRow(
        "cart",
        "cartId = ? AND userId = ? AND organizationId = ?",
        [req.params.cartId, req.userId, req.organizationId]
    );

    if (result.affectedRows === 0) {
        return sendError(res, "Cart item not found", 404);
    }

    return sendEncrypted(res, 200, {
        success: true,
        message: "Course removed from cart",
        data: {},
    });
});