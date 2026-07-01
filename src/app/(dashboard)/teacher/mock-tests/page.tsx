/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockTestService } from "@/services/mocktest.services";
import { toast } from "sonner";
import Link from "next/link";
import { useState } from "react";
import {
  IconTrophy,
  IconLoader2,
  IconAlertCircle,
  IconTrash,
  IconPlus,
  IconCalendar,
  IconClock,
  IconFileText,
  IconSparkles,
  IconBook2,
  IconHeadset,
  IconPencil,
  IconMicrophone,
} from "@tabler/icons-react";
import { format } from "date-fns";

export default function TeacherMockTestsPage() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch full mock tests
  const {
    data: responseData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["teacher-mock-tests"],
    queryFn: () => mockTestService.getAllMockTests({ myExams: true }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => mockTestService.deleteMockTest(id),
    onSuccess: () => {
      toast.success("Mock test deleted successfully!");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["teacher-mock-tests"] });
    },
    onError: (err: any) => {
      toast.error(
        "Failed to delete mock test: " + (err?.response?.data?.message || err.message)
      );
      setDeletingId(null);
    },
  });

  const mockTests = responseData?.data ?? [];

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full px-4 py-6">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900 via-purple-800 to-indigo-900 p-6 md:p-8 text-white shadow-xl shadow-purple-950/20">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute left-1/3 bottom-0 -mb-16 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-xs font-bold text-purple-200 uppercase tracking-widest">
              <IconSparkles size={12} className="text-amber-400" />
              <span>Full Test Builder</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">Manage Full Mock Tests</h1>
            <p className="text-purple-200/80 text-sm max-w-xl font-medium">
              Create combined IELTS Academic exam papers using Reading, Listening, Writing, and Speaking modules.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 self-start md:self-auto shrink-0">
            <Link
              href="/teacher/mock-tests/create"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-700/60 hover:bg-purple-700 text-white font-extrabold text-sm border border-purple-500/30 hover:border-purple-500/50 shadow-lg shadow-purple-950/20 active:scale-98 transition-all duration-200"
            >
              <IconPlus size={18} className="stroke-[3]" />
              <span>Assemble Mock Test</span>
            </Link>
            <Link
              href="/teacher/mock-tests/create-full"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-extrabold text-sm shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 active:scale-98 transition-all duration-200 animate-pulse hover:animate-none"
            >
              <IconPlus size={18} className="stroke-[3]" />
              <span>Create Full Mock Test</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <IconTrophy className="text-purple-600" size={20} />
            <span>Your Full Mock Tests ({mockTests.length})</span>
          </h2>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-200 shadow-xs gap-3">
            <IconLoader2 size={36} className="animate-spin text-purple-600" />
            <p className="text-sm font-semibold text-gray-500">Loading mock tests list...</p>
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-4 p-5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800">
            <IconAlertCircle size={24} className="shrink-0 text-rose-600" />
            <div>
              <p className="font-bold text-sm">Failed to retrieve mock tests</p>
              <p className="text-xs text-rose-700/80 mt-0.5">
                We encountered an error loading your mock exams. Please reload the page.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !isError && mockTests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200 text-center p-6 gap-4">
            <div className="h-16 w-16 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
              <IconTrophy size={28} />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="font-bold text-gray-800">No Mock Tests Found</p>
              <p className="text-xs text-gray-500 font-medium">
                You haven't created any full IELTS mock tests yet. Group your exam modules into a full test!
              </p>
            </div>
            <Link
              href="/teacher/mock-tests/create"
              className="px-4.5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm hover:shadow-md transition duration-200"
            >
              Assemble Your First Test
            </Link>
          </div>
        )}

        {!isLoading && !isError && mockTests.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockTests.map((mockTest) => {
              const dateLabel = mockTest.createdAt
                ? format(new Date(mockTest.createdAt), "MMM d, yyyy")
                : "Recently";

              const isConfirmingDelete = deletingId === mockTest.id;

              // Count how many modules are linked
              const linkedModules = [
                mockTest.listeningExamId,
                mockTest.readingExamId,
                mockTest.writingExamId,
                mockTest.speakingExamId,
              ].filter(Boolean).length;

              return (
                <div
                  key={mockTest.id}
                  className="group relative flex flex-col justify-between rounded-2xl bg-white border border-gray-200 p-5 shadow-xs hover:shadow-md hover:border-purple-100 transition-all duration-300 min-h-[260px]"
                >
                  <div className="space-y-3">
                    {/* Badge & Metadata */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          mockTest.isPublished
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}
                      >
                        {mockTest.isPublished ? "Published" : "Draft"}
                      </span>

                      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                        <IconCalendar size={14} />
                        <span>{dateLabel}</span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-1">
                      <h3 className="font-black text-gray-900 group-hover:text-purple-600 transition-colors text-base truncate">
                        {mockTest.title}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
                        {mockTest.description || "No description provided."}
                      </p>
                    </div>

                    {/* Linked Modules Checklist */}
                    <div className="py-2 border-y border-gray-50 space-y-1.5">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider mb-1">
                        Exam Components ({linkedModules}/4)
                      </span>
                      <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-xs font-semibold text-gray-600">
                        <div className="flex items-center gap-1">
                          <IconHeadset size={14} className={mockTest.listeningExamId ? "text-emerald-500" : "text-gray-300"} />
                          <span className={mockTest.listeningExamId ? "text-gray-700" : "text-gray-400 line-through"}>Listening</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IconBook2 size={14} className={mockTest.readingExamId ? "text-emerald-500" : "text-gray-300"} />
                          <span className={mockTest.readingExamId ? "text-gray-700" : "text-gray-400 line-through"}>Reading</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IconPencil size={14} className={mockTest.writingExamId ? "text-emerald-500" : "text-gray-300"} />
                          <span className={mockTest.writingExamId ? "text-gray-700" : "text-gray-400 line-through"}>Writing</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IconMicrophone size={14} className={mockTest.speakingExamId ? "text-emerald-500" : "text-gray-300"} />
                          <span className={mockTest.speakingExamId ? "text-gray-700" : "text-gray-400 line-through"}>Speaking</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions / Confirmation State */}
                  <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
                    {isConfirmingDelete ? (
                      <div className="flex items-center justify-between w-full bg-rose-50 border border-rose-100 rounded-xl p-2 animate-fade-in">
                        <span className="text-[10px] font-bold text-rose-800 pl-1">
                          Confirm deletion?
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDelete(mockTest.id)}
                            disabled={deleteMutation.isPending}
                            className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-rose-600 hover:bg-rose-700 text-white rounded-md transition duration-150"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition duration-150"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="text-[10px] font-bold text-slate-400">
                          ID: {mockTest.id.slice(0, 8)}...
                        </span>
                        <button
                          onClick={() => setDeletingId(mockTest.id)}
                          className="p-2 rounded-lg bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 border border-gray-100 hover:border-rose-100 active:scale-95 transition-all duration-150"
                          title="Delete Mock Test"
                        >
                          <IconTrash size={16} />
                        </button>
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
