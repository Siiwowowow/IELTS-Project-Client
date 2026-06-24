"use client";

import { useQuery } from "@tanstack/react-query";
import { listeningService } from "@/services/listening.services";
import { ListeningExamListCard } from "@/components/Listening/ListeningExamListCard";
import {
  IconHeadphones,
  IconLoader2,
  IconAlertCircle,
  IconMoodSad,
} from "@tabler/icons-react";

export default function ListeningPracticePage() {
  const examsQuery = useQuery({
    queryKey: ["listening-exams"],
    queryFn: () => listeningService.getAllExams(),
  });

  const exams = examsQuery.data?.data ?? [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6 px-4">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2.5 uppercase tracking-tight">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
              <IconHeadphones size={24} />
            </span>
            Listening Practice
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-2 ml-12">
            Computer-based IELTS Listening — select a practice mock test to begin.
          </p>
        </div>
      </div>

      {/* Exam list */}
      <section>
        {examsQuery.isLoading && (
          <div className="flex items-center justify-center py-20">
            <IconLoader2 size={32} className="animate-spin text-blue-600" />
          </div>
        )}

        {examsQuery.isError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 font-medium">
            <IconAlertCircle size={20} className="shrink-0" />
            <p className="text-sm">Failed to load listening exams. Please refresh and try again.</p>
          </div>
        )}

        {!examsQuery.isLoading && !examsQuery.isError && exams.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <IconMoodSad size={48} className="opacity-30" />
            <p className="text-sm font-medium">No listening exams available yet.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <ListeningExamListCard key={exam.id} exam={exam} />
          ))}
        </div>
      </section>
    </div>
  );
}
