"use client";

import { useState } from "react";
import axios from "axios";
import API_URL from "@/config/api";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

const CKEditor = dynamic(
    () => import("@ckeditor/ckeditor5-react").then((mod) => mod.CKEditor),
    { ssr: false }
);

export default function EditCourseChapterClient({ courseData, chapterData }) {
    const router = useRouter();

    const [tab, setTab] = useState("course");
    const [loading, setLoading] = useState(false);
    const [editorMode, setEditorMode] = useState("visual");

    const [courseImage, setCourseImage] = useState(null);
    const [coursePreview, setCoursePreview] = useState(
        courseData?.courseImg ? `${API_URL}/uploads/${courseData.courseImg}` : ""
    );

    const [course, setCourse] = useState({
        courseId: courseData?.courseId || "",
        courseName: courseData?.courseName || "",
        departmentId: courseData?.departmentId || "",
        courseDesc: courseData?.courseDesc || "",
        courseType: Number(courseData?.courseType || 0),
        coursePrice: courseData?.coursePrice || "",
        courseSlug: courseData?.courseSlug || "",
    });

    const [chapters, setChapters] = useState(
        chapterData?.length
            ? chapterData.map((ch) => ({
                chId: ch.chId,
                oldSlug: ch.slug,
                chapterName: ch.chapterName || ch.chName || "",
                chapterDesc: ch.chapterDesc || ch.chDesc || "",
                videoUrl: ch.videoUrl || "",
                slug: ch.slug || "",
                content: ch.content || "",
                files: [],
            }))
            : [
                {
                    oldSlug: "",
                    chapterName: "",
                    chapterDesc: "",
                    videoUrl: "",
                    slug: "",
                    content: "",
                    files: [],
                },
            ]
    );

    const generateSlug = (text) =>
        text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-");

    const handleCourseImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setCourseImage(file);
        setCoursePreview(URL.createObjectURL(file));
    };

    const updateChapter = (index, field, value) => {
        const updated = [...chapters];

        updated[index] = {
            ...updated[index],
            [field]: value,
        };

        if (field === "chapterName") {
            updated[index].slug = generateSlug(value);
        }

        setChapters(updated);
    };

    const addMoreChapter = () => {
        setChapters([
            ...chapters,
            {
                oldSlug: "",
                chapterName: "",
                chapterDesc: "",
                videoUrl: "",
                slug: "",
                content: "",
                files: [],
            },
        ]);
    };

    const removeChapter = (index) => {
        if (chapters.length === 1) return;
        setChapters(chapters.filter((_, i) => i !== index));
    };

    const handleChapterFilesChange = (index, e) => {
        const files = Array.from(e.target.files);
        const updated = [...chapters];

        updated[index] = {
            ...updated[index],
            files,
        };

        setChapters(updated);
    };

    const handleCourseUpdate = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            const formData = new FormData();

            formData.append("courseId", course.courseId);
            formData.append("courseName", course.courseName);
            formData.append("departmentId", course.departmentId);
            formData.append("courseDesc", course.courseDesc);
            formData.append("courseType", course.courseType);
            formData.append(
                "coursePrice",
                Number(course.courseType) === 1 ? course.coursePrice : 0
            );
            formData.append("courseSlug", course.courseSlug);

            if (courseImage) {
                formData.append("courseImg", courseImage);
            }

            const res = await axios.post(`${API_URL}/courses/update`, formData, {
                withCredentials: true,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            alert(res.data.message || "Course updated successfully");
            router.refresh();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update course");
        } finally {
            setLoading(false);
        }
    };

    const handleChaptersUpdate = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            for (const chapter of chapters) {
                const formData = new FormData();

                formData.append("slug", chapter.oldSlug || chapter.slug);
                formData.append("chapterName", chapter.chapterName);
                formData.append("chapterDesc", chapter.chapterDesc);
                formData.append("videoUrl", chapter.videoUrl || "");
                formData.append("chapterSlug", chapter.slug);
                formData.append("content", chapter.content || "");

                chapter.files.forEach((file) => {
                    formData.append("files", file);
                });

                await axios.post(`${API_URL}/chapters/update`, formData, {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
            }

            alert("Chapters updated successfully");
            router.refresh();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update chapters");
        } finally {
            setLoading(false);
        }
    };

    if (!courseData) {
        return (
            <div className="p-10 text-center text-xl font-bold text-red-600">
                Course not found
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8">
            <button
                onClick={() => router.push("/admin/courses")}
                className="mb-6 flex items-center gap-2 font-bold text-purple-700 hover:text-purple-900"
            >
                <ArrowLeft className="h-5 w-5" />
                Back To Courses
            </button>

            <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow">
                <h1 className="mb-6 text-2xl font-bold text-gray-900">
                    Edit Course Management
                </h1>

                <div className="mb-6 flex gap-3">
                    <button
                        type="button"
                        onClick={() => setTab("course")}
                        className={`rounded-lg px-5 py-2 font-semibold ${tab === "course"
                                ? "bg-purple-700 text-white"
                                : "bg-gray-100 text-gray-700"
                            }`}
                    >
                        Edit Course
                    </button>

                    <button
                        type="button"
                        onClick={() => setTab("chapter")}
                        className={`rounded-lg px-5 py-2 font-semibold ${tab === "chapter"
                                ? "bg-purple-700 text-white"
                                : "bg-gray-100 text-gray-700"
                            }`}
                    >
                        Edit Chapters
                    </button>
                </div>

                {tab === "course" && (
                    <form onSubmit={handleCourseUpdate} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <input
                                type="text"
                                placeholder="Course Name"
                                value={course.courseName}
                                onChange={(e) => {
                                    const name = e.target.value;
                                    setCourse({
                                        ...course,
                                        courseName: name,
                                        courseSlug: generateSlug(name),
                                    });
                                }}
                                required
                                className="rounded-lg border px-4 py-3"
                            />

                            <select
                                value={course.courseType}
                                onChange={(e) =>
                                    setCourse({
                                        ...course,
                                        courseType: Number(e.target.value),
                                        coursePrice:
                                            Number(e.target.value) === 0 ? "" : course.coursePrice,
                                    })
                                }
                                className="rounded-lg border px-4 py-3"
                            >
                                <option value={0}>Free</option>
                                <option value={1}>Premium</option>
                            </select>

                            {Number(course.courseType) === 1 && (
                                <input
                                    type="number"
                                    placeholder="Course Price"
                                    value={course.coursePrice}
                                    onChange={(e) =>
                                        setCourse({ ...course, coursePrice: e.target.value })
                                    }
                                    required
                                    className="rounded-lg border px-4 py-3"
                                />
                            )}

                            <input
                                type="text"
                                placeholder="Course Slug"
                                value={course.courseSlug}
                                onChange={(e) =>
                                    setCourse({ ...course, courseSlug: e.target.value })
                                }
                                required
                                className="rounded-lg border px-4 py-3"
                            />

                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                onChange={handleCourseImageChange}
                                className="rounded-lg border px-4 py-3"
                            />
                        </div>

                        <textarea
                            placeholder="Course Description"
                            value={course.courseDesc}
                            onChange={(e) =>
                                setCourse({ ...course, courseDesc: e.target.value })
                            }
                            required
                            rows={5}
                            className="w-full rounded-lg border px-4 py-3"
                        />

                        {coursePreview && (
                            <div className="rounded-2xl border bg-gray-50 p-3">
                                <p className="mb-2 text-xs font-bold uppercase text-gray-500">
                                    Image Preview
                                </p>

                                <img
                                    src={coursePreview}
                                    alt="Course Preview"
                                    className="h-32 w-52 rounded-xl object-cover"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-purple-700 py-3 font-bold text-white disabled:bg-gray-400"
                        >
                            {loading ? "Updating..." : "Update Course"}
                        </button>
                    </form>
                )}

                {tab === "chapter" && (
                    <form onSubmit={handleChaptersUpdate} className="space-y-5">
                        {chapters.map((chapter, index) => (
                            <div
                                key={index}
                                className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Chapter {index + 1}
                                    </h3>

                                    {chapters.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeChapter(index)}
                                            className="rounded-lg bg-red-100 px-3 py-1 text-sm font-bold text-red-600"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <input
                                        type="text"
                                        placeholder="Chapter Name"
                                        value={chapter.chapterName}
                                        onChange={(e) =>
                                            updateChapter(index, "chapterName", e.target.value)
                                        }
                                        required
                                        className="rounded-lg border px-4 py-3"
                                    />

                                    <input
                                        type="text"
                                        placeholder="Video URL"
                                        value={chapter.videoUrl}
                                        onChange={(e) =>
                                            updateChapter(index, "videoUrl", e.target.value)
                                        }
                                        className="rounded-lg border px-4 py-3"
                                    />

                                    <input
                                        type="text"
                                        placeholder="Chapter Slug"
                                        value={chapter.slug}
                                        onChange={(e) =>
                                            updateChapter(index, "slug", e.target.value)
                                        }
                                        required
                                        className="rounded-lg border px-4 py-3"
                                    />

                                    <input
                                        type="file"
                                        multiple
                                        onChange={(e) => handleChapterFilesChange(index, e)}
                                        className="rounded-lg border px-4 py-3"
                                    />
                                </div>

                                <textarea
                                    placeholder="Chapter Description"
                                    value={chapter.chapterDesc}
                                    onChange={(e) =>
                                        updateChapter(index, "chapterDesc", e.target.value)
                                    }
                                    required
                                    rows={4}
                                    className="mt-4 w-full rounded-lg border px-4 py-3"
                                />

                                <div className="mt-4">
                                    <label className="mb-2 block text-sm font-bold text-gray-700">
                                        Notes / Practice Content
                                    </label>

                                    <div className="mb-3 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditorMode("visual")}
                                            className={`rounded-lg px-3 py-2 ${editorMode === "visual"
                                                    ? "bg-purple-700 text-white"
                                                    : "bg-gray-100"
                                                }`}
                                        >
                                            Visual Editor
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setEditorMode("html")}
                                            className={`rounded-lg px-3 py-2 ${editorMode === "html"
                                                    ? "bg-purple-700 text-white"
                                                    : "bg-gray-100"
                                                }`}
                                        >
                                            HTML Source
                                        </button>
                                    </div>

                                    <div className="rounded-lg border bg-white p-2">
                                        {editorMode === "visual" ? (
                                            <CKEditor
                                                editor={ClassicEditor}
                                                data={chapter.content || ""}
                                                onChange={(event, editor) => {
                                                    updateChapter(index, "content", editor.getData());
                                                }}
                                            />
                                        ) : (
                                            <textarea
                                                value={chapter.content || ""}
                                                onChange={(e) =>
                                                    updateChapter(index, "content", e.target.value)
                                                }
                                                className="h-[400px] w-full rounded-lg border p-4 font-mono text-sm"
                                                placeholder="Paste raw HTML here..."
                                            />
                                        )}
                                    </div>
                                </div>

                                {chapter.files.length > 0 && (
                                    <div className="mt-4 rounded-lg bg-white p-3">
                                        <p className="mb-2 text-sm font-bold">Selected Files:</p>

                                        {chapter.files.map((file, fileIndex) => (
                                            <p key={fileIndex} className="text-sm text-gray-600">
                                                {file.name}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addMoreChapter}
                            className="w-full rounded-lg border border-dashed border-purple-400 py-3 font-bold text-purple-700 hover:bg-purple-50"
                        >
                            + Add More Chapter
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-purple-700 py-3 font-bold text-white disabled:bg-gray-400"
                        >
                            {loading ? "Updating..." : "Update All Chapters"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}