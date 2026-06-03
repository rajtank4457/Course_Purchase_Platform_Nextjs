"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import axios from "axios";
import API_URL from "@/config/api";

export default function SessionProvider({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/register") return;

    const createSession = async () => {
      try {
        await axios.post(
          `${API_URL}/auth/session-token`,
          { publicToken: "PUBLIC_REGISTER_TOKEN_123" },
          { withCredentials: true }
        );
      } catch (err) {
        console.log(err.response?.data || err.message);
      }
    };

    createSession();
  }, [pathname]);

  return children;
}