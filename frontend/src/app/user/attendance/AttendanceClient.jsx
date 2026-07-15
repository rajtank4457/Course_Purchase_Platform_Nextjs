"use client";

import { useEffect, useState } from "react";
import { apiRequest, attendanceApi } from "@/lib/apiHelper";
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  Percent,
} from "lucide-react";

export default function AttendanceClient() {
  const [attendance, setAttendance] = useState({
    summary: {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      totalStudyTime: "0m",
      attendancePercent: 0,
    },
    logs: [],
  });

  const [days, setDays] = useState("30");
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async (selectedDays = days) => {
    try {
      setLoading(true);

      const res = await apiRequest(attendanceApi.getMyAttendance, {
        method: "GET",
        params: {
          days: selectedDays,
        },
      });

      if (!res.success) {
        setAttendance({
          summary: {
            totalDays: 0,
            presentDays: 0,
            absentDays: 0,
            totalStudyTime: "0m",
            attendancePercent: 0,
          },
          logs: [],
        });
        return;
      }

      setAttendance(res.data?.data || attendance);
    } catch (err) {
      console.log("ATTENDANCE FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const summary = attendance.summary;
  const logs = attendance.logs || [];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-lg font-bold text-purple-700">
        Loading attendance...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 px-5 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 rounded-3xl bg-white p-6 shadow-xl md:flex-row md:items-center">
          <div>
            <span className="rounded-full bg-purple-100 px-4 py-1 text-sm font-bold text-purple-700">
              My Attendance
            </span>

            <h1 className="mt-3 text-4xl font-black text-gray-900">
              Attendance Dashboard
            </h1>

            <p className="mt-2 text-gray-500">
              Track your learning attendance, study time and daily presence.
            </p>
          </div>

          <select
            value={days}
            onChange={(e) => {
              setDays(e.target.value);
              fetchAttendance(e.target.value);
            }}
            className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-purple-500"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 3 Months</option>
            <option value="180">Last 6 Months</option>
            <option value="365">Last 1 Year</option>
          </select>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard
            title="Total Days"
            value={summary.totalDays}
            icon={CalendarCheck}
            bg="from-blue-500 to-cyan-500"
          />

          <SummaryCard
            title="Present"
            value={summary.presentDays}
            icon={CheckCircle}
            bg="from-green-500 to-emerald-500"
          />

          <SummaryCard
            title="Absent"
            value={summary.absentDays}
            icon={XCircle}
            bg="from-red-500 to-rose-500"
          />

          <SummaryCard
            title="Study Time"
            value={summary.totalStudyTime}
            icon={Clock}
            bg="from-orange-500 to-amber-500"
          />

          <SummaryCard
            title="Attendance"
            value={`${summary.attendancePercent}%`}
            icon={Percent}
            bg="from-purple-500 to-violet-600"
          />
        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900">
                Attendance History
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your daily login, logout and study duration.
              </p>
            </div>
          </div>

          {logs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 p-10 text-center">
              <h3 className="text-xl font-black text-gray-900">
                No attendance found
              </h3>

              <p className="mt-2 text-gray-500">
                Start learning to generate attendance records.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="p-4">Date</th>
                    <th className="p-4">Login Time</th>
                    <th className="p-4">Logout Time</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log) => (
                    <tr key={log.attendanceId} className="border-b">
                      <td className="p-4 font-bold text-gray-900">
                        {new Date(log.attendanceDate).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </td>

                      <td className="p-4 text-gray-600">
                        {log.loginTime
                          ? new Date(log.loginTime).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                          : "-"}
                      </td>

                      <td className="p-4 text-gray-600">
                        {log.logoutTime
                          ? new Date(log.logoutTime).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                          : "Active"}
                      </td>

                      <td className="p-4 font-bold text-purple-700">
                        {formatMinutes(log.totalMinutes)}
                      </td>

                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            log.status === "present"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {log.status === "present" ? "Present" : "Absent"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, bg }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
      <div className={`bg-gradient-to-br ${bg} p-5 text-white`}>
        <div className="rounded-2xl bg-white/20 p-3 w-fit">
          <Icon className="h-6 w-6" />
        </div>

        <h2 className="mt-5 text-3xl font-black">{value}</h2>

        <p className="mt-1 text-sm font-semibold text-white/90">{title}</p>
      </div>
    </div>
  );
}

function formatMinutes(minutes = 0) {
  const total = Number(minutes || 0);
  const hrs = Math.floor(total / 60);
  const mins = total % 60;

  if (hrs <= 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}
