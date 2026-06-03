"use client";

import Link from "next/link";
import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import API_URL from "@/config/api";
import {
  FiUser,
  FiMail,
  FiLock,
  FiPhone,
  FiMapPin,
  FiCalendar,
} from "react-icons/fi";

function Register() {
  const router = useRouter();
  const [tempToken, setTempToken] = useState("");
  const [step, setStep] = useState(1);
  const [isSessionReady, setIsSessionReady] = useState(false);

  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNo: "",
    address: "",
    city: "",
    state: "",
    dob: "",
  });

  useEffect(() => {
    const getRegisterToken = async () => {
      try {
        await axios.post(
          `${API_URL}/auth/session-token`,
          {
            publicToken: "PUBLIC_REGISTER_TOKEN_123",
          },
          {
            withCredentials: true,
          },
        );

        setIsSessionReady(true);
      } catch (err) {
        console.log(err.response?.data || err.message);
        setIsSessionReady(false);
      }
    };

    getRegisterToken();
  }, []);

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-gray-50 px-10 py-2.5 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100";

  const labelClass = "mb-1 block text-xs font-semibold text-gray-600";

  const FieldIcon = ({ children }) => (
    <span className="absolute left-3 top-[35px] text-gray-400">{children}</span>
  );

  const validateStepOne = () => {
    if (
      !values.firstName ||
      !values.lastName ||
      !values.email ||
      !values.password
    ) {
      alert("Please fill all required fields.");
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

    try {
      let deviceId = localStorage.getItem("device_id");

      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("device_id", deviceId);
      }

      const res = await axios.post(
        `${API_URL}/auth/register`,
        {
          ...values,
          deviceId,
        },
        {
          withCredentials: true,
        },
      );

      alert(res.data.message);
      router.push("/login");
    } catch (err) {
      console.log(err.response?.data || err.message);
      alert(err.response?.data?.message || "Registration failed");
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

            <h1 className="text-3xl font-bold leading-tight">
              Join Our Platform
            </h1>

            <p className="mt-3 text-sm leading-6 text-green-50">
              Create your account and access courses, dashboard, progress
              tracking and notifications.
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="rounded-xl bg-white/15 p-3">
              Secure Registration
            </div>
            <div className="rounded-xl bg-white/15 p-3">Device Based Login</div>
            <div className="rounded-xl bg-white/15 p-3">Easy Course Access</div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
            <p className="mt-1 text-sm text-gray-500">
              Step {step} of 2 -{" "}
              {step === 1 ? "Account Details" : "Personal Details"}
            </p>
          </div>

          {/* PROGRESS */}
          <div className="mb-5 flex gap-2">
            <div
              className={`h-1.5 flex-1 rounded-full ${
                step >= 1 ? "bg-green-600" : "bg-gray-200"
              }`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full ${
                step === 2 ? "bg-green-600" : "bg-gray-200"
              }`}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <label className={labelClass}>First Name</label>
                    <FieldIcon>
                      <FiUser />
                    </FieldIcon>
                    <input
                      name="firstName"
                      placeholder="First name"
                      value={values.firstName}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div className="relative">
                    <label className={labelClass}>Last Name</label>
                    <FieldIcon>
                      <FiUser />
                    </FieldIcon>
                    <input
                      name="lastName"
                      placeholder="Last name"
                      value={values.lastName}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </div>
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
                    value={values.email}
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
                    value={values.password}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-bold text-white shadow-md shadow-green-100 transition hover:bg-green-700"
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
                    name="phoneNo"
                    placeholder="Phone number"
                    value={values.phoneNo}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="relative">
                  <label className={labelClass}>Address</label>
                  <span className="absolute left-3 top-[35px] text-gray-400">
                    <FiMapPin />
                  </span>
                  <textarea
                    name="address"
                    placeholder="Full address"
                    value={values.address}
                    onChange={handleChange}
                    required
                    rows={2}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <label className={labelClass}>City</label>
                    <FieldIcon>
                      <FiMapPin />
                    </FieldIcon>
                    <input
                      name="city"
                      placeholder="City"
                      value={values.city}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div className="relative">
                    <label className={labelClass}>State</label>
                    <FieldIcon>
                      <FiMapPin />
                    </FieldIcon>
                    <input
                      name="state"
                      placeholder="State"
                      value={values.state}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className={labelClass}>Date of Birth</label>
                  <FieldIcon>
                    <FiCalendar />
                  </FieldIcon>
                  <input
                    type="date"
                    name="dob"
                    value={values.dob}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
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
                    disabled={!isSessionReady}
                    className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-bold text-white shadow-md shadow-green-100 transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {isSessionReady ? "Register" : "Preparing..."}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-green-600 hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
