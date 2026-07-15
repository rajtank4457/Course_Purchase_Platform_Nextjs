import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import AddStudentClient from "./AddStudentClient";

export default function AddStudentPage() {
  return (
    <AdminAccessWrapper permission="student.create">
      <AddStudentClient />
    </AdminAccessWrapper>
  );
}
