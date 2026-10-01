"use client";

import { useQuery } from "@tanstack/react-query";
import { PracticePageShell } from "@/components/Practice/PracticePageShell";
import { SpeakingExamListCard } from "@/components/Speaking/SpeakingExamListCard";
import { speakingService } from "@/services/speaking.services";

export default function SpeakingPracticePage() {
  const examsQuery = useQuery({
    queryKey: ["speaking-exams"],
    queryFn: () => speakingService.getAllExams(),
  });
  const exams = examsQuery.data?.data ?? [];

  return (
    <PracticePageShell skill="speaking" examCount={exams.length} isLoading={examsQuery.isLoading} isError={examsQuery.isError}>
      {exams.map((exam, index) => <SpeakingExamListCard key={exam.id} exam={exam} index={index} />)}
    </PracticePageShell>
  );
}
