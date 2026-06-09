"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import API_URL from "@/config/api";
import { ArrowLeft, Download } from "lucide-react";
import { generateInvoicePdf } from "@/utils/generateInvoicePdf";


const Page = () => {
    const router = useRouter();
    const { orderId } = useParams();

    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrderDetails = async () => {
        try {
            const res = await axios.get(`${API_URL}/orders/${orderId}`, {
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
        if (status === "paid") return "text-green-700";
        if (status === "failed") return "text-red-600";
        return "text-orange-600";
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

    const handleDownloadInvoice = () => {
        generateInvoicePdf({
            order,
            items,
            getStatusText,
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 px-6 py-10">
            <button
                onClick={() => router.push("/user/orders")}
                className="mb-8 flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700"
            >
                <ArrowLeft className="h-5 w-5" />
                Back
            </button>

            <h2 className="mb-8 text-center text-4xl font-bold text-gray-900">
                My Order
            </h2>

            <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                                Order ID: #{order.orderId}
                            </h3>

                            <p className={`mt-2 font-bold ${getStatusClass(order.paymentStatus)}`}>
                                {getStatusText(order.paymentStatus)}
                            </p>
                        </div>

                        {order.paymentStatus === "paid" && (
                            <button
                                type="button"
                                onClick={handleDownloadInvoice}
                                title="Download Invoice"
                                className="inline-flex items-center gap-2 cursor-pointer rounded-xl bg-purple-700 px-4 py-2 text-sm font-bold text-white hover:bg-purple-800"
                            >
                                <Download className="h-4 w-4" />
                            </button>
                        )}  
                    </div>

                    <div className="space-y-4">
                        {items.map((course) => (
                            <div
                                key={course.orderItemId}
                                className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
                            >
                                <div className="flex justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">
                                            {course.courseName}
                                        </h3>

                                        <p className="mt-2 text-sm text-gray-600">
                                            {course.courseDesc}
                                        </p>

                                        <p className="mt-1 text-sm text-gray-600">
                                            Quantity: {course.quantity}
                                        </p>
                                    </div>

                                    <h4 className="text-xl font-extrabold text-green-700">
                                        ₹{Number(course.price)}
                                    </h4>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="h-fit rounded-3xl border border-gray-200 bg-white p-6 shadow-xl lg:sticky lg:top-8">
                    <h3 className="mb-5 text-2xl font-bold text-gray-900">
                        Order Summary
                    </h3>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-semibold">₹{order.subTotal}</span>
                        </div>

                        {order.couponCode && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Coupon</span>
                                <span className="font-semibold text-purple-700">
                                    {order.couponCode}
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <span className="text-gray-600">Discount</span>
                            <span className="font-semibold text-red-600">
                                - ₹{order.discountAmount}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-600">Taxable Amount</span>
                            <span className="font-semibold">₹{order.taxableAmount}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-600">GST (18%)</span>
                            <span className="font-semibold">₹{order.gst}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-600">Platform Fee</span>
                            <span className="font-semibold">₹{order.platformFee}</span>
                        </div>
                    </div>

                    <div className="my-5 border-t border-dashed border-gray-300" />

                    <div className="flex justify-between text-xl font-extrabold">
                        <span>Total</span>
                        <span className="text-green-700">₹{order.totalPrice}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Page;