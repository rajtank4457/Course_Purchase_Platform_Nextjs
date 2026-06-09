"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import API_URL from "@/config/api";
import { Edit, Trash2 } from "lucide-react";

export default function ChapterActions({ chapter }) {
    const router = useRouter();

    const handleDelete = async () => {
        try {
            await axios.post(
                `${API_URL}/chapters/delete`,
                { chId: chapter.chId },
                { withCredentials: true }
            );

            router.refresh();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete chapter");
        }
    };

    return (
        <div
            className="mt-5 flex items-center gap-3"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            <Link
                href={`/admin/edit-chapter/${chapter.slug}`}
                onClick={(e) => {
                    e.stopPropagation();
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-200"
            >
                <Edit className="h-4 w-4" />
                Edit
            </Link>

            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete();
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-200"
            >
                <Trash2 className="h-4 w-4" />
                Delete
            </button>
        </div>
    );
}