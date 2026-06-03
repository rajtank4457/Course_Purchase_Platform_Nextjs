
import { connectToDatabase } from "../lib/db.js";


export const getCourses = async (req, res) => {
    try {
        const db = await connectToDatabase();

        const [rows] = await db.query(
            `
      SELECT 
        cd.courseId,
        cd.courseName,
        cd.courseDesc,
        cd.courseType,
        cd.courseSlug,
        cd.coursePrice,
        cd.courseImg,
        cd.createdAt,

        CASE 
          WHEN ul.libraryId IS NOT NULL THEN 1
          ELSE 0
        END AS hasCourse

      FROM course_details cd
      LEFT JOIN user_library ul
        ON ul.courseId = cd.courseId
        AND ul.userId = ?

      ORDER BY cd.createdAt DESC
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