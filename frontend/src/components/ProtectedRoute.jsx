"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import API_URL from "@/config/api";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const checkAuth = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/home`, {
          withCredentials: true,
        });

        const user = res.data.user;

        if (
          allowedRoles.length > 0 &&
          !allowedRoles.includes(user.role) &&
          !allowedRoles.includes(user.type)
        ) {
          router.replace("/login");
          return;
        }

        if (!ignore) setLoading(false);
      } catch {
        router.replace("/login");
      }
    };

    checkAuth();

    return () => {
      ignore = true;
    };
  }, [router]);

  if (loading) return <h2>Checking authentication...</h2>;

  return children;
}