"use client";

import { useRouter } from "next/navigation";
import axios from "axios";
import API_URL from "@/config/api";
import { Edit, Trash2 } from "lucide-react";

export default function AdminCourseActionButton({ course }) {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/admin/update-course/${course.courseId}`);
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${course.courseName}"?`
    );

    if (!confirmDelete) return;

    try {
      const res = await axios.post(
        `${API_URL}/courses/delete`,
        { courseId: course.courseId },
        { withCredentials: true }
      );

      if (res.data.success) {
        alert("Course deleted successfully");
        router.refresh();
      } else {
        alert(res.data.message || "Failed to delete course");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete course");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleEdit}
        className="inline-flex items-center gap-2 cursor-pointer rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
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