"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest, authApi } from "@/lib/apiHelper";
import { FiMail, FiLock, FiLogIn } from "react-icons/fi";
import SubscriptionModal from "@/components/SubscriptionModal";

function Login() {
  const [values, setValues] = useState({
    email: "",
    password: "",
  });

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionEmail, setSubscriptionEmail] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("subscription") === "required") {
      const email = localStorage.getItem("pending_subscription_email") || "";
      setSubscriptionEmail(email);
      setShowSubscriptionModal(true);
    }
  }, [searchParams]);

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-gray-50 px-10 py-2.5 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100";

  const labelClass = "mb-1 block text-xs font-semibold text-gray-600";

  const FieldIcon = ({ children }) => (
    <span className="absolute left-3 top-[35px] text-gray-400">{children}</span>
  );

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const getLoginData = (res) => {
    return res?.data?.data || res?.data || {};
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErr("");
    setLoading(true);

    try {
      let deviceId = localStorage.getItem("device_id");

      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("device_id", deviceId);
      }

      const res = await apiRequest(authApi.loginUser, {
        method: "POST",
        data: {
          email: values.email,
          password: values.password,
          deviceId,
        },
      });

      if (!res.success) {
        setErr(res.message || "Login failed");
        return;
      }

      const data = getLoginData(res);
      const token = data.token;

      if (token) {
        localStorage.setItem("auth_token", token);
      }

      localStorage.setItem("role", data.role);
      localStorage.setItem("type", data.type);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem(
        "permissions",
        JSON.stringify(data.permissions || data.user?.permissions || []),
      );

      if (data.user?.adminId) {
        localStorage.setItem("userId", data.user.adminId);
      } else {
        localStorage.setItem("userId", data.user?.userId);
      }

      setValues({
        email: "",
        password: "",
      });

      if (data.type === "admin") {
        if (data.needsSubscription) {
          setSubscriptionEmail(values.email);
          localStorage.setItem("pending_subscription_email", values.email);
          setShowSubscriptionModal(true);
        } else {
          router.replace("/admin/dashboard");
        }
      } else {
        router.replace("/");
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Login failed";

      if (message.includes("Subscription required")) {
        setSubscriptionEmail(values.email);
        localStorage.setItem("pending_subscription_email", values.email);
        setShowSubscriptionModal(true);
        return;
      }

      setErr(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-green-100 flex items-center justify-center p-3">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr]">
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

          {err && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          )}

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
              disabled={loading}
              className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-bold text-white shadow-md shadow-green-100 transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Don&apos;t have a user account?{" "}
            <Link
              href="/register"
              className="font-bold text-green-600 hover:underline"
            >
              Register
            </Link>
          </p>

          <p className="mt-2 text-center text-sm text-gray-600">
            Want admin/faculty access?{" "}
            <Link
              href="/admin-register"
              className="font-bold text-green-600 hover:underline"
            >
              Send request
            </Link>
          </p>
        </div>
      </div>
      <SubscriptionModal
        open={showSubscriptionModal}
        email={subscriptionEmail}
        onClose={() => {
          setShowSubscriptionModal(false);
          setValues({
            email: "",
            password: "",
          });
          router.replace("/login");
        }}
        onSuccess={(data) => {
          const oldUser =
            JSON.parse(localStorage.getItem("currentUser")) ||
            JSON.parse(localStorage.getItem("user")) ||
            {};

          const permissions = data?.permissions || [];

          const updatedUser = {
            ...oldUser,
            subscriptionStatus: "ACTIVE",
            needsSubscription: false,
            permissions,
          };

          localStorage.setItem("currentUser", JSON.stringify(updatedUser));
          localStorage.setItem("user", JSON.stringify(updatedUser));
          localStorage.setItem("permissions", JSON.stringify(permissions));
          localStorage.removeItem("pending_subscription_email");

          setShowSubscriptionModal(false);

          window.location.href = "/admin/dashboard";
        }}
      />
    </div>
  );
}

export default Login;
