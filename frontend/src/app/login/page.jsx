"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import API_URL from "@/config/api";
import { FiMail, FiLock, FiLogIn } from "react-icons/fi";

function Login() {
  const [values, setValues] = useState({
    email: "",
    password: "",
  });

  const router = useRouter();

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-gray-50 px-10 py-2.5 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100";

  const labelClass = "mb-1 block text-xs font-semibold text-gray-600";

  const FieldIcon = ({ children }) => (
    <span className="absolute left-3 top-[35px] text-gray-400">{children}</span>
  );

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let deviceId = localStorage.getItem("device_id");

      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("device_id", deviceId);
      }

      const res = await axios.post(
        `${API_URL}/auth/login`,
        {
          email: values.email,
          password: values.password,
          deviceId,
        },
        {
          withCredentials: true,
        },
      );

      const data = res.data;

      localStorage.setItem("role", data.role);
      localStorage.setItem("type", data.type);
      // localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user?.adminId) {
        localStorage.setItem("userId", data.user.adminId);
      } else {
        localStorage.setItem("userId", data.user.userId);
      }

      alert(data.message);

      setValues({
        email: "",
        password: "",
      });

      if (data.type === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/");
      }
    } catch (err) {
      console.log(err.response?.data || err.message);
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-green-100 flex items-center justify-center p-3">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr]">
        {/* LEFT SIDE */}
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-green-700 to-emerald-500 p-6 text-white">
          <div>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-xl font-bold">
              R
            </div>

            <h1 className="text-3xl font-bold leading-tight">Welcome Back</h1>

            <p className="mt-3 text-sm leading-6 text-green-50">
              Login to continue your learning journey, access your dashboard,
              track progress and manage your courses.
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="rounded-xl bg-white/15 p-3">Secure Login</div>
            <div className="rounded-xl bg-white/15 p-3">
              Continue Your Courses
            </div>
            <div className="rounded-xl bg-white/15 p-3">
              Track Your Progress
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex flex-col justify-center p-5 sm:p-8">
          <div className="mb-5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <FiLogIn size={22} />
            </div>

            <h2 className="text-2xl font-bold text-gray-900">Login Account</h2>

            <p className="mt-1 text-sm text-gray-500">
              Enter your email and password to continue.
            </p>
          </div>

          <form
            className="space-y-4"
            autoComplete="off"
            onSubmit={handleSubmit}
          >
            <div className="relative">
              <label htmlFor="email" className={labelClass}>
                Email Address
              </label>

              <FieldIcon>
                <FiMail />
              </FieldIcon>

              <input
                type="email"
                id="email"
                name="email"
                autoComplete="off"
                placeholder="example@gmail.com"
                className={inputClass}
                value={values.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className={labelClass}>
                Password
              </label>

              <FieldIcon>
                <FiLock />
              </FieldIcon>

              <input
                type="password"
                id="password"
                name="password"
                autoComplete="new-password"
                placeholder="Enter your password"
                className={inputClass}
                value={values.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-gray-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 accent-green-600"
                />
                Remember me
              </label>

              <Link
                href="/forgot-password"
                className="font-semibold text-green-600 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-bold text-white shadow-md shadow-green-100 transition hover:bg-green-700"
            >
              Login
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-green-600 hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
