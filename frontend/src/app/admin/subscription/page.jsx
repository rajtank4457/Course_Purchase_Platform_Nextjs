import AdminSubscriptionClient from "./AdminSubscriptionClient";
import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";

export default function AdminSubscriptionPage() {
  return (
    <AdminAccessWrapper permission="subscription.manage">
      <AdminSubscriptionClient />
    </AdminAccessWrapper>
  );
}
