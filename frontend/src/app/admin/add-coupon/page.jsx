import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import AddCouponClient from "./AddCouponClient";

export default function AddCouponPage() {
  return (
    <AdminAccessWrapper permission="coupon.create">
      <AddCouponClient />
    </AdminAccessWrapper>
  );
}
