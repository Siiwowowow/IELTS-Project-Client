"use client";

import React from "react";

interface PaperBackgroundProps {
  color: string;
  /** "tape" = washi tape strip, "clip" = paperclip, "none" = nothing */
  attachment?: "tape" | "clip" | "none";
  tapeColor?: string;
  tapeSide?: "left" | "right";
}

/**
 * Torn-paper card background: clipped paper shape + texture + brush marks
 * + optional tape / paperclip. Kept fully separate from content/layout so
 * it can be reused for any card that needs the same paper look.
 */
export const PaperBackground: React.FC<PaperBackgroundProps> = ({
  color,
  attachment = "none",
  tapeColor = "#8EA8FF",
  tapeSide = "left",
}) => {
  return (
    <div className="absolute inset-0 z-0">
      {/* ================= PAPER ================= */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          backgroundColor: color,
          clipPath: `
            polygon(
              2% 8%,
              8% 5%,
              16% 7%,
              24% 4%,
              33% 6%,
              42% 3%,
              51% 6%,
              61% 4%,
              70% 6%,
              79% 3%,
              89% 6%,
              98% 4%,

              99% 15%,
              97% 27%,
              100% 39%,
              98% 51%,
              100% 64%,
              98% 76%,
              99% 90%,

              94% 96%,
              84% 94%,
              74% 97%,
              64% 95%,
              54% 98%,
              44% 95%,
              34% 97%,
              24% 94%,
              14% 98%,
              5% 95%,
              1% 91%,

              2% 78%,
              0% 66%,
              2% 54%,
              0% 42%,
              2% 30%,
              0% 18%
            )
          `,
        }}
      >
        {/* ================= PAPER TEXTURE ================= */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                172deg,
                transparent 0px,
                transparent 5px,
                rgba(255,255,255,.22) 6px,
                transparent 8px
              )
            `,
          }}
        />

        {/* Horizontal brush marks */}
        <div className="absolute left-[4%] top-[10%] h-[2px] w-[90%] rotate-[-1deg] bg-white/20" />
        <div className="absolute left-[7%] top-[18%] h-[1px] w-[80%] bg-white/15" />
        <div className="absolute bottom-[13%] left-[8%] h-[2px] w-[82%] rotate-[1deg] bg-black/10" />

        {/* Random paint scratches */}
        <div className="absolute left-[3%] top-[30%] h-[18px] w-[3px] rotate-[8deg] bg-black/10" />
        <div className="absolute right-[7%] top-[20%] h-[14px] w-[3px] rotate-[-12deg] bg-white/20" />
        <div className="absolute right-[18%] bottom-[12%] h-[2px] w-[28px] rotate-[-5deg] bg-white/30" />
      </div>

      {/* ================= TAPE ================= */}
      {attachment === "tape" && (
        <div
          className={`absolute -top-[7px] z-30 h-[22px] w-[58px] opacity-70 ${
            tapeSide === "left"
              ? "left-[10%] -rotate-[6deg]"
              : "right-[10%] rotate-[6deg]"
          }`}
          style={{ backgroundColor: tapeColor }}
        >
          <div className="absolute inset-0 bg-white/20" />
        </div>
      )}

      {/* ================= PAPERCLIP ================= */}
      {attachment === "clip" && (
        <svg
          viewBox="0 0 34 56"
          fill="none"
          stroke="#F5F0E6"
          strokeWidth={4}
          strokeLinecap="round"
          className="absolute left-[8%] -top-[26px] z-30 h-[46px] w-[28px]"
          style={{ filter: "drop-shadow(0 3px 3px rgba(0,0,0,.45))" }}
        >
          <path d="M9 12 V40 a8 8 0 0 0 16 0 V10 a5 5 0 0 0-10 0 V38" />
        </svg>
      )}
    </div>
  );
};