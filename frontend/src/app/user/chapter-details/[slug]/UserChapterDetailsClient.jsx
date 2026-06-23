"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import * as XLSX from "xlsx";
import YouTube from "react-youtube";
import API_URL from "@/config/api";
import {
  ArrowLeft,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  FileArchive,
  X,
  PlayCircle,
} from "lucide-react";

export default function UserChapterDetailsClient() {
  const router = useRouter();
  const { slug } = useParams();

  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isExcel, setIsExcel] = useState(false);
  const [excelData, setExcelData] = useState([]);

  const descRef = useRef(null);
  const notesRef = useRef(null);
  const lastSavedRef = useRef(0);
  const notesContentRef = useRef(null);
  const [notesScrollHeight, setNotesScrollHeight] = useState("auto");

  const [descDone, setDescDone] = useState(false);
  const [notesProgress, setNotesProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [sourceProgress, setSourceProgress] = useState(0);
  const [openedFiles, setOpenedFiles] = useState([]);
  const [chapterExams, setChapterExams] = useState([]);

  const getOpenedFilesKey = (chId) => `opened_files_chapter_${chId}`;
  const videoIntervalRef = useRef(null);
  const getVideoProgressKey = (chId) => `video_progress_chapter_${chId}`;

  const rawProgress =
    (descDone ? 25 : 0) + notesProgress + videoProgress + sourceProgress;

  const totalProgress = rawProgress >= 99 ? 100 : rawProgress;

  const fetchSavedProgress = async (chId) => {
    try {
      const res = await axios.get(`${API_URL}/progress/chapter/${chId}`, {
        withCredentials: true,
      });

      const saved = res.data.data || {};

      const dbProgress = Number(saved.progress || 0);

      setDescDone(Number(saved.descDone) === 1 || dbProgress >= 100);

      setNotesProgress((prev) =>
        Math.max(
          prev,
          Number(saved.notesProgress || 0),
          dbProgress >= 100 ? 25 : 0,
        ),
      );

      const dbVideoProgress = Number(saved.videoProgress || 0);
      const localVideoProgress = Number(
        localStorage.getItem(getVideoProgressKey(chId)) || 0,
      );

      setVideoProgress((prev) =>
        Math.max(
          prev,
          dbVideoProgress,
          localVideoProgress,
          dbProgress >= 100 ? 25 : 0,
        ),
      );

      setSourceProgress((prev) =>
        Math.max(
          prev,
          Number(saved.sourceProgress || 0),
          dbProgress >= 100 ? 25 : 0,
        ),
      );

      const localOpenedFiles = JSON.parse(
        localStorage.getItem(getOpenedFilesKey(chId)) || "[]",
      );

      setOpenedFiles(localOpenedFiles);

      lastSavedRef.current = dbProgress;
    } catch (err) {
      console.log(err);
    }
  };

  const fetchChapterExams = async (courseId, chId) => {
    try {
      const res = await axios.get(`${API_URL}/exams/available`, {
        withCredentials: true,
      });

      const filtered = (res.data.data || []).filter(
        (exam) =>
          Number(exam.courseId) === Number(courseId) &&
          Number(exam.chId) === Number(chId) &&
          exam.examType === "chapter",
      );

      setChapterExams(filtered);
    } catch (err) {
      console.log("CHAPTER EXAM ERROR:", err.response?.data || err);
    }
  };

  const fetchChapter = async () => {
    try {
      const res = await axios.get(`${API_URL}/chapters/${slug}`, {
        withCredentials: true,
      });

      setChapter({
        ...res.data.data,
        sources: res.data.data.sources || [],
      });

      const data = res.data.data;

      setChapter({
        ...data,
        sources: data.sources || [],
      });

      await fetchSavedProgress(data.chId);
      await fetchChapterExams(data.courseId, data.chId);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load chapter");
      router.push("/user/courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchChapter();
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      const rect = descRef.current?.getBoundingClientRect();

      if (rect && rect.bottom < window.innerHeight) {
        setDescDone((prev) => prev || true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!chapter) return;

    const total = chapter?.sources?.length || 0;

    if (total === 0) {
      setSourceProgress(0);
      return;
    }

    const progress = Math.min((openedFiles.length / total) * 25, 25);

    setSourceProgress((prev) => Math.max(prev, progress));
  }, [openedFiles, chapter]);

  useEffect(() => {
    if (!chapter) return;

    const currentProgress =
      Math.round(totalProgress) >= 99 ? 100 : Math.round(totalProgress);

    if (currentProgress === lastSavedRef.current) return;

    const timer = setTimeout(async () => {
      try {
        await axios.post(
          `${API_URL}/progress/chapter/save`,
          {
            courseId: chapter.courseId,
            chId: chapter.chId,
            progress: currentProgress,
            descDone,
            notesProgress: Math.round(notesProgress),
            videoProgress: Math.round(videoProgress),
            sourceProgress: Math.round(sourceProgress),
          },
          { withCredentials: true },
        );

        lastSavedRef.current = currentProgress;
      } catch (err) {
        console.log(err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    totalProgress,
    chapter,
    descDone,
    notesProgress,
    videoProgress,
    sourceProgress,
  ]);

  useEffect(() => {
    const handleScroll = () => {
      if (!notesRef.current) return;

      const rect = notesRef.current.getBoundingClientRect();

      if (rect.bottom <= window.innerHeight + 50) {
        setNotesProgress(25); // full notes marks
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const onVideoStateChange = (event) => {
    const player = event.target;

    // 1 = playing
    if (event.data === 1) {
      if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
      }

      videoIntervalRef.current = setInterval(() => {
        const current = player.getCurrentTime();
        const duration = player.getDuration();

        if (!duration) return;

        const progress = (current / duration) * 25;

        setVideoProgress((prev) => {
          const newProgress = Math.max(prev, Math.min(progress, 25));

          if (chapter?.chId) {
            localStorage.setItem(
              getVideoProgressKey(chapter.chId),
              String(newProgress),
            );
          }

          return newProgress;
        });

        if (progress >= 24.5) {
          setVideoProgress(25);

          if (chapter?.chId) {
            localStorage.setItem(getVideoProgressKey(chapter.chId), "25");
          }
          clearInterval(videoIntervalRef.current);
        }
      }, 1000);
    }

    // 2 = paused, 0 = ended
    if (event.data === 2 || event.data === 0) {
      if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
      }
    }

    if (event.data === 0) {
      setVideoProgress((prev) => Math.max(prev, 25));

      if (chapter?.chId) {
        localStorage.setItem(getVideoProgressKey(chapter.chId), "25");
      }
    }
  };

  const getYouTubeId = (url) => {
    if (!url) return null;
    if (url.includes("youtu.be/"))
      return url.split("youtu.be/")[1].split("?")[0];
    if (url.includes("v=")) return url.split("v=")[1].split("&")[0];
    if (url.includes("embed/")) return url.split("embed/")[1].split("?")[0];
    return null;
  };

  const getFileIcon = (fileName = "") => {
    const ext = fileName.split(".").pop()?.toLowerCase();

    if (ext === "pdf") return <FileText className="h-5 w-5 text-red-600" />;
    if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
      return <FileImage className="h-5 w-5 text-green-600" />;
    }
    if (["xls", "xlsx"].includes(ext)) {
      return <FileSpreadsheet className="h-5 w-5 text-green-700" />;
    }
    if (["mp4", "mov", "avi", "mkv"].includes(ext)) {
      return <FileVideo className="h-5 w-5 text-purple-600" />;
    }

    return <FileArchive className="h-5 w-5 text-gray-600" />;
  };

  const handleFileOpen = async (file) => {
    const fileUrl = `${API_URL}/${file.filePath}`;
    const ext = file.fileName.split(".").pop().toLowerCase();

    setOpenedFiles((prev) => {
      if (prev.includes(file.fileName)) return prev;

      const updated = [...prev, file.fileName];

      if (chapter?.chId) {
        localStorage.setItem(
          getOpenedFilesKey(chapter.chId),
          JSON.stringify(updated),
        );
      }

      return updated;
    });

    if (["xlsx", "xls"].includes(ext)) {
      const res = await axios.get(fileUrl, {
        responseType: "arraybuffer",
      });

      const workbook = XLSX.read(res.data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      let data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const maxCols = Math.max(...data.map((row) => row.length));

      data = data.map((row) => {
        const newRow = [...row];
        while (newRow.length < maxCols) newRow.push("");
        return newRow;
      });

      setExcelData(data);
      setIsExcel(true);
      setSelectedFile(fileUrl);
      return;
    }

    if (["doc", "docx", "ppt", "pptx"].includes(ext)) {
      setSelectedFile(
        `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`,
      );
      setIsExcel(false);
      return;
    }

    setSelectedFile(fileUrl);
    setIsExcel(false);
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
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 font-bold text-purple-700 hover:text-purple-900"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
          <div className="bg-purple-700 p-6 text-white">
            <p className="text-sm font-bold uppercase tracking-wide text-purple-100">
              Chapter Details
            </p>

            <h1 className="mt-2 text-3xl font-black">{chapter.chapterName}</h1>

            <p className="mt-2 text-sm text-purple-100">
              Progress: {Math.round(totalProgress)}%
            </p>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-purple-300">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${Math.round(totalProgress)}%` }}
              />
            </div>
            {Math.round(totalProgress) >= 100 && chapterExams.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-3">
                {chapterExams.map((exam) => (
                  <button
                    key={exam.examId}
                    onClick={() =>
                      router.push(`/user/exams/${exam.examId}/start`)
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2 text-sm font-black text-purple-700 hover:bg-purple-100"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Start Test
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-6">
            <div ref={descRef}>
              <h2 className="mb-3 text-xl font-black text-gray-900">
                Description
              </h2>

              <p className="leading-8 text-gray-600">{chapter.chapterDesc}</p>
            </div>
            <div ref={notesRef} className="mt-8">
              <h2 className="mb-3 text-xl font-black text-gray-900">
                Practice / Notes
              </h2>

              {chapter.content ? (
                <div
                  className="prose prose-lg max-w-none rounded-2xl  bg-white p-6"
                  dangerouslySetInnerHTML={{
                    __html: chapter.content,
                  }}
                />
              ) : (
                <p className="rounded-2xl bg-gray-50 p-5 text-gray-400">
                  No notes available.
                </p>
              )}
            </div>

            {chapter.videoUrl && (
              <div className="mt-8">
                <h2 className="mb-3 text-xl font-black text-gray-900">
                  Video Lecture
                </h2>

                {videoId ? (
                  <YouTube
                    videoId={videoId}
                    onStateChange={onVideoStateChange}
                    opts={{
                      width: "100%",
                      height: "420",
                      playerVars: { autoplay: 0 },
                    }}
                    className="overflow-hidden rounded-2xl shadow"
                  />
                ) : (
                  <a
                    href={chapter.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-purple-700 underline"
                  >
                    Open Video
                  </a>
                )}
              </div>
            )}

            <div className="mt-8">
              <h2 className="mb-3 text-xl font-black text-gray-900">
                Chapter Sources
              </h2>

              {chapter.sources.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {chapter.sources.map((file) => (
                    <button
                      key={file.csId}
                      type="button"
                      onClick={() => handleFileOpen(file)}
                      className={`flex items-center justify-between rounded-2xl border p-4 text-left transition hover:bg-gray-50 ${
                        openedFiles.includes(file.fileName)
                          ? "border-green-400 bg-green-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      {getFileIcon(file.fileName)}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-900">
                          {file.fileName}
                        </p>

                        <p className="text-xs text-gray-500">
                          {file.extension?.toUpperCase()} File
                        </p>
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
                <p className="rounded-2xl bg-gray-50 p-5 text-gray-400">
                  No sources available.
                </p>
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