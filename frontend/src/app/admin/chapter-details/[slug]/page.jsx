import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import ChapterDetailsClient from "./ChapterDetailsClient";

export default function ChapterDetailsPage() {
  return (
    <AdminAccessWrapper permission="chapter.view">
      <ChapterDetailsClient />
    </AdminAccessWrapper>
  );
}
