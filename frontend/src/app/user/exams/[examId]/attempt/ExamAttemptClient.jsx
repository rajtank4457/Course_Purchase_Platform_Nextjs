"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import API_URL from "@/config/api";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

export default function ExamAttemptClient() {
  const { examId } = useParams();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");
  const router = useRouter();

  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    fetchExamQuestions();
  }, []);

  const fetchExamQuestions = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/exams/${examId}/attempt?attemptId=${attemptId}`,
        { withCredentials: true },
      );

      console.log("EXAM QUESTIONS:", res.data.data);

      setExam(res.data.data);
      const durationMinutes = Number(res.data.data.durationMinutes || 0);
      setTimeLeft(durationMinutes * 60);
    } catch (err) {
      alert(err.response?.data?.message || "Cannot load exam");
      router.push("/user/courses");
    }
  };

  const questions = useMemo(() => {
    return exam?.questions || [];
  }, [exam]);

  const currentQuestion = questions[currentIndex];

  const totalQuestions = questions.length;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;

  const answeredCount = Object.keys(answers).filter((key) => {
    const value = answers[key];

    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && String(value).trim() !== "";
  }).length;

  const updateAnswer = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const goNext = () => {
    if (!isLast) {
      setCurrentIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goPrev = () => {
    if (!isFirst) {
      setCurrentIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!exam || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);

          if (!submittedRef.current) {
            submittedRef.current = true;
            submitExam(true);
          }

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, timeLeft]);

  const submitExam = async (autoSubmit = false) => {
    try {
      if (!autoSubmit) {
        const confirmSubmit = window.confirm(
          `You answered ${answeredCount}/${totalQuestions} questions. Submit exam?`,
        );

        if (!confirmSubmit) return;
      }
      setSubmitting(true);
      submittedRef.current = true;

      const res = await axios.post(
        `${API_URL}/exams/submit`,
        {
          attemptId,
          answers,
        },
        { withCredentials: true },
      );

      router.push(`/user/exams/result/${res.data.attemptId}`);
    } catch (err) {
      alert(err.response?.data?.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!exam) {
    return <div className="p-10 text-center font-bold">Loading exam...</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
          <h2 className="text-2xl font-black text-gray-900">
            No questions found
          </h2>
          <p className="mt-2 text-gray-500">
            Please contact admin. This exam has no active questions.
          </p>
          <button
            onClick={() => router.push("/user/courses")}
            className="mt-6 rounded-2xl bg-purple-700 px-6 py-3 font-bold text-white"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="sticky top-0 z-20 mb-6 rounded-3xl bg-white p-5 shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div
              className={`rounded-2xl px-5 py-3 text-center font-black ${
                timeLeft <= 60
                  ? "bg-red-100 text-red-700"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              Time Left: {formatTime(timeLeft)}
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">
                {exam.examTitle}
              </h1>

              <p className="text-sm text-gray-500">
                Question {currentIndex + 1} of {totalQuestions} • Answered{" "}
                {answeredCount}/{totalQuestions}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {questions.map((q, index) => {
                const answered = answers[q.questionId] !== undefined;

                return (
                  <button
                    key={q.questionId}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-9 w-9 rounded-full text-sm font-black ${
                      index === currentIndex
                        ? "bg-purple-700 text-white"
                        : answered
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-purple-700 transition-all"
              style={{
                width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
              }}
            />
          </div>
        </div>

        <QuestionBlock
          index={currentIndex}
          question={currentQuestion}
          value={answers[currentQuestion.questionId]}
          onChange={(value) => updateAnswer(currentQuestion.questionId, value)}
        />

        <div className="mt-6 flex items-center justify-between rounded-3xl bg-white p-5 shadow-lg">
          <button
            onClick={goPrev}
            disabled={isFirst}
            className="inline-flex items-center gap-2 rounded-2xl bg-gray-200 px-6 py-3 text-sm font-bold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>

          {!isLast ? (
            <button
              onClick={goNext}
              className="inline-flex items-center gap-2 rounded-2xl bg-purple-700 px-6 py-3 text-sm font-bold text-white hover:bg-purple-800"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={submitExam}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60"
            >
              <CheckCircle className="h-4 w-4" />
              {submitting ? "Submitting..." : "Submit Exam"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionBlock({ index, question, value, onChange }) {
  const options = question.options || [];

  return (
    <div className="rounded-3xl bg-white p-6 shadow-lg">
      <div className="mb-6 flex justify-between gap-4">
        <h2 className="text-xl font-black leading-8 text-gray-900">
          Q{index + 1}. {question.displayText || question.questionText}
        </h2>

        <span className="h-fit rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-700">
          {question.marks} Marks
        </span>
      </div>

      {question.questionType === "single" && (
        <div className="space-y-3">
          {options.map((opt, i) => (
            <label
              key={i}
              className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${
                value === opt
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name={`q-${question.questionId}`}
                checked={value === opt}
                onChange={() => onChange(opt)}
              />
              <span className="font-semibold text-gray-800">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {question.questionType === "multiple" && (
        <div className="space-y-3">
          {options.map((opt, i) => (
            <label
              key={i}
              className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${
                (value || []).includes(opt)
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                checked={(value || []).includes(opt)}
                onChange={() => {
                  const current = value || [];

                  onChange(
                    current.includes(opt)
                      ? current.filter((x) => x !== opt)
                      : [...current, opt],
                  );
                }}
              />
              <span className="font-semibold text-gray-800">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {question.questionType === "essay" && (
        <textarea
          rows={8}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your answer..."
          className="w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-purple-500"
        />
      )}

      {question.questionType === "dropdown_blank" && (
        <BlankAnswerQuestion
          question={question}
          value={value || []}
          onChange={onChange}
        />
      )}

      {question.questionType === "drag_drop_blank" && (
        <DragDropQuestion
          question={question}
          value={value || []}
          onChange={onChange}
        />
      )}
    </div>
  );
}

function BlankAnswerQuestion({ question, value, onChange }) {
  const options = question.options || [];
  const displayText = question.displayText || question.questionText;

  const parts = displayText.split(/({{blank\d+}})/g);

  const updateBlank = (blankIndex, selectedValue) => {
    const copy = [...value];
    copy[blankIndex] = selectedValue;
    onChange(copy);
  };

  return (
    <p className="text-lg font-semibold leading-10 text-gray-800">
      {parts.map((part, index) => {
        const match = part.match(/{{blank(\d+)}}/);

        if (!match) {
          return <span key={index}>{part}</span>;
        }

        const blankNo = Number(match[1]);
        const blankIndex = blankNo - 1;

        return (
          <select
            key={index}
            value={value[blankIndex] || ""}
            onChange={(e) => updateBlank(blankIndex, e.target.value)}
            className="mx-2 rounded-xl border border-purple-300 bg-purple-50 px-3 py-2 font-bold text-purple-700 outline-none"
          >
            <option value="">Blank {blankNo}</option>
            {options.map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      })}
    </p>
  );
}

function DragDropQuestion({ question, value, onChange }) {
  const options = question.options || [];
  const displayText = question.displayText || question.questionText;

  const parts = displayText.split(/({{blank\d+}})/g);

  const usedWords = value.filter(Boolean);

  const availableOptions = options.filter((word) => !usedWords.includes(word));

  const handleDrop = (blankIndex, word) => {
    const copy = [...value];

    // If same word already exists in another blank, remove it from there
    const existingIndex = copy.findIndex((item) => item === word);
    if (existingIndex !== -1) {
      copy[existingIndex] = "";
    }

    copy[blankIndex] = word;
    onChange(copy);
  };

  const removeBlankAnswer = (blankIndex) => {
    const copy = [...value];
    copy[blankIndex] = "";
    onChange(copy);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-black text-gray-600">
          Drag correct words into the blanks
        </p>

        <div className="flex min-h-16 flex-wrap gap-3 rounded-2xl border border-purple-100 bg-purple-50 p-4">
          {availableOptions.length === 0 ? (
            <p className="text-sm font-bold text-gray-500">
              All words are placed. Click on a filled blank to remove/change.
            </p>
          ) : (
            availableOptions.map((word, index) => (
              <div
                key={`${word}-${index}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", word);
                }}
                className="cursor-grab rounded-xl bg-purple-700 px-4 py-2 font-bold text-white shadow active:cursor-grabbing"
              >
                {word}
              </div>
            ))
          )}
        </div>
      </div>

      <p className="text-lg font-semibold leading-10 text-gray-800">
        {parts.map((part, index) => {
          const match = part.match(/{{blank(\d+)}}/);

          if (!match) {
            return <span key={index}>{part}</span>;
          }

          const blankNo = Number(match[1]);
          const blankIndex = blankNo - 1;
          const selectedWord = value[blankIndex];

          return (
            <span
              key={index}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();

                const word = e.dataTransfer.getData("text/plain");
                handleDrop(blankIndex, word);
              }}
              onClick={() => {
                if (selectedWord) {
                  removeBlankAnswer(blankIndex);
                }
              }}
              className={`mx-2 inline-flex min-h-12 min-w-36 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed px-4 font-bold ${
                selectedWord
                  ? "border-green-400 bg-green-50 text-green-700"
                  : "border-purple-400 bg-purple-50 text-purple-700"
              }`}
              title={
                selectedWord ? "Click to remove answer" : "Drop answer here"
              }
            >
              {selectedWord || `Blank ${blankNo}`}
            </span>
          );
        })}
      </p>
    </div>
  );
}
