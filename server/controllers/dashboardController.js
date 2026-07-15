import { asyncHandler } from "../helpers/asyncHandler.js";
import { findOne } from "../helpers/dbHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";
import { requireAdmin } from "../helpers/authHelper.js";
import { sendError } from "../helpers/responseHelper.js";

const getCount = async (sql, params = []) => {
  const row = await findOne(sql, params);
  return Number(row?.count || 0);
};

export const getDashboardStats = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const isSuperAdmin = req.userRole === "super_admin";
  const organizationId = req.organizationId || null;

  if (!organizationId && !isSuperAdmin) {
    return sendError(res, "Organization not found", 400);
  }

  const orgCondition = isSuperAdmin ? "" : "WHERE organizationId = ?";
  const orgAndCondition = isSuperAdmin ? "" : "AND organizationId = ?";
  const orgParams = isSuperAdmin ? [] : [organizationId];

  const [
    students,
    activeStudents,
    inactiveStudents,
    admins,
    courses,
    orders,
    revenue,
    libraryCourses,
    organization,
    subscription,
    organizations,
    activeSubscriptions,
    pendingApprovals,
  ] = await Promise.all([
    getCount(
      `SELECT COUNT(*) AS count FROM user_details ${orgCondition}`,
      orgParams
    ),

    getCount(
      `
      SELECT COUNT(*) AS count
      FROM user_details
      WHERE isActive = 1
      ${orgAndCondition}
      `,
      orgParams
    ),

    getCount(
      `
      SELECT COUNT(*) AS count
      FROM user_details
      WHERE isActive = 0
      ${orgAndCondition}
      `,
      orgParams
    ),

    getCount(
      `
      SELECT COUNT(*) AS count
      FROM admins
      WHERE role = 'faculty'
      ${isSuperAdmin ? "" : "AND organizationId = ?"}
      `,
      orgParams
    ),

    getCount(
      `SELECT COUNT(*) AS count FROM course_details ${orgCondition}`,
      orgParams
    ),

    getCount(
      `SELECT COUNT(*) AS count FROM orders ${orgCondition}`,
      orgParams
    ),

    findOne(
      `
      SELECT COALESCE(SUM(totalPrice), 0) AS total
      FROM orders
      WHERE paymentStatus IN ('paid', 'success')
      ${orgAndCondition}
      `,
      orgParams
    ),

    getCount(
      `SELECT COUNT(*) AS count FROM user_library ${orgCondition}`,
      orgParams
    ),

    isSuperAdmin
      ? Promise.resolve(null)
      : findOne(
        `
          SELECT organizationId, organizationName
          FROM organizations
          WHERE organizationId = ?
          LIMIT 1
          `,
        [organizationId]
      ),

    isSuperAdmin
      ? Promise.resolve(null)
      : findOne(
        `
          SELECT
            s.subscriptionId,
            s.organizationId,
            s.planId,
            s.startDate,
            s.endDate,
            s.paymentStatus,
            s.isActive,
            sp.planName,
            sp.maxCourses,
            sp.maxChapters,
            sp.maxStudents,
            sp.maxFaculty,
            sp.maxExams
          FROM organization_subscriptions s
          JOIN subscription_plans sp ON sp.planId = s.planId
          WHERE s.organizationId = ?
            AND s.paymentStatus IN ('paid', 'success')
            AND s.isActive = 1
            AND s.endDate >= NOW()
          ORDER BY s.subscriptionId DESC
          LIMIT 1
          `,
        [organizationId]
      ),

    isSuperAdmin
      ? getCount(`SELECT COUNT(*) AS count FROM organizations`)
      : Promise.resolve(0),

    isSuperAdmin
      ? getCount(
        `
          SELECT COUNT(*) AS count
          FROM organization_subscriptions
          WHERE isActive = 1
            AND paymentStatus IN ('paid', 'success')
            AND endDate >= NOW()
          `
      )
      : Promise.resolve(0),

    isSuperAdmin
      ? getCount(
        `
          SELECT COUNT(*) AS count
          FROM admins
          WHERE approvalStatus = 'PENDING'
          `
      )
      : Promise.resolve(0),
  ]);

  return sendEncrypted(res, 200, {
    success: true,
    message: "Dashboard statistics fetched successfully",
    data: {
      dashboardType: isSuperAdmin ? "SUPER_ADMIN" : "ADMIN",
      userRole: req.userRole,

      students,
      activeStudents,
      inactiveStudents,
      admins,
      courses,
      orders,
      revenue: Number(revenue?.total || 0),
      libraryCourses,

      organizations,
      activeSubscriptions,
      pendingApprovals,

      hero: {
        organizationName: isSuperAdmin
          ? "Platform Overview"
          : organization?.organizationName || "Your Organization",

        planName: isSuperAdmin
          ? "Super Admin"
          : subscription?.planName || "No Active Plan",

        subscriptionStatus: isSuperAdmin
          ? "FULL ACCESS"
          : subscription
            ? "ACTIVE"
            : "INACTIVE",

        endDate: isSuperAdmin ? null : subscription?.endDate || null,

        limits: {
          maxCourses: subscription?.maxCourses || null,
          maxChapters: subscription?.maxChapters || null,
          maxStudents: subscription?.maxStudents || null,
          maxFaculty: subscription?.maxFaculty || null,
          maxExams: subscription?.maxExams || null,
        },
      },
    },
  });
});