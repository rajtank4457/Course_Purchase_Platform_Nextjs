import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import AddAdminForm from "./AddAdminForm";

export default function AddAdminPage() {
  return (
    <AdminAccessWrapper permission="admin.create">
      <AddAdminForm />
    </AdminAccessWrapper>
  );
}
