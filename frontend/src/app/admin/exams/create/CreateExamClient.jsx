"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_URL from "@/config/api";
import {
  CheckCircle,
  CircleDot,
  FileText,
  ListChecks,
  Grip,
  ChevronDown,
  Plus,
  X,
} from "lucide-react";

const questionTypes = [
  {
    key: "multiple",
    title: "Multiple Choice",
    desc: "Students can select more than one answer.",
    icon: ListChecks,
  },
  {
    key: "single",
    title: "Single Choice",
    desc: "Students can select only one answer.",
    icon: CircleDot,
  },
  {
    key: "essay",
    title: "Essay",
    desc: "Students can write a long answer.",
    icon: FileText,
  },
  {
    key: "dropdown_blank",
    title: "Dropdown Blanks",
    desc: "Use [] to create blanks with dropdown.",
    icon: ChevronDown,
  },
  {
    key: "drag_drop_blank",
    title: "Drag & Drop Blanks",
    desc: "Use [] to create draggable blank answers.",
    icon: Grip,
  },
];

const parseBlankQuestion = (text) => {
  const answers = [];
  let blankNo = 0;

  const displayText = text.replace(/\[(.*?)\]/g, (_, answer) => {
    blankNo++;

    answers.push({
      blankNo,
      answer: answer.trim(),
    });

    return `{{blank${blankNo}}}`;
  });

  return {
    questionText: text,
    displayText,
    correctAnswers: answers,
  };
};

const shuffleArray = (arr) => {
  return [...arr].sort(() => Math.random() - 0.5);
};

const normalizeText = (text = "") =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const stopWords = new Set([
  "the",
  "is",
  "are",
  "am",
  "a",
  "an",
  "and",
  "or",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "by",
  "as",
  "it",
  "this",
  "that",
  "has",
  "have",
  "be",
  "been",
  "was",
  "were",
  "from",
  "at",
  "which",
  "their",
  "will",
  "can",
  "also",
  "into",
  "such",
  "through",
  "about",
  "more",
  "its",
]);

const getKeywordsFromExpectedAnswer = (expectedAnswer = "") => {
  const words = normalizeText(expectedAnswer)
    .split(" ")
    .filter((word) => word.length >= 4 && !stopWords.has(word));

  return [...new Set(words)];
};

export default function CreateExamClient() {
  const [selectedType, setSelectedType] = useState("multiple");

  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  const [examId, setExamId] = useState(null);
  const [savingExam, setSavingExam] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [examDetailsSaved, setExamDetailsSaved] = useState(false);
  const [accessRulesSaved, setAccessRulesSaved] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [exams, setExams] = useState([]);

  const [examForm, setExamForm] = useState({
    examType: "course",
    courseId: "",
    chId: "",
    examTitle: "",
    examDesc: "",
    publishMode: "manual",
    scheduledPublishAt: "",
    durationMinutes: 30,
    totalMarks: 0,
    passingMarks: 0,
    maxAttempts: 1,
    requireCompletion: 1,
    completionPercent: 100,
    accessType: "all_course_students",
    checkingType: 0,
    isPublished: 0,
  });

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionListType, setQuestionListType] = useState("all");

  const openAddQuestionModal = () => {
    setEditingQuestion(null);
    setSelectedType("multiple");
    setQuestionModalOpen(true);
  };

  const openEditQuestionModal = (question) => {
    setEditingQuestion(question);
    setSelectedType(question.questionType);
    setQuestionModalOpen(true);
  };

  const closeQuestionModal = () => {
    setQuestionModalOpen(false);
    setEditingQuestion(null);
  };

  const fetchExamQuestions = async () => {
    if (!examId) return;

    try {
      const res = await axios.get(`${API_URL}/exams/${examId}/questions`, {
        withCredentials: true,
      });

      setQuestions(res.data.data || []);
    } catch (err) {
      console.log("FETCH QUESTIONS ERROR:", err.response?.data || err);
    }
  };

  useEffect(() => {
    if (examId && currentStep === 3) {
      fetchExamQuestions();
    }
  }, [examId, currentStep]);

  useEffect(() => {
    fetchCoursesWithChapters();
    fetchStudents();
    fetchAdminExams();
  }, []);

  const fetchCoursesWithChapters = async () => {
    try {
      const res = await axios.get(`${API_URL}/courses/with-chapters`, {
        withCredentials: true,
      });

      setCourses(res.data.data || []);
    } catch (err) {
      console.log(err.response?.data || err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_URL}/students`, {
        withCredentials: true,
      });

      const list = Array.isArray(res.data) ? res.data : res.data.data || [];

      setStudents(
        list.map((student) => ({
          ...student,
          userId: Number(student.userId),
        })),
      );
    } catch (err) {
      console.log("FETCH STUDENTS ERROR:", err.response?.data || err);
    }
  };

  const selectedCourse = courses.find(
    (course) => String(course.courseId) === String(examForm.courseId),
  );

  const updateExamDetailsForm = (key, value) => {
    setExamDetailsSaved(false);

    setExamForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateAccessRulesForm = (key, value) => {
    setAccessRulesSaved(false);

    setExamForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleStudent = (userId) => {
    setAccessRulesSaved(false);

    const id = Number(userId);

    setSelectedStudents((prev) =>
      prev.includes(id)
        ? prev.filter((studentId) => studentId !== id)
        : [...prev, id],
    );
  };

  const checkDuplicateExam = () => {
    const existingExam = exams.find((exam) => {
      if (
        exam.examType === "course" &&
        examForm.examType === "course" &&
        Number(exam.courseId) === Number(examForm.courseId)
      ) {
        return true;
      }

      if (
        exam.examType === "chapter" &&
        examForm.examType === "chapter" &&
        Number(exam.courseId) === Number(examForm.courseId) &&
        Number(exam.chId) === Number(examForm.chId)
      ) {
        return true;
      }

      return false;
    });

    return existingExam;
  };

  const fetchAdminExams = async () => {
    try {
      const res = await axios.get(`${API_URL}/exams`, {
        withCredentials: true,
      });

      setExams(res.data.data || []);
    } catch (err) {
      console.log("FETCH EXAMS ERROR:", err.response?.data || err);
    }
  };

  const saveStepOneExamDetails = async () => {
    const duplicateExam = checkDuplicateExam();

    if (duplicateExam) {
      alert(
        examForm.examType === "course"
          ? "Course test already exists for this course."
          : "Chapter test already exists for this chapter.",
      );
      return;
    }

    if (!examForm.courseId) {
      alert("Please select course");
      return;
    }

    if (examForm.examType === "chapter" && !examForm.chId) {
      alert("Please select chapter");
      return;
    }

    if (!examForm.examTitle.trim()) {
      alert("Please enter exam title");
      return;
    }

    try {
      setSavingExam(true);

      const payload = {
        examType: examForm.examType,
        courseId: Number(examForm.courseId),
        chId: examForm.examType === "chapter" ? Number(examForm.chId) : null,
        examTitle: examForm.examTitle,
        examDesc: examForm.examDesc,

        publishMode:
          examForm.examType === "chapter" ? "manual" : examForm.publishMode,

        scheduledPublishAt:
          examForm.examType === "course" && examForm.publishMode === "scheduled"
            ? examForm.scheduledPublishAt
            : null,

        durationMinutes: Number(examForm.durationMinutes),
        totalMarks: Number(examForm.totalMarks),
        passingMarks: Number(examForm.passingMarks),
        maxAttempts: Number(examForm.maxAttempts),
        isPublished: Number(examForm.isPublished),
      };

      const res = await axios.post(`${API_URL}/exams/add`, payload, {
        withCredentials: true,
      });

      setExamId(res.data.examId);
      setExamDetailsSaved(true);
      setCurrentStep(2);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save exam details");
      console.log(err.response?.data || err);
    } finally {
      setSavingExam(false);
    }
  };

  const saveStepTwoAccessRules = async () => {
    if (!examId) {
      alert("Please save exam details first");
      return;
    }

    if (
      examForm.accessType === "specific_students" &&
      selectedStudents.length === 0
    ) {
      alert("Please select at least one student");
      return;
    }

    try {
      setSavingExam(true);

      const payload = {
        examId,
        requireCompletion: Number(examForm.requireCompletion),
        completionPercent: Number(examForm.completionPercent),
        accessType: examForm.accessType,
        checkingType: Number(examForm.checkingType),
        selectedStudents:
          examForm.accessType === "specific_students"
            ? selectedStudents.map(Number)
            : [],
      };

      await axios.post(`${API_URL}/exams/access-rules/update`, payload, {
        withCredentials: true,
      });

      setAccessRulesSaved(true);
      setCurrentStep(3);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save access rules");
      console.log(err.response?.data || err);
    } finally {
      setSavingExam(false);
    }
  };

  const publishExam = async () => {
    if (!examId) {
      alert("Please save exam first");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/exams/publish`,
        { examId },
        { withCredentials: true },
      );

      alert("Exam published successfully");

      setExamForm({
        examType: "course",
        courseId: "",
        chId: "",
        examTitle: "",
        examDesc: "",
        publishMode: "manual",
        scheduledPublishAt: "",
        durationMinutes: 30,
        totalMarks: 0,
        passingMarks: 0,
        maxAttempts: 1,
        requireCompletion: 1,
        completionPercent: 100,
        accessType: "all_course_students",
        checkingType: 0,
        isPublished: 0,
      });

      setExamId(null);
      setCurrentStep(1);
      setExamDetailsSaved(false);
      setAccessRulesSaved(false);
      setQuestions([]);
      setEditingQuestion(null);
      setSelectedStudents([]);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to publish exam");
    }
  };

  const questionPayload = {
    examId,
  };

  const allowedQuestionTypes =
    Number(examForm.checkingType) === 0
      ? questionTypes.filter((type) => type.key !== "essay")
      : questionTypes;

  const filteredQuestions =
    questionListType === "all"
      ? questions
      : questions.filter((q) => q.questionType === questionListType);

  const isScheduledExam =
    examForm.examType === "course" && examForm.publishMode === "scheduled";

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-purple-700 to-blue-700 p-8 text-white shadow-xl">
          <p className="text-sm font-bold uppercase tracking-wider text-purple-100">
            Admin Exam Management
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Create Course / Chapter Test
          </h1>

          <p className="mt-3 max-w-2xl text-purple-100">
            Create exam, set access rules, add questions and publish test.
          </p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <StepCard
            number="1"
            title="Exam Details"
            active={currentStep === 1}
          />
          <StepCard
            number="2"
            title="Access Rules"
            active={currentStep === 2}
          />
          <StepCard
            number="3"
            title="Add Questions"
            active={currentStep === 3}
          />
          <StepCard
            number="4"
            title="Publish Exam"
            active={currentStep === 4}
          />
        </div>

        {currentStep === 1 && (
          <div className="rounded-3xl bg-white p-6 shadow-lg">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-gray-900">
                  Exam Details
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Select course/chapter and configure exam information.
                </p>
              </div>

              {examId && (
                <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700">
                  Exam Saved #{examId}
                </span>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormSelect
                label="Exam Type"
                value={examForm.examType}
                onChange={(e) => {
                  const value = e.target.value;

                  setExamDetailsSaved(false);

                  setExamForm((prev) => ({
                    ...prev,
                    examType: value,
                    chId: "",
                    publishMode:
                      value === "chapter" ? "manual" : prev.publishMode,
                    scheduledPublishAt:
                      value === "chapter" ? "" : prev.scheduledPublishAt,
                  }));
                }}
              >
                <option value="course">Course Test</option>
                <option value="chapter">Chapter Test</option>
              </FormSelect>

              <FormSelect
                label="Select Course"
                value={examForm.courseId}
                onChange={(e) => {
                  updateExamDetailsForm("courseId", e.target.value);
                  updateExamDetailsForm("chId", "");
                }}
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course.courseId} value={course.courseId}>
                    {course.courseName}
                  </option>
                ))}
              </FormSelect>

              {examForm.examType === "chapter" && (
                <FormSelect
                  label="Select Chapter"
                  value={examForm.chId}
                  onChange={(e) =>
                    updateExamDetailsForm("chId", e.target.value)
                  }
                >
                  <option value="">Select Chapter</option>
                  {(selectedCourse?.chapters || []).map((chapter) => (
                    <option key={chapter.chId} value={chapter.chId}>
                      {chapter.chapterName || chapter.chName}
                    </option>
                  ))}
                </FormSelect>
              )}

              <FormInput
                label="Exam Title"
                value={examForm.examTitle}
                onChange={(e) =>
                  updateExamDetailsForm("examTitle", e.target.value)
                }
                placeholder="Final Certification Test"
              />

              {examForm.examType === "course" && (
                <>
                  <FormSelect
                    label="Publish Mode"
                    value={examForm.publishMode}
                    onChange={(e) =>
                      updateExamDetailsForm("publishMode", e.target.value)
                    }
                  >
                    <option value="manual">Manual Publish</option>
                    <option value="scheduled">Schedule Publish</option>
                  </FormSelect>

                  {examForm.publishMode === "scheduled" && (
                    <FormInput
                      label="Scheduled Publish Date & Time"
                      type="datetime-local"
                      value={examForm.scheduledPublishAt}
                      onChange={(e) =>
                        updateExamDetailsForm(
                          "scheduledPublishAt",
                          e.target.value,
                        )
                      }
                    />
                  )}
                </>
              )}

              <FormInput
                label="Duration Minutes"
                type="number"
                value={examForm.durationMinutes}
                onChange={(e) =>
                  updateExamDetailsForm("durationMinutes", e.target.value)
                }
              />

              <FormInput
                label="Total Marks"
                type="number"
                value={examForm.totalMarks}
                onChange={(e) =>
                  updateExamDetailsForm("totalMarks", e.target.value)
                }
              />

              <FormInput
                label="Passing Marks"
                type="number"
                value={examForm.passingMarks}
                onChange={(e) =>
                  updateExamDetailsForm("passingMarks", e.target.value)
                }
              />

              <FormInput
                label="Attempt Limit"
                type="number"
                value={examForm.maxAttempts}
                onChange={(e) =>
                  updateExamDetailsForm("maxAttempts", e.target.value)
                }
              />

              <FormSelect
                label="Publish Status"
                value={examForm.isPublished}
                onChange={(e) =>
                  updateExamDetailsForm("isPublished", e.target.value)
                }
              >
                <option value={0}>Draft</option>
                <option value={1}>Published</option>
              </FormSelect>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Exam Description
              </label>
              <textarea
                rows={3}
                value={examForm.examDesc}
                onChange={(e) =>
                  updateExamDetailsForm("examDesc", e.target.value)
                }
                placeholder="Enter exam description..."
                className="w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-purple-500"
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (examDetailsSaved && examId) {
                    setCurrentStep(2);
                  } else {
                    saveStepOneExamDetails();
                  }
                }}
                disabled={savingExam}
                className="rounded-2xl bg-purple-700 px-6 py-3 text-sm font-bold text-white hover:bg-purple-800 disabled:opacity-60"
              >
                {savingExam
                  ? "Saving..."
                  : examDetailsSaved
                    ? "Next"
                    : "Save & Next"}
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-xl font-black text-gray-900">
                  Completion Criteria
                </h2>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormSelect
                    label="Require Completion?"
                    value={examForm.requireCompletion}
                    onChange={(e) =>
                      updateAccessRulesForm("requireCompletion", e.target.value)
                    }
                  >
                    <option value={1}>Yes</option>
                    <option value={0}>No</option>
                  </FormSelect>

                  <FormInput
                    label="Completion Percent"
                    type="number"
                    value={examForm.completionPercent}
                    onChange={(e) =>
                      updateAccessRulesForm("completionPercent", e.target.value)
                    }
                  />

                  <FormSelect
                    label="Select Checking Type"
                    value={examForm.checkingType}
                    onChange={(e) =>
                      updateAccessRulesForm("checkingType", e.target.value)
                    }
                  >
                    <option value={0}>Auto</option>
                    <option value={1}>Manual</option>
                  </FormSelect>
                </div>

                <p className="mt-3 rounded-2xl bg-purple-50 p-4 text-sm text-purple-700">
                  If enabled, student can start test only after completing
                  selected course/chapter progress.
                </p>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-xl font-black text-gray-900">
                  Access Rules
                </h2>

                <FormSelect
                  label="Who can attempt?"
                  value={examForm.accessType}
                  onChange={(e) => {
                    updateAccessRulesForm("accessType", e.target.value);

                    if (e.target.value === "all_course_students") {
                      setSelectedStudents([]);
                    }
                  }}
                >
                  <option value="all_course_students">
                    All Course Students
                  </option>
                  <option value="specific_students">Specific Students</option>
                </FormSelect>

                {examForm.accessType === "specific_students" && (
                  <div className="mt-4 max-h-64 space-y-3 overflow-y-auto rounded-2xl border border-gray-200 p-4">
                    {students.length === 0 ? (
                      <p className="text-sm font-bold text-red-500">
                        No students found
                      </p>
                    ) : (
                      students.map((student) => (
                        <label
                          key={student.userId}
                          className="flex cursor-pointer items-center gap-3 rounded-xl p-3 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(
                              Number(student.userId),
                            )}
                            onChange={() => toggleStudent(student.userId)}
                            className="h-5 w-5"
                          />

                          <div>
                            <p className="font-bold text-gray-800">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {student.email}
                            </p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="rounded-2xl bg-gray-200 px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-300"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => {
                  if (accessRulesSaved) {
                    setCurrentStep(3);
                  } else {
                    saveStepTwoAccessRules();
                  }
                }}
                disabled={savingExam}
                className="rounded-2xl bg-purple-700 px-6 py-3 text-sm font-bold text-white hover:bg-purple-800 disabled:opacity-60"
              >
                {savingExam
                  ? "Saving..."
                  : accessRulesSaved
                    ? "Next"
                    : "Save & Next"}
              </button>
            </div>
          </>
        )}

        {currentStep === 3 && (
          <>
            {!examId ? (
              <div className="rounded-3xl border border-dashed border-purple-300 bg-purple-50 p-8 text-center">
                <h3 className="text-xl font-black text-purple-800">
                  Save exam first
                </h3>
                <p className="mt-2 text-purple-600">
                  After saving exam details, you can add questions.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={openAddQuestionModal}
                    className="rounded-2xl bg-purple-700 px-5 py-3 font-bold text-white hover:bg-purple-800"
                  >
                    Add Question
                  </button>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-lg">
                  <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-black text-gray-900">
                        Added Questions
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Showing {filteredQuestions.length} of {questions.length}{" "}
                        questions
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setQuestionListType("all")}
                        className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                          questionListType === "all"
                            ? "border-purple-600 bg-purple-700 text-white shadow-md"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        All
                      </button>

                      {allowedQuestionTypes.map((type) => {
                        const Icon = type.icon;
                        const active = questionListType === type.key;

                        return (
                          <button
                            type="button"
                            key={type.key}
                            onClick={() => setQuestionListType(type.key)}
                            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition ${
                              active
                                ? "border-purple-600 bg-purple-700 text-white shadow-md"
                                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {type.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {filteredQuestions.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No questions found for selected type.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {filteredQuestions.map((q, index) => (
                        <div
                          key={q.questionId}
                          className="rounded-2xl border border-gray-200 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-black text-purple-700">
                                Q{index + 1}. {q.questionType} — {q.marks} Marks
                              </p>

                              <h3 className="mt-1 font-bold text-gray-900">
                                {q.questionText}
                              </h3>

                              {q.options?.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {q.options.map((opt, i) => {
                                    const isCorrect = q.correctAnswers?.some(
                                      (ans) =>
                                        ans.answer === opt ||
                                        Number(ans.optionIndex) === i,
                                    );

                                    return (
                                      <span
                                        key={i}
                                        className={`rounded-xl px-3 py-2 text-sm font-bold ${
                                          isCorrect
                                            ? "bg-green-100 text-green-700 ring-2 ring-green-300"
                                            : "bg-gray-100 text-gray-700"
                                        }`}
                                      >
                                        {opt}
                                        {isCorrect && " ✓"}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}

                              {q.questionType === "essay" &&
                                q.correctAnswers?.[0]?.answer && (
                                  <div className="mt-3 space-y-3">
                                    <div className="rounded-xl bg-green-50 p-3 text-sm font-bold text-green-700">
                                      Expected Answer:{" "}
                                      {q.correctAnswers[0].answer}
                                    </div>

                                    {q.correctAnswers[0]?.keywords?.length >
                                      0 && (
                                      <div className="rounded-xl bg-purple-50 p-3">
                                        <p className="mb-2 text-sm font-black text-purple-700">
                                          Auto Checking Keywords
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                          {q.correctAnswers[0].keywords.map(
                                            (word) => (
                                              <span
                                                key={word}
                                                className="rounded-lg bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700"
                                              >
                                                {word}
                                              </span>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                              {(q.questionType === "dropdown_blank" ||
                                q.questionType === "drag_drop_blank") &&
                                q.correctAnswers?.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {q.correctAnswers.map((ans) => (
                                      <span
                                        key={ans.blankNo}
                                        className="rounded-xl bg-green-100 px-3 py-2 text-sm font-bold text-green-700 ring-2 ring-green-300"
                                      >
                                        Blank {ans.blankNo}: {ans.answer} ✓
                                      </span>
                                    ))}
                                  </div>
                                )}
                            </div>

                            <button
                              type="button"
                              onClick={() => openEditQuestionModal(q)}
                              className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {questionModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
                      <div className="mb-6 flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-black text-gray-900">
                            {editingQuestion ? "Edit Question" : "Add Question"}
                          </h2>
                          <p className="mt-1 text-sm text-gray-500">
                            Select question type and fill question details.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={closeQuestionModal}
                          className="rounded-xl bg-gray-100 px-4 py-2 font-bold text-gray-700 hover:bg-gray-200"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="mb-6 rounded-3xl border border-gray-200 bg-slate-50 p-5">
                        <label className="mb-2 block text-sm font-bold text-gray-700">
                          Question Type
                        </label>

                        <select
                          value={selectedType}
                          disabled={!!editingQuestion}
                          onChange={(e) => setSelectedType(e.target.value)}
                          className="w-full rounded-2xl border border-gray-200 bg-white p-4 font-bold text-gray-800 outline-none focus:border-purple-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                        >
                          {allowedQuestionTypes.map((item) => (
                            <option key={item.key} value={item.key}>
                              {item.title}
                            </option>
                          ))}
                        </select>

                        {editingQuestion && (
                          <p className="mt-2 text-sm font-semibold text-orange-600">
                            Question type cannot be changed while editing.
                          </p>
                        )}
                      </div>

                      <div className="rounded-3xl bg-white p-6 shadow-lg">
                        {selectedType === "multiple" && (
                          <MultipleChoiceForm
                            basePayload={questionPayload}
                            editingQuestion={editingQuestion}
                            setEditingQuestion={setEditingQuestion}
                            fetchExamQuestions={fetchExamQuestions}
                            onSuccess={closeQuestionModal}
                          />
                        )}

                        {selectedType === "single" && (
                          <SingleChoiceForm
                            basePayload={questionPayload}
                            editingQuestion={editingQuestion}
                            setEditingQuestion={setEditingQuestion}
                            fetchExamQuestions={fetchExamQuestions}
                            onSuccess={closeQuestionModal}
                          />
                        )}

                        {Number(examForm.checkingType) === 1 &&
                          selectedType === "essay" && (
                            <EssayForm
                              basePayload={questionPayload}
                              editingQuestion={editingQuestion}
                              setEditingQuestion={setEditingQuestion}
                              fetchExamQuestions={fetchExamQuestions}
                              onSuccess={closeQuestionModal}
                            />
                          )}

                        {selectedType === "dropdown_blank" && (
                          <BlankQuestionForm
                            type="dropdown_blank"
                            basePayload={questionPayload}
                            editingQuestion={editingQuestion}
                            setEditingQuestion={setEditingQuestion}
                            fetchExamQuestions={fetchExamQuestions}
                            onSuccess={closeQuestionModal}
                          />
                        )}

                        {selectedType === "drag_drop_blank" && (
                          <BlankQuestionForm
                            type="drag_drop_blank"
                            basePayload={questionPayload}
                            editingQuestion={editingQuestion}
                            setEditingQuestion={setEditingQuestion}
                            fetchExamQuestions={fetchExamQuestions}
                            onSuccess={closeQuestionModal}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="rounded-2xl bg-gray-200 px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-300"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                disabled={!examId}
                className="rounded-2xl bg-purple-700 px-6 py-3 text-sm font-bold text-white hover:bg-purple-800 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}

        {currentStep === 4 && (
          <div className="rounded-3xl bg-white p-8 shadow-lg">
            <h2 className="text-2xl font-black text-gray-900">
              {isScheduledExam ? "Schedule Exam" : "Publish Exam"}
            </h2>

            <p className="mt-2 text-gray-500">
              {isScheduledExam
                ? "Review your exam. It will publish automatically on the scheduled date and time."
                : "Review your exam and publish it for students."}
            </p>

            {examId && (
              <div className="mt-5 rounded-2xl bg-green-50 p-5 text-green-700">
                <p className="font-black">Exam Saved #{examId}</p>
                <p className="mt-1 text-sm">You can now publish this exam.</p>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="rounded-2xl bg-gray-200 px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-300"
              >
                Previous
              </button>

              {isScheduledExam ? (
                <button
                  type="button"
                  onClick={() => {
                    alert("Exam scheduled successfully");
                    setExamForm({
                      examType: "course",
                      courseId: "",
                      chId: "",
                      examTitle: "",
                      examDesc: "",
                      publishMode: "manual",
                      scheduledPublishAt: "",
                      durationMinutes: 30,
                      totalMarks: 0,
                      passingMarks: 0,
                      maxAttempts: 1,
                      requireCompletion: 1,
                      completionPercent: 100,
                      accessType: "all_course_students",
                      isPublished: 0,
                    });

                    setExamId(null);
                    setCurrentStep(1);
                    setExamDetailsSaved(false);
                    setAccessRulesSaved(false);
                    setQuestions([]);
                    setEditingQuestion(null);
                    setSelectedStudents([]);
                  }}
                  disabled={!examId}
                  className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Finish Scheduling
                </button>
              ) : (
                <button
                  type="button"
                  onClick={publishExam}
                  disabled={!examId}
                  className="rounded-2xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Publish Exam
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MultipleChoiceForm({
  basePayload,
  editingQuestion,
  setEditingQuestion,
  fetchExamQuestions,
  onSuccess,
}) {
  const [question, setQuestion] = useState("");
  const [marks, setMarks] = useState(1);
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState([]);

  useEffect(() => {
    if (editingQuestion?.questionType === "multiple") {
      setQuestion(editingQuestion.questionText || "");
      setMarks(editingQuestion.marks || 1);
      setOptions(
        editingQuestion.options?.length
          ? editingQuestion.options
          : ["", "", "", ""],
      );
      setCorrect(
        editingQuestion.correctAnswers?.map((item) =>
          Number(item.optionIndex),
        ) || [],
      );
    }
  }, [editingQuestion]);

  const toggleCorrect = (index) => {
    setCorrect((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const handleSave = async () => {
    if (!basePayload.examId) return alert("Please save exam first");
    if (!question.trim()) return alert("Please enter question");

    const validOptions = options.filter((opt) => opt.trim());

    if (validOptions.length < 2) {
      return alert("Please add at least 2 options");
    }

    if (correct.length === 0) {
      return alert("Please select correct answer");
    }

    try {
      const payload = {
        examId: basePayload.examId,
        questionId: editingQuestion?.questionId,
        questionType: "multiple",
        questionText: question,
        displayText: question,
        options: validOptions,
        correctAnswers: correct.map((index) => ({
          optionIndex: index,
          answer: options[index],
        })),
        marks: Number(marks) || 1,
      };

      const url =
        editingQuestion?.questionType === "multiple"
          ? `${API_URL}/exams/questions/update`
          : `${API_URL}/exams/questions/add`;

      await axios.post(url, payload, {
        withCredentials: true,
      });

      setQuestion("");
      setMarks(1);
      setOptions(["", "", "", ""]);
      setCorrect([]);
      setEditingQuestion(null);
      fetchExamQuestions();
      onSuccess?.();

      alert(editingQuestion ? "Question updated" : "Question saved");
    } catch (err) {
      console.log("SAVE MULTIPLE QUESTION ERROR:", err.response?.data || err);
      alert(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to save question",
      );
    }
  };

  return (
    <QuestionShell
      title={
        editingQuestion?.questionType === "multiple"
          ? "Edit Multiple Choice Question"
          : "Multiple Choice Question"
      }
      onSave={handleSave}
    >
      <QuestionInput question={question} setQuestion={setQuestion} />
      <MarksInput marks={marks} setMarks={setMarks} />

      <OptionEditor
        options={options}
        setOptions={setOptions}
        type="checkbox"
        correct={correct}
        onCorrectChange={toggleCorrect}
      />
    </QuestionShell>
  );
}

function SingleChoiceForm({
  basePayload,
  editingQuestion,
  setEditingQuestion,
  fetchExamQuestions,
  onSuccess,
}) {
  const [question, setQuestion] = useState("");
  const [marks, setMarks] = useState(1);
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(null);

  useEffect(() => {
    if (editingQuestion?.questionType === "single") {
      setQuestion(editingQuestion.questionText || "");
      setMarks(editingQuestion.marks || 1);
      setOptions(
        editingQuestion.options?.length
          ? editingQuestion.options
          : ["", "", "", ""],
      );
      setCorrect(
        editingQuestion.correctAnswers?.length
          ? Number(editingQuestion.correctAnswers[0].optionIndex)
          : null,
      );
    }
  }, [editingQuestion]);

  const handleSave = async () => {
    if (!basePayload.examId) return alert("Please save exam first");
    if (!question.trim()) return alert("Please enter question");

    const validOptions = options.filter((opt) => opt.trim());

    if (validOptions.length < 2) {
      return alert("Please add at least 2 options");
    }

    if (correct === null) {
      return alert("Please select correct answer");
    }

    try {
      const payload = {
        examId: basePayload.examId,
        questionId: editingQuestion?.questionId,
        questionType: "single",
        questionText: question,
        displayText: question,
        options: validOptions,
        correctAnswers: [
          {
            optionIndex: correct,
            answer: options[correct],
          },
        ],
        marks: Number(marks) || 1,
      };

      const url =
        editingQuestion?.questionType === "single"
          ? `${API_URL}/exams/questions/update`
          : `${API_URL}/exams/questions/add`;

      await axios.post(url, payload, {
        withCredentials: true,
      });

      setQuestion("");
      setMarks(1);
      setOptions(["", "", "", ""]);
      setCorrect(null);
      setEditingQuestion(null);
      fetchExamQuestions();
      onSuccess?.();

      alert(editingQuestion ? "Question updated" : "Question saved");
    } catch (err) {
      console.log("SAVE SINGLE QUESTION ERROR:", err.response?.data || err);
      alert(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to save question",
      );
    }
  };

  return (
    <QuestionShell
      title={
        editingQuestion?.questionType === "single"
          ? "Edit Single Choice Question"
          : "Single Choice Question"
      }
      onSave={handleSave}
    >
      <QuestionInput question={question} setQuestion={setQuestion} />
      <MarksInput marks={marks} setMarks={setMarks} />

      <OptionEditor
        options={options}
        setOptions={setOptions}
        type="radio"
        correct={correct}
        onCorrectChange={setCorrect}
      />
    </QuestionShell>
  );
}

function EssayForm({
  basePayload,
  editingQuestion,
  setEditingQuestion,
  fetchExamQuestions,
  onSuccess,
}) {
  const [question, setQuestion] = useState("");
  const [marks, setMarks] = useState(1);
  const [expectedAnswer, setExpectedAnswer] = useState("");

  const generatedKeywords = useMemo(() => {
    return getKeywordsFromExpectedAnswer(expectedAnswer);
  }, [expectedAnswer]);

  useEffect(() => {
    if (editingQuestion?.questionType === "essay") {
      setQuestion(editingQuestion.questionText || "");
      setMarks(editingQuestion.marks || 1);
      setExpectedAnswer(editingQuestion.correctAnswers?.[0]?.answer || "");
    }
  }, [editingQuestion]);

  const handleSave = async () => {
    if (!basePayload.examId) return alert("Please save exam first");
    if (!question.trim()) return alert("Please enter question");
    if (!expectedAnswer.trim()) return alert("Please enter expected answer");

    try {
      const payload = {
        examId: basePayload.examId,
        questionId: editingQuestion?.questionId,
        questionType: "essay",
        questionText: question,
        displayText: question,
        options: [],
        correctAnswers: [
          {
            answer: expectedAnswer,
            checkingType: "auto",
            keywords: generatedKeywords,
          },
        ],
        marks: Number(marks) || 1,
      };

      const url =
        editingQuestion?.questionType === "essay"
          ? `${API_URL}/exams/questions/update`
          : `${API_URL}/exams/questions/add`;

      await axios.post(url, payload, {
        withCredentials: true,
      });

      setQuestion("");
      setMarks(1);
      setExpectedAnswer("");
      setEditingQuestion(null);
      fetchExamQuestions();
      onSuccess?.();

      alert(editingQuestion ? "Question updated" : "Question saved");
    } catch (err) {
      console.log("SAVE ESSAY QUESTION ERROR:", err.response?.data || err);
      alert(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to save question",
      );
    }
  };

  return (
    <QuestionShell
      title={
        editingQuestion?.questionType === "essay"
          ? "Edit Essay Question"
          : "Essay Question"
      }
      onSave={handleSave}
    >
      <QuestionInput
        label="Essay Question"
        question={question}
        setQuestion={setQuestion}
      />

      <MarksInput marks={marks} setMarks={setMarks} />

      <div>
        <label className="mb-2 block text-sm font-bold text-gray-700">
          Sample / Expected Answer
        </label>

        <textarea
          rows={6}
          value={expectedAnswer}
          onChange={(e) => setExpectedAnswer(e.target.value)}
          placeholder="Write expected answer. System will auto-generate keywords for backend checking."
          className="w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-purple-500"
        />
      </div>

      <PreviewBox>
        <h3 className="mb-3 text-lg font-black text-gray-900">
          Auto Generated Checking Keywords
        </h3>

        {generatedKeywords.length === 0 ? (
          <p className="text-sm font-semibold text-gray-500">
            Keywords will appear after writing expected answer.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {generatedKeywords.map((word) => (
              <span
                key={word}
                className="rounded-xl bg-purple-100 px-3 py-2 text-sm font-bold text-purple-700"
              >
                {word}
              </span>
            ))}
          </div>
        )}

        <p className="mt-4 text-sm font-bold text-gray-600">
          Total Keywords: {generatedKeywords.length}
        </p>
      </PreviewBox>
    </QuestionShell>
  );
}

function BlankQuestionForm({
  type,
  basePayload,
  editingQuestion,
  setEditingQuestion,
  fetchExamQuestions,
  onSuccess,
}) {
  const [question, setQuestion] = useState("");
  const [marks, setMarks] = useState(1);

  useEffect(() => {
    if (editingQuestion?.questionType === type) {
      setQuestion(editingQuestion.questionText || "");
      setMarks(editingQuestion.marks || 1);
    }
  }, [editingQuestion, type]);

  const parsed = useMemo(() => parseBlankQuestion(question), [question]);

  const randomWords = useMemo(() => {
    return shuffleArray(parsed.correctAnswers.map((item) => item.answer));
  }, [parsed.correctAnswers]);

  const handleSave = async () => {
    if (!basePayload.examId) return alert("Please save exam first");
    if (!question.trim()) return alert("Please enter question");

    if (parsed.correctAnswers.length === 0) {
      return alert("Please add at least one blank using []");
    }

    try {
      const payload = {
        examId: basePayload.examId,
        questionId: editingQuestion?.questionId,
        questionType: type,
        questionText: parsed.questionText,
        displayText: parsed.displayText,
        options: randomWords,
        correctAnswers: parsed.correctAnswers,
        marks: Number(marks) || 1,
      };

      const url =
        editingQuestion?.questionType === type
          ? `${API_URL}/exams/questions/update`
          : `${API_URL}/exams/questions/add`;

      await axios.post(url, payload, {
        withCredentials: true,
      });

      setQuestion("");
      setMarks(1);
      setEditingQuestion(null);
      fetchExamQuestions();
      onSuccess?.();

      alert(editingQuestion ? "Question updated" : "Question saved");
    } catch (err) {
      console.log("SAVE BLANK QUESTION ERROR:", err.response?.data || err);
      alert(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to save question",
      );
    }
  };

  return (
    <QuestionShell
      title={
        editingQuestion?.questionType === type
          ? type === "dropdown_blank"
            ? "Edit Dropdown Fill in the Blanks"
            : "Edit Drag & Drop Fill in the Blanks"
          : type === "dropdown_blank"
            ? "Dropdown Fill in the Blanks"
            : "Drag & Drop Fill in the Blanks"
      }
      onSave={handleSave}
    >
      <div>
        <label className="mb-2 block text-sm font-bold text-gray-700">
          Write Question
        </label>

        <textarea
          rows={5}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Example: Blockchain is a decentralized [ledger] that stores data in [blocks]."
          className="w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-purple-500"
        />

        <p className="mt-2 text-sm text-gray-500">
          Put correct answers inside square brackets []. Sequence is compulsory.
        </p>
      </div>

      <MarksInput marks={marks} setMarks={setMarks} />

      <PreviewBox>
        <BlankPreview
          type={type}
          displayText={parsed.displayText}
          answers={parsed.correctAnswers}
        />
      </PreviewBox>
    </QuestionShell>
  );
}

function BlankPreview({ type, displayText, answers }) {
  const [filledBlanks, setFilledBlanks] = useState({});

  if (!displayText) {
    return (
      <p className="text-gray-500">
        Preview will appear here after writing question...
      </p>
    );
  }

  const parts = displayText.split(/({{blank\d+}})/g);

  const handleDrop = (e, blankNo) => {
    e.preventDefault();
    const answer = e.dataTransfer.getData("text/plain");

    setFilledBlanks((prev) => ({
      ...prev,
      [blankNo]: answer,
    }));
  };

  return (
    <div>
      <p className="text-lg leading-10 text-gray-800">
        {parts.map((part, index) => {
          const match = part.match(/{{blank(\d+)}}/);

          if (!match) return <span key={index}>{part}</span>;

          const blankNo = Number(match[1]);

          if (type === "dropdown_blank") {
            return (
              <select
                key={index}
                className="mx-1 rounded-xl border border-purple-300 bg-purple-50 px-3 py-2 font-bold text-purple-700"
              >
                <option>Blank {blankNo}</option>
                {answers.map((item) => (
                  <option key={item.blankNo}>{item.answer}</option>
                ))}
              </select>
            );
          }

          return (
            <span
              key={index}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, blankNo)}
              className="mx-1 inline-flex min-h-11 min-w-36 items-center justify-center rounded-xl border-2 border-dashed border-purple-400 bg-purple-50 px-4 font-black text-purple-700"
            >
              {filledBlanks[blankNo] || `Drop Blank ${blankNo}`}
            </span>
          );
        })}
      </p>

      {type === "drag_drop_blank" && (
        <div className="mt-8 flex flex-wrap gap-3">
          {answers.map((item) => (
            <span
              key={item.blankNo}
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData("text/plain", item.answer)
              }
              className="cursor-grab rounded-xl bg-purple-700 px-5 py-3 text-sm font-black text-white shadow-md active:cursor-grabbing"
            >
              {item.answer}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionInput({ label = "Question", question, setQuestion }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-700">
        {label}
      </label>

      <textarea
        rows={3}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Enter your question here..."
        className="w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-purple-500"
      />
    </div>
  );
}

function MarksInput({ marks, setMarks }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-700">
        Marks
      </label>

      <input
        type="text"
        min="1"
        value={marks}
        onChange={(e) => setMarks(e.target.value)}
        className="w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-purple-500"
      />
    </div>
  );
}

function OptionEditor({ options, setOptions, type, correct, onCorrectChange }) {
  const addOption = () => setOptions([...options, ""]);

  const removeOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index, value) => {
    const copy = [...options];
    copy[index] = value;
    setOptions(copy);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-bold text-gray-700">Options</label>

        <button
          type="button"
          onClick={addOption}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-700 text-white hover:bg-purple-800"
          title="Add Option"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-3">
          <input
            type={type}
            checked={
              type === "checkbox" ? correct.includes(index) : correct === index
            }
            onChange={() => onCorrectChange(index)}
            className="h-5 w-5"
          />

          <input
            value={option}
            onChange={(e) => updateOption(index, e.target.value)}
            placeholder={`Option ${index + 1}`}
            className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500"
          />

          <button
            type="button"
            onClick={() => removeOption(index)}
            className="rounded-xl bg-red-50 p-3 text-red-600 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function QuestionShell({ title, children, onSave }) {
  return (
    <div>
      <div className="mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">
            Build question and save it into database.
          </p>
        </div>
      </div>

      <div className="space-y-6">{children}</div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4" />
          Save Question
        </button>
      </div>
    </div>
  );
}

function PreviewBox({ children }) {
  return (
    <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-white to-purple-50 p-6 shadow-inner">
      <p className="mb-4 text-sm font-black uppercase tracking-wider text-purple-700">
        Live Preview
      </p>

      {children}
    </div>
  );
}

function StepCard({ number, title, active }) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        active ? "border-purple-300 bg-purple-50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${
            active ? "bg-purple-700 text-white" : "bg-gray-200 text-gray-600"
          }`}
        >
          {number}
        </span>
        <p className="font-black text-gray-900">{title}</p>
      </div>
    </div>
  );
}

function FormInput({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-700">
        {label}
      </label>

      <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-purple-500"
      />
    </div>
  );
}

function FormSelect({ label, value, onChange, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-700">
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-purple-500"
      >
        {children}
      </select>
    </div>
  );
}
