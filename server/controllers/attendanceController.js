import { runQuery } from "../helpers/dbHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";

const PRESENT_MINUTES = 20;

const formatMinutes = (minutes = 0) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs <= 0 ? `${mins}m` : `${hrs}h ${mins}m`;
};

const requireAdmin = (req, res) => {
    if (req.userType !== "admin") {
        res.status(403).json({
            success: false,
            message: "Admin access only",
        });
        return false;
    }
    return true;
};

const attendanceTitle = (status) =>
    status === "present" ? "Attendance Marked Present" : "Attendance Marked Absent";

const notifyAttendance = async (req, userId, date, status) => {
    const title = attendanceTitle(status);

    await runQuery(
        `
    INSERT INTO notifications
    (userId, title, message, type, isRead, organizationId, createdAt)
    VALUES (?, ?, ?, ?, 0, ?, NOW())
    `,
        [
            userId,
            title,
            `Your attendance for ${new Date(date).toLocaleDateString(
                "en-IN"
            )} has been marked ${status.toUpperCase()}.`,
            "attendance",
            req.organizationId,
        ]
    );
};

export const markAttendanceLogin = async (req, res) => {
    try {
        await runQuery(
            `
            INSERT INTO attendance_logs
            (userId, organizationId, attendanceDate, loginTime, status)
            VALUES (?, ?, CURDATE(), NOW(), 'present')
            ON DUPLICATE KEY UPDATE
                loginTime = IFNULL(loginTime, NOW()),
                updatedAt = NOW()
            `,
            [req.userId, req.organizationId]
        );

        return sendEncrypted(res, 200, {
            success: true,
            message: "Attendance login marked",
        });
    } catch (error) {
        console.log("ATTENDANCE LOGIN ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to mark attendance login" });
    }
};

export const markAttendanceLogout = async (req, res) => {
    try {
        const rows = await runQuery(
            `
            SELECT attendanceId, loginTime, isManual
            FROM attendance_logs
            WHERE userId = ?
            AND organizationId = ?
            AND attendanceDate = CURDATE()
            LIMIT 1
            `,
            [req.userId, req.organizationId]
        );
        if (!rows.length) {
            return sendEncrypted(res, 200, {
                success: true,
                message: "No attendance session found",
            });
        }

        const attendance = rows[0];

        const durationRows = await runQuery(
            `SELECT TIMESTAMPDIFF(MINUTE, ?, NOW()) AS totalMinutes`,
            [attendance.loginTime]
        );

        const totalMinutes = Number(durationRows[0]?.totalMinutes || 0);
        const status = totalMinutes >= PRESENT_MINUTES ? "present" : "absent";

        await runQuery(
            `
      UPDATE attendance_logs
      SET logoutTime = NOW(),
          totalMinutes = ?,
          ${Number(attendance.isManual) === 1 ? "" : "status = ?,"}
          updatedAt = NOW()
      WHERE attendanceId = ?
      `,
            Number(attendance.isManual) === 1
                ? [totalMinutes, attendance.attendanceId]
                : [totalMinutes, status, attendance.attendanceId]
        );

        return sendEncrypted(res, 200, {
            success: true,
            message: "Attendance logout marked",
        });
    } catch (error) {
        console.log("ATTENDANCE LOGOUT ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to mark attendance logout" });
    }
};

export const getMyAttendance = async (req, res) => {
    try {
        const days = Number(req.query.days || 30);

        const logs = await runQuery(
            `
      SELECT attendanceId, attendanceDate, loginTime, logoutTime, totalMinutes, status
      FROM attendance_logs
      WHERE userId = ?
      AND organizationId = ?
      AND attendanceDate >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY attendanceDate DESC
      `,
            [req.userId, req.organizationId, days]
        );

        const summaryRows = await runQuery(
            `
            SELECT
                COUNT(*) AS totalDays,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS presentDays,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absentDays,
                SUM(totalMinutes) AS totalMinutes
            FROM attendance_logs
            WHERE userId = ?
            AND organizationId = ?
            AND attendanceDate >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
           `,
            [req.userId, req.organizationId, days]
        );

        const s = summaryRows[0] || {};
        const totalDays = Number(s.totalDays || 0);
        const presentDays = Number(s.presentDays || 0);
        const absentDays = Number(s.absentDays || 0);
        const totalMinutes = Number(s.totalMinutes || 0);

        return sendEncrypted(res, 200, {
            success: true,
            message: "Attendance fetched",
            data: {
                summary: {
                    totalDays,
                    presentDays,
                    absentDays,
                    totalMinutes,
                    totalStudyTime: formatMinutes(totalMinutes),
                    attendancePercent: totalDays ? Math.round((presentDays / totalDays) * 100) : 0,
                },
                logs,
            },
        });
    } catch (error) {
        console.log("GET ATTENDANCE ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch attendance" });
    }
};

export const getMyStudyTime = async (req, res) => {
    try {
        const rows = await runQuery(
            `
      SELECT
        COALESCE(SUM(CASE WHEN attendanceDate = CURDATE() THEN totalMinutes ELSE 0 END), 0) AS todayMinutes,
        COALESCE(SUM(CASE WHEN YEARWEEK(attendanceDate, 1) = YEARWEEK(CURDATE(), 1) THEN totalMinutes ELSE 0 END), 0) AS weekMinutes,
        COALESCE(SUM(CASE WHEN YEAR(attendanceDate) = YEAR(CURDATE()) AND MONTH(attendanceDate) = MONTH(CURDATE()) THEN totalMinutes ELSE 0 END), 0) AS monthMinutes
      FROM attendance_logs
      WHERE userId = ?
      AND organizationId = ?
      `,
            [req.userId, req.organizationId]
        );

        const data = rows[0] || {};
        const todayMinutes = Number(data.todayMinutes || 0);
        const weekMinutes = Number(data.weekMinutes || 0);
        const monthMinutes = Number(data.monthMinutes || 0);

        return sendEncrypted(res, 200, {
            success: true,
            message: "Study time fetched",
            data: {
                todayMinutes,
                weekMinutes,
                monthMinutes,
                today: formatMinutes(todayMinutes),
                thisWeek: formatMinutes(weekMinutes),
                thisMonth: formatMinutes(monthMinutes),
            },
        });
    } catch (error) {
        console.log("GET STUDY TIME ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch study time" });
    }
};

export const getAdminAttendance = async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;

        const { days = 30, userId = "", status = "" } = req.query;
        let where = `
                    WHERE al.organizationId = ?
                    AND al.attendanceDate >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                    `;

        const params = [req.organizationId, Number(days)];

        if (userId) {
            where += ` AND al.userId = ?`;
            params.push(Number(userId));
        }

        if (status) {
            where += ` AND al.status = ?`;
            params.push(status);
        }

        const logs = await runQuery(
            `
      SELECT al.*, u.firstName, u.lastName, u.email
      FROM attendance_logs al
      JOIN user_details u 
      ON u.userId = al.userId
      AND u.organizationId = al.organizationId
      ${where}
      ORDER BY al.attendanceDate DESC, al.loginTime DESC
      `,
            params
        );

        const summaryRows = await runQuery(
            `
      SELECT
        COUNT(*) AS totalRecords,
        SUM(CASE WHEN al.status = 'present' THEN 1 ELSE 0 END) AS presentRecords,
        SUM(CASE WHEN al.status = 'absent' THEN 1 ELSE 0 END) AS absentRecords,
        SUM(al.totalMinutes) AS totalMinutes
      FROM attendance_logs al
      ${where}
      `,
            params
        );

        return sendEncrypted(res, 200, {
            success: true,
            message: "Admin attendance fetched",
            data: { summary: summaryRows[0] || {}, logs },
        });
    } catch (error) {
        console.log("GET ADMIN ATTENDANCE ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch admin attendance" });
    }
};

export const updateAttendanceStatus = async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;

        const { attendanceId, status } = req.body;

        if (!attendanceId || !["present", "absent"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Valid attendanceId and status are required",
            });
        }

        const rows = await runQuery(
            `
            SELECT userId, attendanceDate
            FROM attendance_logs
            WHERE attendanceId = ?
            AND organizationId = ?
            LIMIT 1
            `,
            [attendanceId, req.organizationId]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, message: "Attendance record not found" });
        }

        await runQuery(
            `
      UPDATE attendance_logs
      SET status = ?,
          isManual = 1,
          manualUpdatedBy = ?,
          manualUpdatedAt = NOW(),
          updatedAt = NOW()
          WHERE attendanceId = ?
          AND organizationId = ?
      `,
            [status, req.userId, attendanceId, req.organizationId]
        );

        await notifyAttendance(req, rows[0].userId, rows[0].attendanceDate, status);

        return sendEncrypted(res, 200, {
            success: true,
            message: "Attendance status updated",
            data: { attendanceId, status },
        });
    } catch (error) {
        console.log("UPDATE ATTENDANCE ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to update attendance" });
    }
};

export const createManualAttendance = async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;

        const { userId, attendanceDate, loginTime, logoutTime, totalMinutes = 0, status } = req.body;

        if (!userId || !attendanceDate || !status) {
            return res.status(400).json({
                success: false,
                message: "Student, date and status are required",
            });
        }

        const student = await runQuery(
            `
            SELECT userId
            FROM user_details
            WHERE userId = ?
            AND organizationId = ?
            LIMIT 1
            `,
            [userId, req.organizationId]
        );

        if (!student.length) {
            return res.status(404).json({
                success: false,
                message: "Student not found in your organization",
            });
        }

        await runQuery(
            `
            INSERT INTO attendance_logs
            (userId, attendanceDate, loginTime, logoutTime, totalMinutes, status, isManual, manualUpdatedBy, manualUpdatedAt)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?, NOW())
            ON DUPLICATE KEY UPDATE
            loginTime = VALUES(loginTime),
            logoutTime = VALUES(logoutTime),
            totalMinutes = VALUES(totalMinutes),
            status = VALUES(status),
            isManual = 1,
            manualUpdatedBy = VALUES(manualUpdatedBy),
            manualUpdatedAt = NOW(),
            updatedAt = NOW()
            `,
            [
                userId,
                req.organizationId,
                attendanceDate,
                loginTime || null,
                logoutTime || null,
                Number(totalMinutes || 0),
                status,
                req.userId,
            ]
        );

        await notifyAttendance(req, userId, attendanceDate, status);

        return sendEncrypted(res, 200, {
            success: true,
            message: "Manual attendance saved",
            data: {},
        });
    } catch (error) {
        console.log("CREATE MANUAL ATTENDANCE ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to save manual attendance" });
    }
};