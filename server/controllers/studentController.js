import bcrypt from "bcrypt";
import { asyncHandler } from "../helpers/asyncHandler.js";
import { getDb } from "../helpers/dbHelper.js";
import { sendSuccess, sendError } from "../helpers/responseHelper.js";
import { requireAdmin } from "../helpers/authHelper.js";

export const getStudents = asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const db = await getDb();

    const [rows] = await db.query(`
    SELECT 
      userId, firstName, lastName, email, phoneNo,
      address, city, state, dob, isActive
    FROM user_details
    ORDER BY userId DESC
  `);

    return sendSuccess(res, rows, "Students fetched successfully");
});

export const addStudent = asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;

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

    if (!firstName || !email || !password) {
        return sendError(res, "First name, email and password are required", 400);
    }

    const db = await getDb();

    const [exists] = await db.query(
        `SELECT userId FROM user_details WHERE email = ? LIMIT 1`,
        [email]
    );

    if (exists.length > 0) {
        return sendError(res, "Student email already exists", 409);
    }

    const hashPassword = await bcrypt.hash(password, 10);

    await db.query(
        `
    INSERT INTO user_details
    (
      firstName, lastName, email, password, phoneNo,
      address, city, state, dob, isActive
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
            firstName,
            lastName || null,
            email,
            hashPassword,
            phoneNo || null,
            address || null,
            city || null,
            state || null,
            dob || null,
            isActive ?? 1,
        ]
    );

    return sendSuccess(res, {}, "Student added successfully", 201);
});

export const getStudentDetailsWithCourses = asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const { userId } = req.params;

    if (!userId) {
        return sendError(res, "Student ID is required", 400);
    }

    const db = await getDb();

    const [studentRows] = await db.query(
        `
    SELECT userId, firstName, lastName, email, phoneNo,
           address, city, state, dob, isActive
    FROM user_details
    WHERE userId = ?
    LIMIT 1
    `,
        [userId]
    );

    if (studentRows.length === 0) {
        return sendError(res, "Student not found", 404);
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

    return sendSuccess(
        res,
        {
            student: studentRows[0],
            courses,
        },
        "Student details fetched successfully"
    );
});

export const getStudentCourseProgress = asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const { userId, courseId } = req.params;

    if (!userId || !courseId) {
        return sendError(res, "Student ID and Course ID are required", 400);
    }

    const db = await getDb();

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

    return sendSuccess(
        res,
        chapters,
        "Student course progress fetched successfully"
    );
});

export const resetStudentCourseProgress = asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
        return sendError(res, "Student ID and Course ID are required", 400);
    }

    const db = await getDb();

    await db.query(
        `
    DELETE FROM user_chapter_progress
    WHERE userId = ? AND courseId = ?
    `,
        [userId, courseId]
    );

    return sendSuccess(res, {}, "Course progress reset successfully");
});

export const resetStudentAllProgress = asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const { userId } = req.body;

    if (!userId) {
        return sendError(res, "Student ID is required", 400);
    }

    const db = await getDb();

    await db.query(
        `
    DELETE FROM user_chapter_progress
    WHERE userId = ?
    `,
        [userId]
    );

    return sendSuccess(res, {}, "All progress reset successfully");
});

export const resetChapterProgress = asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const { userId, courseId, chId } = req.body;

    if (!userId || !courseId || !chId) {
        return sendError(res, "User ID, Course ID and Chapter ID are required", 400);
    }

    const db = await getDb();

    await db.query(
        `
    DELETE FROM user_chapter_progress
    WHERE userId = ? AND courseId = ? AND chId = ?
    `,
        [userId, courseId, chId]
    );

    return sendSuccess(res, {}, "Chapter progress reset successfully");
});

export const removeStudentCourse = asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
        return sendError(res, "Student ID and Course ID are required", 400);
    }

    const db = await getDb();

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

    return sendSuccess(res, {}, "Course removed from student successfully");
});

export const updateStudent = asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;

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

    if (!userId) {
        return sendError(res, "Student ID is required", 400);
    }

    if (!firstName || !email) {
        return sendError(res, "First name and email are required", 400);
    }

    const db = await getDb();

    const [emailExists] = await db.query(
        `
    SELECT userId 
    FROM user_details 
    WHERE email = ? AND userId != ?
    LIMIT 1
    `,
        [email, userId]
    );

    if (emailExists.length > 0) {
        return sendError(res, "Email already used by another student", 409);
    }

    const [result] = await db.query(
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
            lastName || null,
            email,
            phoneNo || null,
            address || null,
            city || null,
            state || null,
            dob || null,
            isActive ?? 1,
            userId,
        ]
    );

    if (result.affectedRows === 0) {
        return sendError(res, "Student not found", 404);
    }

    return sendSuccess(res, {}, "Student updated successfully");
});

export const deleteStudent = asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const { userId } = req.body;

    if (!userId) {
        return sendError(res, "Student ID is required", 400);
    }

    const db = await getDb();

    const [result] = await db.query(
        `DELETE FROM user_details WHERE userId = ?`,
        [userId]
    );

    if (result.affectedRows === 0) {
        return sendError(res, "Student not found", 404);
    }

    return sendSuccess(res, {}, "Student deleted successfully");
});