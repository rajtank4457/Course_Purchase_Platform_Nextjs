"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import API_URL from "@/config/api";
import Link from "next/link";
import {
  ArrowRight,
  ShoppingCart,
  Crown, BadgeCheck,
  Star,
  Users,
  PlayCircle,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Home() {
  const router = useRouter();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_URL}/courses`, {
        withCredentials: true,
      });

      setCourses(res.data.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const latestCourses = [...courses]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);


  // NEW COURSE
  const isNewCourse = (createdAt) => {
    const courseDate = new Date(createdAt);
    const now = new Date();

    const diffHours = (now - courseDate) / (1000 * 60 * 60);

    return diffHours <= 24;
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR */}
      <Header />
      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-purple-700 to-indigo-700 py-20 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                Trusted by 10,000+ Students
              </div>

              <h1 className="mb-6 text-5xl font-extrabold leading-tight">
                Upgrade Your Skills With Premium Courses
              </h1>

              <p className="mb-8 text-lg text-purple-100">
                Learn Web Development, Blockchain, DevOps, AI, Programming, and
                much more with industry experts.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="#courses"
                  className="rounded-2xl bg-white px-7 py-4 font-bold text-purple-700 transition hover:bg-gray-100"
                >
                  Explore Courses
                </Link>

                <Link
                  href="/user/dashboard"
                  className="rounded-2xl border border-white px-7 py-4 font-bold text-white transition hover:bg-white hover:text-purple-700"
                >
                  Dashboard
                </Link>
              </div>

              <div className="mt-10 flex gap-10">
                <div>
                  <h3 className="text-3xl font-bold">250+</h3>
                  <p className="text-purple-100">Courses</p>
                </div>

                <div>
                  <h3 className="text-3xl font-bold">10k+</h3>
                  <p className="text-purple-100">Students</p>
                </div>

                <div>
                  <h3 className="text-3xl font-bold">98%</h3>
                  <p className="text-purple-100">Success</p>
                </div>
              </div>
            </div>

            <div>
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"
                alt="Learning"
                className="rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* COURSES */}
      <section id="courses" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold text-gray-900">
                Popular Courses
              </h2>

              <p className="mt-3 text-gray-600">
                Learn from top instructors and improve your skills.
              </p>
            </div>
            <button
              onClick={() => router.push("/user/dashboard")}
              className="group flex items-center gap-2 text-purple-700 font-semibold cursor-pointer"
            >
              Explore More
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center text-lg font-semibold">
              Loading Courses...
            </div>
          ) : (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
              {latestCourses.map((course) => (
                <div
                  key={course.courseId}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
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
                      <div className="absolute right-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                        🔥 New
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <h3 className="line-clamp-1 text-lg font-bold text-gray-900">
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

                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        1.2k Students
                      </span>

                      <span className="flex items-center gap-1">
                        <PlayCircle className="h-4 w-4" />
                        {course.chapters?.length || 0} Chapters
                      </span>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      {Number(course.courseType) === 1 ? (
                        <h4 className="text-2xl font-extrabold text-purple-700">
                          ₹{course.coursePrice}
                        </h4>
                      ) : (
                        <span className="text-sm font-bold text-green-700">
                          Free Access
                        </span>
                      )}

                      <button
                        onClick={() => router.push("/user/dashboard")}
                        className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-purple-800"
                      >
                        View Course
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      {/* FOOTER */}
      <Footer />
    </div>
  );
}
