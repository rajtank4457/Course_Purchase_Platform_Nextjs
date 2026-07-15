import razorpay from "../config/razorpay.js";
import crypto from "crypto";
import { asyncHandler } from "../helpers/asyncHandler.js";
import { runQuery } from "../helpers/dbHelper.js";
import { sendError } from "../helpers/responseHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";
import { requireUser } from "../helpers/authHelper.js";
import {
    addOrderCoursesToLibrary,
    clearUserCart,
    createOrderItems,
} from "../helpers/orderHelper.js";

export const createOrder = asyncHandler(async (req, res) => {
    if (!requireUser(req, res)) return;

    const organizationId = req.organizationId;

    if (!organizationId) {
        return sendError(res, "Organization not found", 400);
    }

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

    const cartItems = await runQuery(
        `
    SELECT 
      c.courseId,
      cd.courseName,
      cd.coursePrice
    FROM cart c
    JOIN course_details cd ON c.courseId = cd.courseId
    WHERE c.userId = ?
      AND c.organizationId = ?
      AND cd.organizationId = ?
    `,
        [req.userId, organizationId, organizationId]
    );

    if (cartItems.length === 0) {
        return sendError(res, "Cart is empty", 400);
    }

    const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(Number(totalPrice) * 100),
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
    });

    const orderResult = await runQuery(
        `
    INSERT INTO orders
    (
      userId,
      organizationId,
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
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
            req.userId,
            organizationId,
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

    await createOrderItems(
        orderId,
        organizationId,
        cartItems
    );

    return sendEncrypted(res, 200, {
        success: true,
        message: "Razorpay order created successfully",
        data: {
            orderId,
            order_id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.RAZORPAY_KEY_ID,
        },
    });
});

export const verifyCartPayment = asyncHandler(async (req, res) => {
    if (!requireUser(req, res)) return;

    const organizationId = req.organizationId;

    if (!organizationId) {
        return sendError(res, "Organization not found", 400);
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
        req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return sendError(res, "Payment details are required", 400);
    }

    const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    if (generatedSignature !== razorpay_signature) {
        await runQuery(
            `
      UPDATE orders 
      SET paymentStatus = 'failed'
      WHERE razorpayOrderId = ?
        AND userId = ?
        AND organizationId = ?
      `,
            [razorpay_order_id, req.userId, organizationId]
        );

        return sendError(res, "Invalid payment signature", 400);
    }

    const orderRows = await runQuery(
        `
    SELECT orderId
    FROM orders
    WHERE razorpayOrderId = ?
      AND userId = ?
      AND organizationId = ?
    LIMIT 1
    `,
        [razorpay_order_id, req.userId, organizationId]
    );

    if (orderRows.length === 0) {
        return sendError(res, "Order not found", 404);
    }

    const orderId = orderRows[0].orderId;

    await runQuery(
        `
    UPDATE orders
    SET paymentStatus = 'paid'
    WHERE orderId = ?
      AND userId = ?
      AND organizationId = ?
    `,
        [orderId, req.userId, organizationId]
    );

    await addOrderCoursesToLibrary(req.userId, orderId, organizationId);
    await clearUserCart(req.userId, organizationId);

    return sendEncrypted(res, 200, {
        success: true,
        message: "Payment verified successfully",
        data: {
            orderId,
        },
    });
});

export const paymentFailed = asyncHandler(async (req, res) => {
    if (!requireUser(req, res)) return;

    const organizationId = req.organizationId;

    if (!organizationId) {
        return sendError(res, "Organization not found", 400);
    }

    const { razorpay_order_id, error } = req.body;

    if (!razorpay_order_id) {
        return sendError(res, "Razorpay order ID is required", 400);
    }

    await runQuery(
        `
    UPDATE orders
    SET paymentStatus = 'failed'
    WHERE razorpayOrderId = ?
      AND userId = ?
      AND organizationId = ?
    `,
        [razorpay_order_id, req.userId, organizationId]
    );

    return sendEncrypted(res, 200, {
        success: true,
        message: "Payment failed status updated",
        data: {
            error,
        },
    });
});