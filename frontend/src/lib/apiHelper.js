import axiosClient from "./axiosClient";
import { encryptData, decryptData } from "./cryptoHelper";

const authApi = {
  createSessionToken: "/auth/session-token",
  registerUser: "/auth/register",
  adminRegister: "/auth/admin-register",
  loginUser: "/auth/login",
  logoutUser: "/auth/logout",
  getHomeUser: "/auth/home",
};

const adminApi = {
  getAdmins: "/admins",
  addAdmin: "/admins/add",
  updateAdmin: "/admins/update",
  deleteAdmin: "/admins/delete",
};

const cartApi = {
  addToCart: "/cart/add",
  getCart: "/cart",
  getCartCount: "/cart/count",
  removeCartItem: (cartId) => `/cart/${cartId}`,
};

const chapterApi = {
  addChapter: "/chapters/add",
  addMultipleChapters: "/chapters/add-multiple",
  updateChapter: "/chapters/update",
  deleteChapter: "/chapters/delete",
  getChaptersByCourseSlug: (courseSlug) => `/chapters/course/${courseSlug}`,
  getChapterBySlug: (slug) => `/chapters/${slug}`,
  updateChapterContent: "/chapters/update-content",
};

const couponApi = {
  getCoupons: "/coupons",
  addCoupon: "/coupons/add",
  validateCoupon: "/coupons/validate",
  updateCouponUsage: "/coupons/usage",
};

const courseApi = {
  getCourses: "/courses",
  getCoursesWithChapters: "/courses/with-chapters",
  getCourseById: (courseId) => `/courses/${courseId}`,
  addCourse: "/courses/add",
  updateCourse: "/courses/update",
  deleteCourse: "/courses/delete",
};

const dashboardApi = {
  getDashboardStats: "/dashboard/stats",
};

const examApi = {
  getAvailableExams: "/exams/available",
  addExam: "/exams/add",
  addExamQuestion: "/exams/questions/add",
  updateExamAccessRules: "/exams/access-rules/update",
  publishExam: "/exams/publish",

  getExamStartInfo: (examId) => `/exams/${examId}/start-info`,
  startExam: "/exams/start",
  getExamAttemptQuestions: (examId) => `/exams/${examId}/attempt`,
  submitExam: "/exams/submit",

  getPendingEssayAttempts: "/exams/admin/pending-essays",
  getEssayCheckDetails: (attemptId) =>
    `/exams/admin/essay-check/${attemptId}`,
  checkEssayManually: "/exams/admin/check-essay",

  getExamResult: (attemptId) => `/exams/result/${attemptId}`,
  getExamQuestionsAdmin: (examId) => `/exams/${examId}/questions`,
  getAllExams: "/exams/all",
  updateExam: "/exams/update",
  deleteExam: "/exams/delete",
  getExamById: (examId) => `/exams/${examId}`,
  updateExamQuestion: "/exams/questions/update",
  deleteExamQuestion: "/exams/questions/delete",
  updateQuestionSequence: "/exams/questions/sequence/update",
};

const libraryApi = {
  addToLibrary: "/library/add",
  getLibraryCourses: "/library",
};

const notificationApi = {
  getMyNotifications: "/notifications",
  markNotificationRead: "/notifications/mark-read",
  clearAllNotifications: "/notifications/clear-all",
};

const orderApi = {
  getOrders: "/orders",
  getAllOrders: "/orders/all",
  getAdminOrderDetails: (orderId) => `/orders/admin/${orderId}`,
  getOrderDetails: (orderId) => `/orders/${orderId}`,
  downloadInvoice: (orderId) => `/orders/${orderId}/invoice`,
};

const paymentApi = {
  createPaymentOrder: "/payments/create-order",
  verifyPayment: "/payments/verify",
  paymentFailed: "/payments/failed",
};

const progressApi = {
  getAllProgress: "/progress",
  getChapterProgress: (chId) => `/progress/chapter/${chId}`,
  saveChapterProgress: "/progress/chapter/save",
};

const studentApi = {
  getStudents: "/students",
  addStudent: "/students/add",
  updateStudent: "/students/update",
  deleteStudent: "/students/delete",
  getStudentDetails: (userId) => `/students/${userId}/details`,
  getStudentCourseProgress: (userId, courseId) =>
    `/students/${userId}/course/${courseId}/progress`,
  resetStudentCourseProgress: "/students/reset-course-progress",
  resetChapterProgress: "/students/reset-chapter-progress",
  resetStudentAllProgress: "/students/reset-all-progress",
  removeStudentCourse: "/students/remove-course",
};

const certificateApi = {
  downloadCourseCertificate: (courseId) => `/certificates/course/${courseId}/download`,
};

const activityApi = {
  getStudents: "/activity/students",
  getStudentDashboard: (userId) => `/activity/dashboard/${userId}`,
  trackPage: "/activity/track-page",
};

const attendanceApi = {
  markLogin: "/attendance/login",
  markLogout: "/attendance/logout",
  getMyAttendance: "/attendance/my",
  getMyStudyTime: "/attendance/study-time",

  getAdminAttendance: "/attendance/admin",
  updateAttendanceStatus: "/attendance/admin/update-status",
  createManualAttendance: "/attendance/admin/manual",
};

const wishlistApi = {
  getWishlist: "/wishlist",
  getWishlistCount: "/wishlist/count",
  addToWishlist: "/wishlist/add",
  removeFromWishlist: "/wishlist/remove",
};

const achievementApi = {
  getAchievements: "/achievements",
};

const adminApprovalApi = {
  pending: "/admin-approvals/pending",
  approve: (adminId) => `/admin-approvals/approve/${adminId}`,
  reject: (adminId) => `/admin-approvals/reject/${adminId}`,
};

const roleApi = {
  getRoles: "/roles",
  addRole: "/roles/add",
  updateRole: (roleId) => `/roles/update/${roleId}`,
  getPermissions: "/roles/permissions",
  assignPermissions: (roleId) => `/roles/assign-permissions/${roleId}`,
  assignRole: (adminId) => `/roles/assign-role/${adminId}`,
};

const organizationApi = {
  getActiveOrganizations: "/role-management/organizations",
};

const roleManagementApi = {
  getRoles: (organizationId) =>
    `/role-management/roles/${organizationId}`,

  getRolePermissions: (roleId) =>
    `/role-management/permissions/${roleId}`,

  updateRolePermissions: (roleId) =>
    `/role-management/permissions/${roleId}`,
};

const subscriptionApi = {
  // =========================
  // Subscription Plan Management
  // =========================

  getPlans: "/subscriptions/plans",

  getPlanById: (planId) =>
    `/subscriptions/plans/${planId}`,

  addPlan: "/subscriptions/plans/add",

  updatePlan: (planId) =>
    `/subscriptions/plans/update/${planId}`,

  deletePlan: (planId) =>
    `/subscriptions/plans/delete/${planId}`,

  // =========================
  // Permissions
  // =========================

  getPermissions:
    "/subscriptions/permissions",

  getPlanPermissions: (planId) =>
    `/subscriptions/plans/${planId}/permissions`,

  updatePlanPermissions: (planId) =>
    `/subscriptions/plans/${planId}/permissions`,

  // =========================
  // Purchase APIs
  // =========================

  createOrder: "/subscriptions/create-order",

  verifyPayment: "/subscriptions/verify-payment",

  mySubscription: "/subscriptions/my-subscription",

  organizationSubscription: (organizationId) =>
    `/subscriptions/organization/${organizationId}`,
};

const facultyApi = {
  getFaculty: "/faculty",
  addFaculty: "/faculty/add",
  updateFaculty: "/faculty/update",
  deleteFaculty: "/faculty/delete",
};

const storageApi = {
  getStorage: "/storage",
};

const chatApi = {
  getUsers: "/chat/users",

  getConversations: "/chat/conversations",

  createConversation: "/chat/conversation",

  getMessages: (conversationId) =>
    `/chat/messages/${conversationId}`,

  sendMessage: "/chat/send",

  markAsRead: "/chat/read",
};

export const apiRequest = async (
  url,
  {
    method = "GET",
    data,
    params,
    headers = {},
    responseType = "json",
  } = {},
) => {
  try {
    const isFormData = data instanceof FormData;
    const isBlob = responseType === "blob";

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token")
        : null;

    const config = {
      method,
      url,
      params,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      responseType,
    };

    if (data !== undefined && data !== null) {
      if (isFormData) {
        config.data = data;
        config.headers = {

          ...config.headers,

          "Content-Type": "multipart/form-data",

        };
      } else {
        const encryptedPayload = encryptData(data);

        config.data = {
          encrypted: true,
          payload: encryptedPayload.data,
        };
      }
    }

    const response = await axiosClient(config);

    let responseData = response.data;

    if (!isBlob && responseData?.encrypted && responseData?.payload) {
      responseData = decryptData(responseData.payload);
    }

    return {
      success: true,
      data: responseData,
      message: responseData?.message || "Success",
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      data: error.response?.data || null,
      message:
        error.response?.data?.message ||
        error.message ||
        "Something went wrong",
      status: error.response?.status || 500,
    };
  }
};

export {
  authApi,
  adminApi,
  cartApi,
  chapterApi,
  couponApi,
  courseApi,
  dashboardApi,
  examApi,
  libraryApi,
  notificationApi,
  orderApi,
  paymentApi,
  progressApi,
  studentApi,
  certificateApi,
  activityApi,
  attendanceApi,
  wishlistApi,
  achievementApi,
  adminApprovalApi,
  roleApi,
  organizationApi,
  roleManagementApi,
  subscriptionApi,
  facultyApi,
  storageApi,
  chatApi,
};