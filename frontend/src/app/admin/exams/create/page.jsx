import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import CreateExamClient from "./CreateExamClient";

export default function CreateExamPage() {
  return (
    <AdminAccessWrapper permission="exam.create">
      <CreateExamClient />
    </AdminAccessWrapper>
  );
}
