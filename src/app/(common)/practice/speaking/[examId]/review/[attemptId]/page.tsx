/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { speakingService } from "@/services/speaking.services";
import {
  IconLoader2,
  IconAlertCircle,
  IconArrowLeft,
  
  IconCircleCheck,
  IconMusic,
} from "@tabler/icons-react";
import Link from "next/link";
import { format } from "date-fns";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";

interface Props {
  params: Promise<{ examId: string; attemptId: string }>;
}

const formatBand = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return "N/A";
  return n.toFixed(1);
};

function bandColor(band: number) {
  if (band >= 8) return { ring: "border-emerald-400", text: "text-emerald-600", bg: "bg-emerald-50" };
  if (band >= 7) return { ring: "border-green-400",   text: "text-green-600",   bg: "bg-green-50" };
  if (band >= 6) return { ring: "border-blue-400",    text: "text-blue-600",    bg: "bg-blue-50" };
  if (band >= 5) return { ring: "border-orange-400",  text: "text-orange-600",  bg: "bg-orange-50" };
  return         { ring: "border-rose-400",    text: "text-rose-600",    bg: "bg-rose-50" };
}

export default function SpeakingReviewPage({ params }: Props) {
  const { attemptId } = use(params);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["speaking-attempt-review", attemptId],
    queryFn: () => speakingService.getAttemptReview(attemptId),
  });

  const attempt = data?.data;
  const exam = attempt?.exam;
  const parts = exam?.parts ? [...exam.parts].sort((a: any, b: any) => a.order - b.order) : [];
  const answers = attempt?.answers ?? [];

  // Local state for grading inputs
  // key is answerId
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

  // Grade submission mutation
  const gradeMutation = useMutation({
    mutationFn: (payload: { grades: any[] }) => {
      return speakingService.gradeAttempt(attemptId, payload);
    },
    onSuccess: () => {
      toast.success("Speaking mock evaluation saved!");
      queryClient.invalidateQueries({ queryKey: ["speaking-attempt-review", attemptId] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to submit grades.";
      toast.error(msg);
    },
  });

  const handleGradeSubmit = () => {
    // Populate missing answers in gradesState with defaults if not interacted with
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

  const isGraded = attempt.bandScore !== null;
  const dateFormatted = attempt.createdAt
    ? format(new Date(attempt.createdAt), "MMMM d, yyyy 'at' h:mm a")
    : "Date unavailable";

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6 px-4 pb-20 select-text">
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
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Speaking Mock Review: {exam?.title}
            </h1>
            <p className="text-xs font-medium text-gray-500 mt-1">
              Candidate attempt: {attempt.id.slice(0, 8).toUpperCase()} • Submitted on {dateFormatted}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                isGraded
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {isGraded ? "Graded" : "Awaiting Evaluation"}
            </span>
          </div>
        </div>
      </div>

      {/* Graded band header scorecard */}
      {isGraded && (
        <div className="bg-white border border-gray-250 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
          
          <div className={`h-24 w-24 rounded-full border-4 ${bandColor(attempt.bandScore!).ring} flex flex-col items-center justify-center bg-slate-50/50 shrink-0`}>
            <span className={`text-3xl font-black ${bandColor(attempt.bandScore!).text}`}>
              {formatBand(attempt.bandScore)}
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider -mt-1">
              Band
            </span>
          </div>

          <div className="space-y-1 text-center md:text-left">
            <h3 className="font-black text-gray-900 text-lg">Speaking Band Score Generated</h3>
            <p className="text-sm font-medium text-gray-500">
              The overall speaking score is calculated as the average of the evaluated responses across Part 1, Part 2, and Part 3.
            </p>
          </div>
        </div>
      )}

      {/* Main question and answers lists part by part */}
      <div className="space-y-8">
        {parts.map((part: any, pIdx: number) => {
          const partQuestions = part.questions ? [...part.questions].sort((a: any, b: any) => a.order - b.order) : [];

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

              {/* Cue card specific info */}
              {part.partNumber === 2 && part.instruction && (
                <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-4 text-xs font-semibold text-gray-800 whitespace-pre-wrap">
                  <span className="font-bold text-amber-800 uppercase tracking-widest block mb-2">Cue Card Cue Card:</span>
                  <div dangerouslySetInnerHTML={{ __html: part.instruction }} />
                </div>
              )}

              {/* Questions inside the part */}
              <div className="space-y-6 divide-y divide-gray-100">
                {partQuestions.map((q: any, qIdx: number) => {
                  const answer = answers.find((ans: any) => ans.questionId === q.id);
                  const isAnswered = !!answer?.audioUrl;

                  const ansState = gradesState[answer?.id] || {
                    fluencyScore: answer?.fluencyScore ?? 6.0,
                    lexicalScore: answer?.lexicalScore ?? 6.0,
                    grammarScore: answer?.grammarScore ?? 6.0,
                    pronunciationScore: answer?.pronunciationScore ?? 6.0,
                    feedback: answer?.feedback ?? "",
                  };

                  return (
                    <div key={q.id} className={`pt-6 first:pt-0 space-y-4`}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-gray-900">
                            Q{q.order}: {q.questionText}
                          </h4>
                          {!isAnswered && (
                            <span className="text-[10px] font-black uppercase text-red-500">Unanswered</span>
                          )}
                        </div>

                        {isAnswered && answer.bandScore !== null && (
                          <span className={`px-2 py-0.5 rounded text-xs font-black bg-slate-50 text-rose-600 border border-rose-100`}>
                            Q Band: {formatBand(answer.bandScore)}
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
                        <div className="flex flex-col items-center justify-center py-8 text-center gap-3.5 border border-dashed border-rose-200 rounded-2xl bg-rose-50/10 text-rose-800 p-5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-550 border border-rose-100">
                            <IconAlertCircle size={20} className="text-rose-500 animate-pulse" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-bold text-xs uppercase tracking-wide text-rose-700">No Audio Response</p>
                            <p className="text-[11px] text-gray-500 max-w-sm font-medium">
                              Candidate did not record or upload an audio response for this question.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Grading Interface (Teacher) / Grades View (Student) */}
                      {isAnswered && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 border border-gray-100 rounded-2xl p-5">
                          
                          {/* Grades details */}
                          <div className="space-y-3">
                            <h5 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Evaluation Metrics</h5>
                            
                            <div className="space-y-3">
                              {/* Rubric rows */}
                              {[
                                { key: "fluencyScore" as const, label: "Fluency & Coherence" },
                                { key: "lexicalScore" as const, label: "Lexical Resource" },
                                { key: "grammarScore" as const, label: "Grammar Range & Accuracy" },
                                { key: "pronunciationScore" as const, label: "Pronunciation" },
                              ].map((rubric) => {
                                const scoreVal = isTeacher ? (ansState as any)[rubric.key] : (answer as any)[rubric.key];
                                return (
                                  <div key={rubric.key} className="flex justify-between items-center gap-4">
                                    <span className="text-xs font-bold text-gray-600">{rubric.label}</span>
                                    {isTeacher ? (
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="range"
                                          min="0"
                                          max="9"
                                          step="0.5"
                                          value={scoreVal ?? 6.0}
                                          onChange={(e) => handleGradeChange(answer.id, rubric.key, parseFloat(e.target.value))}
                                          className="w-32 accent-rose-500 cursor-pointer"
                                        />
                                        <span className="text-xs font-black text-rose-600 w-8 text-right">
                                          {(scoreVal ?? 6.0).toFixed(1)}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-xs font-black text-gray-800">
                                        {scoreVal !== null && scoreVal !== undefined ? scoreVal.toFixed(1) : "N/A"}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Text Feedback */}
                          <div className="space-y-2 flex flex-col justify-between">
                            <div className="space-y-1">
                              <h5 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Examiner Feedback</h5>
                              {isTeacher ? (
                                <textarea
                                  value={ansState.feedback}
                                  onChange={(e) => handleGradeChange(answer.id, "feedback", e.target.value)}
                                  placeholder="Write notes on vocabulary choice, grammatical slips, or pronunciation issues..."
                                  className="w-full h-24 text-xs font-semibold p-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-rose-400 text-black resize-none"
                                />
                              ) : (
                                <p className="text-xs text-gray-600 font-medium italic whitespace-pre-wrap leading-relaxed">
                                  {answer.feedback ? `"${answer.feedback}"` : "No individual question feedback provided."}
                                </p>
                              )}
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

      {/* Teacher Action submit grades */}
      {isTeacher && answers.length > 0 && (
        <div className="bg-white border-t border-gray-200 p-4 fixed bottom-0 left-0 w-full z-10 shadow-lg flex justify-center items-center gap-4">
          <p className="text-xs font-bold text-gray-500 hidden md:block">
            Commit manual assessment values for the candidate. This automatically processes average scores.
          </p>
          <button
            onClick={handleGradeSubmit}
            disabled={gradeMutation.isPending}
            className="px-6 py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-200 text-white rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 shadow-md shadow-rose-500/10 flex items-center gap-2"
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
