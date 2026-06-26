import { connectToDatabase } from "../lib/db.js";

export const getStudentsForActivity = async (req, res) => {
    try {
        const db = await connectToDatabase();

        const [students] = await db.query(`
      SELECT userId, firstName, lastName, email
      FROM user_details
      WHERE isActive = 1
      ORDER BY firstName ASC
    `);

        res.json({
            success: true,
            message: "Students fetched",
            data: students,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch students",
        });
    }
};

export const getSingleUserActivityDashboard = async (req, res) => {
    try {
        const { userId } = req.params;
        const db = await connectToDatabase();

        const [dailyLogs] = await db.query(
            `
            SELECT 
                DATE(createdAt) AS date,
                CAST(COUNT(*) AS UNSIGNED) AS total
            FROM user_activity_logs
            WHERE userId = ?
            AND createdAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(createdAt)
            ORDER BY DATE(createdAt)
            `,
            [userId]
        );

        const [topPages] = await db.query(
            `
            SELECT 
                pageUrl,
                CAST(COUNT(*) AS UNSIGNED) AS total
            FROM user_activity_logs
            WHERE userId = ?
            AND pageUrl IS NOT NULL
            AND pageUrl != ''
            GROUP BY pageUrl
            ORDER BY total DESC
            LIMIT 5
            `,
            [userId]
        );

        const [recentLogs] = await db.query(
            `
      SELECT 
        ual.logId,
        ual.userId,
        ual.pageUrl,
        ual.actionType,
        ual.method,
        ual.ipAddress,
        ual.createdAt,
        u.firstName,
        u.lastName,
        u.email
      FROM user_activity_logs ual
      JOIN user_details u ON u.userId = ual.userId
      WHERE ual.userId = ?
      ORDER BY ual.createdAt DESC
      LIMIT 20
      `,
            [userId]
        );

        res.json({
            success: true,
            message: "Student activity fetched",
            data: {
                dailyLogs,
                topPages,
                recentLogs,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch student activity",
        });
    }
};