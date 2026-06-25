"use client";

import { IWritingExam } from "@/types/writing.types";
import {
  IconPencil,
  IconClock,
  IconArrowRight,
  IconFileText,
  IconLock,
} from "@tabler/icons-react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";

interface Props {
  exam: IWritingExam;
}

export function WritingExamListCard({ exam }: Props) {
  const { user } = useUser();
  const taskCount = exam._count?.tasks ?? exam.tasks?.length ?? 2;
  const examTypeLabel = exam.examType === "GENERAL_TRAINING" ? "General Training" : "Academic";

  const href = user ? `/practice/writing/${exam.id}` : `/login`;

  return (
    <Link href={href} className="block group h-full">
      <div className="relative bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-violet-600 transition-all duration-300 overflow-hidden h-full flex flex-col justify-between group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        
        {/* Top accent line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-violet-600 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300" />

        <div className="space-y-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-900 group-hover:bg-violet-600 group-hover:text-white transition-colors duration-300">
              <IconPencil size={24} />
            </div>
            
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-50 text-gray-400 group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
              {!user ? <IconLock size={16} /> : <IconArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100 uppercase tracking-wide">
                {examTypeLabel}
              </span>
            </div>
            <h3 className="text-lg font-black text-black leading-snug group-hover:text-violet-600 transition-colors line-clamp-2">
              {exam.title}
            </h3>
            {exam.description && (
              <p className="mt-2 text-sm font-medium text-gray-500 line-clamp-2">
                {exam.description}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
              <IconFileText size={14} />
              <span>{taskCount} Task{taskCount !== 1 ? "s" : ""}</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
              <IconClock size={14} />
              <span>{exam.duration} Min</span>
            </span>
          </div>
          
          {!user && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600 bg-violet-50 px-2 py-1 rounded-md">
              Login to start
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
