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
  IconCheck,
  IconLock,
  IconCrown,
} from "@tabler/icons-react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";

export default function StudentMockTestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [startingId, setStartingId] = useState<string | null>(null);

  // Fetch published mock tests
  const {
    data: responseData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["student-mock-tests"],
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

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6 px-4">
      {/* Header banner */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2.5 uppercase tracking-tight">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md">
            <IconTrophy size={24} />
          </span>
          IELTS Mock Tests
        </h1>
        <p className="text-sm font-medium text-gray-500 mt-2 ml-12">
          Experience real exam conditions with our full 2 hour 45 minute IELTS Computer-Based (CBT) mock tests.
        </p>
      </div>

      {/* Main List Grid */}
      <section>
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <IconLoader2 size={32} className="animate-spin text-purple-600" />
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 font-medium">
            <IconAlertCircle size={20} className="shrink-0" />
            <p className="text-sm">Failed to load mock tests. Please refresh and try again.</p>
          </div>
        )}

        {!isLoading && !isError && mockTests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3 bg-white border border-gray-100 rounded-2xl">
            <IconMoodSad size={48} className="opacity-30" />
            <p className="text-sm font-medium">No full mock tests available yet.</p>
          </div>
        )}

        {!isLoading && !isError && mockTests.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockTests.map((mockTest) => {
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
                  className={`group relative bg-white border-2 rounded-2xl p-6 transition-all duration-300 overflow-hidden flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${
                    isLocked ? "border-amber-100 hover:border-amber-400" : "border-gray-100 hover:border-purple-600"
                  }`}
                >
                  {/* Subtle top accent */}
                  <div className={`absolute top-0 left-0 w-full h-1 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300 ${
                    isLocked ? "bg-amber-500" : "bg-purple-600"
                  }`} />

                  <div className="space-y-4">
                    {/* Icon header */}
                    <div className="flex items-start justify-between">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                        isLocked 
                          ? "bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white"
                          : "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white"
                      }`}>
                        <IconTrophy size={24} />
                      </div>
                      
                      <div className={`flex items-center justify-center h-8 w-8 rounded-full transition-colors ${
                        isLocked
                          ? "bg-amber-50 text-amber-500 group-hover:bg-amber-100"
                          : "bg-slate-50 text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600"
                      }`}>
                        {isLocked ? (
                          <IconCrown size={16} className="fill-amber-400 animate-bounce" />
                        ) : !user ? (
                          <IconLock size={16} />
                        ) : (
                          <IconArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                        )}
                      </div>
                    </div>

                    {/* Title & description */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-lg font-black leading-snug transition-colors line-clamp-2 ${
                          isLocked ? "text-amber-900 group-hover:text-amber-600" : "text-black group-hover:text-purple-600"
                        }`}>
                          {mockTest.title}
                        </h3>
                        {mockTest.isPremium && (
                          <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 bg-amber-500/15 text-amber-700 border border-amber-500/20 text-[9px] font-black uppercase rounded-md tracking-wider">
                            Premium
                          </span>
                        )}
                      </div>
                      {mockTest.description && (
                        <p className="text-sm font-medium text-gray-500 line-clamp-2 leading-relaxed">
                          {mockTest.description}
                        </p>
                      )}
                    </div>

                    {/* Inclusion items */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                      {mockTest.listeningExamId && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase rounded-md">
                          Listening
                        </span>
                      )}
                      {mockTest.readingExamId && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded-md">
                          Reading
                        </span>
                      )}
                      {mockTest.writingExamId && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase rounded-md">
                          Writing
                        </span>
                      )}
                      {mockTest.speakingExamId && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-black uppercase rounded-md">
                          Speaking
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions / Info row */}
                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="flex items-center gap-1 text-xs font-bold text-gray-400">
                      <IconClock size={14} />
                      <span>{duration} Mins</span>
                    </span>

                    {isLocked ? (
                      <Link
                        href="/pricing"
                        className="inline-flex items-center gap-1 px-4.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-200 active:scale-98 transition duration-150"
                      >
                        <IconCrown size={14} className="fill-white" />
                        <span>Unlock Test</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleStartTest(mockTest.id)}
                        disabled={isStarting}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white font-extrabold text-xs shadow-md shadow-purple-200 hover:bg-purple-700 active:scale-98 transition duration-150"
                      >
                        {isStarting ? (
                          <>
                            <IconLoader2 size={12} className="animate-spin" />
                            <span>Initializing...</span>
                          </>
                        ) : (
                          <span>Start Simulation</span>
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
