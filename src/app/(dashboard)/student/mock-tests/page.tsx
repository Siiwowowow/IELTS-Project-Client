/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  IconLock,
  IconCrown,
} from "@tabler/icons-react";
import { useAuth } from "@/providers/AuthProvider";
import { ExamCardSkeleton } from "@/components/shared/ExamCardSkeleton";
import SamplePaymentModal from "@/components/MockTest/SamplePaymentModal";

const examCopy = (value?: string | null) =>
  value?.replace(/mock test/gi, "Full Test").replace(/simulation/gi, "test") ?? "";

export default function StudentMockTestsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [startingId, setStartingId] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedMockTestForPayment, setSelectedMockTestForPayment] = useState<any>(null);

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
      toast.success("Your test is ready.");
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
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 text-black [&_*]:!text-black">
      {/* Header banner */}
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-black bg-white">
            <IconTrophy size={24} />
          </span>
          IELTS Full Tests
        </h1>
        <p className="text-sm font-medium text-gray-500 mt-2 ml-12">
          Complete Listening, Reading, Writing and Speaking under timed test conditions.
        </p>
      </div>

      {/* Main List Grid */}
      <section>
        {isLoading && <ExamCardSkeleton count={6} />}

        {isError && (
          <div className="flex items-center gap-3 rounded-xl border border-neutral-300 bg-white p-4 font-medium">
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
                  className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-neutral-300 bg-white p-6 transition hover:border-black"
                >
                  {/* Subtle top accent */}
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-black opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="space-y-4">
                    {/* Icon header */}
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white">
                        <IconTrophy size={24} />
                      </div>
                      
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white">
                        {isLocked ? (
                          <IconCrown size={16} />
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
                        <h3 className="line-clamp-2 text-lg font-semibold leading-snug">
                          {examCopy(mockTest.title)}
                        </h3>
                        {mockTest.isPremium && (
                          <span className="inline-flex items-center gap-0.5 rounded-full border border-black bg-white px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                            Premium
                          </span>
                        )}
                      </div>
                      {mockTest.description && (
                        <p className="text-sm font-medium text-gray-500 line-clamp-2 leading-relaxed">
                          {examCopy(mockTest.description)}
                        </p>
                      )}
                    </div>

                    {/* Inclusion items */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                      {mockTest.listeningExamId && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase">
                          Listening
                        </span>
                      )}
                      {mockTest.readingExamId && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase">
                          Reading
                        </span>
                      )}
                      {mockTest.writingExamId && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase">
                          Writing
                        </span>
                      )}
                      {mockTest.speakingExamId && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase">
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
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMockTestForPayment(mockTest);
                          setPaymentModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-black bg-white px-4 py-2 text-xs font-semibold transition hover:bg-neutral-100"
                      >
                        <IconCrown size={14} className="fill-white" />
                        <span>Unlock Test</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartTest(mockTest.id)}
                        disabled={isStarting}
                        className="inline-flex items-center gap-1.5 rounded-md border border-black bg-white px-4 py-2 text-xs font-semibold transition hover:bg-neutral-100 disabled:opacity-50"
                      >
                        {isStarting ? (
                          <>
                            <IconLoader2 size={12} className="animate-spin" />
                            <span>Initializing...</span>
                          </>
                        ) : (
                          <span>Begin test</span>
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

      {/* Sample Payment Modal for Demo Checkout */}
      <SamplePaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedMockTestForPayment(null);
        }}
        mockTestTitle={examCopy(selectedMockTestForPayment?.title)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["student-mock-tests"] });
        }}
      />
    </div>
  );
}
