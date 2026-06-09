"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "@/config/api";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export default function AdminOrdersPage() {
    const router = useRouter();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            const res = await axios.get(`${API_URL}/orders/all`, {
                withCredentials: true,
            });

            setOrders(res.data.data || []);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const getStatus = (status) => {
        if (status === "paid") {
            return {
                text: "Paid",
                className: "text-green-700 bg-green-100",
                icon: <CheckCircle className="h-4 w-4" />,
            };
        }

        if (status === "failed") {
            return {
                text: "Failed",
                className: "text-red-700 bg-red-100",
                icon: <XCircle className="h-4 w-4" />,
            };
        }

        return {
            text: "Created",
            className: "text-orange-700 bg-orange-100",
            icon: <Clock className="h-4 w-4" />,
        };
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 font-bold">
                Loading Orders...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-4">
            <div className="mb-5">
                <h1 className="text-3xl font-black text-gray-900">All Orders</h1>
                <p className="mt-1 text-sm text-gray-500">
                    View all order records from orders table.
                </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1250px] text-sm">
                        <thead className="bg-purple-700 text-white">
                            <tr>
                                <th className="px-4 py-3 text-left">Order ID</th>
                                <th className="px-4 py-3 text-left">User ID</th>
                                <th className="px-4 py-3 text-left">Razorpay Order ID</th>
                                <th className="px-4 py-3 text-center">Qty</th>
                                <th className="px-4 py-3 text-right">Sub Total</th>
                                <th className="px-4 py-3 text-left">Coupon</th>
                                <th className="px-4 py-3 text-right">Discount</th>
                                <th className="px-4 py-3 text-right">Taxable</th>
                                <th className="px-4 py-3 text-right">GST</th>
                                <th className="px-4 py-3 text-right">Fee</th>
                                <th className="px-4 py-3 text-right">Total</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-left">Created At</th>
                            </tr>
                        </thead>

                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="13"
                                        className="px-4 py-10 text-center font-semibold text-gray-500"
                                    >
                                        No orders found
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const status = getStatus(order.paymentStatus);

                                    return (
                                        <tr
                                            key={order.orderId}
                                            className="border-b border-gray-100 odd:bg-gray-50 hover:bg-purple-50"
                                        >
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() =>
                                                        router.push(`/admin/orders/${order.orderId}`)
                                                    }
                                                    className="font-black text-purple-700 underline cursor-pointer"
                                                >
                                                    #{order.orderId}
                                                </button>
                                            </td>

                                            <td className="px-4 py-3 font-semibold">
                                                {order.userId}
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                                                    {order.razorpayOrderId || "-"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 text-center">
                                                {order.courseQuantity}
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                ₹{Number(order.subTotal)}
                                            </td>

                                            <td className="px-4 py-3">
                                                {order.couponCode || "-"}
                                            </td>

                                            <td className="px-4 py-3 text-right text-red-600">
                                                ₹{Number(order.discountAmount)}
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                ₹{Number(order.taxableAmount)}
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                ₹{Number(order.gst)}
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                ₹{Number(order.platformFee)}
                                            </td>

                                            <td className="px-4 py-3 text-right font-black text-green-700">
                                                ₹{Number(order.totalPrice)}
                                            </td>

                                            <td className="px-4 py-3">
                                                <span
                                                    className={`mx-auto flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${status.className}`}
                                                >
                                                    {status.icon}
                                                    {status.text}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 text-gray-600">
                                                {order.createdAt
                                                    ? new Date(order.createdAt).toLocaleString()
                                                    : "-"}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}