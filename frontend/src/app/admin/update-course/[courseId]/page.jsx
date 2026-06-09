import { cookies } from "next/headers";
import API_URL from "@/config/api";
import EditCourseChapterClient from "./EditCourseChapterClient";

async function getCourse(courseId) {
    try {
        const cookieStore = await cookies();

        const res = await fetch(`${API_URL}/courses/${courseId}`, {
            headers: {
                Cookie: cookieStore.toString(),
            },
            cache: "no-store",
        });

        if (!res.ok) {
            console.log("GET COURSE FAILED:", res.status);
            return null;
        }

        const data = await res.json();
        return data.data || null;
    } catch (err) {
        console.log("GET COURSE ERROR:", err.message);
        return null;
    }
}

async function getChapters(courseSlug) {
    try {
        if (!courseSlug) return [];

        const cookieStore = await cookies();

        const res = await fetch(`${API_URL}/chapters/course/${courseSlug}`, {
            headers: {
                Cookie: cookieStore.toString(),
            },
            cache: "no-store",
        });

        if (!res.ok) return [];

        const data = await res.json();
        return data.data || [];
    } catch (err) {
        console.log("GET CHAPTERS ERROR:", err.message);
        return [];
    }
}

export default async function UpdateCoursePage({ params }) {
    const { courseId } = await params;

    const course = await getCourse(courseId);
    const chapters = await getChapters(course?.courseSlug);

    return (
        <EditCourseChapterClient
            courseData={course}
            chapterData={chapters}
        />
    );
}