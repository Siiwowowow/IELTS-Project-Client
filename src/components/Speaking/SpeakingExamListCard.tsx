"use client";

import { IconMicrophone } from "@tabler/icons-react";
import { PracticeExamCard } from "@/components/Practice/PracticeExamCard";
import { useAuth } from "@/providers/AuthProvider";
import type { ISpeakingExam } from "@/types/speaking.types";

interface Props {
  exam: ISpeakingExam;
  index?: number;
}

export function SpeakingExamListCard({ exam, index }: Props) {
  const { user } = useAuth();
  const partCount = exam._count?.parts ?? exam.parts?.length ?? 3;

  return (
    <PracticeExamCard
      href={user ? `/practice/speaking/${exam.id}` : "/login"}
      skill="speaking"
      title={exam.title}
      description={exam.description}
      duration={exam.duration}
      itemCount={partCount}
      itemLabel="Part"
      badge="Speaking"
      isLoggedIn={Boolean(user)}
      icon={<IconMicrophone size={18} />}
      index={index}
    />
  );
}
