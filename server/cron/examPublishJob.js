import cron from "node-cron";
import connectToDatabase from "../lib/db.js";

export const startExamPublishJob = (io) => {
    cron.schedule("* * * * *", async () => {
        try {
            const db = await connectToDatabase();

            const [exams] = await db.query(
                `
        SELECT examId, examTitle, courseId
        FROM exam_details
        WHERE publishMode = 'scheduled'
        AND isPublished = 0
        AND scheduledPublishAt <= NOW()
        `
            );

            for (const exam of exams) {
                await db.query(
                    `
          UPDATE exam_details
          SET isPublished = 1, publishedAt = NOW()
          WHERE examId = ?
          `,
                    [exam.examId]
                );

                const [students] = await db.query(
                    `
          SELECT userId
          FROM user_library
          WHERE courseId = ?
          `,
                    [exam.courseId]
                );

                for (const student of students) {
                    const title = "New Exam Published";
                    const message = `${exam.examTitle} is now available.`;

                    await db.query(
                        `
            INSERT INTO notifications (userId, title, message, type)
            VALUES (?, ?, ?, ?)
            `,
                        [student.userId, title, message, "exam"]
                    );

                    io.to(`user_${student.userId}`).emit("newNotification", {
                        title,
                        message,
                        type: "exam",
                        examId: exam.examId,
                    });
                }

                io.to("admins").emit("newNotification", {
                    title: "Scheduled Exam Published",
                    message: `${exam.examTitle} has been published successfully.`,
                    type: "exam",
                    examId: exam.examId,
                });
            }
        } catch (err) {
            console.log("EXAM PUBLISH CRON ERROR:", err.message);
        }
    });
};