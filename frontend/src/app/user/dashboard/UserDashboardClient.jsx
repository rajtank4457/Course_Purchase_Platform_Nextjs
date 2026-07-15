"use client";

import { useEffect, useState } from "react";
import API_URL from "@/config/api";
import { apiRequest, courseApi, cartApi } from "@/lib/apiHelper";
import CourseActionButton from "./CourseActionButton";
import CourseChapterLink from "./CourseChapterLink";
import { Crown, BadgeCheck, Users } from "lucide-react";
import WishlistButton from "./WishlistButton";
import StudyTimeCard from "@/components/StudyTimeCard";
import AchievementBadges from "@/components/AchievementBadges";

const isNewCourse = (createdAt) => {
  if (!createdAt) return false;

  const courseDate = new Date(createdAt);
  const now = new Date();
  const diffHours = (now - courseDate) / (1000 * 60 * 60);

  return diffHours <= 24;
};

export default function UserDashboardClient() {
  const [courses, setCourses] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [courseRes, cartRes] = await Promise.all([
        apiRequest(courseApi.getCourses, {
          method: "GET",
        }),
        apiRequest(cartApi.getCart, {
          method: "GET",
        }),
      ]);

      if (courseRes.success) {
        setCourses(
          Array.isArray(courseRes.data?.data) ? courseRes.data.data : [],
        );
      } else {
        setCourses([]);
      }

      if (cartRes.success) {
        setCartItems(
          Array.isArray(cartRes.data?.data) ? cartRes.data.data : [],
        );
      } else {
        setCartItems([]);
      }
    } catch (err) {
      console.log("USER DASHBOARD ERROR:", err);
      setCourses([]);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCartAdded = (course) => {
    setCartItems((prev) => {
      const alreadyExists = prev.some(
        (item) => Number(item.courseId) === Number(course.courseId),
      );

      if (alreadyExists) return prev;

      return [
        ...prev,
        {
          courseId: course.courseId,
        },
      ];
    });
  };

  const handleWishlistChange = (courseId, value) => {
    setCourses((prev) =>
      prev.map((course) =>
        Number(course.courseId) === Number(courseId)
          ? { ...course, hasWishlist: value ? 1 : 0 }
          : course,
      ),
    );
  };

  const handleLibraryAdded = (course) => {
    setCourses((prev) =>
      prev.map((item) =>
        Number(item.courseId) === Number(course.courseId)
          ? { ...item, hasCourse: 1 }
          : item,
      ),
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-lg font-bold text-purple-700">
        Loading courses...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-purple-50 via-white to-orange-50 py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-3xl font-black text-gray-900">
              Welcome Back 👋
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Continue learning, track your study time and unlock achievements.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
            <StudyTimeCard />
            <AchievementBadges />
          </div>
        </div>
      </section>
      <section id="courses" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <span className="mb-3 inline-block rounded-full bg-purple-100 px-4 py-1 text-sm font-semibold text-purple-700">
              Explore Our Courses
            </span>

            <h2 className="text-4xl font-bold text-gray-900">
              Popular Courses
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Learn from top instructors and improve your skills.
            </p>
          </div>

          {courses.length === 0 ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-xl">
              <h3 className="text-2xl font-black text-gray-900">
                No Courses Found
              </h3>

              <p className="mt-2 text-gray-500">
                No courses are available right now.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const isInCart = cartItems.some(
                  (item) => Number(item.courseId) === Number(course.courseId),
                );

                const isInLibrary = Number(course.hasCourse) === 1;

                return (
                  <div
                    key={course.courseId}
                    className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div className="relative aspect-video bg-gray-100">
                      <img
                        src={
                          course.courseImg
                            ? `${API_URL}/uploads/${course.courseImg}`
                            : `${API_URL}/uploads/default-course.png`
                        }
                        alt={course.courseName}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />

                      {isNewCourse(course.createdAt) && (
                        <div className="absolute right-[-38px] top-[18px] z-20 w-[140px] rotate-45 bg-gradient-to-r from-red-500 to-pink-600 py-1 text-center text-xs font-black tracking-wider text-white shadow-xl">
                          NEW
                        </div>
                      )}

                      <WishlistButton
                        course={course}
                        isWishlisted={Number(course.hasWishlist) === 1}
                        onWishlistChange={handleWishlistChange}
                      />
                    </div>

                    <div className="p-6">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <h3 className="line-clamp-1 text-xl font-bold text-gray-900">
                          {course.courseName}
                        </h3>

                        {Number(course.courseType) === 1 ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                            <Crown className="h-4 w-4" />
                            Premium
                          </span>
                        ) : (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700">
                            <BadgeCheck className="h-4 w-4" />
                            Free
                          </span>
                        )}
                      </div>

                      <p className="line-clamp-2 text-sm leading-6 text-gray-600">
                        {course.courseDesc}
                      </p>

                      <div className="mt-5 flex items-center justify-between text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          1.2k Students
                        </span>

                        <CourseChapterLink
                          course={course}
                          isInLibrary={isInLibrary}
                        />
                      </div>

                      <div className="mt-6 flex items-center justify-between gap-4">
                        {Number(course.courseType) === 1 ? (
                          <h4 className="text-3xl font-extrabold text-purple-700">
                            ₹{course.coursePrice}
                          </h4>
                        ) : (
                          <span className="text-base font-bold text-green-700">
                            Free Access
                          </span>
                        )}

                        <CourseActionButton
                          course={course}
                          isInCart={isInCart}
                          isInLibrary={isInLibrary}
                          onCartAdded={handleCartAdded}
                          onLibraryAdded={handleLibraryAdded}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
