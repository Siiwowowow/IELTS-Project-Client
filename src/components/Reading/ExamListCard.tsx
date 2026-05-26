"use client";

import { IExam } from "@/types/reading.types";
import {
  IconBook,
  IconClock,
  IconArrowRight,
  IconFileText,
} from "@tabler/icons-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Props {
  exam: IExam;
}

export function ExamListCard({ exam }: Props) {
  const passageCount = exam._count?.passages ?? exam.passages?.length ?? 0;

  return (
    <Link href={`/practice/reading/${exam.id}`} className="block group">
      <div className="relative bg-white border border-gray-200 rounded-2xl p-6 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/8 transition-all duration-300 overflow-hidden h-full">

        {/* Top gradient line on hover */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary via-red-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl" />

        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/[0.03] group-hover:to-red-50/40 transition-all duration-500 rounded-2xl" />

        <div className="relative space-y-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
                <IconBook size={22} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors leading-snug text-sm">
                  {exam.title}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <IconFileText size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-400">
                    {passageCount} passage{passageCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
            <IconArrowRight
              size={18}
              className="shrink-0 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 mt-1"
            />
          </div>

          {/* Description */}
          {exam.description && (
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
              {exam.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <IconClock size={13} className="text-primary/60" />
              <span className="font-medium">{exam.duration} min</span>
            </span>
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(exam.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
