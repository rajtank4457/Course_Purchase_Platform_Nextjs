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

// export default function CreateExamPage() {
//   const [selectedType, setSelectedType] = useState("multiple");

//   const [testScope, setTestScope] = useState("course");
//   const [courses, setCourses] = useState([]);
//   const [selectedCourseId, setSelectedCourseId] = useState("");
//   const [selectedChapterId, setSelectedChapterId] = useState("");

//   useEffect(() => {
//     fetchCoursesWithChapters();
//   }, []);

//   const fetchCoursesWithChapters = async () => {
//     try {
//       const res = await axios.get(`${API_URL}/courses/with-chapters`, {
//         withCredentials: true,
//       });

//       console.log("API DATA:", res.data.data);

//       setCourses(res.data.data || []);
//     } catch (err) {
//       console.log(err.response?.data || err);
//     }
//   };

//   const selectedCourse = courses.find(
//     (course) => String(course.courseId) === String(selectedCourseId)
//   );

//   const basePayload = {
//     examType: testScope,
//     courseId: selectedCourseId,
//     chId: testScope === "chapter" ? selectedChapterId : null,
//   };

//   return (
//     <div className="min-h-screen bg-slate-50 px-6 py-8">
//       <div className="mx-auto max-w-7xl">
//         <div className="mb-8 rounded-3xl bg-gradient-to-r from-purple-700 to-blue-700 p-8 text-white shadow-xl">
//           <p className="text-sm font-bold uppercase tracking-wider text-purple-100">
//             Admin Exam Builder
//           </p>

//           <h1 className="mt-2 text-4xl font-black">
//             Create Test / Exam Questions
//           </h1>

//           <p className="mt-3 max-w-2xl text-purple-100">
//             Create course-wise and chapter-wise tests.
//           </p>
//         </div>

//         <div className="mb-6 rounded-3xl bg-white p-6 shadow-lg">
//           <h2 className="mb-4 text-xl font-black text-gray-900">
//             Test Details
//           </h2>

//           <div className="grid gap-4 md:grid-cols-3">
//             <select
//               value={testScope}
//               onChange={(e) => {
//                 setTestScope(e.target.value);
//                 setSelectedChapterId("");
//               }}
//               className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-purple-500"
//             >
//               <option value="course">Course Wise Test</option>
//               <option value="chapter">Chapter Wise Test</option>
//             </select>

//             <select
//               value={selectedCourseId}
//               onChange={(e) => {
//                 setSelectedCourseId(e.target.value);
//                 setSelectedChapterId("");
//               }}
//               className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-purple-500"
//             >
//               <option value="">Select Course</option>

//               {courses.map((course) => (
//                 <option key={course.courseId} value={course.courseId}>
//                   {course.courseName}
//                 </option>
//               ))}
//             </select>

//             {testScope === "chapter" && (
//               <select
//                 value={selectedChapterId}
//                 onChange={(e) => setSelectedChapterId(e.target.value)}
//                 className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-purple-500"
//               >
//                 <option value="">Select Chapter</option>

//                 {(selectedCourse?.chapters || []).map((chapter) => (
//                   <option key={chapter.chId} value={chapter.chId}>
//                     {chapter.chapterName}
//                   </option>
//                 ))}
//               </select>
//             )}
//           </div>
//         </div>

//         <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
//           <div className="rounded-3xl bg-white p-5 shadow-lg">
//             <h2 className="mb-4 text-lg font-black text-gray-900">
//               Question Types
//             </h2>

//             <div className="space-y-3">
//               {questionTypes.map((item) => {
//                 const Icon = item.icon;
//                 const active = selectedType === item.key;

//                 return (
//                   <button
//                     type="button"
//                     key={item.key}
//                     onClick={() => setSelectedType(item.key)}
//                     className={`w-full rounded-2xl border p-4 text-left transition ${active
//                       ? "border-purple-500 bg-purple-50 shadow-md"
//                       : "border-gray-200 bg-white hover:bg-gray-50"
//                       }`}
//                   >
//                     <div className="flex gap-3">
//                       <div
//                         className={`flex h-11 w-11 items-center justify-center rounded-xl ${active
//                           ? "bg-purple-700 text-white"
//                           : "bg-gray-100 text-gray-700"
//                           }`}
//                       >
//                         <Icon className="h-5 w-5" />
//                       </div>

//                       <div>
//                         <h3 className="font-black text-gray-900">
//                           {item.title}
//                         </h3>
//                         <p className="mt-1 text-sm text-gray-500">
//                           {item.desc}
//                         </p>
//                       </div>
//                     </div>
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           <div className="rounded-3xl bg-white p-6 shadow-lg">
//             {selectedType === "multiple" && (
//               <MultipleChoiceForm basePayload={basePayload} />
//             )}

//             {selectedType === "single" && (
//               <SingleChoiceForm basePayload={basePayload} />
//             )}

//             {selectedType === "essay" && (
//               <EssayForm basePayload={basePayload} />
//             )}

//             {selectedType === "dropdown_blank" && (
//               <BlankQuestionForm
//                 type="dropdown_blank"
//                 basePayload={basePayload}
//               />
//             )}

//             {selectedType === "drag_drop_blank" && (
//               <BlankQuestionForm
//                 type="drag_drop_blank"
//                 basePayload={basePayload}
//               />
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

export default function CreateExamPage() {
  const [selectedType, setSelectedType] = useState("multiple");

  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  const [examId, setExamId] = useState(null);
  const [savingExam, setSavingExam] = useState(false);

  const [examForm, setExamForm] = useState({
    examType: "course",
    courseId: "",
    chId: "",
    examTitle: "",
    examDesc: "",
    durationMinutes: 30,
    totalMarks: 0,
    passingMarks: 0,
    maxAttempts: 1,
    requireCompletion: 1,
    completionPercent: 100,
    accessType: "all_course_students",
    isPublished: 0,
  });

  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    fetchCoursesWithChapters();
    fetchStudents();
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
        }))
      );
    } catch (err) {
      console.log("FETCH STUDENTS ERROR:", err.response?.data || err);
    }
  };

  const selectedCourse = courses.find(
    (course) => String(course.courseId) === String(examForm.courseId)
  );

  const updateExamForm = (key, value) => {
    setExamForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleStudent = (userId) => {
    const id = Number(userId);

    setSelectedStudents((prev) =>
      prev.includes(id)
        ? prev.filter((studentId) => studentId !== id)
        : [...prev, id]
    );
  };

  const saveExamDetails = async () => {
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

    if (
      examForm.accessType === "specific_students" &&
      selectedStudents.length === 0
    ) {
      alert("Please select at least one student");
      return;
    }

    try {
      setSavingExam(true);

      // replace old payload with this
      const payload = {
        ...examForm,
        courseId: Number(examForm.courseId),
        chId: examForm.examType === "chapter" ? Number(examForm.chId) : null,
        durationMinutes: Number(examForm.durationMinutes),
        totalMarks: Number(examForm.totalMarks),
        passingMarks: Number(examForm.passingMarks),
        maxAttempts: Number(examForm.maxAttempts),
        requireCompletion: Number(examForm.requireCompletion),
        completionPercent: Number(examForm.completionPercent),
        isPublished: Number(examForm.isPublished),

        selectedStudents:
          examForm.accessType === "specific_students"
            ? selectedStudents.map(Number)
            : [],
      };

      const res = await axios.post(`${API_URL}/exams/add`, payload, {
        withCredentials: true,
      });

      setExamId(res.data.examId);
      alert("Exam details saved. Now add questions.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save exam");
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
        { withCredentials: true }
      );

      alert("Exam published successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to publish exam");
    }
  };

  const questionPayload = {
    examId,
  };

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
          <StepCard number="1" title="Exam Details" active />
          <StepCard number="2" title="Access Rules" active />
          <StepCard number="3" title="Add Questions" active={!!examId} />
          <StepCard number="4" title="Publish Exam" active={!!examId} />
        </div>

        <div className="mb-6 rounded-3xl bg-white p-6 shadow-lg">
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
                updateExamForm("examType", e.target.value);
                updateExamForm("chId", "");
              }}
            >
              <option value="course">Course Test</option>
              <option value="chapter">Chapter Test</option>
            </FormSelect>

            <FormSelect
              label="Select Course"
              value={examForm.courseId}
              onChange={(e) => {
                updateExamForm("courseId", e.target.value);
                updateExamForm("chId", "");
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
                onChange={(e) => updateExamForm("chId", e.target.value)}
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
              onChange={(e) => updateExamForm("examTitle", e.target.value)}
              placeholder="Final Certification Test"
            />

            <FormInput
              label="Duration Minutes"
              type="number"
              value={examForm.durationMinutes}
              onChange={(e) =>
                updateExamForm("durationMinutes", e.target.value)
              }
            />

            <FormInput
              label="Total Marks"
              type="number"
              value={examForm.totalMarks}
              onChange={(e) => updateExamForm("totalMarks", e.target.value)}
            />

            <FormInput
              label="Passing Marks"
              type="number"
              value={examForm.passingMarks}
              onChange={(e) => updateExamForm("passingMarks", e.target.value)}
            />

            <FormInput
              label="Attempt Limit"
              type="number"
              value={examForm.maxAttempts}
              onChange={(e) => updateExamForm("maxAttempts", e.target.value)}
            />

            <FormSelect
              label="Publish Status"
              value={examForm.isPublished}
              onChange={(e) => updateExamForm("isPublished", e.target.value)}
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
              onChange={(e) => updateExamForm("examDesc", e.target.value)}
              placeholder="Enter exam description..."
              className="w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-black text-gray-900">
              Completion Criteria
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <FormSelect
                label="Require Completion?"
                value={examForm.requireCompletion}
                onChange={(e) =>
                  updateExamForm("requireCompletion", e.target.value)
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
                  updateExamForm("completionPercent", e.target.value)
                }
              />
            </div>

            <p className="mt-3 rounded-2xl bg-purple-50 p-4 text-sm text-purple-700">
              If enabled, student can start test only after completing selected
              course/chapter progress.
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
                updateExamForm("accessType", e.target.value);

                if (e.target.value === "all_course_students") {
                  setSelectedStudents([]);
                }
              }}
            >
              <option value="all_course_students">All Course Students</option>
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
                        checked={selectedStudents.includes(Number(student.userId))}
                        onChange={() => toggleStudent(student.userId)}
                        className="h-5 w-5"
                      />

                      <div>
                        <p className="font-bold text-gray-800">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={saveExamDetails}
            disabled={savingExam}
            className="rounded-2xl bg-purple-700 px-6 py-3 text-sm font-bold text-white hover:bg-purple-800 disabled:opacity-60"
          >
            {savingExam ? "Saving..." : examId ? "Update Exam" : "Save Exam"}
          </button>

          <button
            type="button"
            onClick={publishExam}
            disabled={!examId}
            className="rounded-2xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
          >
            Publish Exam
          </button>
        </div>

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
          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <div className="rounded-3xl bg-white p-5 shadow-lg">
              <h2 className="mb-4 text-lg font-black text-gray-900">
                Question Types
              </h2>

              <div className="space-y-3">
                {questionTypes.map((item) => {
                  const Icon = item.icon;
                  const active = selectedType === item.key;

                  return (
                    <button
                      type="button"
                      key={item.key}
                      onClick={() => setSelectedType(item.key)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${active
                        ? "border-purple-500 bg-purple-50 shadow-md"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${active
                            ? "bg-purple-700 text-white"
                            : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div>
                          <h3 className="font-black text-gray-900">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-lg">
              {selectedType === "multiple" && (
                <MultipleChoiceForm basePayload={questionPayload} />
              )}

              {selectedType === "single" && (
                <SingleChoiceForm basePayload={questionPayload} />
              )}

              {selectedType === "essay" && (
                <EssayForm basePayload={questionPayload} />
              )}

              {selectedType === "dropdown_blank" && (
                <BlankQuestionForm
                  type="dropdown_blank"
                  basePayload={questionPayload}
                />
              )}

              {selectedType === "drag_drop_blank" && (
                <BlankQuestionForm
                  type="drag_drop_blank"
                  basePayload={questionPayload}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MultipleChoiceForm({ basePayload }) {
  const [question, setQuestion] = useState("");
  const [marks, setMarks] = useState(1);
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState([]);

  const toggleCorrect = (index) => {
    setCorrect((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSave = async () => {

    if (!basePayload.examId) {
      alert("Please save exam first");
      return;
    }
    const payload = {
      ...basePayload,
      questionType: "multiple",
      questionText: question,
      displayText: question,
      options: options.filter(Boolean),
      correctAnswers: correct.map((index) => ({
        optionIndex: index,
        answer: options[index],
      })),
      marks,
    };

    await axios.post(`${API_URL}/exams/questions/add`, payload, {
      withCredentials: true,
    });

    setQuestion("");
    setMarks(1);
    setOptions(["", "", "", ""]);
    setCorrect([]);

    alert("Question saved successfully");
  };

  return (
    <QuestionShell title="Multiple Choice Question" onSave={handleSave}>
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

function SingleChoiceForm({ basePayload }) {
  const [question, setQuestion] = useState("");
  const [marks, setMarks] = useState(1);
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(null);

  const handleSave = async () => {
    if (!basePayload.examId) {
      alert("Please save exam first");
      return;
    }

    const payload = {
      ...basePayload,
      questionType: "single",
      questionText: question,
      displayText: question,
      options: options.filter(Boolean),
      correctAnswers:
        correct !== null
          ? [{ optionIndex: correct, answer: options[correct] }]
          : [],
      marks,
    };

    await axios.post(`${API_URL}/exams/questions/add`, payload, {
      withCredentials: true,
    });

    setQuestion("");
    setMarks(1);
    setOptions(["", "", "", ""]);
    setCorrect(null);

    alert("Question saved successfully");
  };

  return (
    <QuestionShell title="Single Choice Question" onSave={handleSave}>
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

function EssayForm({ basePayload }) {
  const [question, setQuestion] = useState("");
  const [marks, setMarks] = useState(1);
  const [expectedAnswer, setExpectedAnswer] = useState("");

  const handleSave = async () => {
    if (!basePayload.examId) {
      alert("Please save exam first");
      return;
    }
    const payload = {
      ...basePayload,
      questionType: "essay",
      questionText: question,
      displayText: question,
      options: [],
      correctAnswers: [{ answer: expectedAnswer }],
      marks,
    };

    await axios.post(`${API_URL}/exams/questions/add`, payload, {
      withCredentials: true,
    });

    setQuestion("");
    setMarks(1);
    setExpectedAnswer("");

    alert("Question saved successfully");
  };

  return (
    <QuestionShell title="Essay Question" onSave={handleSave}>
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
          rows={5}
          value={expectedAnswer}
          onChange={(e) => setExpectedAnswer(e.target.value)}
          placeholder="Write expected answer or evaluation points..."
          className="w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-purple-500"
        />
      </div>
    </QuestionShell>
  );
}

function BlankQuestionForm({ type, basePayload }) {
  const [question, setQuestion] = useState("");
  const [marks, setMarks] = useState(1);

  const parsed = useMemo(() => parseBlankQuestion(question), [question]);

  const randomWords = useMemo(() => {
    return shuffleArray(parsed.correctAnswers.map((item) => item.answer));
  }, [parsed.correctAnswers]);

  const handleSave = async () => {
    if (!basePayload.examId) {
      alert("Please save exam first");
      return;
    }

    if (parsed.correctAnswers.length === 0) {
      alert("Please add at least one blank using []");
      return;
    }

    const payload = {
      ...basePayload,
      questionType: type,
      questionText: parsed.questionText,
      displayText: parsed.displayText,
      options: randomWords,
      correctAnswers: parsed.correctAnswers,
      marks,
    };

    await axios.post(`${API_URL}/exams/questions/add`, payload, {
      withCredentials: true,
    });

    setQuestion("");
    setMarks(1);

    alert("Question saved successfully");
  };

  return (
    <QuestionShell
      title={
        type === "dropdown_blank"
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

        {type === "drag_drop_blank" && (
          <div className="mt-8 flex flex-wrap gap-3">
            {randomWords.map((word, index) => (
              <span
                key={index}
                className="rounded-xl bg-purple-700 px-5 py-3 text-sm font-black text-white shadow-md"
              >
                {word}
              </span>
            ))}
          </div>
        )}
      </PreviewBox>

      <div className="rounded-3xl border border-gray-200 bg-white p-6">
        <p className="mb-3 text-sm font-black text-gray-700">
          Correct Answer Sequence
        </p>

        {parsed.correctAnswers.length === 0 ? (
          <p className="text-sm text-gray-500">
            No blanks found. Add answers inside [].
          </p>
        ) : (
          <div className="space-y-3">
            {parsed.correctAnswers.map((item) => (
              <div
                key={item.blankNo}
                className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3"
              >
                <span className="font-bold text-gray-700">
                  Blank {item.blankNo}
                </span>

                <span className="rounded-xl bg-green-100 px-4 py-2 font-black text-green-700">
                  {item.answer}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </QuestionShell>
  );
}

function BlankPreview({ type, displayText, answers }) {
  if (!displayText) {
    return (
      <p className="text-gray-500">
        Preview will appear here after writing question...
      </p>
    );
  }

  const parts = displayText.split(/({{blank\d+}})/g);

  return (
    <p className="text-lg leading-10 text-gray-800">
      {parts.map((part, index) => {
        const match = part.match(/{{blank(\d+)}}/);

        if (!match) {
          return <span key={index}>{part}</span>;
        }

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
            className="mx-1 inline-flex min-h-11 min-w-32 items-center justify-center rounded-xl border-2 border-dashed border-purple-400 bg-purple-50 px-4 font-black text-purple-700"
          >
            Blank {blankNo}
          </span>
        );
      })}
    </p>
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
      <label className="block text-sm font-bold text-gray-700">Options</label>

      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-3">
          <input
            type={type}
            checked={
              type === "checkbox"
                ? correct.includes(index)
                : correct === index
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

      <button
        type="button"
        onClick={addOption}
        className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-bold text-white hover:bg-black"
      >
        <Plus className="h-4 w-4" />
        Add Option
      </button>
    </div>
  );
}

function QuestionShell({ title, children, onSave }) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">
            Build question and save it into database.
          </p>
        </div>

        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4" />
          Save Question
        </button>
      </div>

      <div className="space-y-6">{children}</div>
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
      className={`rounded-2xl border p-4 shadow-sm ${active
        ? "border-purple-300 bg-purple-50"
        : "border-gray-200 bg-white"
        }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${active ? "bg-purple-700 text-white" : "bg-gray-200 text-gray-600"
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
        value={value}
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