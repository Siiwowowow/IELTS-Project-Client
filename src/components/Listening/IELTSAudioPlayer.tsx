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
    <div className="bg-transparent px-0 py-0 select-none font-sans">
      <div className="grid h-full w-full grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1 md:flex md:h-auto md:justify-between md:gap-3">
        {/* Play/Pause, Volume, & Speed */}
        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          <div className="flex items-center gap-2">
            {/* PLAY/PAUSE SQUARE BUTTON */}
            <button
              type="button"
              onClick={onPlayToggle}
              disabled={isCheckPeriod}
              className={`flex h-8 w-8 items-center justify-center rounded-none border border-[#c8d2db] shadow-sm transition-colors select-none md:h-10 md:w-10 ${
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
            <div className="flex items-center gap-1 md:gap-2">
              <button
                type="button"
                onClick={onMuteToggle}
                disabled={isCheckPeriod}
                className="rounded p-1 text-[#1B3A6B] transition-colors hover:bg-slate-200 md:p-1.5"
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
                className="hidden h-1 w-14 cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#1B3A6B] sm:block"
                style={{ accentColor: "#1B3A6B" }}
              />
            </div>
          </div>

          {/* SPEED SELECTOR */}
          <div className="hidden items-center gap-1 rounded border border-gray-300 bg-white p-0.5 shadow-sm select-none sm:flex">
            {([1, 1.2, 1.5, 2] as const).map((rate) => (
              <button
                key={rate}
                type="button"
                disabled={isCheckPeriod}
                onClick={() => onSpeedChange(rate)}
                className={`inline-flex rounded-sm px-1.5 py-1 text-[10px] font-bold transition-all ${
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
        <div className="flex min-w-0 flex-1 items-center gap-1.5 md:gap-2">
          <input
            type="range"
            min="0"
            max={audioDuration || 100}
            value={audioCurrentTime}
            disabled={isCheckPeriod}
            onChange={(e) => onScrub(parseFloat(e.target.value))}
            className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-lg bg-gray-300 accent-[#1B3A6B]"
            style={{
              accentColor: "#1B3A6B",
              background: `linear-gradient(to right, #1B3A6B 0%, #1B3A6B ${
                audioDuration ? (audioCurrentTime / audioDuration) * 100 : 0
              }%, #cbd5e1 ${
                audioDuration ? (audioCurrentTime / audioDuration) * 100 : 0
              }%, #cbd5e1 100%)`,
            }}
          />
          
          <span className="shrink-0 whitespace-nowrap text-[9px] font-mono font-bold text-gray-600 sm:text-[11px]">
            {currentFormatted} / {totalFormatted}
          </span>
        </div>

        <div className="col-span-2 flex items-center justify-end gap-1 sm:hidden">
          {([1, 1.5, 2] as const).map((rate) => (
            <button
              key={rate}
              type="button"
              disabled={isCheckPeriod}
              onClick={() => onSpeedChange(rate)}
              className={`rounded px-2 py-0.5 text-[9px] font-bold ${playbackRate === rate ? "bg-[#1B3A6B] text-white" : "border border-gray-200 text-gray-600"}`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* SECTION INDICATOR */}
        <div className="hidden shrink-0 border border-gray-300 bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#1B3A6B] xl:block">
          SECTION {activeSectionIdx + 1} OF 4
        </div>
      </div>
    </div>
  );
}
