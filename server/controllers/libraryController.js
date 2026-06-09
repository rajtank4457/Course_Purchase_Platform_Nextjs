import { connectToDatabase } from "../lib/db.js";

export const addToLibrary = async (req, res) => {
    try {
        const { courseId } = req.body;

        if (req.userType !== "user") {
            return res.status(403).json({
                success: false,
                message: "Only users can add courses to library",
            });
        }

        const db = await connectToDatabase();

        const [courseRows] = await db.query(
            "SELECT courseId, courseType FROM course_details WHERE courseId = ?",
            [courseId]
        );

        if (courseRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        const course = courseRows[0];

        if (Number(course.courseType) !== 0) {
            return res.status(400).json({
                success: false,
                message: "Only free courses can be added to library",
            });
        }

        await db.query(
            `
      INSERT INTO user_library (userId, courseId)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE addedAt = addedAt
      `,
            [req.userId, courseId]
        );

        return res.status(200).json({
            success: true,
            message: "Course added to library",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

// export const getMyLibrary = async (req, res) => {
//     try {
//         if (req.userType !== "user") {
//             return res.status(403).json({
//                 success: false,
//                 message: "Only users can access library",
//             });
//         }

//         const db = await connectToDatabase();

//         const [rows] = await db.query(
//             `
//       SELECT 
//         ul.libraryId,
//         ul.userId,
//         ul.courseId,
//         ul.addedAt,

//         cd.courseName,
//         cd.courseDesc,
//         cd.courseType,
//         cd.courseSlug,
//         cd.coursePrice,
//         cd.courseImg,
//         cd.createdAt
//       FROM user_library ul
//       JOIN course_details cd ON ul.courseId = cd.courseId
//       WHERE ul.userId = ?
//       ORDER BY ul.addedAt DESC
//       `,
//             [req.userId]
//         );

//         return res.status(200).json({
//             success: true,
//             data: rows,
//         });
//     } catch (err) {
//         return res.status(500).json({
//             success: false,
//             message: "Server Error",
//             error: err.message,
//         });
//     }
// };

export const getLibraryCourses = async (req, res) => {
    try {
        const userId = req.userId;

        const db = await connectToDatabase();

        const [courses] = await db.query(
            `
            SELECT 
                cd.courseId,
                cd.courseName,
                cd.courseDesc,
                cd.courseType,
                cd.courseSlug,
                cd.coursePrice,
                cd.courseImg,
                cd.createdAt
            FROM user_library ul
            INNER JOIN course_details cd
                ON cd.courseId = ul.courseId
            WHERE ul.userId = ?
            ORDER BY ul.addedAt DESC
            `,
            [userId]
        );

        for (const course of courses) {
            const [chapters] = await db.query(
                `
        SELECT
          chId,
          courseId,
          chapterName,
          chapterDesc,
          videoUrl,
          slug,
          createdAt
        FROM chapter_details
        WHERE courseId = ?
        ORDER BY createdAt ASC
        `,
                [course.courseId]
            );

            course.chapters = chapters;
            course.chapterCount = chapters.length;
        }

        return res.json({
            success: true,
            data: courses,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};