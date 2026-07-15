import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import StudentsClient from "./StudentsClient";

export default function StudentsPage() {
  return (
    <AdminAccessWrapper permission="student.view">
      <StudentsClient />
    </AdminAccessWrapper>
  );
}
