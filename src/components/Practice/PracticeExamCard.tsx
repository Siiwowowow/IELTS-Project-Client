"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  IconArrowRight,
  IconClock,
  IconFileText,
  IconLock,
  IconSparkles,
} from "@tabler/icons-react";
import type { PracticeSkill } from "./PracticePageShell";

interface PracticeExamCardProps {
  href: string;
  skill: PracticeSkill;
  title: string;
  description?: string | null;
  duration: number;
  itemCount: number;
  itemLabel: string;
  badge: string;
  isLoggedIn: boolean;
  icon: ReactNode;
  index?: number;
}

export function PracticeExamCard({
  href,
  skill,
  title,
  description,
  duration,
  itemCount,
  itemLabel,
  badge,
  isLoggedIn,
  icon,
}: PracticeExamCardProps) {
  // Determine helper text based on skill if description is absent
  const fallbackDesc =
    skill === "reading"
      ? "Full-length passages with authentic IELTS timing and CBT navigation."
      : skill === "writing"
      ? "Task 1 & Task 2 workspace with live word counter and authentic exam prompt."
      : skill === "listening"
      ? "Realistic 4-section audio test with synchronized question progress."
      : "Interactive 3-part speaking test with recording and preparation timers.";

  return (
    <Link
      href={href}
      className="group/card block h-full focus-visible:outline-none"
    >
      <article className="relative flex h-full flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-4 transition-all duration-200 hover:-translate-y-1 hover:border-red-300 hover:shadow-lg hover:shadow-red-500/10 focus-visible:ring-2 focus-visible:ring-primary sm:p-4.5">
        <div>
          {/* Top meta row: Skill Icon, Format Badge, Duration */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-primary ring-1 ring-red-100 transition-colors group-hover/card:bg-red-600 group-hover/card:text-white shrink-0">
                {icon}
              </span>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700">
                {badge}
              </span>
            </div>

            <span className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-600 border border-slate-100 shrink-0">
              <IconClock size={13} className="text-slate-400" />
              {duration}m
            </span>
          </div>

          {/* Title & Description */}
          <div className="mt-3">
            <h3 className="line-clamp-2 text-sm sm:text-base font-bold text-slate-900 transition-colors group-hover/card:text-primary leading-snug">
              {title}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
              {description || fallbackDesc}
            </p>
          </div>

          {/* Quick Specs Pills */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
              <IconFileText size={12} className="text-slate-500" />
              {itemCount} {itemLabel}{itemCount !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-primary">
              <IconSparkles size={11} />
              CBT Mode
            </span>
          </div>
        </div>

        {/* Footer Action */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-100">
          <div className="flex h-8 sm:h-8.5 w-full items-center justify-between rounded-lg bg-primary px-3 text-xs font-bold text-white transition-all group-hover/card:bg-red-700">
            <span className="flex items-center gap-1.5">
              {!isLoggedIn && <IconLock size={13} />}
              {isLoggedIn ? "Start Practice" : "Login to Start"}
            </span>
            <IconArrowRight
              size={14}
              className="transition-transform duration-200 group-hover/card:translate-x-1"
            />
          </div>
        </div>
      </article>
    </Link>
  );
}
