"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

export default function AddButtonModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-2xl bg-purple-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-800"
      >
        + Add
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">
                What do you want to add?
              </h3>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4">
              <Link
                href="/admin/add-course"
                className="rounded-2xl border border-purple-200 bg-purple-50 p-5 transition hover:bg-purple-100"
              >
                <h4 className="text-lg font-bold text-purple-800">
                  Add Course
                </h4>
                <p className="mt-1 text-sm text-gray-600">
                  Create a new course with details, price and image.
                </p>
              </Link>

              <Link
                href="/admin/exams/create"
                className="rounded-2xl border border-blue-200 bg-blue-50 p-5 transition hover:bg-blue-100"
              >
                <h4 className="text-lg font-bold text-blue-800">
                  Create Exam
                </h4>
                <p className="mt-1 text-sm text-gray-600">
                  Add exam, test questions, marks and duration.
                </p>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}