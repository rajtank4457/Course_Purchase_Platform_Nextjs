"use client";

import { useRouter } from "next/navigation";
import { FileText, PlayCircle } from "lucide-react";

export default function ChapterCard({ chapter }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/admin/chapter-details/${chapter.slug}`)}
      className="group cursor-pointer rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-2xl bg-purple-100 p-3 text-purple-700">
          <FileText className="h-6 w-6" />
        </div>

        <span className="text-sm font-bold text-gray-400">
          #{chapter.chId}
        </span>
      </div>

      <h2 className="text-xl font-black text-gray-900 group-hover:text-purple-700">
        {chapter.chapterName}
      </h2>

      <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
        {chapter.chapterDesc}
      </p>

      <div className="mt-5 flex items-center gap-2 text-sm font-bold text-purple-700">
        <PlayCircle className="h-4 w-4" />
        View Chapter Details
      </div>
    </div>
  );
}