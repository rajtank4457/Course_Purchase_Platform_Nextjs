"use client";

import { useEffect, useState } from "react";
import { apiRequest, courseApi, chapterApi } from "@/lib/apiHelper";
import EditCourseChapterClient from "./EditCourseChapterClient";

export default function EditCourseChapterClientWrapper({ courseId }) {
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourseAndChapters = async () => {
    try {
      const courseRes = await apiRequest(courseApi.getCourseById(courseId), {
        method: "GET",
      });

      if (!courseRes.success) {
        console.log(courseRes.message);
        setCourse(null);
        return;
      }

      const courseData = courseRes.data?.data || null;
      setCourse(courseData);

      if (!courseData?.courseSlug) {
        setChapters([]);
        return;
      }

      const chapterRes = await apiRequest(
        chapterApi.getChaptersByCourseSlug(courseData.courseSlug),
        {
          method: "GET",
        },
      );

      if (!chapterRes.success) {
        console.log(chapterRes.message);
        setChapters([]);
        return;
      }

      setChapters(
        Array.isArray(chapterRes.data?.data) ? chapterRes.data.data : [],
      );
    } catch (err) {
      console.log("GET COURSE/CHAPTER ERROR:", err);
      setCourse(null);
      setChapters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchCourseAndChapters();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-lg font-bold text-purple-700">
        Loading course...
      </div>
    );
  }

  return <EditCourseChapterClient courseData={course} chapterData={chapters} />;
}
