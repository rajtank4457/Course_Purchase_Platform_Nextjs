import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import ApprovalRequestsClient from "./ApprovalRequestsClient";

export default function ApprovalRequestsPage() {
  return (
    <AdminAccessWrapper permission="adminApproval.view">
      <ApprovalRequestsClient />
    </AdminAccessWrapper>
  );
}
