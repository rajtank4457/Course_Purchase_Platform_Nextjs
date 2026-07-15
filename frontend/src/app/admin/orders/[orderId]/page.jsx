import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import AdminOrderDetailsClient from "./AdminOrderDetailsClient";

export default function AdminOrderDetailsPage() {
  return (
    <AdminAccessWrapper permission="order.view">
      <AdminOrderDetailsClient />
    </AdminAccessWrapper>
  );
}
