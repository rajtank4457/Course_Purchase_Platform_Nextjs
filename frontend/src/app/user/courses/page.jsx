"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import API_URL from "@/config/api";
import { ArrowLeft, BookOpen, CheckCircle } from "lucide-react";

const Page = () => {
  const router = useRouter();

  const [courses, setCourses] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [role, setRole] = useState("");
  const [student, setStudent] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/home`, {
        withCredentials: true,
      });

      const user = res.data.user;

      setRole(user.role || user.type || "");
      setStudent(user);
      setUserLoaded(true);
    } catch (err) {
      router.push("/login");
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_URL}/library`, {
        withCredentials: true,
      });

      setCourses(res.data.data || []);
    } catch (err) {
      console.log(err.response?.data || err);
    }
  };

  const fetchProgress = async () => {
    try {
      const res = await axios.get(`${API_URL}/progress`, {
        withCredentials: true,
      });

      setProgressMap(res.data.data || {});
    } catch (err) {
      console.log(err.response?.data || err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (!userLoaded) return;

    const loadData = async () => {
      setLoading(true);
      await fetchCourses();
      await fetchProgress();
      setLoading(false);
    };

    loadData();
  }, [userLoaded]);

  const getCourseProgress = (chapters = []) => {
    if (!chapters.length) return 0;

    let total = 0;

    chapters.forEach((chapter) => {
      total += Number(progressMap[chapter.chId] || 0);
    });

    return Math.round(total / chapters.length);
  };

  const activeCourses = courses.filter(
    (course) => Number(course.status || 1) !== -1
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-lg font-bold">
        Loading Courses...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      {role === "admin" && (
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
      )}

      {activeCourses.length === 0 ? (
        <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
          <BookOpen className="mb-4 h-16 w-16 text-purple-700" />

          <h2 className="text-3xl font-bold text-gray-900">
            Courses Not Purchased Or Added To Library
          </h2>

          <p className="mt-3 text-gray-600">
            Looks like no courses are available here.
          </p>

          <button
            onClick={() => router.push("/user/dashboard")}
            className="mt-6 rounded-xl bg-purple-700 px-6 py-3 font-bold text-white hover:bg-purple-800"
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <>
          <div className="mb-10 text-center">
            <span className="mb-3 inline-block rounded-full bg-purple-100 px-4 py-1 text-sm font-semibold text-purple-700">
              My Learning
            </span>

            <h2 className="text-4xl font-bold text-gray-900">
              Course Details
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {activeCourses.map((course) => {
              const courseProgress = getCourseProgress(course.chapters || []);

              return (
                <div
                  key={course.courseId}
                  className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="mb-5 overflow-hidden rounded-2xl bg-gray-100">
                    <img
                      src={
                        course.courseImg
                          ? `${API_URL}/uploads/${course.courseImg}`
                          : `${API_URL}/uploads/default-course.png`
                      }
                      alt={course.courseName}
                      className="h-44 w-full object-cover"
                    />
                  </div>

                  <div className="mb-5">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-bold text-gray-900">
                        Total Course Progress
                      </p>

                      <p className="font-bold text-green-700">
                        {courseProgress}%
                      </p>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-green-600"
                        style={{ width: `${courseProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-bold text-gray-500">
                      Course Name
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-gray-900">
                      {course.courseName}
                    </h3>
                  </div>

                  <div className="mb-5">
                    <p className="text-sm font-bold text-gray-500">
                      Course Description
                    </p>

                    <p className="mt-1 line-clamp-3 text-sm leading-6 text-gray-600">
                      {course.courseDesc}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {(course.chapters || []).map((chapter, index) => {
                      const progress = Number(progressMap[chapter.chId] || 0);

                      return (
                        <button
                          key={chapter.chId}
                          onClick={() =>
                            router.push(`/user/chapter-details/${chapter.slug}`)
                          }
                          className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100 text-left"
                        >
                          <div
                            className="absolute inset-y-0 left-0 bg-blue-500/20"
                            style={{ width: `${progress}%` }}
                          />

                          <div className="relative flex items-center justify-between gap-3 px-4 py-3">
                            <span className="line-clamp-1 text-sm font-semibold text-gray-800">
                              Ch-{index + 1}: {chapter.chapterName}
                            </span>

                            <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-blue-700">
                              {Math.round(progress)}%
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Page;