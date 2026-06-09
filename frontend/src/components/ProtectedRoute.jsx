"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import API_URL from "@/config/api";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const rolesKey = useMemo(() => allowedRoles.join(","), [allowedRoles]);

  const checkAuth = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/home`, {
        withCredentials: true,
      });

      const user = res.data?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const roles = rolesKey ? rolesKey.split(",") : [];

      const isAllowed =
        roles.length === 0 ||
        roles.includes(user.role) ||
        roles.includes(user.type);

      if (!isAllowed) {
        router.replace("/login");
        return;
      }

      setLoading(false);
    } catch (error) {
      router.replace("/login");
    }
  }, [router, rolesKey]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617]">
        <div className="relative flex flex-col items-center gap-6">
          <div className="relative h-28 w-28">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-cyan-400 border-r-purple-500"></div>

            <div className="absolute inset-3 animate-[spin_1.8s_linear_infinite_reverse] rounded-full border-4 border-transparent border-b-blue-500 border-l-pink-500"></div>

            <div className="absolute inset-8 rounded-full bg-white shadow-[0_0_35px_rgba(59,130,246,0.8)]"></div>

            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-black text-blue-600">⚡</span>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-lg font-bold text-white">Checking Access</h2>
            <p className="mt-1 text-sm text-gray-400">
              Please wait a moment...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
}