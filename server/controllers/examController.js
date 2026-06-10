import { connectToDatabase } from "../lib/db.js";

const safeJSON = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
};

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
      durationMinutes,
      totalMarks,
      passingMarks,
      maxAttempts,
      accessType,
      requireCompletion,
      completionPercent,
      isPublished,
      selectedStudents,
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

    const [result] = await db.query(
      `
      INSERT INTO exam_details
      (
        courseId,
        chId,
        examType,
        examTitle,
        examDesc,
        durationMinutes,
        totalMarks,
        passingMarks,
        maxAttempts,
        accessType,
        requireCompletion,
        completionPercent,
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
        durationMinutes || 30,
        totalMarks || 0,
        passingMarks || 0,
        maxAttempts || 1,
        accessType || "all_course_students",
        requireCompletion ?? 1,
        completionPercent || 100,
        isPublished || 0,
        req.userId,
      ]
    );

    const examId = result.insertId;

    if (
      accessType === "specific_students" &&
      Array.isArray(selectedStudents) &&
      selectedStudents.length > 0
    ) {
      const values = selectedStudents.map((userId) => [
        examId,
        userId,
        1,
      ]);

      await db.query(
        `
        INSERT INTO exam_access_users
        (examId, userId, canAttempt)
        VALUES ?
        `,
        [values]
      );
    }

    return res.status(201).json({
      success: true,
      message: "Exam created successfully",
      examId,
    });
  } catch (err) {
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
      options,
      correctAnswers,
      marks,
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
        sequenceNo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        examId,
        questionType,
        questionText,
        displayText || questionText,
        JSON.stringify(options || []),
        JSON.stringify(correctAnswers || []),
        marks || 1,
        lastSeq[0].nextSeq,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Question added successfully",
    });
  } catch (err) {
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

    await db.query(
      `
      UPDATE exam_details
      SET isPublished = 1
      WHERE examId = ?
      `,
      [examId]
    );

    return res.status(200).json({
      success: true,
      message: "Exam published successfully",
    });
  } catch (err) {
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

        COUNT(DISTINCT ch.chId) AS totalChapters,

        COALESCE(
          ROUND(AVG(COALESCE(ucp.progress, 0))),
          0
        ) AS courseProgress,

        COALESCE(
          MAX(chp.progress),
          0
        ) AS chapterProgress,

        COUNT(DISTINCT ea.attemptId) AS attemptCount

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

      LEFT JOIN exam_attempts ea
        ON ea.examId = e.examId
        AND ea.userId = ?

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
        e.accessType

      ORDER BY e.examId DESC
      `,
      [userId, userId, userId, userId, userId]
    );

    const data = rows.map((exam) => {
      const currentProgress =
        exam.examType === "course"
          ? Number(exam.courseProgress || 0)
          : Number(exam.chapterProgress || 0);

      let canStart = true;
      let lockReason = null;

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

      return {
        ...exam,
        currentProgress,
        canStart,
        lockReason,
      };
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
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
      WHERE examId = ? AND userId = ?
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

    return res.status(201).json({
      success: true,
      message: "Exam started",
      attemptId: result.insertId,
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
        COUNT(eq.questionId) AS questionCount,
        COUNT(ea.attemptId) AS attemptCount
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

    return res.json({
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
        marks,
        sequenceNo
      FROM exam_questions
      WHERE examId = ?
      AND isActive = 1
      ORDER BY sequenceNo ASC
      `,
      [examId]
    );

    return res.json({
      success: true,
      data: {
        ...examRows[0],
        questions: questions.map((q) => ({
          ...q,
          options: safeJSON(q.options),
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
      SELECT ea.*, e.passingMarks
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

      if (q.questionType === "single") {
        isCorrect = correctAnswers.some((c) => c.answer === submitted);
      }

      if (q.questionType === "multiple") {
        const correct = correctAnswers.map((c) => c.answer).sort();
        const given = Array.isArray(submitted) ? [...submitted].sort() : [];

        isCorrect =
          correct.length === given.length &&
          correct.every((ans, index) => ans === given[index]);
      }

      if (
        q.questionType === "dropdown_blank" ||
        q.questionType === "drag_drop_blank"
      ) {
        const correct = correctAnswers.map((c) => c.answer).sort();
        const given = Array.isArray(submitted) ? [...submitted].sort() : [];

        isCorrect =
          correct.length === given.length &&
          correct.every((ans, index) => ans === given[index]);
      }

      const marks = isCorrect ? Number(q.marks) : 0;
      obtainedMarks += marks;

      await db.query(
        `
        INSERT INTO exam_attempt_answers
        (
          attemptId,
          questionId,
          submittedAnswer,
          isCorrect,
          obtainedMarks
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          attemptId,
          q.questionId,
          JSON.stringify(submitted || null),
          isCorrect ? 1 : 0,
          marks,
        ]
      );
    }

    const finalStatus =
      obtainedMarks >= Number(attempt.passingMarks) ? "passed" : "failed";

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

    return res.json({
      success: true,
      message: "Exam submitted",
      attemptId,
    });
  } catch (err) {
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
        ea.totalMarks,
        ea.obtainedMarks,
        ea.status,
        ea.submittedAt,
        e.examTitle,
        e.passingMarks
      FROM exam_attempts ea
      INNER JOIN exam_details e
        ON e.examId = ea.examId
      WHERE ea.attemptId = ?
      AND ea.userId = ?
      `,
      [attemptId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    return res.json({
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