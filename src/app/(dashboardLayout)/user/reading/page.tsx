"use client";

import { useQuery } from "@tanstack/react-query";
import { readingService } from "@/services/reading.services";
import { ExamListCard } from "@/components/Reading/ExamListCard";
import {
  IconBook2,
  IconLoader2,
  IconAlertCircle,
  IconMoodSad,
  IconHistory,
} from "@tabler/icons-react";
import { IAttemptHistory } from "@/types/reading.types";
import { formatDistanceToNow } from "date-fns";

function getBandColor(band: number) {
  if (band >= 7) return "text-green-600 bg-green-50 border-green-200";
  if (band >= 5) return "text-orange-600 bg-orange-50 border-orange-200";
  return "text-red-600 bg-red-50 border-red-200";
}

function HistoryRow({ h }: { h: IAttemptHistory }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0 gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{h.exam.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatDistanceToNow(new Date(h.createdAt), { addSuffix: true })}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm text-gray-500">Score {h.score}</span>
        <span
          className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${getBandColor(h.bandScore)}`}
        >
          Band {h.bandScore}
        </span>
      </div>
    </div>
  );
}

export default function ReadingPage() {
  const examsQuery = useQuery({
    queryKey: ["reading-exams"],
    queryFn: () => readingService.getAllExams(),
  });

  const historyQuery = useQuery({
    queryKey: ["reading-history"],
    queryFn: () => readingService.getAttemptHistory(),
  });

  const exams = examsQuery.data?.data ?? [];
  const history = historyQuery.data?.data ?? [];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/30">
              <IconBook2 size={20} />
            </span>
            Reading Practice
          </h1>
          <p className="text-sm text-gray-500 mt-1.5 ml-11">
            Computer-based IELTS Reading — select an exam to begin.
          </p>
        </div>
      </div>

      {/* Exam list */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Available Exams</h2>

        {examsQuery.isLoading && (
          <div className="flex items-center justify-center py-20">
            <IconLoader2 size={32} className="animate-spin text-primary" />
          </div>
        )}

        {examsQuery.isError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700">
            <IconAlertCircle size={20} className="shrink-0" />
            <p className="text-sm">Failed to load exams. Please refresh and try again.</p>
          </div>
        )}

        {!examsQuery.isLoading && !examsQuery.isError && exams.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <IconMoodSad size={48} className="opacity-30" />
            <p className="text-sm">No reading exams available yet.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {exams.map((exam) => (
            <ExamListCard key={exam.id} exam={exam} />
          ))}
        </div>
      </section>

      {/* Attempt history */}
      {(history.length > 0 || historyQuery.isLoading) && (
        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <IconHistory size={18} className="text-primary" />
            My Recent Attempts
          </h2>

          {historyQuery.isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
              <IconLoader2 size={16} className="animate-spin" />
              Loading history…
            </div>
          )}

          {history.slice(0, 8).map((h) => (
            <HistoryRow key={h.id} h={h} />
          ))}
        </section>
      )}
    </div>
  );
}
