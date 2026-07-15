import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import EditCourseChapterClientWrapper from "./EditCourseChapterClientWrapper";

export default async function UpdateCoursePage({ params }) {
  const { courseId } = await params;

  return (
    <AdminAccessWrapper permission="chapter.update">
      <EditCourseChapterClientWrapper courseId={courseId} />
    </AdminAccessWrapper>
  );
}
