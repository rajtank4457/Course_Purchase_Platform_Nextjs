"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import API_URL from "@/config/api";
import { ArrowLeft } from "lucide-react";

export default function AdminOrderDetailsPage() {
    const router = useRouter();
    const { orderId } = useParams();

    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrderDetails = async () => {
        try {
            const res = await axios.get(`${API_URL}/orders/admin/${orderId}`, {
                withCredentials: true,
            });

            setOrder(res.data.order || null);
            setItems(res.data.items || []);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orderId) fetchOrderDetails();
    }, [orderId]);

    const getStatusText = (status) => {
        if (status === "paid") return "Payment Successful";
        if (status === "failed") return "Payment Failed";
        return "Payment Pending";
    };

    const getStatusClass = (status) => {
        if (status === "paid") return "text-green-700 bg-green-100";
        if (status === "failed") return "text-red-700 bg-red-100";
        return "text-orange-700 bg-orange-100";
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 text-lg font-bold">
                Loading Order Details...
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 text-lg font-bold">
                Order Not Found
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 px-4 py-8">
            <button
                onClick={() => router.push("/admin/orders")}
                className="mb-6 flex items-center gap-2 font-bold text-purple-700 hover:text-purple-900"
            >
                <ArrowLeft className="h-5 w-5" />
                Back To Orders
            </button>

            <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-xl">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-sm font-bold text-purple-700">Order Details</p>
                        <h1 className="mt-1 text-3xl font-black text-gray-900">
                            Order #{order.orderId}
                        </h1>
                    </div>

                    <span
                        className={`w-fit rounded-full px-4 py-2 text-sm font-black ${getStatusClass(
                            order.paymentStatus
                        )}`}
                    >
                        {getStatusText(order.paymentStatus)}
                    </span>
                </div>
            </div>

            <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
                <div className="space-y-5 lg:col-span-2">
                    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-lg">
                        <h2 className="mb-4 text-xl font-black text-gray-900">
                            Student Details
                        </h2>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Info label="User ID" value={order.userId} />
                            <Info
                                label="Student Name"
                                value={`${order.firstName || ""} ${order.lastName || ""}`}
                            />
                            <Info label="Email" value={order.email} />
                            <Info label="Phone" value={order.phoneNo} />
                        </div>
                    </div>

                    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-lg">
                        <h2 className="mb-4 text-xl font-black text-gray-900">
                            Purchased Courses
                        </h2>

                        <div className="space-y-4">
                            {items.map((course) => (
                                <div
                                    key={course.orderItemId}
                                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                                >
                                    <div className="flex justify-between gap-4">
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900">
                                                {course.courseName}
                                            </h3>

                                            <p className="mt-2 text-sm leading-6 text-gray-600">
                                                {course.courseDesc}
                                            </p>

                                            <p className="mt-2 text-sm font-semibold text-gray-500">
                                                Quantity: {course.quantity}
                                            </p>
                                        </div>

                                        <h4 className="shrink-0 text-xl font-black text-green-700">
                                            ₹{Number(course.price)}
                                        </h4>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="h-fit rounded-3xl border border-gray-200 bg-white p-6 shadow-xl lg:sticky lg:top-8">
                    <h3 className="mb-5 text-2xl font-black text-gray-900">
                        Order Summary
                    </h3>

                    <Summary label="Subtotal" value={`₹${order.subTotal}`} />

                    {order.couponCode && (
                        <Summary label="Coupon" value={order.couponCode} highlight />
                    )}

                    <Summary label="Discount" value={`- ₹${order.discountAmount}`} danger />
                    <Summary label="Taxable Amount" value={`₹${order.taxableAmount}`} />
                    <Summary label="GST" value={`₹${order.gst}`} />
                    <Summary label="Platform Fee" value={`₹${order.platformFee}`} />

                    <div className="my-5 border-t border-dashed border-gray-300" />

                    <div className="flex justify-between text-xl font-black">
                        <span>Total</span>
                        <span className="text-green-700">₹{order.totalPrice}</span>
                    </div>

                    <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-xs text-gray-600">
                        <p>
                            <b>Razorpay Order ID:</b>
                        </p>
                        <p className="mt-1 break-all">{order.razorpayOrderId || "-"}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Info({ label, value }) {
    return (
        <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-xs font-bold text-gray-500">{label}</p>
            <p className="mt-1 break-words font-black text-gray-900">
                {value || "N/A"}
            </p>
        </div>
    );
}

function Summary({ label, value, highlight, danger }) {
    return (
        <div className="mb-3 flex justify-between text-sm">
            <span className="text-gray-600">{label}</span>
            <span
                className={`font-bold ${highlight ? "text-purple-700" : danger ? "text-red-600" : "text-gray-900"
                    }`}
            >
                {value}
            </span>
        </div>
    );
}