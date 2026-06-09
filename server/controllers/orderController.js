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
      SELECT 
        o.*,
        u.firstName,
        u.lastName,
        u.email,
        u.phoneNo,
        u.address,
        u.city,
        u.state
      FROM orders o
      LEFT JOIN user_details u
        ON o.userId = u.userId
      WHERE o.orderId = ? AND o.userId = ?
      `,
            [req.params.orderId, req.userId]
        );

        if (orderRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        let order = orderRows[0];

        if (order.paymentStatus === "created") {
            await db.query(
                `
        UPDATE orders
        SET paymentStatus = 'failed'
        WHERE orderId = ? 
          AND userId = ? 
          AND paymentStatus = 'created'
        `,
                [req.params.orderId, req.userId]
            );

            const [updatedOrderRows] = await db.query(
                `
        SELECT 
          o.*,
          u.firstName,
          u.lastName,
          u.email,
          u.phoneNo,
          u.address,
          u.city,
          u.state
        FROM orders o
        LEFT JOIN user_details u
          ON o.userId = u.userId
        WHERE o.orderId = ? AND o.userId = ?
        `,
                [req.params.orderId, req.userId]
            );

            order = updatedOrderRows[0];
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
            order,
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

export const getAllOrders = async (req, res) => {
    try {
        const db = await connectToDatabase();

        const [orders] = await db.query(`
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
      ORDER BY orderId DESC
    `);

        return res.status(200).json({
            success: true,
            data: orders,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch all orders",
            error: err.message,
        });
    }
};

export const getAdminOrderDetails = async (req, res) => {
    try {
        const db = await connectToDatabase();

        const [orderRows] = await db.query(
            `
      SELECT
        o.*,
        u.firstName,
        u.lastName,
        u.email,
        u.phoneNo
      FROM orders o
      LEFT JOIN user_details u
        ON o.userId = u.userId
      WHERE o.orderId = ?
      `,
            [req.params.orderId]
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