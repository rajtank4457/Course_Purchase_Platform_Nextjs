"use client";

import { useEffect, useState } from "react";
import { apiRequest, adminApprovalApi } from "@/lib/apiHelper";

export default function ApprovalRequestsClient() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectReason, setRejectReason] = useState({});
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const getRowsFromResponse = (res) => {
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.data?.requests)) return res.data.requests;
    if (Array.isArray(res?.requests)) return res.requests;
    return [];
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const res = await apiRequest(adminApprovalApi.pending, {
        method: "GET",
      });

      const rows = getRowsFromResponse(res);
      setRequests(rows);
    } catch (error) {
      console.log("APPROVAL REQUEST FETCH ERROR:", error);
      setRequests([]);
      setErrorMsg(error?.response?.data?.message || "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const approveRequest = async (adminId) => {
    try {
      setActionLoading(adminId);
      setMessage("");
      setErrorMsg("");

      const res = await apiRequest(adminApprovalApi.approve(adminId), {
        method: "POST",
      });

      if (!res.success) {
        setErrorMsg(res.message || "Approve failed");
        return;
      }

      setMessage(
        "Account approved successfully. User must purchase subscription before login.",
      );

      await fetchRequests();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || "Approve failed");
    } finally {
      setActionLoading(null);
    }
  };

  const rejectRequest = async (adminId) => {
    try {
      setActionLoading(adminId);
      setMessage("");
      setErrorMsg("");

      const res = await apiRequest(adminApprovalApi.reject(adminId), {
        method: "POST",
        data: {
          rejectReason: rejectReason[adminId] || "Rejected by Super Admin",
        },
      });

      if (!res.success) {
        setErrorMsg(res.message || "Reject failed");
        return;
      }

      setMessage("Account rejected successfully");

      setRejectReason((prev) => {
        const copy = { ...prev };
        delete copy[adminId];
        return copy;
      });

      await fetchRequests();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || "Reject failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Approval Requests</h1>
        <p className="text-sm text-slate-500">
          Approve or reject admin and faculty registration requests. After
          approval, subscription is still required before login.
        </p>
      </div>

      {message && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {errorMsg && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="rounded-xl bg-white shadow border overflow-hidden">
        {loading ? (
          <div className="p-6 text-slate-500">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-6 text-slate-500">
            No pending approval requests.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Approval</th>
                  <th className="px-4 py-3 text-left">Subscription</th>
                  <th className="px-4 py-3 text-left">Reject Reason</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((item) => (
                  <tr key={item.adminId} className="border-t">
                    <td className="px-4 py-3 font-medium">{item.adminName}</td>

                    <td className="px-4 py-3">{item.email}</td>

                    <td className="px-4 py-3">{item.phNo || "-"}</td>

                    <td className="px-4 py-3 capitalize">{item.role}</td>

                    <td className="px-4 py-3">
                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                        {item.approvalStatus || "PENDING"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {item.subscriptionStatus || "NONE"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <input
                        value={rejectReason[item.adminId] || ""}
                        onChange={(e) =>
                          setRejectReason((prev) => ({
                            ...prev,
                            [item.adminId]: e.target.value,
                          }))
                        }
                        placeholder="Optional reason"
                        className="w-44 rounded-lg border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-red-400"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => approveRequest(item.adminId)}
                          disabled={actionLoading === item.adminId}
                          className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                        >
                          {actionLoading === item.adminId
                            ? "Please wait..."
                            : "Approve"}
                        </button>

                        <button
                          onClick={() => rejectRequest(item.adminId)}
                          disabled={actionLoading === item.adminId}
                          className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {actionLoading === item.adminId
                            ? "Please wait..."
                            : "Reject"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
