import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import AdminOrdersClient from "./AdminOrdersClient";

export default function AdminOrdersPage() {
  return (
    <AdminAccessWrapper permission="order.view">
      <AdminOrdersClient />
    </AdminAccessWrapper>
  );
}
