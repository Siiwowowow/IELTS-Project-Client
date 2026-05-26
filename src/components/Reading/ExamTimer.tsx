"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { IconClock } from "@tabler/icons-react";

interface Props {
  durationMinutes: number;
  onTimeUp: () => void;
  className?: string;
}

export function ExamTimer({ durationMinutes, onTimeUp, className }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const firedRef = useRef(false);

  const handleTimeUp = useCallback(() => {
    if (!firedRef.current) {
      firedRef.current = true;
      onTimeUp();
    }
  }, [onTimeUp]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [handleTimeUp]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isCritical = secondsLeft <= 60;
  const isWarning = !isCritical && secondsLeft <= 300;

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm font-bold transition-colors select-none ${
        isCritical
          ? "bg-red-100 text-red-700 animate-pulse"
          : isWarning
          ? "bg-orange-100 text-orange-700"
          : "bg-gray-100 text-gray-700"
      } ${className ?? ""}`}
    >
      <IconClock size={15} />
      <span>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}



