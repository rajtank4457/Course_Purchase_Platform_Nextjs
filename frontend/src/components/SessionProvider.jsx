"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { apiRequest, authApi } from "@/lib/apiHelper";

export default function SessionProvider({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/register") return;

    const createSession = async () => {
      const res = await apiRequest(authApi.createSessionToken, {
        method: "POST",
        data: {
          publicToken: "PUBLIC_REGISTER_TOKEN_123",
        },
      });

      const token = res.data?.data?.token;

      if (res.success && token) {
        localStorage.setItem("guest_token", token);
      }
    };

    createSession();
  }, [pathname]);

  return children;
}
