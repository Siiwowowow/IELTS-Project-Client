/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { readingService } from "@/services/reading.services";
import {
  IconLoader2,
  IconAlertCircle,
  IconArrowLeft,
  IconCheck,
  IconX,
  IconTrophy,
  IconTarget,
  IconChartBar,
  IconClock,
  IconBulb,
  IconCircleCheck,
} from "@tabler/icons-react";
import Link from "next/link";

interface Props {
  params: Promise<{ examId: string; attemptId: string }>;
}

function bandColor(band: number) {
  if (band >= 8) return { ring: "border-emerald-400", text: "text-emerald-600", bg: "bg-emerald-50" };
  if (band >= 7) return { ring: "border-green-400",   text: "text-green-600",   bg: "bg-green-50" };
  if (band >= 6) return { ring: "border-blue-400",    text: "text-blue-600",    bg: "bg-blue-50" };
  if (band >= 5) return { ring: "border-orange-400",  text: "text-orange-600",  bg: "bg-orange-50" };
  return         { ring: "border-red-400",    text: "text-red-600",    bg: "bg-red-50" };
}

function bandLabel(band: number) {
  if (band >= 8.5) return "Expert";
  if (band >= 7.5) return "Very Good";
  if (band >= 6.5) return "Good";
  if (band >= 5.5) return "Competent";
  if (band >= 4.5) return "Modest";
  return "Limited";
}

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  highlight?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-2xl p-5 gap-1 text-center shadow-sm">
      <span className={`text-2xl ${highlight ?? "text-gray-700"}`}>{value}</span>
      <span className="text-xs text-gray-400 flex items-center gap-1">
        {icon}
        {label}
      </span>
      {sub && <span className="text-[11px] text-gray-400">{sub}</span>}
    </div>
  );
}

export default function ReviewPage({ params }: Props) {
  const { examId, attemptId } = use(params);
  const [filter, setFilter] = useState<"all" | "correct" | "incorrect" | "unanswered">("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["attempt-review", attemptId],
    queryFn: () => readingService.getAttemptReview(attemptId),
  });

  const attempt = data?.data;

  // ── Derived (Hook calls must be placed before early returns) ──────────────────
  const sortedAnswers = useMemo(() => {
    if (!attempt?.answers) return [];
    return [...attempt.answers].sort((a: any, b: any) => {
      const numA = a.question?.questionNumber ?? 0;
      const numB = b.question?.questionNumber ?? 0;
      return numA - numB;
    });
  }, [attempt?.answers]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <IconLoader2 size={40} className="animate-spin text-primary" />
        <p className="text-sm text-gray-500 font-medium">Loading your results…</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (isError || !attempt) {
    return (
      <div className="flex items-center gap-3 p-5 bg-red-50 border border-red-100 rounded-2xl text-red-700 max-w-lg mx-auto mt-12">
        <IconAlertCircle size={22} className="shrink-0" />
        <div>
          <p className="font-semibold text-sm">Failed to load review</p>
          <p className="text-xs mt-0.5 text-red-500">Please go back and try again.</p>
        </div>
      </div>
    );
  }

  const total     = sortedAnswers.length > 0 ? sortedAnswers.length : attempt.answers.length;
  const correct   = attempt.score;
  const wrong     = total - correct;
  const unanswered = sortedAnswers.filter((ans: any) => !ans.submittedAnswer || ans.submittedAnswer.trim() === "").length;
  const pct       = total > 0 ? Math.round((correct / total) * 100) : 0;
  const bc        = bandColor(attempt.bandScore);
  const label     = bandLabel(attempt.bandScore);

  const startMs   = new Date(attempt.startTime).getTime();
  const endMs     = new Date(attempt.endTime).getTime();
  const elapsedMin = Math.round((endMs - startMs) / 60000);

  const filteredAnswers = sortedAnswers.filter((ans: any) => {
    const isAnsCorrect = ans.isCorrect;
    const hasAnswer = !!(ans.submittedAnswer && ans.submittedAnswer.trim() !== "");
    if (filter === "correct") return isAnsCorrect;
    if (filter === "incorrect") return !isAnsCorrect;
    if (filter === "unanswered") return !hasAnswer;
    return true;
  });

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 px-4">

      {/* Back */}
      <Link
        href="/user/reading"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors"
      >
        <IconArrowLeft size={15} />
        Back to Reading Practice
      </Link>

      {/* ── Hero score card ───────────────────────────────────────────────── */}
      <div className="relative bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white overflow-hidden shadow-lg">
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-primary/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center gap-6">
          {/* Trophy */}
          <div className={`flex items-center justify-center h-20 w-20 rounded-2xl border-2 ${bc.ring} ${bc.bg} shrink-0 shadow-inner`}>
            <IconTrophy size={36} className={bc.text} />
          </div>

          {/* Titles */}
          <div className="text-center md:text-left flex-1">
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Exam Complete</p>
            <h1 className="text-xl font-bold text-white leading-tight">{attempt.exam.title}</h1>
            <p className={`text-sm font-medium mt-1 ${bc.text}`}>{label}</p>
          </div>

          {/* Band score */}
          <div className="text-center shrink-0">
            <div className={`text-5xl font-extrabold ${bc.text}`}>{attempt.bandScore}</div>
            <div className="text-xs text-slate-400 mt-1">IELTS Band Score</div>
          </div>
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard
          icon={<IconCircleCheck size={12} />}
          label="Correct"
          value={correct}
          highlight="text-emerald-600"
        />
        <StatCard
          icon={<IconX size={12} />}
          label="Incorrect"
          value={wrong}
          highlight="text-rose-500"
        />
        <StatCard
          icon={<IconAlertCircle size={12} />}
          label="Unanswered"
          value={unanswered}
          highlight="text-amber-500"
        />
        <StatCard
          icon={<IconChartBar size={12} />}
          label="Accuracy"
          value={`${pct}%`}
          highlight={pct >= 70 ? "text-emerald-600" : pct >= 50 ? "text-orange-600" : "text-rose-500"}
        />
        <StatCard
          icon={<IconClock size={12} />}
          label="Time taken"
          value={`${elapsedMin}m`}
          sub={`of ${attempt.exam.duration}m`}
        />
      </div>

      {/* ── Progress bar ──────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Performance</span>
          <span>{correct}/{total} correct</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-linear-to-r from-primary to-emerald-400 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* ── Detailed answer review ────────────────────────────────────────── */}
      <div className="space-y-6">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <IconTarget size={18} className="text-primary" />
          Detailed Review
        </h2>

        {/* Interactive Question Filters */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Filter Questions
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "All Questions", count: total },
              { value: "correct", label: "Correct Only", count: correct },
              { value: "incorrect", label: "Incorrect Only", count: wrong },
              { value: "unanswered", label: "Unanswered Only", count: unanswered },
            ].map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setFilter(t.value as any)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                  filter === t.value
                    ? "bg-[#1B3A6B] text-white border-[#1B3A6B] shadow-md shadow-blue-900/10"
                    : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"
                }`}
              >
                <span>{t.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  filter === t.value ? "bg-white/20 text-white" : "bg-gray-100 text-gray-750"
                }`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Answer Sheet Grid Summary */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <IconCircleCheck className="text-emerald-600" size={18} />
            Answer Sheet Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {sortedAnswers.map((ans) => {
              const qNum = ans.question?.questionNumber;
              const isUnanswered = !ans.submittedAnswer || ans.submittedAnswer.trim() === "";
              return (
                <div
                  key={ans.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    ans.isCorrect
                      ? "bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50"
                      : isUnanswered
                      ? "bg-amber-50/50 border-amber-250 hover:bg-amber-50"
                      : "bg-rose-50/50 border-rose-200 hover:bg-rose-50"
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-gray-400">Q{qNum}</span>
                    <span className="text-sm font-semibold truncate text-gray-800" title={ans.submittedAnswer || "(No answer)"}>
                      {ans.submittedAnswer || "-"}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium truncate" title={ans.question?.correctAnswer}>
                      Key: {ans.question?.correctAnswer || "-"}
                    </span>
                  </div>
                  <div className="shrink-0 ml-2">
                    {ans.isCorrect ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white">
                        <IconCheck size={11} stroke={3} />
                      </span>
                    ) : isUnanswered ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white">
                        <IconAlertCircle size={11} stroke={3} />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-600 text-white">
                        <IconX size={11} stroke={3} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Question List */}
        <div className="space-y-4">
          {filteredAnswers.length === 0 ? (
            <div className="bg-white border border-gray-250 rounded-2xl py-12 px-6 text-center text-gray-450 font-semibold shadow-sm">
              No questions match your current filter selection.
            </div>
          ) : (
            filteredAnswers.map((ans) => {
              const isUnanswered = !ans.submittedAnswer || ans.submittedAnswer.trim() === "";
              return (
                <div
                  key={ans.id}
                  className={`rounded-xl border p-5 transition-all shadow-sm bg-white ${
                    ans.isCorrect
                      ? "border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50/10"
                      : isUnanswered
                      ? "border-amber-100 hover:border-amber-200 hover:bg-amber-50/10"
                      : "border-rose-100 hover:border-rose-200 hover:bg-rose-50/10"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Correct/wrong/unanswered badge/icon */}
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-1 ${
                        ans.isCorrect ? "bg-emerald-600 text-white" : isUnanswered ? "bg-amber-500 text-white" : "bg-rose-600 text-white"
                      }`}
                    >
                      {ans.isCorrect ? (
                        <IconCheck size={14} stroke={2.5} />
                      ) : isUnanswered ? (
                        <IconAlertCircle size={14} stroke={2.5} />
                      ) : (
                        <IconX size={14} stroke={2.5} />
                      )}
                    </div>

                    <div className="flex-1 space-y-2.5 min-w-0">
                      {/* Meta: Question number and status badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                          Question {ans.question?.questionNumber}
                        </span>
                        {ans.isCorrect ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Correct
                          </span>
                        ) : isUnanswered ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            Not Answered
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            Incorrect
                          </span>
                        )}
                      </div>

                      {/* Question text */}
                      {ans.question?.questionText && (
                        <p className="text-[15px] text-black font-semibold leading-snug">
                          {ans.question.questionText}
                        </p>
                      )}

                      {/* Answer comparison */}
                      <div className="flex flex-wrap gap-5 text-sm bg-gray-50 p-3 rounded-lg border border-gray-150/70 shadow-inner">
                        <span className="flex items-center gap-1.5">
                          <span className="text-gray-900 font-medium">Your answer:</span>
                          <span
                            className={`font-bold text-[15px] ${
                              ans.isCorrect ? "text-emerald-700" : isUnanswered ? "text-amber-600 italic" : "text-rose-700"
                            }`}
                          >
                            {ans.submittedAnswer || "(not answered)"}
                          </span>
                        </span>

                        <span className="flex items-center gap-1.5 border-l border-gray-200 pl-5">
                          <span className="text-gray-900 font-medium">Correct answer:</span>
                          <span className="font-bold text-[15px] text-emerald-700">
                            {ans.question?.correctAnswer}
                          </span>
                        </span>
                      </div>

                      {/* Explanation */}
                      {ans.question?.explanation && (
                        <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3.5 mt-2.5 shadow-inner">
                          <IconBulb size={16} className="text-amber-500 mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">Explanation</span>
                            <p className="text-sm text-black leading-relaxed font-normal">
                              {ans.question.explanation}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link
          href="/user/reading"
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-2xl transition-all shadow-md shadow-primary/20 text-sm"
        >
          Practice Another Exam
        </Link>
        <Link
          href={`/user/reading/${examId}`}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 hover:border-primary/40 text-gray-700 hover:text-primary font-semibold rounded-2xl transition-all text-sm"
        >
          Retry This Exam
        </Link>
      </div>
    </div>
  );
}
