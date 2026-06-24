"use client";

import React from "react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconLayoutGrid,
  IconUpload,
} from "@tabler/icons-react";

interface Question {
  id: string;
  questionNumber: number;
}

interface NavigationFooterProps {
  activeSectionIdx: number;
  questions: Question[];
  answers: Record<string, string>;
  flagged: Record<string, boolean>;
  activeQuestionId: string | null;
  submitEnabled: boolean;
  isPending: boolean;
  onBack: () => void;
  onNext: () => void;
  onQuestionClick: (qId: string) => void;
  onReviewAllClick: () => void;
  onSubmitClick: () => void;
}

export function NavigationFooter({
  activeSectionIdx,
  questions,
  answers,
  flagged,
  activeQuestionId,
  submitEnabled,
  isPending,
  onBack,
  onNext,
  onQuestionClick,
  onReviewAllClick,
  onSubmitClick,
}: NavigationFooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-16 bg-[#F8FAFC] border-t border-gray-200 flex items-center justify-between px-6 z-40 select-none shadow-md font-sans">
      
      {/* LEFT: BACK / NEXT */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={activeSectionIdx === 0}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-bold border transition-colors select-none ${
            activeSectionIdx === 0
              ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
          }`}
        >
          <IconArrowLeft size={16} />
          <span>BACK</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={activeSectionIdx === 3}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-bold border transition-colors select-none text-white ${
            activeSectionIdx === 3
              ? "bg-gray-300 border-gray-300 text-gray-400 cursor-not-allowed"
              : "bg-[#1B3A6B] hover:bg-[#152e54] border-[#1B3A6B] cursor-pointer"
          }`}
        >
          <span>NEXT SECTION</span>
          <IconArrowRight size={16} />
        </button>
      </div>

      {/* CENTER: SECTION QUESTIONS TRACKER (1 TO 10 BOXES) */}
      <div className="hidden md:flex items-center gap-2">
        {questions.map((q, idx) => {
          const numberLabel = q.questionNumber;
          const isActive = activeQuestionId === q.id;
          const isAnswered = !!answers[q.id]?.trim();
          const isFlagged = !!flagged[q.id];

          // Box color selection
          let boxStyle = "border-gray-300 text-gray-700 bg-white hover:bg-gray-50";
          if (isActive) {
            boxStyle = "bg-[#1B3A6B] border-[#1B3A6B] text-white font-bold";
          } else if (isAnswered) {
            boxStyle = "bg-[#1B3A6B]/5 border-[#1B3A6B] text-[#1B3A6B] font-bold";
          }

          return (
            <div key={q.id} className="relative py-1 select-none">
              {/* Flag Red Notification Dot above box */}
              {isFlagged && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-600 border border-white" />
              )}
              <button
                type="button"
                onClick={() => onQuestionClick(q.id)}
                className={`w-9 h-9 border text-xs flex items-center justify-center font-semibold select-none ${boxStyle}`}
              >
                {numberLabel}
              </button>
            </div>
          );
        })}
      </div>

      {/* RIGHT: REVIEW ALL & SUBMIT TEST */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onReviewAllClick}
          className="flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-bold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer select-none"
        >
          <IconLayoutGrid size={16} />
          <span>REVIEW ALL</span>
        </button>

        <button
          type="button"
          onClick={onSubmitClick}
          disabled={!submitEnabled || isPending}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-black border transition-all select-none shadow-sm ${
            submitEnabled && !isPending
              ? "bg-[#1B3A6B] border-[#1B3A6B] hover:bg-[#152e54] text-white cursor-pointer"
              : "bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <IconUpload size={16} />
          <span>SUBMIT TEST</span>
        </button>
      </div>

    </footer>
  );
}
