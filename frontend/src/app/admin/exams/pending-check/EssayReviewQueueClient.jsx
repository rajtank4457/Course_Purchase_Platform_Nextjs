"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Clock,
  Eye,
  FileText,
  Search,
  User,
  BookOpen,
  ClipboardCheck,
} from "lucide-react";
import API_URL from "@/config/api";

export default function EssayReviewQueueClient() {
  const router = useRouter();

  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchPendingEssays = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_URL}/exams/admin/pending-essays`, {
        withCredentials: true,
      });

      setAttempts(res.data.data || []);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to load pending essays");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingEssays();
  }, []);

  const filteredAttempts = attempts.filter((item) => {
    const text = `${item.studentName} ${item.examTitle} ${item.courseName}`
      .toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-white p-6 shadow">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-1 text-sm font-black text-yellow-700">
                <Clock className="h-4 w-4" />
                Pending Manual Checking
              </span>

              <h1 className="mt-3 text-3xl font-black text-gray-900">
                Essay Review Queue
              </h1>

              <p className="mt-1 text-gray-600">
                Review descriptive answers submitted by students.
              </p>
            </div>

            <div className="rounded-2xl bg-purple-700 px-6 py-4 text-white">
              <p className="text-sm font-semibold opacity-80">
                Pending Essays
              </p>
              <p className="text-3xl font-black">{attempts.length}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="rounded-3xl bg-white p-5 shadow">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              placeholder="Search by student, exam or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 py-3 pl-12 pr-4 font-semibold outline-none focus:border-purple-600"
            />
          </div>
        </div>

        {/* Content */}
        <div className="rounded-3xl bg-white p-6 shadow">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-700" />
            </div>
          ) : filteredAttempts.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <ClipboardCheck className="h-16 w-16 text-gray-300" />

              <h2 className="mt-4 text-xl font-black text-gray-800">
                No Pending Essays
              </h2>

              <p className="mt-1 text-gray-500">
                All descriptive answers are checked.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-sm text-gray-500">
                    <th className="px-4 py-2">Attempt</th>
                    <th className="px-4 py-2">Student</th>
                    <th className="px-4 py-2">Course</th>
                    <th className="px-4 py-2">Exam</th>
                    <th className="px-4 py-2">Marks</th>
                    <th className="px-4 py-2">Submitted</th>
                    <th className="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAttempts.map((item) => (
                    <tr
                      key={item.attemptId}
                      className="rounded-2xl bg-gray-50 shadow-sm"
                    >
                      <td className="rounded-l-2xl px-4 py-4">
                        <span className="font-black text-purple-700">
                          #{item.attemptId}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                            <User className="h-5 w-5 text-purple-700" />
                          </div>

                          <div>
                            <p className="font-black text-gray-900">
                              {item.studentName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-gray-500" />
                          <span className="font-bold text-gray-700">
                            {item.courseName}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="font-bold text-gray-700">
                            {item.examTitle}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-black text-blue-700">
                          {item.totalMarks} Marks
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-gray-700">
                          {item.submittedAt
                            ? new Date(item.submittedAt).toLocaleString()
                            : "Not available"}
                        </p>
                      </td>

                      <td className="rounded-r-2xl px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/admin/essay-check/${item.attemptId}`
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-4 py-2 text-sm font-black text-white hover:bg-purple-800"
                        >
                          <Eye className="h-4 w-4" />
                          Review
                        </button>
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