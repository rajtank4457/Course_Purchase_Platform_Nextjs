"use client";

import { useEffect, useState } from "react";
import { apiRequest, attendanceApi, studentApi } from "@/lib/apiHelper";
import { CalendarCheck, CheckCircle, XCircle, Clock, Save } from "lucide-react";

export default function AdminAttendanceClient() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({});
  const [students, setStudents] = useState([]);

  const [days, setDays] = useState("30");
  const [status, setStatus] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);

  const [manualForm, setManualForm] = useState({
    userId: "",
    attendanceDate: "",
    loginTime: "",
    logoutTime: "",
    totalMinutes: "",
    status: "present",
  });

  const fetchStudents = async () => {
    const res = await apiRequest(studentApi.getStudents, { method: "GET" });

    if (res.success) {
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      setStudents(list);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);

      const res = await apiRequest(attendanceApi.getAdminAttendance, {
        method: "GET",
        params: { days, userId, status },
      });

      if (res.success) {
        setLogs(res.data?.data?.logs || []);
        setSummary(res.data?.data?.summary || {});
      } else {
        setLogs([]);
        setSummary({});
      }
    } catch (err) {
      console.log("FETCH ADMIN ATTENDANCE ERROR:", err);
      setLogs([]);
      setSummary({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchAttendance();
  }, []);

  const saveManualAttendance = async () => {
    if (
      !manualForm.userId ||
      !manualForm.attendanceDate ||
      !manualForm.status
    ) {
      alert("Please select student, date and status");
      return;
    }

    const res = await apiRequest(attendanceApi.createManualAttendance, {
      method: "POST",
      data: manualForm,
    });

    if (!res.success) {
      alert(res.message || "Failed to save attendance");
      return;
    }

    alert("Manual attendance saved");

    setManualForm({
      userId: "",
      attendanceDate: "",
      loginTime: "",
      logoutTime: "",
      totalMinutes: "",
      status: "present",
    });

    fetchAttendance();
  };

  const updateStatus = async (attendanceId, newStatus) => {
    const res = await apiRequest(attendanceApi.updateAttendanceStatus, {
      method: "POST",
      data: { attendanceId, status: newStatus },
    });

    if (!res.success) {
      alert(res.message || "Failed to update attendance");
      return;
    }

    setLogs((prev) =>
      prev.map((item) =>
        Number(item.attendanceId) === Number(attendanceId)
          ? { ...item, status: newStatus }
          : item,
      ),
    );

    alert("Attendance updated");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 px-5 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl bg-white p-6 shadow-xl">
          <span className="rounded-full bg-purple-100 px-4 py-1 text-sm font-bold text-purple-700">
            Admin Attendance
          </span>

          <h1 className="mt-3 text-4xl font-black text-gray-900">
            Attendance Management
          </h1>

          <p className="mt-2 text-gray-500">
            Check, filter and manually update student attendance.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Records"
            value={summary.totalRecords || 0}
            icon={CalendarCheck}
            bg="from-blue-500 to-cyan-500"
          />

          <SummaryCard
            title="Present"
            value={summary.presentRecords || 0}
            icon={CheckCircle}
            bg="from-green-500 to-emerald-500"
          />

          <SummaryCard
            title="Absent"
            value={summary.absentRecords || 0}
            icon={XCircle}
            bg="from-red-500 to-rose-500"
          />

          <SummaryCard
            title="Study Minutes"
            value={summary.totalMinutes || 0}
            icon={Clock}
            bg="from-purple-500 to-violet-600"
          />
        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="text-2xl font-black text-gray-900">
            Add Manual Attendance
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <select
              value={manualForm.userId}
              onChange={(e) =>
                setManualForm((prev) => ({ ...prev, userId: e.target.value }))
              }
              className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold outline-none"
            >
              <option value="">Select Student</option>
              {students.map((student) => (
                <option key={student.userId} value={student.userId}>
                  {student.firstName} {student.lastName}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={manualForm.attendanceDate}
              onChange={(e) =>
                setManualForm((prev) => ({
                  ...prev,
                  attendanceDate: e.target.value,
                }))
              }
              className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold outline-none"
            />

            <input
              type="datetime-local"
              value={manualForm.loginTime}
              onChange={(e) =>
                setManualForm((prev) => ({
                  ...prev,
                  loginTime: e.target.value,
                }))
              }
              className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold outline-none"
            />

            <input
              type="datetime-local"
              value={manualForm.logoutTime}
              onChange={(e) =>
                setManualForm((prev) => ({
                  ...prev,
                  logoutTime: e.target.value,
                }))
              }
              className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold outline-none"
            />

            <select
              value={manualForm.status}
              onChange={(e) =>
                setManualForm((prev) => ({ ...prev, status: e.target.value }))
              }
              className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold outline-none"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>

            <button
              onClick={saveManualAttendance}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-700 px-5 py-3 text-sm font-bold text-white hover:bg-purple-800"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-xl">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900">
                Attendance Records
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Filter by days, student or status.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold outline-none"
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 3 Months</option>
                <option value="180">Last 6 Months</option>
                <option value="365">Last 1 Year</option>
              </select>

              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold outline-none"
              >
                <option value="">All Students</option>
                {students.map((student) => (
                  <option key={student.userId} value={student.userId}>
                    {student.firstName} {student.lastName}
                  </option>
                ))}
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold outline-none"
              >
                <option value="">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </select>

              <button
                onClick={fetchAttendance}
                className="rounded-2xl bg-gray-900 px-5 py-3 text-sm font-bold text-white hover:bg-black"
              >
                Apply
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-lg font-bold text-purple-700">
              Loading attendance...
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 p-10 text-center">
              <h3 className="text-xl font-black text-gray-900">
                No attendance records found
              </h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="p-4">Student</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Login</th>
                    <th className="p-4">Logout</th>
                    <th className="p-4">Minutes</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Manual Check</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log) => (
                    <tr key={log.attendanceId} className="border-b">
                      <td className="p-4">
                        <p className="font-black text-gray-900">
                          {log.firstName} {log.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{log.email}</p>
                      </td>

                      <td className="p-4 font-bold">
                        {new Date(log.attendanceDate).toLocaleDateString(
                          "en-IN",
                        )}
                      </td>

                      <td className="p-4">
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

                      <td className="p-4">
                        {log.logoutTime
                          ? new Date(log.logoutTime).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                          : "-"}
                      </td>

                      <td className="p-4 font-bold text-purple-700">
                        {log.totalMinutes || 0}
                      </td>

                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            log.status === "present"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>

                      <td className="p-4">
                        <select
                          value={log.status}
                          onChange={(e) =>
                            updateStatus(log.attendanceId, e.target.value)
                          }
                          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold outline-none"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                        </select>
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
        <div className="w-fit rounded-2xl bg-white/20 p-3">
          <Icon className="h-6 w-6" />
        </div>

        <h2 className="mt-5 text-3xl font-black">{value}</h2>
        <p className="mt-1 text-sm font-semibold text-white/90">{title}</p>
      </div>
    </div>
  );
}
