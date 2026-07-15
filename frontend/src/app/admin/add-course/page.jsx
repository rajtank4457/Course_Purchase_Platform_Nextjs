import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import AddCourseClient from "./AddCourseClient";

export default function AddCoursePage() {
  return (
    <AdminAccessWrapper permission="course.create">
      <AddCourseClient />
    </AdminAccessWrapper>
  );
}
