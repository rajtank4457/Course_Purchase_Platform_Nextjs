"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import * as XLSX from "xlsx";
import YouTube from "react-youtube";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import API_URL from "@/config/api";
import {
    ArrowLeft,
    ExternalLink,
    FileText,
    FileImage,
    FileSpreadsheet,
    FileVideo,
    FileArchive,
    Pencil,
    X,
} from "lucide-react";

export default function ChapterDetailsPage() {
    const router = useRouter();
    const { slug } = useParams();

    const [content, setContent] = useState("");
    const [tab, setTab] = useState("preview");
    const [saving, setSaving] = useState(false);

    const [chapter, setChapter] = useState(null);
    const [loading, setLoading] = useState(true);

    const [selectedFile, setSelectedFile] = useState(null);
    const [isExcel, setIsExcel] = useState(false);
    const [excelData, setExcelData] = useState([]);
    const [openedFiles, setOpenedFiles] = useState([]);

    const fetchChapter = async () => {
        try {
            const res = await axios.get(`${API_URL}/chapters/${slug}`, {
                withCredentials: true,
            });

            const data = res.data.data;

            setChapter({
                ...data,
                sources: data.sources || [],
            });

            setContent(data.content || "");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to load chapter");
            router.push("/admin/courses");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (slug) fetchChapter();
    }, [slug]);

    const getYouTubeId = (url) => {
        if (!url) return null;

        if (url.includes("youtu.be/")) {
            return url.split("youtu.be/")[1].split("?")[0];
        }

        if (url.includes("v=")) {
            return url.split("v=")[1].split("&")[0];
        }

        if (url.includes("embed/")) {
            return url.split("embed/")[1].split("?")[0];
        }

        return null;
    };

    const getFileIcon = (fileName = "") => {
        const ext = fileName.split(".").pop()?.toLowerCase();

        if (ext === "pdf") return <FileText className="h-5 w-5 text-red-600" />;
        if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext))
            return <FileImage className="h-5 w-5 text-green-600" />;
        if (["xls", "xlsx"].includes(ext))
            return <FileSpreadsheet className="h-5 w-5 text-green-700" />;
        if (["mp4", "mov", "avi", "mkv"].includes(ext))
            return <FileVideo className="h-5 w-5 text-purple-600" />;

        return <FileArchive className="h-5 w-5 text-gray-600" />;
    };

    const handleFileOpen = async (file) => {
        const fileUrl = `${API_URL}/${file.filePath}`;
        const ext = file.fileName.split(".").pop().toLowerCase();

        setOpenedFiles((prev) =>
            prev.includes(file.fileName) ? prev : [...prev, file.fileName]
        );

        if (["xlsx", "xls"].includes(ext)) {
            try {
                const res = await axios.get(fileUrl, {
                    responseType: "arraybuffer",
                });

                const workbook = XLSX.read(res.data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                let data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                const maxCols = Math.max(...data.map((row) => row.length));

                data = data.map((row) => {
                    const newRow = [...row];

                    while (newRow.length < maxCols) {
                        newRow.push("");
                    }

                    return newRow;
                });

                setExcelData(data);
                setIsExcel(true);
                setSelectedFile(fileUrl);
            } catch (err) {
                alert("Failed to open Excel file");
            }

            return;
        }

        if (["doc", "docx", "ppt", "pptx"].includes(ext)) {
            setSelectedFile(
                `https://docs.google.com/gview?url=${encodeURIComponent(
                    fileUrl
                )}&embedded=true`
            );
            setIsExcel(false);
            return;
        }

        setSelectedFile(fileUrl);
        setIsExcel(false);
    };

    const handleSaveContent = async () => {
        try {
            setSaving(true);

            const res = await axios.post(
                `${API_URL}/chapters/update-content`,
                {
                    slug: chapter.slug,
                    content,
                },
                { withCredentials: true }
            );

            alert(res.data.message || "Content saved successfully");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to save content");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="h-14 w-14 animate-spin rounded-full border-4 border-gray-300 border-t-purple-700"></div>
            </div>
        );
    }

    if (!chapter) return null;

    const videoId = getYouTubeId(chapter.videoUrl);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 px-4 py-8">
            <div className="mx-auto max-w-6xl">
                <div className="mb-6 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 font-bold text-purple-700 hover:text-purple-900"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Back
                    </button>

                    <button
                        onClick={() => router.push(`/admin/edit-chapter/${chapter.slug}`)}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
                    >
                        <Pencil className="h-4 w-4" />
                        Edit Chapter
                    </button>
                </div>

                <div className="mb-6 overflow-hidden rounded-3xl bg-white shadow-xl">
                    <div className="bg-purple-700 p-6 text-white">
                        <p className="text-sm font-bold uppercase tracking-wide text-purple-100">
                            Chapter Details
                        </p>

                        <h1 className="mt-2 text-3xl font-black">
                            {chapter.chapterName}
                        </h1>

                    </div>

                    <div className="p-6">
                        <h2 className="mb-3 text-xl font-black text-gray-900">
                            Description
                        </h2>

                        <p
                            className="leading-8 text-gray-600"
                        >
                            {chapter.chapterDesc}
                        </p>

                        <div className="mt-8">
                            <h2 className="mb-3 text-xl font-black text-gray-900">
                                Practice / Notes
                            </h2>

                            <div className="mb-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setTab("editor")}
                                    className={`rounded-xl px-4 py-2 font-bold ${tab === "editor"
                                        ? "bg-purple-700 text-white"
                                        : "bg-gray-100 text-gray-700"
                                        }`}
                                >
                                    Editor
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setTab("preview")}
                                    className={`rounded-xl px-4 py-2 font-bold ${tab === "preview"
                                        ? "bg-purple-700 text-white"
                                        : "bg-gray-100 text-gray-700"
                                        }`}
                                >
                                    Preview
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setTab("html")}
                                    className={`rounded-xl px-4 py-2 font-bold ${tab === "html"
                                        ? "bg-purple-700 text-white"
                                        : "bg-gray-100 text-gray-700"
                                        }`}
                                >
                                    Source Code
                                </button>
                            </div>

                            {tab === "editor" && (
                                <CKEditor
                                    key="editor-instance"
                                    editor={ClassicEditor}
                                    data={content}
                                    onChange={(event, editor) => {
                                        const html = editor.getData();
                                        setContent(html);
                                    }}
                                />
                            )}

                            {tab === "preview" && (
                                content ? (
                                    <div
                                        className="prose prose-lg max-w-none max-h-[500px] overflow-y-auto rounded-2xl border bg-white p-6"
                                        dangerouslySetInnerHTML={{
                                            __html: content,
                                        }}
                                    />
                                ) : (
                                    <p className="rounded-2xl bg-gray-50 p-5 text-gray-400">
                                        No preview available.
                                    </p>
                                )
                            )}

                            {tab === "html" && (
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="h-[300px] w-full rounded-2xl border p-4 font-mono text-sm"
                                />
                            )}

                            <button
                                type="button"
                                onClick={handleSaveContent}
                                disabled={saving}
                                className="mt-4 rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700 disabled:bg-gray-400"
                            >
                                {saving ? "Saving..." : "Save Content"}
                            </button>
                        </div>

                        {chapter.videoUrl ? (
                            <div className="mt-8">
                                <h2 className="mb-3 text-xl font-black text-gray-900">
                                    Video Lecture
                                </h2>

                                {videoId ? (
                                    <YouTube
                                        videoId={videoId}
                                        opts={{
                                            width: "100%",
                                            height: "420",
                                            playerVars: {
                                                autoplay: 0,
                                            },
                                        }}
                                        className="overflow-hidden rounded-2xl shadow"
                                    />
                                ) : (
                                    <a
                                        href={chapter.videoUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-xl bg-purple-100 px-4 py-2 font-bold text-purple-700 hover:bg-purple-200"
                                    >
                                        Open Video
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                )}
                            </div>
                        ) : (
                            <p className="mt-8 text-gray-400">No video available</p>
                        )}

                        <div className="mt-8">
                            <h2 className="mb-3 text-xl font-black text-gray-900">
                                Chapter Sources
                            </h2>

                            {chapter.sources && chapter.sources.length > 0 ? (
                                <div className="grid gap-3 md:grid-cols-2">
                                    {chapter.sources.map((file) => (
                                        <button
                                            key={file.csId}
                                            type="button"
                                            onClick={() => handleFileOpen(file)}
                                            className={`flex items-center justify-between rounded-2xl border p-4 text-left transition hover:bg-gray-50 `}
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                {getFileIcon(file.fileName)}

                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-gray-900">
                                                        {file.fileName}
                                                    </p>

                                                    <p className="text-xs text-gray-500">
                                                        {file.extension?.toUpperCase()} File
                                                    </p>
                                                </div>
                                            </div>

                                            {openedFiles.includes(file.fileName) && (
                                                <span className="shrink-0 text-xs font-bold text-green-600">
                                                    Completed
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400">No sources available</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {(selectedFile || isExcel) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="relative flex h-[90vh] w-[95vw] flex-col rounded-2xl bg-white shadow-2xl">
                        <button
                            onClick={() => {
                                setSelectedFile(null);
                                setIsExcel(false);
                                setExcelData([]);
                            }}
                            className="absolute right-4 top-4 z-50 rounded-full bg-red-600 p-2 text-white hover:bg-red-700"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {isExcel ? (
                            <div className="mt-14 flex-1 overflow-auto p-4">
                                <table className="w-full border-collapse text-sm">
                                    <tbody>
                                        {excelData.map((row, rowIndex) => (
                                            <tr key={rowIndex}>
                                                {row.map((cell, cellIndex) => (
                                                    <td
                                                        key={cellIndex}
                                                        className="border border-gray-300 px-3 py-2"
                                                    >
                                                        {cell}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : selectedFile?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img
                                src={selectedFile}
                                alt="preview"
                                className="h-full w-full object-contain p-8"
                            />
                        ) : selectedFile?.match(/\.(mp4|mov|avi|mkv)$/i) ? (
                            <video
                                src={selectedFile}
                                controls
                                className="h-full w-full rounded-2xl object-contain p-8"
                            />
                        ) : (
                            <iframe
                                src={selectedFile}
                                title="file-preview"
                                className="h-full w-full rounded-2xl pt-12"
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}