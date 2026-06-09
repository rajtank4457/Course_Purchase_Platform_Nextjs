import { connectToDatabase } from "../lib/db.js";

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