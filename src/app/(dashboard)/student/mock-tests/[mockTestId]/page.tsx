/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { mockTestService } from "@/services/mocktest.services";
import { writingService } from "@/services/writing.services";
import { speakingService } from "@/services/speaking.services";
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
  IconRefresh,
} from "@tabler/icons-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  writingAssessmentStorageKey,
  WritingAssessment,
  StoredWritingAssessment,
} from "@/types/writing-assessment.types";
import {
  speakingAssessmentStorageKey,
  SpeakingQuestionAssessment,
  StoredSpeakingAssessment,
} from "@/types/speaking-assessment.types";

interface Props {
  params: Promise<{ mockTestId: string }>;
}

function bandLabel(band: number): string {
  if (band >= 8.5) return "Expert User";
  if (band >= 7.5) return "Very Good User";
  if (band >= 6.5) return "Competent / Good User";
  if (band >= 5.5) return "Modest User";
  if (band >= 4.5) return "Limited User";
  return "Extremely Limited User";
}

const examCopy = (value?: string | null) =>
  value?.replace(/mock test/gi, "Full Test").replace(/simulation/gi, "test") ?? "";

export default function StudentMockTestAttemptPage({ params }: Props) {
  const { mockTestId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");

  const [isAssessingMock, setIsAssessingMock] = useState(false);
  const [assessingProgress, setAssessingProgress] = useState<string | null>(null);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const assessmentTriggeredRef = useRef(false);

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

  // Poll attempt status every 15 seconds if not currently running AI assessment
  useEffect(() => {
    if (!attemptId || isAssessingMock) return;
    const interval = setInterval(() => {
      refetch();
    }, 15000);
    return () => clearInterval(interval);
  }, [attemptId, isAssessingMock, refetch]);

  // Assess Writing sub-attempt helper
  const assessWritingAttempt = async (attemptIdToGrade: string) => {
    // 1. Check if already evaluated in localStorage
    const cached = localStorage.getItem(writingAssessmentStorageKey(attemptIdToGrade));
    if (cached) {
      try {
        const parsed: StoredWritingAssessment = JSON.parse(cached);
        if (parsed.tasks && Object.keys(parsed.tasks).length > 0) {
          const review = await writingService.getAttemptReview(attemptIdToGrade);
          const responses = review.data.responses || [];
          const grades = responses.map((res: any) => {
            const tAssess = parsed.tasks[res.taskId];
            const isT1 = tAssess?.taskType === "TASK_1";
            const ta = isT1
              ? (tAssess?.criteria as any)?.taskAchievement?.score ?? 6.0
              : (tAssess?.criteria as any)?.taskResponse?.score ?? 6.0;
            const cc = tAssess?.criteria?.coherenceCohesion?.score ?? 6.0;
            const lr = tAssess?.criteria?.lexicalResource?.score ?? 6.0;
            const gra = tAssess?.criteria?.grammaticalRangeAccuracy?.score ?? 6.0;
            return {
              responseId: res.id,
              taskAchievement: Number(ta),
              coherenceCohesion: Number(cc),
              lexicalResource: Number(lr),
              grammaticalRange: Number(gra),
              feedback: tAssess?.summaryBn || "AI evaluated",
            };
          });
          if (grades.length > 0) {
            await writingService.gradeAttempt(attemptIdToGrade, { grades });
            return;
          }
        }
      } catch (err) {
        console.warn("Cached writing assessment parse error:", err);
      }
    }

    // 2. Fetch attempt review and call assessTask
    const review = await writingService.getAttemptReview(attemptIdToGrade);
    const responses = review.data.responses || [];
    const examTasks = review.data.exam?.tasks || [];
    const taskAssessments: Record<string, WritingAssessment> = {};

    for (let i = 0; i < responses.length; i++) {
      const resp = responses[i];
      const task = examTasks.find((t: any) => t.id === resp.taskId) || resp.task || {};
      const isT1 = task.taskType === "TASK_1";
      setAssessingProgress(
        `Writing Task ${i + 1} বিশ্লেষণ করা হচ্ছে (${i + 1}/${responses.length}) — grammar, spelling এবং IELTS criteria যাচাই চলছে...`
      );

      const assessmentResult = await writingService.assessTask({
        examType: review.data.exam?.examType ?? "ACADEMIC",
        taskType: task.taskType || (isT1 ? "TASK_1" : "TASK_2"),
        prompt: task.instruction || "",
        essay: resp.response || "",
        minWords: task.minWords ?? (isT1 ? 150 : 250),
        imageUrl: task.imageUrl || null,
      });

      taskAssessments[resp.taskId] = assessmentResult;
    }

    // Calculate overall band
    const t1 = responses.find((r: any) => {
      const t = examTasks.find((x: any) => x.id === r.taskId) || r.task;
      return t?.taskType === "TASK_1";
    });
    const t2 = responses.find((r: any) => {
      const t = examTasks.find((x: any) => x.id === r.taskId) || r.task;
      return t?.taskType === "TASK_2";
    });

    const t1Band = t1 ? taskAssessments[t1.taskId]?.taskBandScore : undefined;
    const t2Band = t2 ? taskAssessments[t2.taskId]?.taskBandScore : undefined;
    const rawOverall =
      t1Band !== undefined && t2Band !== undefined
        ? (t1Band + t2Band * 2) / 3
        : t2Band ?? t1Band ?? 6.0;

    const completed: StoredWritingAssessment = {
      version: 1,
      attemptId: attemptIdToGrade,
      createdAt: new Date().toISOString(),
      overallBand: Math.max(0, Math.min(9, Math.round(rawOverall * 2) / 2)),
      tasks: taskAssessments,
    };

    localStorage.setItem(writingAssessmentStorageKey(attemptIdToGrade), JSON.stringify(completed));

    // Grade attempt in database
    const grades = responses.map((res: any) => {
      const tAssess = taskAssessments[res.taskId];
      const isT1 = tAssess?.taskType === "TASK_1";
      const ta = isT1
        ? (tAssess?.criteria as any)?.taskAchievement?.score ?? 6.0
        : (tAssess?.criteria as any)?.taskResponse?.score ?? 6.0;
      const cc = tAssess?.criteria?.coherenceCohesion?.score ?? 6.0;
      const lr = tAssess?.criteria?.lexicalResource?.score ?? 6.0;
      const gra = tAssess?.criteria?.grammaticalRangeAccuracy?.score ?? 6.0;
      return {
        responseId: res.id,
        taskAchievement: Number(ta),
        coherenceCohesion: Number(cc),
        lexicalResource: Number(lr),
        grammaticalRange: Number(gra),
        feedback: tAssess?.summaryBn || "AI evaluated",
      };
    });

    if (grades.length > 0) {
      await writingService.gradeAttempt(attemptIdToGrade, { grades });
    }
  };

  // Assess Speaking sub-attempt helper
  const assessSpeakingAttempt = async (attemptIdToGrade: string) => {
    // 1. Check if already evaluated in localStorage
    const cached = localStorage.getItem(speakingAssessmentStorageKey(attemptIdToGrade));
    if (cached) {
      try {
        const parsed: StoredSpeakingAssessment = JSON.parse(cached);
        if (parsed.answers && Object.keys(parsed.answers).length > 0) {
          const review = await speakingService.getAttemptReview(attemptIdToGrade);
          const answers = review.data.answers || [];
          const gradesArray = answers.map((ans: any) => {
            const aiQ = parsed.answers[ans.questionId];
            return {
              answerId: ans.id,
              fluencyScore: aiQ ? aiQ.fluencyScore : parsed.fluencyScore,
              lexicalScore: aiQ ? aiQ.lexicalScore : parsed.lexicalScore,
              grammarScore: aiQ ? aiQ.grammarScore : parsed.grammarScore,
              pronunciationScore: aiQ ? aiQ.pronunciationScore : parsed.pronunciationScore,
              feedback: aiQ ? aiQ.feedbackBn : parsed.summaryBn,
            };
          });
          if (gradesArray.length > 0) {
            await speakingService.gradeAttempt(attemptIdToGrade, { grades: gradesArray });
            return;
          }
        }
      } catch (err) {
        console.warn("Cached speaking assessment parse error:", err);
      }
    }

    // 2. Fetch speaking attempt review and call assessQuestion
    const review = await speakingService.getAttemptReview(attemptIdToGrade);
    const parts = (review.data.exam?.parts || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
    const answers = review.data.answers || [];
    const assessedAnswers: Record<string, SpeakingQuestionAssessment> = {};

    const itemsToAssess: Array<{ q: any; part: any; answer: any }> = [];
    parts.forEach((part: any) => {
      const pQuestions = (part.questions || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      pQuestions.forEach((q: any) => {
        const answer = answers.find((ans: any) => ans.questionId === q.id);
        itemsToAssess.push({ q, part, answer });
      });
    });

    for (let i = 0; i < itemsToAssess.length; i++) {
      const item = itemsToAssess[i];
      setAssessingProgress(
        `Speaking Part ${item.part.partNumber} Q${item.q.order} মূল্যায়ন করা হচ্ছে (${i + 1}/${itemsToAssess.length}) — Audio transcription ও rubrics যাচাই চলছে...`
      );

      const result: SpeakingQuestionAssessment = await speakingService.assessQuestion({
        questionId: item.q.id,
        answerId: item.answer?.id || `ans-${item.q.id}`,
        audioUrl: item.answer?.audioUrl || null,
        partNumber: item.part.partNumber,
        partTitle: item.part.title,
        questionText: item.q.questionText,
        instruction: item.part.instruction || undefined,
      });

      assessedAnswers[item.q.id] = result;
    }

    // Calculate averages across answers
    const list = Object.values(assessedAnswers);
    const validAnswers = list.filter((a) => a.bandScore > 1.5);
    const evalSource = validAnswers.length > 0 ? validAnswers : list;

    const calcAvg = (nums: number[]) =>
      nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 6.0;
    const clampHalf = (v: number) => Math.max(0, Math.min(9, Math.round(v * 2) / 2));

    const fcScore = clampHalf(calcAvg(evalSource.map((s) => s.fluencyScore)));
    const lrScore = clampHalf(calcAvg(evalSource.map((s) => s.lexicalScore)));
    const graScore = clampHalf(calcAvg(evalSource.map((s) => s.grammarScore)));
    const prScore = clampHalf(calcAvg(evalSource.map((s) => s.pronunciationScore)));
    const overallBand = clampHalf((fcScore + lrScore + graScore + prScore) / 4);

    const storedReport: StoredSpeakingAssessment = {
      version: 1,
      attemptId: attemptIdToGrade,
      createdAt: new Date().toISOString(),
      overallBand,
      fluencyScore: fcScore,
      lexicalScore: lrScore,
      grammarScore: graScore,
      pronunciationScore: prScore,
      fluencyCoherence: {
        score: fcScore,
        rationaleBn: "বক্তব্যের গতি ও প্রাসঙ্গিক সংযোগকারী শব্দের প্রয়োগের ভিত্তিতে নির্ধারিত।",
        strengths: ["স্বাভাবিক উপস্থাপনা"],
        improvements: ["আরও বৈচিত্র্যময় ট্রানজিশন ব্যবহার"],
      },
      lexicalResource: {
        score: lrScore,
        rationaleBn: "ব্যবহৃত শব্দভাণ্ডারের পরিসর ও নির্ভুলতার ভিত্তিতে মূল্যায়িত।",
        strengths: ["যথাযথ শব্দ নির্বাচন"],
        improvements: ["উচ্চতর একাডেমিক ভোকাবুলারি ব্যবহার"],
      },
      grammaticalRangeAccuracy: {
        score: graScore,
        rationaleBn: "বাক্য কাঠামোর বৈচিত্র্য ও ব্যাকরণগত নির্ভুলতা বিশ্লেষণ করা হয়েছে।",
        strengths: ["মৌলিক বাক্য কাঠামোর নির্ভুলতা"],
        improvements: ["জটিল ও যৌগিক বাক্যের প্রয়োগ বাড়ানো"],
      },
      pronunciation: {
        score: prScore,
        rationaleBn: "উচ্চারণের স্পষ্টতা ও স্ট্রেসের ভিত্তিতে মূল্যায়ন।",
        strengths: ["স্পষ্ট উচ্চারণ"],
        improvements: ["সঠিক স্ট্রেস ও রিদম বজায় রাখা"],
      },
      summaryBn: `আপনার AI মূল্যায়ন অনুযায়ী সামগ্রিক স্পিকিং ব্যান্ড স্কোর ${overallBand}।`,
      bandImprovementAdviceBn: [
        "উত্তর দীর্ঘ ও বিস্তৃত করতে সংযোগকারী শব্দ ব্যবহার করুন।",
        "ভোকাবুলারির বৈচিত্র্য বাড়াতে কলোকেশন অনুশীলন করুন。",
      ],
      disclaimerBn: "এটি AI দ্বারা প্রস্তুতকৃত আনুমানিক ব্যান্ড স্কোর।",
      answers: assessedAnswers,
    };

    localStorage.setItem(speakingAssessmentStorageKey(attemptIdToGrade), JSON.stringify(storedReport));

    // Grade attempt in database
    const gradesArray = answers.map((ans: any) => {
      const aiQ = assessedAnswers[ans.questionId];
      return {
        answerId: ans.id,
        fluencyScore: aiQ ? aiQ.fluencyScore : fcScore,
        lexicalScore: aiQ ? aiQ.lexicalScore : lrScore,
        grammarScore: aiQ ? aiQ.grammarScore : graScore,
        pronunciationScore: aiQ ? aiQ.pronunciationScore : prScore,
        feedback: aiQ ? aiQ.feedbackBn : storedReport.summaryBn,
      };
    });

    if (gradesArray.length > 0) {
      await speakingService.gradeAttempt(attemptIdToGrade, { grades: gradesArray });
    }
  };

  // Main Mock AI Assessment runner
  const runMockAiAssessment = useCallback(async () => {
    if (!attempt || isAssessingMock) return;
    setIsAssessingMock(true);
    setAssessmentError(null);

    try {
      const wAttempt = attempt.writingAttempt;
      const sAttempt = attempt.speakingAttempt;

      // 1. Grade Writing if submitted but unassessed
      if (wAttempt && wAttempt.status === "SUBMITTED" && wAttempt.bandScore == null) {
        setAssessingProgress("Writing মডিউলের AI মূল্যায়ন চলছে...");
        await assessWritingAttempt(wAttempt.id);
      }

      // 2. Grade Speaking if submitted but unassessed
      if (sAttempt && sAttempt.status === "SUBMITTED" && sAttempt.bandScore == null) {
        setAssessingProgress("Speaking মডিউলের AI মূল্যায়ন চলছে...");
        await assessSpeakingAttempt(sAttempt.id);
      }

      // 3. Refetch mock attempt to compute official overall band score
      setAssessingProgress("Calculating your overall band score...");
      await refetch();
      toast.success("Mock Test-এর Writing ও Speaking সফলভাবে AI দ্বারা মূল্যায়িত ও মার্কিং হয়েছে!");

      // If assessing=1 query param was set, clean it up
      if (searchParams.get("assessing") === "1") {
        router.replace(`/student/mock-tests/${mockTestId}?attemptId=${attemptId}`, { scroll: false });
      }
    } catch (err: any) {
      console.error("Mock test assessment error:", err);
      setAssessmentError(err?.message || "AI মূল্যায়ন সম্পন্ন করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
      toast.error("AI মূল্যায়ন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsAssessingMock(false);
      setAssessingProgress(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, isAssessingMock, mockTestId, attemptId, searchParams, router, refetch]);

  const hasUnassessedSections =
    (attempt?.writingAttempt &&
      attempt.writingAttempt.status === "SUBMITTED" &&
      attempt.writingAttempt.bandScore == null) ||
    (attempt?.speakingAttempt &&
      attempt.speakingAttempt.status === "SUBMITTED" &&
      attempt.speakingAttempt.bandScore == null);

  // Auto-trigger AI assessment if ?assessing=1 is present
  useEffect(() => {
    if (
      searchParams.get("assessing") === "1" &&
      !assessmentTriggeredRef.current &&
      attempt &&
      hasUnassessedSections
    ) {
      assessmentTriggeredRef.current = true;
      void runMockAiAssessment();
    }
  }, [searchParams, attempt, hasUnassessedSections, runMockAiAssessment]);

  if (!attemptId) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center space-y-4">
        <IconAlertCircle size={48} className="mx-auto" />
        <h2 className="text-xl font-black text-gray-800">Invalid Attempt Session</h2>
        <p className="text-sm font-medium text-gray-500">
          No attempt session ID was found. Please return to the Mock Test list and start again.
        </p>
        <Link
          href="/student/mock-tests"
          className="inline-flex items-center gap-1.5 rounded-md border border-black bg-white px-4.5 py-2.5 text-xs font-semibold transition hover:bg-neutral-100"
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
        <IconLoader2 size={36} className="animate-spin" />
        <p className="text-sm font-semibold text-gray-500">Loading your test...</p>
      </div>
    );
  }

  if (isError || !attempt) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center space-y-4">
        <IconAlertCircle size={48} className="mx-auto" />
        <h2 className="text-xl font-black text-gray-800">Error Loading Test Session</h2>
        <p className="text-sm font-medium text-gray-500">
          We couldn&apos;t retrieve the details of this test attempt.
        </p>
        <Link
          href="/student/mock-tests"
          className="inline-flex items-center gap-1.5 rounded-md border border-black bg-white px-4.5 py-2.5 text-xs font-semibold transition hover:bg-neutral-100"
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
      colorClass: "bg-white text-black border-neutral-300",
      btnColor: "border border-black bg-white hover:bg-neutral-100",
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
      colorClass: "bg-white text-black border-neutral-300",
      btnColor: "border border-black bg-white hover:bg-neutral-100",
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
      colorClass: "bg-white text-black border-neutral-300",
      btnColor: "border border-black bg-white hover:bg-neutral-100",
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
      colorClass: "bg-white text-black border-neutral-300",
      btnColor: "border border-black bg-white hover:bg-neutral-100",
      duration: mockTest.speakingExam?.duration || 15,
      examId: mockTest.speakingExamId,
      attempt: speakingAttempt,
      url: `/practice/speaking/${mockTest.speakingExamId}?mockAttemptId=${attemptId}&mockTestId=${mockTestId}`,
      reviewUrl: `/practice/speaking/${mockTest.speakingExamId}/review/${speakingAttempt?.id}`,
    },
  ].filter((sec) => !!sec.examId);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 text-black [&_*]:!text-black">
      {/* Top back link */}
      <div>
        <Link
          href="/student/mock-tests"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-slate-900 transition-colors"
        >
          <IconArrowLeft size={16} />
          <span>Back to full tests</span>
        </Link>
      </div>

      {/* Live AI Assessment Progress Banner */}
      {isAssessingMock && (
        <div className="space-y-4 rounded-xl border border-neutral-300 bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white">
              <IconLoader2 size={26} className="animate-spin" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-neutral-300 bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                  Marking in progress
                </span>
                <span className="text-xs text-slate-400 font-medium">Please do not refresh</span>
              </div>
              <h3 className="text-base font-bold">
                {assessingProgress || "IELTS Writing ও Speaking মূল্যায়ন করা হচ্ছে..."}
              </h3>
            </div>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div className="h-2 w-3/4 animate-[pulse_1.5s_ease-in-out_infinite] rounded-full bg-black" />
          </div>
        </div>
      )}

      {/* Assessment Error Banner */}
      {assessmentError && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-neutral-300 bg-white p-4">
          <div className="flex items-center gap-3">
            <IconAlertCircle size={20} className="shrink-0" />
            <p className="text-xs font-semibold">{assessmentError}</p>
          </div>
          <button
            type="button"
            onClick={() => void runMockAiAssessment()}
            disabled={isAssessingMock}
            className="shrink-0 rounded-md border border-black bg-white px-3.5 py-1.5 text-xs font-semibold transition hover:bg-neutral-100"
          >
            পুনরায় চেষ্টা করুন
          </button>
        </div>
      )}

      {/* Hero Header Area */}
      <div className="relative overflow-hidden rounded-xl border border-neutral-300 bg-white p-6 md:p-8">

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              <IconTrophy size={12} />
              <span>Full IELTS test</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              {examCopy(mockTest.title)}
            </h1>
            <p className="text-slate-400 text-sm max-w-xl font-medium">
              {examCopy(mockTest.description) || "Complete each section in order under timed test conditions."}
            </p>

            {/* Quick module score breakdown if graded */}
            {allSectionsGraded && overallBandScore != null && (
              <div className="pt-2 flex items-center gap-2 flex-wrap text-xs font-semibold text-slate-300">
                <span className="rounded-md border border-neutral-300 bg-white px-2.5 py-1">
                  L: <strong className="text-blue-400">{listeningAttempt?.bandScore ?? "N/A"}</strong>
                </span>
                <span className="rounded-md border border-neutral-300 bg-white px-2.5 py-1">
                  R: <strong className="text-emerald-400">{readingAttempt?.bandScore ?? "N/A"}</strong>
                </span>
                <span className="rounded-md border border-neutral-300 bg-white px-2.5 py-1">
                  W: <strong className="text-amber-400">{writingAttempt?.bandScore ?? "N/A"}</strong>
                </span>
                <span className="rounded-md border border-neutral-300 bg-white px-2.5 py-1">
                  S: <strong className="text-rose-400">{speakingAttempt?.bandScore ?? "N/A"}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Start continuous exam button if not completed */}
          {!allSectionsCompleted && (
            <Link
              href={`/student/mock-tests/run/${attemptId}/transition?mockTestId=${mockTestId}`}
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-md border border-black bg-white px-6 py-3 text-sm font-semibold transition hover:bg-neutral-100 md:w-auto"
            >
              <span>Continue test</span>
              <IconChevronRight size={16} className="stroke-3" />
            </Link>
          )}

          {/* Overall score panel if completed */}
          {allSectionsCompleted && (
            <div className="flex min-w-[220px] w-full shrink-0 flex-col items-center justify-center space-y-2 rounded-xl border border-neutral-300 bg-white p-5 text-center md:w-auto md:items-end md:text-right">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <IconTrophy size={14} className="text-purple-400" />
                <span>Overall Band Score</span>
              </span>

              {allSectionsGraded && overallBandScore != null ? (
                <div className="flex flex-col items-center md:items-end">
                  <div className="flex items-baseline justify-center md:justify-end gap-1">
                    <span className="text-5xl font-semibold">
                      {overallBandScore}
                    </span>
                    <span className="text-sm text-slate-400 font-bold">/ 9.0</span>
                  </div>
                  <span className="text-xs font-bold text-teal-400 mt-0.5">
                    {bandLabel(overallBandScore)}
                  </span>
                  <div className="mt-2 flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-[10px] font-semibold">
                    <IconCheck size={12} className="stroke-3" />
                    <span>Band score calculated</span>
                  </div>
                </div>
              ) : hasUnassessedSections ? (
                <div className="flex flex-col items-center md:items-end gap-2">
                  <span className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold">
                    Awaiting AI Evaluation
                  </span>
                  <button
                    type="button"
                    onClick={() => void runMockAiAssessment()}
                    disabled={isAssessingMock}
                    className="inline-flex items-center gap-1.5 rounded-md border border-black bg-white px-4 py-2 text-xs font-semibold transition hover:bg-neutral-100"
                  >
                    {isAssessingMock ? (
                      <IconLoader2 size={14} className="animate-spin" />
                    ) : (
                      <IconSparkles size={14} className="text-amber-300" />
                    )}
                    <span>{isAssessingMock ? "মূল্যায়ন চলছে..." : "AI দ্বারা মূল্যায়ন করুন"}</span>
                  </button>
                </div>
              ) : (
                <div className="mt-2 text-xs font-bold text-slate-400 bg-slate-700/50 px-3 py-1 rounded-lg border border-slate-600">
                  Grading in progress
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Callout if AI evaluation is pending */}
      {hasUnassessedSections && !isAssessingMock && (
        <div className="flex flex-col items-start justify-between gap-5 rounded-xl border border-neutral-300 bg-white p-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white">
              <IconSparkles size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-purple-950">
                Writing and Speaking marking
              </h3>
              <p className="text-xs text-purple-800 leading-relaxed font-normal max-w-xl">
                আপনার Writing ও Speaking উত্তরগুলো অফিশিয়াল IELTS Band Descriptors (Task Achievement,
                Coherence, Lexical Resource, Grammatical Range, Fluency ও Pronunciation) অনুযায়ী তাৎক্ষণিক
                মূল্যায়ন ও মার্কিং করতে নিচের বাটনে ক্লিক করুন।
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void runMockAiAssessment()}
            disabled={isAssessingMock}
            className="inline-flex shrink-0 items-center gap-2 rounded-md border border-black bg-white px-5 py-3 text-xs font-semibold transition hover:bg-neutral-100"
          >
            <IconSparkles size={16} className="text-amber-300" />
            <span>AI দ্বারা মূল্যায়ন ও মার্কিং করুন</span>
          </button>
        </div>
      )}

      {/* Main Section Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Modules Checklist */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span>Test sections</span>
              <span className="text-xs text-gray-400 font-semibold">
                ({examSections.filter((s) => s.attempt?.status === "SUBMITTED" || s.attempt?.status === "GRADED").length}/
                {examSections.length} Complete)
              </span>
            </h2>

            {/* Re-run button if already graded */}
            {allSectionsGraded && !isAssessingMock && (
              <button
                type="button"
                onClick={() => void runMockAiAssessment()}
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold transition hover:border-black"
                title="Re-run AI evaluation for Writing & Speaking"
              >
                <IconRefresh size={14} />
                <span>Re-evaluate with AI</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            {examSections.map((sec) => {
              const isCompleted =
                sec.attempt?.status === "SUBMITTED" || sec.attempt?.status === "GRADED";
              const bandScore = sec.attempt?.bandScore;
              const hasScore = bandScore !== null && bandScore !== undefined;

              return (
                <div
                  key={sec.id}
                  className={`bg-white border-2 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 ${
                    hasScore
                      ? "border-neutral-300 bg-white hover:border-black"
                      : isCompleted
                      ? "border-neutral-300 bg-white hover:border-black"
                      : "border-neutral-300 hover:border-black"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon container */}
                    <div
                      className={`h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 ${sec.colorClass}`}
                    >
                      <sec.icon size={24} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-gray-800 text-sm md:text-base">
                          {sec.title}
                        </h3>
                        {hasScore ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase">
                            <IconCheck size={11} className="stroke-3" />
                            <span>Band {bandScore.toFixed(1)}</span>
                          </span>
                        ) : isCompleted ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase">
                            <span>Awaiting AI Grade</span>
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <IconClock size={14} />
                          <span>{sec.duration} Minutes</span>
                        </span>
                        {isCompleted && (
                          <span
                            className={
                              hasScore ? "text-emerald-700 font-bold" : "text-amber-600 font-bold"
                            }
                          >
                            Score: {hasScore ? `Band ${bandScore.toFixed(1)}` : "Evaluation Pending"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="self-end sm:self-auto shrink-0 flex items-center gap-2">
                    {isCompleted ? (
                      <Link
                        href={sec.reviewUrl}
                        className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold transition hover:border-black"
                      >
                        <span>Review & AI Analysis</span>
                        <IconExternalLink size={14} />
                      </Link>
                    ) : (
                      <Link
                        href={sec.url}
                        className={`inline-flex items-center gap-1.5 rounded-md px-4.5 py-2.5 text-xs font-semibold transition ${sec.btnColor}`}
                      >
                        <span>Begin section</span>
                        <IconChevronRight size={14} className="stroke-3" />
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
              <IconTrophy size={18} />
              <span>Test information</span>
            </h3>

            <ul className="space-y-3.5 text-xs font-medium text-slate-600">
              <li className="flex items-start gap-2.5 leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-black" />
                <span>Answers are autosaved continuously throughout each exam module.</span>
              </li>
              <li className="flex items-start gap-2.5 leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-black" />
                <span>Reading & Listening modules are automatically graded with instant band scores.</span>
              </li>
              <li className="flex items-start gap-2.5 leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-black" />
                <span>
                  Writing & Speaking are evaluated via AI using official IELTS 4-criteria rubrics and saved
                  to the official database.
                </span>
              </li>
              <li className="flex items-start gap-2.5 leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-black" />
                <span>
                  Overall IELTS score is calculated as the average of all 4 modules rounded to the nearest
                  0.5 band score.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
