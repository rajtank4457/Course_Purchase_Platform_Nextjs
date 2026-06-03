"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import API_URL from "@/config/api";
import { CheckCircle, XCircle, Clock } from "lucide-react";

const Page = () => {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/orders`, {
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
        text: "Success",
        className: "text-green-700",
        icon: <CheckCircle className="mx-auto h-5 w-5 text-green-700" />,
      };
    }

    if (status === "failed") {
      return {
        text: "Failed",
        className: "text-red-600",
        icon: <XCircle className="mx-auto h-5 w-5 text-red-600" />,
      };
    }

    return {
      text: "Pending",
      className: "text-orange-600",
      icon: <Clock className="mx-auto h-5 w-5 text-orange-600" />,
    };
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-lg font-bold">
        Loading Orders...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-8 sm:px-6">
      <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
        My Orders List
      </h2>

      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] table-fixed text-sm">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="px-3 py-4 text-center">Order ID</th>
                <th className="px-3 py-4 text-center">Sub Total</th>
                <th className="px-3 py-4 text-center">Discount</th>
                <th className="px-3 py-4 text-center">GST</th>
                <th className="px-3 py-4 text-center">Fee</th>
                <th className="px-3 py-4 text-center">Total</th>
                <th className="px-3 py-4 text-center">Status</th>
              </tr>
            </thead>

            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
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
                      className="border-b border-gray-200 odd:bg-gray-50"
                    >
                      <td className="px-3 py-4 text-center">
                        <button
                          onClick={() => router.push(`/user/orders/${order.orderId}`)}
                          className="font-bold text-blue-600 underline hover:text-blue-800"
                        >
                          #{order.orderId}
                        </button>
                      </td>

                      <td className="px-3 py-4 text-center">
                        ₹{Number(order.subTotal)}
                      </td>

                      <td className="px-3 py-4 text-center">
                        <span className="text-red-600">
                          ₹{Number(order.discountAmount)}
                        </span>
                        {order.couponCode && (
                          <div className="text-xs text-purple-700">
                            {order.couponCode}
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-4 text-center">
                        ₹{Number(order.gst)}
                      </td>

                      <td className="px-3 py-4 text-center">
                        ₹{Number(order.platformFee)}
                      </td>

                      <td className="px-3 py-4 text-center font-bold text-green-700">
                        ₹{Number(order.totalPrice)}
                      </td>

                      <td className="px-3 py-4 text-center">
                        <div className="block sm:hidden">{status.icon}</div>

                        <span
                          className={`hidden font-bold sm:block ${status.className}`}
                        >
                          {status.text}
                        </span>
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
};

export default Page;