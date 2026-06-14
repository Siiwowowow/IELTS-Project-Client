/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { readingService } from "@/services/reading.services";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  IconNotebook,
  IconLoader2,
  IconAlertCircle,
  IconTrash,
  IconEdit,
  IconPlus,
  IconEye,
  IconCalendar,
  IconClock,
  IconFileText,
  IconSparkles,
} from "@tabler/icons-react";
import { format } from "date-fns";

export default function MyExamsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch exams
  const {
    data: responseData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["teacher-exams"],
    queryFn: () => readingService.getAllExams({ myExams: true }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => readingService.deleteExam(id),
    onSuccess: () => {
      toast.success("Exam deleted successfully!");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["teacher-exams"] });
    },
    onError: (err: any) => {
      toast.error(
        "Failed to delete exam: " + (err?.response?.data?.message || err.message)
      );
      setDeletingId(null);
    },
  });

  const exams = responseData?.data ?? [];

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      {/* Top Banner / Header */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 md:p-8 text-white shadow-xl shadow-indigo-950/20">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute left-1/3 bottom-0 -mb-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-bold text-indigo-200 uppercase tracking-widest">
              <IconSparkles size={12} className="text-amber-400" />
              <span>Instructor Portal</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">Manage Your Exams</h1>
            <p className="text-indigo-200/80 text-sm max-w-xl font-medium">
              Create, view, update, or remove your curated IELTS Academic Reading mock papers. All changes update instantly for students.
            </p>
          </div>

          <Link
            href="/teacher/dashboard"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-98 transition-all duration-200 self-start md:self-auto shrink-0"
          >
            <IconPlus size={18} className="stroke-[3]" />
            <span>Create New Exam</span>
          </Link>
        </div>
      </div>

      {/* Main List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <IconNotebook className="text-indigo-600" size={20} />
            <span>Your Exams ({exams.length})</span>
          </h2>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-200 shadow-xs gap-3">
            <IconLoader2 size={36} className="animate-spin text-indigo-600" />
            <p className="text-sm font-semibold text-gray-500">Loading exams list...</p>
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-4 p-5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800">
            <IconAlertCircle size={24} className="shrink-0 text-rose-600" />
            <div>
              <p className="font-bold text-sm">Failed to retrieve exams</p>
              <p className="text-xs text-rose-700/80 mt-0.5">
                We encountered an error loading your mock exams. Please reload the page.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !isError && exams.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200 text-center p-6 gap-4">
            <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
              <IconFileText size={28} />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="font-bold text-gray-800">No Exams Found</p>
              <p className="text-xs text-gray-500 font-medium">
                You haven't created any IELTS reading mock exams yet. Start by crafting your first one!
              </p>
            </div>
            <Link
              href="/teacher/dashboard"
              className="px-4.5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm hover:shadow-md transition duration-200"
            >
              Get Started
            </Link>
          </div>
        )}

        {!isLoading && !isError && exams.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => {
              const dateLabel = exam.createdAt
                ? format(new Date(exam.createdAt), "MMM d, yyyy")
                : "Recently";

              const isConfirmingDelete = deletingId === exam.id;

              return (
                <div
                  key={exam.id}
                  className="group relative flex flex-col justify-between rounded-2xl bg-white border border-gray-200 p-5 shadow-xs hover:shadow-md hover:border-indigo-100 transition-all duration-300 min-h-[220px]"
                >
                  <div className="space-y-3">
                    {/* Badge & Metadata */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          exam.isPublished
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}
                      >
                        {exam.isPublished ? "Published" : "Draft"}
                      </span>

                      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                        <IconCalendar size={14} />
                        <span>{dateLabel}</span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-1">
                      <h3 className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors text-base truncate">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
                        {exam.description || "No description provided."}
                      </p>
                    </div>

                    {/* Details Row */}
                    <div className="flex items-center gap-4 py-2 border-y border-gray-50 text-xs font-semibold text-gray-600">
                      <div className="flex items-center gap-1">
                        <IconClock size={14} className="text-indigo-500" />
                        <span>{exam.duration} mins</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <IconFileText size={14} className="text-emerald-500" />
                        <span>{exam._count?.passages ?? 0} Passages</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions / Confirmation State */}
                  <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
                    {isConfirmingDelete ? (
                      <div className="flex items-center justify-between w-full bg-rose-50 border border-rose-100 rounded-xl p-2 animate-fadeIn">
                        <span className="text-[10px] font-bold text-rose-800 pl-1">
                          Delete this exam?
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(exam.id)}
                            disabled={deleteMutation.isPending}
                            className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white rounded-md transition disabled:opacity-50"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-md transition"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Link
                          href={`/practice/reading/${exam.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50 rounded-lg transition duration-200"
                        >
                          <IconEye size={14} />
                          <span>Preview</span>
                        </Link>

                        <div className="flex gap-1">
                          <button
                            onClick={() => router.push(`/teacher/dashboard?edit=${exam.id}`)}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-lg transition"
                            title="Edit Exam"
                          >
                            <IconEdit size={16} />
                          </button>
                          <button
                            onClick={() => setDeletingId(exam.id)}
                            className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg transition"
                            title="Delete Exam"
                          >
                            <IconTrash size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
