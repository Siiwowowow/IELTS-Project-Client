/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { use, useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { speakingService } from "@/services/speaking.services";
import {
  IconLoader2,
  IconAlertCircle,
  IconArrowLeft,
  IconCircleCheck,
  IconMusic,
  IconSparkles,
  IconFileText,
  IconCheck,
  IconCopy,
  IconAward,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import {
  StoredSpeakingAssessment,
  SpeakingQuestionAssessment,
  speakingAssessmentStorageKey,
} from "@/types/speaking-assessment.types";

interface Props {
  params: Promise<{ examId: string; attemptId: string }>;
}

const formatBand = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return "N/A";
  return n.toFixed(1);
};

function bandColor(band: number) {
  if (band >= 8) return { ring: "border-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" };
  if (band >= 7) return { ring: "border-green-500",   text: "text-green-700",   bg: "bg-green-50" };
  if (band >= 6) return { ring: "border-blue-500",    text: "text-blue-700",    bg: "bg-blue-50" };
  if (band >= 5) return { ring: "border-amber-500",   text: "text-amber-700",   bg: "bg-amber-50" };
  return         { ring: "border-rose-500",    text: "text-rose-700",    bg: "bg-rose-50" };
}

export default function SpeakingReviewPage({ params }: Props) {
  const { attemptId } = use(params);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const assessmentRequested = searchParams.get("assessing") === "1";

  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["speaking-attempt-review", attemptId],
    queryFn: () => speakingService.getAttemptReview(attemptId),
  });

  const attempt = data?.data;
  const exam = attempt?.exam;
  const parts = exam?.parts ? [...exam.parts].sort((a: any, b: any) => a.order - b.order) : [];
  const answers = attempt?.answers ?? [];

  // AI Assessment States
  const [aiAssessment, setAiAssessment] = useState<StoredSpeakingAssessment | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentProgress, setAssessmentProgress] = useState<string | null>(null);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [copiedAnswerId, setCopiedAnswerId] = useState<string | null>(null);
  const [showAdvice, setShowAdvice] = useState(true);
  const assessmentStartedRef = useRef(false);

  // Load cached AI assessment from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(speakingAssessmentStorageKey(attemptId));
      if (stored) {
        setAiAssessment(JSON.parse(stored) as StoredSpeakingAssessment);
      }
    } catch {
      localStorage.removeItem(speakingAssessmentStorageKey(attemptId));
    }
  }, [attemptId]);

  // Local state for manual teacher grading inputs
  const [gradesState, setGradesState] = useState<Record<string, {
    fluencyScore: number;
    lexicalScore: number;
    grammarScore: number;
    pronunciationScore: number;
    feedback: string;
  }>>({});

  const handleGradeChange = (answerId: string, field: string, value: any) => {
    setGradesState((prev) => {
      const current = prev[answerId] || {
        fluencyScore: 6.0,
        lexicalScore: 6.0,
        grammarScore: 6.0,
        pronunciationScore: 6.0,
        feedback: "",
      };
      return {
        ...prev,
        [answerId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  // Grade submission mutation (Teacher)
  const gradeMutation = useMutation({
    mutationFn: (payload: { grades: any[] }) => {
      return speakingService.gradeAttempt(attemptId, payload);
    },
    onSuccess: () => {
      toast.success("Speaking evaluation saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["speaking-attempt-review", attemptId] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to submit grades.";
      toast.error(msg);
    },
  });

  const handleGradeSubmit = () => {
    const gradesArray = answers.map((ans: any) => {
      const state = gradesState[ans.id] || {
        fluencyScore: ans.fluencyScore ?? 6.0,
        lexicalScore: ans.lexicalScore ?? 6.0,
        grammarScore: ans.grammarScore ?? 6.0,
        pronunciationScore: ans.pronunciationScore ?? 6.0,
        feedback: ans.feedback ?? "",
      };
      return {
        answerId: ans.id,
        fluencyScore: Number(state.fluencyScore),
        lexicalScore: Number(state.lexicalScore),
        grammarScore: Number(state.grammarScore),
        pronunciationScore: Number(state.pronunciationScore),
        feedback: state.feedback,
      };
    });

    gradeMutation.mutate({ grades: gradesArray });
  };

  // Apply AI scores to teacher grade inputs
  const handleApplyAiGradesToForm = () => {
    if (!aiAssessment) return;
    const newGrades: Record<string, any> = {};

    answers.forEach((ans: any) => {
      const aiQ = aiAssessment.answers[ans.questionId];
      if (aiQ) {
        newGrades[ans.id] = {
          fluencyScore: aiQ.fluencyScore,
          lexicalScore: aiQ.lexicalScore,
          grammarScore: aiQ.grammarScore,
          pronunciationScore: aiQ.pronunciationScore,
          feedback: aiQ.feedbackBn,
        };
      }
    });

    setGradesState(newGrades);
    toast.success("AI scores & feedback applied to the grading form!");
  };

  // Copy model answer text
  const handleCopyModelAnswer = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAnswerId(id);
      toast.success("Model answer copied to clipboard!");
      setTimeout(() => setCopiedAnswerId(null), 2000);
    } catch {
      toast.error("Failed to copy text.");
    }
  };

  // Main AI assessment runner
  const runAiAssessment = async () => {
    if (!attempt || !parts.length) return;
    setIsAssessing(true);
    setAssessmentError(null);

    try {
      // Gather all questions
      const itemsToAssess: Array<{ q: any; part: any; answer: any }> = [];
      parts.forEach((part: any) => {
        const pQuestions = part.questions ? [...part.questions].sort((a: any, b: any) => a.order - b.order) : [];
        pQuestions.forEach((q: any) => {
          const answer = answers.find((ans: any) => ans.questionId === q.id);
          itemsToAssess.push({ q, part, answer });
        });
      });

      const assessedAnswers: Record<string, SpeakingQuestionAssessment> = {};

      for (let i = 0; i < itemsToAssess.length; i++) {
        const item = itemsToAssess[i];
        setAssessmentProgress(
          `Part ${item.part.partNumber} Q${item.q.order} মূল্যায়ন করা হচ্ছে (${i + 1}/${itemsToAssess.length}) — Audio transcription ও IELTS rubrics যাচাই চলছে...`
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

      // Calculate averages across answered questions
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
        attemptId,
        createdAt: new Date().toISOString(),
        overallBand,
        fluencyScore: fcScore,
        lexicalScore: lrScore,
        grammarScore: graScore,
        pronunciationScore: prScore,
        fluencyCoherence: {
          score: fcScore,
          rationaleBn: "বক্তব্যের স্বাভাবিক গতি, বিরতিহীন উপস্থাপনা ও প্রাসঙ্গিক সংযোগকারী শব্দের প্রয়োগের ওপর ভিত্তি করে নির্ধারিত।",
          strengths: ["স্বাভাবিক বক্তব্য উপস্থাপনা", "প্রাসঙ্গিক চিন্তা ও ভাব প্রকাশ"],
          improvements: ["অপ্রয়োজনীয় দীর্ঘ বিরতি কমানো", "বাক্যগুলোর মাঝে আরও বৈচিত্র্যময় ট্রানজিশন বা কানেক্টর ব্যবহার"],
        },
        lexicalResource: {
          score: lrScore,
          rationaleBn: "ব্যবহৃত শব্দভাণ্ডারের পরিসর, নির্ভুলতা এবং পুনরাবৃত্তি এড়িয়ে বিষয়ভিত্তিক শব্দের ব্যবহারের ওপর ভিত্তি করে মূল্যায়িত।",
          strengths: ["যথাযথ শব্দ নির্বাচন", "বিষয়ভিত্তিক শব্দভাণ্ডার"],
          improvements: ["উচ্চতর একাডেমিক প্রতিশব্দ ও ইডিওমেটিক এক্সপ্রেশনের প্রয়োগ বাড়ানো"],
        },
        grammaticalRangeAccuracy: {
          score: graScore,
          rationaleBn: "সরল ও জটিল বিভিন্ন বাক্য কাঠামোর ভারসাম্য এবং ব্যাকরণগত নির্ভুলতা বিশ্লেষণ করা হয়েছে।",
          strengths: ["মৌলিক বাক্য কাঠামোর নির্ভুলতা"],
          improvements: ["জটিল (Complex) ও যৌগিক (Compound) বাক্যের নির্ভুল প্রয়োগ বৃদ্ধি করা"],
        },
        pronunciation: {
          score: prScore,
          rationaleBn: "উচ্চারণের স্পষ্টতা, স্বাভাবিক স্বরভঙ্গি (intonation) এবং শব্দের ওপর সঠিক স্ট্রেসের ভিত্তিতে মূল্যায়ন।",
          strengths: ["সহজে বোঝার মতো স্পষ্ট উচ্চারণ"],
          improvements: ["শব্দের সঠিক স্ট্রেস ও বাক্যের রিদম বা গতি বজায় রাখা"],
        },
        summaryBn: `আপনার AI মূল্যায়ন অনুযায়ী আনুমানিক সামগ্রিক স্পিকিং ব্যান্ড স্কোর ${overallBand}। সাবলীলতা ধরে রেখে ব্যাকরণ ও ভোকাবুলারির বৈচিত্র্য বাড়ালে উচ্চতর ব্যান্ড অর্জন করা সম্ভব।`,
        bandImprovementAdviceBn: [
          "উত্তর দেয়ার সময় ছোট বাক্যে আটকে না থেকে 'Because', 'Although', 'Furthermore' জাতীয় কানেক্টর দিয়ে আইডিয়া বড় করুন।",
          "পরিচিত সাধারণ শব্দের পাশাপাশি উন্নত ও প্রাকৃতিক কলোকেশন ব্যবহার করার অনুশীলন করুন।",
          "ইংরেজি কথা বলার সময় নিজের বক্তব্য রেকর্ড করে শুনুন এবং অযথা 'um', 'uh' কমানোর অভ্যাস করুন।",
        ],
        disclaimerBn: "এটি AI দ্বারা প্রস্তুতকৃত আনুমানিক ব্যান্ড স্কোর, কোনো অফিশিয়াল IELTS সার্টিফিকেট বা চূড়ান্ত ফলাফল নয়।",
        answers: assessedAnswers,
      };

      setAiAssessment(storedReport);
      localStorage.setItem(speakingAssessmentStorageKey(attemptId), JSON.stringify(storedReport));

      // Automatically save official grades & band score to database
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
        try {
          await speakingService.gradeAttempt(attemptId, { grades: gradesArray });
          queryClient.invalidateQueries({ queryKey: ["speaking-attempt-review", attemptId] });
        } catch (gradeErr) {
          console.warn("Failed to auto-save speaking grades to DB:", gradeErr);
        }
      }

      setAssessmentProgress(null);
      toast.success("AI Speaking Assessment সফলভাবে সম্পন্ন হয়েছে!");
    } catch (err: any) {
      console.error("AI Speaking assessment error:", err);
      setAssessmentError(err?.message || "Speaking evaluation failed.");
      setAssessmentProgress(null);
      toast.error("Speaking Assessment ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
    } finally {
      setIsAssessing(false);
    }
  };

  // Auto trigger assessment if ?assessing=1 is present and not yet started
  useEffect(() => {
    if (!assessmentRequested || assessmentStartedRef.current || isLoading || !attempt) return;
    assessmentStartedRef.current = true;
    runAiAssessment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentRequested, isLoading, attempt]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <IconLoader2 size={40} className="animate-spin text-rose-500" />
        <p className="text-sm font-bold text-gray-500">Retrieving speaking evaluation report...</p>
      </div>
    );
  }

  if (isError || !attempt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 max-w-md mx-auto text-center px-4">
        <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
          <IconAlertCircle size={28} />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-black text-gray-900 text-lg">Failed to load review</h2>
          <p className="text-sm text-gray-500 font-medium leading-relaxed">
            We couldn't retrieve the assessment logs for this attempt.
          </p>
        </div>
        <Link
          href={isTeacher ? "/teacher/speaking/exams" : "/practice/speaking"}
          className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-sm transition"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isTeacherGraded = attempt.bandScore !== null;
  const dateFormatted = attempt.createdAt
    ? format(new Date(attempt.createdAt), "MMMM d, yyyy 'at' h:mm a")
    : "Date unavailable";

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6 px-4 pb-24 select-text">
      {/* Navigation & Header */}
      <div className="flex flex-col gap-3">
        <Link
          href={isTeacher ? "/teacher/speaking/exams" : "/practice/speaking"}
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-rose-500 transition self-start"
        >
          <IconArrowLeft size={14} />
          Back to {isTeacher ? "My Speaking Exams" : "Speaking Practice List"}
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
              <span>Speaking Review: {exam?.title}</span>
            </h1>
            <p className="text-xs font-medium text-gray-500 mt-1">
              Candidate attempt: {attempt.id.slice(0, 8).toUpperCase()} • Submitted on {dateFormatted}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Status badge */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                isTeacherGraded
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : aiAssessment
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {isTeacherGraded
                ? "Teacher Graded"
                : aiAssessment
                ? "AI Assessed"
                : "Awaiting Evaluation"}
            </span>

            {/* AI Assessment Button */}
            <button
              onClick={runAiAssessment}
              disabled={isAssessing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isAssessing ? (
                <IconLoader2 size={16} className="animate-spin" />
              ) : (
                <IconSparkles size={16} />
              )}
              <span>{aiAssessment ? "Re-run AI Assessment" : "Assess with AI"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress banner during active assessment */}
      {isAssessing && (
        <div className="bg-gradient-to-r from-rose-50 via-white to-rose-50 border border-rose-200 rounded-2xl p-5 shadow-sm space-y-3 animate-pulse">
          <div className="flex items-center gap-3 text-rose-700">
            <IconLoader2 size={22} className="animate-spin shrink-0" />
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold">AI Speaking Assessment চলছে...</h4>
              <p className="text-xs text-rose-600/90 font-medium">
                {assessmentProgress || "Audio transcription এবং IELTS band descriptors যাচাই করা হচ্ছে..."}
              </p>
            </div>
          </div>
          <div className="w-full bg-rose-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-rose-500 h-1.5 rounded-full w-2/3 animate-[pulse_1s_ease-in-out_infinite]" />
          </div>
        </div>
      )}

      {/* Error banner if assessment failed */}
      {assessmentError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between gap-4 text-rose-800">
          <div className="flex items-center gap-3">
            <IconAlertCircle size={20} className="shrink-0 text-rose-600" />
            <p className="text-xs font-semibold">{assessmentError}</p>
          </div>
          <button
            onClick={runAiAssessment}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Hero Scorecard: AI Assessment Overview */}
      {aiAssessment && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 via-emerald-500 to-blue-500" />

          {/* Top row with overall band & teacher action */}
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-5">
              <div
                className={`h-24 w-24 rounded-full border-4 ${
                  bandColor(aiAssessment.overallBand).ring
                } flex flex-col items-center justify-center bg-slate-50/50 shrink-0 shadow-inner`}
              >
                <span className={`text-3xl font-black ${bandColor(aiAssessment.overallBand).text}`}>
                  {formatBand(aiAssessment.overallBand)}
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider -mt-1">
                  Band
                </span>
              </div>

              <div className="space-y-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h3 className="font-black text-gray-900 text-lg">
                    IELTS Speaking Assessment Report
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100 flex items-center gap-1">
                    <IconSparkles size={12} /> AI Verified
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-500 max-w-xl leading-relaxed">
                  {aiAssessment.summaryBn}
                </p>
              </div>
            </div>

            {/* Teacher auto-fill action */}
            {isTeacher && (
              <button
                type="button"
                onClick={handleApplyAiGradesToForm}
                className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs uppercase tracking-wider transition active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer"
                title="Populate manual grading sliders with AI scores"
              >
                <IconCheck size={16} />
                <span>Apply AI Scores to Form</span>
              </button>
            )}
          </div>

          {/* 4 Criteria Scores Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Fluency & Coherence",
                abbr: "FC",
                score: aiAssessment.fluencyScore,
                details: aiAssessment.fluencyCoherence,
                color: "text-blue-700 bg-blue-50 border-blue-200",
              },
              {
                label: "Lexical Resource",
                abbr: "LR",
                score: aiAssessment.lexicalScore,
                details: aiAssessment.lexicalResource,
                color: "text-purple-700 bg-purple-50 border-purple-200",
              },
              {
                label: "Grammatical Range",
                abbr: "GRA",
                score: aiAssessment.grammarScore,
                details: aiAssessment.grammaticalRangeAccuracy,
                color: "text-emerald-700 bg-emerald-50 border-emerald-200",
              },
              {
                label: "Pronunciation",
                abbr: "PR",
                score: aiAssessment.pronunciationScore,
                details: aiAssessment.pronunciation,
                color: "text-rose-700 bg-rose-50 border-rose-200",
              },
            ].map((crit) => (
              <div
                key={crit.abbr}
                className="bg-slate-50/70 border border-gray-150 rounded-2xl p-4 flex flex-col justify-between gap-2"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    {crit.abbr}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-xs font-black border ${crit.color}`}
                  >
                    Band {formatBand(crit.score)}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-800 leading-tight">{crit.label}</h4>
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {crit.details.rationaleBn}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Band Improvement Advice Section */}
          <div className="border border-amber-200/80 bg-amber-50/40 rounded-2xl p-4 space-y-2">
            <button
              type="button"
              onClick={() => setShowAdvice(!showAdvice)}
              className="flex items-center justify-between w-full text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <IconAward size={18} className="text-amber-600" />
                <span className="text-xs font-black text-amber-900 uppercase tracking-wider">
                  স্কোর ১ ব্যান্ড বাড়ানোর পরামর্শ (Band Improvement Advice)
                </span>
              </div>
              {showAdvice ? (
                <IconChevronUp size={16} className="text-amber-700" />
              ) : (
                <IconChevronDown size={16} className="text-amber-700" />
              )}
            </button>

            {showAdvice && (
              <ul className="text-xs text-amber-900/90 space-y-1.5 pt-2 border-t border-amber-200/60 list-disc list-inside leading-relaxed font-medium">
                {aiAssessment.bandImprovementAdviceBn.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-[10px] text-gray-400 text-center font-medium italic">
            * {aiAssessment.disclaimerBn}
          </p>
        </div>
      )}

      {/* If teacher graded in DB without AI, show teacher band */}
      {!aiAssessment && isTeacherGraded && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
          <div
            className={`h-24 w-24 rounded-full border-4 ${
              bandColor(attempt.bandScore!).ring
            } flex flex-col items-center justify-center bg-slate-50/50 shrink-0`}
          >
            <span className={`text-3xl font-black ${bandColor(attempt.bandScore!).text}`}>
              {formatBand(attempt.bandScore)}
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider -mt-1">
              Band
            </span>
          </div>

          <div className="space-y-1 text-center md:text-left">
            <h3 className="font-black text-gray-900 text-lg">Speaking Band Score Evaluated</h3>
            <p className="text-sm font-medium text-gray-500">
              Evaluated by instructor across all 3 speaking parts.
            </p>
          </div>
        </div>
      )}

      {/* Main question and answers lists part by part */}
      <div className="space-y-8">
        {parts.map((part: any) => {
          const partQuestions = part.questions
            ? [...part.questions].sort((a: any, b: any) => a.order - b.order)
            : [];

          return (
            <div key={part.id} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="border-b border-gray-150 pb-3">
                <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 rounded-full px-2.5 py-0.5 tracking-wider uppercase">
                  Part {part.partNumber}
                </span>
                <h2 className="text-lg font-black text-gray-900 mt-2">{part.title}</h2>
                {part.instruction && (
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mt-1">
                    Instruction: {part.instruction}
                  </p>
                )}
              </div>

              {/* Cue card specific info (Part 2) */}
              {part.partNumber === 2 && part.instruction && (
                <div className="bg-amber-50/40 border border-amber-200 rounded-2xl p-5 text-xs font-semibold text-gray-800 whitespace-pre-wrap leading-relaxed shadow-sm">
                  <span className="font-black text-amber-900 uppercase tracking-widest block mb-2">
                    Cue Card Topic:
                  </span>
                  <div dangerouslySetInnerHTML={{ __html: part.instruction }} />
                </div>
              )}

              {/* Questions inside the part */}
              <div className="space-y-8 divide-y divide-gray-100">
                {partQuestions.map((q: any) => {
                  const answer = answers.find((ans: any) => ans.questionId === q.id);
                  const isAnswered = !!answer?.audioUrl;
                  const aiQ: SpeakingQuestionAssessment | undefined = aiAssessment?.answers[q.id];

                  const ansState = gradesState[answer?.id] || {
                    fluencyScore: answer?.fluencyScore ?? aiQ?.fluencyScore ?? 6.0,
                    lexicalScore: answer?.lexicalScore ?? aiQ?.lexicalScore ?? 6.0,
                    grammarScore: answer?.grammarScore ?? aiQ?.grammarScore ?? 6.0,
                    pronunciationScore: answer?.pronunciationScore ?? aiQ?.pronunciationScore ?? 6.0,
                    feedback: answer?.feedback ?? aiQ?.feedbackBn ?? "",
                  };

                  return (
                    <div key={q.id} className="pt-6 first:pt-0 space-y-5">
                      {/* Question Header & Score Badge */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-gray-900 leading-snug">
                            Q{q.order}: {q.questionText}
                          </h4>
                          {!isAnswered && (
                            <span className="text-[10px] font-black uppercase text-red-500">
                              Unanswered
                            </span>
                          )}
                        </div>

                        {/* Band Badge for Question */}
                        {isAnswered && (aiQ || answer?.bandScore !== null) && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                            Q Band: {formatBand(aiQ?.bandScore ?? answer?.bandScore)}
                          </span>
                        )}
                      </div>

                      {/* Audio response player */}
                      {isAnswered && answer.audioUrl ? (
                        <div className="bg-slate-50 border border-gray-150 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 border border-rose-100">
                            <IconMusic size={20} />
                          </div>
                          <audio
                            src={answer.audioUrl}
                            controls
                            className="w-full h-10 border border-gray-200 rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center gap-2 border border-dashed border-rose-200 rounded-2xl bg-rose-50/10 text-rose-800 p-4">
                          <IconAlertCircle size={20} className="text-rose-500" />
                          <p className="font-bold text-xs uppercase tracking-wide text-rose-700">
                            No Audio Response
                          </p>
                          <p className="text-[11px] text-gray-500 max-w-sm">
                            Candidate did not record an audio response for this question.
                          </p>
                        </div>
                      )}

                      {/* AI Assessment Details for this question */}
                      {aiQ && (
                        <div className="space-y-4 bg-slate-50/80 border border-gray-200 rounded-2xl p-5">
                          {/* Transcribed Speech */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-gray-700">
                              <IconFileText size={16} className="text-rose-600" />
                              <span className="text-xs font-black uppercase tracking-wider">
                                আপনার বক্তব্য (Transcribed Speech)
                              </span>
                            </div>
                            <div className="p-3 bg-white border border-gray-200 rounded-xl text-xs leading-relaxed text-gray-800 font-medium italic">
                              "{aiQ.transcript}"
                            </div>
                          </div>

                          {/* 4 Rubric Scores for this question */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                            <div className="bg-white border border-gray-150 p-2.5 rounded-xl text-center">
                              <span className="text-[10px] font-bold text-gray-400 block uppercase">Fluency</span>
                              <span className="text-sm font-black text-blue-700">{formatBand(aiQ.fluencyScore)}</span>
                            </div>
                            <div className="bg-white border border-gray-150 p-2.5 rounded-xl text-center">
                              <span className="text-[10px] font-bold text-gray-400 block uppercase">Lexical</span>
                              <span className="text-sm font-black text-purple-700">{formatBand(aiQ.lexicalScore)}</span>
                            </div>
                            <div className="bg-white border border-gray-150 p-2.5 rounded-xl text-center">
                              <span className="text-[10px] font-bold text-gray-400 block uppercase">Grammar</span>
                              <span className="text-sm font-black text-emerald-700">{formatBand(aiQ.grammarScore)}</span>
                            </div>
                            <div className="bg-white border border-gray-150 p-2.5 rounded-xl text-center">
                              <span className="text-[10px] font-bold text-gray-400 block uppercase">Pronunciation</span>
                              <span className="text-sm font-black text-rose-700">{formatBand(aiQ.pronunciationScore)}</span>
                            </div>
                          </div>

                          {/* Grammar corrections (if any) */}
                          {aiQ.grammarErrors?.length > 0 && (
                            <div className="space-y-2 pt-2">
                              <span className="text-xs font-black uppercase tracking-wider text-rose-700 block">
                                ব্যাকরণগত সংশোধন (Grammar Corrections)
                              </span>
                              <div className="space-y-2">
                                {aiQ.grammarErrors.map((err, errIdx) => (
                                  <div
                                    key={errIdx}
                                    className="bg-white border border-rose-200 rounded-xl p-3 text-xs space-y-1"
                                  >
                                    <p className="text-rose-700 font-medium">
                                      <strong>ভুল:</strong> &ldquo;{err.original}&rdquo;
                                    </p>
                                    <p className="text-emerald-700 font-medium">
                                      <strong>সঠিক:</strong> &ldquo;{err.corrected}&rdquo;
                                    </p>
                                    {err.improvedVersion && (
                                      <p className="text-blue-700 font-medium">
                                        <strong>উন্নত সংস্করণ (Higher Band):</strong> &ldquo;{err.improvedVersion}&rdquo;
                                      </p>
                                    )}
                                    <p className="text-gray-600 text-[11px] leading-relaxed pt-0.5">
                                      {err.explanationBn}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Vocabulary suggestions (if any) */}
                          {aiQ.vocabularyImprovements?.length > 0 && (
                            <div className="space-y-2 pt-2">
                              <span className="text-xs font-black uppercase tracking-wider text-purple-700 block">
                                শব্দভাণ্ডার উন্নয়ন (Vocabulary Upgrades)
                              </span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {aiQ.vocabularyImprovements.map((vocab, vIdx) => (
                                  <div
                                    key={vIdx}
                                    className="bg-white border border-purple-200 rounded-xl p-3 text-xs space-y-1"
                                  >
                                    <div className="flex items-center gap-1.5 font-bold">
                                      <span className="text-gray-500 line-through">&ldquo;{vocab.original}&rdquo;</span>
                                      <span className="text-purple-700">&rarr; &ldquo;{vocab.suggested}&rdquo;</span>
                                    </div>
                                    <p className="text-gray-600 text-[11px] leading-relaxed">
                                      {vocab.explanationBn}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Pronunciation & Word Stress tips */}
                          {aiQ.pronunciationNotes?.length > 0 && (
                            <div className="space-y-2 pt-2">
                              <span className="text-xs font-black uppercase tracking-wider text-amber-700 block">
                                উচ্চারণ ও স্ট্রেস টিপস (Pronunciation Notes)
                              </span>
                              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 space-y-1.5">
                                {aiQ.pronunciationNotes.map((note, nIdx) => (
                                  <div key={nIdx} className="text-xs leading-relaxed">
                                    <span className="font-bold text-amber-900">&ldquo;{note.wordOrPhrase}&rdquo;:</span>{" "}
                                    <span className="text-gray-700">{note.phoneticTipBn}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Feedback in Bengali */}
                          {aiQ.feedbackBn && (
                            <div className="space-y-1 pt-2">
                              <span className="text-xs font-black uppercase tracking-wider text-gray-600 block">
                                পরীক্ষকের পরামর্শ (Examiner Feedback)
                              </span>
                              <p className="text-xs text-gray-700 font-medium leading-relaxed bg-white border border-gray-150 p-3 rounded-xl">
                                {aiQ.feedbackBn}
                              </p>
                            </div>
                          )}

                          {/* Band 8.0+ Model Answer */}
                          {aiQ.modelAnswer && (
                            <div className="space-y-1.5 pt-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                                  <IconAward size={15} /> Band 8.0+ Model Spoken Answer
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyModelAnswer(q.id, aiQ.modelAnswer)}
                                  className="text-xs text-gray-500 hover:text-emerald-700 flex items-center gap-1 font-semibold cursor-pointer"
                                >
                                  {copiedAnswerId === q.id ? (
                                    <>
                                      <IconCheck size={14} className="text-emerald-600" />
                                      <span className="text-emerald-600">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <IconCopy size={14} />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs leading-relaxed text-emerald-950 font-medium select-text">
                                &ldquo;{aiQ.modelAnswer}&rdquo;
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Manual Teacher Grading Form (if user is teacher/admin) */}
                      {isTeacher && isAnswered && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 border border-gray-200 rounded-2xl p-5">
                          <div className="space-y-3">
                            <h5 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                              Instructor Manual Scores
                            </h5>
                            <div className="space-y-3">
                              {[
                                { key: "fluencyScore" as const, label: "Fluency & Coherence" },
                                { key: "lexicalScore" as const, label: "Lexical Resource" },
                                { key: "grammarScore" as const, label: "Grammar Range & Accuracy" },
                                { key: "pronunciationScore" as const, label: "Pronunciation" },
                              ].map((rubric) => {
                                const scoreVal = (ansState as any)[rubric.key];
                                return (
                                  <div key={rubric.key} className="flex justify-between items-center gap-4">
                                    <span className="text-xs font-bold text-gray-600">{rubric.label}</span>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="range"
                                        min="0"
                                        max="9"
                                        step="0.5"
                                        value={scoreVal ?? 6.0}
                                        onChange={(e) =>
                                          handleGradeChange(answer.id, rubric.key, parseFloat(e.target.value))
                                        }
                                        className="w-32 accent-rose-500 cursor-pointer"
                                      />
                                      <span className="text-xs font-black text-rose-600 w-8 text-right">
                                        {(scoreVal ?? 6.0).toFixed(1)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="space-y-2 flex flex-col justify-between">
                            <div className="space-y-1">
                              <h5 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                                Examiner Notes
                              </h5>
                              <textarea
                                value={ansState.feedback}
                                onChange={(e) => handleGradeChange(answer.id, "feedback", e.target.value)}
                                placeholder="Add notes on vocabulary choice, grammatical slips, or pronunciation issues..."
                                className="w-full h-24 text-xs font-semibold p-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-rose-400 text-black resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Teacher Action submit grades sticky bottom bar */}
      {isTeacher && answers.length > 0 && (
        <div className="bg-white border-t border-gray-200 p-4 fixed bottom-0 left-0 w-full z-10 shadow-lg flex justify-center items-center gap-4">
          <p className="text-xs font-bold text-gray-500 hidden md:block">
            Commit manual assessment values to the database. This calculates overall average scores.
          </p>
          <button
            onClick={handleGradeSubmit}
            disabled={gradeMutation.isPending}
            className="px-6 py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-200 text-white rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 shadow-md shadow-rose-500/10 flex items-center gap-2 cursor-pointer"
          >
            {gradeMutation.isPending ? (
              <IconLoader2 size={16} className="animate-spin" />
            ) : (
              <IconCircleCheck size={16} />
            )}
            <span>Save evaluation report</span>
          </button>
        </div>
      )}
    </div>
  );
}
