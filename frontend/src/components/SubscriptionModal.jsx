"use client";

import { useEffect, useState } from "react";
import { apiRequest, subscriptionApi } from "@/lib/apiHelper";
import { FiCheck, FiCreditCard, FiX, FiShield } from "react-icons/fi";

export default function SubscriptionModal({ open, email, onClose, onSuccess }) {
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [payingPlanId, setPayingPlanId] = useState(null);
  const [error, setError] = useState("");

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      setError("");

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
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    if (open) fetchPlans();
  }, [open]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBuyNow = async (plan) => {
    try {
      setPayingPlanId(plan.planId);
      setError("");

      const loaded = await loadRazorpayScript();

      if (!loaded) {
        setError("Razorpay SDK failed to load");
        return;
      }

      const orderRes = await apiRequest(subscriptionApi.createOrder, {
        method: "POST",
        data: {
          planId: plan.planId,
        },
      });

      if (!orderRes.success) {
        setError(orderRes.message || "Failed to create payment order");
        return;
      }

      const orderData = orderRes.data?.data || orderRes.data;

      if (!orderData?.orderId || !orderData?.subscriptionId) {
        setError("Invalid subscription order response");
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Course Management Platform",
        description: `${plan.planName} Subscription`,
        order_id: orderData.orderId,

        prefill: {
          email: email || "",
        },

        theme: {
          color: "#16a34a",
        },

        handler: async function (response) {
          try {
            const verifyRes = await apiRequest(subscriptionApi.verifyPayment, {
              method: "POST",
              data: {
                subscriptionId: orderData.subscriptionId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
            });

            if (!verifyRes.success) {
              setError(verifyRes.message || "Payment verification failed");
              return;
            }

            const verifyData = verifyRes.data?.data || verifyRes.data || {};

            localStorage.removeItem("pending_subscription_email");

            onSuccess?.({
              subscriptionStatus: verifyData.subscriptionStatus || "ACTIVE",
              needsSubscription: false,
              permissions: verifyData.permissions || [],
            });
          } catch (err) {
            setError(
              err?.response?.data?.message ||
                err?.message ||
                "Payment verification failed",
            );
          }
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function () {
        setError("Payment failed. Please try again.");
      });

      razorpay.open();
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Payment failed",
      );
    } finally {
      setPayingPlanId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3 py-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="shrink-0 border-b bg-gradient-to-r from-green-600 to-emerald-500 px-5 py-4 text-black">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                <FiShield size={24} />
              </div>

              <div>
                <h2 className="text-xl font-black">Activate Your Access</h2>
                <p className="mt-1 text-sm text-black">
                  Choose a plan to unlock admin/faculty dashboard.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Body Scroll Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-5">
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loadingPlans ? (
            <div className="rounded-xl bg-white p-8 text-center text-slate-500">
              Loading plans...
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center text-slate-500">
              No subscription plans found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {plans.map((plan) => {
                const name = plan.planName?.toLowerCase();

                const getPlanDescription = (name) => {
                  if (name === "basic")
                    return "For small admin/faculty access.";
                  if (name === "plus") return "For growing institutes.";
                  if (name === "premium")
                    return "Full access with advanced control.";
                  return "Admin / Faculty access plan.";
                };

                const getPlanFeatures = (plan) => {
                  const name = plan.planName?.toLowerCase();

                  if (name === "basic") {
                    return [
                      `Up to ${plan.maxCourses} courses`,
                      `Up to ${plan.maxChapters} chapters`,
                      `Up to ${plan.maxStudents} students`,
                      `Up to ${plan.maxExams} exams`,
                      "Basic dashboard access",
                      "View students and orders",
                    ];
                  }

                  if (name === "plus") {
                    return [
                      `Up to ${plan.maxCourses} courses`,
                      `Up to ${plan.maxChapters} chapters`,
                      `Up to ${plan.maxStudents} students`,
                      `Up to ${plan.maxFaculty} faculty members`,
                      "Analytics reports",
                      "Priority support",
                    ];
                  }

                  if (name === "premium") {
                    return [
                      `Up to ${plan.maxCourses} courses`,
                      `Up to ${plan.maxChapters} chapters`,
                      `Up to ${plan.maxStudents} students`,
                      "Manage certificates",
                      "Manage roles & permissions",
                      "Premium support",
                    ];
                  }

                  return [];
                };

                const features = getPlanFeatures(plan);
                const isPremium = name === "premium";
                const isPlus = name === "plus";

                return (
                  <div
                    key={plan.planId}
                    className={`relative flex min-h-[430px] flex-col rounded-2xl border bg-white p-5 shadow-md transition hover:-translate-y-1 hover:shadow-xl ${
                      isPremium
                        ? "border-green-600 ring-2 ring-green-100"
                        : isPlus
                          ? "border-emerald-400"
                          : "border-slate-200"
                    }`}
                  >
                    {isPremium && (
                      <div className="absolute right-4 top-4 rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white">
                        Best Value
                      </div>
                    )}

                    {isPlus && (
                      <div className="absolute right-4 top-4 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                        Popular
                      </div>
                    )}

                    <h3 className="text-xl font-black capitalize text-slate-900">
                      {plan.planName}
                    </h3>

                    <p className="mt-2 min-h-[38px] text-sm text-slate-500">
                      {getPlanDescription(name)}
                    </p>

                    <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                      <span className="text-3xl font-black text-slate-900">
                        ₹{Number(plan.price).toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-slate-500">
                        {" "}
                        / {plan.durationDays || 30} days
                      </span>
                    </div>

                    <div className="mt-4 flex-1 space-y-2">
                      {features.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-sm text-slate-600"
                        >
                          <FiCheck className="mt-0.5 shrink-0 text-green-600" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleBuyNow(plan)}
                      disabled={payingPlanId === plan.planId}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      <FiCreditCard />
                      {payingPlanId === plan.planId
                        ? "Processing..."
                        : "Buy Now"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t bg-white px-5 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Cancel and Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
