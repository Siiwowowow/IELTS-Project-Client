"use client";

import { useQuery } from "@tanstack/react-query";
import { PracticePageShell } from "@/components/Practice/PracticePageShell";
import { ExamListCard } from "@/components/Reading/ExamListCard";
import { readingService } from "@/services/reading.services";

export default function ReadingPage() {
  const examsQuery = useQuery({
    queryKey: ["reading-exams"],
    queryFn: () => readingService.getAllExams(),
  });
  const exams = examsQuery.data?.data ?? [];

  return (
    <PracticePageShell skill="reading" examCount={exams.length} isLoading={examsQuery.isLoading} isError={examsQuery.isError}>
      {exams.map((exam, index) => <ExamListCard key={exam.id} exam={exam} index={index} />)}
    </PracticePageShell>
  );
}
