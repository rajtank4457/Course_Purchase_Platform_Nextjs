import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import AdminDashboardClient from "./AdminDashboardClient";

export default function AdminDashboardPage() {
  return (
    <AdminAccessWrapper permissions={["dashboard.view"]} mode="all">
      <AdminDashboardClient />
    </AdminAccessWrapper>
  );
}
