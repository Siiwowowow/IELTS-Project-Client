/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockTestService } from "@/services/mocktest.services";
import { readingService } from "@/services/reading.services";
import { listeningService } from "@/services/listening.services";
import { writingService } from "@/services/writing.services";
import { speakingService } from "@/services/speaking.services";
import { toast } from "sonner";
import Link from "next/link";
import { useState, useMemo } from "react";
import {
  IconTrophy,
  IconLoader2,
  IconAlertCircle,
  IconTrash,
  IconPlus,
  IconCalendar,
  IconSparkles,
  IconBook2,
  IconHeadset,
  IconPencil,
  IconMicrophone,
  IconSearch,
  IconCircleCheck,
  IconCircleDot,
  IconLayersLinked,
  IconExternalLink,
  IconRotate,
  IconClock,
  IconBolt,
  IconFileText,
  IconFilter,
  IconX,
  IconCrown,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { ExamCardSkeleton } from "@/components/shared/ExamCardSkeleton";

type FilterTab = "ALL" | "PUBLISHED" | "DRAFT" | "FREE" | "PREMIUM";

export default function TeacherMockTestsPage() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("ALL");
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST" | "TITLE">("NEWEST");

  // Fetch full mock tests (both published & draft)
  const {
    data: responseData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["teacher-mock-tests"],
    queryFn: () => mockTestService.getAllMockTests({ myExams: true }),
  });

  // Query pool of available module exams for maximalist dashboard stats
  const listeningQuery = useQuery({
    queryKey: ["pool-listening-count"],
    queryFn: () => listeningService.getAllExams({ myExams: true }),
  });
  const readingQuery = useQuery({
    queryKey: ["pool-reading-count"],
    queryFn: () => readingService.getAllExams({ myExams: true }),
  });
  const writingQuery = useQuery({
    queryKey: ["pool-writing-count"],
    queryFn: () => writingService.getAllExams({ myExams: true }),
  });
  const speakingQuery = useQuery({
    queryKey: ["pool-speaking-count"],
    queryFn: () => speakingService.getAllExams({ myExams: true }),
  });

  const totalPoolModules =
    (listeningQuery.data?.data?.length ?? 0) +
    (readingQuery.data?.data?.length ?? 0) +
    (writingQuery.data?.data?.length ?? 0) +
    (speakingQuery.data?.data?.length ?? 0);

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

  // Quick Toggle Publish / Draft Mutation
  const togglePublishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      mockTestService.updateMockTest(id, { isPublished }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.isPublished
          ? "Mock test is now live & published for students!"
          : "Mock test moved to draft mode (hidden from students)."
      );
      queryClient.invalidateQueries({ queryKey: ["teacher-mock-tests"] });
    },
    onError: (err: any) => {
      toast.error("Failed to update status: " + (err?.response?.data?.message || err.message));
    },
  });

  // Quick Toggle Free / Premium Mutation
  const togglePremiumMutation = useMutation({
    mutationFn: ({ id, isPremium }: { id: string; isPremium: boolean }) =>
      mockTestService.updateMockTest(id, { isPremium }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.isPremium
          ? "Mock test set to Premium (Paid Access)."
          : "Mock test set to Free (All Candidates)."
      );
      queryClient.invalidateQueries({ queryKey: ["teacher-mock-tests"] });
    },
    onError: (err: any) => {
      toast.error("Failed to update tier: " + (err?.response?.data?.message || err.message));
    },
  });

  const rawMockTests = responseData?.data ?? [];

  // Compute metrics
  const publishedCount = useMemo(
    () => rawMockTests.filter((m) => m.isPublished).length,
    [rawMockTests]
  );
  const draftCount = useMemo(
    () => rawMockTests.filter((m) => !m.isPublished).length,
    [rawMockTests]
  );
  const freeCount = useMemo(
    () => rawMockTests.filter((m) => !m.isPremium).length,
    [rawMockTests]
  );
  const premiumCount = useMemo(
    () => rawMockTests.filter((m) => m.isPremium).length,
    [rawMockTests]
  );

  // Filter & Search & Sort
  const filteredMockTests = useMemo(() => {
    return rawMockTests
      .filter((mock) => {
        // Tab filter
        if (filterTab === "PUBLISHED" && !mock.isPublished) return false;
        if (filterTab === "DRAFT" && mock.isPublished) return false;
        if (filterTab === "FREE" && mock.isPremium) return false;
        if (filterTab === "PREMIUM" && !mock.isPremium) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = mock.title?.toLowerCase().includes(q);
          const matchDesc = mock.description?.toLowerCase().includes(q);
          return matchTitle || matchDesc;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "TITLE") {
          return (a.title || "").localeCompare(b.title || "");
        }
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return sortBy === "OLDEST" ? timeA - timeB : timeB - timeA;
      });
  }, [rawMockTests, filterTab, searchQuery, sortBy]);

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleTogglePublish = (id: string, currentStatus: boolean) => {
    togglePublishMutation.mutate({ id, isPublished: !currentStatus });
  };

  const handleTogglePremium = (id: string, currentPremium: boolean) => {
    togglePremiumMutation.mutate({ id, isPremium: !currentPremium });
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-3 sm:px-5 py-4 sm:py-6 space-y-6 font-sans">
      {/* ─── 1. TOP MAXIMALIST COMMAND BANNER ──────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-950 via-purple-950 to-indigo-950 border border-purple-800/40 p-5 sm:p-7 md:p-8 text-white shadow-2xl shadow-purple-950/40">
        {/* Animated Background Mesh & Lights */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-40 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            {/* Live Indicator Pill */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-[11px] font-black uppercase tracking-widest text-purple-200 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Full Test Command Center</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-[11px] font-black uppercase tracking-wider text-amber-300">
                <IconSparkles size={12} className="animate-spin text-amber-300" />
                <span>Cambridge 4-Module Simulation</span>
              </span>
            </div>

            {/* Banner Main Title */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-linear-to-br from-amber-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30 shrink-0 animate-float-gentle">
                <IconTrophy size={26} className="stroke-[2.5]" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
                Manage Full Mock Tests
              </h1>
            </div>

            <p className="text-purple-200/80 text-xs sm:text-sm font-medium leading-relaxed">
              Create and manage official IELTS Academic 4-Module exam papers (Listening, Reading, Writing, Speaking) with integrated timers, audio playback, split-screen writing, and cue-card recorders.
            </p>
          </div>

          {/* Action Buttons with Maximalist Accents */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <Link
              href="/teacher/mock-tests/create"
              className="group relative inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-purple-900/60 hover:bg-purple-800/90 text-white font-black text-xs sm:text-sm border border-purple-400/30 hover:border-purple-300 shadow-lg shadow-purple-950/40 hover:shadow-purple-700/20 active:scale-95 transition-all duration-200"
            >
              <IconLayersLinked size={18} className="text-purple-300 group-hover:rotate-12 transition-transform duration-200" />
              <span>Assemble Mock Test</span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-md bg-purple-700/60 border border-purple-500/40 text-purple-200">
                Pool
              </span>
            </Link>

            <Link
              href="/teacher/mock-tests/create-full"
              className="group relative inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-teal-500/30 hover:shadow-teal-400/40 active:scale-95 transition-all duration-200 animate-pulse hover:animate-none"
            >
              <IconPlus size={18} className="stroke-[3] group-hover:rotate-90 transition-transform duration-200" />
              <span>Create Full Mock</span>
              <IconSparkles size={16} className="text-slate-950 fill-slate-950" />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 2. MAXIMALIST METRICS & STATS ROW ─────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Mocks Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-purple-300 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Total Full Mocks
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
              <IconTrophy size={18} className="animate-float-gentle" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {rawMockTests.length}
            </span>
            <span className="text-[11px] font-bold text-slate-400">Total Exams</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-purple-700">
            <IconBolt size={13} className="text-amber-500" />
            <span>4-part simulation suites</span>
          </div>
        </div>

        {/* Live Published Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Published Live
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <IconCircleCheck size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
              {publishedCount}
            </span>
            <span className="text-[11px] font-bold text-slate-400">Active</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Available for students to attempt</span>
          </div>
        </div>

        {/* Draft Workspaces Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Draft Tests
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <IconClock size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
              {draftCount}
            </span>
            <span className="text-[11px] font-bold text-slate-400">In Progress</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
            <IconPencil size={13} className="text-amber-500" />
            <span>Hidden from student view</span>
          </div>
        </div>

        {/* Module Pool Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-cyan-300 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Modules Pool
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 group-hover:scale-110 transition-transform">
              <IconLayersLinked size={18} className="animate-float-reverse" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-cyan-700 tracking-tight">
              {totalPoolModules}
            </span>
            <span className="text-[11px] font-bold text-slate-400">Components</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-slate-600">
            <span title="Listening">🎧 {listeningQuery.data?.data?.length ?? 0}</span>
            <span title="Reading">📖 {readingQuery.data?.data?.length ?? 0}</span>
            <span title="Writing">✍️ {writingQuery.data?.data?.length ?? 0}</span>
            <span title="Speaking">🎙️ {speakingQuery.data?.data?.length ?? 0}</span>
          </div>
        </div>
      </div>

      {/* ─── 3. FILTER, SEARCH & CONTROLS BAR ───────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs">
        {/* Filter Segmented Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFilterTab("ALL")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              filterTab === "ALL"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            All Tests ({rawMockTests.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("PUBLISHED")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              filterTab === "PUBLISHED"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-500 hover:text-emerald-700"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Published ({publishedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("DRAFT")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              filterTab === "DRAFT"
                ? "bg-white text-amber-700 shadow-xs"
                : "text-slate-500 hover:text-amber-700"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Drafts ({draftCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("FREE")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              filterTab === "FREE"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-500 hover:text-emerald-700"
            }`}
          >
            <span>🆓 Free ({freeCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("PREMIUM")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              filterTab === "PREMIUM"
                ? "bg-white text-amber-700 shadow-xs"
                : "text-slate-500 hover:text-amber-700"
            }`}
          >
            <IconCrown size={13} className="text-amber-500 fill-amber-500" />
            <span>Premium ({premiumCount})</span>
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 md:w-64">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:border-purple-600 focus:outline-hidden bg-slate-50/50"
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

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50/50 focus:border-purple-600 focus:outline-hidden cursor-pointer"
          >
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
            <option value="TITLE">Title A-Z</option>
          </select>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition active:scale-95 cursor-pointer shrink-0"
            title="Refresh list"
          >
            <IconRotate size={16} className={isFetching ? "animate-spin text-purple-600" : ""} />
          </button>
        </div>
      </div>

      {/* ─── 4. MOCK TESTS LIST / EMPTY STATE ──────────────────────── */}
      <div>
        {isLoading && <ExamCardSkeleton count={6} />}

        {isError && (
          <div className="flex items-center gap-4 p-5 bg-rose-50 border border-rose-200 rounded-3xl text-rose-800">
            <IconAlertCircle size={28} className="shrink-0 text-rose-600" />
            <div>
              <p className="font-extrabold text-sm">Failed to retrieve mock tests</p>
              <p className="text-xs text-rose-700/80 mt-0.5">
                We encountered an error loading your mock exams. Please click the refresh button above.
              </p>
            </div>
          </div>
        )}

        {/* Maximalist Empty State */}
        {!isLoading && !isError && rawMockTests.length === 0 && (
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-b from-white via-slate-50/60 to-purple-50/40 border-2 border-dashed border-purple-200 p-6 sm:p-10 text-center shadow-sm">
            {/* Ambient background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-xl mx-auto space-y-5">
              {/* Floating Animated Icon Cluster */}
              <div className="relative mx-auto h-24 w-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-linear-to-tr from-purple-500/20 to-cyan-500/20 blur-md animate-pulse-glow" />
                <div className="relative flex h-18 w-18 items-center justify-center rounded-3xl bg-linear-to-br from-purple-600 via-indigo-600 to-purple-700 text-white shadow-xl shadow-purple-600/30">
                  <IconTrophy size={36} className="animate-bounce" />
                </div>
                {/* Orbiting module badges */}
                <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md animate-float-gentle">
                  <IconHeadset size={14} />
                </div>
                <div className="absolute -bottom-1 -left-1 h-7 w-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md animate-float-reverse">
                  <IconBook2 size={14} />
                </div>
                <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md animate-float-gentle">
                  <IconPencil size={14} />
                </div>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  No Full Mock Tests Created Yet
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                  Start assembling Cambridge-standard IELTS mock tests! You can either combine existing module exams or build all 4 modules from scratch.
                </p>
              </div>

              {/* Two Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
                <Link
                  href="/teacher/mock-tests/create"
                  className="group relative flex flex-col justify-between p-4 rounded-2xl bg-white border border-purple-200/80 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200 cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
                      <IconLayersLinked size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900 group-hover:text-purple-600 transition-colors">
                        Assemble from Pool
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Combine saved Reading, Listening, Writing & Speaking modules into one full test.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs font-black text-purple-600">
                    <span>Assemble Modules</span>
                    <IconSparkles size={14} />
                  </div>
                </Link>

                <Link
                  href="/teacher/mock-tests/create-full"
                  className="group relative flex flex-col justify-between p-4 rounded-2xl bg-white border border-teal-200/80 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/10 transition-all duration-200 cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 group-hover:scale-110 transition-transform">
                      <IconBolt size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900 group-hover:text-teal-600 transition-colors">
                        Build from Scratch
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Author all 4 modules simultaneously with auto-sync and real-time draft saving.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs font-black text-teal-600">
                    <span>Open Full Studio</span>
                    <IconPlus size={14} className="stroke-[3]" />
                  </div>
                </Link>
              </div>

              {/* Feature highlight pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] font-bold text-slate-500">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100">
                  <IconCircleCheck size={13} className="text-emerald-500" /> Official Cambridge CBT Format
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100">
                  <IconCircleCheck size={13} className="text-emerald-500" /> Automated Module Transitions
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100">
                  <IconCircleCheck size={13} className="text-emerald-500" /> Instant Band Score Calculation
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filter empty message */}
        {!isLoading && !isError && rawMockTests.length > 0 && filteredMockTests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-slate-200 text-center p-6 gap-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <IconSearch size={22} />
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-800">No matching mock tests</p>
              <p className="text-xs text-slate-500 mt-0.5">
                No mock tests match your current search query or filter criteria.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFilterTab("ALL");
              }}
              className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Mock Tests Cards Grid */}
        {!isLoading && !isError && filteredMockTests.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMockTests.map((mockTest) => {
              const dateLabel = mockTest.createdAt
                ? format(new Date(mockTest.createdAt), "MMM d, yyyy")
                : "Recently";

              const isConfirmingDelete = deletingId === mockTest.id;
              const isToggling =
                togglePublishMutation.isPending &&
                (togglePublishMutation.variables as any)?.id === mockTest.id;

              // Count how many modules are linked
              const linkedModules = [
                mockTest.listeningExamId,
                mockTest.readingExamId,
                mockTest.writingExamId,
                mockTest.speakingExamId,
              ].filter(Boolean).length;

              const isComplete = linkedModules === 4;

              return (
                <div
                  key={mockTest.id}
                  className={`group relative flex flex-col justify-between rounded-3xl bg-white border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-xl ${
                    mockTest.isPublished
                      ? "border-emerald-200/80 hover:border-emerald-300"
                      : "border-amber-200/80 hover:border-amber-300"
                  }`}
                >
                  {/* Top Colorful Accent Line */}
                  <div
                    className={`h-1.5 w-full ${
                      mockTest.isPublished
                        ? "bg-linear-to-r from-emerald-400 via-teal-500 to-cyan-500"
                        : "bg-linear-to-r from-amber-400 via-orange-400 to-amber-500"
                    }`}
                  />

                  <div className="p-5 space-y-4">
                    {/* Header Row: Status badge, Quick Toggle, Tier badge, and Date */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Live/Draft Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${
                            mockTest.isPublished
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              mockTest.isPublished
                                ? "bg-emerald-500 animate-pulse"
                                : "bg-amber-500"
                            }`}
                          />
                          <span>{mockTest.isPublished ? "Published" : "Draft"}</span>
                        </span>

                        {/* Free / Premium Tier Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${
                            mockTest.isPremium
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : "bg-emerald-50 text-emerald-800 border-emerald-300"
                          }`}
                        >
                          {mockTest.isPremium ? (
                            <>
                              <IconCrown size={11} className="fill-amber-500 text-amber-600" />
                              <span>Premium</span>
                            </>
                          ) : (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span>Free</span>
                            </>
                          )}
                        </span>

                        {/* Quick One-Click Status Toggle */}
                        <button
                          type="button"
                          disabled={isToggling}
                          onClick={() => handleTogglePublish(mockTest.id, mockTest.isPublished)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer active:scale-95 ${
                            mockTest.isPublished
                              ? "bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800"
                              : "bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800"
                          }`}
                          title={
                            mockTest.isPublished
                              ? "Click to unpublish and move to Draft"
                              : "Click to publish live for students"
                          }
                        >
                          {isToggling ? (
                            <IconLoader2 size={11} className="animate-spin" />
                          ) : (
                            <IconRotate size={11} />
                          )}
                          <span>{mockTest.isPublished ? "Draft" : "Publish"}</span>
                        </button>

                        {/* Quick One-Click Tier Toggle */}
                        <button
                          type="button"
                          disabled={
                            togglePremiumMutation.isPending &&
                            (togglePremiumMutation.variables as any)?.id === mockTest.id
                          }
                          onClick={() => handleTogglePremium(mockTest.id, Boolean(mockTest.isPremium))}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer active:scale-95 ${
                            mockTest.isPremium
                              ? "bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800"
                              : "bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800"
                          }`}
                          title={
                            mockTest.isPremium
                              ? "Click to switch to Free mock test"
                              : "Click to switch to Premium mock test"
                          }
                        >
                          {togglePremiumMutation.isPending &&
                          (togglePremiumMutation.variables as any)?.id === mockTest.id ? (
                            <IconLoader2 size={11} className="animate-spin" />
                          ) : (
                            <IconCrown size={11} className={mockTest.isPremium ? "text-slate-500" : "text-amber-500"} />
                          )}
                          <span>{mockTest.isPremium ? "Make Free" : "Make Pro"}</span>
                        </button>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold shrink-0">
                        <IconCalendar size={13} />
                        <span>{dateLabel}</span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-1">
                      <h3 className="font-black text-slate-900 group-hover:text-purple-600 transition-colors text-base line-clamp-1 leading-snug">
                        {mockTest.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed min-h-[32px]">
                        {mockTest.description || "Official Cambridge-standard CBT full IELTS test paper."}
                      </p>
                    </div>

                    {/* 4 Components Matrix */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Exam Modules
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            isComplete
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {linkedModules}/4 Ready
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                        {/* Listening */}
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${
                            mockTest.listeningExamId
                              ? "bg-blue-50/70 border-blue-200 text-blue-800"
                              : "bg-white border-dashed border-slate-200 text-slate-400"
                          }`}
                        >
                          <IconHeadset size={14} className={mockTest.listeningExamId ? "text-blue-600" : "text-slate-300"} />
                          <span className="truncate">Listening</span>
                          {mockTest.listeningExamId && <IconCircleCheck size={13} className="ml-auto text-blue-600 shrink-0" />}
                        </div>

                        {/* Reading */}
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${
                            mockTest.readingExamId
                              ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                              : "bg-white border-dashed border-slate-200 text-slate-400"
                          }`}
                        >
                          <IconBook2 size={14} className={mockTest.readingExamId ? "text-emerald-600" : "text-slate-300"} />
                          <span className="truncate">Reading</span>
                          {mockTest.readingExamId && <IconCircleCheck size={13} className="ml-auto text-emerald-600 shrink-0" />}
                        </div>

                        {/* Writing */}
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${
                            mockTest.writingExamId
                              ? "bg-amber-50/70 border-amber-200 text-amber-800"
                              : "bg-white border-dashed border-slate-200 text-slate-400"
                          }`}
                        >
                          <IconPencil size={14} className={mockTest.writingExamId ? "text-amber-600" : "text-slate-300"} />
                          <span className="truncate">Writing</span>
                          {mockTest.writingExamId && <IconCircleCheck size={13} className="ml-auto text-amber-600 shrink-0" />}
                        </div>

                        {/* Speaking */}
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${
                            mockTest.speakingExamId
                              ? "bg-rose-50/70 border-rose-200 text-rose-800"
                              : "bg-white border-dashed border-slate-200 text-slate-400"
                          }`}
                        >
                          <IconMicrophone size={14} className={mockTest.speakingExamId ? "text-rose-600" : "text-slate-300"} />
                          <span className="truncate">Speaking</span>
                          {mockTest.speakingExamId && <IconCircleCheck size={13} className="ml-auto text-rose-600 shrink-0" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                    {isConfirmingDelete ? (
                      <div className="flex items-center justify-between w-full bg-rose-50 border border-rose-200 rounded-xl p-2 animate-fadeIn">
                        <span className="text-[11px] font-bold text-rose-800 pl-1">
                          Delete test permanently?
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDelete(mockTest.id)}
                            disabled={deleteMutation.isPending}
                            className="px-3 py-1 text-[10px] font-black uppercase bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition cursor-pointer"
                          >
                            {deleteMutation.isPending ? "..." : "Delete"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="px-3 py-1 text-[10px] font-black uppercase bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Simulation / Student View Link */}
                        <Link
                          href={`/student/mock-tests/${mockTest.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 text-xs font-bold transition shadow-2xs hover:shadow-xs active:scale-95"
                          title="Open student test runner in new tab"
                        >
                          <IconExternalLink size={14} />
                          <span>Student View</span>
                        </Link>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDeletingId(mockTest.id)}
                            className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 active:scale-95 transition cursor-pointer"
                            title="Delete Mock Test"
                          >
                            <IconTrash size={15} />
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
