import bcrypt from "bcrypt";
import { asyncHandler } from "../helpers/asyncHandler.js";
import { runQuery } from "../helpers/dbHelper.js";
import { sendError } from "../helpers/responseHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";
import { requireAdmin } from "../helpers/authHelper.js";

const isSuperAdmin = (req) => req.userRole === "super_admin";

const requireOrganization = (req, res) => {
    if (!isSuperAdmin(req) && !req.organizationId) {
        sendError(res, "Organization not found", 400);
        return false;
    }
    return true;
};

const orgFilter = (req, alias = "") => {
    if (isSuperAdmin(req)) return "";
    return `AND ${alias ? `${alias}.` : ""}organizationId = ?`;
};

const orgParam = (req) => {
    return isSuperAdmin(req) ? [] : [req.organizationId];
};

export const getStudents = asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;
    if (!requireOrganization(req, res)) return;

    const rows = await runQuery(
        `
    SELECT 
      userId, firstName, lastName, email, phoneNo,
      address, city, state, dob, isActive, organizationId
    FROM user_details
    WHERE 1=1 ${orgFilter(req)}
    ORDER BY userId DESC
    `,
        orgParam(req)
    );

    return sendEncrypted(res, 200, {
        success: true,
        message: "Students fetched successfully",
        data: rows,
    });
});

export const addStudent = asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;
    if (!requireOrganization(req, res)) return;

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

    const exists = await runQuery(
        `
    SELECT userId
    FROM user_details
    WHERE email = ?
    LIMIT 1
    `,
        [email]
    );

    if (exists.length > 0) {
        return sendError(res, "Student email already exists", 409);
    }

    const hashPassword = await bcrypt.hash(password, 10);

    await runQuery(
        `
    INSERT INTO user_details
    (
      firstName, lastName, email, password, phoneNo,
      address, city, state, dob, isActive, organizationId
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            isSuperAdmin(req) ? req.body.organizationId || null : req.organizationId,
        ]
    );

    return sendEncrypted(res, 201, {
        success: true,
        message: "Student added successfully",
        data: {},
    });
});

export const getStudentDetailsWithCourses = asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;
    if (!requireOrganization(req, res)) return;

    const { userId } = req.params;

    if (!userId) {
        return sendError(res, "Student ID is required", 400);
    }

    const studentRows = await runQuery(
        `
    SELECT userId, firstName, lastName, email, phoneNo,
           address, city, state, dob, isActive, organizationId
    FROM user_details
    WHERE userId = ?
    ${orgFilter(req)}
    LIMIT 1
    `,
        [userId, ...orgParam(req)]
    );

    if (studentRows.length === 0) {
        return sendError(res, "Student not found", 404);
    }

    const courses = await runQuery(
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
    ${orgFilter(req, "c")}
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
        [userId, ...orgParam(req)]
    );

    return sendEncrypted(res, 200, {
        success: true,
        message: "Student details fetched successfully",
        data: {
            student: studentRows[0],
            courses,
        },
    });
});

export const getStudentCourseProgress = asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;
    if (!requireOrganization(req, res)) return;

    const { userId, courseId } = req.params;

    if (!userId || !courseId) {
        return sendError(res, "Student ID and Course ID are required", 400);
    }

    const chapters = await runQuery(
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
    INNER JOIN course_details c ON c.courseId = ch.courseId
    LEFT JOIN user_chapter_progress ucp
      ON ucp.chId = ch.chId
      AND ucp.courseId = ch.courseId
      AND ucp.userId = ?
    WHERE ch.courseId = ?
    ${orgFilter(req, "c")}
    ORDER BY ch.createdAt ASC
    `,
        [userId, courseId, ...orgParam(req)]
    );

    return sendEncrypted(res, 200, {
        success: true,
        message: "Student course progress fetched successfully",
        data: chapters,
    });
});

export const resetStudentCourseProgress = asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;
    if (!requireOrganization(req, res)) return;

    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
        return sendError(res, "Student ID and Course ID are required", 400);
    }

    await runQuery(
        `
    DELETE ucp
    FROM user_chapter_progress ucp
    INNER JOIN course_details c ON c.courseId = ucp.courseId
    WHERE ucp.userId = ?
      AND ucp.courseId = ?
      ${orgFilter(req, "c")}
    `,
        [userId, courseId, ...orgParam(req)]
    );

    return sendEncrypted(res, 200, {
        success: true,
        message: "Course progress reset successfully",
        data: {},
    });
});

export const resetStudentAllProgress = asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;
    if (!requireOrganization(req, res)) return;

    const { userId } = req.body;

    if (!userId) {
        return sendError(res, "Student ID is required", 400);
    }

    await runQuery(
        `
    DELETE ucp
    FROM user_chapter_progress ucp
    INNER JOIN course_details c ON c.courseId = ucp.courseId
    WHERE ucp.userId = ?
    ${orgFilter(req, "c")}
    `,
        [userId, ...orgParam(req)]
    );

    return sendEncrypted(res, 200, {
        success: true,
        message: "All progress reset successfully",
        data: {},
    });
});

export const resetChapterProgress = asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;
    if (!requireOrganization(req, res)) return;

    const { userId, courseId, chId } = req.body;

    if (!userId || !courseId || !chId) {
        return sendError(res, "User ID, Course ID and Chapter ID are required", 400);
    }

    await runQuery(
        `
    DELETE ucp
    FROM user_chapter_progress ucp
    INNER JOIN course_details c ON c.courseId = ucp.courseId
    WHERE ucp.userId = ?
      AND ucp.courseId = ?
      AND ucp.chId = ?
      ${orgFilter(req, "c")}
    `,
        [userId, courseId, chId, ...orgParam(req)]
    );

    return sendEncrypted(res, 200, {
        success: true,
        message: "Chapter progress reset successfully",
        data: {},
    });
});

export const removeStudentCourse = asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;
    if (!requireOrganization(req, res)) return;

    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
        return sendError(res, "Student ID and Course ID are required", 400);
    }

    await runQuery(
        `
    DELETE ucp
    FROM user_chapter_progress ucp
    INNER JOIN course_details c ON c.courseId = ucp.courseId
    WHERE ucp.userId = ?
      AND ucp.courseId = ?
      ${orgFilter(req, "c")}
    `,
        [userId, courseId, ...orgParam(req)]
    );

    await runQuery(
        `
    DELETE ul
    FROM user_library ul
    INNER JOIN course_details c ON c.courseId = ul.courseId
    WHERE ul.userId = ?
      AND ul.courseId = ?
      ${orgFilter(req, "c")}
    `,
        [userId, courseId, ...orgParam(req)]
    );

    return sendEncrypted(res, 200, {
        success: true,
        message: "Course removed from student successfully",
        data: {},
    });
});

export const updateStudent = asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;
    if (!requireOrganization(req, res)) return;

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

    const emailExists = await runQuery(
        `
    SELECT userId 
    FROM user_details 
    WHERE email = ?
      AND userId != ?
    LIMIT 1
    `,
        [email, userId]
    );

    if (emailExists.length > 0) {
        return sendError(res, "Email already used by another student", 409);
    }

    const result = await runQuery(
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
    ${orgFilter(req)}
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
            ...orgParam(req),
        ]
    );

    if (result.affectedRows === 0) {
        return sendError(res, "Student not found", 404);
    }

    return sendEncrypted(res, 200, {
        success: true,
        message: "Student updated successfully",
        data: {},
    });
});

export const deleteStudent = asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;
    if (!requireOrganization(req, res)) return;

    const { userId } = req.body;

    if (!userId) {
        return sendError(res, "Student ID is required", 400);
    }

    const result = await runQuery(
        `
    DELETE FROM user_details
    WHERE userId = ?
    ${orgFilter(req)}
    `,
        [userId, ...orgParam(req)]
    );

    if (result.affectedRows === 0) {
        return sendError(res, "Student not found", 404);
    }

    return sendEncrypted(res, 200, {
        success: true,
        message: "Student deleted successfully",
        data: {},
    });
});