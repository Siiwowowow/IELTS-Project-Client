/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { readingService } from "@/services/reading.services";
import { listeningService } from "@/services/listening.services";
import { writingService } from "@/services/writing.services";
import { speakingService } from "@/services/speaking.services";
import { toast } from "sonner";
import {
  IconBook2,
  IconHeadset,
  IconPencil,
  IconMicrophone,
  IconSearch,
  IconRotate,
  IconTrash,
  IconShieldLock,
  IconClock,
  IconAlertCircle,
  IconLoader2,
  IconX,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { ExamCardSkeleton } from "@/components/shared/ExamCardSkeleton";

type ModuleType = "reading" | "listening" | "writing" | "speaking";

export default function AdminExamsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as ModuleType) || "reading";

  const [activeTab, setActiveTab] = useState<ModuleType>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Queries for all 4 modules
  const readingQuery = useQuery({
    queryKey: ["admin-exams-reading"],
    queryFn: () => readingService.getAllExams(),
  });
  const listeningQuery = useQuery({
    queryKey: ["admin-exams-listening"],
    queryFn: () => listeningService.getAllExams(),
  });
  const writingQuery = useQuery({
    queryKey: ["admin-exams-writing"],
    queryFn: () => writingService.getAllExams(),
  });
  const speakingQuery = useQuery({
    queryKey: ["admin-exams-speaking"],
    queryFn: () => speakingService.getAllExams(),
  });

  const getActiveQuery = () => {
    switch (activeTab) {
      case "reading":
        return readingQuery;
      case "listening":
        return listeningQuery;
      case "writing":
        return writingQuery;
      case "speaking":
        return speakingQuery;
    }
  };

  const currentQuery = getActiveQuery();
  const rawList: any[] = currentQuery.data?.data ?? [];

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: ModuleType }) => {
      switch (type) {
        case "reading":
          return readingService.deleteExam(id);
        case "listening":
          return listeningService.deleteExam(id);
        case "writing":
          return writingService.deleteExam(id);
        case "speaking":
          return speakingService.deleteExam(id);
      }
    },
    onSuccess: (_, { type }) => {
      toast.success(`${type.toUpperCase()} exam deleted successfully.`);
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: [`admin-exams-${type}`] });
    },
    onError: (err: any) => {
      toast.error("Failed to delete exam: " + (err?.response?.data?.message || err.message));
      setDeletingId(null);
    },
  });

  // Toggle Publish Mutation
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, type, isPublished }: { id: string; type: ModuleType; isPublished: boolean }) => {
      switch (type) {
        case "reading":
          return readingService.updateExam(id, { isPublished });
        case "listening":
          return listeningService.updateExam(id, { isPublished });
        case "writing":
          return writingService.updateExam(id, { isPublished });
        case "speaking":
          return speakingService.updateExam(id, { isPublished });
      }
    },
    onSuccess: (_, { type, isPublished }) => {
      toast.success(
        isPublished
          ? "Exam is now live & published for students."
          : "Exam moved to draft mode (hidden from students)."
      );
      queryClient.invalidateQueries({ queryKey: [`admin-exams-${type}`] });
    },
    onError: (err: any) => {
      toast.error("Failed to update status: " + (err?.response?.data?.message || err.message));
    },
  });

  // Filter & Search
  const filteredList = useMemo(() => {
    return rawList.filter((item: any) => {
      if (statusFilter === "PUBLISHED" && !item.isPublished) return false;
      if (statusFilter === "DRAFT" && item.isPublished) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchCreator = item.creatorEmail?.toLowerCase().includes(q);
        return matchTitle || matchDesc || matchCreator;
      }
      return true;
    });
  }, [rawList, statusFilter, searchQuery]);

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      setDeletingId(id);
      deleteMutation.mutate({ id, type: activeTab });
    }
  };

  const handleTogglePublish = (id: string, currentStatus: boolean) => {
    togglePublishMutation.mutate({ id, type: activeTab, isPublished: !currentStatus });
  };

  const moduleCounts = {
    reading: readingQuery.data?.data?.length ?? 0,
    listening: listeningQuery.data?.data?.length ?? 0,
    writing: writingQuery.data?.data?.length ?? 0,
    speaking: speakingQuery.data?.data?.length ?? 0,
  };

  return (
    <div className="max-w-[1500px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-950 via-slate-900 to-blue-950 border border-slate-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-[11px] font-black uppercase tracking-widest text-blue-200">
              <IconShieldLock size={13} />
              <span>Exam Content Management</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Modular Exam Papers
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-2xl">
              Inspect and control individual module question papers (Reading, Listening, Writing, Speaking) submitted by instructors across the platform.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              readingQuery.refetch();
              listeningQuery.refetch();
              writingQuery.refetch();
              speakingQuery.refetch();
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs transition active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <IconRotate size={15} />
            <span>Refresh Content</span>
          </button>
        </div>
      </div>

      {/* Module Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("reading")}
          className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
            activeTab === "reading"
              ? "border-emerald-500 bg-emerald-50/50 shadow-md shadow-emerald-500/10 text-emerald-950"
              : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${activeTab === "reading" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
              <IconBook2 size={20} />
            </div>
            <div className="text-left">
              <span className="block text-xs font-black uppercase">Reading</span>
              <span className="text-[11px] font-bold text-slate-400">{moduleCounts.reading} Exams</span>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("listening")}
          className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
            activeTab === "listening"
              ? "border-violet-500 bg-violet-50/50 shadow-md shadow-violet-500/10 text-violet-950"
              : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${activeTab === "listening" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}>
              <IconHeadset size={20} />
            </div>
            <div className="text-left">
              <span className="block text-xs font-black uppercase">Listening</span>
              <span className="text-[11px] font-bold text-slate-400">{moduleCounts.listening} Exams</span>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("writing")}
          className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
            activeTab === "writing"
              ? "border-orange-500 bg-orange-50/50 shadow-md shadow-orange-500/10 text-orange-950"
              : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${activeTab === "writing" ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-600"}`}>
              <IconPencil size={20} />
            </div>
            <div className="text-left">
              <span className="block text-xs font-black uppercase">Writing</span>
              <span className="text-[11px] font-bold text-slate-400">{moduleCounts.writing} Exams</span>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("speaking")}
          className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
            activeTab === "speaking"
              ? "border-rose-500 bg-rose-50/50 shadow-md shadow-rose-500/10 text-rose-950"
              : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${activeTab === "speaking" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600"}`}>
              <IconMicrophone size={20} />
            </div>
            <div className="text-left">
              <span className="block text-xs font-black uppercase">Speaking</span>
              <span className="text-[11px] font-bold text-slate-400">{moduleCounts.speaking} Exams</span>
            </div>
          </div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
              statusFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            All ({rawList.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("PUBLISHED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
              statusFilter === "PUBLISHED" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500 hover:text-emerald-700"
            }`}
          >
            Live ({rawList.filter((i) => i.isPublished).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("DRAFT")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
              statusFilter === "DRAFT" ? "bg-white text-amber-700 shadow-xs" : "text-slate-500 hover:text-amber-700"
            }`}
          >
            Drafts ({rawList.filter((i) => !i.isPublished).length})
          </button>
        </div>

        <div className="relative sm:w-80">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab} exams...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-hidden bg-slate-50/50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <IconX size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Exam Cards Grid */}
      {currentQuery.isLoading && <ExamCardSkeleton count={6} />}

      {currentQuery.isError && (
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 font-semibold text-sm flex items-center gap-3">
          <IconAlertCircle size={20} />
          <p>Failed to load exams for this module.</p>
        </div>
      )}

      {!currentQuery.isLoading && !currentQuery.isError && filteredList.length === 0 && (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl p-6">
          <p className="font-extrabold text-sm text-slate-800">No exams found</p>
          <p className="text-xs text-slate-500 mt-1">No {activeTab} exams found matching the criteria.</p>
        </div>
      )}

      {!currentQuery.isLoading && !currentQuery.isError && filteredList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredList.map((exam: any) => {
            const dateLabel = exam.createdAt ? format(new Date(exam.createdAt), "MMM d, yyyy") : "Recently";
            const isDeleting = deletingId === exam.id;
            const isToggling =
              togglePublishMutation.isPending &&
              (togglePublishMutation.variables as any)?.id === exam.id;

            return (
              <div
                key={exam.id}
                className="group rounded-3xl bg-white border border-slate-200 hover:border-slate-300 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        exam.isPublished
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${exam.isPublished ? "bg-emerald-500" : "bg-amber-500"}`} />
                      <span>{exam.isPublished ? "Published" : "Draft"}</span>
                    </span>

                    <span className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                      <IconClock size={13} />
                      <span>{exam.duration} mins</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors text-base line-clamp-1">
                      {exam.title}
                    </h3>
                    {exam.description && (
                      <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-1 leading-relaxed">
                        {exam.description}
                      </p>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between pt-2 border-t border-slate-100">
                    <span>Author: {exam.creatorEmail || "Teacher"}</span>
                    <span>{dateLabel}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={() => handleTogglePublish(exam.id, exam.isPublished)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                      exam.isPublished
                        ? "bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {isToggling ? <IconLoader2 size={12} className="animate-spin" /> : <IconRotate size={12} />}
                    <span>{exam.isPublished ? "Unpublish" : "Publish"}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => handleDelete(exam.id, exam.title)}
                    className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer active:scale-95"
                    title="Delete exam"
                  >
                    {isDeleting ? <IconLoader2 size={16} className="animate-spin text-rose-600" /> : <IconTrash size={16} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
