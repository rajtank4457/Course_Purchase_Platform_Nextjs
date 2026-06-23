import razorpay from "../config/razorpay.js";
import crypto from "crypto";
import { asyncHandler } from "../helpers/asyncHandler.js";
import { getDb } from "../helpers/dbHelper.js";
import { sendSuccess, sendError } from "../helpers/responseHelper.js";
import { requireUser } from "../helpers/authHelper.js";
import {
    addOrderCoursesToLibrary,
    clearUserCart,
    createOrderItems,
} from "../helpers/orderHelper.js";

export const createOrder = asyncHandler(async (req, res) => {
    if (!requireUser(req, res)) return;

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

    if (!totalPrice || Number(totalPrice) <= 0) {
        return sendError(res, "Invalid order amount", 400);
    }

    const db = await getDb();

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
        return sendError(res, "Cart is empty", 400);
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

    await createOrderItems(db, orderId, cartItems);

    return res.status(200).json({
        success: true,
        orderId,
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
    });
});

export const verifyCartPayment = asyncHandler(async (req, res) => {
    if (!requireUser(req, res)) return;

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
        req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return sendError(res, "Payment details are required", 400);
    }

    const db = await getDb();

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

        return sendError(res, "Invalid payment signature", 400);
    }

    const [orderRows] = await db.query(
        `
    SELECT orderId
    FROM orders
    WHERE razorpayOrderId = ? AND userId = ?
    LIMIT 1
    `,
        [razorpay_order_id, req.userId]
    );

    if (orderRows.length === 0) {
        return sendError(res, "Order not found", 404);
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

    await addOrderCoursesToLibrary(db, req.userId, orderId);
    await clearUserCart(db, req.userId);

    return sendSuccess(
        res,
        {
            orderId,
        },
        "Payment verified successfully"
    );
});

export const paymentFailed = asyncHandler(async (req, res) => {
    if (!requireUser(req, res)) return;

    const { razorpay_order_id, error } = req.body;

    if (!razorpay_order_id) {
        return sendError(res, "Razorpay order ID is required", 400);
    }

    const db = await getDb();

    await db.query(
        `
    UPDATE orders
    SET paymentStatus = 'failed'
    WHERE razorpayOrderId = ? AND userId = ?
    `,
        [razorpay_order_id, req.userId]
    );

    return sendSuccess(
        res,
        {
            error,
        },
        "Payment failed status updated"
    );
});