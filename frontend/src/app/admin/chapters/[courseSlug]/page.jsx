import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import AdminCourseChaptersClient from "./AdminCourseChaptersClient";

export default async function AdminCourseChaptersPage({ params }) {
  const { courseSlug } = await params;

  return (
    <AdminAccessWrapper permission="chapter.view">
      <AdminCourseChaptersClient courseSlug={courseSlug} />
    </AdminAccessWrapper>
  );
}
