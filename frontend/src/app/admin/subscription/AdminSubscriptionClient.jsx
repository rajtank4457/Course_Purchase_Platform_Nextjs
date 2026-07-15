"use client";

import { useEffect, useState } from "react";
import { apiRequest, subscriptionApi } from "@/lib/apiHelper";
import { useRouter } from "next/navigation";
import { FiCheck, FiCreditCard, FiShield } from "react-icons/fi";

export default function AdminSubscriptionClient() {
  const router = useRouter();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [error, setError] = useState("");

  const fetchPlans = async () => {
    try {
      setLoading(true);

      const res = await apiRequest(subscriptionApi.getPlans, {
        method: "GET",
      });

      const rows = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
          ? res.data.data
          : [];

      setPlans(rows);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const continueToCheckout = (plan) => {
    localStorage.setItem("selected_admin_plan", JSON.stringify(plan));
    router.push("/admin/subscription/checkout");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-100 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600 text-white">
            <FiShield size={26} />
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            Choose Your Subscription
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Your account is approved. Subscription is required to activate admin
            or faculty access.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-4 text-center shadow-sm border">
            <p className="text-xs font-semibold text-purple-600">STEP 1</p>
            <p className="mt-1 font-bold text-slate-800">Approved</p>
          </div>

          <div className="rounded-xl bg-white p-4 text-center shadow-sm border">
            <p className="text-xs font-semibold text-purple-600">STEP 2</p>
            <p className="mt-1 font-bold text-slate-800">Select Plan</p>
          </div>

          <div className="rounded-xl bg-white p-4 text-center shadow-sm border">
            <p className="text-xs font-semibold text-purple-600">STEP 3</p>
            <p className="mt-1 font-bold text-slate-800">Activate Access</p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow">
            Loading plans...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow">
            No subscription plans found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const benefits =
                typeof plan.features === "string"
                  ? plan.features.split(",")
                  : Array.isArray(plan.features)
                    ? plan.features
                    : [];

              const isPopular =
                plan.planName?.toLowerCase() === "plus" ||
                plan.planName?.toLowerCase() === "premium";

              return (
                <div
                  key={plan.planId}
                  className={`relative rounded-2xl bg-white p-6 shadow-lg border ${
                    isPopular ? "border-purple-500" : "border-slate-200"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute right-4 top-4 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                      Popular
                    </div>
                  )}

                  <h2 className="text-xl font-bold text-slate-900">
                    {plan.planName}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {plan.description || "Best plan for platform access"}
                  </p>

                  <div className="mt-5">
                    <span className="text-4xl font-bold text-slate-900">
                      ₹{plan.price}
                    </span>
                    <span className="text-sm text-slate-500">
                      {" "}
                      / {plan.durationDays || 30} days
                    </span>
                  </div>

                  <div className="mt-6 space-y-3">
                    {benefits.length > 0 ? (
                      benefits.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-sm text-slate-600"
                        >
                          <FiCheck className="mt-0.5 shrink-0 text-green-600" />
                          <span>{item.trim()}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex gap-2 text-sm text-slate-600">
                          <FiCheck className="text-green-600" />
                          Dashboard access
                        </div>
                        <div className="flex gap-2 text-sm text-slate-600">
                          <FiCheck className="text-green-600" />
                          Role based permissions
                        </div>
                        <div className="flex gap-2 text-sm text-slate-600">
                          <FiCheck className="text-green-600" />
                          Secure admin panel
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => continueToCheckout(plan)}
                    className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-bold text-white transition hover:bg-purple-700"
                  >
                    <FiCreditCard />
                    Choose Plan
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
