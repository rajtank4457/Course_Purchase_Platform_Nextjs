"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import API_URL from "@/config/api";
import { ArrowLeft, Save } from "lucide-react";

export default function UpdateChapterPage() {
    const router = useRouter();
    const { slug } = useParams();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [chapterFiles, setChapterFiles] = useState([]);

    const [form, setForm] = useState({
        chapterName: "",
        chapterDesc: "",
        videoUrl: "",
        chapterSlug: "",
    });

    useEffect(() => {
        fetchChapter();
    }, [slug]);

    const fetchChapter = async () => {
        try {
            const res = await axios.get(
                `${API_URL}/chapters/${slug}`,
                {
                    withCredentials: true,
                }
            );

            const chapter = res.data.data;

            setForm({
                chapterName: chapter.chapterName || "",
                chapterDesc: chapter.chapterDesc || "",
                videoUrl: chapter.videoUrl || "",
                chapterSlug: chapter.slug || "",
            });
        } catch (err) {
            alert("Failed to load chapter");
            router.push("/admin/courses");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);

            const formData = new FormData();

            formData.append("slug", slug);
            formData.append("chapterName", form.chapterName);
            formData.append("chapterDesc", form.chapterDesc);
            formData.append("videoUrl", form.videoUrl);
            formData.append("chapterSlug", form.chapterSlug);

            chapterFiles.forEach((file) => {
                formData.append("files", file);
            });

            const res = await axios.post(
                `${API_URL}/chapters/update`,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (res.data.success) {
                alert("Chapter updated successfully");
                router.back();
            }
        } catch (err) {
            alert(
                err.response?.data?.message ||
                "Failed to update chapter"
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                Loading Chapter...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8">
            <button
                onClick={() => router.back()}
                className="mb-6 flex items-center gap-2 font-bold text-purple-700 hover:text-purple-900"
            >
                <ArrowLeft className="h-5 w-5" />
                Back
            </button>

            <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow">
                <h1 className="mb-6 text-2xl font-bold text-gray-900">
                    Edit Chapter
                </h1>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">
                                Chapter Details
                            </h3>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <input
                                type="text"
                                placeholder="Chapter Name"
                                value={form.chapterName}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        chapterName: e.target.value,
                                    })
                                }
                                required
                                className="rounded-lg border px-4 py-3"
                            />

                            <input
                                type="text"
                                placeholder="Video URL"
                                value={form.videoUrl}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        videoUrl: e.target.value,
                                    })
                                }
                                className="rounded-lg border px-4 py-3"
                            />

                            <input
                                type="text"
                                placeholder="Chapter Slug"
                                value={form.chapterSlug}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        chapterSlug: e.target.value,
                                    })
                                }
                                required
                                className="rounded-lg border px-4 py-3"
                            />

                            <input
                                type="file"
                                multiple
                                onChange={(e) =>
                                    setChapterFiles(Array.from(e.target.files))
                                }
                                className="rounded-lg border px-4 py-3"
                            />
                        </div>

                        <textarea
                            placeholder="Chapter Description"
                            value={form.chapterDesc}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    chapterDesc: e.target.value,
                                })
                            }
                            required
                            rows={4}
                            className="mt-4 w-full rounded-lg border px-4 py-3"
                        />

                        {chapterFiles.length > 0 && (
                            <div className="mt-4 rounded-lg bg-white p-3">
                                <p className="mb-2 text-sm font-bold">Selected Files:</p>

                                {chapterFiles.map((file, fileIndex) => (
                                    <p key={fileIndex} className="text-sm text-gray-600">
                                        {file.name}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-700 py-3 font-bold text-white disabled:bg-gray-400"
                    >
                        <Save className="h-5 w-5" />
                        {saving ? "Updating..." : "Update Chapter"}
                    </button>
                </form>
            </div>
        </div>
    );
}