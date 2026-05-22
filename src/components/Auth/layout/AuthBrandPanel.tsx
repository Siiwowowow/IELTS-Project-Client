"use client";

import { Award, BookOpen, Clock, Headphones, Mic, PenLine } from "lucide-react";

const stats = [
  { value: "50K+", label: "Active learners" },
  { value: "8.5", label: "Avg. band achieved" },
  { value: "98%", label: "Would recommend" },
];

export function AuthBrandPanel() {
  return (
    <div className="relative flex h-full min-h-[280px] flex-col justify-between overflow-hidden p-8 lg:p-12">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#DC2626]/40 via-transparent to-[#DC2626]/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#DC2626]/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
          <Award className="size-3.5 text-[#fca5a5]" />
          Official-style CBT practice
        </div>
        <h1 className="max-w-md text-3xl font-bold leading-tight tracking-tight text-white lg:text-4xl xl:text-[2.75rem]">
          Practice IELTS Like the{" "}
          <span className="text-[#fca5a5]">Real Exam</span>
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70 lg:text-base">
          Computer-delivered mock tests, timed sections, and instant feedback —
          built for serious candidates targeting their dream band score.
        </p>
      </div>

      <div className="relative z-10 my-8 hidden flex-1 items-center justify-center md:flex">
        <div className="auth-float relative w-full max-w-md">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/95 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5">
              <div className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-red-400" />
                <span className="size-2.5 rounded-full bg-amber-400" />
                <span className="size-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="flex-1 text-center text-[10px] font-medium text-neutral-500">
                IELTS CBT — Listening Section 1
              </span>
              <Clock className="size-3.5 text-[#DC2626]" />
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Question 4 of 10</span>
                <span className="font-mono font-medium text-[#DC2626]">12:34</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full w-[40%] rounded-full bg-gradient-to-r from-[#DC2626] to-[#ef4444]" />
              </div>
              <p className="text-sm font-medium text-neutral-800">
                Complete the notes below. Write{" "}
                <span className="text-[#DC2626]">NO MORE THAN TWO WORDS</span> for
                each answer.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Headphones, label: "Listening", active: true },
                  { icon: BookOpen, label: "Reading", active: false },
                  { icon: PenLine, label: "Writing", active: false },
                  { icon: Mic, label: "Speaking", active: false },
                ].map(({ icon: Icon, label, active }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                      active
                        ? "border-[#DC2626]/30 bg-[#fef2f2] text-[#DC2626]"
                        : "border-neutral-100 bg-neutral-50 text-neutral-400"
                    }`}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="auth-float-delayed absolute -right-4 -top-6 rounded-xl border border-white/20 bg-white/90 px-3 py-2 shadow-lg backdrop-blur-sm">
            <p className="text-[10px] font-medium text-neutral-500">Band progress</p>
            <p className="text-lg font-bold text-[#DC2626]">7.0 → 7.5</p>
          </div>
          <div className="auth-float absolute -bottom-4 -left-4 rounded-xl border border-white/20 bg-white/90 px-3 py-2 shadow-lg backdrop-blur-sm">
            <p className="text-[10px] font-medium text-neutral-500">Today&apos;s streak</p>
            <p className="text-lg font-bold text-neutral-800">14 days 🔥</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center backdrop-blur-sm"
          >
            <p className="text-xl font-bold text-white lg:text-2xl">{stat.value}</p>
            <p className="mt-0.5 text-[10px] font-medium text-white/60 lg:text-xs">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
