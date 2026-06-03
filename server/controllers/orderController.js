import { connectToDatabase } from "../lib/db.js";

export const getOrders = async (req, res) => {
    try {
        const db = await connectToDatabase();

        const [rows] = await db.query(
            `
      SELECT 
        orderId,
        userId,
        razorpayOrderId,
        courseQuantity,
        subTotal,
        couponCode,
        discountAmount,
        taxableAmount,
        gst,
        platformFee,
        totalPrice,
        paymentStatus,
        createdAt
      FROM orders
      WHERE userId = ?
      ORDER BY orderId DESC
      `,
            [req.userId]
        );

        return res.status(200).json({
            success: true,
            data: rows,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const getOrderDetails = async (req, res) => {
    try {
        const db = await connectToDatabase();

        const [orderRows] = await db.query(
            `
      SELECT *
      FROM orders
      WHERE orderId = ? AND userId = ?
      `,
            [req.params.orderId, req.userId]
        );

        if (orderRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }
        const [items] = await db.query(
            `
    SELECT
        oi.orderItemId,
        oi.orderId,
        oi.courseId,
        oi.courseName,
        oi.quantity,
        oi.price,

        cd.courseDesc

    FROM order_items oi
    LEFT JOIN course_details cd
        ON oi.courseId = cd.courseId

    WHERE oi.orderId = ?
    `,
            [req.params.orderId]
        );

        return res.status(200).json({
            success: true,
            order: orderRows[0],
            items,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};