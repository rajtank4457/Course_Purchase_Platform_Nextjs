import { getDb } from "../helpers/dbHelper.js";
import { sendError } from "../helpers/responseHelper.js";

export const checkSubscription = async (req, res, next) => {
  try {
    if (req.userType !== "admin") {
      return sendError(res, "Only admin can access this route", 403);
    }

    if (req.userRole === "super_admin") {
      return next();
    }

    if (!req.organizationId) {
      return sendError(res, "Organization not found", 400);
    }

    const db = await getDb();

    const [rows] = await db.query(
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
        sp.targetRole,
        sp.maxCourses,
        sp.maxChapters,
        sp.maxStudents,
        sp.maxFaculty,
        sp.maxExams,
        sp.canCreateCourses,
        sp.canCreateExams,
        sp.canViewAnalytics,
        sp.canManageCertificates,
        sp.canUsePrioritySupport
      FROM organization_subscriptions s
      JOIN subscription_plans sp 
        ON sp.planId = s.planId
      WHERE s.organizationId = ?
        AND s.isActive = 1
        AND s.paymentStatus = 'success'
        AND s.endDate >= NOW()
      ORDER BY s.subscriptionId DESC
      LIMIT 1
      `,
      [req.organizationId]
    );

    if (!rows.length) {
      return sendError(res, "Active organization subscription required", 403);
    }

    req.subscription = rows[0];

    next();
  } catch (error) {
    console.error("SUBSCRIPTION CHECK ERROR:", error);
    return sendError(res, "Subscription check failed", 500);
  }
};