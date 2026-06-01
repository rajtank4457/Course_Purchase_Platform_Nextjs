"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function UserLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <Header />
      <main>{children}</main>
      <Footer />
    </ProtectedRoute>
  );
}
