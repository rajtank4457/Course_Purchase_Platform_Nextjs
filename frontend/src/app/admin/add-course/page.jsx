"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "@/config/api";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";


export default function AddCoursePage() {
  const router = useRouter();

  const [tab, setTab] = useState("course");
  const [loading, setLoading] = useState(false);

  const [courses, setCourses] = useState([]);

  const [courseImage, setCourseImage] = useState(null);
  const [coursePreview, setCoursePreview] = useState("");
  const [editorMode, setEditorMode] = useState("visual");

  const [course, setCourse] = useState({
    courseName: "",
    departmentId: "",
    courseDesc: "",
    courseType: 0,
    coursePrice: "",
    courseSlug: "",
  });
  const emptyChapter = {
    chapterName: "",
    chapterDesc: "",
    videoUrl: "",
    slug: "",
    content: "",
    files: [],
  };

  const CKEditor = dynamic(
    () => import("@ckeditor/ckeditor5-react").then((mod) => mod.CKEditor),
    { ssr: false }
  );

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [chapters, setChapters] = useState([emptyChapter]);

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
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
    setChapters([...chapters, { ...emptyChapter }]);
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

  const fetchCourses = async () => {
    const res = await axios.get(`${API_URL}/courses`, {
      withCredentials: true,
    });

    setCourses(res.data.data || []);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCourseImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      alert("Only JPG, JPEG, PNG and WEBP images are allowed");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2MB");
      return;
    }

    setCourseImage(file);
    setCoursePreview(URL.createObjectURL(file));
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("courseName", course.courseName);
      formData.append("departmentId", course.departmentId);
      formData.append("courseDesc", course.courseDesc);
      formData.append("courseType", course.courseType);
      formData.append("coursePrice", course.courseType == 1 ? course.coursePrice : 0);
      formData.append("courseSlug", course.courseSlug);

      if (courseImage) {
        formData.append("courseImg", courseImage);
      }

      const res = await axios.post(`${API_URL}/courses/add`, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert(res.data.message || "Course added successfully");

      setCourse({
        courseName: "",
        departmentId: "",
        courseDesc: "",
        courseType: 0,
        coursePrice: "",
        courseSlug: "",
      });

      setCourseImage(null);
      setCoursePreview("");

      await fetchCourses();

      const newCourse = res.data.data;

      setChapter((prev) => ({
        ...prev,
        courseId: newCourse?.courseId || "",
      }));

      setTab("chapter");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add course");
    } finally {
      setLoading(false);
    }
  };

  // const handleChapterFileChange = (e) => {
  //   const selectedFiles = Array.from(e.target.files);

  //   const allowedExtensions = [
  //     "pdf",
  //     "jpg",
  //     "jpeg",
  //     "png",
  //     "webp",
  //     "doc",
  //     "docx",
  //     "xls",
  //     "xlsx",
  //     "mp4",
  //     "mov",
  //   ];

  //   const validFiles = selectedFiles.filter((file) => {
  //     const ext = file.name.split(".").pop().toLowerCase();

  //     if (!allowedExtensions.includes(ext)) {
  //       alert(`${file.name} is not allowed`);
  //       return false;
  //     }

  //     if (file.size > 10 * 1024 * 1024) {
  //       alert(`${file.name} must be less than 10MB`);
  //       return false;
  //     }

  //     return true;
  //   });

  //   setChapterFiles(validFiles);
  // };

  const handleChapterSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCourseId) {
      alert("Please select course");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("courseId", selectedCourseId);

      const chapterData = chapters.map((chapter, index) => ({
        tempId: index,
        chapterName: chapter.chapterName,
        chapterDesc: chapter.chapterDesc,
        videoUrl: chapter.videoUrl,
        slug: chapter.slug,
        content: chapter.content,
      }));

      formData.append("chapters", JSON.stringify(chapterData));

      chapters.forEach((chapter, index) => {
        chapter.files.forEach((file) => {
          formData.append(`chapterFiles_${index}`, file);
        });
      });

      const res = await axios.post(
        `${API_URL}/chapters/add-multiple`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert(res.data.message || "Chapters added successfully");

      setSelectedCourseId("");
      setChapters([{ ...emptyChapter }]);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add chapters");
    } finally {
      setLoading(false);
    }
  };

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
          Admin Course Management
        </h1>

        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setTab("course")}
            className={`rounded-lg px-5 py-2 font-semibold ${tab === "course"
              ? "bg-purple-700 text-white"
              : "bg-gray-100 text-gray-700"
              }`}
          >
            Add Course
          </button>

          <button
            onClick={() => setTab("chapter")}
            className={`rounded-lg px-5 py-2 font-semibold ${tab === "chapter"
              ? "bg-purple-700 text-white"
              : "bg-gray-100 text-gray-700"
              }`}
          >
            Add Chapter
          </button>
        </div>

        {tab === "course" && (
          <form onSubmit={handleCourseSubmit} className="space-y-4">
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
                    coursePrice: Number(e.target.value) === 0 ? "" : course.coursePrice,
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
              <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  Image Preview
                </p>

                <div className="flex items-center gap-4">
                  <div className="relative flex h-28 w-44 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-black">
                    <img
                      src={coursePreview}
                      alt="Course Preview"
                      className="max-h-full max-w-full object-contain"
                    />

                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                      <div className="h-1 rounded-full bg-white/30">
                        <div className="h-1 w-1/2 rounded-full bg-white" />
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-900">
                      {courseImage?.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      This image will be used as course thumbnail.
                    </p>

                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-purple-700 py-3 font-bold text-white disabled:bg-gray-400"
            >
              {loading ? "Adding..." : "Add Course"}
            </button>
          </form>
        )}

        {tab === "chapter" && (
          <form onSubmit={handleChapterSubmit} className="space-y-5">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              required
              className="w-full rounded-lg border px-4 py-3"
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course.courseId} value={course.courseId}>
                  {course.courseName}
                </option>
              ))}
            </select>

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
                        data={chapter.content}
                        onChange={(event, editor) => {
                          updateChapter(index, "content", editor.getData());
                        }}
                      />
                    ) : (
                      <textarea
                        value={chapter.content}
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
              {loading ? "Adding..." : "Add All Chapters"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}