/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { mockTestService } from "@/services/mocktest.services";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  IconTrophy,
  IconLoader2,
  IconAlertCircle,
  IconArrowRight,
  IconMoodSad,
  IconClock,
  IconSparkles,
  IconLock,
  IconCrown,
  IconSearch,
  IconFilter,
  IconBook,
  IconHeadphones,
  IconPencil,
  IconMicrophone,
  IconCircleCheck,
} from "@tabler/icons-react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";

export default function PublicFullMockTestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [startingId, setStartingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "FREE" | "PREMIUM">("ALL");

  // Fetch all published mock tests
  const {
    data: responseData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["public-mock-tests"],
    queryFn: () => mockTestService.getAllMockTests(),
  });

  const mockTests = responseData?.data ?? [];

  // Start Test Attempt Mutation
  const startAttemptMutation = useMutation({
    mutationFn: (mockTestId: string) => mockTestService.createAttempt(mockTestId),
    onSuccess: (res, mockTestId) => {
      toast.success("Exam simulation started!");
      router.push(`/student/mock-tests/${mockTestId}?attemptId=${res.data.id}`);
    },
    onError: (err: any) => {
      toast.error(
        "Failed to start mock test: " + (err?.response?.data?.message || err.message)
      );
      setStartingId(null);
    },
  });

  const handleStartTest = (mockTestId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }
    setStartingId(mockTestId);
    startAttemptMutation.mutate(mockTestId);
  };

  // Filtered mock tests
  const filteredMockTests = mockTests.filter((mockTest) => {
    const matchesSearch =
      mockTest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mockTest.description &&
        mockTest.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter =
      filterType === "ALL" ||
      (filterType === "FREE" && !mockTest.isPremium) ||
      (filterType === "PREMIUM" && mockTest.isPremium);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-6 px-4 sm:px-6 lg:px-8">

      {/* Premium Compact Dashboard Info Header */}
      <div className="bg-white border-2 border-neutral-100 rounded-3xl p-6 hover:border-red-500 transition-all duration-300 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2 flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-wider">
            <IconSparkles size={12} className="animate-pulse" />
            <span>Premium CBT Simulator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            IELTS Full Mock <span className="text-red-600">Examinations</span>
          </h1>
          <p className="text-sm text-neutral-500 font-medium leading-relaxed max-w-3xl">
            Simulate the exact computer-delivered IELTS environment (2 hours 45 mins) complete with auto-saving, section-locking, and advanced AI band score feedback.
          </p>
        </div>

        {/* User-friendly quick tips checklist */}
        <div className="w-full lg:w-auto shrink-0 bg-neutral-50 border border-neutral-200/60 rounded-2xl p-4 lg:min-w-[320px]">
          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2.5">
            Quick Checklist Before Starting
          </span>
          <ul className="space-y-2 text-xs font-semibold text-neutral-600">
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 font-black text-[10px]">1</span>
              <span>Quiet room & uninterrupted 2.75 hours.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 font-black text-[10px]">2</span>
              <span>External headphones & microphone.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 font-black text-[10px]">3</span>
              <span>All progress auto-saves continuously.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 border border-gray-100 rounded-2xl shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 shrink-0" size={18} />
          <input
            type="text"
            placeholder="Search mock exams by title or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-red-600 focus:bg-white transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:inline mr-2">
            Filter:
          </span>
          {[
            { id: "ALL", label: "All Tests" },
            { id: "FREE", label: "Free Tests" },
            { id: "PREMIUM", label: "Premium Tests" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterType === tab.id
                  ? "bg-red-600 text-white shadow-md shadow-red-100"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mock Tests Listings grid */}
      <section className="min-h-[400px]">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <IconLoader2 size={40} className="animate-spin text-red-600" />
            <p className="text-sm font-bold text-gray-500 animate-pulse">Loading mock tests...</p>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto space-y-4 bg-rose-50/50 border border-rose-100 rounded-3xl p-8">
            <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <IconAlertCircle size={28} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-rose-900">Failed to load mock tests</h3>
              <p className="text-sm font-medium text-rose-700 leading-relaxed">
                We encountered an error fetching the exam catalog. Please check your network connection or try again.
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-98"
            >
              Retry Loading
            </button>
          </div>
        )}

        {!isLoading && !isError && filteredMockTests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center max-w-sm mx-auto space-y-4 bg-gray-50/50 border border-gray-100 rounded-3xl p-8">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <IconMoodSad size={32} className="opacity-60" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-gray-800">No mock tests found</h3>
              <p className="text-sm font-medium text-gray-500 leading-relaxed">
                There are no mock exams matching your current search query or filter selection.
              </p>
            </div>
            {(searchQuery !== "" || filterType !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterType("ALL");
                }}
                className="px-5 py-2 bg-red-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:bg-red-700 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {!isLoading && !isError && filteredMockTests.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMockTests.map((mockTest) => {
              // Calculate total mock test duration
              const duration =
                (mockTest.listeningExam?.duration ?? 0) +
                (mockTest.readingExam?.duration ?? 0) +
                (mockTest.writingExam?.duration ?? 0) +
                (mockTest.speakingExam?.duration ?? 0);

              const isStarting = startingId === mockTest.id;
              const isLocked = mockTest.isPremium && !user?.isPremium;

              return (
                <div
                  key={mockTest.id}
                  className={`group relative bg-white border border-neutral-200/70 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:border-red-600 transition-all duration-500 overflow-hidden rounded-3xl p-6 flex flex-col justify-between min-h-[380px] hover:shadow-[0_20px_50px_rgba(220,38,38,0.06)] group-hover:-translate-y-1 ${
                    isLocked ? "border-amber-100 bg-gradient-to-b from-white to-amber-50/5" : ""
                  }`}
                >
                  <div className="space-y-5 flex-1">
                    {/* Header: Icon & Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 shadow-sm ${
                          isLocked
                            ? "bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white"
                            : "bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white"
                        }`}
                      >
                        <IconTrophy size={20} />
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-neutral-50 border border-neutral-200 text-neutral-600 text-[10px] font-extrabold uppercase rounded-lg tracking-wider">
                          <IconClock size={11} />
                          <span>{duration} Mins</span>
                        </span>

                        {mockTest.isPremium ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/10 text-amber-700 border border-amber-500/20 text-[10px] font-black uppercase rounded-lg tracking-wider">
                            <IconCrown size={10} className="fill-amber-400" />
                            <span>Premium</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[10px] font-black uppercase rounded-lg tracking-wider">
                            <span>Free</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title and Description */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-extrabold text-neutral-900 leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
                        {mockTest.title}
                      </h3>
                      {mockTest.description ? (
                        <p className="text-xs font-medium text-neutral-500 line-clamp-2 leading-relaxed">
                          {mockTest.description}
                        </p>
                      ) : (
                        <p className="text-xs font-medium text-neutral-400 italic">
                          Practice full IELTS exam simulation under test constraints.
                        </p>
                      )}
                    </div>

                    {/* Inclusion Modules List */}
                    <div className="pt-4 border-t border-neutral-100 space-y-2.5">
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">
                        Included Modules
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 bg-neutral-50/50 border border-neutral-200/50 rounded-xl px-2.5 py-1.5">
                          <IconHeadphones size={13} className={mockTest.listeningExamId ? "text-blue-500" : "text-neutral-300"} />
                          <span className={mockTest.listeningExamId ? "text-neutral-700 text-[11px]" : "text-neutral-400 line-through text-[11px]"}>Listening</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 bg-neutral-50/50 border border-neutral-200/50 rounded-xl px-2.5 py-1.5">
                          <IconBook size={13} className={mockTest.readingExamId ? "text-emerald-500" : "text-neutral-300"} />
                          <span className={mockTest.readingExamId ? "text-neutral-700 text-[11px]" : "text-neutral-400 line-through text-[11px]"}>Reading</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 bg-neutral-50/50 border border-neutral-200/50 rounded-xl px-2.5 py-1.5">
                          <IconPencil size={13} className={mockTest.writingExamId ? "text-amber-500" : "text-neutral-300"} />
                          <span className={mockTest.writingExamId ? "text-neutral-700 text-[11px]" : "text-neutral-400 line-through text-[11px]"}>Writing</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 bg-neutral-50/50 border border-neutral-200/50 rounded-xl px-2.5 py-1.5">
                          <IconMicrophone size={13} className={mockTest.speakingExamId ? "text-rose-500" : "text-neutral-300"} />
                          <span className={mockTest.speakingExamId ? "text-neutral-700 text-[11px]" : "text-neutral-400 line-through text-[11px]"}>Speaking</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Row - Full Width CTA */}
                  <div className="mt-6 pt-4 border-t border-neutral-100 w-full">
                    {isLocked ? (
                      <Link
                        href="/pricing"
                        className="w-full inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm shadow-md shadow-amber-200 active:scale-[0.98] transition-all duration-350"
                      >
                        <IconCrown size={14} className="fill-white" />
                        <span>Unlock Premium Test</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleStartTest(mockTest.id)}
                        disabled={isStarting}
                        className="w-full inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-neutral-950 text-white font-extrabold text-sm transition-all duration-300 hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isStarting ? (
                          <>
                            <IconLoader2 size={14} className="animate-spin text-white" />
                            <span>Initializing CBT...</span>
                          </>
                        ) : (
                          <>
                            <span>Start Simulation</span>
                            <IconArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
