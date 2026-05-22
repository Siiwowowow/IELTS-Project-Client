"use client";

import { Clock, Grid3X3, Headphones, Mic, PenLine, BookOpen } from "lucide-react";
import { InView } from "../shared/InView";
import { SectionHeader } from "../shared/SectionHeader";
import { cn } from "@/lib/utils";

const annotations = [
  { label: "Live section timer", top: "8%", left: "4%", icon: Clock },
  { label: "Question navigator", top: "12%", right: "6%", icon: Grid3X3 },
  { label: "Split-screen reading", bottom: "38%", left: "6%", icon: BookOpen },
  { label: "Writing task editor", bottom: "18%", right: "8%", icon: PenLine },
  { label: "Listening player", bottom: "8%", left: "28%", icon: Headphones },
  { label: "Speaking recorder", bottom: "8%", right: "22%", icon: Mic },
];

export function CBTExperienceSection() {
  return (
    <section id="cbt" className="hp-section bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <InView>
          <SectionHeader
            eyebrow="Authentic Simulation"
            title="Experience the Real IELTS Computer-Based Exam"
            description="Every detail — from timers to navigation — mirrors the official CBT environment so exam day feels familiar."
          />
        </InView>

        <InView delay={120} className="relative mt-16">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-red-500/10 via-transparent to-blue-500/10 blur-2xl" />

          <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-900 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-950 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="size-3 rounded-full bg-red-500/90" />
                <span className="size-3 rounded-full bg-amber-500/90" />
                <span className="size-3 rounded-full bg-emerald-500/90" />
              </div>
              <span className="flex-1 text-center text-xs font-medium text-neutral-400">
                IELTS on Computer — Full Mock Test
              </span>
              <span className="rounded bg-red-600/90 px-2 py-0.5 font-mono text-xs font-bold text-white">
                01:42:18
              </span>
            </div>

            <div className="grid lg:grid-cols-2">
              <div className="border-b border-neutral-800 p-6 lg:border-b-0 lg:border-r">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-red-400">
                  Reading Passage 3
                </p>
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-2 rounded bg-neutral-700/80"
                      style={{ width: `${85 - i * 4}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="p-6">
                <p className="mb-3 text-xs font-semibold text-neutral-400">
                  Questions 27–32
                </p>
                <div className="grid grid-cols-6 gap-1.5">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex h-7 items-center justify-center rounded text-[10px] font-medium",
                        i === 4
                          ? "bg-ielts-red text-white"
                          : i < 10
                            ? "bg-emerald-900/50 text-emerald-400"
                            : "bg-neutral-800 text-neutral-500"
                      )}
                    >
                      {27 + i}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-px border-t border-neutral-800 bg-neutral-950">
              {[
                { label: "Writing Task 2", words: "287 / 250 min" },
                { label: "Listening Part 3", words: "Playing 02:14" },
                { label: "Speaking Part 2", words: "Recording..." },
              ].map((panel) => (
                <div
                  key={panel.label}
                  className="bg-neutral-900/80 p-4 text-center"
                >
                  <p className="text-[10px] font-medium text-neutral-500">
                    {panel.label}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-neutral-300">
                    {panel.words}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {annotations.map((ann) => {
            const Icon = ann.icon;
            const style: React.CSSProperties = {
              top: ann.top,
              left: ann.left,
              right: ann.right,
              bottom: ann.bottom,
            };
            return (
              <div
                key={ann.label}
                style={style}
                className="hp-glass absolute z-10 hidden items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-neutral-800 shadow-lg lg:flex"
              >
                <Icon className="size-3.5 text-ielts-red" />
                {ann.label}
              </div>
            );
          })}
        </InView>
      </div>
    </section>
  );
}
