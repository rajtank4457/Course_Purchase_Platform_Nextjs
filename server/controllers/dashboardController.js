import { asyncHandler } from "../helpers/asyncHandler.js";
import { getDb } from "../helpers/dbHelper.js";
import { sendSuccess } from "../helpers/responseHelper.js";
import { requireAdmin } from "../helpers/authHelper.js";

export const getDashboardStats = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const db = await getDb();

  const [[students]] = await db.query(`SELECT COUNT(*) AS count FROM user_details`);
  const [[activeStudents]] = await db.query(`SELECT COUNT(*) AS count FROM user_details WHERE isActive = 1`);
  const [[inactiveStudents]] = await db.query(`SELECT COUNT(*) AS count FROM user_details WHERE isActive = 0`);
  const [[admins]] = await db.query(`SELECT COUNT(*) AS count FROM admins`);
  const [[courses]] = await db.query(`SELECT COUNT(*) AS count FROM course_details`);
  const [[orders]] = await db.query(`SELECT COUNT(*) AS count FROM orders`);
  const [[revenue]] = await db.query(`SELECT COALESCE(SUM(totalPrice), 0) AS total FROM orders WHERE paymentStatus = 'paid'`);
  const [[libraryCourses]] = await db.query(`SELECT COUNT(*) AS count FROM user_library`);

  return sendSuccess(res,
    {
      students: students.count,
      activeStudents: activeStudents.count,
      inactiveStudents: inactiveStudents.count,
      admins: admins.count,
      courses: courses.count,
      orders: orders.count,
      revenue: revenue.total,
      libraryCourses: libraryCourses.count,
    },
  );
});