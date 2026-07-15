import StudentDetailsClient from "./StudentDetailsClient";
import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";

export default function StudentDetailsPage() {
  return (
    <AdminAccessWrapper permission="student.view">
      <StudentDetailsClient />
    </AdminAccessWrapper>
  );
}
