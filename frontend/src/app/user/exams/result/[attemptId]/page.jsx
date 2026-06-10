"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import API_URL from "@/config/api";

export default function ExamResultPage() {
    const { attemptId } = useParams();
    const router = useRouter();

    const [result, setResult] = useState(null);

    useEffect(() => {
        fetchResult();
    }, []);

    const fetchResult = async () => {
        try {
            const res = await axios.get(`${API_URL}/exams/result/${attemptId}`, {
                withCredentials: true,
            });

            setResult(res.data.data);
        } catch (err) {
            alert(err.response?.data?.message || "Result not found");
            router.push("/user/courses");
        }
    };

    if (!result) {
        return <div className="p-10 text-center font-bold">Loading result...</div>;
    }

    const percentage = Math.round(
        (Number(result.obtainedMarks) / Number(result.totalMarks)) * 100
    );

    const passed = result.status === "passed";

    return (
        <div className="min-h-screen bg-slate-50 px-6 py-10">
            <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-xl">
                <div
                    className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full text-4xl font-black ${passed
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
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

                <button
                    onClick={() => router.push("/user/courses")}
                    className="mt-8 rounded-2xl bg-purple-700 px-8 py-3 font-bold text-white hover:bg-purple-800"
                >
                    Back to Courses
                </button>
            </div>
        </div>
    );
}

function ScoreBox({ label, value }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-bold text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-gray-900">{value}</p>
        </div>
    );
}