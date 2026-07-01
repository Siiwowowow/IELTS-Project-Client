/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { mockTestService } from "@/services/mocktest.services";
import {
  IconLoader2,
  IconAlertCircle,
  IconArrowRight,
  IconCheck,
  IconSparkles,
  IconClock,
  IconBook2,
  IconHeadset,
  IconPencil,
  IconMicrophone,
} from "@tabler/icons-react";

interface Props {
  params: Promise<{ attemptId: string }>;
}

const moduleOrder = ["listening", "reading", "writing", "speaking"];

export default function MockTestTransitionPage({ params }: Props) {
  const { attemptId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const mockTestId = searchParams.get("mockTestId");
  const completedModule = searchParams.get("completedModule");

  const [countdown, setCountdown] = useState(10);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Fetch Attempt Status
  const {
    data: responseData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["mock-attempt-transition", attemptId],
    queryFn: () => mockTestService.getAttemptById(attemptId),
  });

  const attempt = responseData?.data;

  // Determine the next incomplete section
  const getNextSection = () => {
    if (!attempt) return null;

    for (const mod of moduleOrder) {
      if (mod === "listening" && attempt.mockTest.listeningExamId && !attempt.listeningAttemptId) {
        return {
          module: "listening",
          examId: attempt.mockTest.listeningExamId,
          title: "Listening Section",
          duration: attempt.mockTest.listeningExam?.duration || 40,
          icon: IconHeadset,
          color: "text-blue-500 bg-blue-50/50 border-blue-100",
        };
      }
      if (mod === "reading" && attempt.mockTest.readingExamId && !attempt.readingAttemptId) {
        return {
          module: "reading",
          examId: attempt.mockTest.readingExamId,
          title: "Reading Section",
          duration: attempt.mockTest.readingExam?.duration || 60,
          icon: IconBook2,
          color: "text-emerald-500 bg-emerald-50/50 border-emerald-100",
        };
      }
      if (mod === "writing" && attempt.mockTest.writingExamId && !attempt.writingAttemptId) {
        return {
          module: "writing",
          examId: attempt.mockTest.writingExamId,
          title: "Writing Section",
          duration: attempt.mockTest.writingExam?.duration || 60,
          icon: IconPencil,
          color: "text-amber-500 bg-amber-50/50 border-amber-100",
        };
      }
      if (mod === "speaking" && attempt.mockTest.speakingExamId && !attempt.speakingAttemptId) {
        return {
          module: "speaking",
          examId: attempt.mockTest.speakingExamId,
          title: "Speaking Section",
          duration: attempt.mockTest.speakingExam?.duration || 15,
          icon: IconMicrophone,
          color: "text-rose-500 bg-rose-50/50 border-rose-100",
        };
      }
    }

    return null;
  };

  const nextSection = attempt ? getNextSection() : null;

  // Handle countdown
  useEffect(() => {
    if (isLoading || isError || !attempt || isRedirecting) return;

    if (countdown === 0) {
      handleProceed();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, isLoading, isError, attempt, isRedirecting]);

  const handleProceed = () => {
    if (isRedirecting) return;
    setIsRedirecting(true);

    if (nextSection) {
      router.push(
        `/practice/${nextSection.module}/${nextSection.examId}?mockAttemptId=${attemptId}&mockTestId=${mockTestId}&mode=continuous`
      );
    } else {
      router.push(`/student/mock-tests/${mockTestId}?attemptId=${attemptId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-3">
        <IconLoader2 className="animate-spin text-purple-500" size={40} />
        <p className="text-sm font-semibold text-slate-400">Loading next section details...</p>
      </div>
    );
  }

  if (isError || !attempt) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <IconAlertCircle className="text-rose-500 animate-bounce" size={48} />
        <h2 className="text-xl font-black">Simulation Error</h2>
        <p className="text-sm font-medium text-slate-400 max-w-sm">
          We encountered an issue determining the next test module.
        </p>
        <button
          onClick={() => router.push(`/student/mock-tests`)}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition duration-150"
        >
          Exit Simulator
        </button>
      </div>
    );
  }

  const NextIcon = nextSection ? nextSection.icon : IconCheck;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-lg w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-8 animate-fade-in">
        
        {/* Completed Section Notification */}
        {completedModule && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <IconCheck size={14} className="stroke-[3]" />
            <span>{completedModule} Completed</span>
          </div>
        )}

        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">
            {nextSection ? "Preparing Next Section" : "All Sections Completed"}
          </h1>
          <p className="text-slate-400 text-xs font-medium max-w-xs mx-auto leading-relaxed">
            {nextSection
              ? "Your answers have been saved. Take a brief breath. The next exam section will load automatically."
              : "Congratulations! You have completed all sections of the IELTS mock test simulation."}
          </p>
        </div>

        {/* Central visual panel */}
        {nextSection ? (
          <div className="py-6 px-4 bg-slate-800/40 border border-slate-800 rounded-2xl flex flex-col items-center gap-4">
            <div className={`h-16 w-16 rounded-2xl border flex items-center justify-center ${nextSection.color} shadow-lg shadow-purple-500/5`}>
              <NextIcon size={32} />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-lg font-black">{nextSection.title}</h2>
              <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-bold">
                <IconClock size={14} />
                <span>{nextSection.duration} Minutes Duration</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="py-6 px-4 bg-slate-800/40 border border-slate-800 rounded-2xl flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg">
              <IconSparkles size={32} />
            </div>
            <h2 className="text-lg font-black">Simulation Completed</h2>
            <p className="text-slate-400 text-xs font-semibold leading-relaxed">
              We are compiling your responses and generating your score report.
            </p>
          </div>
        )}

        {/* Countdown Indicator */}
        {nextSection && (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="h-20 w-20 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin-slow flex items-center justify-center text-2xl font-black tracking-tight text-purple-400">
              <span className="animate-pulse">{countdown}</span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">
              Seconds remaining
            </span>
          </div>
        )}

        {/* Proceed Action Button */}
        <div className="pt-2">
          <button
            onClick={handleProceed}
            disabled={isRedirecting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-purple-800 disabled:to-indigo-800 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-purple-600/20 active:scale-98 transition-all duration-200"
          >
            {isRedirecting ? (
              <>
                <IconLoader2 className="animate-spin" size={18} />
                <span>Loading Next Section...</span>
              </>
            ) : (
              <>
                <span>{nextSection ? "Proceed to Next Section" : "View Score Dashboard"}</span>
                <IconArrowRight size={16} className="stroke-[3]" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
