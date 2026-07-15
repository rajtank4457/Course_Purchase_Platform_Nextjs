"use client";

import { useEffect } from "react";
import { apiRequest, attendanceApi } from "@/lib/apiHelper";

export default function AttendanceProvider({ children }) {
  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    if (!token) return;

    const markLogin = async () => {
      try {
        await apiRequest(attendanceApi.markLogin, {
          method: "POST",
        });
      } catch (err) {
        console.log("Attendance login failed:", err);
      }
    };

    const markLogout = async () => {
      try {
        await apiRequest(attendanceApi.markLogout, {
          method: "POST",
        });
      } catch (err) {
        console.log("Attendance logout failed:", err);
      }
    };

    markLogin();

    window.addEventListener("beforeunload", markLogout);

    return () => {
      markLogout();
      window.removeEventListener("beforeunload", markLogout);
    };
  }, []);

  return children;
}
