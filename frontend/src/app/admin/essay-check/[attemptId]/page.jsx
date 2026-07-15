import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import AdminEssayCheckClient from "./AdminEssayCheckClient";

export default function AdminEssayCheckPage() {
  return (
    <AdminAccessWrapper permission="exam.check">
      <AdminEssayCheckClient />
    </AdminAccessWrapper>
  );
}
