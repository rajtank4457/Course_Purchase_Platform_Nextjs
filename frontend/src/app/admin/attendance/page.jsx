import AdminAccessWrapper from "@/components/admin/AdminAccessWrapper";
import AdminAttendanceClient from "./AdminAttendanceClient";

export default function AdminAttendancePage() {
  return (
    <AdminAccessWrapper permission="attendance.view">
      <AdminAttendanceClient />
    </AdminAccessWrapper>
  );
}
