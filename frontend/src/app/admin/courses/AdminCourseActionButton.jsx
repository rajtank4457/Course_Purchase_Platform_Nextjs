"use client";

import { useRouter } from "next/navigation";
import { apiRequest, courseApi } from "@/lib/apiHelper";
import { Edit, Trash2 } from "lucide-react";

export default function AdminCourseActionButton({ course, onDeleted }) {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/admin/update-course/${course.courseId}`);
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${course.courseName}"?`,
    );

    if (!confirmDelete) return;

    try {
      const service = courseApi.deleteCourse;

      const req = {
        method: "POST",
        data: {
          courseId: course.courseId,
        },
      };

      const res = await apiRequest(service, req);

      if (!res.success) {
        alert(res.message || "Failed to delete course");
        return;
      }

      alert(res.data?.message || "Course deleted successfully");

      if (onDeleted) {
        onDeleted();
      }
    } catch (err) {
      alert("Failed to delete course");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleEdit}
        className="inline-flex items-center gap-2 cursor-pointer rounded-xl bg-purple-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-purple-800"
      >
        <Edit className="h-4 w-4" />
        Edit
      </button>

      <button
        onClick={handleDelete}
        className="inline-flex items-center gap-2 cursor-pointer rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    </div>
  );
}
