"use client";

import { IconHeadphones } from "@tabler/icons-react";
import { PracticeExamCard } from "@/components/Practice/PracticeExamCard";
import { useUser } from "@/hooks/useUser";
import type { IListeningExam } from "@/types/listening.types";

interface Props {
  exam: IListeningExam;
  index?: number;
}

export function ListeningExamListCard({ exam, index }: Props) {
  const { user } = useUser();
  const sectionCount = exam._count?.sections ?? exam.sections?.length ?? 0;

  return (
    <PracticeExamCard
      href={user ? `/practice/listening/${exam.id}` : "/login"}
      skill="listening"
      title={exam.title}
      description={exam.description}
      duration={exam.duration}
      itemCount={sectionCount}
      itemLabel="Part"
      badge="Listening"
      isLoggedIn={Boolean(user)}
      icon={<IconHeadphones size={18} />}
      index={index}
    />
  );
}
