"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import API_URL from "@/config/api";
import { ShoppingCart, Trash2, ShieldCheck } from "lucide-react";

const Page = () => {
    const router = useRouter();

    const [cartItems, setCartItems] = useState([]);
    const [couponCode, setCouponCode] = useState("");
    const [discountAmt, setDiscountAmt] = useState(0);
    const [couponError, setCouponError] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchCart = async () => {
        try {
            const userId = localStorage.getItem("userId");

            const res = await axios.get(`${API_URL}/cart`, {
                params: { userId },
                withCredentials: true,
            });

            setCartItems(res.data.data || []);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    const subtotal = cartItems.reduce(
        (sum, item) => sum + Number(item.coursePrice || 0),
        0
    );

    const taxableAmount = subtotal - discountAmt;
    const gst = Math.round(taxableAmount * 0.18);
    const platformFee = cartItems.length > 0 ? 50 : 0;
    const total = taxableAmount + gst + platformFee;

    const applyCoupon = async () => {
        try {
            const userId = localStorage.getItem("userId");

            const res = await axios.post(
                `${API_URL}/coupons/validate`,
                {
                    couponCode,
                    subTotal: subtotal,
                    userId,
                },
                { withCredentials: true }
            );

            if (res.data.success) {
                setDiscountAmt(res.data.discount);
                setCouponError("");
            } else {
                setDiscountAmt(0);
                setCouponError(res.data.message || "Invalid coupon");
            }
        } catch (err) {
            console.log(err);
            setDiscountAmt(0);
            setCouponError("Failed to apply coupon");
        }
    };

    const removeFromCart = async (cartId) => {
        try {
            await axios.delete(`${API_URL}/cart/${cartId}`, {
                withCredentials: true,
            });

            setCartItems((prev) => {
                const updated = prev.filter(
                    (item) => Number(item.cartId) !== Number(cartId)
                );

                localStorage.setItem("cartItems", JSON.stringify(updated));

                return updated;
            });

            window.dispatchEvent(new Event("cartUpdated"));
        } catch (err) {
            console.log(err);
            alert(err.response?.data?.message || "Failed to remove course from cart");
        }
    };

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }

            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;

            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);

            document.body.appendChild(script);
        });
    };

    const handleBuyAll = async () => {
        try {
            const loaded = await loadRazorpay();

            if (!loaded) {
                alert("Razorpay failed to load");
                return;
            }

            if (cartItems.length === 0) {
                alert("Cart is empty");
                return;
            }

            const userId = localStorage.getItem("userId");

            const orderRes = await axios.post(
                `${API_URL}/payments/create-order`,
                {
                    userId,
                    courseQuantity: cartItems.length,
                    subTotal: subtotal,
                    couponCode: couponCode || "",
                    discountAmount: discountAmt,
                    taxableAmount,
                    gst,
                    platformFee,
                    totalPrice: total,
                },
                { withCredentials: true }
            );

            const {
                order_id,
                orderId,
                amount,
                currency,
                key,
            } = orderRes.data;

            const options = {
                key,
                amount,
                currency,
                name: "SDJ Online Courses",
                description: "Course Purchase",
                order_id,

                handler: async function (response) {
                    try {
                        const verify = await axios.post(
                            `${API_URL}/payments/verify`,
                            {
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                            },
                            { withCredentials: true }
                        );

                        if (verify.data.success) {
                            if (couponCode) {
                                await axios.post(
                                    `${API_URL}/coupons/usage`,
                                    { couponCode },
                                    { withCredentials: true }
                                );
                            }

                            setCartItems([]);
                            localStorage.removeItem("cartItems");
                            window.dispatchEvent(new Event("cartUpdated"));

                            router.push(`/user/orders/${verify.data.orderId || orderId}`);
                        } else {
                            alert("Payment verification failed");
                            router.push("/user/cart");
                        }
                    } catch (err) {
                        console.log(err);
                        alert("Payment verification failed");
                        router.push("/user/cart");
                    }
                },

                modal: {
                    escape: false,
                    ondismiss: function () {
                        console.log("Payment popup closed");
                    },
                },

                theme: {
                    color: "#16a34a",
                },
            };

            const razor = new window.Razorpay(options);

            razor.on("payment.failed", async function (response) {
                razor.close();

                try {
                    await axios.post(
                        `${API_URL}/auth/payment-failed`,
                        {
                            razorpay_order_id: order_id,
                            error: response.error.description,
                        },
                        { withCredentials: true }
                    );

                    alert("Payment Failed");
                    router.push("/user/cart");
                } catch (err) {
                    console.log(err);
                }
            });

            razor.open();
        } catch (err) {
            console.log("ORDER ERROR:", err.response?.data || err);
            alert(err.response?.data?.error || err.response?.data?.message || "Something went wrong while processing payment");
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 text-lg font-bold">
                Loading Cart...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 px-6 py-10">
            {cartItems.length === 0 ? (
                <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
                    <ShoppingCart className="mb-4 h-16 w-16 text-purple-700" />

                    <h2 className="text-3xl font-bold text-gray-900">
                        Your Cart is Empty
                    </h2>

                    <p className="mt-3 text-gray-600">
                        Looks like you haven’t added any courses yet.
                    </p>

                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={() => router.push("/user/dashboard")}
                            className="rounded-xl bg-purple-700 px-6 py-3 font-bold text-white hover:bg-purple-800"
                        >
                            Go to Dashboard
                        </button>

                        <button
                            onClick={() => router.push("/user/orders")}
                            className="rounded-xl bg-gray-900 px-6 py-3 font-bold text-white hover:bg-black"
                        >
                            My Orders
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <h2 className="mb-6 text-3xl font-bold text-gray-900">
                            Your Courses
                        </h2>

                        <div className="space-y-4">
                            {cartItems.map((course) => (
                                <div
                                    key={course.cartId}
                                    className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
                                >
                                    <div className="flex justify-between gap-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">
                                                {course.courseName}
                                            </h3>

                                            <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                                                {course.courseDesc}
                                            </p>
                                        </div>

                                        <h4 className="text-xl font-extrabold text-green-700">
                                            ₹{Number(course.coursePrice)}
                                        </h4>
                                    </div>

                                    <button
                                        onClick={() => removeFromCart(course.cartId)}
                                        className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-fit rounded-3xl border border-gray-200 bg-white p-6 shadow-xl lg:sticky lg:top-8">
                        <h3 className="mb-5 text-2xl font-bold text-gray-900">
                            Order Summary
                        </h3>

                        <div className="mb-5 flex gap-2">
                            <input
                                type="text"
                                placeholder="Coupon Code"
                                value={couponCode}
                                onChange={(e) => {
                                    setCouponCode(e.target.value);
                                    setCouponError("");
                                }}
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-purple-600"
                            />

                            <button
                                onClick={applyCoupon}
                                className="rounded-xl border border-purple-700 px-5 py-3 text-sm font-bold text-purple-700 hover:bg-purple-50"
                            >
                                Apply
                            </button>
                        </div>

                        {couponError && (
                            <p className="mb-4 text-sm font-semibold text-red-600">
                                {couponError}
                            </p>
                        )}

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-semibold">₹{subtotal}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Discount</span>
                                <span className="font-semibold text-red-600">
                                    - ₹{discountAmt}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Taxable Amount</span>
                                <span className="font-semibold">₹{taxableAmount}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">GST (18%)</span>
                                <span className="font-semibold">₹{gst}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Platform Fee</span>
                                <span className="font-semibold">₹{platformFee}</span>
                            </div>
                        </div>

                        <div className="my-5 border-t border-dashed border-gray-300" />

                        <div className="flex justify-between text-xl font-extrabold">
                            <span>Total</span>
                            <span className="text-green-700">₹{total}</span>
                        </div>

                        <p className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                            <ShieldCheck className="h-4 w-4" />
                            Secure payment powered by Razorpay
                        </p>

                        <button
                            onClick={handleBuyAll}
                            className="mt-5 w-full rounded-xl bg-green-600 px-6 py-4 text-base font-bold text-white transition hover:bg-green-700"
                        >
                            Pay ₹{total}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Page;