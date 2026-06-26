import { safeJSON, stringifyJSON } from "../helpers/jsonHelper.js";
import { connectToDatabase } from "../lib/db.js";
import {
  evaluateSingle,
  evaluateMultiple,
  evaluateBlank,
} from "../helpers/examHelper.js";
import { notifyUser } from "../helpers/notificationHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";

export const addExam = async (req, res) => {
  try {
    if (req.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can create exam",
      });
    }

    const {
      examType,
      courseId,
      chId,
      examTitle,
      examDesc,
      publishMode,
      scheduledPublishAt,
      durationMinutes,
      totalMarks,
      passingMarks,
      maxAttempts,
      checkingType = 0,
      isPublished,
    } = req.body;

    if (!courseId || !examTitle || !examType) {
      return res.status(400).json({
        success: false,
        message: "Course, exam type and title are required",
      });
    }

    if (examType === "chapter" && !chId) {
      return res.status(400).json({
        success: false,
        message: "Chapter is required for chapter test",
      });
    }

    const db = await connectToDatabase();

    if (examType === "course") {
      const [exists] = await db.query(
        `
        SELECT examId
        FROM exam_details
        WHERE courseId = ?
        AND examType = 'course'
        LIMIT 1
        `,
        [courseId]
      );

      if (exists.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Course test already exists for this course",
        });
      }
    }

    if (examType === "chapter") {
      const [exists] = await db.query(
        `
        SELECT examId
        FROM exam_details
        WHERE courseId = ?
        AND chId = ?
        AND examType = 'chapter'
        LIMIT 1
        `,
        [courseId, chId]
      );

      if (exists.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Chapter test already exists for this chapter",
        });
      }
    }

    const [result] = await db.query(
      `
      INSERT INTO exam_details
      (
        courseId,
        chId,
        examType,
        examTitle,
        examDesc,
        publishMode,
        scheduledPublishAt,
        durationMinutes,
        totalMarks,
        passingMarks,
        maxAttempts,
        checkingType,
        isPublished,
        createdBy
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        courseId,
        examType === "chapter" ? chId : null,
        examType,
        examTitle,
        examDesc || null,
        publishMode || "manual",
        publishMode === "scheduled" ? scheduledPublishAt : null,
        durationMinutes || 30,
        totalMarks || 0,
        passingMarks || 0,
        maxAttempts || 1,
        Number(checkingType || 0),
        publishMode === "scheduled" ? 0 : Number(isPublished || 0),
        req.userId,
      ]
    );

    return sendEncrypted(res, 201, {
      success: true,
      message: "Exam details saved successfully",
      data: {
        examId: result.insertId,
      },
    });
  } catch (err) {
    console.log("ADD EXAM ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const addExamQuestion = async (req, res) => {
  try {
    if (req.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can add questions",
      });
    }

    const {
      examId,
      questionType,
      questionText,
      displayText,
      options = [],
      correctAnswers = [],
      marks = 1,
    } = req.body;

    if (!examId || !questionType || !questionText) {
      return res.status(400).json({
        success: false,
        message: "Exam, question type and question are required",
      });
    }

    const db = await connectToDatabase();

    const [lastSeq] = await db.query(
      `
      SELECT COALESCE(MAX(sequenceNo), 0) + 1 AS nextSeq
      FROM exam_questions
      WHERE examId = ?
      `,
      [examId]
    );

    await db.query(
      `
      INSERT INTO exam_questions
      (
        examId,
        questionType,
        questionText,
        displayText,
        options,
        correctAnswers,
        marks,
        sequenceNo,
        isActive
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `,
      [
        Number(examId),
        questionType,
        questionText,
        displayText || questionText,
        stringifyJSON(options),
        stringifyJSON(correctAnswers),
        Number(marks) || 1,
        lastSeq[0].nextSeq,
      ]
    );

    return sendEncrypted(res, 201, {
      success: true,
      message: "Question added successfully",
      data: {},
    });
  } catch (err) {
    console.log("ADD QUESTION ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const updateExamAccessRules = async (req, res) => {
  try {
    if (req.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can update access rules",
      });
    }

    const {
      examId,
      requireCompletion,
      completionPercent,
      accessType,
      checkingType = 0,
      selectedStudents = [],
    } = req.body;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

    const db = await connectToDatabase();

    await db.query(
      `
      UPDATE exam_details
      SET
        requireCompletion = ?,
        completionPercent = ?,
        accessType = ?,
        checkingType = ?
      WHERE examId = ?
      `,
      [
        Number(requireCompletion),
        Number(completionPercent),
        accessType,
        Number(checkingType || 0),
        examId,
      ]
    );

    await db.query(
      `
      DELETE FROM exam_access_users
      WHERE examId = ?
      `,
      [examId]
    );

    if (accessType === "specific_students" && selectedStudents.length > 0) {
      const values = selectedStudents.map((userId) => [examId, userId, 1]);

      await db.query(
        `
        INSERT INTO exam_access_users
        (examId, userId, canAttempt)
        VALUES ?
        `,
        [values]
      );
    }

    return sendEncrypted(res, 200, {
      success: true,
      message: "Access rules updated successfully",
      data: {},
    });
  } catch (err) {
    console.log("UPDATE EXAM ACCESS RULES ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const publishExam = async (req, res) => {
  try {
    if (req.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can publish exam",
      });
    }

    const { examId } = req.body;
    const io = req.app.get("io");

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

    const db = await connectToDatabase();

    const [questions] = await db.query(
      `
      SELECT questionId
      FROM exam_questions
      WHERE examId = ? AND isActive = 1
      `,
      [examId]
    );

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please add at least one question before publishing",
      });
    }

    const [examRows] = await db.query(
      `
      SELECT examId, examTitle, courseId, examType, accessType
      FROM exam_details
      WHERE examId = ?
      `,
      [examId]
    );

    const exam = examRows[0];

    await db.query(
      `
      UPDATE exam_details
      SET isPublished = 1,
          publishedAt = NOW()
      WHERE examId = ?
      `,
      [examId]
    );

    let students = [];

    if (exam.accessType === "specific_students") {
      const [rows] = await db.query(
        `
        SELECT DISTINCT eau.userId
        FROM exam_access_users eau
        INNER JOIN user_details u ON u.userId = eau.userId
        WHERE eau.examId = ?
        AND eau.canAttempt = 1
        `,
        [exam.examId]
      );

      students = rows;
    } else {
      const [rows] = await db.query(
        `
        SELECT DISTINCT ul.userId
        FROM user_library ul
        INNER JOIN user_details u 
          ON u.userId = ul.userId
        WHERE ul.courseId = ?
        AND u.isActive = 1
        `,
        [exam.courseId]
      );

      students = rows;
    }

    for (const student of students) {
      const title =
        exam.examType === "chapter"
          ? "New Chapter Test Published"
          : "New Course Test Published";

      const message = `${exam.examTitle} is now available.`;

      await notifyUser(db, io, {
        userId: student.userId,
        title,
        message,
        type: "exam",
        examId: exam.examId,
      });
    }

    io?.to("admins").emit("newNotification", {
      title: "Exam Published",
      message: `${exam.examTitle} has been published.`,
      type: "exam",
      examId: exam.examId,
      isRead: 0,
      createdAt: new Date().toISOString(),
    });

    return sendEncrypted(res, 200, {
      success: true,
      message: "Exam published successfully",
      data: {},
    });
  } catch (err) {
    console.log("PUBLISH EXAM ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const getAvailableExams = async (req, res) => {
  try {
    const userId = req.userId;
    const db = await connectToDatabase();

    const [rows] = await db.query(
      `
      SELECT
        e.examId,
        e.courseId,
        e.chId,
        e.examType,
        e.examTitle,
        e.examDesc,
        e.durationMinutes,
        e.totalMarks,
        e.passingMarks,
        e.maxAttempts,
        e.requireCompletion,
        e.completionPercent,
        e.accessType,
        e.checkingType,
        c.courseName,
        chx.chapterName,

        COUNT(DISTINCT ch.chId) AS totalChapters,

        COALESCE(ROUND(AVG(COALESCE(ucp.progress, 0))), 0) AS courseProgress,

        COALESCE(MAX(chp.progress), 0) AS chapterProgress,

        (
          SELECT COUNT(*)
          FROM exam_attempts ea3
          WHERE ea3.examId = e.examId
          AND ea3.userId = ?
          AND ea3.status IN ('PASS', 'FAIL', 'PENDING_CHECK')
        ) AS attemptCount,

        latest_attempt.attemptId AS attemptId,
        latest_attempt.status AS attemptStatus,
        latest_attempt.obtainedMarks AS obtainedMarks,
        latest_attempt.totalMarks AS attemptTotalMarks

      FROM exam_details e

      INNER JOIN user_library ul
        ON ul.courseId = e.courseId
        AND ul.userId = ?

      LEFT JOIN exam_access_users eau
        ON eau.examId = e.examId
        AND eau.userId = ?
        AND eau.canAttempt = 1

      LEFT JOIN chapter_details ch
        ON ch.courseId = e.courseId

      LEFT JOIN user_chapter_progress ucp
        ON ucp.chId = ch.chId
        AND ucp.userId = ?

      LEFT JOIN user_chapter_progress chp
        ON chp.chId = e.chId
        AND chp.userId = ?

      LEFT JOIN exam_attempts latest_attempt
        ON latest_attempt.attemptId = (
          SELECT ea2.attemptId
          FROM exam_attempts ea2
          WHERE ea2.examId = e.examId
          AND ea2.userId = ?
          AND ea2.submittedAt IS NOT NULL
          ORDER BY ea2.attemptId DESC
          LIMIT 1
        )

      INNER JOIN course_details c
        ON c.courseId = e.courseId

      LEFT JOIN chapter_details chx
        ON chx.chId = e.chId

      WHERE e.isPublished = 1
      AND e.isActive = 1
      AND (
        e.accessType = 'all_course_students'
        OR eau.userId IS NOT NULL
      )

      GROUP BY
        e.examId,
        e.courseId,
        e.chId,
        e.examType,
        e.examTitle,
        e.examDesc,
        e.durationMinutes,
        e.totalMarks,
        e.passingMarks,
        e.maxAttempts,
        e.requireCompletion,
        e.completionPercent,
        e.accessType,
        e.checkingType,
        c.courseName,
        chx.chapterName,
        latest_attempt.attemptId,
        latest_attempt.status,
        latest_attempt.obtainedMarks,
        latest_attempt.totalMarks

      ORDER BY e.examId DESC
      `,
      [userId, userId, userId, userId, userId, userId]
    );

    const data = rows.map((exam) => {
      const currentProgress =
        exam.examType === "course"
          ? Number(exam.courseProgress || 0)
          : Number(exam.chapterProgress || 0);

      let canStart = true;
      let lockReason = null;

      const attemptStatus = exam.attemptStatus;

      const hasResult =
        Number(exam.attemptId) > 0 &&
        ["PASS", "FAIL", "PENDING_CHECK"].includes(attemptStatus);

      const isPendingCheck =
        Number(exam.attemptId) > 0 && attemptStatus === "PENDING_CHECK";

      const isPassed =
        Number(exam.attemptId) > 0 && attemptStatus === "PASS";

      const isFailed =
        Number(exam.attemptId) > 0 && attemptStatus === "FAIL";

      if (Number(exam.requireCompletion) === 1) {
        if (currentProgress < Number(exam.completionPercent)) {
          canStart = false;

          lockReason =
            exam.examType === "course"
              ? "Complete all chapters 100% to unlock course test."
              : "Complete this chapter 100% to unlock chapter test.";
        }
      }

      if (Number(exam.attemptCount) >= Number(exam.maxAttempts)) {
        canStart = false;
        lockReason = "Attempt limit reached.";
      }

      if (isPassed || isPendingCheck) {
        canStart = false;
        lockReason = null;
      }

      if (isFailed && Number(exam.attemptCount) < Number(exam.maxAttempts)) {
        canStart = true;
        lockReason = null;
      }

      return {
        ...exam,
        currentProgress,
        canStart,
        lockReason,
        hasResult,
        isPassed,
        isFailed,
        isPendingCheck,
        canTryAgain:
          isFailed && Number(exam.attemptCount) < Number(exam.maxAttempts),
      };
    });

    return sendEncrypted(res, 200, {
      success: true,
      data,
    });
  } catch (err) {
    console.log("GET AVAILABLE EXAMS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const startExam = async (req, res) => {
  try {
    const userId = req.userId;
    const { examId } = req.body;
    const db = await connectToDatabase();

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

    const [exams] = await db.query(
      `
      SELECT *
      FROM exam_details
      WHERE examId = ?
      AND isPublished = 1
      AND isActive = 1
      `,
      [examId]
    );

    if (exams.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found or not published",
      });
    }

    const exam = exams[0];

    const [library] = await db.query(
      `
      SELECT libraryId
      FROM user_library
      WHERE userId = ? AND courseId = ?
      `,
      [userId, exam.courseId]
    );

    if (library.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this course",
      });
    }

    if (exam.accessType === "specific_students") {
      const [access] = await db.query(
        `
        SELECT accessId
        FROM exam_access_users
        WHERE examId = ?
        AND userId = ?
        AND canAttempt = 1
        `,
        [examId, userId]
      );

      if (access.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to attempt this exam",
        });
      }
    }

    if (Number(exam.requireCompletion) === 1) {
      let currentProgress = 0;

      if (exam.examType === "chapter") {
        const [progress] = await db.query(
          `
          SELECT progress
          FROM user_chapter_progress
          WHERE userId = ? AND chId = ?
          `,
          [userId, exam.chId]
        );

        currentProgress = Number(progress[0]?.progress || 0);
      } else {
        const [progress] = await db.query(
          `
          SELECT ROUND(AVG(COALESCE(ucp.progress, 0))) AS courseProgress
          FROM chapter_details ch
          LEFT JOIN user_chapter_progress ucp
            ON ucp.chId = ch.chId
            AND ucp.userId = ?
          WHERE ch.courseId = ?
          `,
          [userId, exam.courseId]
        );

        currentProgress = Number(progress[0]?.courseProgress || 0);
      }

      if (currentProgress < Number(exam.completionPercent)) {
        return res.status(403).json({
          success: false,
          message:
            exam.examType === "course"
              ? "Complete all chapters to start course test"
              : "Complete this chapter to start chapter test",
        });
      }
    }

    const [attempts] = await db.query(
      `
        SELECT COUNT(*) AS total
        FROM exam_attempts
        WHERE examId = ? 
        AND userId = ?
        AND status IN ('PASS', 'FAIL')
        `,
      [examId, userId]
    );

    const attemptCount = Number(attempts[0].total || 0);

    if (attemptCount >= Number(exam.maxAttempts)) {
      return res.status(403).json({
        success: false,
        message: "Attempt limit reached",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO exam_attempts
      (
        examId,
        userId,
        attemptNo,
        totalMarks,
        status
      )
      VALUES (?, ?, ?, ?, 'started')
      `,
      [examId, userId, attemptCount + 1, exam.totalMarks]
    );

    return sendEncrypted(res, 201, {
      success: true,
      message: "Exam started",
      data: {
        attemptId: result.insertId,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const getExamStartInfo = async (req, res) => {
  try {
    const userId = req.userId;
    const { examId } = req.params;
    const db = await connectToDatabase();

    const [rows] = await db.query(
      `
      SELECT
        e.*,
        COUNT(DISTINCT eq.questionId) AS questionCount,
        COUNT(DISTINCT CASE 
        WHEN ea.status IN ('PASS', 'FAIL') THEN ea.attemptId 
        END) AS attemptCount
      FROM exam_details e

      INNER JOIN user_library ul
        ON ul.courseId = e.courseId
        AND ul.userId = ?

      LEFT JOIN exam_questions eq
        ON eq.examId = e.examId
        AND eq.isActive = 1

      LEFT JOIN exam_attempts ea
        ON ea.examId = e.examId
        AND ea.userId = ?

      WHERE e.examId = ?
      AND e.isPublished = 1
      AND e.isActive = 1

      GROUP BY e.examId
      `,
      [userId, userId, examId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not available",
      });
    }

    const exam = rows[0];

    return sendEncrypted(res, 200, {
      success: true,
      data: {
        ...exam,
        canStart: Number(exam.attemptCount) < Number(exam.maxAttempts),
        lockReason:
          Number(exam.attemptCount) >= Number(exam.maxAttempts)
            ? "Attempt limit reached"
            : null,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const getExamAttemptQuestions = async (req, res) => {
  try {
    const userId = req.userId;
    const { examId } = req.params;
    const { attemptId } = req.query;
    const db = await connectToDatabase();

    const [attempt] = await db.query(
      `
      SELECT attemptId
      FROM exam_attempts
      WHERE attemptId = ?
      AND examId = ?
      AND userId = ?
      AND status = 'started'
      `,
      [attemptId, examId, userId]
    );

    if (attempt.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Invalid exam attempt",
      });
    }

    const [examRows] = await db.query(
      `
      SELECT examId, examTitle, durationMinutes
      FROM exam_details
      WHERE examId = ?
      `,
      [examId]
    );

    const [questions] = await db.query(
      `
      SELECT
        questionId,
        questionType,
        questionText,
        displayText,
        options,
        correctAnswers,
        marks,
        sequenceNo
      FROM exam_questions
      WHERE examId = ?
      AND isActive = 1
      ORDER BY sequenceNo ASC
      `,
      [examId]
    );

    return sendEncrypted(res, 200, {
      success: true,
      data: {
        ...examRows[0],
        questions: questions.map((q) => ({
          ...q,
          options: safeJSON(q.options),
          correctAnswers:
            q.questionType === "essay"
              ? safeJSON(q.correctAnswers)
              : [],
        })),
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const submitExam = async (req, res) => {
  try {
    const userId = req.userId;
    const { attemptId, answers } = req.body;
    const db = await connectToDatabase();

    const [attemptRows] = await db.query(
      `
      SELECT ea.*, e.passingMarks, e.checkingType
      FROM exam_attempts ea
      INNER JOIN exam_details e ON e.examId = ea.examId
      WHERE ea.attemptId = ?
      AND ea.userId = ?
      AND ea.status = 'started'
      `,
      [attemptId, userId]
    );

    if (attemptRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Invalid attempt",
      });
    }

    const attempt = attemptRows[0];

    const [questions] = await db.query(
      `
      SELECT questionId, questionType, correctAnswers, marks
      FROM exam_questions
      WHERE examId = ?
      AND isActive = 1
      `,
      [attempt.examId]
    );

    let obtainedMarks = 0;

    for (const q of questions) {
      const submitted = answers?.[q.questionId];
      const correctAnswers = safeJSON(q.correctAnswers);

      let isCorrect = false;
      let marks = 0;
      let evaluation = null;
      let feedback = null;

      if (q.questionType === "essay") {
        if (Number(attempt.checkingType) === 1) {
          isCorrect = null;
          marks = 0;
          evaluation = {
            status: "PENDING_CHECK",
            message: "Essay answer requires manual checking by admin.",
          };
          feedback = "Pending manual checking.";
        } else {
          isCorrect = false;
          marks = 0;
          evaluation = {
            status: "AUTO_MODE_ESSAY_SKIPPED",
            message: "Essay question is not allowed in auto checking exam.",
          };
          feedback = "Essay question is not allowed for auto checking exam.";
        }
      } else if (q.questionType === "single") {
        const result = evaluateSingle(submitted, correctAnswers, q.marks);
        isCorrect = result.isCorrect;
        marks = result.marks;
      } else if (q.questionType === "multiple") {
        const result = evaluateMultiple(submitted, correctAnswers, q.marks);
        isCorrect = result.isCorrect;
        marks = result.marks;
      } else if (
        q.questionType === "dropdown_blank" ||
        q.questionType === "drag_drop_blank"
      ) {
        const result = evaluateBlank(submitted, correctAnswers, q.marks);
        isCorrect = result.isCorrect;
        marks = result.marks;
      }

      obtainedMarks += marks;

      await db.query(
        `
        INSERT INTO exam_attempt_answers
        (
          attemptId,
          questionId,
          submittedAnswer,
          isCorrect,
          obtainedMarks,
          evaluation,
          feedback
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          attemptId,
          q.questionId,
          stringifyJSON(submitted ?? null),
          isCorrect === null ? null : isCorrect ? 1 : 0,
          marks,
          evaluation ? stringifyJSON(evaluation) : null,
          feedback,
        ]
      );
    }

    const hasManualEssay =
      Number(attempt.checkingType) === 1 &&
      questions.some((q) => q.questionType === "essay");

    const finalStatus = hasManualEssay
      ? "PENDING_CHECK"
      : obtainedMarks >= Number(attempt.passingMarks)
        ? "PASS"
        : "FAIL";

    await db.query(
      `
      UPDATE exam_attempts
      SET
        obtainedMarks = ?,
        status = ?,
        submittedAt = NOW()
      WHERE attemptId = ?
      `,
      [obtainedMarks, finalStatus, attemptId]
    );

    return sendEncrypted(res, 200, {
      success: true,
      message: "Exam submitted",
      data: {
        attemptId,
        obtainedMarks,
        status: finalStatus,
      },
    });
  } catch (err) {
    console.log("SUBMIT EXAM ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const getExamResult = async (req, res) => {
  try {
    const userId = req.userId;
    const { attemptId } = req.params;
    const db = await connectToDatabase();

    const [rows] = await db.query(
      `
      SELECT
        ea.attemptId,
        ea.examId,
        ea.totalMarks,
        ea.obtainedMarks,
        ea.status,
        ea.submittedAt,
        e.examTitle,
        e.passingMarks,
        e.maxAttempts
      FROM exam_attempts ea
      INNER JOIN exam_details e
        ON e.examId = ea.examId
      WHERE ea.attemptId = ?
      AND ea.userId = ?
      LIMIT 1
      `,
      [attemptId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    const result = rows[0];

    const [attemptCountRows] = await db.query(
      `
      SELECT COUNT(*) AS usedAttempts
      FROM exam_attempts
      WHERE examId = ?
      AND userId = ?
      AND status IN ('PASS', 'FAIL')
      `,
      [result.examId, userId]
    );

    const usedAttempts = Number(attemptCountRows[0]?.usedAttempts || 0);
    const maxAttempts = Number(result.maxAttempts || 1);
    const remainingAttempts = Math.max(maxAttempts - usedAttempts, 0);
    const canTryAgain = result.status === "FAIL" && remainingAttempts > 0;

    const [questionRows] = await db.query(
      `
      SELECT
        q.questionId,
        q.questionType,
        q.questionText,
        q.displayText,
        q.options,
        q.correctAnswers,
        q.marks,
        aa.submittedAnswer AS userAnswer,
        aa.isCorrect,
        aa.obtainedMarks AS questionObtainedMarks,
        aa.evaluation,
        aa.feedback
      FROM exam_questions q
      LEFT JOIN exam_attempt_answers aa
        ON aa.questionId = q.questionId
        AND aa.attemptId = ?
      WHERE q.examId = ?
      ORDER BY q.questionId ASC
      `,
      [attemptId, result.examId]
    );

    const questions = questionRows.map((q) => {
      const options = safeJSON(q.options, []);
      const correctAnswers = safeJSON(q.correctAnswers, []);
      const evaluation = safeJSON(q.evaluation, null);
      const userAnswer = safeJSON(q.userAnswer, q.userAnswer);

      return {
        ...q,
        options,
        correctAnswers,
        userAnswer,
        evaluation,
        feedback: q.feedback,
        isCorrect: Number(q.isCorrect) === 1,
      };
    });

    return sendEncrypted(res, 200, {
      success: true,
      data: {
        ...result,
        usedAttempts,
        maxAttempts,
        remainingAttempts,
        canTryAgain,
        questions,
      },
    });
  } catch (err) {
    console.log("GET EXAM RESULT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const getExamQuestionsAdmin = async (req, res) => {
  try {
    const { examId } = req.params;
    const db = await connectToDatabase();

    const [rows] = await db.query(
      `
      SELECT *
      FROM exam_questions
      WHERE examId = ?
      AND isActive = 1
      ORDER BY sequenceNo ASC
      `,
      [examId]
    );

    return sendEncrypted(res, 200, {
      success: true,
      data: rows.map((q) => ({
        ...q,
        options: safeJSON(q.options),
        correctAnswers: safeJSON(q.correctAnswers),
      })),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const updateExamQuestion = async (req, res) => {
  try {
    const {
      questionId,
      questionType,
      questionText,
      displayText,
      options = [],
      correctAnswers = [],
      marks = 1,
    } = req.body;

    const db = await connectToDatabase();

    await db.query(
      `
      UPDATE exam_questions
      SET
        questionType = ?,
        questionText = ?,
        displayText = ?,
        options = ?,
        correctAnswers = ?,
        marks = ?
      WHERE questionId = ?
      `,
      [
        questionType,
        questionText,
        displayText || questionText,
        stringifyJSON(options),
        stringifyJSON(correctAnswers),
        Number(marks) || 1,
        questionId,
      ]
    );

    return sendEncrypted(res, 200, {
      success: true,
      message: "Question updated successfully",
      data: {},
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const deleteExamQuestion = async (req, res) => {
  try {
    const { questionId } = req.body;
    const db = await connectToDatabase();

    await db.query(
      `
      UPDATE exam_questions
      SET isActive = 0
      WHERE questionId = ?
      `,
      [questionId]
    );

    return sendEncrypted(res, 200, {
      success: true,
      message: "Question deleted successfully",
      data: {},
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const getAllExams = async (req, res) => {
  try {
    if (req.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can view exams",
      });
    }

    const db = await connectToDatabase();

    const [rows] = await db.query(`
      SELECT
        examId,
        courseId,
        chId,
        examType,
        examTitle,
        examDesc,
        publishMode,
        scheduledPublishAt,
        publishedAt,
        durationMinutes,
        totalMarks,
        passingMarks,
        maxAttempts,
        accessType,
        checkingType,
        requireCompletion,
        completionPercent,
        isPublished,
        isActive,
        createdBy,
        createdAt,
        updatedAt
      FROM exam_details
      ORDER BY examId DESC
    `);

    return sendEncrypted(res, 200, {
      success: true,
      data: rows,
    });
  } catch (err) {
    console.log("GET ALL EXAMS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const deleteExam = async (req, res) => {
  try {
    if (req.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete exam",
      });
    }

    const { examId } = req.body;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

    const db = await connectToDatabase();

    const [exists] = await db.query(
      `SELECT examId FROM exam_details WHERE examId = ? LIMIT 1`,
      [examId]
    );

    if (exists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    await db.query(`DELETE FROM exam_details WHERE examId = ?`, [examId]);

    return sendEncrypted(res, 200, {
      success: true,
      message: "Exam deleted successfully",
      data: {},
    });
  } catch (err) {
    console.log("DELETE EXAM ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const updateExam = async (req, res) => {
  try {
    if (req.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can update exam",
      });
    }

    const {
      examId,
      examType,
      courseId,
      chId,
      examTitle,
      examDesc,
      publishMode,
      scheduledPublishAt,
      durationMinutes,
      totalMarks,
      passingMarks,
      maxAttempts,
      checkingType = 0,
      isPublished,
    } = req.body;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

    const db = await connectToDatabase();

    const [publishedRows] = await db.query(
      `
      SELECT isPublished
      FROM exam_details
      WHERE examId = ?
      LIMIT 1
      `,
      [examId]
    );

    if (publishedRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    if (Number(publishedRows[0].isPublished) === 1) {
      return res.status(403).json({
        success: false,
        message: "Published exam cannot be edited",
      });
    }

    await db.query(
      `
      UPDATE exam_details
      SET
        examType = ?,
        courseId = ?,
        chId = ?,
        examTitle = ?,
        examDesc = ?,
        publishMode = ?,
        scheduledPublishAt = ?,
        durationMinutes = ?,
        totalMarks = ?,
        passingMarks = ?,
        maxAttempts = ?,
        checkingType = ?,
        isPublished = ?
      WHERE examId = ?
      `,
      [
        examType,
        courseId,
        examType === "chapter" ? chId : null,
        examTitle,
        examDesc || null,
        publishMode || "manual",
        publishMode === "scheduled"
          ? scheduledPublishAt
          : null,
        durationMinutes || 30,
        totalMarks || 0,
        passingMarks || 0,
        maxAttempts || 1,
        Number(checkingType || 0),
        isPublished || 0,
        examId,
      ],
    );

    return sendEncrypted(res, 200, {
      success: true,
      message: "Exam updated successfully",
      data: {
        examId,
      },
    });
  } catch (err) {
    console.log("UPDATE EXAM ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const getExamById = async (req, res) => {
  try {
    if (req.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can view exam",
      });
    }

    const { examId } = req.params;
    const db = await connectToDatabase();

    const [rows] = await db.query(
      `
      SELECT *
      FROM exam_details
      WHERE examId = ?
      LIMIT 1
      `,
      [examId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    return sendEncrypted(res, 200, {
      success: true,
      data: rows[0],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const getPendingEssayAttempts = async (req, res) => {
  try {
    if (req.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can view pending essays",
      });
    }

    const db = await connectToDatabase();

    const [rows] = await db.query(`
      SELECT
        ea.attemptId,
        ea.examId,
        ea.userId,
        ea.totalMarks,
        ea.obtainedMarks,
        ea.status,
        ea.submittedAt,

        e.examTitle,
        e.examType,
        e.passingMarks,

        c.courseName,
        ch.chapterName,

        CONCAT(u.firstName, ' ', u.lastName) AS studentName,
        u.email,

        COUNT(eq.questionId) AS essayQuestionCount

      FROM exam_attempts ea

      INNER JOIN exam_details e
        ON e.examId = ea.examId

      INNER JOIN course_details c
        ON c.courseId = e.courseId

      LEFT JOIN chapter_details ch
        ON ch.chId = e.chId

      INNER JOIN user_details u
        ON u.userId = ea.userId

      INNER JOIN exam_questions eq
        ON eq.examId = e.examId
        AND eq.questionType = 'essay'
        AND eq.isActive = 1

      WHERE ea.status = 'PENDING_CHECK'
      AND ea.submittedAt IS NOT NULL

      GROUP BY
        ea.attemptId,
        ea.examId,
        ea.userId,
        ea.totalMarks,
        ea.obtainedMarks,
        ea.status,
        ea.submittedAt,
        e.examTitle,
        e.examType,
        e.passingMarks,
        c.courseName,
        ch.chapterName,
        u.firstName,
        u.lastName,
        u.email

      ORDER BY ea.submittedAt DESC
    `);

    return sendEncrypted(res, 200, {
      success: true,
      data: rows,
    });
  } catch (err) {
    console.log("GET PENDING ESSAYS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const getEssayCheckDetails = async (req, res) => {
  try {
    if (req.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can check essays",
      });
    }

    const { attemptId } = req.params;
    const db = await connectToDatabase();

    const [attemptRows] = await db.query(
      `
      SELECT
        ea.attemptId,
        ea.examId,
        ea.userId,
        ea.totalMarks AS attemptTotalMarks,
        ea.obtainedMarks AS attemptObtainedMarks,
        ea.status,

        e.examTitle,
        e.passingMarks,
        e.checkingType,

        c.courseName,

        CONCAT(u.firstName, ' ', u.lastName) AS studentName,
        u.email
      FROM exam_attempts ea
      INNER JOIN exam_details e ON e.examId = ea.examId
      INNER JOIN course_details c ON c.courseId = e.courseId
      INNER JOIN user_details u ON u.userId = ea.userId
      WHERE ea.attemptId = ?
      AND ea.status = 'PENDING_CHECK'
      LIMIT 1
      `,
      [attemptId]
    );

    if (attemptRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pending attempt not found",
      });
    }

    const attempt = attemptRows[0];

    const [questionRows] = await db.query(
      `
      SELECT
        q.questionId,
        q.questionType,
        q.questionText,
        q.displayText,
        q.options,
        q.correctAnswers,
        q.marks AS totalMarks,

        aa.answerId,
        aa.submittedAnswer,
        aa.isCorrect,
        aa.obtainedMarks,
        aa.feedback,
        aa.evaluation
      FROM exam_questions q
      LEFT JOIN exam_attempt_answers aa
        ON aa.questionId = q.questionId
        AND aa.attemptId = ?
      WHERE q.examId = ?
      AND q.isActive = 1
      ORDER BY q.sequenceNo ASC
      `,
      [attemptId, attempt.examId]
    );

    const questions = questionRows.map((q) => ({
      ...q,
      questionText: q.displayText || q.questionText,
      options: safeJSON(q.options, []),
      correctAnswers: safeJSON(q.correctAnswers, []),
      studentAnswer: safeJSON(q.submittedAnswer, q.submittedAnswer),
      evaluation: safeJSON(q.evaluation, null),
      totalMarks: Number(q.totalMarks || 0),
      obtainedMarks: Number(q.obtainedMarks || 0),
      isEssay: q.questionType === "essay",
      isChecked:
        q.questionType !== "essay" ||
        safeJSON(q.evaluation, {})?.manualCheck === true,
    }));

    return sendEncrypted(res, 200, {
      success: true,
      data: {
        ...attempt,
        questions,
      },
    });
  } catch (err) {
    console.log("GET ESSAY CHECK DETAILS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const checkEssayManually = async (req, res) => {
  try {
    if (req.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can check essay answers",
      });
    }

    const { attemptId, answerId, obtainedMarks, adminRemark } = req.body;

    if (!attemptId || !answerId || obtainedMarks === undefined) {
      return res.status(400).json({
        success: false,
        message: "Attempt ID, Answer ID and marks are required",
      });
    }

    const db = await connectToDatabase();

    const [answerRows] = await db.query(
      `
      SELECT
        aa.answerId,
        aa.attemptId,
        aa.questionId,
        q.marks
      FROM exam_attempt_answers aa
      INNER JOIN exam_questions q ON q.questionId = aa.questionId
      WHERE aa.answerId = ?
      AND aa.attemptId = ?
      AND q.questionType = 'essay'
      LIMIT 1
      `,
      [answerId, attemptId]
    );

    if (answerRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Essay answer not found",
      });
    }

    const answer = answerRows[0];

    if (Number(obtainedMarks) > Number(answer.marks)) {
      return res.status(400).json({
        success: false,
        message: "Marks cannot be greater than question marks",
      });
    }

    await db.query(
      `
      UPDATE exam_attempt_answers
      SET
        obtainedMarks = ?,
        isCorrect = ?,
        feedback = ?,
        evaluation = ?
      WHERE answerId = ?
      `,
      [
        Number(obtainedMarks),
        Number(obtainedMarks) >= Number(answer.marks) * 0.4 ? 1 : 0,
        adminRemark || null,
        stringifyJSON({
          checkedBy: req.userId,
          checkedAt: new Date().toISOString(),
          manualCheck: true,
        }),
        answerId,
      ]
    );

    const [pendingEssayRows] = await db.query(
      `
      SELECT COUNT(*) AS pendingCount
      FROM exam_attempt_answers aa
      INNER JOIN exam_questions q ON q.questionId = aa.questionId
      WHERE aa.attemptId = ?
      AND q.questionType = 'essay'
      AND (
        aa.evaluation IS NULL
        OR JSON_EXTRACT(aa.evaluation, '$.manualCheck') IS NULL
        OR JSON_EXTRACT(aa.evaluation, '$.manualCheck') = false
      )
      `,
      [attemptId]
    );

    const pendingCount = Number(pendingEssayRows[0]?.pendingCount || 0);

    if (pendingCount > 0) {
      return sendEncrypted(res, 200, {
        success: true,
        message: "Essay answer saved. More essays pending.",
        data: {
          completed: false,
        },
      });
    }

    const [sumRows] = await db.query(
      `
      SELECT COALESCE(SUM(obtainedMarks), 0) AS finalObtainedMarks
      FROM exam_attempt_answers
      WHERE attemptId = ?
      `,
      [attemptId]
    );

    const finalObtainedMarks = Number(sumRows[0].finalObtainedMarks || 0);

    const [attemptRows] = await db.query(
      `
      SELECT
        ea.userId,
        ea.examId,
        e.examTitle,
        e.passingMarks
      FROM exam_attempts ea
      INNER JOIN exam_details e ON e.examId = ea.examId
      WHERE ea.attemptId = ?
      LIMIT 1
      `,
      [attemptId]
    );

    const attempt = attemptRows[0];
    const finalStatus =
      finalObtainedMarks >= Number(attempt.passingMarks) ? "PASS" : "FAIL";

    await db.query(
      `
      UPDATE exam_attempts
      SET obtainedMarks = ?, status = ?
      WHERE attemptId = ?
      `,
      [finalObtainedMarks, finalStatus, attemptId]
    );

    const io = req.app.get("io");

    await notifyUser(db, io, {
      userId: attempt.userId,
      title: "Exam Result Published",
      message: `${attempt.examTitle} result is now available. Status: ${finalStatus}`,
      type: "exam_result",
      examId: attempt.examId,
      attemptId,
    });

    return sendEncrypted(res, 200, {
      success: true,
      message: "All essays checked successfully",
      data: {
        completed: true,
        obtainedMarks: finalObtainedMarks,
        status: finalStatus,
      },
    });
  } catch (err) {
    console.log("CHECK ESSAY MANUALLY ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const updateQuestionSequence = async (req, res) => {
  try {
    const { examId, questions } = req.body;

    if (!examId || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: "examId and questions are required",
      });
    }

    const db = await connectToDatabase();

    for (const item of questions) {
      await db.query(
        `
        UPDATE exam_questions
        SET sequenceNo = ?
        WHERE questionId = ?
        AND examId = ?
        `,
        [item.sequenceNo, item.questionId, examId]
      );
    }

    return sendEncrypted(res, 200, {
      success: true,
      message: "Question sequence updated successfully",
      data: {},
    });
  } catch (error) {
    console.error("UPDATE QUESTION SEQUENCE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update question sequence",
    });
  }
};