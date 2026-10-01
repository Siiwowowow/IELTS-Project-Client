"use client";

import { IconBook2 } from "@tabler/icons-react";
import { PracticeExamCard } from "@/components/Practice/PracticeExamCard";
import { useUser } from "@/hooks/useUser";
import type { IExam } from "@/types/reading.types";

interface Props {
  exam: IExam;
  index?: number;
}

export function ExamListCard({ exam, index }: Props) {
  const { user } = useUser();
  const passageCount = exam._count?.passages ?? exam.passages?.length ?? 0;

  const isGeneral = exam.title.toLowerCase().includes("general");
  const badgeLabel = isGeneral ? "General" : "Academic";

  return (
    <PracticeExamCard
      href={user ? `/practice/reading/${exam.id}` : "/login"}
      skill="reading"
      title={exam.title}
      description={exam.description}
      duration={exam.duration}
      itemCount={passageCount}
      itemLabel="Passage"
      badge={badgeLabel}
      isLoggedIn={Boolean(user)}
      icon={<IconBook2 size={18} />}
      index={index}
    />
  );
}
