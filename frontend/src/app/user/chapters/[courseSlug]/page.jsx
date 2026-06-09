import { cookies } from "next/headers";
import Link from "next/link";
import API_URL from "@/config/api";
import { ArrowLeft, PlayCircle, FileText } from "lucide-react";

async function getChapters(courseSlug) {
  const cookieStore = await cookies();

  const res = await fetch(`${API_URL}/chapters/course/${courseSlug}`, {
    headers: {
      Cookie: cookieStore.toString(),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      course: null,
      chapters: [],
    };
  }

  const data = await res.json();

  return {
    course: data.course,
    chapters: data.data || [],
  };
}

export default async function UserCourseChaptersPage({ params }) {
  const { courseSlug } = await params;

  const { course, chapters } = await getChapters(courseSlug);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 px-5 py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/user/dashboard"
          className="mb-6 inline-flex items-center gap-2 font-semibold text-purple-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8 rounded-3xl bg-white p-6 shadow">
          <span className="rounded-full bg-purple-100 px-4 py-1 text-sm font-bold text-purple-700">
            Course Chapters
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
              No chapters are available for this course yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {chapters.map((chapter, index) => (
              <Link
                key={chapter.chId}
                href={`/user/chapter-details/${chapter.slug}`}
                className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-2xl bg-purple-100 p-3 text-purple-700">
                    <FileText className="h-6 w-6" />
                  </div>

                  <span className="text-sm font-bold text-gray-400">
                    Chapter {index + 1}
                  </span>
                </div>

                <h2 className="text-xl font-black text-gray-900 group-hover:text-purple-700">
                  {chapter.chapterName}
                </h2>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
                  {chapter.chapterDesc}
                </p>

                <div className="mt-5 flex items-center gap-2 text-sm font-bold text-purple-700">
                  <PlayCircle className="h-4 w-4" />
                  Start Learning
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}