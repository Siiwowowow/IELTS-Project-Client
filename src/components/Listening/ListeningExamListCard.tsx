"use client";

import { IListeningExam } from "@/types/listening.types";
import {
  IconHeadphones,
  IconClock,
  IconArrowRight,
  IconFileText,
  IconLock,
} from "@tabler/icons-react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";

interface Props {
  exam: IListeningExam;
}

export function ListeningExamListCard({ exam }: Props) {
  const { user } = useUser();
  const sectionCount = exam._count?.sections ?? exam.sections?.length ?? 0;
  
  const href = user ? `/practice/listening/${exam.id}` : `/login`;

  return (
    <Link href={href} className="block group h-full">
      <div className="relative bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-blue-600 transition-all duration-300 overflow-hidden h-full flex flex-col justify-between group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        
        {/* Subtle top accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300" />

        <div className="space-y-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-900 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
              <IconHeadphones size={24} />
            </div>
            
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              {!user ? <IconLock size={16} /> : <IconArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-black text-black leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
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
              <span>{sectionCount} Part{sectionCount !== 1 ? "s" : ""}</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
              <IconClock size={14} />
              <span>{exam.duration} Min</span>
            </span>
          </div>
          
          {!user && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
              Login to start
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
