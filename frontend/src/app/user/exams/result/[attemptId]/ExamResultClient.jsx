"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiRequest, examApi } from "@/lib/apiHelper";

export default function ExamResultClient() {
  const router = useRouter();

  const [result, setResult] = useState(null);

  const params = useParams();

  const attemptId = Array.isArray(params.attemptId)
    ? params.attemptId[0]
    : params.attemptId;

  useEffect(() => {
    if (!attemptId) return;
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    try {
      const service = examApi.getExamResult(attemptId);

      const req = {
        method: "GET",
      };

      const res = await apiRequest(service, req);

      if (!res.success) {
        alert(res.message || "Result not found");
        router.push("/user/courses");
        return;
      }

      setResult(res.data?.data);
    } catch (err) {
      alert("Result not found");
      router.push("/user/courses");
    }
  };
  if (!result) {
    return <div className="p-10 text-center font-bold">Loading result...</div>;
  }

  if (result.status === "PENDING_CHECK") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mb-4 text-5xl">⏳</div>

          <h1 className="text-2xl font-black text-gray-900">Result Pending</h1>

          <p className="mt-3 text-gray-600">
            Your exam has been submitted successfully.
          </p>

          <p className="mt-2 text-gray-600">
            Essay answers are pending admin review. Your final result will be
            available once the evaluation is completed.
          </p>

          <button
            onClick={() => router.push("/user/exams/examlist")}
            className="mt-6 rounded-2xl bg-purple-700 px-6 py-3 font-bold text-white hover:bg-purple-800"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const percentage = Math.round(
    (Number(result.obtainedMarks) / Number(result.totalMarks)) * 100,
  );

  const passed = result.status === "passed" || result.status === "PASS";

  const questions = result.questions || [];

  const canTryAgain = result.canTryAgain;
  const remainingAttempts = Number(result.remainingAttempts || 0);
  const maxAttempts = Number(result.maxAttempts || 1);
  const usedAttempts = Number(result.usedAttempts || 0);

  const handleTryAgain = async () => {
    try {
      const service = examApi.startExam;

      const req = {
        method: "POST",
        data: {
          examId: result.examId,
        },
      };

      const res = await apiRequest(service, req);

      if (!res.success) {
        alert(res.message || "Unable to start exam again");
        return;
      }

      const newAttemptId = res.data?.attemptId || res.data?.data?.attemptId;

      router.push(
        `/user/exams/${result.examId}/attempt?attemptId=${newAttemptId}`,
      );
    } catch (err) {
      alert("Unable to start exam again");
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mb-6 flex justify-start">
            <button
              onClick={() => router.push("/user/exams/examlist")}
              className="inline-flex items-center gap-2 rounded-2xl bg-purple-700 px-4 py-2 font-bold text-white hover:bg-purple-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>

          <div
            className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full text-4xl font-black ${
              passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {percentage}%
          </div>

          <h1 className="mt-6 text-4xl font-black text-gray-900">
            {passed ? "Congratulations!" : "Try Again"}
          </h1>

          <p className="mt-2 text-gray-600">{result.examTitle}</p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <ScoreBox label="Total Marks" value={result.totalMarks} />
            <ScoreBox label="Obtained" value={result.obtainedMarks} />
            <ScoreBox label="Status" value={passed ? "Passed" : "Failed"} />
          </div>
        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="mb-5 text-2xl font-black text-gray-900">
            Question Result
          </h2>

          {questions.length === 0 ? (
            <p className="text-sm font-bold text-gray-500">
              No question result found.
            </p>
          ) : (
            <div className="space-y-4">
              {questions.map((q, index) => (
                <QuestionResultCard
                  key={q.questionId || index}
                  q={q}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {!passed && (
            <div className="rounded-2xl bg-yellow-50 px-5 py-3 text-sm font-bold text-yellow-700">
              Attempts: {usedAttempts}/{maxAttempts} used — {remainingAttempts}{" "}
              remaining
            </div>
          )}

          {canTryAgain && (
            <button
              onClick={handleTryAgain}
              className="rounded-2xl bg-green-600 px-8 py-3 font-bold text-white hover:bg-green-700"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionResultCard({ q, index }) {
  const userAnswer = formatAnswer(q.userAnswer);
  const correctAnswer = formatCorrectAnswers(q.correctAnswers);
  const isEssay = q.questionType === "essay";

  const essayPassed =
    Number(q.questionObtainedMarks || 0) >= Number(q.marks || 0) * 0.4;

  return (
    <div
      className={`rounded-2xl border p-5 ${
        isEssay
          ? essayPassed
            ? "border-green-200 bg-green-50"
            : "border-red-200 bg-red-50"
          : q.isCorrect
            ? "border-green-200 bg-green-50"
            : "border-red-200 bg-red-50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-black text-gray-900">
          Q{index + 1}. {q.questionText}
        </h3>

        <span
          className={`rounded-full px-3 py-1 text-xs font-black ${
            isEssay
              ? essayPassed
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
              : q.isCorrect
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
          }`}
        >
          {isEssay
            ? `${q.questionObtainedMarks}/${q.marks} Marks`
            : q.isCorrect
              ? "Correct"
              : "Wrong"}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <p>
          <span className="font-black text-gray-700">Your Answer: </span>
          <span className={q.isCorrect ? "text-green-700" : "text-red-700"}>
            {userAnswer || "Not answered"}
          </span>
        </p>

        {!q.isCorrect && (
          <p>
            <span className="font-black text-gray-700">Correct Answer: </span>
            <span className="font-black text-green-700">
              {correctAnswer || "Not available"}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

function formatAnswer(answer) {
  if (!answer) return "";

  if (Array.isArray(answer)) {
    return answer
      .map((item) =>
        typeof item === "object" ? item.answer || item.value || "" : item,
      )
      .join(", ");
  }

  if (typeof answer === "object") {
    return answer.answer || answer.value || JSON.stringify(answer);
  }

  return answer;
}

function formatCorrectAnswers(correctAnswers) {
  if (!correctAnswers) return "";

  if (Array.isArray(correctAnswers)) {
    return correctAnswers
      .map((item) =>
        typeof item === "object" ? item.answer || item.value || "" : item,
      )
      .join(", ");
  }

  return String(correctAnswers);
}

function ScoreBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-sm font-bold text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-gray-900">{value}</p>
    </div>
  );
}
