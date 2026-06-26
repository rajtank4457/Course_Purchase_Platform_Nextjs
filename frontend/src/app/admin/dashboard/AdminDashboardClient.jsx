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

export default function AdminDashboardClient() {
  const router = useRouter();

  const [stats, setStats] = useState({
    students: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    admins: 0,
    courses: 0,
    orders: 0,
    revenue: 0,
    libraryCourses: 0,
  });

  const [studentsList, setStudentsList] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [activity, setActivity] = useState({
    dailyLogs: [],
    topPages: [],
    recentLogs: [],
  });

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
      console.error(err);
    }
  };

  const selectedStudent = studentsList.find(
    (s) => String(s.userId) === String(selectedUserId),
  );

  const fetchActivityByUser = async (userId) => {
    try {
      if (!userId) return;

      const res = await apiRequest(activityApi.getStudentDashboard(userId), {
        method: "GET",
      });

      console.log("TOP PAGES:", res.data?.data?.topPages);
      console.log("RECENT LOGS:", res.data?.data?.recentLogs);

      if (!res.success) {
        console.error(res.message);
        return;
      }

      setActivity(
        res.data?.data || {
          dailyLogs: [],
          topPages: [],
          recentLogs: [],
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
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchStudentsForActivity();
  }, []);

  const formattedDailyLogs = activity.dailyLogs.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    }),
    total: Number(item.total || 0),
  }));

  const formattedTopPages = activity.topPages.map((item) => ({
    pageUrl: item.pageUrl || "Unknown Page",
    total: Number(item.total || 0),
  }));

  const cards = [
    {
      title: "Total Students",
      value: stats.students,
      icon: Users,
      bg: "from-blue-500 to-cyan-500",
      route: "/admin/students",
    },
    {
      title: "Active Students",
      value: stats.activeStudents,
      icon: UserCheck,
      bg: "from-green-500 to-emerald-500",
      route: "/admin/students?status=active",
    },
    {
      title: "Inactive Students",
      value: stats.inactiveStudents,
      icon: UserX,
      bg: "from-red-500 to-rose-500",
      route: "/admin/students?status=inactive",
    },
    {
      title: "Admins / Faculty",
      value: stats.admins,
      icon: ShieldCheck,
      bg: "from-purple-500 to-violet-600",
      route: "/admin/admins",
    },
    {
      title: "Courses",
      value: stats.courses,
      icon: GraduationCap,
      bg: "from-orange-500 to-amber-500",
      route: "/admin/courses",
    },
    {
      title: "Orders",
      value: stats.orders,
      icon: ShoppingBag,
      bg: "from-pink-500 to-fuchsia-500",
      route: "/admin/orders",
    },
    {
      title: "Library Courses",
      value: stats.libraryCourses,
      icon: BookOpen,
      bg: "from-indigo-500 to-blue-600",
      route: "/admin/library",
    },
    {
      title: "Total Revenue",
      value: `₹${Number(stats.revenue || 0)}`,
      icon: IndianRupee,
      bg: "from-teal-500 to-green-600",
      route: "/admin/orders",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-4 sm:p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-3xl border border-white/70 bg-white/80 p-5 shadow-xl backdrop-blur sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-bold text-purple-700">Admin Dashboard</p>

          <h1 className="mt-1 text-3xl font-black text-gray-900 sm:text-4xl">
            Welcome Back 👋
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage students, admins, courses, orders and revenue from one place.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/admin/add-student")}
            className="rounded-2xl bg-purple-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-200 hover:bg-purple-800"
          >
            + Student
          </button>

          <button
            onClick={() => router.push("/admin/add-course")}
            className="rounded-2xl bg-gray-900 px-5 py-3 text-sm font-bold text-white shadow-lg hover:bg-black"
          >
            + Course
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
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

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/70 bg-white p-5 shadow-xl">
          <h2 className="text-xl font-black text-gray-900">
            User Activity - Last 7 Days
          </h2>

          <div style={{ width: "100%", height: 300 }}>
            {formattedDailyLogs.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm font-bold text-gray-400">
                No activity found for this student
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
          <h2 className="text-xl font-black text-gray-900">
            Most Visited Pages
          </h2>

          <p className="mt-2 text-xs text-gray-500">
            Top pages found: {formattedTopPages.length}
          </p>

          <div style={{ width: "100%", height: 300 }}>
            {formattedTopPages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm font-bold text-gray-400">
                No visited page data found
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedTopPages}>
                  <XAxis
                    dataKey="pageUrl"
                    tick={{ fontSize: 10 }}
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

      <div className="mt-6 rounded-3xl border border-white/70 bg-white p-5 shadow-xl">
        <h2 className="text-xl font-black text-gray-900">
          Recent User Page Logs
        </h2>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="p-3">User</th>
                <th className="p-3">Email</th>
                <th className="p-3">Page</th>
                <th className="p-3">Action</th>
                <th className="p-3">Time</th>
              </tr>
            </thead>

            <tbody>
              {activity.recentLogs.map((log) => (
                <tr key={log.logId} className="border-b">
                  <td className="p-3 font-bold text-gray-900">
                    {log.firstName} {log.lastName}
                  </td>

                  <td className="p-3 text-gray-600">{log.email}</td>

                  <td className="p-3 text-purple-700">{log.pageUrl}</td>

                  <td className="p-3">{log.actionType}</td>

                  <td className="p-3 text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/70 bg-white p-5 shadow-xl lg:col-span-2">
          <h2 className="text-xl font-black text-gray-900">Quick Management</h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => router.push("/admin/students")}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left hover:bg-purple-50"
            >
              <p className="font-bold text-gray-900">Manage Students</p>
              <p className="mt-1 text-sm text-gray-500">
                View, update and delete student records.
              </p>
            </button>

            <button
              onClick={() => router.push("/admin/admins")}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left hover:bg-purple-50"
            >
              <p className="font-bold text-gray-900">Manage Admins</p>
              <p className="mt-1 text-sm text-gray-500">
                View faculty/admin users and roles.
              </p>
            </button>

            <button
              onClick={() => router.push("/admin/courses")}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left hover:bg-purple-50"
            >
              <p className="font-bold text-gray-900">Manage Courses</p>
              <p className="mt-1 text-sm text-gray-500">
                Add, edit and organize courses.
              </p>
            </button>

            <button
              onClick={() => router.push("/admin/orders")}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left hover:bg-purple-50"
            >
              <p className="font-bold text-gray-900">View Orders</p>
              <p className="mt-1 text-sm text-gray-500">
                Track payments, revenue and purchases.
              </p>
            </button>
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
