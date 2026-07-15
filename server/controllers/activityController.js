import { runQuery } from "../helpers/dbHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";

const pageNameCase = `
  CASE
    WHEN pageUrl = '/' THEN 'Home'
    WHEN pageUrl = '/user/courses' THEN 'My Courses'
    WHEN pageUrl = '/user/cart' THEN 'Cart'
    WHEN pageUrl = '/user/orders' THEN 'My Orders'
    WHEN pageUrl = '/user/dashboard' THEN 'Dashboard'
    WHEN pageUrl = '/user/profile' THEN 'Profile'
    WHEN pageUrl LIKE '/user/orders/%' THEN 'Order Details'
    WHEN pageUrl LIKE '/user/course/%' THEN 'Course Details'
    WHEN pageUrl LIKE '/user/chapter/%' THEN 'Chapter Details'
    WHEN pageUrl LIKE '/user/exams/%' THEN 'Exam'
    WHEN pageUrl = '/admin/dashboard' THEN 'Admin Dashboard'
    WHEN pageUrl = '/admin/students' THEN 'Students'
    WHEN pageUrl = '/admin/courses' THEN 'Courses'
    WHEN pageUrl = '/admin/orders' THEN 'Orders'
    ELSE 'Other Page'
  END
`;

const getDateFilter = ({ days = 7, startDate, endDate, singleDate }) => {
    if (singleDate) {
        return {
            condition: `AND DATE(createdAt) = ?`,
            params: [singleDate],
        };
    }

    if (startDate && endDate) {
        return {
            condition: `AND DATE(createdAt) BETWEEN ? AND ?`,
            params: [startDate, endDate],
        };
    }

    return {
        condition: `AND createdAt >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
        params: [Number(days)],
    };
};

export const getStudentsForActivity = async (req, res) => {
    try {
        const organizationId = req.organizationId;

        const students = await runQuery(
            `
      SELECT userId, firstName, lastName, email
      FROM user_details
      WHERE isActive = 1
      AND organizationId = ?
      ORDER BY firstName ASC
      `,
            [organizationId]
        );

        return sendEncrypted(res, 200, {
            success: true,
            message: "Students fetched",
            data: students,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch students",
        });
    }
};

export const getSingleUserActivityDashboard = async (req, res) => {
    try {
        const { userId } = req.params;
        const organizationId = req.organizationId;

        const { condition, params } = getDateFilter(req.query);

        const dailyLogs = await runQuery(
            `
      SELECT 
        DATE(createdAt) AS date,
        CAST(COUNT(*) AS UNSIGNED) AS total
      FROM user_activity_logs
      WHERE userId = ?
      AND organizationId = ?
      ${condition}
      GROUP BY DATE(createdAt)
      ORDER BY DATE(createdAt)
      `,
            [userId, organizationId, ...params]
        );

        const topPages = await runQuery(
            `
      SELECT
        ${pageNameCase} AS pageName,
        CAST(COUNT(*) AS UNSIGNED) AS total
      FROM user_activity_logs
      WHERE userId = ?
      AND organizationId = ?
      ${condition}
      AND pageUrl IS NOT NULL
      AND pageUrl != ''
      GROUP BY pageName
      ORDER BY total DESC
      LIMIT 5
      `,
            [userId, organizationId, ...params]
        );

        return sendEncrypted(res, 200, {
            success: true,
            message: "Student activity fetched",
            data: { dailyLogs, topPages },
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch student activity",
        });
    }
};

export const trackPageActivity = async (req, res) => {
    try {
        const organizationId = req.organizationId;

        await runQuery(
            `
      INSERT INTO user_activity_logs
      (userId, organizationId, pageUrl, actionType, method, ipAddress)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
            [
                req.userId,
                organizationId,
                req.body.pageUrl,
                req.body.actionType || "page_view",
                req.method,
                req.ip,
            ]
        );

        return sendEncrypted(res, 200, {
            success: true,
            message: "Activity tracked",
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to track activity",
        });
    }
};