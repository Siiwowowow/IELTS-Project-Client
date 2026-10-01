"use client";

import { IconPencil } from "@tabler/icons-react";
import { PracticeExamCard } from "@/components/Practice/PracticeExamCard";
import { useUser } from "@/hooks/useUser";
import type { IWritingExam } from "@/types/writing.types";

interface Props {
  exam: IWritingExam;
  index?: number;
}

export function WritingExamListCard({ exam, index }: Props) {
  const { user } = useUser();
  const taskCount = exam._count?.tasks ?? exam.tasks?.length ?? 2;
  const examTypeLabel = exam.examType === "GENERAL_TRAINING" ? "General" : "Academic";

  return (
    <PracticeExamCard
      href={user ? `/practice/writing/${exam.id}` : "/login"}
      skill="writing"
      title={exam.title}
      description={exam.description}
      duration={exam.duration}
      itemCount={taskCount}
      itemLabel="Task"
      badge={examTypeLabel}
      isLoggedIn={Boolean(user)}
      icon={<IconPencil size={18} />}
      index={index}
    />
  );
}
