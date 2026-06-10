"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import API_URL from "@/config/api";
import { ArrowLeft, Clock, FileText, Trophy } from "lucide-react";

export default function ExamStartPage() {
    const { examId } = useParams();
    const router = useRouter();

    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        fetchExamInfo();
    }, []);

    const fetchExamInfo = async () => {
        try {
            const res = await axios.get(`${API_URL}/exams/${examId}/start-info`, {
                withCredentials: true,
            });

            setExam(res.data.data);
        } catch (err) {
            alert(err.response?.data?.message || "Exam not available");
            router.push("/user/courses");
        } finally {
            setLoading(false);
        }
    };

    const startExam = async () => {
        try {
            setStarting(true);

            const res = await axios.post(
                `${API_URL}/exams/start`,
                { examId },
                { withCredentials: true }
            );

            router.push(
                `/user/exams/${examId}/attempt?attemptId=${res.data.attemptId}`
            );
        } catch (err) {
            alert(err.response?.data?.message || "Cannot start exam");
        } finally {
            setStarting(false);
        }
    };

    if (loading) {
        return <div className="p-10 text-center font-bold">Loading exam...</div>;
    }

    if (!exam) return null;

    return (
        <div className="min-h-screen bg-slate-50 px-6 py-10">
            <div className="mx-auto max-w-4xl">
                <button
                    onClick={() => router.back()}
                    className="mb-6 flex items-center gap-2 font-bold text-purple-700"
                >
                    <ArrowLeft className="h-5 w-5" />
                    Back
                </button>

                <div className="rounded-3xl bg-white p-8 shadow-xl">
                    <span className="rounded-full bg-purple-100 px-4 py-2 text-sm font-black text-purple-700">
                        {exam.examType === "course" ? "Course Test" : "Chapter Test"}
                    </span>

                    <h1 className="mt-5 text-4xl font-black text-gray-900">
                        {exam.examTitle}
                    </h1>

                    <p className="mt-3 text-gray-600">{exam.examDesc}</p>

                    <div className="mt-8 grid gap-4 md:grid-cols-4">
                        <InfoBox icon={<Clock />} label="Duration" value={`${exam.durationMinutes} min`} />
                        <InfoBox icon={<FileText />} label="Questions" value={exam.questionCount} />
                        <InfoBox icon={<Trophy />} label="Total Marks" value={exam.totalMarks} />
                        <InfoBox icon={<Trophy />} label="Passing" value={exam.passingMarks} />
                    </div>

                    <div className="mt-8 rounded-3xl bg-purple-50 p-6">
                        <h2 className="text-xl font-black text-purple-900">
                            Instructions
                        </h2>

                        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm font-medium text-purple-800">
                            <li>Read all questions carefully.</li>
                            <li>Do not refresh or close the exam page.</li>
                            <li>Submit the exam before time ends.</li>
                            <li>Objective questions will be checked automatically.</li>
                        </ul>
                    </div>

                    {!exam.canStart ? (
                        <div className="mt-8 rounded-2xl bg-red-50 p-4 font-bold text-red-600">
                            {exam.lockReason}
                        </div>
                    ) : (
                        <button
                            onClick={startExam}
                            disabled={starting}
                            className="mt-8 w-full rounded-2xl bg-green-600 py-4 text-lg font-black text-white hover:bg-green-700 disabled:opacity-60"
                        >
                            {starting ? "Starting..." : "Start Exam Now"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoBox({ icon, label, value }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-5 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                {icon}
            </div>
            <p className="text-sm font-bold text-gray-500">{label}</p>
            <p className="mt-1 text-xl font-black text-gray-900">{value}</p>
        </div>
    );
}