"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import useTrackPageActivity from "@/hooks/useTrackPageActivity";

export default function UserLayout({ children }) {
  useTrackPageActivity();

  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <Header />
      <main>{children}</main>
      <Footer />
    </ProtectedRoute>
  );
}
