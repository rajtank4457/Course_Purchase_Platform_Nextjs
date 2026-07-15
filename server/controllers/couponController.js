import { asyncHandler } from "../helpers/asyncHandler.js";
import {
    runQuery,
    findOne,
    insertRow,
    updateRow,
} from "../helpers/dbHelper.js";
import { sendError } from "../helpers/responseHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";

const expireOldCoupons = async (organizationId) => {
    const today = new Date().toISOString().split("T")[0];

    await runQuery(
        `
    UPDATE coupon_details
    SET isActive = 0
    WHERE organizationId = ?
      AND endDate IS NOT NULL
      AND endDate < ?
      AND isActive = 1
    `,
        [organizationId, today]
    );
};

export const validateCoupon = asyncHandler(async (req, res) => {
    const { couponCode, subTotal } = req.body;

    if (!couponCode) {
        return sendError(res, "Coupon code is required", 400);
    }

    if (subTotal === undefined || subTotal === null) {
        return sendError(res, "Subtotal is required", 400);
    }

    await expireOldCoupons(req.organizationId);

    const code = couponCode.trim().toUpperCase();

    const coupon = await findOne(
        `
        SELECT *
        FROM coupon_details
        WHERE couponCode = ?
            AND organizationId = ?
            AND isActive = 1
        LIMIT 1
        `,
        [code, req.organizationId]
    );

    if (!coupon) {
        return sendError(res, "Invalid coupon code", 404);
    }

    const today = new Date().toISOString().split("T")[0];

    if (coupon.startDate && today < coupon.startDate) {
        return sendError(res, "Coupon is not active yet", 400);
    }

    if (coupon.endDate && today > coupon.endDate) {
        return sendError(res, "Coupon has expired", 400);
    }

    if (
        coupon.usageLimit !== null &&
        Number(coupon.usedCount) >= Number(coupon.usageLimit)
    ) {
        return sendError(res, "Coupon usage limit reached", 400);
    }

    if (Number(subTotal) < Number(coupon.minOrderAmount)) {
        return sendError(
            res,
            `Minimum order amount should be ₹${coupon.minOrderAmount}`,
            400
        );
    }

    let discount = 0;

    if (coupon.discountType === "percentage") {
        discount = Math.round(
            (Number(subTotal) * Number(coupon.discountValue)) / 100
        );

        if (coupon.maxDiscountAmount) {
            discount = Math.min(discount, Number(coupon.maxDiscountAmount));
        }
    } else {
        discount = Number(coupon.discountValue);
    }

    discount = Math.min(discount, Number(subTotal));

    return sendEncrypted(res, 200, {
        success: true,
        message: "Coupon applied successfully",
        data: {
            discount,
            coupon,
        },
    });
});

export const updateCouponUsage = asyncHandler(async (req, res) => {
    const { couponCode } = req.body;

    if (!couponCode) {
        return sendError(res, "Coupon code is required", 400);
    }

    const code = couponCode.trim().toUpperCase();

    const result = await runQuery(
        `
        UPDATE coupon_details
        SET usedCount = usedCount + 1
        WHERE couponCode = ?
            AND organizationId = ?
        `,
        [code, req.organizationId]
    );

    if (result.affectedRows === 0) {
        return sendError(res, "Coupon not found", 404);
    }

    return sendEncrypted(res, 200, {
        success: true,
        message: "Coupon usage updated",
        data: {},
    });
});

export const getCoupons = asyncHandler(async (req, res) => {
    await expireOldCoupons(req.organizationId);

    const coupons = await runQuery(
        `
        SELECT
            couponId,
            organizationId,
            couponCode,
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscountAmount,
            usageLimit,
            usedCount,
            isActive,
            startDate,
            endDate,
            createdAt
        FROM coupon_details
        WHERE organizationId = ?
        ORDER BY couponId DESC
        `,
        [req.organizationId]
    );
    return sendEncrypted(res, 200, {
        success: true,
        message: "Coupons fetched successfully",
        data: coupons,
    });
});

export const addCoupon = asyncHandler(async (req, res) => {
    const {
        couponCode,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscountAmount,
        usageLimit,
        isActive,
        startDate,
        endDate,
    } = req.body;

    if (!couponCode || !discountType || !discountValue) {
        return sendError(
            res,
            "Coupon code, discount type and discount value are required",
            400
        );
    }

    if (!["percentage", "fixed"].includes(discountType)) {
        return sendError(res, "Invalid discount type", 400);
    }

    if (Number(discountValue) <= 0) {
        return sendError(res, "Discount value must be greater than 0", 400);
    }

    if (discountType === "percentage" && Number(discountValue) > 100) {
        return sendError(res, "Percentage discount cannot be more than 100%", 400);
    }

    if (Number(minOrderAmount || 0) < 0) {
        return sendError(res, "Minimum order amount cannot be negative", 400);
    }

    if (maxDiscountAmount && Number(maxDiscountAmount) < 0) {
        return sendError(res, "Maximum discount amount cannot be negative", 400);
    }

    if (usageLimit && Number(usageLimit) <= 0) {
        return sendError(res, "Usage limit must be greater than 0", 400);
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        return sendError(res, "End date cannot be before start date", 400);
    }

    const code = couponCode.trim().toUpperCase();

    const exists = await findOne(
        `
        SELECT couponId
        FROM coupon_details
        WHERE couponCode = ?
            AND organizationId = ?
        LIMIT 1
        `,
        [code, req.organizationId]
    );

    if (exists) {
        return sendError(res, "Coupon code already exists", 409);
    }

    await insertRow("coupon_details", {
        organizationId: req.organizationId,
        couponCode: code,
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount || 0),
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        usedCount: 0,
        isActive: Number(isActive ?? 1),
        startDate: startDate || null,
        endDate: endDate || null,
    });

    return sendEncrypted(res, 201, {
        success: true,
        message: "Coupon added successfully",
        data: {},
    });
});