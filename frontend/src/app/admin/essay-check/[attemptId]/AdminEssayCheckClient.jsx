"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest, examApi } from "@/lib/apiHelper";
import {
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Save,
  XCircle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export default function AdminEssayCheckClient() {
  const { attemptId } = useParams();
  const router = useRouter();

  const [attempt, setAttempt] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [marks, setMarks] = useState("");
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const currentQuestion = attempt?.questions?.[currentIndex];

  useEffect(() => {
    fetchEssayDetails();
  }, [attemptId]);

  useEffect(() => {
    if (currentQuestion?.questionType === "essay") {
      setMarks(
        currentQuestion.obtainedMarks
          ? String(currentQuestion.obtainedMarks)
          : "",
      );
      setRemark(currentQuestion.feedback || "");
    } else {
      setMarks("");
      setRemark("");
    }
  }, [currentIndex, currentQuestion]);

  const fetchEssayDetails = async () => {
    try {
      setLoading(true);

      const service = examApi.getEssayCheckDetails(attemptId);

      const req = {
        method: "GET",
      };

      const res = await apiRequest(service, req);

      if (!res.success) {
        alert(res.message || "Failed to load essay");
        router.push("/admin/exams/pending-check");
        return;
      }

      setAttempt(res.data?.data || null);
    } catch (err) {
      alert("Failed to load essay");
      router.push("/admin/exams/pending-check");
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => {
    if (!attempt?.questions) return;

    if (currentIndex < attempt.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSave = async () => {
    if (!currentQuestion || currentQuestion.questionType !== "essay") {
      return;
    }

    if (!marks) {
      alert("Please enter marks");
      return;
    }

    if (Number(marks) < 0) {
      alert("Marks cannot be negative");
      return;
    }

    if (Number(marks) > Number(currentQuestion.totalMarks)) {
      alert("Marks cannot be greater than total marks");
      return;
    }

    try {
      setSaving(true);

      const service = examApi.checkEssayManually;

      const req = {
        method: "POST",
        data: {
          attemptId: attempt.attemptId,
          answerId: currentQuestion.answerId,
          obtainedMarks: Number(marks),
          adminRemark: remark,
        },
      };

      const res = await apiRequest(service, req);

      if (!res.success) {
        alert(res.message || "Failed to save evaluation");
        return;
      }

      alert(res.data?.message || "Essay checked successfully");

      if (res.data?.completed) {
        router.push("/admin/exams/pending-check");
        return;
      }

      await fetchEssayDetails();

      if (currentIndex < attempt.questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }

      setMarks("");
      setRemark("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save evaluation");
    } finally {
      setSaving(false);
    }
  };

  const renderStudentAnswer = (answer) => {
    if (Array.isArray(answer)) return answer.join(", ");
    if (answer && typeof answer === "object") return JSON.stringify(answer);
    return answer || "No answer submitted";
  };

  const renderCorrectAnswer = (question) => {
    if (!question) return "-";

    if (question.questionType === "single") {
      return question.correctAnswers?.[0]?.answer || "-";
    }

    if (
      question.questionType === "multiple" ||
      question.questionType === "dropdown_blank" ||
      question.questionType === "drag_drop_blank"
    ) {
      return (
        question.correctAnswers?.map((item) => item.answer).join(", ") || "-"
      );
    }

    return "-";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-700" />
      </div>
    );
  }

  if (!attempt || !currentQuestion) return null;

  const isEssay = currentQuestion.questionType === "essay";

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-1 text-sm font-bold text-yellow-700">
                <Clock className="h-4 w-4" />
                Pending Manual Check
              </span>

              <h1 className="mt-3 text-3xl font-black text-gray-900">
                Attempt Review
              </h1>

              <p className="mt-1 text-gray-600">
                Review all questions. Essay questions can be manually checked.
              </p>
            </div>

            <div className="rounded-2xl bg-purple-700 px-6 py-4 text-white">
              <p className="text-sm font-semibold opacity-80">Question</p>
              <p className="text-3xl font-black">
                {currentIndex + 1} / {attempt.questions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <InfoCard label="Student" value={attempt.studentName} />
          <InfoCard label="Course" value={attempt.courseName} />
          <InfoCard label="Exam" value={attempt.examTitle} />
          <InfoCard label="Attempt ID" value={`#${attempt.attemptId}`} />
        </div>

        <div className="rounded-3xl bg-white p-5 shadow">
          <div className="flex flex-wrap gap-2">
            {attempt.questions.map((q, index) => (
              <button
                type="button"
                key={q.questionId}
                onClick={() => setCurrentIndex(index)}
                className={`rounded-2xl border px-4 py-2 text-sm font-black ${
                  currentIndex === index
                    ? "border-purple-600 bg-purple-700 text-white"
                    : q.questionType === "essay"
                      ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                      : "border-gray-200 bg-gray-50 text-gray-700"
                }`}
              >
                Q{index + 1} {q.questionType === "essay" ? "Essay" : ""}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-700" />
                  <h2 className="text-xl font-black text-gray-900">
                    Question {currentIndex + 1}
                  </h2>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-sm font-black ${
                    isEssay
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {currentQuestion.questionType}
                </span>
              </div>

              <p className="rounded-2xl bg-gray-50 p-4 font-semibold text-gray-800">
                {currentQuestion.questionText}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow">
              <div className="mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-700" />
                <h2 className="text-xl font-black text-gray-900">
                  Student Answer
                </h2>
              </div>

              <div className="max-h-[600px] overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <p className="whitespace-pre-wrap break-words leading-8 text-gray-700">
                  {renderStudentAnswer(currentQuestion.studentAnswer)}
                </p>
              </div>
            </div>

            {!isEssay && (
              <div className="rounded-3xl bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-black text-gray-900">
                  Auto Checked Result
                </h2>

                <div className="grid gap-4 md:grid-cols-3">
                  <InfoCard
                    label="Correct Answer"
                    value={renderCorrectAnswer(currentQuestion)}
                  />
                  <InfoCard
                    label="Obtained Marks"
                    value={`${currentQuestion.obtainedMarks} / ${currentQuestion.totalMarks}`}
                  />
                  <InfoCard
                    label="Status"
                    value={
                      Number(currentQuestion.isCorrect) === 1
                        ? "Correct"
                        : "Wrong"
                    }
                  />
                </div>

                {currentQuestion.feedback && (
                  <p className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm font-bold text-gray-700">
                    {currentQuestion.feedback}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={goPrevious}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-2 rounded-2xl bg-gray-200 px-5 py-3 font-black text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                <ArrowLeft className="h-5 w-5" />
                Previous
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={currentIndex >= attempt.questions.length - 1}
                className="inline-flex items-center gap-2 rounded-2xl bg-purple-700 px-5 py-3 font-black text-white hover:bg-purple-800 disabled:opacity-50"
              >
                Next
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {isEssay ? (
              <>
                <div className="rounded-3xl bg-white p-6 shadow">
                  <h2 className="mb-4 text-xl font-black text-gray-900">
                    Expected Points
                  </h2>

                  <div className="space-y-3">
                    {(currentQuestion.correctAnswers || []).map(
                      (item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-2xl border border-gray-200 p-3"
                        >
                          <div className="flex items-start gap-2">
                            <CheckCircle className="mt-1 h-4 w-4 text-green-600" />
                            <p className="text-sm font-bold text-gray-700">
                              {item.point || item.answer || item}
                            </p>
                          </div>

                          {item.marks && (
                            <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-black text-purple-700">
                              {item.marks}
                            </span>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow">
                  <h2 className="mb-4 text-xl font-black text-gray-900">
                    Give Marks
                  </h2>

                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Obtained Marks
                  </label>

                  <input
                    type="number"
                    min="0"
                    max={currentQuestion.totalMarks}
                    step="0.5"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    placeholder={`Out of ${currentQuestion.totalMarks}`}
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 font-bold outline-none focus:border-purple-600"
                  />

                  <label className="mb-2 mt-5 block text-sm font-bold text-gray-700">
                    Admin Remark
                  </label>

                  <textarea
                    rows={5}
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Write feedback for student..."
                    className="w-full resize-none rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-purple-600"
                  />

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setMarks("");
                        setRemark("");
                      }}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-gray-200 px-4 py-3 font-black text-gray-700 hover:bg-gray-300"
                    >
                      <XCircle className="h-5 w-5" />
                      Clear
                    </button>

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-purple-700 px-4 py-3 font-black text-white hover:bg-purple-800 disabled:opacity-60"
                    >
                      <Save className="h-5 w-5" />
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-3xl bg-white p-6 shadow">
                <h2 className="text-xl font-black text-gray-900">
                  No Manual Action
                </h2>

                <p className="mt-2 text-sm font-semibold text-gray-500">
                  This question was checked automatically. Use Next to continue.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <p className="text-sm font-bold text-gray-500">{label}</p>
      <h3 className="mt-1 break-words text-lg font-black text-gray-900">
        {value || "-"}
      </h3>
    </div>
  );
}
