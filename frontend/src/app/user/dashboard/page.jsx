import { cookies } from "next/headers";
import API_URL from "@/config/api";
import CourseActionButton from "./CourseActionButton";
import { Crown, BadgeCheck, Users, PlayCircle } from "lucide-react";

async function getCourses() {
  const cookieStore = await cookies();

  const res = await fetch(`${API_URL}/courses`, {
    headers: {
      Cookie: cookieStore.toString(),
    },
    cache: "no-store",
  });

  if (!res.ok) return [];

  const data = await res.json();
  return data.data || [];
}

async function getCart() {
  const cookieStore = await cookies();

  const res = await fetch(`${API_URL}/cart`, {
    headers: {
      Cookie: cookieStore.toString(),
    },
    cache: "no-store",
  });

  if (!res.ok) return [];

  const data = await res.json();
  return data.data || [];
}

const isNewCourse = (createdAt) => {
  if (!createdAt) return false;

  const courseDate = new Date(createdAt);
  const now = new Date();
  const diffHours = (now - courseDate) / (1000 * 60 * 60);

  return diffHours <= 24;
};

export default async function UserDashboard() {
  const courses = await getCourses();
  const cartItems = await getCart();

  return (
    <div className="min-h-screen bg-gray-50">
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

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const isInCart = cartItems.some(
                (item) => Number(item.courseId) === Number(course.courseId)
              );

              const isInLibrary = Number(course.hasCourse) === 1;

              return (
                <div
                  key={course.courseId}
                  className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
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
                      <div className="absolute right-4 top-4 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                        🔥 New
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h3 className="line-clamp-1 text-xl font-bold text-gray-900">
                        {course.courseName}
                      </h3>

                      {Number(course.courseType) === 1 ? (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                          <Crown className="h-4 w-4" />
                          Premium
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700">
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

                      <span className="flex items-center gap-1">
                        <PlayCircle className="h-4 w-4" />
                        {course.chapters?.length || 0} Chapters
                      </span>
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
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}