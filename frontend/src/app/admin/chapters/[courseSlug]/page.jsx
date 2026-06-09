import { cookies } from "next/headers";
import Link from "next/link";
import API_URL from "@/config/api";
import { ArrowLeft, PlayCircle, FileText } from "lucide-react";
import ChapterCard from "./ChapterCard";

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

export default async function AdminCourseChaptersPage({ params }) {
    const { courseSlug } = await params;

    const { course, chapters } = await getChapters(courseSlug);

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