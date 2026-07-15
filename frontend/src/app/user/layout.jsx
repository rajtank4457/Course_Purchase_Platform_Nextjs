"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import useTrackPageActivity from "@/hooks/useTrackPageActivity";
import AttendanceProvider from "@/components/AttendanceProvider";

export default function UserLayout({ children }) {
  useTrackPageActivity();

  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <Header />
      <AttendanceProvider>
        <main>{children}</main>
      </AttendanceProvider>
      <Footer />
    </ProtectedRoute>
  );
}
