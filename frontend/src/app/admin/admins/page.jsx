import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import AdminsClient from "./AdminsClient";

export default function AdminsPage() {
  return (
    <AdminAccessWrapper permission="admin.view">
      <AdminsClient />
    </AdminAccessWrapper>
  );
}
