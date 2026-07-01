"use client";

import { Sparkles, Mic, PenLine, CheckCircle2 } from "lucide-react";
import { InView } from "../shared/InView";
import { SectionHeader } from "../shared/SectionHeader";
import { GlassCard } from "../shared/GlassCard";
import { cn } from "@/lib/utils";

const writingFeedback = [
  { text: "The graph illustrates a significant increase", type: "ok" },
  { text: "in the number of students which was enrolled", type: "error" },
  { text: "between 2010 and 2020, reaching approximately 45%.", type: "ok" },
];

export function AIFeedbackSection() {
  return (
    <section id="ai" className="hp-section bg-gradient-to-b from-neutral-50 to-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <InView>
          <SectionHeader
            eyebrow="এআই-চালিত মূল্যায়ন"
            title="তাৎক্ষণিক রাইটিং ও স্পিকিং ফিডব্যাক"
            description="অফিশিয়াল আইইএলটিএস মূল্যায়ন মানদণ্ডের সাথে সামঞ্জস্যপূর্ণ পেশাদার এআই বিশ্লেষণ — ব্যাকরণ, সুসংগতি, শব্দভাণ্ডার এবং সঠিক উচ্চারণ।"
          />
        </InView>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <InView>
            <GlassCard className="h-full p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <PenLine className="size-5 text-ielts-red" />
                <h3 className="font-bold text-neutral-900">রাইটিং সংশোধন (Writing Correction)</h3>
                <span className="ml-auto flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-ielts-red">
                  <Sparkles className="size-3" />
                  AI
                </span>
              </div>

              <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-4 font-mono text-sm leading-relaxed">
                {writingFeedback.map((line, i) => (
                  <span
                    key={i}
                    className={cn(
                      line.type === "error" &&
                        "bg-red-100/80 text-red-800 underline decoration-red-400 decoration-wavy"
                    )}
                  >
                    {line.text}{" "}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "টাস্ক অ্যাচিভমেন্ট", score: "6.5" },
                  { label: "কোহেরেন্স (সুসংগতি)", score: "7.0" },
                  { label: "লেক্সিক্যাল রিসোর্স", score: "6.5" },
                  { label: "গ্রামার (ব্যাকরণ)", score: "6.0" },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="rounded-lg border border-neutral-100 bg-white p-3 text-center"
                  >
                    <p className="text-[10px] font-medium text-neutral-500">{c.label}</p>
                    <p className="text-lg font-bold text-neutral-900">{c.score}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-red-50 to-blue-50 p-4">
                <span className="text-sm font-medium text-neutral-700">
                  আনুমানিক রাইটিং ব্যান্ড (Estimated Band)
                </span>
                <span className="text-2xl font-bold text-ielts-red">6.5</span>
              </div>
            </GlassCard>
          </InView>

          <InView delay={100}>
            <GlassCard className="h-full p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <Mic className="size-5 text-ielts-red" />
                <h3 className="font-bold text-neutral-900">স্পিকিং বিশ্লেষণ (Speaking Analysis)</h3>
              </div>

              <div className="flex h-24 items-end justify-center gap-0.5 rounded-xl bg-neutral-900 p-4">
                {Array.from({ length: 48 }).map((_, i) => {
                  const value = 22 + Math.sin(i * 0.45) * 32 + ((i * 5) % 12)
                  const height = `${Number(value).toFixed(4)}%`

                  return (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-gradient-to-t from-ielts-red to-red-300"
                      style={{ height }}
                    />
                  )
                })}
              </div>

              <div className="mt-4 space-y-2">
                {[
                  "অনর্গলতা ও সুসংগতি: সামান্য দ্বিধাদ্বন্দ্ব সহ স্বাভাবিক গতি বজায় রাখুন (Fluency)",
                  "উচ্চারণ: স্বরবর্ণের উচ্চারণ স্পষ্ট; \"think\" শব্দের /θ/ উচ্চারণে মনোযোগ দিন (Pronunciation)",
                  "লেক্সিক্যাল রিসোর্স: বিষয়ের সাথে প্রাসঙ্গিক চমৎকার শব্দভাণ্ডার (Vocabulary)",
                ].map((tip) => (
                  <div
                    key={tip}
                    className="flex items-start gap-2 rounded-lg border border-neutral-100 bg-white p-3 text-sm text-neutral-600"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    {tip}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                <span className="text-sm font-medium text-neutral-700">
                  আনুমানিক স্পিকিং ব্যান্ড (Estimated Band)
                </span>
                <span className="text-2xl font-bold text-emerald-700">7.0</span>
              </div>
            </GlassCard>
          </InView>
        </div>
      </div>
    </section>
  );
}
