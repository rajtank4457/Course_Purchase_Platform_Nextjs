import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import AdminExamsClient from "./AdminExamsClient";

export default function AdminExamsPage() {
  return (
    <AdminAccessWrapper permission="exam.view">
      <AdminExamsClient />
    </AdminAccessWrapper>
  );
}
