"use client";

import Link from "next/link";
import { Children, isValidElement, useMemo, useState, type ReactNode } from "react";
import {
  IconAlertCircle,
  IconBook2,
  IconClock,
  IconHeadphones,
  IconMicrophone,
  IconMoodSad,
  IconPencil,
  IconSearch,
  IconSparkles,
  IconX,
  type Icon,
} from "@tabler/icons-react";

export type PracticeSkill = "listening" | "reading" | "writing" | "speaking";

const skillConfig: Record<
  PracticeSkill,
  {
    label: string;
    eyebrow: string;
    badge: string;
    description: string;
    Icon: Icon;
  }
> = {
  listening: {
    label: "Listening",
    eyebrow: "Authentic 4-part audio simulation with Cambridge-style question sets",
    badge: "Audio CBT",
    description:
      "Build focus with realistic audio, timed sections, and test day question flows.",
    Icon: IconHeadphones,
  },
  reading: {
    label: "Reading",
    eyebrow: "Full-length 3-passage timed practice with authentic split-screen interface",
    badge: "Split-Screen CBT",
    description:
      "Sharpen skimming, scanning, and comprehension under real IELTS timing.",
    Icon: IconBook2,
  },
  writing: {
    label: "Writing",
    eyebrow: "Task 1 & Task 2 computer-delivered environment with live word count",
    badge: "Official Prompt CBT",
    description:
      "Practise Task 1 and Task 2 with prompt views, word counters, and timer.",
    Icon: IconPencil,
  },
  speaking: {
    label: "Speaking",
    eyebrow: "Interactive 3-part interview simulator with recording & preparation timers",
    badge: "Voice CBT Simulator",
    description:
      "Rehearse all three speaking parts with realistic preparation and recording.",
    Icon: IconMicrophone,
  },
};

interface PracticePageShellProps {
  skill: PracticeSkill;
  examCount: number;
  isLoading: boolean;
  isError: boolean;
  children: ReactNode;
}

function PracticeExamSkeleton() {
  return (
    <div className="flex h-48 flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 animate-pulse">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-slate-200" />
            <div className="h-5 w-20 rounded-md bg-slate-200" />
          </div>
          <div className="h-5 w-12 rounded-md bg-slate-200" />
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-4.5 w-3/4 rounded bg-slate-200" />
          <div className="h-3.5 w-full rounded bg-slate-100" />
        </div>
        <div className="mt-3 flex gap-2">
          <div className="h-4 w-16 rounded bg-slate-100" />
          <div className="h-4 w-16 rounded bg-slate-100" />
        </div>
      </div>
      <div className="pt-2 border-t border-slate-100">
        <div className="h-8 w-full rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}

export function PracticePageShell({
  skill,
  examCount,
  isLoading,
  isError,
  children,
}: PracticePageShellProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const config = skillConfig[skill];
  const CurrentIcon = config.Icon;

  // Filter children based on search query (matching exam title, description, or badge)
  const childArray = useMemo(() => Children.toArray(children), [children]);

  const filteredChildren = useMemo(() => {
    if (!searchQuery.trim()) return childArray;
    const q = searchQuery.toLowerCase().trim();

    return childArray.filter((child) => {
      if (
        !isValidElement<{
          exam?: { title?: string; description?: string };
          badge?: string;
        }>(child)
      ) {
        return true;
      }
      const exam = child.props.exam;
      if (!exam) return true;
      const title = (exam.title || "").toLowerCase();
      const desc = (exam.description || "").toLowerCase();
      const badge = (child.props.badge || "").toLowerCase();
      return title.includes(q) || desc.includes(q) || badge.includes(q);
    });
  }, [childArray, searchQuery]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8fafc]">
      {/* Sleek, Compact Humanized Header */}
      <header className="border-b border-slate-200/90 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Left: Skill Identity + Pill */}
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-red-50 text-primary ring-1 ring-red-100 shrink-0">
                <CurrentIcon size={22} stroke={2.2} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    {config.label} Practice
                  </h1>
                  {!isLoading && !isError && (
                    <span className="rounded-full bg-red-50 border border-red-100 px-2 py-0.5 text-[11px] font-bold text-primary">
                      {examCount} {examCount === 1 ? "Test" : "Tests"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium line-clamp-1">
                  {config.eyebrow}
                </p>
              </div>
            </div>

            {/* Right: Quick Skill Navigation Tabs */}
            <nav
              aria-label="Practice skills"
              className="flex items-center gap-1 overflow-x-auto rounded-lg bg-slate-100/80 p-1 border border-slate-200/60 scrollbar-none"
            >
              {(Object.keys(skillConfig) as PracticeSkill[]).map((item) => {
                const itemConfig = skillConfig[item];
                const ItemIcon = itemConfig.Icon;
                const isActive = item === skill;
                return (
                  <Link
                    key={item}
                    href={`/practice/${item}`}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-xs"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    <ItemIcon size={14} />
                    <span>{itemConfig.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sub-bar: Instant Search & Format Indicators */}
          {!isLoading && !isError && examCount > 0 && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="relative w-full sm:w-72">
                <IconSearch
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${config.label.toLowerCase()} tests...`}
                  className="w-full h-8 pl-8 pr-7 text-xs bg-slate-50 border border-slate-200/90 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    aria-label="Clear search"
                  >
                    <IconX size={12} />
                  </button>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <IconClock size={13} className="text-slate-400" />
                  Official CBT Timers
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1">
                  <IconSparkles size={13} className="text-slate-400" />
                  Auto-Marking & Instant Score
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area: Exam Cards Directly Above the Fold */}
      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {/* Loading State: Shimmer Skeleton Grid */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <PracticeExamSkeleton key={idx} />
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex min-h-40 items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50/80 px-6 py-8 text-red-700">
            <IconAlertCircle size={22} className="shrink-0" />
            <div>
              <p className="text-sm font-bold">
                Could not load {config.label.toLowerCase()} practice tests
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Please check your network connection or refresh the page.
              </p>
            </div>
          </div>
        )}

        {/* Empty State: 0 exams in DB */}
        {!isLoading && !isError && examCount === 0 && (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-primary">
              <IconMoodSad size={24} />
            </span>
            <p className="font-bold text-slate-800 text-sm sm:text-base">
              No {config.label.toLowerCase()} tests published yet
            </p>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              New official-style practice tests are being prepared and will appear
              here soon.
            </p>
          </div>
        )}

        {/* Empty Search Result State */}
        {!isLoading &&
          !isError &&
          examCount > 0 &&
          filteredChildren.length === 0 && (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
              <p className="text-sm font-bold text-slate-800">
                No tests match &ldquo;{searchQuery}&rdquo;
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Try searching with a different term or keyword.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-3 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Clear Search Filter
              </button>
            </div>
          )}

        {/* Exam Cards Grid */}
        {!isLoading && !isError && filteredChildren.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
            {filteredChildren}
          </div>
        )}
      </section>
    </div>
  );
}
