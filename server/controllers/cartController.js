import { connectToDatabase } from "../lib/db.js";

export const addToCart = async (req, res) => {
    try {
        const { courseId } = req.body;

        if (req.userType !== "user") {
            return res.status(403).json({ message: "Only users can add to cart" });
        }

        const db = await connectToDatabase();

        const [courseRows] = await db.query(
            "SELECT courseId, courseType, coursePrice FROM course_details WHERE courseId = ?",
            [courseId]
        );

        if (courseRows.length === 0) {
            return res.status(404).json({ message: "Course not found" });
        }

        const course = courseRows[0];

        if (Number(course.courseType) === 0) {
            return res.status(400).json({
                message: "Free course cannot be added to cart. Add it to library.",
            });
        }

        await db.query(
            `
      INSERT INTO cart (userId, courseId, quantity, price)
      VALUES (?, ?, 1, ?)
      ON DUPLICATE KEY UPDATE updatedAt = CURRENT_TIMESTAMP
      `,
            [req.userId, courseId, course.coursePrice]
        );

        return res.status(200).json({
            success: true,
            message: "Course added to cart",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const getCart = async (req, res) => {
    try {
        const db = await connectToDatabase();

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

export const getCartCount = async (req, res) => {
    try {
        const db = await connectToDatabase();

        const [rows] = await db.query(
            "SELECT COUNT(*) AS count FROM cart WHERE userId = ?",
            [req.userId]
        );

        return res.status(200).json({
            success: true,
            count: rows[0].count,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const removeCartItem = async (req, res) => {
    try {
        const { cartId } = req.params;

        const db = await connectToDatabase();

        const [cartRows] = await db.query(
            "SELECT * FROM cart WHERE cartId = ? AND userId = ?",
            [cartId, req.userId]
        );

        if (cartRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found",
            });
        }

        await db.query(
            "DELETE FROM cart WHERE cartId = ? AND userId = ?",
            [cartId, req.userId]
        );

        return res.status(200).json({
            success: true,
            message: "Course removed from cart",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};