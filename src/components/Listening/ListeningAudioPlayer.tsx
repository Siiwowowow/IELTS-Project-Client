"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface ListeningAudioPlayerProps {
  audioUrl: string;
  onPlayStateChange?: (playing: boolean) => void;
}

export function ListeningAudioPlayer({
  audioUrl,
  onPlayStateChange,
}: ListeningAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Initialize/Update audio object
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      onPlayStateChange?.(false);
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onPlayStateChange?.(false);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    // Apply active volume and playback rates
    audio.volume = isMuted ? 0 : volume;
    audio.playbackRate = playbackRate;

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audioUrl]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Sync playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      onPlayStateChange?.(false);
    } else {
      audioRef.current.play().catch((err) => {
        console.error("Audio playback failed:", err);
      });
      setIsPlaying(true);
      onPlayStateChange?.(true);
    }
  };

  const handleScrub = (value: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const speedOptions = [1, 1.1, 1.2, 1.25, 1.5];

  return (
    <div className="w-full bg-[#003580]/5 border border-[#003580]/10 rounded-2xl p-4 md:p-6 shadow-sm flex flex-col md:flex-row items-center gap-4 md:gap-6 animate-fadeIn">
      {/* PLAY/PAUSE */}
      <button
        onClick={togglePlay}
        className="w-14 h-14 rounded-full flex shrink-0 items-center justify-center bg-[#003580] hover:bg-[#002D6E] text-white shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
      >
        {isPlaying ? (
          <Pause size={24} className="fill-white text-white" />
        ) : (
          <Play size={24} className="fill-white text-white translate-x-0.5" />
        )}
      </button>

      {/* TRACK PROGRESS BAR */}
      <div className="flex-1 w-full space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-gray-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => handleScrub(Number(e.target.value))}
          className="w-full h-2 rounded-lg bg-gray-200 accent-[#003580] cursor-pointer outline-none transition-all"
        />
      </div>

      {/* VOLUME & SPEED CONTROLS */}
      <div className="flex items-center gap-6 shrink-0 w-full md:w-auto justify-between md:justify-start">
        {/* VOLUME */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-gray-500 hover:text-[#003580] p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={20} />
            ) : (
              <Volume2 size={20} />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(Number(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-20 md:w-24 h-1.5 rounded-lg bg-gray-200 accent-[#003580] cursor-pointer"
          />
        </div>

        {/* SPEED SELECTOR */}
        <div className="flex items-center gap-1.5 border border-gray-200 rounded-xl p-1 bg-white shadow-sm">
          {speedOptions.map((speed) => (
            <button
              key={speed}
              onClick={() => setPlaybackRate(speed)}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                playbackRate === speed
                  ? "bg-[#003580] text-white"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
