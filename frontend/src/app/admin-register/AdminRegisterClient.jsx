"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, authApi } from "@/lib/apiHelper";
import {
  FiUser,
  FiMail,
  FiLock,
  FiPhone,
  FiUsers,
  FiShield,
} from "react-icons/fi";

export default function AdminRegisterClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    adminName: "",
    email: "",
    password: "",
    gender: "",
    phNo: "",
    role: "admin",
    organizationName: "",
  });

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-gray-50 px-10 py-2.5 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100";

  const labelClass = "mb-1 block text-xs font-semibold text-gray-600";

  const FieldIcon = ({ children }) => (
    <span className="absolute left-3 top-[35px] text-gray-400">{children}</span>
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateStepOne = () => {
    if (!form.adminName || !form.email || !form.password) {
      alert("Please fill all account details.");
      return false;
    }

    if (form.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStepOne()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.gender || !form.phNo || !form.organizationName) {
      alert("Please fill all request details.");
      return;
    }

    try {
      setLoading(true);

      const res = await apiRequest(authApi.adminRegister, {
        method: "POST",
        data: form,
      });

      if (!res.success) {
        alert(res.message || "Registration failed");
        return;
      }

      alert(
        res.message ||
          "Request sent successfully. You can login after Super Admin approval.",
      );

      router.push("/login");
    } catch (err) {
      alert(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-purple-50 via-white to-indigo-100 flex items-center justify-center p-3">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-purple-700 to-indigo-500 p-6 text-white">
          <div>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-xl font-bold">
              <FiShield />
            </div>

            <h1 className="text-3xl font-bold leading-tight">
              Admin / Faculty Access
            </h1>

            <p className="mt-3 text-sm leading-6 text-purple-50">
              Admin registration creates a new organization after Super Admin
              approval. Faculty should be added by the organization admin.
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="rounded-xl bg-white/15 p-3">
              Super Admin Approval
            </div>
            <div className="rounded-xl bg-white/15 p-3">
              Subscription Required
            </div>
            <div className="rounded-xl bg-white/15 p-3">
              Secure Dashboard Access
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Submit Request</h2>
            <p className="mt-1 text-sm text-gray-500">
              Step {step} of 2 -{" "}
              {step === 1 ? "Account Details" : "Access Details"}
            </p>
          </div>

          <div className="mb-5 flex gap-2">
            <div
              className={`h-1.5 flex-1 rounded-full ${
                step >= 1 ? "bg-purple-600" : "bg-gray-200"
              }`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full ${
                step === 2 ? "bg-purple-600" : "bg-gray-200"
              }`}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <div className="relative">
                  <label className={labelClass}>Full Name</label>
                  <FieldIcon>
                    <FiUser />
                  </FieldIcon>
                  <input
                    name="adminName"
                    placeholder="Full name"
                    value={form.adminName}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="relative">
                  <label className={labelClass}>Email Address</label>
                  <FieldIcon>
                    <FiMail />
                  </FieldIcon>
                  <input
                    type="email"
                    name="email"
                    placeholder="example@gmail.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="relative">
                  <label className={labelClass}>Password</label>
                  <FieldIcon>
                    <FiLock />
                  </FieldIcon>
                  <input
                    type="password"
                    name="password"
                    placeholder="Create password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full rounded-lg bg-purple-600 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-100 transition hover:bg-purple-700"
                >
                  Continue
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="relative">
                  <label className={labelClass}>Phone Number</label>
                  <FieldIcon>
                    <FiPhone />
                  </FieldIcon>
                  <input
                    name="phNo"
                    placeholder="Phone number"
                    value={form.phNo}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <label className={labelClass}>Gender</label>
                    <FieldIcon>
                      <FiUsers />
                    </FieldIcon>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="relative">
                    <label className={labelClass}>Requested Role</label>
                    <FieldIcon>
                      <FiShield />
                    </FieldIcon>
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      disabled
                      required
                      className={inputClass}
                    >
                      <option value="admin">Admin / Institute Owner</option>
                    </select>
                  </div>

                  {form.role === "admin" && (
                    <div className="relative">
                      <label className={labelClass}>
                        Organization / Institute Name
                      </label>
                      <FieldIcon>
                        <FiShield />
                      </FieldIcon>
                      <input
                        name="organizationName"
                        placeholder="Example: ABC Academy"
                        value={form.organizationName}
                        onChange={handleChange}
                        required
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full rounded-lg border border-gray-300 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-100"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-purple-600 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-100 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {loading ? "Sending..." : "Submit Request"}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Already approved?{" "}
            <Link
              href="/login"
              className="font-bold text-purple-600 hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
