import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import AdminSubscriptionCheckoutClient from "./AdminSubscriptionCheckoutClient";

export default function AdminSubscriptionCheckoutPage() {
  return (
    <AdminAccessWrapper permission="subscription.manage">
      <AdminSubscriptionCheckoutClient />
    </AdminAccessWrapper>
  );
}
