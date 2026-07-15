"use client";

import { useEffect, useState } from "react";
import { apiRequest, dashboardApi, activityApi } from "@/lib/apiHelper";
import { useRouter } from "next/navigation";
import {
  Users,
  GraduationCap,
  ShieldCheck,
  ShoppingBag,
  BookOpen,
  IndianRupee,
  UserCheck,
  UserX,
  RotateCcw,
  Building2,
  Crown,
  Clock3,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { hasPermission } from "@/utils/accessControl";

export default function AdminDashboardClient() {
  const router = useRouter();

  const [stats, setStats] = useState({
    dashboardType: "ADMIN",
    userRole: "",
    students: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    admins: 0,
    courses: 0,
    orders: 0,
    revenue: 0,
    libraryCourses: 0,
    organizations: 0,
    activeSubscriptions: 0,
    pendingApprovals: 0,
    hero: {
      organizationName: "Your Organization",
      planName: "No Active Plan",
      subscriptionStatus: "INACTIVE",
      endDate: null,
      limits: {
        maxCourses: null,
        maxChapters: null,
        maxStudents: null,
        maxFaculty: null,
        maxExams: null,
      },
    },
  });

  const [studentsList, setStudentsList] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [rangeType, setRangeType] = useState("7");
  const [customDates, setCustomDates] = useState({
    startDate: "",
    endDate: "",
  });
  const [topPageDate, setTopPageDate] = useState("");

  const [activity, setActivity] = useState({
    dailyLogs: [],
    topPages: [],
  });

  const isSuperAdmin = stats.dashboardType === "SUPER_ADMIN";

  const handleResetDates = () => {
    setCustomDates({
      startDate: "",
      endDate: "",
    });

    // Optional: fetch default last 7 days again
    setRangeType("7");

    if (selectedUserId) {
      fetchActivityByUser(selectedUserId, "7", {
        startDate: "",
        endDate: "",
      });
    }
  };

  const fetchStudentsForActivity = async () => {
    try {
      const res = await apiRequest(activityApi.getStudents, {
        method: "GET",
      });

      if (!res.success) {
        console.error(res.message);
        return;
      }

      const students = res.data?.data || [];
      setStudentsList(students);
    } catch (err) {
      if (err?.response?.status !== 403) {
        console.error(err);
      }
    }
  };

  const fetchTopPagesBySingleDate = async () => {
    if (!selectedUserId || !topPageDate) return;

    const res = await apiRequest(
      activityApi.getStudentDashboard(selectedUserId),
      {
        method: "GET",
        params: {
          singleDate: topPageDate,
        },
      },
    );

    if (!res.success) return;

    setActivity((prev) => ({
      ...prev,
      topPages: res.data?.data?.topPages || [],
    }));
  };

  const fetchActivityByUser = async (
    userId = selectedUserId,
    days = rangeType,
    dates = customDates,
  ) => {
    try {
      if (!userId) return;

      setActivity({
        dailyLogs: [],
        topPages: [],
      });

      const params =
        days === "custom"
          ? {
              startDate: dates.startDate,
              endDate: dates.endDate,
            }
          : {
              days,
            };

      const res = await apiRequest(activityApi.getStudentDashboard(userId), {
        method: "GET",
        params,
      });

      if (!res.success) {
        console.error(res.message);
        return;
      }

      setActivity(
        res.data?.data || {
          dailyLogs: [],
          topPages: [],
        },
      );
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const service = dashboardApi.getDashboardStats;

      const req = {
        method: "GET",
      };

      const res = await apiRequest(service, req);

      if (!res.success) {
        console.error(res.message);
        return;
      }

      setStats(res.data?.data || {});
    } catch (err) {
      if (err?.response?.status !== 403) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    fetchStats();

    if (hasPermission("analytics.view")) {
      fetchStudentsForActivity();
    }
  }, []);

  const formattedDailyLogs = activity.dailyLogs.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    }),
    total: Number(item.total || 0),
  }));

  const formattedTopPages = activity.topPages.map((item) => ({
    pageName: item.pageName,
    total: Number(item.total || 0),
  }));

  const cards = isSuperAdmin
    ? [
        {
          title: "Organizations",
          value: stats.organizations,
          icon: Building2,
          bg: "from-blue-500 to-cyan-500",
          route: "/admin/organizations",
          permission: "organization.view",
        },
        {
          title: "Active Subscriptions",
          value: stats.activeSubscriptions,
          icon: Crown,
          bg: "from-emerald-500 to-green-600",
          route: "/admin/subscriptions",
          permission: "subscription.view",
        },
        {
          title: "Pending Approvals",
          value: stats.pendingApprovals,
          icon: Clock3,
          bg: "from-orange-500 to-amber-500",
          route: "/admin/approval-requests",
          permission: "approval.view",
        },
        {
          title: "Platform Revenue",
          value: `₹${Number(stats.revenue || 0).toLocaleString("en-IN")}`,
          icon: IndianRupee,
          bg: "from-purple-500 to-violet-600",
          route: "/admin/orders",
          permission: "order.view",
        },
      ]
    : [
        {
          title: "Total Students",
          value: stats.students,
          icon: Users,
          bg: "from-blue-500 to-cyan-500",
          route: "/admin/students",
          permission: "student.view",
        },
        {
          title: "Active Students",
          value: stats.activeStudents,
          icon: UserCheck,
          bg: "from-green-500 to-emerald-500",
          route: "/admin/students?status=active",
          permission: "student.view",
        },
        {
          title: "Inactive Students",
          value: stats.inactiveStudents,
          icon: UserX,
          bg: "from-red-500 to-rose-500",
          route: "/admin/students?status=inactive",
          permission: "student.view",
        },
        {
          title: "Faculty",
          value: stats.admins,
          icon: ShieldCheck,
          bg: "from-purple-500 to-violet-600",
          route: "/admin/admins",
          permission: "admin.view",
        },
        {
          title: "Courses",
          value: stats.courses,
          icon: GraduationCap,
          bg: "from-orange-500 to-amber-500",
          route: "/admin/courses",
          permission: "course.view",
        },
        {
          title: "Orders",
          value: stats.orders,
          icon: ShoppingBag,
          bg: "from-pink-500 to-fuchsia-500",
          route: "/admin/orders",
          permission: "order.view",
        },
        {
          title: "Library",
          value: stats.libraryCourses,
          icon: BookOpen,
          bg: "from-indigo-500 to-blue-600",
          route: "/admin/library",
          permission: "course.view",
        },
        {
          title: "Revenue",
          value: `₹${Number(stats.revenue || 0).toLocaleString("en-IN")}`,
          icon: IndianRupee,
          bg: "from-teal-500 to-green-600",
          route: "/admin/orders",
          permission: "order.view",
        },
      ];

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";

    return "Good Evening";
  };

  const getDaysLeft = (endDate) => {
    if (!endDate) return null;

    const today = new Date();
    const expiry = new Date(endDate);

    return Math.max(Math.ceil((expiry - today) / (1000 * 60 * 60 * 24)), 0);
  };

  const daysLeft = getDaysLeft(stats.hero?.endDate);

  const usageItems = isSuperAdmin
    ? [
        {
          label: "Organizations",
          used: stats.organizations || 0,
          max: null,
        },
        {
          label: "Subscriptions",
          used: stats.activeSubscriptions || 0,
          max: null,
        },
        {
          label: "Pending Approvals",
          used: stats.pendingApprovals || 0,
          max: null,
        },
      ]
    : [
        {
          label: "Students",
          used: stats.students,
          max: stats.hero?.limits?.maxStudents,
        },
        {
          label: "Courses",
          used: stats.courses,
          max: stats.hero?.limits?.maxCourses,
        },
        {
          label: "Faculty",
          used: stats.admins,
          max: stats.hero?.limits?.maxFaculty,
        },
      ];

  const getUsagePercent = (used, max) => {
    if (!max) return 0;

    return Math.min(Math.round((used / max) * 100), 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-4 sm:p-6">
      <div className="mb-6 overflow-hidden rounded-3xl border border-white/70 bg-white shadow-xl">
        <div className="bg-gradient-to-r from-purple-700 via-violet-600 to-indigo-600 p-6 text-white">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-bold text-purple-100">
                {isSuperAdmin ? "Super Admin Dashboard" : "Admin Dashboard"}
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                {isSuperAdmin
                  ? "Platform Control Center 🚀"
                  : `${getGreeting()}, Welcome Back 👋`}
              </h1>

              <p className="mt-2 text-sm text-purple-100">
                {isSuperAdmin
                  ? "Manage organizations, approvals, roles, plans and platform revenue."
                  : "Manage your organization, students, courses and revenue from one smart dashboard."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/20 px-4 py-2 text-xs font-bold">
                  {stats.hero?.organizationName}
                </span>

                <span className="rounded-full bg-emerald-400/20 px-4 py-2 text-xs font-bold text-emerald-100">
                  {stats.hero?.planName}
                </span>

                <span className="rounded-full bg-green-400/20 px-4 py-2 text-xs font-bold text-green-100">
                  {stats.hero?.subscriptionStatus}
                </span>

                {!isSuperAdmin && daysLeft !== null && (
                  <span className="rounded-full bg-orange-400/20 px-4 py-2 text-xs font-bold text-orange-100">
                    {daysLeft} days left
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {isSuperAdmin ? (
                <>
                  <button
                    onClick={() => router.push("/admin/approval-requests")}
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-purple-700 shadow-lg hover:bg-purple-50"
                  >
                    View Approvals
                  </button>

                  <button
                    onClick={() => router.push("/admin/subscription-plans")}
                    className="rounded-2xl bg-gray-950 px-5 py-3 text-sm font-black text-white shadow-lg hover:bg-black"
                  >
                    Manage Plans
                  </button>
                </>
              ) : (
                <>
                  {hasPermission("student.create") && (
                    <button
                      onClick={() => router.push("/admin/add-student")}
                      className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-purple-700 shadow-lg hover:bg-purple-50"
                    >
                      + Student
                    </button>
                  )}

                  {hasPermission("course.create") && (
                    <button
                      onClick={() => router.push("/admin/add-course")}
                      className="rounded-2xl bg-gray-950 px-5 py-3 text-sm font-black text-white shadow-lg hover:bg-black"
                    >
                      + Course
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 bg-white p-5 md:grid-cols-3">
          {usageItems.map((item) => {
            const percent = getUsagePercent(item.used, item.max);

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-600">
                    {item.label}
                  </p>

                  <p className="text-sm font-black text-slate-900">
                    {item.used}
                    {item.max ? ` / ${item.max}` : ""}
                  </p>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-purple-600"
                    style={{ width: item.max ? `${percent}%` : "100%" }}
                  />
                </div>

                <p className="mt-2 text-xs font-semibold text-slate-400">
                  {item.max ? `${percent}% used` : "Platform Overview"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards
          .filter((card) => hasPermission(card.permission))
          .map((card) => {
            const Icon = card.icon;

            return (
              <button
                key={card.title}
                onClick={() => router.push(card.route)}
                className="group overflow-hidden rounded-3xl border border-white/70 bg-white text-left shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className={`bg-gradient-to-br ${card.bg} p-5 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="rounded-2xl bg-white/20 p-3">
                      <Icon className="h-7 w-7" />
                    </div>

                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                      View
                    </span>
                  </div>

                  <h2 className="mt-5 text-3xl font-black">{card.value}</h2>

                  <p className="mt-1 text-sm font-semibold text-white/90">
                    {card.title}
                  </p>
                </div>
              </button>
            );
          })}
      </div>

      {hasPermission("analytics.view") && (
        <div className="mt-6 rounded-3xl border border-white/70 bg-white p-5 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Left Side */}
            <div className="flex-1">
              <h2 className="text-xl font-black text-gray-900">
                Student Activity Logs
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Select a student to view page activity, visited pages and recent
                logs.
              </p>
            </div>

            {/* Right Side */}
            <div className="md:ml-auto">
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  fetchActivityByUser(e.target.value);
                }}
                className="w-full min-w-[320px] rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-purple-500"
              >
                <option value="">Select Student</option>

                {studentsList.map((student) => (
                  <option key={student.userId} value={student.userId}>
                    {student.firstName} {student.lastName} - {student.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {hasPermission("analytics.view") && (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/70 bg-white p-5 shadow-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  User Activity
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  View activity by date range
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={rangeType}
                  onChange={(e) => {
                    const value = e.target.value;
                    setRangeType(value);

                    if (selectedUserId && value !== "custom") {
                      fetchActivityByUser(selectedUserId, value, customDates);
                    }
                  }}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold outline-none"
                >
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="180">Last 6 Months</option>
                  <option value="365">Last 1 Year</option>
                  <option value="custom">Custom Date</option>
                </select>

                {rangeType === "custom" && (
                  <>
                    <input
                      type="date"
                      value={customDates.startDate}
                      onChange={(e) =>
                        setCustomDates((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold outline-none"
                    />

                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={customDates.endDate}
                        onChange={(e) =>
                          setCustomDates((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold outline-none"
                      />

                      <button
                        type="button"
                        onClick={handleResetDates}
                        title="Reset Dates"
                        className="rounded-xl border border-gray-200 bg-gray-50 p-2 text-gray-600 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <RotateCcw size={18} />
                      </button>
                    </div>

                    <div className="w-full flex justify-end">
                      <button
                        onClick={() =>
                          fetchActivityByUser(
                            selectedUserId,
                            "custom",
                            customDates,
                          )
                        }
                        disabled={
                          !selectedUserId ||
                          !customDates.startDate ||
                          !customDates.endDate
                        }
                        className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        Apply
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{ width: "100%", height: 300 }} className="mt-4">
              {activity.dailyLogs.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-600">
                      No activity found
                    </p>

                    {rangeType === "custom" && (
                      <p className="mt-2 text-sm text-gray-400">
                        No activity between {customDates.startDate} and{" "}
                        {customDates.endDate}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedDailyLogs}>
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Visits"
                      stroke="#7c3aed"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white p-5 shadow-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  Most Visited Pages
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Check most visited pages for a single day
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  type="date"
                  value={topPageDate}
                  onChange={(e) => setTopPageDate(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold outline-none"
                />

                <button
                  onClick={fetchTopPagesBySingleDate}
                  disabled={!selectedUserId || !topPageDate}
                  className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  Apply
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTopPageDate("");

                    if (selectedUserId) {
                      fetchActivityByUser(
                        selectedUserId,
                        rangeType,
                        customDates,
                      );
                    }
                  }}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-red-50 hover:text-red-600"
                >
                  Reset
                </button>
              </div>
            </div>

            <div style={{ width: "100%", height: 300 }} className="mt-4">
              {formattedTopPages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm font-bold text-gray-400">
                  No visited page data found
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedTopPages}>
                    <XAxis
                      dataKey="pageName"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="total"
                      name="Visits"
                      fill="#7c3aed"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/70 bg-white p-5 shadow-xl lg:col-span-2">
          <h2 className="text-xl font-black text-gray-900">Quick Management</h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {hasPermission("student.view") && (
              <button
                onClick={() => router.push("/admin/students")}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left hover:bg-purple-50"
              >
                <p className="font-bold text-gray-900">Manage Students</p>
                <p className="mt-1 text-sm text-gray-500">
                  View, update and delete student records.
                </p>
              </button>
            )}

            {hasPermission("admin.view") && (
              <button
                onClick={() => router.push("/admin/admins")}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left hover:bg-purple-50"
              >
                <p className="font-bold text-gray-900">Manage Admins</p>
                <p className="mt-1 text-sm text-gray-500">
                  View faculty/admin users and roles.
                </p>
              </button>
            )}

            {hasPermission("course.view") && (
              <button
                onClick={() => router.push("/admin/courses")}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left hover:bg-purple-50"
              >
                <p className="font-bold text-gray-900">Manage Courses</p>
                <p className="mt-1 text-sm text-gray-500">
                  Add, edit and organize courses.
                </p>
              </button>
            )}

            {hasPermission("order.view") && (
              <button
                onClick={() => router.push("/admin/orders")}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left hover:bg-purple-50"
              >
                <p className="font-bold text-gray-900">View Orders</p>
                <p className="mt-1 text-sm text-gray-500">
                  Track payments, revenue and purchases.
                </p>
              </button>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white p-5 shadow-xl">
          <h2 className="text-xl font-black text-gray-900">Summary</h2>

          <div className="mt-5 space-y-4">
            <div className="flex justify-between rounded-2xl bg-green-50 p-4">
              <span className="font-bold text-green-800">Active Ratio</span>
              <span className="font-black text-green-700">
                {stats.students
                  ? Math.round((stats.activeStudents / stats.students) * 100)
                  : 0}
                %
              </span>
            </div>

            <div className="flex justify-between rounded-2xl bg-purple-50 p-4">
              <span className="font-bold text-purple-800">Avg Revenue</span>
              <span className="font-black text-purple-700">
                ₹
                {stats.orders
                  ? Math.round(Number(stats.revenue || 0) / stats.orders)
                  : 0}
              </span>
            </div>

            <div className="flex justify-between rounded-2xl bg-orange-50 p-4">
              <span className="font-bold text-orange-800">Courses Sold</span>
              <span className="font-black text-orange-700">
                {stats.libraryCourses}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
