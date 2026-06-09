import { connectToDatabase } from "../lib/db.js";


export const getStudents = async (req, res) => {
    try {
        const db = await connectToDatabase();

        const [rows] = await db.query(`
      SELECT 
        userId,
        firstName,
        lastName,
        email,
        phoneNo,
        address,
        city,
        state,
        dob,
        isActive
      FROM user_details
      ORDER BY userId DESC
    `);

        return res.status(200).json(rows);
    } catch (err) {
        return res.status(500).json({
            message: "Server Error",
            error: err.message,
        });
    }
};

export const addStudent = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            phoneNo,
            address,
            city,
            state,
            dob,
            isActive,
        } = req.body;

        const db = await connectToDatabase();

        const hashPassword = await bcrypt.hash(password, 10);

        await db.query(
            `
      INSERT INTO user_details
      (
        firstName,
        lastName,
        email,
        password,
        phoneNo,
        address,
        city,
        state,
        dob,
        isActive
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
            [
                firstName,
                lastName,
                email,
                hashPassword,
                phoneNo,
                address,
                city,
                state,
                dob,
                isActive ?? 1,
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Student added successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const getStudentDetailsWithCourses = async (req, res) => {
    try {
        const { userId } = req.params;
        const db = await connectToDatabase();

        const [studentRows] = await db.query(
            `
      SELECT userId, firstName, lastName, email, phoneNo,
             address, city, state, dob, isActive
      FROM user_details
      WHERE userId = ?
      `,
            [userId]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        const [courses] = await db.query(
            `
      SELECT
        ul.libraryId,
        c.courseId,
        c.courseName,
        c.courseSlug,
        c.courseDesc,
        c.courseImg,
        c.courseType,
        c.coursePrice,
        ul.addedAt AS purchasedAt,
        COUNT(DISTINCT ch.chId) AS totalChapters,
        ROUND(COALESCE(AVG(COALESCE(ucp.progress, 0)), 0)) AS progress
      FROM user_library ul
      JOIN course_details c ON c.courseId = ul.courseId
      LEFT JOIN chapter_details ch ON ch.courseId = c.courseId
      LEFT JOIN user_chapter_progress ucp
        ON ucp.chId = ch.chId
        AND ucp.courseId = c.courseId
        AND ucp.userId = ul.userId
      WHERE ul.userId = ?
      GROUP BY
        ul.libraryId,
        c.courseId,
        c.courseName,
        c.courseSlug,
        c.courseDesc,
        c.courseImg,
        c.courseType,
        c.coursePrice,
        ul.addedAt
      ORDER BY ul.addedAt DESC
      `,
            [userId]
        );

        return res.status(200).json({
            success: true,
            data: {
                student: studentRows[0],
                courses,
            },
        });
    } catch (err) {
        console.error("GET STUDENT DETAILS ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const getStudentCourseProgress = async (req, res) => {
    try {
        const { userId, courseId } = req.params;
        const db = await connectToDatabase();

        const [chapters] = await db.query(
            `
      SELECT
        ch.chId,
        ch.chapterName,
        ch.chapterDesc,
        ch.slug,
        COALESCE(ucp.progress, 0) AS progress,
        COALESCE(ucp.descDone, 0) AS descDone,
        COALESCE(ucp.notesProgress, 0) AS notesProgress,
        COALESCE(ucp.videoProgress, 0) AS videoProgress,
        COALESCE(ucp.sourceProgress, 0) AS sourceProgress
      FROM chapter_details ch
      LEFT JOIN user_chapter_progress ucp
        ON ucp.chId = ch.chId
        AND ucp.courseId = ch.courseId
        AND ucp.userId = ?
      WHERE ch.courseId = ?
      ORDER BY ch.createdAt ASC
      `,
            [userId, courseId]
        );

        return res.status(200).json({
            success: true,
            data: chapters,
        });
    } catch (err) {
        console.error("GET STUDENT COURSE PROGRESS ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const resetStudentCourseProgress = async (req, res) => {
    try {
        const { userId, courseId } = req.body;

        const db = await connectToDatabase();

        await db.query(
            `
      DELETE FROM user_chapter_progress
      WHERE userId = ? AND courseId = ?
      `,
            [userId, courseId]
        );

        return res.status(200).json({
            success: true,
            message: "Course user_chapter_progress reset successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const resetStudentAllProgress = async (req, res) => {
    try {
        const { userId } = req.body;

        const db = await connectToDatabase();

        await db.query(
            `
      DELETE FROM user_chapter_progress
      WHERE userId = ?
      `,
            [userId]
        );

        return res.status(200).json({
            success: true,
            message: "All user_chapter_progress reset successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const removeStudentCourse = async (req, res) => {
    try {
        const { userId, courseId } = req.body;

        const db = await connectToDatabase();

        await db.query(
            `
      DELETE FROM user_chapter_progress
      WHERE userId = ? AND courseId = ?
      `,
            [userId, courseId]
        );

        await db.query(
            `
      DELETE FROM user_library
      WHERE userId = ? AND courseId = ?
      `,
            [userId, courseId]
        );

        return res.status(200).json({
            success: true,
            message: "Course removed from student successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const updateStudent = async (req, res) => {
    try {
        const {
            userId,
            firstName,
            lastName,
            email,
            phoneNo,
            address,
            city,
            state,
            dob,
            isActive,
        } = req.body;

        const db = await connectToDatabase();

        await db.query(
            `
      UPDATE user_details
      SET
        firstName = ?,
        lastName = ?,
        email = ?,
        phoneNo = ?,
        address = ?,
        city = ?,
        state = ?,
        dob = ?,
        isActive = ?
      WHERE userId = ?
      `,
            [
                firstName,
                lastName,
                email,
                phoneNo,
                address,
                city,
                state,
                dob,
                isActive,
                userId,
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Student updated successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const deleteStudent = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required",
            });
        }

        const db = await connectToDatabase();

        const [result] = await db.query(
            "DELETE FROM user_details WHERE userId = ?",
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Student deleted successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};
