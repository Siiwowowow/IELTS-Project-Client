"use client";

import React from "react";
import { ListeningQuestionRenderer } from "./ListeningQuestionRenderer";

interface Question {
  id: string;
  questionNumber: number;
  questionText?: string;
  options?: string[];
}

interface QuestionGroup {
  id: string;
  type: string;
  instruction?: string;
  passageSegment?: string;
  imageUrl?: string;
  options?: string[];
  questions: Question[];
}

interface QuestionGroupCardProps {
  group: QuestionGroup;
  answers: Record<string, string>;
  flagged: Record<string, boolean>;
  activeQuestionId: string | null;
  onAnswer: (qId: string, value: string) => void;
  onToggleFlag: (qId: string) => void;
}

export function QuestionGroupCard({
  group,
  answers,
  onAnswer,
}: QuestionGroupCardProps) {
  return (
    <section className="border-b border-gray-200 pb-7 last:border-b-0 last:pb-0">
      <ListeningQuestionRenderer
        group={group as any}
        answers={answers}
        onAnswer={onAnswer}
        hideReferenceBox={false}
      />
    </section>
  );
}
