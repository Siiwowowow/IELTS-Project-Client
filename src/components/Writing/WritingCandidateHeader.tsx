"use client";

import React from "react";
import {
  IconClock,
  IconInfoCircle,
  IconUserCircle,
  IconMaximize,
  IconMinimize,
} from "@tabler/icons-react";

interface WritingCandidateHeaderProps {
  candidateName: string;
  candidateId: string;
  examTitle: string;
  examType: "ACADEMIC" | "GENERAL_TRAINING";
  timeRemainingText: string;
  isWarningPeriod: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function WritingCandidateHeader({
  candidateName,
  candidateId,
  examTitle,
  examType,
  timeRemainingText,
  isWarningPeriod,
  isFullscreen,
  onToggleFullscreen,
}: WritingCandidateHeaderProps) {
  const typeLabel = examType === "GENERAL_TRAINING" ? "General Training" : "Academic";

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-40 select-none font-sans shadow-sm">
      {/* LEFT: Logo and Candidate Details */}
      <div className="flex items-center">
        <span className="font-extrabold text-base md:text-lg text-violet-700 tracking-tight">
          IELTS Writing Assessment
        </span>
        <span className="ml-2.5 px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 uppercase tracking-wide">
          {typeLabel}
        </span>
        
        <div className="hidden lg:flex items-center gap-4 border-l border-gray-200 pl-4 ml-4 text-xs md:text-sm font-medium text-gray-500">
          <span className="truncate max-w-[200px]">
            Test: <strong className="text-gray-800">{examTitle}</strong>
          </span>
          <span>
            Candidate: <strong className="text-gray-800">{candidateName}</strong>
          </span>
          <span>
            ID: <strong className="text-gray-800">{candidateId}</strong>
          </span>
        </div>
      </div>

      {/* RIGHT: Countdown timer and utility icons */}
      <div className="flex items-center gap-4">
        {/* TIMER PILL */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-sm font-bold font-mono transition-colors shadow-sm bg-gray-50 ${
            isWarningPeriod
              ? "text-rose-600 border-rose-200 animate-pulse bg-rose-50/50"
              : "text-violet-700 border-gray-200"
          }`}
          title="Time Remaining"
        >
          <IconClock size={16} className={isWarningPeriod ? "text-rose-500" : "text-violet-600"} />
          <span>{timeRemainingText}</span>
        </div>

        {/* UTILITIES */}
        <div className="flex items-center gap-2.5 text-gray-400">
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="hover:text-violet-700 transition-colors p-1"
            title={isFullscreen ? "Exit Fullscreen" : "Simulate Kiosk Fullscreen"}
          >
            {isFullscreen ? <IconMinimize size={20} /> : <IconMaximize size={20} />}
          </button>
          
          <button
            type="button"
            className="hover:text-violet-700 transition-colors p-1"
            title="Assessment Information"
          >
            <IconInfoCircle size={20} />
          </button>

          <button
            type="button"
            className="hover:text-violet-700 transition-colors p-1"
            title="Candidate Profile"
          >
            <IconUserCircle size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
