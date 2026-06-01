"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import API_URL from "@/config/api";
import Link from "next/link";
import {
  GraduationCap,
  ShoppingCart,
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
  const [checkingAuth, setCheckingAuth] = useState(true);

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_URL}/courses`, {
        withCredentials: true,
      });

      setCourses(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuthAndFetchCourses = async () => {
      try {
        await axios.get(`${API_URL}/auth/home`, {
          withCredentials: true,
        });

        setCheckingAuth(false);
        fetchCourses();
      } catch (err) {
        router.replace("/login");
      }
    };

    checkAuthAndFetchCourses();
  }, [router]);

  // NEW COURSE
  const isNewCourse = (createdAt) => {
    const courseDate = new Date(createdAt);
    const now = new Date();

    const diffHours = (now - courseDate) / (1000 * 60 * 60);

    return diffHours <= 24;
  };

  // ADD TO CART
  const addToCart = (course) => {
    console.log("Added to cart:", course);
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <h2 className="text-xl font-bold text-gray-700">
          Checking authentication...
        </h2>
      </div>
    );
  }

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
          </div>

          {loading ? (
            <div className="py-20 text-center text-lg font-semibold">
              Loading Courses...
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, index) => (
                <div
                  key={course.CId}
                  className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
                >
                  {/* IMAGE */}
                  <div className="relative overflow-hidden">
                    <img
                      src={course.CImage || "/image/default-course.jpg"}
                      alt={course.CName}
                      className="h-56 w-full object-cover transition duration-500 group-hover:scale-110"
                    />

                    {/* PREMIUM/FREE */}
                    <div className="absolute left-4 top-4">
                      <span
                        className={`rounded-full px-4 py-1 text-xs font-bold text-white ${
                          Number(course.CType) === 1
                            ? "bg-orange-500"
                            : "bg-green-600"
                        }`}
                      >
                        {Number(course.CType) === 1 ? "Premium" : "Free"}
                      </span>
                    </div>

                    {/* NEW */}
                    {isNewCourse(course.CreatedAt) && (
                      <div className="absolute right-4 top-4">
                        <span className="rounded-full bg-red-500 px-4 py-1 text-xs font-bold text-white">
                          NEW
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="p-6">
                    <h3 className="line-clamp-2 text-2xl font-bold text-gray-900">
                      {course.CName}
                    </h3>

                    <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                      {course.CDesc}
                    </p>

                    <div className="mt-5 flex items-center gap-5 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        1.2k Students
                      </div>

                      <div className="flex items-center gap-1">
                        <PlayCircle className="h-4 w-4" />
                        {course.chapters?.length || 0} Chapters
                      </div>
                    </div>

                    {/* PRICE */}
                    <div className="mt-6 flex items-center justify-between">
                      {Number(course.CType) === 1 ? (
                        <div>
                          <h4 className="text-3xl font-extrabold text-purple-700">
                            ₹{course.CPrice}
                          </h4>

                          <p className="text-sm text-gray-400 line-through">
                            ₹{Math.floor(course.CPrice * 1.5)}
                          </p>
                        </div>
                      ) : (
                        <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700">
                          Free Access
                        </span>
                      )}

                      <div className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                        Bestseller
                      </div>
                    </div>

                    {/* BUTTONS */}
                    <div className="mt-6">
                      {Number(course.HasCourse) === 1 ? (
                        <button
                          onClick={() => router.push(`/course/${course.CId}`)}
                          className="w-full rounded-2xl bg-purple-700 px-5 py-4 font-bold text-white transition hover:bg-purple-800"
                        >
                          Go To Course
                        </button>
                      ) : Number(course.CType) === 0 ? (
                        <button className="w-full rounded-2xl bg-green-600 px-5 py-4 font-bold text-white transition hover:bg-green-700">
                          Add To Library
                        </button>
                      ) : (
                        <button
                          onClick={() => addToCart(course)}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-700 px-5 py-4 font-bold text-white transition hover:bg-purple-800"
                        >
                          <ShoppingCart className="h-5 w-5" />
                          Add To Cart
                        </button>
                      )}
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
