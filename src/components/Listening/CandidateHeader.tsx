"use client";

import React from "react";
import {
  IconClock,
  IconInfoCircle,
  IconUserCircle,
  IconMaximize,
  IconMinimize,
} from "@tabler/icons-react";

interface CandidateHeaderProps {
  candidateName: string;
  candidateId: string;
  dateText: string;
  timeRemainingText: string;
  isCheckPeriod: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function CandidateHeader({
  candidateName,
  candidateId,
  dateText,
  timeRemainingText,
  isCheckPeriod,
  isFullscreen,
  onToggleFullscreen,
}: CandidateHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-40 select-none font-sans shadow-sm">
      {/* LEFT: Logo and Candidate Details */}
      <div className="flex items-center">
        <span className="font-extrabold text-base md:text-lg text-[#1B3A6B] tracking-tight">
          IELTS Listening Assessment
        </span>
        
        <div className="hidden sm:flex items-center gap-4 border-l border-gray-200 pl-4 ml-4 text-xs md:text-sm font-medium text-gray-500">
          <span>
            Candidate: <strong className="text-gray-800">{candidateName}</strong>
          </span>
          <span>
            ID: <strong className="text-gray-800">{candidateId}</strong>
          </span>
          <span>
            Date: <strong className="text-gray-800">{dateText}</strong>
          </span>
        </div>
      </div>

      {/* RIGHT: Countdown timer and utility icons */}
      <div className="flex items-center gap-4">
        {/* TIMER PILL */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-sm font-bold font-mono transition-colors shadow-sm bg-gray-50 ${
            isCheckPeriod
              ? "text-amber-600 border-amber-200"
              : "text-[#1B3A6B] border-gray-200"
          }`}
          title="Time Remaining"
        >
          <IconClock size={16} className={isCheckPeriod ? "text-amber-500 animate-pulse" : "text-[#1B3A6B]"} />
          <span>{timeRemainingText}</span>
        </div>

        {/* UTILITIES */}
        <div className="flex items-center gap-2.5 text-gray-400">
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="hover:text-[#1B3A6B] transition-colors p-1"
            title={isFullscreen ? "Exit Fullscreen" : "Simulate Kiosk Fullscreen"}
          >
            {isFullscreen ? <IconMinimize size={20} /> : <IconMaximize size={20} />}
          </button>
          
          <button
            type="button"
            className="hover:text-[#1B3A6B] transition-colors p-1"
            title="Assessment Information"
          >
            <IconInfoCircle size={20} />
          </button>

          <button
            type="button"
            className="hover:text-[#1B3A6B] transition-colors p-1"
            title="Candidate Profile"
          >
            <IconUserCircle size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
