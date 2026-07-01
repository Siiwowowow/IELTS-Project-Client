/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { mockTestService } from "@/services/mocktest.services";
import {
  IconTrophy,
  IconClock,
  IconCheck,
  IconChevronRight,
  IconArrowLeft,
  IconLoader2,
  IconAlertCircle,
  IconBook2,
  IconHeadset,
  IconPencil,
  IconMicrophone,
  IconExternalLink,
  IconSparkles,
} from "@tabler/icons-react";
import Link from "next/link";

interface Props {
  params: Promise<{ mockTestId: string }>;
}

export default function StudentMockTestAttemptPage({ params }: Props) {
  const { mockTestId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");

  // Fetch Attempt details
  const {
    data: responseData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["mock-attempt", attemptId],
    queryFn: () => mockTestService.getAttemptById(attemptId!),
    enabled: !!attemptId,
  });

  const attempt = responseData?.data;

  // Poll attempt status every 10 seconds to keep it updated (useful if they complete a section)
  useEffect(() => {
    if (!attemptId) return;
    const interval = setInterval(() => {
      refetch();
    }, 10000);
    return () => clearInterval(interval);
  }, [attemptId, refetch]);

  if (!attemptId) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center space-y-4">
        <IconAlertCircle size={48} className="text-amber-500 mx-auto" />
        <h2 className="text-xl font-black text-gray-800">Invalid Attempt Session</h2>
        <p className="text-sm font-medium text-gray-500">
          No attempt session ID was found. Please return to the Mock Test list and start again.
        </p>
        <Link
          href="/student/mock-tests"
          className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm transition duration-150"
        >
          <IconArrowLeft size={16} />
          <span>Back to Mock Tests</span>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <IconLoader2 size={36} className="animate-spin text-purple-600" />
        <p className="text-sm font-semibold text-gray-500">Loading your test simulation...</p>
      </div>
    );
  }

  if (isError || !attempt) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center space-y-4">
        <IconAlertCircle size={48} className="text-rose-500 mx-auto" />
        <h2 className="text-xl font-black text-gray-800">Error Loading Test Session</h2>
        <p className="text-sm font-medium text-gray-500">
          We couldn't retrieve the details of this test simulation attempt.
        </p>
        <Link
          href="/student/mock-tests"
          className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm transition duration-150"
        >
          <span>Back to Mock Tests</span>
        </Link>
      </div>
    );
  }

  const {
    mockTest,
    readingAttempt,
    listeningAttempt,
    writingAttempt,
    speakingAttempt,
    allSectionsCompleted,
    allSectionsGraded,
    overallBandScore,
  } = attempt;

  // Build sequential links and states
  const examSections = [
    {
      id: "listening",
      title: "Listening Test",
      icon: IconHeadset,
      colorClass: "bg-blue-50 text-blue-600 border-blue-100",
      btnColor: "bg-blue-600 hover:bg-blue-700",
      duration: mockTest.listeningExam?.duration || 40,
      examId: mockTest.listeningExamId,
      attempt: listeningAttempt,
      url: `/practice/listening/${mockTest.listeningExamId}?mockAttemptId=${attemptId}&mockTestId=${mockTestId}`,
      reviewUrl: `/practice/listening/${mockTest.listeningExamId}/review/${listeningAttempt?.id}`,
    },
    {
      id: "reading",
      title: "Reading Test",
      icon: IconBook2,
      colorClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
      btnColor: "bg-emerald-600 hover:bg-emerald-700",
      duration: mockTest.readingExam?.duration || 60,
      examId: mockTest.readingExamId,
      attempt: readingAttempt,
      url: `/practice/reading/${mockTest.readingExamId}?mockAttemptId=${attemptId}&mockTestId=${mockTestId}`,
      reviewUrl: `/practice/reading/${mockTest.readingExamId}/review/${readingAttempt?.id}`,
    },
    {
      id: "writing",
      title: "Writing Test",
      icon: IconPencil,
      colorClass: "bg-amber-50 text-amber-600 border-amber-100",
      btnColor: "bg-amber-600 hover:bg-amber-700",
      duration: mockTest.writingExam?.duration || 60,
      examId: mockTest.writingExamId,
      attempt: writingAttempt,
      url: `/practice/writing/${mockTest.writingExamId}?mockAttemptId=${attemptId}&mockTestId=${mockTestId}`,
      reviewUrl: `/practice/writing/${mockTest.writingExamId}/review/${writingAttempt?.id}`,
    },
    {
      id: "speaking",
      title: "Speaking Test",
      icon: IconMicrophone,
      colorClass: "bg-rose-50 text-rose-600 border-rose-100",
      btnColor: "bg-rose-600 hover:bg-rose-700",
      duration: mockTest.speakingExam?.duration || 15,
      examId: mockTest.speakingExamId,
      attempt: speakingAttempt,
      url: `/practice/speaking/${mockTest.speakingExamId}?mockAttemptId=${attemptId}&mockTestId=${mockTestId}`,
      reviewUrl: `/practice/speaking/${mockTest.speakingExamId}/review/${speakingAttempt?.id}`,
    },
  ].filter((sec) => !!sec.examId);

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-4 py-6">
      {/* Top back link */}
      <div>
        <Link
          href="/student/mock-tests"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-slate-900 transition-colors"
        >
          <IconArrowLeft size={16} />
          <span>Exit Simulation Dashboard</span>
        </Link>
      </div>

      {/* Hero Header Area */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 text-white shadow-2xl">
        <div className="absolute right-0 top-0 -mr-24 -mt-24 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute left-1/3 bottom-0 -mb-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-[10px] font-black text-purple-300 uppercase tracking-widest">
              <IconTrophy size={12} className="text-amber-400" />
              <span>Official IELTS Simulation</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              {mockTest.title}
            </h1>
            <p className="text-slate-400 text-sm max-w-xl font-medium">
              {mockTest.description || "Simulate real test-day atmosphere. Complete sections one-by-one."}
            </p>
          </div>

          {/* Start continuous exam button if not completed */}
          {!allSectionsCompleted && (
            <Link
              href={`/student/mock-tests/run/${attemptId}/transition?mockTestId=${mockTestId}`}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 active:scale-95 transition-all duration-200 shrink-0 w-full md:w-auto justify-center"
            >
              <IconSparkles size={18} className="text-amber-400 fill-amber-400 animate-pulse" />
              <span>Start Continuous Exam</span>
              <IconChevronRight size={16} className="stroke-[3]" />
            </Link>
          )}

          {/* Overall score panel if completed */}
          {allSectionsCompleted && (
            <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 rounded-2xl p-5 shrink-0 w-full md:w-auto text-center md:text-right min-w-[200px] flex flex-col items-center md:items-end justify-center shadow-lg">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <IconTrophy size={14} className="text-purple-400" />
                <span>Overall Band Score</span>
              </span>
              
              {allSectionsGraded && overallBandScore != null ? (
                <div className="mt-1 flex items-baseline justify-center md:justify-end gap-1">
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                    {overallBandScore}
                  </span>
                  <span className="text-sm text-slate-400 font-bold">/ 9.0</span>
                </div>
              ) : (
                <div className="mt-2 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                  Awaiting Teacher Grading
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Section Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Modules Checklist */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span>Exam Components</span>
            <span className="text-xs text-gray-400 font-semibold">
              ({examSections.filter((s) => s.attempt?.status === "SUBMITTED").length}/{examSections.length} Complete)
            </span>
          </h2>

          <div className="space-y-4">
            {examSections.map((sec, index) => {
              const isCompleted = sec.attempt?.status === "SUBMITTED";
              const bandScore = sec.attempt?.bandScore;
              
              return (
                <div
                  key={sec.id}
                  className={`bg-white border-2 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 ${
                    isCompleted
                      ? "border-emerald-100 hover:border-emerald-200 bg-emerald-50/5"
                      : "border-gray-100 hover:border-purple-100"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon container */}
                    <div className={`h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 ${sec.colorClass}`}>
                      <sec.icon size={24} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-gray-800 text-sm md:text-base">
                          {sec.title}
                        </h3>
                        {isCompleted && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black uppercase rounded-md">
                            <IconCheck size={10} className="stroke-[3]" />
                            <span>Submitted</span>
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-gray-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <IconClock size={14} />
                          <span>{sec.duration} Minutes</span>
                        </span>
                        {isCompleted && (
                          <span className="text-slate-600 font-bold">
                            Band Score: {bandScore != null ? bandScore : "Awaiting Grading"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="self-end sm:self-auto shrink-0">
                    {isCompleted ? (
                      <Link
                        href={sec.reviewUrl}
                        className="inline-flex items-center gap-1 px-4 py-2 border-2 border-gray-100 hover:border-emerald-500 rounded-xl text-xs font-bold text-gray-500 hover:text-emerald-700 bg-white hover:bg-emerald-50/20 transition-all duration-150"
                      >
                        <span>Review answers</span>
                        <IconExternalLink size={14} />
                      </Link>
                    ) : (
                      <Link
                        href={sec.url}
                        className={`inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl ${sec.btnColor} text-white font-extrabold text-xs shadow-md active:scale-98 transition-all duration-150`}
                      >
                        <span>Start Component</span>
                        <IconChevronRight size={14} className="stroke-[3]" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info / Guidelines sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
            <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <IconTrophy className="text-purple-600" size={18} />
              <span>Exam Rules</span>
            </h3>
            
            <ul className="space-y-3.5 text-xs font-medium text-slate-600">
              <li className="flex items-start gap-2.5 leading-relaxed">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                <span>Answers are autosaved. Do not close your browser tab during sections.</span>
              </li>
              <li className="flex items-start gap-2.5 leading-relaxed">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                <span>Reading & Listening modules are auto-graded. Results appear instantly.</span>
              </li>
              <li className="flex items-start gap-2.5 leading-relaxed">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                <span>Writing & Speaking submissions will be evaluated manually by your instructor.</span>
              </li>
              <li className="flex items-start gap-2.5 leading-relaxed">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                <span>Overall IELTS score averages are rounded to the nearest 0.5 band score.</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
