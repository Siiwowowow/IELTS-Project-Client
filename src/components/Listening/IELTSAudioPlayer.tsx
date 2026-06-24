"use client";

import React from "react";
import { IconPlayerPlay, IconPlayerPause, IconVolume, IconVolume3, IconVolumeOff } from "@tabler/icons-react";

interface IELTSAudioPlayerProps {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  audioDuration: number;
  audioCurrentTime: number;
  activeSectionIdx: number;
  isCheckPeriod: boolean;
  playbackRate: number;
  onPlayToggle: () => void;
  onVolumeChange: (val: number) => void;
  onMuteToggle: () => void;
  onScrub: (val: number) => void;
  onSpeedChange: (speed: number) => void;
}

export function IELTSAudioPlayer({
  isPlaying,
  isMuted,
  volume,
  audioDuration,
  audioCurrentTime,
  activeSectionIdx,
  isCheckPeriod,
  playbackRate,
  onPlayToggle,
  onVolumeChange,
  onMuteToggle,
  onScrub,
  onSpeedChange,
}: IELTSAudioPlayerProps) {
  const formatTime = (time: number) => {
    if (isNaN(time) || time === Infinity) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const currentFormatted = formatTime(audioCurrentTime);
  const totalFormatted = formatTime(audioDuration || 1800); // Default to 30 mins if not loaded

  return (
    <div className="bg-[#F1F5F9] border-b border-gray-200 py-3 px-6 z-30 select-none shrink-0 font-sans shadow-sm">
      <div className="max-w-[1000px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Play/Pause, Volume, & Speed */}
        <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-4">
            {/* PLAY/PAUSE SQUARE BUTTON */}
            <button
              type="button"
              onClick={onPlayToggle}
              disabled={isCheckPeriod}
              className={`w-10 h-10 flex items-center justify-center transition-colors shadow-sm select-none border border-gray-300 rounded-none ${
                isCheckPeriod
                  ? "bg-gray-300 text-gray-400 cursor-not-allowed"
                  : "bg-[#1B3A6B] hover:bg-[#152e54] text-white cursor-pointer"
              }`}
              title={isCheckPeriod ? "Audio locked" : isPlaying ? "Pause Audio" : "Play Audio"}
            >
              {isPlaying ? (
                <IconPlayerPause size={18} className="fill-white" />
              ) : (
                <IconPlayerPlay size={18} className="fill-white" />
              )}
            </button>

            {/* VOLUME SLIDER */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onMuteToggle}
                disabled={isCheckPeriod}
                className="text-[#1B3A6B] hover:bg-slate-200 p-1.5 rounded transition-colors"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <IconVolumeOff size={18} />
                ) : volume <= 0.5 ? (
                  <IconVolume3 size={18} />
                ) : (
                  <IconVolume size={18} />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                disabled={isCheckPeriod}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-16 md:w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1B3A6B]"
                style={{ accentColor: "#1B3A6B" }}
              />
            </div>
          </div>

          {/* SPEED SELECTOR */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded p-0.5 select-none shrink-0 shadow-sm">
            {([1, 1.2, 1.5, 2] as const).map((rate) => (
              <button
                key={rate}
                type="button"
                disabled={isCheckPeriod}
                onClick={() => onSpeedChange(rate)}
                className={`px-2 py-1 text-[11px] font-bold transition-all rounded-sm ${
                  playbackRate === rate
                    ? "bg-[#1B3A6B] text-white shadow-sm"
                    : "text-gray-600 hover:bg-slate-100 hover:text-gray-900"
                } disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:opacity-50`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* TIMELINE TRACK Scrubber */}
        <div className="flex-1 flex items-center gap-4 w-full">
          <input
            type="range"
            min="0"
            max={audioDuration || 100}
            value={audioCurrentTime}
            disabled={isCheckPeriod}
            onChange={(e) => onScrub(parseFloat(e.target.value))}
            className="flex-grow h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-[#1B3A6B]"
            style={{
              accentColor: "#1B3A6B",
              background: `linear-gradient(to right, #1B3A6B 0%, #1B3A6B ${
                audioDuration ? (audioCurrentTime / audioDuration) * 100 : 0
              }%, #cbd5e1 ${
                audioDuration ? (audioCurrentTime / audioDuration) * 100 : 0
              }%, #cbd5e1 100%)`,
            }}
          />
          
          <span className="text-xs font-mono font-bold text-gray-500 shrink-0">
            {currentFormatted} / {totalFormatted}
          </span>
        </div>

        {/* SECTION INDICATOR */}
        <div className="bg-white border border-gray-300 px-3.5 py-1.5 font-bold text-xs text-[#1B3A6B] uppercase tracking-wide shrink-0">
          SECTION {activeSectionIdx + 1} OF 4
        </div>
      </div>
    </div>
  );
}
