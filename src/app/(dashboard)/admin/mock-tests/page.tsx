/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockTestService } from "@/services/mocktest.services";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  IconTrophy,
  IconLoader2,
  IconAlertCircle,
  IconTrash,
  IconCalendar,
  IconSparkles,
  IconBook2,
  IconHeadset,
  IconPencil,
  IconMicrophone,
  IconSearch,
  IconCircleCheck,
  IconRotate,
  IconClock,
  IconBolt,
  IconX,
  IconCrown,
  IconEye,
  IconUser,
  IconChartBar,
  IconShieldLock,
  IconCheck,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { ExamCardSkeleton } from "@/components/shared/ExamCardSkeleton";

type FilterTab = "ALL" | "PUBLISHED" | "DRAFT" | "FREE" | "PREMIUM";
type SortOption = "NEWEST" | "OLDEST" | "TITLE" | "ATTEMPTS";

export default function AdminMockTestsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("NEWEST");
  const [inspectingTestId, setInspectingTestId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch all mock tests across all creators
  const {
    data: responseData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-all-mock-tests"],
    queryFn: () => mockTestService.getAllMockTests(),
  });

  // Query single test details when inspecting
  const inspectingQuery = useQuery({
    queryKey: ["admin-mock-test-inspect", inspectingTestId],
    queryFn: () => (inspectingTestId ? mockTestService.getMockTestById(inspectingTestId) : null),
    enabled: Boolean(inspectingTestId),
  });

  // Toggle Publish / Draft Mutation
  const togglePublishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      mockTestService.updateMockTest(id, { isPublished }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.isPublished
          ? "Mock test is now live & published for all students!"
          : "Mock test moved to draft mode (hidden from students)."
      );
      queryClient.invalidateQueries({ queryKey: ["admin-all-mock-tests"] });
    },
    onError: (err: any) => {
      toast.error("Failed to update status: " + (err?.response?.data?.message || err.message));
    },
  });

  // Toggle Free / Premium Access Tier Mutation
  const togglePremiumMutation = useMutation({
    mutationFn: ({ id, isPremium }: { id: string; isPremium: boolean }) =>
      mockTestService.updateMockTest(id, { isPremium }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.isPremium
          ? "Mock test set to Premium (Paid Access Pass required)."
          : "Mock test set to Free (Accessible to all registered candidates)."
      );
      queryClient.invalidateQueries({ queryKey: ["admin-all-mock-tests"] });
    },
    onError: (err: any) => {
      toast.error("Failed to update tier: " + (err?.response?.data?.message || err.message));
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => mockTestService.deleteMockTest(id),
    onSuccess: () => {
      toast.success("Mock test removed permanently.");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-all-mock-tests"] });
    },
    onError: (err: any) => {
      toast.error("Failed to delete mock test: " + (err?.response?.data?.message || err.message));
      setDeletingId(null);
    },
  });

  const rawMockTests = responseData?.data ?? [];

  // Metrics
  const publishedCount = useMemo(
    () => rawMockTests.filter((m: any) => m.isPublished).length,
    [rawMockTests]
  );
  const draftCount = useMemo(
    () => rawMockTests.filter((m: any) => !m.isPublished).length,
    [rawMockTests]
  );
  const freeCount = useMemo(
    () => rawMockTests.filter((m: any) => !m.isPremium).length,
    [rawMockTests]
  );
  const premiumCount = useMemo(
    () => rawMockTests.filter((m: any) => m.isPremium).length,
    [rawMockTests]
  );
  const totalAttemptsCount = useMemo(
    () =>
      rawMockTests.reduce(
        (sum: number, m: any) => sum + (m._count?.attempts ?? m.attempts?.length ?? 0),
        0
      ),
    [rawMockTests]
  );

  // Filter & Search & Sort
  const filteredMockTests = useMemo(() => {
    return rawMockTests
      .filter((mock: any) => {
        if (filterTab === "PUBLISHED" && !mock.isPublished) return false;
        if (filterTab === "DRAFT" && mock.isPublished) return false;
        if (filterTab === "FREE" && mock.isPremium) return false;
        if (filterTab === "PREMIUM" && !mock.isPremium) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = mock.title?.toLowerCase().includes(q);
          const matchDesc = mock.description?.toLowerCase().includes(q);
          const matchCreator = mock.creatorEmail?.toLowerCase().includes(q);
          return matchTitle || matchDesc || matchCreator;
        }
        return true;
      })
      .sort((a: any, b: any) => {
        if (sortBy === "TITLE") {
          return (a.title || "").localeCompare(b.title || "");
        }
        if (sortBy === "ATTEMPTS") {
          const aCount = a._count?.attempts ?? a.attempts?.length ?? 0;
          const bCount = b._count?.attempts ?? b.attempts?.length ?? 0;
          return bCount - aCount;
        }
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return sortBy === "OLDEST" ? timeA - timeB : timeB - timeA;
      });
  }, [rawMockTests, filterTab, searchQuery, sortBy]);

  const handleTogglePublish = (id: string, currentStatus: boolean) => {
    togglePublishMutation.mutate({ id, isPublished: !currentStatus });
  };

  const handleTogglePremium = (id: string, currentPremium: boolean) => {
    togglePremiumMutation.mutate({ id, isPremium: !currentPremium });
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${title}"? This cannot be undone.`)) {
      setDeletingId(id);
      deleteMutation.mutate(id);
    }
  };

  const inspectingData = inspectingQuery.data?.data;

  return (
    <div className="max-w-[1500px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      {/* ─── 1. ADMIN COMMAND HEADER ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-400/40 text-[11px] font-black uppercase tracking-widest text-red-200">
                <IconShieldLock size={13} />
                <span>Admin Governance</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-[11px] font-black uppercase tracking-wider text-indigo-200">
                <IconSparkles size={12} className="text-amber-300" />
                <span>Global CBT Moderation</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25 shrink-0">
                <IconTrophy size={26} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Mock Tests Control Center
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
                  Oversee, inspect, moderate, and control access permissions for all IELTS Academic Full Mock Tests across the entire platform.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs transition active:scale-95 cursor-pointer"
            >
              <IconRotate size={15} className={isFetching ? "animate-spin" : ""} />
              <span>Refresh List</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. STATS & METRICS ROW ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            Total Full Mocks
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{rawMockTests.length}</span>
            <span className="text-xs font-semibold text-slate-400">Exams</span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 mt-1 block">Platform-wide</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
            Published Live
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{publishedCount}</span>
            <span className="text-xs font-semibold text-emerald-700/60">Active</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 mt-1 block">Live for students</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">
            Draft Mode
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{draftCount}</span>
            <span className="text-xs font-semibold text-amber-700/60">Hidden</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 mt-1 block">Under construction</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 block">
            Access Tiers
          </span>
          <div className="mt-1 flex items-center gap-3">
            <div>
              <span className="text-lg font-black text-emerald-700">{freeCount}</span>
              <span className="text-[10px] font-bold text-slate-400 block">Free</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-lg font-black text-amber-600 flex items-center gap-1">
                <IconCrown size={12} className="fill-amber-500" />
                {premiumCount}
              </span>
              <span className="text-[10px] font-bold text-slate-400 block">Premium</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">
            Student Attempts
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600">{totalAttemptsCount}</span>
            <span className="text-xs font-semibold text-blue-700/60">CBT Runs</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 mt-1 block">Candidate sessions</span>
        </div>
      </div>

      {/* ─── 3. FILTER, SEARCH & CONTROLS ───────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs">
        {/* Segmented Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              filterTab === "ALL"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            All ({rawMockTests.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("PUBLISHED")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
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
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
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
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
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
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              filterTab === "PREMIUM"
                ? "bg-white text-amber-700 shadow-xs"
                : "text-slate-500 hover:text-amber-700"
            }`}
          >
            <IconCrown size={12} className="fill-amber-500 text-amber-600" />
            <span>Premium ({premiumCount})</span>
          </button>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 sm:w-72">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, creator, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:border-red-600 focus:outline-hidden bg-slate-50/50"
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
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-red-600 focus:outline-hidden"
          >
            <option value="NEWEST">Sort: Newest First</option>
            <option value="OLDEST">Sort: Oldest First</option>
            <option value="TITLE">Sort: Alphabetical (A-Z)</option>
            <option value="ATTEMPTS">Sort: Most Attempted</option>
          </select>
        </div>
      </div>

      {/* ─── 4. MOCK TESTS LIST ──────────────────────────────────────── */}
      {isLoading && <ExamCardSkeleton count={6} />}

      {isError && (
        <div className="flex items-center gap-3 p-5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 font-semibold text-sm">
          <IconAlertCircle size={20} className="shrink-0" />
          <p>Failed to retrieve mock tests from server. Please refresh to try again.</p>
        </div>
      )}

      {!isLoading && !isError && rawMockTests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl text-center p-6 gap-3">
          <div className="size-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <IconTrophy size={32} />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">No Mock Tests on Platform</h3>
          <p className="text-xs text-slate-500 max-w-md">
            Teachers have not published any IELTS mock tests yet. Once created, they will appear here for administrative moderation and control.
          </p>
        </div>
      )}

      {!isLoading && !isError && rawMockTests.length > 0 && filteredMockTests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 rounded-3xl text-center p-6 gap-3">
          <IconSearch size={32} className="text-slate-300" />
          <p className="font-extrabold text-sm text-slate-800">No matching mock tests</p>
          <p className="text-xs text-slate-500">No mock tests match your current search or filter query.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setFilterTab("ALL");
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}

      {!isLoading && !isError && filteredMockTests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMockTests.map((mockTest: any) => {
            const dateLabel = mockTest.createdAt
              ? format(new Date(mockTest.createdAt), "MMM d, yyyy")
              : "Recently";

            const attemptsCount =
              mockTest._count?.attempts ?? mockTest.attempts?.length ?? 0;

            const isTogglingStatus =
              togglePublishMutation.isPending &&
              (togglePublishMutation.variables as any)?.id === mockTest.id;

            const isTogglingTier =
              togglePremiumMutation.isPending &&
              (togglePremiumMutation.variables as any)?.id === mockTest.id;

            const isDeleting = deletingId === mockTest.id;

            // Total Duration
            const totalDuration =
              (mockTest.listeningExam?.duration ?? 0) +
              (mockTest.readingExam?.duration ?? 0) +
              (mockTest.writingExam?.duration ?? 0) +
              (mockTest.speakingExam?.duration ?? 0);

            return (
              <div
                key={mockTest.id}
                className="group relative flex flex-col justify-between rounded-3xl bg-white border border-slate-200 hover:border-slate-300 transition-all duration-200 overflow-hidden shadow-xs hover:shadow-lg"
              >
                {/* Top Accent Strip */}
                <div
                  className={`h-1.5 w-full ${
                    mockTest.isPublished
                      ? mockTest.isPremium
                        ? "bg-linear-to-r from-amber-400 via-orange-400 to-amber-500"
                        : "bg-linear-to-r from-emerald-400 via-teal-500 to-cyan-500"
                      : "bg-linear-to-r from-slate-300 via-slate-400 to-slate-500"
                  }`}
                />

                <div className="p-5 space-y-4">
                  {/* Top Badges & Meta */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Live / Draft Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          mockTest.isPublished
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            mockTest.isPublished ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                          }`}
                        />
                        <span>{mockTest.isPublished ? "Live" : "Draft"}</span>
                      </span>

                      {/* Tier Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
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

                      {/* Attempts Badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-extrabold">
                        <IconChartBar size={11} />
                        <span>{attemptsCount} Attempts</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                      <IconCalendar size={13} />
                      <span>{dateLabel}</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 group-hover:text-red-600 transition-colors text-base line-clamp-1 leading-snug">
                      {mockTest.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed min-h-8">
                      {mockTest.description || "Official Cambridge-standard CBT full IELTS test paper."}
                    </p>
                  </div>

                  {/* Creator Info */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5">
                    <IconUser size={13} className="text-slate-400 shrink-0" />
                    <span className="text-[11px] font-semibold truncate">
                      Author: <span className="font-bold text-slate-700">{mockTest.creatorEmail || "Instructor (System)"}</span>
                    </span>
                  </div>

                  {/* 4 Modules Status Grid */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Module Structure</span>
                      <span className="text-slate-600">{totalDuration ? `${totalDuration}m Total` : "—"}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Listening */}
                      <div
                        className={`flex items-center gap-1.5 p-2 rounded-xl border ${
                          mockTest.listeningExam
                            ? "bg-white border-blue-100 text-blue-900"
                            : "bg-slate-100/50 border-dashed border-slate-200 text-slate-400"
                        }`}
                      >
                        <IconHeadset size={14} className={mockTest.listeningExam ? "text-blue-500" : "text-slate-300"} />
                        <div className="min-w-0 flex-1">
                          <span className="block text-[11px] font-extrabold truncate">
                            {mockTest.listeningExam ? mockTest.listeningExam.title : "Listening"}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-medium">
                            {mockTest.listeningExam ? `${mockTest.listeningExam.duration}m` : "Not Linked"}
                          </span>
                        </div>
                      </div>

                      {/* Reading */}
                      <div
                        className={`flex items-center gap-1.5 p-2 rounded-xl border ${
                          mockTest.readingExam
                            ? "bg-white border-emerald-100 text-emerald-900"
                            : "bg-slate-100/50 border-dashed border-slate-200 text-slate-400"
                        }`}
                      >
                        <IconBook2 size={14} className={mockTest.readingExam ? "text-emerald-500" : "text-slate-300"} />
                        <div className="min-w-0 flex-1">
                          <span className="block text-[11px] font-extrabold truncate">
                            {mockTest.readingExam ? mockTest.readingExam.title : "Reading"}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-medium">
                            {mockTest.readingExam ? `${mockTest.readingExam.duration}m` : "Not Linked"}
                          </span>
                        </div>
                      </div>

                      {/* Writing */}
                      <div
                        className={`flex items-center gap-1.5 p-2 rounded-xl border ${
                          mockTest.writingExam
                            ? "bg-white border-amber-100 text-amber-900"
                            : "bg-slate-100/50 border-dashed border-slate-200 text-slate-400"
                        }`}
                      >
                        <IconPencil size={14} className={mockTest.writingExam ? "text-amber-500" : "text-slate-300"} />
                        <div className="min-w-0 flex-1">
                          <span className="block text-[11px] font-extrabold truncate">
                            {mockTest.writingExam ? mockTest.writingExam.title : "Writing"}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-medium">
                            {mockTest.writingExam ? `${mockTest.writingExam.duration}m` : "Not Linked"}
                          </span>
                        </div>
                      </div>

                      {/* Speaking */}
                      <div
                        className={`flex items-center gap-1.5 p-2 rounded-xl border ${
                          mockTest.speakingExam
                            ? "bg-white border-rose-100 text-rose-900"
                            : "bg-slate-100/50 border-dashed border-slate-200 text-slate-400"
                        }`}
                      >
                        <IconMicrophone size={14} className={mockTest.speakingExam ? "text-rose-500" : "text-slate-300"} />
                        <div className="min-w-0 flex-1">
                          <span className="block text-[11px] font-extrabold truncate">
                            {mockTest.speakingExam ? mockTest.speakingExam.title : "Speaking"}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-medium">
                            {mockTest.speakingExam ? `${mockTest.speakingExam.duration}m` : "Not Linked"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Administrative Controls Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Status Toggle */}
                    <button
                      type="button"
                      disabled={isTogglingStatus}
                      onClick={() => handleTogglePublish(mockTest.id, mockTest.isPublished)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer active:scale-95 ${
                        mockTest.isPublished
                          ? "bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      }`}
                      title={mockTest.isPublished ? "Set to Draft" : "Publish Live"}
                    >
                      {isTogglingStatus ? (
                        <IconLoader2 size={12} className="animate-spin" />
                      ) : (
                        <IconRotate size={12} />
                      )}
                      <span>{mockTest.isPublished ? "Unpublish" : "Publish"}</span>
                    </button>

                    {/* Tier Toggle */}
                    <button
                      type="button"
                      disabled={isTogglingTier}
                      onClick={() => handleTogglePremium(mockTest.id, Boolean(mockTest.isPremium))}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer active:scale-95 ${
                        mockTest.isPremium
                          ? "bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200"
                          : "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                      }`}
                      title={mockTest.isPremium ? "Make Free for all candidates" : "Make Premium (Paid)"}
                    >
                      {isTogglingTier ? (
                        <IconLoader2 size={12} className="animate-spin" />
                      ) : (
                        <IconCrown size={12} className={mockTest.isPremium ? "text-slate-500" : "fill-white"} />
                      )}
                      <span>{mockTest.isPremium ? "Make Free" : "Make Pro"}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Inspect Button */}
                    <button
                      type="button"
                      onClick={() => setInspectingTestId(mockTest.id)}
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer active:scale-95"
                      title="Inspect full mock test paper"
                    >
                      <IconEye size={16} />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDelete(mockTest.id, mockTest.title)}
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer active:scale-95"
                      title="Delete mock test permanently"
                    >
                      {isDeleting ? (
                        <IconLoader2 size={16} className="animate-spin text-rose-600" />
                      ) : (
                        <IconTrash size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 5. INSPECTION MODAL / DRAWER ────────────────────────────── */}
      {inspectingTestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-red-600 block">
                  Admin Inspection View
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-0.5">
                  {inspectingQuery.isLoading ? "Loading Mock Test..." : inspectingData?.title || "Mock Test Details"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setInspectingTestId(null)}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {inspectingQuery.isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <IconLoader2 size={32} className="animate-spin text-red-600" />
                  <p className="text-xs font-bold">Fetching comprehensive mock test schema...</p>
                </div>
              ) : inspectingData ? (
                <>
                  {/* Overview Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Status</span>
                      <span className={`inline-block font-extrabold ${inspectingData.isPublished ? "text-emerald-600" : "text-amber-600"}`}>
                        {inspectingData.isPublished ? "🟢 Published Live" : "📝 Draft Mode"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Access Tier</span>
                      <span className={`inline-block font-extrabold ${inspectingData.isPremium ? "text-amber-600" : "text-emerald-600"}`}>
                        {inspectingData.isPremium ? "👑 Premium (Paid)" : "🆓 Free Mock"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Author Email</span>
                      <span className="font-bold text-slate-800 truncate block">
                        {inspectingData.creatorEmail || "System"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Total Attempts</span>
                      <span className="font-bold text-blue-600 block">
                        {inspectingData.attempts?.length ?? 0} Candidate Attempts
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {inspectingData.description && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Exam Guidelines / Description
                      </h4>
                      <p className="text-xs text-slate-600 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {inspectingData.description}
                      </p>
                    </div>
                  )}

                  {/* 4 Modules Details */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Module Deep Dive
                    </h4>

                    <div className="space-y-3">
                      {/* Listening */}
                      <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-blue-900 flex items-center gap-1.5">
                            <IconHeadset size={16} className="text-blue-600" />
                            Listening Module
                          </span>
                          <span className="text-xs font-bold text-blue-700">
                            {inspectingData.listeningExam?.duration ?? 0} Mins
                          </span>
                        </div>
                        {inspectingData.listeningExam ? (
                          <div className="text-xs text-slate-600 space-y-1">
                            <p className="font-semibold text-slate-800">{inspectingData.listeningExam.title}</p>
                            <p className="text-[11px] text-slate-500">
                              {inspectingData.listeningExam.sections?.length ?? 4} Sections with integrated audio & questions.
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No listening exam linked.</p>
                        )}
                      </div>

                      {/* Reading */}
                      <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-emerald-900 flex items-center gap-1.5">
                            <IconBook2 size={16} className="text-emerald-600" />
                            Reading Module
                          </span>
                          <span className="text-xs font-bold text-emerald-700">
                            {inspectingData.readingExam?.duration ?? 0} Mins
                          </span>
                        </div>
                        {inspectingData.readingExam ? (
                          <div className="text-xs text-slate-600 space-y-1">
                            <p className="font-semibold text-slate-800">{inspectingData.readingExam.title}</p>
                            <p className="text-[11px] text-slate-500">
                              {inspectingData.readingExam.passages?.length ?? 3} Passages with interactive CBT question types.
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No reading exam linked.</p>
                        )}
                      </div>

                      {/* Writing */}
                      <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-amber-900 flex items-center gap-1.5">
                            <IconPencil size={16} className="text-amber-600" />
                            Writing Module
                          </span>
                          <span className="text-xs font-bold text-amber-700">
                            {inspectingData.writingExam?.duration ?? 0} Mins
                          </span>
                        </div>
                        {inspectingData.writingExam ? (
                          <div className="text-xs text-slate-600 space-y-1">
                            <p className="font-semibold text-slate-800">{inspectingData.writingExam.title}</p>
                            <p className="text-[11px] text-slate-500">
                              Task 1 & Task 2 prompts configured for real-time word counting & submission.
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No writing exam linked.</p>
                        )}
                      </div>

                      {/* Speaking */}
                      <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-rose-900 flex items-center gap-1.5">
                            <IconMicrophone size={16} className="text-rose-600" />
                            Speaking Module
                          </span>
                          <span className="text-xs font-bold text-rose-700">
                            {inspectingData.speakingExam?.duration ?? 0} Mins
                          </span>
                        </div>
                        {inspectingData.speakingExam ? (
                          <div className="text-xs text-slate-600 space-y-1">
                            <p className="font-semibold text-slate-800">{inspectingData.speakingExam.title}</p>
                            <p className="text-[11px] text-slate-500">
                              {inspectingData.speakingExam.parts?.length ?? 3} Parts with Cue Card recorder and examiner questions.
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No speaking exam linked.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setInspectingTestId(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
