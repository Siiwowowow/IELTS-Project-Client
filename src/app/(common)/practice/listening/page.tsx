"use client";

import { useQuery } from "@tanstack/react-query";
import { ListeningExamListCard } from "@/components/Listening/ListeningExamListCard";
import { PracticePageShell } from "@/components/Practice/PracticePageShell";
import { listeningService } from "@/services/listening.services";

export default function ListeningPracticePage() {
  const examsQuery = useQuery({
    queryKey: ["listening-exams"],
    queryFn: () => listeningService.getAllExams(),
  });
  const exams = examsQuery.data?.data ?? [];

  return (
    <PracticePageShell skill="listening" examCount={exams.length} isLoading={examsQuery.isLoading} isError={examsQuery.isError}>
      {exams.map((exam, index) => <ListeningExamListCard key={exam.id} exam={exam} index={index} />)}
    </PracticePageShell>
  );
}
