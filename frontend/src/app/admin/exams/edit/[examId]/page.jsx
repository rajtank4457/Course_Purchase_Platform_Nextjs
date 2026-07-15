import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import EditExamClient from "./EditExamClient";

export default function EditExamPage() {
  return (
    <AdminAccessWrapper permission="exam.update">
      <EditExamClient />
    </AdminAccessWrapper>
  );
}
