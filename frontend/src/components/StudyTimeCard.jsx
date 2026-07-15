"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { apiRequest, attendanceApi } from "@/lib/apiHelper";

export default function StudyTimeCard() {
  const [studyTime, setStudyTime] = useState({
    today: "0m",
    thisWeek: "0m",
    thisMonth: "0m",
  });

  const fetchStudyTime = async () => {
    try {
      const res = await apiRequest(attendanceApi.getMyStudyTime, {
        method: "GET",
      });

      if (res.success) {
        setStudyTime(res.data?.data || studyTime);
      }
    } catch (err) {
      console.log("STUDY TIME ERROR:", err);
    }
  };

  useEffect(() => {
    fetchStudyTime();
  }, []);

  return (
    <div className="h-full rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-orange-100 p-3 text-orange-600">
          <Clock className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-xl font-black text-gray-900">Study Time</h2>
          <p className="text-sm text-gray-500">Your learning activity</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <StudyBox title="Today" value={studyTime.today} />
        <StudyBox title="This Week" value={studyTime.thisWeek} />
        <StudyBox title="This Month" value={studyTime.thisMonth} />
      </div>
    </div>
  );
}

function StudyBox({ title, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-orange-50 px-5 py-4">
      <p className="text-sm font-bold text-gray-600">{title}</p>
      <h3 className="text-2xl font-black text-orange-600">{value}</h3>
    </div>
  );
}
