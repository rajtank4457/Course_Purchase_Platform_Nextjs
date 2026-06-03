import { connectToDatabase } from "../lib/db.js";


export const validateCoupon = async (req, res) => {
    try {
        const { couponCode, subTotal } = req.body;

        if (!couponCode) {
            return res.status(400).json({
                success: false,
                message: "Coupon code is required",
            });
        }

        const db = await connectToDatabase();

        const [rows] = await db.query(
            `
      SELECT *
      FROM coupon_details
      WHERE couponCode = ?
      AND isActive = 1
      `,
            [couponCode]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Invalid coupon code",
            });
        }

        const coupon = rows[0];
        const today = new Date().toISOString().split("T")[0];

        if (coupon.startDate && today < coupon.startDate) {
            return res.status(400).json({
                success: false,
                message: "Coupon is not active yet",
            });
        }

        if (coupon.endDate && today > coupon.endDate) {
            return res.status(400).json({
                success: false,
                message: "Coupon has expired",
            });
        }

        if (
            coupon.usageLimit !== null &&
            Number(coupon.usedCount) >= Number(coupon.usageLimit)
        ) {
            return res.status(400).json({
                success: false,
                message: "Coupon usage limit reached",
            });
        }

        if (Number(subTotal) < Number(coupon.minOrderAmount)) {
            return res.status(400).json({
                success: false,
                message: `Minimum order amount should be ₹${coupon.minOrderAmount}`,
            });
        }

        let discount = 0;

        if (coupon.discountType === "percentage") {
            discount = Math.round((Number(subTotal) * Number(coupon.discountValue)) / 100);

            if (coupon.maxDiscountAmount) {
                discount = Math.min(discount, Number(coupon.maxDiscountAmount));
            }
        } else {
            discount = Number(coupon.discountValue);
        }

        return res.status(200).json({
            success: true,
            message: "Coupon applied successfully",
            discount,
            coupon,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const updateCouponUsage = async (req, res) => {
    try {
        const { couponCode } = req.body;

        if (!couponCode) {
            return res.status(400).json({
                success: false,
                message: "Coupon code is required",
            });
        }

        const db = await connectToDatabase();

        await db.query(
            `
      UPDATE coupon_details
      SET usedCount = usedCount + 1
      WHERE couponCode = ?
      `,
            [couponCode]
        );

        return res.status(200).json({
            success: true,
            message: "Coupon usage updated",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};