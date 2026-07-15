import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import FacultyClient from "./FacultyClient";

export default function FacultyPage() {
  return (
    <AdminAccessWrapper permission="faculty.view" >
      <FacultyClient />
    </AdminAccessWrapper>
  );
}
