"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <Header />
      {children}
      <Footer />
    </ProtectedRoute>
  );
}