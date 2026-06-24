"use client";

import React from "react";

interface Question {
  id: string;
  questionNumber: number;
}

interface Section {
  id: string;
  title: string;
  questionGroups: {
    questions: Question[];
  }[];
}

interface ReviewModalProps {
  sections: Section[];
  answers: Record<string, string>;
  flagged: Record<string, boolean>;
  onClose: () => void;
  onJumpToQuestion: (qId: string, sIdx: number) => void;
}

export function ReviewModal({
  sections,
  answers,
  flagged,
  onClose,
  onJumpToQuestion,
}: ReviewModalProps) {
  const allQuestionsCount = sections.flatMap((s) =>
    s.questionGroups.flatMap((g) => g.questions)
  ).length;

  const answeredCount = sections.flatMap((s) =>
    s.questionGroups.flatMap((g) => g.questions)
  ).filter((q) => answers[q.id]?.trim()).length;

  const flaggedCount = Object.values(flagged).filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 select-none animate-fadeIn font-sans">
      <div className="bg-white rounded-lg border border-gray-200 shadow-2xl w-full max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#1B3A6B] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-lg">Review Test Answers</h3>
            <p className="text-xs text-white/70 mt-0.5">
              Click any question number box to navigate directly to it.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:bg-white/10 p-1.5 rounded transition-colors text-xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* Section Grid Blocks */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {sections.map((sec, sIdx) => {
            const secQuestions = sec.questionGroups.flatMap((g) => g.questions);
            const startNum = secQuestions[0]?.questionNumber ?? (sIdx * 10 + 1);
            const endNum = secQuestions[secQuestions.length - 1]?.questionNumber ?? (sIdx * 10 + 10);
            return (
              <div key={sec.id} className="space-y-2.5">
                <h4 className="font-bold text-sm text-[#1B3A6B] uppercase tracking-wider">
                  SECTION {sIdx + 1} – Questions {startNum}–{endNum}
                </h4>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5">
                  {secQuestions.map((q) => {
                    const isAnswered = !!answers[q.id]?.trim();
                    const isFlagged = !!flagged[q.id];

                    // Box coloring logic: Green = Answered, Red = Flagged, Gray = Unanswered
                    let colorClass = "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200";
                    if (isFlagged) {
                      colorClass = "bg-red-50 border-red-200 text-red-700 font-bold hover:bg-red-100";
                    } else if (isAnswered) {
                      colorClass = "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold hover:bg-emerald-100";
                    }

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => onJumpToQuestion(q.id, sIdx)}
                        className={`h-11 border rounded-md flex flex-col items-center justify-center text-sm transition-all duration-100 relative ${colorClass}`}
                      >
                        <span className="text-xs font-semibold">{q.questionNumber}</span>
                        {isFlagged && (
                          <span className="absolute top-0.5 right-0.5 text-[8px] text-red-500">🚩</span>
                        )}
                        {isAnswered && !isFlagged && (
                          <span className="absolute bottom-0.5 text-[7px] text-emerald-500">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Legend / Summary Footer */}
        <div className="bg-gray-50 border-t border-gray-150 p-4 shrink-0 flex flex-col sm:flex-row items-center justify-between text-xs font-semibold text-gray-500 gap-3">
          <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 bg-emerald-50 border border-emerald-200 rounded shrink-0"></span>
              Answered ({answeredCount})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 bg-red-50 border border-red-200 rounded shrink-0"></span>
              Flagged ({flaggedCount})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 bg-gray-100 border border-gray-200 rounded shrink-0"></span>
              Unanswered ({allQuestionsCount - answeredCount})
            </span>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1B3A6B] hover:bg-[#152e54] text-white rounded text-xs font-bold transition-colors select-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
