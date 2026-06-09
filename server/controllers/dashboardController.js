// controllers/dashboardController.js
import { connectToDatabase } from "../lib/db.js";

export const getDashboardStats = async (req, res) => {
  try {
    const db = await connectToDatabase();

    const [[students]] = await db.query(
      `SELECT COUNT(*) AS count FROM user_details`
    );

    const [[activeStudents]] = await db.query(
      `SELECT COUNT(*) AS count FROM user_details WHERE isActive = 1`
    );

    const [[inactiveStudents]] = await db.query(
      `SELECT COUNT(*) AS count FROM user_details WHERE isActive = 0`
    );

    const [[admins]] = await db.query(
      `SELECT COUNT(*) AS count FROM admins`
    );

    const [[courses]] = await db.query(
      `SELECT COUNT(*) AS count FROM course_details`
    );

    const [[orders]] = await db.query(
      `SELECT COUNT(*) AS count FROM orders`
    );

    const [[revenue]] = await db.query(
      `SELECT COALESCE(SUM(totalPrice), 0) AS total FROM orders WHERE paymentStatus = 'paid'`
    );

    const [[libraryCourses]] = await db.query(
      `SELECT COUNT(*) AS count FROM user_library`
    );

    return res.status(200).json({
      success: true,
      data: {
        students: students.count,
        activeStudents: activeStudents.count,
        inactiveStudents: inactiveStudents.count,
        admins: admins.count,
        courses: courses.count,
        orders: orders.count,
        revenue: revenue.total,
        libraryCourses: libraryCourses.count,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Dashboard stats failed",
      error: err.message,
    });
  }
};