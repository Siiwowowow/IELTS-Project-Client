"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Crown } from "lucide-react";

export const TargetScoreSection: React.FC = () => {
  const [selectedScore, setSelectedScore] = useState("8.5");

  const scores = [
    {
      band: "6.5",
      label: "GOOD",
      sub: "BAND",
      isFeatured: false,
      left: "40.5%",
      top: "43%",
      width: "7.8%",
      height: "30%",
      rotation: "-rotate-2",
      tapeColor: "bg-blue-400/80",
    },
    {
      band: "7",
      label: "GOOD",
      sub: "BAND",
      isFeatured: false,
      left: "48.8%",
      top: "41%",
      width: "8.2%",
      height: "30%",
      rotation: "rotate-1",
      tapeColor: "bg-amber-400/80",
    },
    {
      band: "7.5",
      label: "STRONG",
      sub: "BAND",
      isFeatured: false,
      left: "58.2%",
      top: "38%",
      width: "8.2%",
      height: "30%",
      rotation: "-rotate-1",
      tapeColor: "bg-blue-400/80",
    },
    {
      band: "8.5",
      label: "EXCELLENT",
      sub: "BAND",
      isFeatured: true,
      left: "67.8%",
      top: "32%",
      width: "9.2%",
      height: "37%",
      rotation: "rotate-2",
      tapeColor: "bg-amber-400/90",
    },
    {
      band: "8",
      label: "VERY GOOD",
      sub: "BAND",
      isFeatured: false,
      left: "77.0%",
      top: "34%",
      width: "8.0%",
      height: "30%",
      rotation: "-rotate-1",
      tapeColor: "bg-blue-400/80",
    },
    {
      band: "9",
      label: "EXPERT",
      sub: "BAND",
      isFeatured: false,
      left: "85.2%",
      top: "32%",
      width: "8.2%",
      height: "29%",
      rotation: "rotate-3",
      tapeColor: "bg-amber-400/80",
    },
  ];

  return (
    <section
      id="target-score"
      className="relative w-full  font-jakarta overflow-hidden"
    >
      <div className="relative mx-auto w-full ">
        
        {/* =========================================================
            DESKTOP / TABLET VIEW (md & above):
            Uses target_brand.png as panoramic canvas with exact interactive
            score text placed directly over each of the paper notes!
        ========================================================= */}
        <div className="hidden md:block relative w-full overflow-hidden  shadow-2xl border border-white/5 aspect-2172/724">
          
          {/* Background Canvas: target_brand.png */}
          <Image
            src="/banner/target_brand.png"
            alt="IELTS Target Band Scores 6.5 to 9.0"
            fill
            priority
            sizes="(max-width: 1400px)  100vw, 1360px"
            className="object-cover object-center select-none pointer-events-none"
          />

          {/* Bottom Centered CTA Button */}
          <div className="absolute bottom-[4.5%] left-1/2 -translate-x-1/2 z-30">
            <Link
              href={`/register?target=${selectedScore}`}
              className="group inline-flex items-center gap-2.5 px-6 sm:px-8 py-2.5 sm:py-3 lg:py-3.5 rounded-full bg-[#ff3333] hover:bg-[#e62626] text-white font-black text-xs sm:text-sm lg:text-base tracking-wide shadow-[0_4px_25px_rgba(255,51,51,0.55)] border border-white/25 transition-all duration-300 hover:scale-105 active:scale-[0.98] whitespace-nowrap cursor-pointer"
            >
              <span>Build My Plan</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-3 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Score Text Overlaid on Each Paper Note */}
          {scores.map((s) => {
            const isSelected = selectedScore === s.band;

            return (
              <button
                key={s.band}
                onClick={() => setSelectedScore(s.band)}
                style={{
                  left: s.left,
                  top: s.top,
                  width: s.width,
                  height: s.height,
                }}
                className={`absolute z-20 flex flex-col items-center justify-center text-center cursor-pointer select-none transition-all duration-300 ${s.rotation} group ${
                  isSelected
                    ? "scale-105 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
                    : "hover:scale-[1.04]"
                }`}
                aria-label={`Select band score ${s.band} ${s.label}`}
              >
                {/* Active Selection Indicator */}
                {isSelected && (
                  <span className="absolute inset-1 rounded-sm ring-2 ring-[#ff3333]/70 pointer-events-none animate-pulse" />
                )}

                {/* Score Number */}
                <span
                  className={`font-black leading-none tracking-tight transition-transform duration-300 group-hover:scale-105 ${
                    s.isFeatured
                      ? "text-white text-2xl md:text-2xl lg:text-3xl xl:text-[38px] drop-shadow-sm"
                      : "text-[#101828] text-xl md:text-xl lg:text-2xl xl:text-[32px]"
                  }`}
                >
                  {s.band}
                </span>

                {/* Label Text (e.g. GOOD BAND, VERY GOOD BAND) */}
                <span
                  className={`mt-1 block font-black leading-[1.05] tracking-tighter uppercase text-center ${
                    s.isFeatured
                      ? "text-white text-[8px] md:text-[8px] lg:text-[9.5px] xl:text-[11px]"
                      : "text-[#182230] text-[7.5px] md:text-[7.5px] lg:text-[8.5px] xl:text-[10px]"
                  }`}
                >
                  {s.label}
                  <br />
                  {s.sub}
                </span>
              </button>
            );
          })}

        </div>

        {/* =========================================================
            MOBILE VIEW (< md):
            Fully optimized, highly responsive layout with clear typography,
            interactive sticky paper score cards, and the target banner visual!
        ========================================================= */}
        <div className="md:hidden flex flex-col overflow-hidden rounded-2xl bg-[#090b0e] border border-white/10 shadow-2xl p-5 sm:p-6">
          
          {/* Mobile Headline & CTA */}
          <div className="flex flex-col items-start mb-6">
            <h2 className="font-black uppercase tracking-[-0.04em] leading-[0.92] text-white text-[32px] sm:text-[38px]">
              WHAT&apos;S
              <br />
              YOUR
              <br />
              <span className="text-[#ff3333]">TARGET?</span>
            </h2>

            <p className="mt-2.5 text-xs sm:text-sm font-medium leading-relaxed text-zinc-300 max-w-xs">
              Choose your target score and build a focused learning path.
            </p>
          </div>

          {/* Interactive Mobile Score Paper Cards (Horizontal Grid / Scroll) */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 my-2">
            {scores.map((s) => {
              const isSelected = selectedScore === s.band;

              return (
                <button
                  key={s.band}
                  onClick={() => setSelectedScore(s.band)}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-xl transition-all select-none cursor-pointer ${
                    s.isFeatured
                      ? "bg-[#e52828] text-white shadow-md shadow-red-900/40"
                      : "bg-[#f5f2ea] text-[#101828] shadow-sm"
                  } ${
                    isSelected
                      ? "ring-2 ring-white scale-105 z-10"
                      : "opacity-90 hover:opacity-100"
                  }`}
                >
                  {/* Tape Badge */}
                  <span
                    className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-7 h-2.5 rounded-xs ${s.tapeColor}`}
                  />

                  {/* Crown for 8.5 */}
                  {s.isFeatured && (
                    <Crown className="w-4 h-4 text-amber-300 fill-amber-300 -mt-1 mb-0.5" />
                  )}

                  <span className="text-xl font-black leading-none tracking-tight">
                    {s.band}
                  </span>

                  <span
                    className={`mt-1 text-[8px] font-black uppercase tracking-tighter leading-tight ${
                      s.isFeatured ? "text-white/90" : "text-zinc-600"
                    }`}
                  >
                    {s.label} {s.sub}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom Illustration Banner View */}
          <div className="relative mt-5 w-full h-[180px] sm:h-[220px] rounded-xl overflow-hidden border border-white/5">
            <Image
              src="/banner/target_brand.png"
              alt="Target Banner Illustration"
              fill
              sizes="100vw"
              className="object-cover object-[80%_center] select-none pointer-events-none"
            />
            {/* Mobile "GO BIGGER" Doodle */}
            <div className="absolute top-2.5 right-3 z-10 flex flex-col items-center pointer-events-none select-none">
              <span className="font-black uppercase text-[#ff3333] text-[11px] leading-tight tracking-wider -rotate-6 text-center drop-shadow-sm font-jakarta">
                GO
                <br />
                BIGGER
              </span>
              <svg
                className="w-4 h-4 text-[#ff3333] mt-0.5 -rotate-12 drop-shadow-sm"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 8 C 10 18, 16 26, 26 28 M26 28 L 18 28 M 26 28 L 24 20"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Mobile Centered Bottom CTA Button */}
          <div className="mt-5 flex justify-center w-full">
            <Link
              href={`/register?target=${selectedScore}`}
              className="group inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-7 py-3 rounded-full bg-[#ff3333] hover:bg-[#e62626] text-white font-black text-sm tracking-wide shadow-[0_4px_20px_rgba(255,51,51,0.5)] border border-white/20 transition-all duration-300 active:scale-[0.98]"
            >
              <span>Build My Plan</span>
              <ArrowRight className="w-4 h-4 stroke-3 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
};
