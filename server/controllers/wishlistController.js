import { runQuery } from "../helpers/dbHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";

const requireOrganization = (req, res) => {
    if (!req.organizationId) {
        res.status(400).json({
            success: false,
            message: "Organization not found",
        });
        return false;
    }

    return true;
};

export const getWishlist = async (req, res) => {
    try {
        if (!requireOrganization(req, res)) return;

        const rows = await runQuery(
            `
      SELECT 
        w.wishlistId,
        w.userId,
        w.courseId,
        w.createdAt,

        c.courseName,
        c.courseDesc,
        c.courseType,
        c.coursePrice,
        c.courseImg,
        c.courseSlug,

        COUNT(DISTINCT ch.chId) AS chapterCount,

        CASE 
          WHEN ul.libraryId IS NULL THEN 0
          ELSE 1
        END AS isPurchased

      FROM wishlist w

      JOIN course_details c 
        ON c.courseId = w.courseId
        AND c.organizationId = ?

      LEFT JOIN chapter_details ch 
        ON ch.courseId = c.courseId

      LEFT JOIN user_library ul
        ON ul.courseId = w.courseId
        AND ul.userId = w.userId
        AND ul.organizationId = ?

      WHERE w.userId = ?
        AND w.organizationId = ?

      GROUP BY 
        w.wishlistId,
        w.userId,
        w.courseId,
        w.createdAt,
        c.courseName,
        c.courseDesc,
        c.courseType,
        c.coursePrice,
        c.courseImg,
        c.courseSlug,
        ul.libraryId

      ORDER BY w.createdAt DESC
      `,
            [req.organizationId, req.organizationId, req.userId, req.organizationId]
        );

        return sendEncrypted(res, 200, {
            success: true,
            message: "Wishlist fetched",
            data: rows,
        });
    } catch (error) {
        console.log("GET WISHLIST ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch wishlist",
        });
    }
};

export const addToWishlist = async (req, res) => {
    try {
        if (!requireOrganization(req, res)) return;

        const { courseId } = req.body;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "Course ID is required",
            });
        }

        const courseRows = await runQuery(
            `
      SELECT courseId
      FROM course_details
      WHERE courseId = ?
        AND organizationId = ?
      LIMIT 1
      `,
            [courseId, req.organizationId]
        );

        if (courseRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found in your organization",
            });
        }

        await runQuery(
            `
      INSERT IGNORE INTO wishlist (userId, courseId, organizationId)
      VALUES (?, ?, ?)
      `,
            [req.userId, courseId, req.organizationId]
        );

        return sendEncrypted(res, 200, {
            success: true,
            message: "Course added to wishlist",
            data: {},
        });
    } catch (error) {
        console.log("ADD WISHLIST ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add wishlist",
        });
    }
};

export const removeFromWishlist = async (req, res) => {
    try {
        if (!requireOrganization(req, res)) return;

        const { courseId } = req.body;

        await runQuery(
            `
      DELETE FROM wishlist
      WHERE userId = ?
        AND courseId = ?
        AND organizationId = ?
      `,
            [req.userId, courseId, req.organizationId]
        );

        return sendEncrypted(res, 200, {
            success: true,
            message: "Course removed from wishlist",
            data: {},
        });
    } catch (error) {
        console.log("REMOVE WISHLIST ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to remove wishlist",
        });
    }
};

export const getWishlistCount = async (req, res) => {
    try {
        if (!requireOrganization(req, res)) return;

        const rows = await runQuery(
            `
      SELECT COUNT(*) AS count
      FROM wishlist
      WHERE userId = ?
        AND organizationId = ?
      `,
            [req.userId, req.organizationId]
        );

        return sendEncrypted(res, 200, {
            success: true,
            message: "Wishlist count fetched",
            data: {
                count: rows[0]?.count || 0,
            },
        });
    } catch (error) {
        console.log("WISHLIST COUNT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch wishlist count",
        });
    }
};