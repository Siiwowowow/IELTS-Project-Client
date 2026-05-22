"use client";

import Link from "next/link";
import {
  Headphones,
  BookOpen,
  PenLine,
  Mic,
  Library,
  Languages,
  AudioLines,
  ClipboardList,
  ArrowUpRight,
} from "lucide-react";
import { InView } from "../shared/InView";
import { SectionHeader } from "../shared/SectionHeader";
import { cn } from "@/lib/utils";

const modules = [
  { icon: Headphones, label: "Listening", href: "/practice/listening", color: "group-hover:border-red-200 group-hover:shadow-red-500/10" },
  { icon: BookOpen, label: "Reading", href: "/practice/reading", color: "group-hover:border-blue-200 group-hover:shadow-blue-500/10" },
  { icon: PenLine, label: "Writing", href: "/practice/writing", color: "group-hover:border-amber-200 group-hover:shadow-amber-500/10" },
  { icon: Mic, label: "Speaking", href: "/practice/speaking", color: "group-hover:border-emerald-200 group-hover:shadow-emerald-500/10" },
  { icon: Library, label: "Vocabulary", href: "/practice/vocabulary", color: "group-hover:border-violet-200 group-hover:shadow-violet-500/10" },
  { icon: Languages, label: "Grammar", href: "/practice/grammar", color: "group-hover:border-cyan-200 group-hover:shadow-cyan-500/10" },
  { icon: AudioLines, label: "Pronunciation", href: "/practice/pronunciation", color: "group-hover:border-pink-200 group-hover:shadow-pink-500/10" },
  { icon: ClipboardList, label: "Mock Tests", href: "/mock-tests/full", color: "group-hover:border-ielts-red/30 group-hover:shadow-red-500/15" },
];

export function PracticeModulesSection() {
  return (
    <section id="modules" className="hp-section bg-neutral-50/80 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <InView>
          <SectionHeader
            eyebrow="Practice Modules"
            title="Master Every IELTS Skill"
            description="Structured practice paths for each test component — from targeted drills to full mock exams."
          />
        </InView>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((mod, i) => (
            <InView key={mod.label} delay={i * 60}>
              <Link
                href={mod.href}
                className={cn(
                  "group relative flex flex-col rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                  mod.color
                )}
              >
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-100 text-ielts-red transition-colors group-hover:from-red-50 group-hover:to-red-100/50">
                  <mod.icon className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900">{mod.label}</h3>
                <p className="mt-2 flex-1 text-sm text-neutral-500">
                  Official-style exercises with instant scoring and progress tracking.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ielts-red opacity-0 transition-opacity group-hover:opacity-100">
                  Start practice
                  <ArrowUpRight className="size-4" />
                </span>
                <div className="absolute inset-x-0 bottom-0 h-0.5 scale-x-0 rounded-b-2xl bg-gradient-to-r from-ielts-red to-red-400 transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            </InView>
          ))}
        </div>
      </div>
    </section>
  );
}
