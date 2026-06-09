"use client";

import { useRouter } from "next/navigation";
import { PlayCircle } from "lucide-react";

export default function CourseChapterLink({
  course,
  isInLibrary,
}) {
  const router = useRouter();

  const handleClick = () => {
    if (
      Number(course.courseType) === 1 &&
      !isInLibrary
    ) {
      alert("Please purchase this course first.");
      return;
    }

    router.push(`/user/chapters/${course.courseSlug}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-1 hover:text-purple-700 hover:underline"
    >
      <PlayCircle className="h-4 w-4" />
      {course.chapterCount || 0} Chapters
    </button>
  );
}