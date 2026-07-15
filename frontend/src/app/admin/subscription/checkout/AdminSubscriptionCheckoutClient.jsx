"use client";

import { useEffect, useState } from "react";
import { apiRequest, subscriptionApi } from "@/lib/apiHelper";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiCheckCircle, FiCreditCard } from "react-icons/fi";

export default function AdminSubscriptionCheckoutClient() {
  const router = useRouter();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedPlan = localStorage.getItem("selected_admin_plan");

    if (!savedPlan) {
      router.push("/admin/subscription");
      return;
    }

    setPlan(JSON.parse(savedPlan));
  }, [router]);

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

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError("");

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        setError("Razorpay SDK failed to load");
        return;
      }

      const orderRes = await apiRequest(adminSubscriptionApi.createOrder, {
        method: "POST",
        data: {
          planId: plan.planId,
        },
      });

      if (!orderRes.success) {
        setError(orderRes.message || "Failed to create order");
        return;
      }

      const orderData = orderRes.data?.data || orderRes.data;

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Course Management Platform",
        description: `${plan.planName} Subscription`,
        order_id: orderData.razorpayOrderId || orderData.order_id,

        handler: async function (response) {
          try {
            const verifyRes = await apiRequest(
              adminSubscriptionApi.verifyPayment,
              {
                method: "POST",
                data: {
                  planId: plan.planId,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                },
              },
            );

            if (!verifyRes.success) {
              setError(verifyRes.message || "Payment verification failed");
              return;
            }

            localStorage.removeItem("selected_admin_plan");
            localStorage.removeItem("pending_subscription_email");

            router.push("/admin/dashboard");
          } catch (err) {
            setError(
              err?.response?.data?.message || "Payment verification failed",
            );
          }
        },

        prefill: {
          email: localStorage.getItem("pending_subscription_email") || "",
        },

        theme: {
          color: "#7c3aed",
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function () {
        setError("Payment failed. Please try again.");
      });

      razorpay.open();
    } catch (err) {
      setError(err?.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  if (!plan) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Preparing checkout...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-100 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => router.push("/admin/subscription")}
          className="mb-5 flex items-center gap-2 text-sm font-semibold text-purple-600"
        >
          <FiArrowLeft />
          Back to plans
        </button>

        <div className="overflow-hidden rounded-2xl bg-white shadow-xl border">
          <div className="bg-gradient-to-br from-purple-700 to-indigo-600 p-6 text-white">
            <h1 className="text-2xl font-bold">Subscription Checkout</h1>
            <p className="mt-2 text-sm text-purple-50">
              Complete payment to activate your approved admin/faculty account.
            </p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="rounded-xl border bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {plan.planName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {plan.description || "Admin / Faculty subscription plan"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-bold text-slate-900">
                    ₹{plan.price}
                  </p>
                  <p className="text-xs text-slate-500">
                    {plan.durationDays || 30} days
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-green-600" />
                  Account activation after payment
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-green-600" />
                  Dashboard access enabled
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-green-600" />
                  Role permissions applied
                </div>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-bold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              <FiCreditCard />
              {loading ? "Processing..." : `Pay ₹${plan.price}`}
            </button>

            <p className="mt-4 text-center text-xs text-slate-500">
              After successful payment, your subscription will be activated and
              you will be redirected to dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
