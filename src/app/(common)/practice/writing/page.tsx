"use client";

import { useQuery } from "@tanstack/react-query";
import { PracticePageShell } from "@/components/Practice/PracticePageShell";
import { WritingExamListCard } from "@/components/Writing/WritingExamListCard";
import { writingService } from "@/services/writing.services";

export default function WritingPracticePage() {
  const examsQuery = useQuery({
    queryKey: ["writing-exams"],
    queryFn: () => writingService.getAllExams(),
  });
  const exams = examsQuery.data?.data ?? [];

  return (
    <PracticePageShell skill="writing" examCount={exams.length} isLoading={examsQuery.isLoading} isError={examsQuery.isError}>
      {exams.map((exam, index) => <WritingExamListCard key={exam.id} exam={exam} index={index} />)}
    </PracticePageShell>
  );
}
