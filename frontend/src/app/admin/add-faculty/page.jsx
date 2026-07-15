import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import AddFacultyClient from "./AddFacultyClient";

export default function AddFacultyPage() {
  return (
    <AdminAccessWrapper permission="faculty.create">
      <AddFacultyClient />
    </AdminAccessWrapper>
  );
}
