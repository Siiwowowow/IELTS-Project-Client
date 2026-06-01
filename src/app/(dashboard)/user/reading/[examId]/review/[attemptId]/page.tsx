"use client";

import { use } from "react";
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
    <div className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-2xl p-5 gap-1 text-center">
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

  const { data, isLoading, isError } = useQuery({
    queryKey: ["attempt-review", attemptId],
    queryFn: () => readingService.getAttemptReview(attemptId),
  });

  const attempt = data?.data;

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

  // ── Derived ──────────────────────────────────────────────────────────────────
  const total     = attempt.answers.length;
  const correct   = attempt.score;
  const wrong     = total - correct;
  const pct       = total > 0 ? Math.round((correct / total) * 100) : 0;
  const bc        = bandColor(attempt.bandScore);
  const label     = bandLabel(attempt.bandScore);

  const startMs   = new Date(attempt.startTime).getTime();
  const endMs     = new Date(attempt.endTime).getTime();
  const elapsedMin = Math.round((endMs - startMs) / 60000);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">

      {/* Back */}
      <Link
        href="/user/reading"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors"
      >
        <IconArrowLeft size={15} />
        Back to Reading Practice
      </Link>

      {/* ── Hero score card ───────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-primary/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center gap-6">
          {/* Trophy */}
          <div className={`flex items-center justify-center h-20 w-20 rounded-2xl border-2 ${bc.ring} ${bc.bg} shrink-0`}>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<IconCircleCheck size={12} />}
          label="Correct"
          value={correct}
          highlight="text-green-600"
        />
        <StatCard
          icon={<IconX size={12} />}
          label="Incorrect"
          value={wrong}
          highlight="text-red-500"
        />
        <StatCard
          icon={<IconChartBar size={12} />}
          label="Accuracy"
          value={`${pct}%`}
          highlight={pct >= 70 ? "text-green-600" : pct >= 50 ? "text-orange-600" : "text-red-500"}
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
            className="h-full rounded-full bg-gradient-to-r from-primary to-red-400 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* ── Detailed answer review ────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <IconTarget size={18} className="text-primary" />
          Detailed Review
        </h2>

        <div className="space-y-3">
          {attempt.answers.map((ans) => (
            <div
              key={ans.id}
              className={`rounded-2xl border p-4 transition-all ${
                ans.isCorrect
                  ? "border-green-200 bg-green-50/60"
                  : "border-red-200 bg-red-50/60"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Correct/wrong icon */}
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5 ${
                    ans.isCorrect ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                  {ans.isCorrect ? (
                    <IconCheck size={13} className="text-white" />
                  ) : (
                    <IconX size={13} className="text-white" />
                  )}
                </div>

                <div className="flex-1 space-y-1.5 min-w-0">
                  {/* Meta */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-400">
                      Q{ans.question?.questionNumber}
                    </span>
                    {ans.question?.group?.passage?.title && (
                      <span className="text-xs text-gray-400 truncate">
                        — {ans.question.group.passage.title}
                      </span>
                    )}
                  </div>

                  {/* Question text */}
                  <p className="text-sm text-gray-800 font-medium leading-snug">
                    {ans.question?.questionText}
                  </p>

                  {/* Answer comparison */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1.5">
                      <span className="text-gray-400 text-xs">Your answer:</span>
                      <span
                        className={`font-semibold ${
                          ans.isCorrect ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {ans.submittedAnswer || "(no answer)"}
                      </span>
                    </span>

                    {!ans.isCorrect && ans.question?.correctAnswer && (
                      <span className="flex items-center gap-1.5">
                        <span className="text-gray-400 text-xs">Correct:</span>
                        <span className="font-semibold text-green-700">
                          {ans.question.correctAnswer}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Explanation */}
                  {ans.question?.explanation && (
                    <div className="flex items-start gap-2 bg-white/70 border border-gray-200 rounded-xl px-3 py-2 mt-1">
                      <IconBulb size={14} className="text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {ans.question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
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
