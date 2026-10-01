"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  HelpCircle,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type ExamType = "academic" | "general";
type ScoreMode = "band" | "raw";

// Real Cambridge Raw to Band mappings
const rawToListeningBand = (raw: number): number => {
  if (raw >= 39) return 9.0;
  if (raw >= 37) return 8.5;
  if (raw >= 35) return 8.0;
  if (raw >= 32) return 7.5;
  if (raw >= 30) return 7.0;
  if (raw >= 26) return 6.5;
  if (raw >= 23) return 6.0;
  if (raw >= 18) return 5.5;
  if (raw >= 16) return 5.0;
  if (raw >= 13) return 4.5;
  if (raw >= 10) return 4.0;
  if (raw >= 8) return 3.5;
  if (raw >= 6) return 3.0;
  if (raw >= 4) return 2.5;
  return 2.0;
};

const rawToReadingBand = (raw: number, type: ExamType): number => {
  if (type === "academic") {
    if (raw >= 39) return 9.0;
    if (raw >= 37) return 8.5;
    if (raw >= 35) return 8.0;
    if (raw >= 33) return 7.5;
    if (raw >= 30) return 7.0;
    if (raw >= 27) return 6.5;
    if (raw >= 23) return 6.0;
    if (raw >= 19) return 5.5;
    if (raw >= 15) return 5.0;
    if (raw >= 13) return 4.5;
    if (raw >= 10) return 4.0;
    if (raw >= 8) return 3.5;
    if (raw >= 6) return 3.0;
    if (raw >= 4) return 2.5;
    return 2.0;
  }
  // General Training
  if (raw >= 40) return 9.0;
  if (raw >= 39) return 8.5;
  if (raw >= 37) return 8.0;
  if (raw >= 36) return 7.5;
  if (raw >= 34) return 7.0;
  if (raw >= 32) return 6.5;
  if (raw >= 30) return 6.0;
  if (raw >= 27) return 5.5;
  if (raw >= 23) return 5.0;
  if (raw >= 19) return 4.5;
  if (raw >= 15) return 4.0;
  if (raw >= 12) return 3.5;
  if (raw >= 9) return 3.0;
  return 2.5;
};

/**
 * Cambridge official rounding formula: Math.round(average * 2) / 2
 */
const computeOverallScore = (
  l: number,
  r: number,
  w: number,
  s: number,
) => {
  const sum = l + r + w + s;
  const exact = Number((sum / 4).toFixed(3));
  const rounded = Math.round(exact * 2) / 2;
  const fraction = Number((exact % 1).toFixed(3));

  let note = "";
  if (fraction === 0 || fraction === 0.5) {
    note = `Exact average ${exact.toFixed(2)}`;
  } else if (fraction >= 0.75) {
    note = `Avg ${exact.toFixed(2)} rounds UP (≥.75)`;
  } else if (fraction >= 0.25) {
    note = `Avg ${exact.toFixed(2)} rounds to .5`;
  } else {
    note = `Avg ${exact.toFixed(2)} rounds DOWN (<.25)`;
  }

  return { overall: rounded, exact, note };
};

const getBandDescriptor = (band: number) => {
  if (band >= 8.5) {
    return {
      title: "Expert User",
      cefr: "C2",
      desc: "Fully operational command of English: fluent, accurate, and sophisticated.",
      badgeColor: "bg-emerald-600 text-white",
    };
  }
  if (band >= 7.5) {
    return {
      title: "Very Good User",
      cefr: "C1",
      desc: "Operational command with occasional inaccuracies. Handles complex arguments.",
      badgeColor: "bg-blue-600 text-white",
    };
  }
  if (band >= 6.5) {
    return {
      title: "Competent User",
      cefr: "B2",
      desc: "Generally effective command. Suitable for undergraduate & graduate programs.",
      badgeColor: "bg-amber-600 text-white",
    };
  }
  if (band >= 5.5) {
    return {
      title: "Modest User",
      cefr: "B1",
      desc: "Partial command with frequent mistakes. Foundation courses suggested.",
      badgeColor: "bg-orange-600 text-white",
    };
  }
  return {
    title: "Limited User",
    cefr: "A2",
    desc: "Basic understanding only in familiar situations. Needs structured practice.",
    badgeColor: "bg-rose-600 text-white",
  };
};

export const BandScoreCalculatorSection: React.FC = () => {
  const [examType, setExamType] = useState<ExamType>("academic");
  const [scoreMode, setScoreMode] = useState<ScoreMode>("band");

  // Band scores
  const [listeningBand, setListeningBand] = useState<number>(7.5);
  const [readingBand, setReadingBand] = useState<number>(7.0);
  const [writingBand, setWritingBand] = useState<number>(6.5);
  const [speakingBand, setSpeakingBand] = useState<number>(7.5);

  // Raw scores (out of 40)
  const [listeningRaw, setListeningRaw] = useState<number>(33);
  const [readingRaw, setReadingRaw] = useState<number>(30);

  const effectiveL =
    scoreMode === "raw" ? rawToListeningBand(listeningRaw) : listeningBand;
  const effectiveR =
    scoreMode === "raw" ? rawToReadingBand(readingRaw, examType) : readingBand;
  const effectiveW = writingBand;
  const effectiveS = speakingBand;

  const { overall, exact, note } = computeOverallScore(
    effectiveL,
    effectiveR,
    effectiveW,
    effectiveS,
  );
  const descriptor = getBandDescriptor(overall);

  const stepBand = (
    current: number,
    setter: (val: number) => void,
    delta: number,
  ) => {
    const next = Math.min(9, Math.max(0, Number((current + delta).toFixed(1))));
    setter(next);
  };

  const stepRaw = (
    current: number,
    setter: (val: number) => void,
    delta: number,
  ) => {
    const next = Math.min(40, Math.max(0, current + delta));
    setter(next);
  };

  const handleReset = () => {
    setListeningBand(7.0);
    setReadingBand(7.0);
    setWritingBand(6.5);
    setSpeakingBand(7.0);
    setListeningRaw(30);
    setReadingRaw(30);
  };

  return (
    <section
      id="band-calculator"
      className="relative overflow-hidden bg-[#f8f3e9] py-8 sm:py-10 font-jakarta"
    >
      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ============================================================
            REALISTIC IELTS TEST REPORT FORM (TRF) CARD
        ============================================================ */}
        <div className="relative overflow-hidden rounded-2xl border-[2.5px] border-[#1f2421] bg-[#fffdf7] shadow-[6px_7px_0_#1f2421]">
          {/* Subtle Security / Guilloche Pattern Watermark background */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035] select-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 14px)",
            }}
          />

          {/* ---------------- TRF HEADER BAR ---------------- */}
          <div className="relative flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1f2421] bg-[#f4eee1] px-4 py-2.5 sm:px-6">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-md border-1.5 border-[#1f2421] bg-[#e52828] text-white shadow-xs">
                <span className="text-[10px] font-black tracking-tight">TRF</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#171715]">
                    Test Report Form (TRF) Calculator
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded bg-white/80 border border-[#1f2421]/30 px-1.5 py-0.2 text-[9px] font-bold text-zinc-700">
                    <ShieldCheck className="size-2.5 text-emerald-600" />
                    Official Cambridge Rule
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 font-medium">
                  British Council · IDP IELTS · Cambridge Assessment English
                </p>
              </div>
            </div>

            {/* Controls: Mode & Exam Type Switchers */}
            <div className="flex items-center gap-1.5">
              {/* Exam Type Toggle */}
              <div className="inline-flex rounded-lg border border-[#1f2421] bg-white p-0.5 text-[11px] font-bold shadow-xs">
                <button
                  type="button"
                  onClick={() => setExamType("academic")}
                  className={`rounded px-2 py-0.5 transition-all cursor-pointer ${
                    examType === "academic"
                      ? "bg-[#1f2421] text-white"
                      : "text-zinc-600 hover:text-black"
                  }`}
                >
                  Academic
                </button>
                <button
                  type="button"
                  onClick={() => setExamType("general")}
                  className={`rounded px-2 py-0.5 transition-all cursor-pointer ${
                    examType === "general"
                      ? "bg-[#1f2421] text-white"
                      : "text-zinc-600 hover:text-black"
                  }`}
                >
                  General
                </button>
              </div>

              {/* Mode Toggle (Bands vs 0-40 Raw) */}
              <div className="inline-flex rounded-lg border border-[#1f2421] bg-white p-0.5 text-[11px] font-bold shadow-xs">
                <button
                  type="button"
                  onClick={() => setScoreMode("band")}
                  className={`rounded px-2 py-0.5 transition-all cursor-pointer ${
                    scoreMode === "band"
                      ? "bg-[#e52828] text-white"
                      : "text-zinc-600 hover:text-black"
                  }`}
                >
                  Bands (0-9)
                </button>
                <button
                  type="button"
                  onClick={() => setScoreMode("raw")}
                  className={`rounded px-2 py-0.5 transition-all cursor-pointer ${
                    scoreMode === "raw"
                      ? "bg-[#e52828] text-white"
                      : "text-zinc-600 hover:text-black"
                  }`}
                >
                  Raw (0-40)
                </button>
              </div>

              {/* Reset Button */}
              <button
                type="button"
                onClick={handleReset}
                title="Reset to default"
                className="flex size-7 items-center justify-center rounded-lg border border-[#1f2421] bg-white text-zinc-700 hover:bg-amber-100 transition-all cursor-pointer shadow-xs"
              >
                <RotateCcw className="size-3" />
              </button>
            </div>
          </div>

          {/* ---------------- MAIN COMPACT GRID ---------------- */}
          <div className="relative p-4 sm:p-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* LEFT: 4 SKILL MODULE CELLS (lg:col-span-8) */}
              <div className="lg:col-span-8 flex flex-col justify-between">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* 1. LISTENING */}
                  <div className="flex flex-col justify-between rounded-xl border-1.5 border-[#1f2421] bg-white p-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-1.5">
                      <span className="text-[11px] font-extrabold uppercase tracking-wide text-zinc-800">
                        Listening
                      </span>
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 rounded">
                        {scoreMode === "raw" ? `${listeningRaw}/40` : "0-9"}
                      </span>
                    </div>

                    {/* Band Big Digital Display */}
                    <div className="my-2 text-center">
                      <div className="text-3xl font-black tracking-tight text-[#171715]">
                        {effectiveL.toFixed(1)}
                      </div>
                      <span className="text-[9px] uppercase font-bold text-zinc-400">
                        Band Score
                      </span>
                    </div>

                    {/* Stepper Buttons (- and +) */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          scoreMode === "raw"
                            ? stepRaw(listeningRaw, setListeningRaw, -1)
                            : stepBand(listeningBand, setListeningBand, -0.5)
                        }
                        className="flex-1 flex h-7 items-center justify-center rounded-md border border-[#1f2421] bg-zinc-50 hover:bg-zinc-200 active:scale-95 transition-all font-black text-sm cursor-pointer"
                        aria-label="Decrease listening score"
                      >
                        <Minus className="size-3 stroke-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          scoreMode === "raw"
                            ? stepRaw(listeningRaw, setListeningRaw, 1)
                            : stepBand(listeningBand, setListeningBand, 0.5)
                        }
                        className="flex-1 flex h-7 items-center justify-center rounded-md border border-[#1f2421] bg-zinc-50 hover:bg-zinc-200 active:scale-95 transition-all font-black text-sm cursor-pointer"
                        aria-label="Increase listening score"
                      >
                        <Plus className="size-3 stroke-3" />
                      </button>
                    </div>

                    {/* Micro Range Slider */}
                    <input
                      type="range"
                      min={scoreMode === "raw" ? 0 : 0}
                      max={scoreMode === "raw" ? 40 : 9}
                      step={scoreMode === "raw" ? 1 : 0.5}
                      value={scoreMode === "raw" ? listeningRaw : listeningBand}
                      onChange={(e) =>
                        scoreMode === "raw"
                          ? setListeningRaw(Number(e.target.value))
                          : setListeningBand(Number(e.target.value))
                      }
                      className="mt-2 w-full accent-blue-600 h-1.5 bg-zinc-200 rounded-sm cursor-pointer"
                    />
                  </div>

                  {/* 2. READING */}
                  <div className="flex flex-col justify-between rounded-xl border-1.5 border-[#1f2421] bg-white p-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-1.5">
                      <span className="text-[11px] font-extrabold uppercase tracking-wide text-zinc-800">
                        Reading
                      </span>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">
                        {scoreMode === "raw" ? `${readingRaw}/40` : "0-9"}
                      </span>
                    </div>

                    {/* Band Big Digital Display */}
                    <div className="my-2 text-center">
                      <div className="text-3xl font-black tracking-tight text-[#171715]">
                        {effectiveR.toFixed(1)}
                      </div>
                      <span className="text-[9px] uppercase font-bold text-zinc-400">
                        Band Score
                      </span>
                    </div>

                    {/* Stepper Buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          scoreMode === "raw"
                            ? stepRaw(readingRaw, setReadingRaw, -1)
                            : stepBand(readingBand, setReadingBand, -0.5)
                        }
                        className="flex-1 flex h-7 items-center justify-center rounded-md border border-[#1f2421] bg-zinc-50 hover:bg-zinc-200 active:scale-95 transition-all font-black text-sm cursor-pointer"
                        aria-label="Decrease reading score"
                      >
                        <Minus className="size-3 stroke-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          scoreMode === "raw"
                            ? stepRaw(readingRaw, setReadingRaw, 1)
                            : stepBand(readingBand, setReadingBand, 0.5)
                        }
                        className="flex-1 flex h-7 items-center justify-center rounded-md border border-[#1f2421] bg-zinc-50 hover:bg-zinc-200 active:scale-95 transition-all font-black text-sm cursor-pointer"
                        aria-label="Increase reading score"
                      >
                        <Plus className="size-3 stroke-3" />
                      </button>
                    </div>

                    {/* Micro Range Slider */}
                    <input
                      type="range"
                      min={scoreMode === "raw" ? 0 : 0}
                      max={scoreMode === "raw" ? 40 : 9}
                      step={scoreMode === "raw" ? 1 : 0.5}
                      value={scoreMode === "raw" ? readingRaw : readingBand}
                      onChange={(e) =>
                        scoreMode === "raw"
                          ? setReadingRaw(Number(e.target.value))
                          : setReadingBand(Number(e.target.value))
                      }
                      className="mt-2 w-full accent-emerald-600 h-1.5 bg-zinc-200 rounded-sm cursor-pointer"
                    />
                  </div>

                  {/* 3. WRITING */}
                  <div className="flex flex-col justify-between rounded-xl border-1.5 border-[#1f2421] bg-white p-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-1.5">
                      <span className="text-[11px] font-extrabold uppercase tracking-wide text-zinc-800">
                        Writing
                      </span>
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 rounded">
                        0-9
                      </span>
                    </div>

                    {/* Band Big Digital Display */}
                    <div className="my-2 text-center">
                      <div className="text-3xl font-black tracking-tight text-[#171715]">
                        {effectiveW.toFixed(1)}
                      </div>
                      <span className="text-[9px] uppercase font-bold text-zinc-400">
                        Band Score
                      </span>
                    </div>

                    {/* Stepper Buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          stepBand(writingBand, setWritingBand, -0.5)
                        }
                        className="flex-1 flex h-7 items-center justify-center rounded-md border border-[#1f2421] bg-zinc-50 hover:bg-zinc-200 active:scale-95 transition-all font-black text-sm cursor-pointer"
                        aria-label="Decrease writing score"
                      >
                        <Minus className="size-3 stroke-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          stepBand(writingBand, setWritingBand, 0.5)
                        }
                        className="flex-1 flex h-7 items-center justify-center rounded-md border border-[#1f2421] bg-zinc-50 hover:bg-zinc-200 active:scale-95 transition-all font-black text-sm cursor-pointer"
                        aria-label="Increase writing score"
                      >
                        <Plus className="size-3 stroke-3" />
                      </button>
                    </div>

                    {/* Micro Range Slider */}
                    <input
                      type="range"
                      min={0}
                      max={9}
                      step={0.5}
                      value={writingBand}
                      onChange={(e) => setWritingBand(Number(e.target.value))}
                      className="mt-2 w-full accent-amber-600 h-1.5 bg-zinc-200 rounded-sm cursor-pointer"
                    />
                  </div>

                  {/* 4. SPEAKING */}
                  <div className="flex flex-col justify-between rounded-xl border-1.5 border-[#1f2421] bg-white p-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-1.5">
                      <span className="text-[11px] font-extrabold uppercase tracking-wide text-zinc-800">
                        Speaking
                      </span>
                      <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 rounded">
                        0-9
                      </span>
                    </div>

                    {/* Band Big Digital Display */}
                    <div className="my-2 text-center">
                      <div className="text-3xl font-black tracking-tight text-[#171715]">
                        {effectiveS.toFixed(1)}
                      </div>
                      <span className="text-[9px] uppercase font-bold text-zinc-400">
                        Band Score
                      </span>
                    </div>

                    {/* Stepper Buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          stepBand(speakingBand, setSpeakingBand, -0.5)
                        }
                        className="flex-1 flex h-7 items-center justify-center rounded-md border border-[#1f2421] bg-zinc-50 hover:bg-zinc-200 active:scale-95 transition-all font-black text-sm cursor-pointer"
                        aria-label="Decrease speaking score"
                      >
                        <Minus className="size-3 stroke-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          stepBand(speakingBand, setSpeakingBand, 0.5)
                        }
                        className="flex-1 flex h-7 items-center justify-center rounded-md border border-[#1f2421] bg-zinc-50 hover:bg-zinc-200 active:scale-95 transition-all font-black text-sm cursor-pointer"
                        aria-label="Increase speaking score"
                      >
                        <Plus className="size-3 stroke-3" />
                      </button>
                    </div>

                    {/* Micro Range Slider */}
                    <input
                      type="range"
                      min={0}
                      max={9}
                      step={0.5}
                      value={speakingBand}
                      onChange={(e) => setSpeakingBand(Number(e.target.value))}
                      className="mt-2 w-full accent-rose-600 h-1.5 bg-zinc-200 rounded-sm cursor-pointer"
                    />
                  </div>
                </div>

                {/* Formula Breakdown Strip */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-[#1f2421]/30 bg-[#f9f6ef] px-3 py-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5 text-zinc-700">
                    <span className="font-bold">Formula:</span>
                    <span className="font-mono text-zinc-600">
                      ({effectiveL} + {effectiveR} + {effectiveW} + {effectiveS}) ÷ 4 =
                    </span>
                    <span className="font-mono font-black text-[#171715]">
                      {exact}
                    </span>
                  </div>
                  <span className="font-semibold text-[#e52828]">{note}</span>
                </div>
              </div>

              {/* RIGHT: REALISTIC OFFICIAL OVERALL SCORE STAMP (lg:col-span-4) */}
              <div className="lg:col-span-4 flex flex-col justify-between rounded-xl border-2 border-[#1f2421] bg-[#171715] p-3.5 text-white shadow-xs">
                {/* Stamp Top Info */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      OVERALL BAND
                    </span>
                    <h4 className="text-base font-black uppercase tracking-tight text-white">
                      {descriptor.title}
                    </h4>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-black tracking-wide ${descriptor.badgeColor}`}
                  >
                    CEFR {descriptor.cefr}
                  </span>
                </div>

                {/* Big Embossed Stamp Box */}
                <div className="my-2.5 flex items-center justify-center gap-3">
                  <div className="relative flex h-18 w-24 items-center justify-center rounded-xl border-2 border-white/20 bg-linear-to-br from-[#ff392e] to-[#cc180e] shadow-md">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-black leading-none tracking-tight text-white">
                        {overall.toFixed(1)}
                      </span>
                      <span className="mt-0.5 text-[8px] font-extrabold uppercase tracking-widest text-white/80">
                        BAND
                      </span>
                    </div>
                  </div>

                  <p className="flex-1 text-[11px] leading-relaxed text-zinc-300 italic line-clamp-3">
                    &ldquo;{descriptor.desc}&rdquo;
                  </p>
                </div>

                {/* Bottom CTA Action Button */}
                <div className="pt-1">
                  <Link
                    href={`/register?target=${overall.toFixed(1)}`}
                    className="group flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#ef4032] hover:bg-[#d92215] py-2 px-3 text-xs font-black uppercase tracking-wider text-white transition-all shadow-xs active:scale-[0.98]"
                  >
                    <span>Target Band {overall.toFixed(1)} Prep</span>
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
