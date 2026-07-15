"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest, chapterApi } from "@/lib/apiHelper";
import { ArrowLeft } from "lucide-react";
import ChapterCard from "./ChapterCard";

export default function AdminCourseChaptersClient({ courseSlug }) {
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChapters = async () => {
    try {
      const res = await apiRequest(
        chapterApi.getChaptersByCourseSlug(courseSlug),
        {
          method: "GET",
        },
      );

      if (!res.success) {
        console.log(res.message);
        setCourse(null);
        setChapters([]);
        return;
      }

      setCourse(res.data?.course || null);
      setChapters(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.log("GET CHAPTERS ERROR:", err);
      setCourse(null);
      setChapters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseSlug) fetchChapters();
  }, [courseSlug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-purple-50 text-lg font-bold text-purple-700">
        Loading chapters...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 px-5 py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin/courses"
          className="mb-6 inline-flex items-center gap-2 font-semibold text-purple-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Link>

        <div className="mb-8 rounded-3xl bg-white p-6 shadow">
          <span className="rounded-full bg-purple-100 px-4 py-1 text-sm font-bold text-purple-700">
            Chapter Management
          </span>

          <h1 className="mt-3 text-3xl font-black text-gray-900">
            {course?.courseName || "Course Chapters"}
          </h1>

          <p className="mt-2 text-gray-500">
            Total Chapters: {chapters.length}
          </p>
        </div>

        {chapters.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow">
            <h2 className="text-2xl font-black text-gray-900">
              No Chapters Found
            </h2>

            <p className="mt-2 text-gray-500">
              Add chapters for this course first.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {chapters.map((chapter) => (
              <ChapterCard key={chapter.chId} chapter={chapter} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
