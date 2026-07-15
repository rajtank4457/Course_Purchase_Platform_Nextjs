import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import AdminCoursesClient from "./AdminCoursesClient";

export default function AdminCoursesPage() {
  return (
    <AdminAccessWrapper permission="course.view">
      <AdminCoursesClient />
    </AdminAccessWrapper>
  );
}
