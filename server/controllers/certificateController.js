import PDFDocument from "pdfkit";
import crypto from "crypto";
import { connectToDatabase } from "../lib/db.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

const generateCertificateNo = (userId, courseId) => {
    const random = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `CERT-${courseId}-${userId}-${random}`;
};

export const downloadCourseCertificate = async (req, res) => {
    try {
        const userId = req.userId;
        const { courseId } = req.params;

        const db = await connectToDatabase();

        // 1. Check course is in user's library
        const [libraryRows] = await db.query(
            `
      SELECT 
        ul.userId,
        c.courseId,
        c.courseName,
        u.firstName,
        u.lastName
      FROM user_library ul
      JOIN course_details c ON c.courseId = ul.courseId
      JOIN user_details u ON u.userId = ul.userId
      WHERE ul.userId = ? AND ul.courseId = ?
      `,
            [userId, courseId]
        );

        if (libraryRows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You have not purchased this course",
            });
        }

        const student = libraryRows[0];

        // 2. Check all chapters completed
        const [progressRows] = await db.query(
            `
      SELECT 
        COUNT(ch.chId) AS totalChapters,
        COUNT(
          CASE 
            WHEN COALESCE(ucp.progress, 0) >= 100 THEN 1 
          END
        ) AS completedChapters
      FROM chapter_details ch
      LEFT JOIN user_chapter_progress ucp
        ON ucp.chId = ch.chId AND ucp.userId = ?
      WHERE ch.courseId = ?
      `,
            [userId, courseId]
        );

        const totalChapters = Number(progressRows[0]?.totalChapters || 0);
        const completedChapters = Number(progressRows[0]?.completedChapters || 0);

        if (totalChapters === 0 || completedChapters < totalChapters) {
            return res.status(403).json({
                success: false,
                message: "Complete all chapters to download certificate",
            });
        }

        // 3. Check course test passed
        const [examRows] = await db.query(
            `
      SELECT 
        e.examId,
        ea.attemptId,
        ea.status,
        ea.obtainedMarks,
        ea.totalMarks
      FROM exam_details e
      JOIN exam_attempts ea ON ea.examId = e.examId
      WHERE 
        e.courseId = ?
        AND e.examType = 'course'
        AND ea.userId = ?
        AND ea.status = 'PASS'
      ORDER BY ea.submittedAt DESC
      LIMIT 1
      `,
            [courseId, userId]
        );

        if (examRows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "Pass the course test to download certificate",
            });
        }

        const passedExam = examRows[0];

        // 4. Check existing certificate
        const [existingCert] = await db.query(
            `
      SELECT * FROM certificates
      WHERE userId = ? AND courseId = ?
      LIMIT 1
      `,
            [userId, courseId]
        );

        let certificate;

        if (existingCert.length > 0) {
            certificate = existingCert[0];
        } else {
            const certificateNo = generateCertificateNo(userId, courseId);
            const studentName = `${student.firstName} ${student.lastName}`;

            await db.query(
                `
        INSERT INTO certificates
        (
          userId,
          courseId,
          examId,
          attemptId,
          certificateNo,
          studentName,
          courseName
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
                [
                    userId,
                    courseId,
                    passedExam.examId,
                    passedExam.attemptId,
                    certificateNo,
                    studentName,
                    student.courseName,
                ]
            );

            const [newCert] = await db.query(
                `
        SELECT * FROM certificates
        WHERE userId = ? AND courseId = ?
        LIMIT 1
        `,
                [userId, courseId]
            );

            certificate = newCert[0];
        }

        // 5. Generate PDF
        const templatePath = path.join(
            __dirname,
            "../assets/certificates/course-certificate-template.png"
        );

        const doc = new PDFDocument({
            size: "A4",
            layout: "landscape",
            margin: 0,
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${certificate.certificateNo}.pdf`
        );

        doc.pipe(res);

        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;

        // Background certificate template
        doc.image(templatePath, 0, 0, {
            width: pageWidth,
            height: pageHeight,
        });

        // Certificate No
        doc
            .fillColor("#111827")
            .font("Helvetica-Bold")
            .fontSize(10)
            .text(certificate.certificateNo, 650, 72, {
                width: 140,
                align: "center",
            });

        // Student Name
        doc
            .fillColor("#061C3D")
            .font("Times-Italic")
            .fontSize(42)
            .text(certificate.studentName, 200, 255, {
                width: 450,
                align: "center",
            });

        // Course Name
        doc
            .fillColor("#061C3D")
            .font("Times-Bold")
            .fontSize(24)
            .text(certificate.courseName, 230, 330, {
                width: 390,
                align: "center",
            });

        // Issued Date
        doc
            .fillColor("#111827")
            .font("Helvetica-Bold")
            .fontSize(10)
            .text(formatDate(certificate.issuedAt), 188, 435, {
                width: 95,
                align: "center",
            });

        // Course Duration / Static Text
        doc
            .fillColor("#111827")
            .font("Helvetica-Bold")
            .fontSize(10)
            .text("Completed", 380, 435, {
                width: 100,
                align: "center",
            });

        // Achievement
        doc
            .fillColor("#111827")
            .font("Helvetica-Bold")
            .fontSize(10)
            .text("Passed", 595, 435, {
                width: 100,
                align: "center",
            });

        doc.end();
    } catch (error) {
        console.error("CERTIFICATE DOWNLOAD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to download certificate",
        });
    }
};