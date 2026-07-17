import PDFDocument from "pdfkit";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { findOne, insertRow } from "../helpers/dbHelper.js";

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
        const organizationId = req.organizationId;
        const { courseId } = req.params;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: "Organization not found",
            });
        }

        const student = await findOne(
            `
      SELECT 
        ul.userId,
        c.courseId,
        c.courseName,
        u.firstName,
        u.lastName
      FROM user_library ul
      JOIN course_details c
        ON c.courseId = ul.courseId
       AND c.organizationId = ul.organizationId
      JOIN user_details u
        ON u.userId = ul.userId
       AND u.organizationId = ul.organizationId
      WHERE ul.userId = ?
        AND ul.courseId = ?
        AND ul.organizationId = ?
      LIMIT 1
      `,
            [userId, courseId, organizationId]
        );

        console.log("Student :", student);

        if (!student) {
            return res.status(403).json({
                success: false,
                message: "You have not purchased this course",
            });
        }

        const progress = await findOne(
            `
            SELECT
                COUNT(DISTINCT ch.chId) AS totalChapters,

                COUNT(
                    DISTINCT
                    CASE
                        WHEN IFNULL(ucp.progress,0) >= 100
                        THEN ch.chId
                    END
                ) AS completedChapters

            FROM chapter_details ch

            LEFT JOIN user_chapter_progress ucp
                ON ucp.chId = ch.chId
                AND ucp.courseId = ch.courseId
                AND ucp.userId = ?

            WHERE
                ch.courseId = ?
            AND ch.organizationId = ?
            `,
            [
                userId,
                courseId,
                organizationId
            ]
        );

        const totalChapters = Number(progress?.totalChapters || 0);
        const completedChapters = Number(progress?.completedChapters || 0);

        console.log("Progress :", progress);
        console.log("Total :", totalChapters);
        console.log("Completed :", completedChapters);

        if (totalChapters === 0 || completedChapters < totalChapters) {
            return res.status(403).json({
                success: false,
                message: "Complete all chapters to download certificate",
            });
        }

        const passedExam = await findOne(
            `
            SELECT
                e.examId,
                ea.attemptId,
                ea.status,
                ea.obtainedMarks,
                ea.totalMarks

            FROM exam_details e

            INNER JOIN exam_attempts ea
                ON ea.examId = e.examId

            WHERE
                e.courseId = ?
                AND e.examType = 'course'
                AND ea.userId = ?
                AND ea.organizationId = ?
                AND ea.status = 'PASS'

            ORDER BY ea.submittedAt DESC

            LIMIT 1
            `,
            [
                courseId,
                userId,
                organizationId
            ]
        );

        console.log("Passed Exam :", passedExam);

        if (!passedExam) {
            return res.status(403).json({
                success: false,
                message: "Pass the course test to download certificate",
            });
        }

        let certificate = await findOne(
            `
      SELECT *
      FROM certificates
      WHERE userId = ?
        AND courseId = ?
        AND organizationId = ?
      LIMIT 1
      `,
            [userId, courseId, organizationId]
        );

        if (!certificate) {
            const certificateNo = generateCertificateNo(userId, courseId);

            await insertRow("certificates", {
                userId,
                organizationId,
                courseId,
                examId: passedExam.examId,
                attemptId: passedExam.attemptId,
                certificateNo,
                studentName: `${student.firstName} ${student.lastName || ""}`.trim(),
                courseName: student.courseName,
            });

            certificate = await findOne(
                `
        SELECT *
        FROM certificates
        WHERE userId = ?
          AND courseId = ?
          AND organizationId = ?
        LIMIT 1
        `,
                [userId, courseId, organizationId]
            );
        }

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

        doc.image(templatePath, 0, 0, {
            width: pageWidth,
            height: pageHeight,
        });

        doc
            .fillColor("#111827")
            .font("Helvetica-Bold")
            .fontSize(10)
            .text(certificate.certificateNo, 650, 72, {
                width: 140,
                align: "center",
            });

        doc
            .fillColor("#061C3D")
            .font("Times-Italic")
            .fontSize(42)
            .text(certificate.studentName, 200, 255, {
                width: 450,
                align: "center",
            });

        doc
            .fillColor("#061C3D")
            .font("Times-Bold")
            .fontSize(24)
            .text(certificate.courseName, 230, 330, {
                width: 390,
                align: "center",
            });

        doc
            .fillColor("#111827")
            .font("Helvetica-Bold")
            .fontSize(10)
            .text(formatDate(certificate.issuedAt), 188, 435, {
                width: 95,
                align: "center",
            });

        doc
            .fillColor("#111827")
            .font("Helvetica-Bold")
            .fontSize(10)
            .text("Completed", 380, 435, {
                width: 100,
                align: "center",
            });

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