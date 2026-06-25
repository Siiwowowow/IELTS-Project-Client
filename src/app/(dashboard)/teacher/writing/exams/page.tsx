/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { writingService } from "@/services/writing.services";
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
  IconWriting,
} from "@tabler/icons-react";
import { format } from "date-fns";

export default function MyWritingExamsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch exams
  const {
    data: responseData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["teacher-writing-exams"],
    queryFn: () => writingService.getAllExams({ myExams: true }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => writingService.deleteExam(id),
    onSuccess: () => {
      toast.success("Writing exam deleted successfully!");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["teacher-writing-exams"] });
    },
    onError: (err: any) => {
      toast.error(
        "Failed to delete exam: " +
          (err?.response?.data?.message || err.message)
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900 via-indigo-800 to-slate-900 p-6 md:p-8 text-white shadow-xl shadow-indigo-950/20">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl"></div>
        <div className="absolute left-1/3 bottom-0 -mb-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-xs font-bold text-violet-200 uppercase tracking-widest">
              <IconSparkles size={12} className="text-amber-400" />
              <span>Writing Module</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              Manage Writing Exams
            </h1>
            <p className="text-indigo-200/80 text-sm max-w-xl font-medium">
              Create, view, update, or remove your IELTS Academic Writing mock
              exams. Each exam contains Task 1 and Task 2.
            </p>
          </div>

          <Link
            href="/teacher/writing/create"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.98] transition-all duration-200 self-start md:self-auto shrink-0"
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
            <IconNotebook className="text-violet-600" size={20} />
            <span>Your Exams ({exams.length})</span>
          </h2>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-200 shadow-xs gap-3">
            <IconLoader2 size={36} className="animate-spin text-violet-600" />
            <p className="text-sm font-semibold text-gray-500">
              Loading writing exams...
            </p>
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-4 p-5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800">
            <IconAlertCircle size={24} className="shrink-0 text-rose-600" />
            <div>
              <p className="font-bold text-sm">Failed to retrieve exams</p>
              <p className="text-xs text-rose-700/80 mt-0.5">
                We encountered an error loading your writing exams. Please
                reload the page.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !isError && exams.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200 text-center p-6 gap-4">
            <div className="h-16 w-16 rounded-2xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center shadow-xs">
              <IconWriting size={28} />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="font-bold text-gray-800">No Writing Exams Found</p>
              <p className="text-xs text-gray-500 font-medium">
                You haven't created any IELTS writing mock exams yet. Start by
                crafting your first one!
              </p>
            </div>
            <Link
              href="/teacher/writing/create"
              className="px-4.5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-sm hover:shadow-md transition duration-200"
            >
              Get Started
            </Link>
          </div>
        )}

        {!isLoading && !isError && exams.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam: any) => {
              const dateLabel = exam.createdAt
                ? format(new Date(exam.createdAt), "MMM d, yyyy")
                : "Recently";

              const isConfirmingDelete = deletingId === exam.id;
              const taskCount = exam._count?.tasks ?? 0;
              const examTypeLabel =
                exam.examType === "GENERAL_TRAINING"
                  ? "General Training"
                  : "Academic";

              return (
                <div
                  key={exam.id}
                  className="group relative flex flex-col justify-between rounded-2xl bg-white border border-gray-200 p-5 shadow-xs hover:shadow-md hover:border-violet-100 transition-all duration-300 min-h-[220px]"
                >
                  <div className="space-y-3">
                    {/* Badge & Metadata */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            exam.isPublished
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}
                        >
                          {exam.isPublished ? "Published" : "Draft"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100">
                          {examTypeLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                        <IconCalendar size={14} />
                        <span>{dateLabel}</span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-1">
                      <h3 className="font-black text-gray-900 group-hover:text-violet-600 transition-colors text-base truncate">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
                        {exam.description || "No description provided."}
                      </p>
                    </div>

                    {/* Details Row */}
                    <div className="flex items-center gap-4 py-2 border-y border-gray-50 text-xs font-semibold text-gray-600">
                      <div className="flex items-center gap-1">
                        <IconClock size={14} className="text-violet-500" />
                        <span>{exam.duration} mins</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <IconFileText size={14} className="text-emerald-500" />
                        <span>{taskCount} Tasks</span>
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
                          href={`/practice/writing/${exam.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-violet-600 hover:text-violet-700 hover:bg-violet-50/50 rounded-lg transition duration-200"
                        >
                          <IconEye size={14} />
                          <span>Preview</span>
                        </Link>

                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              router.push(
                                `/teacher/writing/create?edit=${exam.id}`
                              )
                            }
                            className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50/50 rounded-lg transition"
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
