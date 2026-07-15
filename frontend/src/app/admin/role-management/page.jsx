import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import RoleManagementClient from "./RoleManagementClient";

export default function RoleManagementPage() {
  return (
    <AdminAccessWrapper permission="role.manage">
      <RoleManagementClient />
    </AdminAccessWrapper>
  );
}
