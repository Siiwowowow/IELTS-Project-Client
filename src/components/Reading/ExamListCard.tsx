"use client";

import { IExam } from "@/types/reading.types";
import {
  IconBook,
  IconClock,
  IconArrowRight,
  IconFileText,
  IconLock,
} from "@tabler/icons-react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";

interface Props {
  exam: IExam;
}

export function ExamListCard({ exam }: Props) {
  const { user } = useUser();
  const passageCount = exam._count?.passages ?? exam.passages?.length ?? 0;
  
  // If not logged in, clicking goes to login. 
  // We can just set the href conditionally.
  const href = user ? `/practice/reading/${exam.id}` : `/login`;

  return (
    <Link href={href} className="block group h-full">
      <div className="relative bg-white border border-neutral-200/70 shadow-[0_8px_30px_rgba(0,0,0,0.02)] rounded-3xl p-6 hover:border-red-600 transition-all duration-500 overflow-hidden h-full flex flex-col justify-between min-h-[320px] hover:shadow-[0_20px_50px_rgba(220,38,38,0.06)] group-hover:-translate-y-1">
        
        <div className="space-y-5 flex-1">
          {/* Header row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors duration-500 shadow-sm">
              <IconBook size={24} />
            </div>
            
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-neutral-50 border border-neutral-200 text-neutral-600 transition-colors group-hover:bg-red-50 group-hover:text-red-700 uppercase tracking-wider">
              Reading
            </span>
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-neutral-900 leading-snug group-hover:text-red-600 transition-colors line-clamp-2">
              {exam.title}
            </h3>
            {exam.description ? (
              <p className="mt-3 text-sm font-medium text-neutral-500 line-clamp-3 leading-relaxed">
                {exam.description}
              </p>
            ) : (
              <p className="mt-3 text-sm font-medium text-neutral-400 italic">
                Practice test prepared for the IELTS Reading practice module.
              </p>
            )}
          </div>
        </div>

        <div>
          {/* Stats details */}
          <div className="mt-6 flex items-center gap-4 pt-4 border-t border-neutral-100 text-xs font-bold uppercase tracking-wider text-neutral-400">
            <span className="flex items-center gap-1.5">
              <IconFileText size={15} />
              <span>{passageCount} Part{passageCount !== 1 ? "s" : ""}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <IconClock size={15} />
              <span>{exam.duration} Min</span>
            </span>
          </div>

          {/* Premium CTA Button */}
          <div className="mt-5 w-full inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 text-white font-semibold text-sm transition-all duration-300 group-hover:bg-red-600 group-hover:shadow-lg group-hover:shadow-red-500/20 active:scale-[0.98]">
            {user ? (
              <>
                <span>Start Reading Exam</span>
                <IconArrowRight size={16} className="ml-1.5 transform group-hover:translate-x-1 transition-transform duration-300" />
              </>
            ) : (
              <>
                <IconLock size={16} className="mr-1.5" />
                <span>Login to Start</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
