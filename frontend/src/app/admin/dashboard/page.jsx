"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "@/config/api";
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

export default function AdminDashboard() {
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

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/dashboard/stats`, {
        withCredentials: true,
      });

      setStats(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

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
          <p className="text-sm font-bold text-purple-700">
            Admin Dashboard
          </p>

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

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/70 bg-white p-5 shadow-xl lg:col-span-2">
          <h2 className="text-xl font-black text-gray-900">
            Quick Management
          </h2>

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