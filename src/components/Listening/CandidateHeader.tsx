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
  audioPlayer?: React.ReactNode;
}

export function CandidateHeader({
  candidateName,
  candidateId,
  dateText,
  timeRemainingText,
  isCheckPeriod,
  isFullscreen,
  onToggleFullscreen,
  audioPlayer,
}: CandidateHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 grid h-[116px] grid-cols-[1fr_auto] grid-rows-[44px_1fr] items-center gap-x-2 border-t-4 border-t-[#16251f] border-b border-gray-200 bg-white px-2 shadow-sm select-none font-sans md:h-[76px] md:grid-cols-[auto_auto_minmax(280px,1fr)_auto] md:grid-rows-1 md:gap-3 md:px-4 xl:gap-4 xl:px-5">
        <div className="flex items-center gap-3">
          <span className="rounded border-2 border-red-600 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-red-700">
            Listening
          </span>
        </div>
        <div className="hidden items-center gap-3 whitespace-nowrap text-xs font-medium text-gray-500 md:flex xl:gap-4 xl:text-sm">
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
        {audioPlayer && <div className="col-span-2 min-w-0 self-stretch border-t border-gray-100 py-1.5 md:col-span-1 md:self-auto md:border-0 md:py-0">{audioPlayer}</div>}

        <div className="row-start-1 col-start-2 flex items-center gap-1.5 md:row-auto md:col-auto md:gap-3">
        {/* TIMER PILL */}
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-bold font-mono transition-colors shadow-sm bg-gray-50 sm:text-sm md:gap-1.5 md:px-3 ${
            isCheckPeriod
              ? "text-amber-600 border-amber-200"
              : "text-[#1B3A6B] border-gray-200"
          }`}
          title="Time Remaining"
        >
          <IconClock size={14} className={isCheckPeriod ? "text-amber-500 animate-pulse" : "text-[#1B3A6B]"} />
          <span>{timeRemainingText}</span>
        </div>

        {/* UTILITIES */}
        <div className="flex items-center gap-1.5 text-gray-400">
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="hidden hover:text-[#1B3A6B] transition-colors p-1 sm:block"
            title={isFullscreen ? "Exit Fullscreen" : "Simulate Kiosk Fullscreen"}
          >
            {isFullscreen ? <IconMinimize size={20} /> : <IconMaximize size={20} />}
          </button>
          
          <button
            type="button"
            className="hidden p-1 transition-colors hover:text-[#1B3A6B] xl:block"
            title="Assessment Information"
          >
            <IconInfoCircle size={20} />
          </button>

          <button
            type="button"
            className="hidden p-1 transition-colors hover:text-[#1B3A6B] xl:block"
            title="Candidate Profile"
          >
            <IconUserCircle size={20} />
          </button>
        </div>
        </div>
    </header>
  );
}
