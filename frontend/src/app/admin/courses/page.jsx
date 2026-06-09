import { cookies } from "next/headers";
import API_URL from "@/config/api";
import AdminCourseActionButton from "./AdminCourseActionButton";
import AddButtonModal from "./AddButtonModal";
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

const isNewCourse = (createdAt) => {
  if (!createdAt) return false;

  const courseDate = new Date(createdAt);
  const now = new Date();
  const diffHours = (now - courseDate) / (1000 * 60 * 60);

  return diffHours <= 24;
};

export default async function AdminCoursesPage() {
  const courses = await getCourses();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <span className="mb-2 inline-block rounded-full bg-purple-100 px-4 py-1 text-sm font-bold text-purple-700">
                Admin Course Management
              </span>

              <h2 className="text-4xl font-black text-gray-900">
                All Courses
              </h2>

              <p className="mt-2 max-w-2xl text-gray-600">
                Edit, delete and manage all courses from here.
              </p>
            </div>

            {/* Right Side Buttons */}
            <div className="flex items-center gap-3">
              <AddButtonModal />
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-xl">
              <h3 className="text-2xl font-black text-gray-900">
                No Courses Found
              </h3>

              <p className="mt-2 text-gray-500">
                Add your first course to start managing courses.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
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
                  </div>

                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h3 className="line-clamp-1 text-xl font-black text-gray-900">
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
                        Course ID: {course.courseId}
                      </span>

                      <a
                        href={`/admin/chapters/${course.courseSlug}`}
                        className="flex items-center gap-1 hover:text-purple-700 hover:underline"
                      >
                        <PlayCircle className="h-4 w-4" />
                        {course.chapterCount || 0} Chapters
                      </a>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-4">
                      {Number(course.courseType) === 1 ? (
                        <h4 className="text-2xl font-black text-purple-700">
                          ₹{course.coursePrice}
                        </h4>
                      ) : (
                        <span className="text-base font-bold text-green-700">
                          Free Access
                        </span>
                      )}

                      <AdminCourseActionButton course={course} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}