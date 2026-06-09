"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import API_URL from "@/config/api";
import {
  ArrowLeft,
  BookOpen,
  Eye,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Trash2,
  User,
} from "lucide-react";

export default function StudentDetailsPage() {
  const router = useRouter();
  const { userId } = useParams();

  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_URL}/students/${userId}/details`, {
        withCredentials: true,
      });

      setStudent(res.data.data.student);
      setCourses(res.data.data.courses || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load student details");
      router.push("/admin/students");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseProgress = async (course) => {
    try {
      setSelectedCourse(course);

      const res = await axios.get(
        `${API_URL}/students/${userId}/course/${course.courseId}/progress`,
        { withCredentials: true }
      );

      setChapters(res.data.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load course progress");
    }
  };

  const resetCourseProgress = async (courseId) => {
    if (!confirm("Reset progress for this course?")) return;

    try {
      setActionLoading(true);

      const res = await axios.post(
        `${API_URL}/students/reset-course-progress`,
        { userId, courseId },
        { withCredentials: true }
      );

      alert(res.data.message || "Course progress reset successfully");

      setSelectedCourse(null);
      setChapters([]);
      await fetchStudentDetails();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reset progress");
    } finally {
      setActionLoading(false);
    }
  };

  const resetAllProgress = async () => {
    if (!confirm("Reset all progress of this student?")) return;

    try {
      setActionLoading(true);

      const res = await axios.post(
        `${API_URL}/students/reset-all-progress`,
        { userId },
        { withCredentials: true }
      );

      alert(res.data.message || "All progress reset successfully");

      setSelectedCourse(null);
      setChapters([]);
      await fetchStudentDetails();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reset all progress");
    } finally {
      setActionLoading(false);
    }
  };

  const removeCourse = async (courseId) => {
    if (!confirm("Remove this course from student library?")) return;

    try {
      setActionLoading(true);

      const res = await axios.post(
        `${API_URL}/students/remove-course`,
        { userId, courseId },
        { withCredentials: true }
      );

      alert(res.data.message || "Course removed successfully");

      setSelectedCourse(null);
      setChapters([]);
      await fetchStudentDetails();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove course");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchStudentDetails();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-gray-300 border-t-purple-700" />
      </div>
    );
  }

  if (!student) return null;

  const avgProgress =
    courses.length === 0
      ? 0
      : Math.round(
          courses.reduce((sum, item) => sum + Number(item.progress || 0), 0) /
            courses.length
        );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 px-4 py-8">
      <button
        onClick={() => router.push("/admin/students")}
        className="mb-6 flex items-center gap-2 font-bold text-purple-700 hover:text-purple-900"
      >
        <ArrowLeft className="h-5 w-5" />
        Back To Students
      </button>

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                <User className="h-10 w-10" />
              </div>

              <div>
                <h1 className="text-3xl font-black text-gray-900">
                  {student.firstName} {student.lastName}
                </h1>

                <p className="mt-1 text-sm font-semibold text-gray-500">
                  Student ID: #{student.userId}
                </p>

                <span
                  className={`mt-3 inline-block rounded-full px-4 py-1 text-xs font-black ${
                    Number(student.isActive) === 1
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {Number(student.isActive) === 1 ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <button
              disabled={actionLoading}
              onClick={resetAllProgress}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-black text-white hover:bg-red-700 disabled:opacity-60"
            >
              <RotateCcw className="h-5 w-5" />
              Reset All Progress
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <Mail className="mb-2 h-5 w-5 text-purple-700" />
              <p className="text-xs font-bold text-gray-500">Email</p>
              <p className="font-bold text-gray-900">{student.email}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <Phone className="mb-2 h-5 w-5 text-purple-700" />
              <p className="text-xs font-bold text-gray-500">Phone</p>
              <p className="font-bold text-gray-900">
                {student.phoneNo || "N/A"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <MapPin className="mb-2 h-5 w-5 text-purple-700" />
              <p className="text-xs font-bold text-gray-500">Location</p>
              <p className="font-bold text-gray-900">
                {student.city || "N/A"}, {student.state || "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 shadow">
            <p className="text-sm font-bold text-gray-500">Purchased Courses</p>
            <h2 className="mt-2 text-4xl font-black text-purple-700">
              {courses.length}
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow">
            <p className="text-sm font-bold text-gray-500">Average Progress</p>
            <h2 className="mt-2 text-4xl font-black text-green-600">
              {avgProgress}%
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow">
            <p className="text-sm font-bold text-gray-500">Completed Courses</p>
            <h2 className="mt-2 text-4xl font-black text-blue-600">
              {courses.filter((item) => Number(item.progress || 0) === 100).length}
            </h2>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="mb-5 flex items-center gap-2 text-2xl font-black text-gray-900">
              <BookOpen className="h-6 w-6 text-purple-700" />
              Purchased Courses
            </h2>

            {courses.length === 0 ? (
              <p className="rounded-2xl bg-gray-50 p-6 text-center font-bold text-gray-400">
                No purchased courses found.
              </p>
            ) : (
              <div className="space-y-4">
                {courses.map((course) => (
                  <div
                    key={course.courseId}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-gray-900">
                          {course.courseName}
                        </h3>

                        <p className="mt-1 text-xs font-bold text-gray-500">
                          Purchased:{" "}
                          {course.purchasedAt
                            ? new Date(course.purchasedAt).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>

                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700">
                        {course.progress || 0}%
                      </span>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-purple-700"
                        style={{ width: `${course.progress || 0}%` }}
                      />
                    </div>

                    <p className="mt-2 text-xs font-bold text-gray-500">
                      Total Chapters: {course.totalChapters || 0}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => fetchCourseProgress(course)}
                        className="inline-flex items-center gap-1 rounded-xl bg-blue-100 px-3 py-2 text-sm font-black text-blue-700 hover:bg-blue-200"
                      >
                        <Eye className="h-4 w-4" />
                        View Progress
                      </button>

                      <button
                        disabled={actionLoading}
                        onClick={() => resetCourseProgress(course.courseId)}
                        className="inline-flex items-center gap-1 rounded-xl bg-orange-100 px-3 py-2 text-sm font-black text-orange-700 hover:bg-orange-200 disabled:opacity-60"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                      </button>

                      <button
                        disabled={actionLoading}
                        onClick={() => removeCourse(course.courseId)}
                        className="inline-flex items-center gap-1 rounded-xl bg-red-100 px-3 py-2 text-sm font-black text-red-700 hover:bg-red-200 disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="mb-5 text-2xl font-black text-gray-900">
              Course Chapter Progress
            </h2>

            {!selectedCourse ? (
              <p className="rounded-2xl bg-gray-50 p-6 text-center font-bold text-gray-400">
                Select a course to view chapter progress.
              </p>
            ) : (
              <div>
                <h3 className="mb-4 rounded-2xl bg-purple-100 p-4 font-black text-purple-800">
                  {selectedCourse.courseName}
                </h3>

                <div className="space-y-3">
                  {chapters.length === 0 ? (
                    <p className="rounded-2xl bg-gray-50 p-6 text-center font-bold text-gray-400">
                      No chapters found.
                    </p>
                  ) : (
                    chapters.map((chapter) => (
                      <div
                        key={chapter.chId}
                        className="rounded-2xl border border-gray-200 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-black text-gray-900">
                              {chapter.chapterName}
                            </p>
                            <p className="text-xs font-bold text-gray-500">
                              Chapter ID: #{chapter.chId}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              Number(chapter.progress) >= 100
                                ? "bg-green-100 text-green-700"
                                : Number(chapter.progress) > 0
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {Number(chapter.progress) >= 100
                              ? "Completed"
                              : Number(chapter.progress) > 0
                              ? `${chapter.progress}%`
                              : "Not Started"}
                          </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{ width: `${chapter.progress || 0}%` }}
                          />
                        </div>

                        <div className="mt-3 grid gap-2 text-xs font-bold text-gray-500 sm:grid-cols-4">
                          <span>Desc: {chapter.descDone ? "Done" : "Pending"}</span>
                          <span>Notes: {chapter.notesProgress || 0}%</span>
                          <span>Video: {chapter.videoProgress || 0}%</span>
                          <span>Source: {chapter.sourceProgress || 0}%</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}