import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import CouponsClient from "./CouponsClient";

export default function CouponsPage() {
  return (
    <AdminAccessWrapper permission="coupon.view">
      <CouponsClient />
    </AdminAccessWrapper>
  );
}
