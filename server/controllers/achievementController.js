import { runQuery } from "../helpers/dbHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";

const badges = [
  ["first_course", "First Course", "Enrolled in your first course.", "🏆"],
  ["seven_day_streak", "7 Day Streak", "Studied for 7 active days.", "🔥"],
  ["hundred_attendance", "100% Attendance", "Maintained 100% attendance.", "💯"],
  ["read_100_chapters", "Read 100 Chapters", "Completed 100 chapter progress records.", "📚"],
  ["first_exam_passed", "First Exam Passed", "Passed your first exam.", "🚀"],
  ["top_performer", "Top Performer", "Scored 90% or above in an exam.", "🥇"],
].map(([key, title, description, icon]) => ({ key, title, description, icon }));

const getOne = async (sql, params) => {
  const rows = await runQuery(sql, params);
  return rows[0] || {};
};

const unlockBadge = async (userId, badge) => {
  await runQuery(
    `
    INSERT IGNORE INTO user_achievements
    (userId, badgeKey, title, description, icon)
    VALUES (?, ?, ?, ?, ?)
    `,
    [userId, badge.key, badge.title, badge.description, badge.icon]
  );
};

export const checkAchievements = async (req, res) => {
  try {
    const userId = req.userId;

    const library = await getOne(
      `SELECT COUNT(*) AS total FROM user_library WHERE userId = ?`,
      [userId]
    );

    const attendance = await getOne(
      `
      SELECT 
        COUNT(*) AS totalDays,
        COALESCE(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END), 0) AS presentDays
      FROM attendance_logs
      WHERE userId = ?
      `,
      [userId]
    );

    const chapters = await getOne(
      `
      SELECT COUNT(*) AS total
      FROM user_chapter_progress
      WHERE userId = ? AND progress >= 100
      `,
      [userId]
    );

    const passedExam = await getOne(
      `
      SELECT COUNT(*) AS total
      FROM exam_attempts
      WHERE userId = ? AND status = 'PASS'
      `,
      [userId]
    );

    const topExam = await getOne(
      `
      SELECT COUNT(*) AS total
      FROM exam_attempts
      WHERE userId = ?
      AND totalMarks > 0
      AND (obtainedMarks / totalMarks) * 100 >= 90
      `,
      [userId]
    );

    const rules = [
      Number(library.total) >= 1 && badges[0],
      Number(attendance.presentDays) >= 7 && badges[1],
      Number(attendance.totalDays) > 0 &&
      Number(attendance.totalDays) === Number(attendance.presentDays) &&
      badges[2],
      Number(chapters.total) >= 100 && badges[3],
      Number(passedExam.total) >= 1 && badges[4],
      Number(topExam.total) >= 1 && badges[5],
    ].filter(Boolean);

    await Promise.all(rules.map((badge) => unlockBadge(userId, badge)));

    const unlocked = await runQuery(
      `
      SELECT badgeKey, title, description, icon, unlockedAt
      FROM user_achievements
      WHERE userId = ?
      ORDER BY unlockedAt DESC
      `,
      [userId]
    );

    return sendEncrypted(res, 200, {
      success: true,
      message: "Achievements checked",
      data: { allBadges: badges, unlocked },
    });
  } catch (error) {
    console.log("ACHIEVEMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check achievements",
    });
  }
};