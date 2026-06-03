import { connectToDatabase } from "../lib/db.js";
import razorpay from "../config/razorpay.js";
import crypto from "crypto";

export const createOrder = async (req, res) => {
    try {
        const {
            courseQuantity,
            subTotal,
            couponCode,
            discountAmount,
            taxableAmount,
            gst,
            platformFee,
            totalPrice,
        } = req.body;

        const db = await connectToDatabase();

        const [cartItems] = await db.query(
            `
      SELECT 
        c.courseId,
        cd.courseName,
        cd.coursePrice
      FROM cart c
      JOIN course_details cd ON c.courseId = cd.courseId
      WHERE c.userId = ?
      `,
            [req.userId]
        );

        if (cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty",
            });
        }

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(Number(totalPrice) * 100),
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });

        const [orderResult] = await db.query(
            `
      INSERT INTO orders
      (
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
        paymentStatus
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
            [
                req.userId,
                razorpayOrder.id,
                courseQuantity,
                subTotal,
                couponCode || null,
                discountAmount,
                taxableAmount,
                gst,
                platformFee,
                totalPrice,
                "created",
            ]
        );

        const orderId = orderResult.insertId;

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
                [
                    orderId,
                    item.courseId,
                    item.courseName,
                    1,
                    item.coursePrice,
                ]
            );
        }

        return res.status(200).json({
            success: true,
            orderId,
            order_id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.RAZORPAY_KEY_ID,
        });
    } catch (err) {
        console.log("CREATE ORDER ERROR:", err);
        console.log(err);

        return res.status(500).json({
            success: false,
            message: "Order creation failed",
            error: err.message,
        });
    }
};

export const verifyCartPayment = async (req, res) => {
    try {
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
        } = req.body;

        const db = await connectToDatabase();

        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            await db.query(
                `
        UPDATE orders 
        SET paymentStatus = 'failed'
        WHERE razorpayOrderId = ? AND userId = ?
        `,
                [razorpay_order_id, req.userId]
            );

            return res.status(400).json({
                success: false,
                message: "Invalid payment signature",
            });
        }

        const [orderRows] = await db.query(
            `
      SELECT orderId
      FROM orders
      WHERE razorpayOrderId = ? AND userId = ?
      `,
            [razorpay_order_id, req.userId]
        );

        if (orderRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const orderId = orderRows[0].orderId;

        await db.query(
            `
      UPDATE orders
      SET paymentStatus = 'paid'
      WHERE orderId = ?
      `,
            [orderId]
        );

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
                [req.userId, item.courseId]
            );
        }

        await db.query(
            `
      DELETE FROM cart
      WHERE userId = ?
      `,
            [req.userId]
        );

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            orderId,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Payment verification failed",
            error: err.message,
        });
    }
};

export const paymentFailed = async (req, res) => {
    try {
        const { razorpay_order_id, error } = req.body;

        const db = await connectToDatabase();

        await db.query(
            `
      UPDATE orders
      SET paymentStatus = 'failed'
      WHERE razorpayOrderId = ? AND userId = ?
      `,
            [razorpay_order_id, req.userId]
        );

        return res.status(200).json({
            success: true,
            message: "Payment failed status updated",
            error,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to update payment status",
            error: err.message,
        });
    }
};
