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
    <footer className="fixed bottom-0 left-0 right-0 z-40 grid h-14 grid-cols-4 items-stretch border-t border-[#d8e0e6] bg-white px-1 shadow-[0_-2px_8px_rgba(15,23,42,0.04)] select-none font-sans md:flex md:h-12 md:items-center md:justify-between md:px-5">
      
      {/* LEFT: BACK / NEXT */}
      <div className="contents md:flex md:items-center md:gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={activeSectionIdx === 0}
          className={`flex min-w-0 flex-col items-center justify-center gap-0.5 border-0 border-r px-1 text-[9px] font-bold transition-colors select-none md:flex-row md:gap-1 md:border md:px-3 md:py-1.5 md:text-xs ${
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
          className={`flex min-w-0 flex-col-reverse items-center justify-center gap-0.5 border-0 border-r px-1 text-[9px] font-bold transition-colors select-none text-white md:flex-row md:gap-1 md:border md:px-3 md:py-1.5 md:text-xs ${
            activeSectionIdx === 3
              ? "bg-gray-300 border-gray-300 text-gray-400 cursor-not-allowed"
              : "bg-[#1B3A6B] hover:bg-[#152e54] border-[#1B3A6B] cursor-pointer"
          }`}
        >
          <span className="leading-none">NEXT <span className="hidden sm:inline">SECTION</span></span>
          <IconArrowRight size={16} />
        </button>
      </div>

      {/* CENTER: SECTION QUESTIONS TRACKER (1 TO 10 BOXES) */}
      <div className="hidden items-center gap-1.5 md:flex">
        {questions.map((q) => {
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
            <div key={q.id} className="relative select-none">
              {/* Flag Red Notification Dot above box */}
              {isFlagged && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-600 border border-white" />
              )}
              <button
                type="button"
                onClick={() => onQuestionClick(q.id)}
                className={`flex h-8 w-8 items-center justify-center border text-xs font-semibold select-none ${boxStyle}`}
              >
                {numberLabel}
              </button>
            </div>
          );
        })}
      </div>

      {/* RIGHT: REVIEW ALL & SUBMIT TEST */}
      <div className="contents md:flex md:items-center md:gap-2">
        <button
          type="button"
          onClick={onReviewAllClick}
          className="flex min-w-0 flex-col items-center justify-center gap-0.5 border-0 border-r border-gray-200 bg-white px-1 text-[9px] font-bold text-gray-700 transition-colors select-none cursor-pointer hover:bg-gray-50 md:flex-row md:gap-1 md:border md:border-gray-300 md:px-3 md:py-1.5 md:text-xs md:shadow-sm"
        >
          <IconLayoutGrid size={16} />
          <span className="leading-none">REVIEW <span className="hidden sm:inline">ALL</span></span>
        </button>

        <button
          type="button"
          onClick={onSubmitClick}
          disabled={!submitEnabled || isPending}
          className={`flex min-w-0 flex-col items-center justify-center gap-0.5 border-0 px-1 text-[9px] font-black transition-all select-none md:flex-row md:gap-1 md:border md:px-3 md:py-1.5 md:text-xs md:shadow-sm ${
            submitEnabled && !isPending
              ? "bg-[#1B3A6B] border-[#1B3A6B] hover:bg-[#152e54] text-white cursor-pointer"
              : "bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <IconUpload size={16} />
          <span className="leading-none">SUBMIT <span className="hidden sm:inline">TEST</span></span>
        </button>
      </div>

    </footer>
  );
}
