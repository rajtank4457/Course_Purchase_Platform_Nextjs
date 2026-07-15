import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import EssayReviewQueueClient from "./EssayReviewQueueClient";

export default function EssayReviewQueuePage() {
  return (
    <AdminAccessWrapper permission="exam.check">
      <EssayReviewQueueClient />
    </AdminAccessWrapper>
  );
}
