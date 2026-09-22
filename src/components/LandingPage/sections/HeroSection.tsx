"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play, CheckCircle2 } from "lucide-react";

export const HeroSection: React.FC = () => {
  return (
    <section className="w-full p-0 m-0 bg-[#f8f3e9] font-jakarta">
      <div className="relative w-full aspect-1729/835 overflow-hidden">
        {/* Banner Image */}
        <Image
          src="/banner/banner1.png"
          alt="IELTS Preparation Hero Banner"
          width={1729}
          height={910}
          priority
          sizes="100vw"
          className="w-full h-auto block select-none"
        />

        {/* Soft bottom blend to seamlessly hide table and blend into page */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 sm:h-14 md:h-18 bg-linear-to-t from-[#f8f3e9] to-transparent z-10" />

        {/* Left Side Backdrop Tint for Text Readability on Smaller Screens */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[70%] sm:w-[55%] bg-linear-to-r from-[#f8f3e9]/95 via-[#f8f3e9]/70 to-transparent z-10" />

        {/* Left Side Content Overlay */}
        <div className="absolute inset-0 z-20 flex items-center">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 h-full flex items-center">
            <div className="w-[64%] sm:w-[56%] md:w-[50%] lg:w-[46%] xl:w-[43%] flex flex-col justify-center">
              
              {/* Top Floating Badge Row */}
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2.5 md:mb-3">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-2xs">
                  <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#FF385C] animate-pulse" />
                  <span className="text-[8px] sm:text-[10px] md:text-[11px] font-black text-slate-800 tracking-wider uppercase">
                    #1 CBT IELTS PLATFORM
                  </span>
                </div>
                <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFD51E]/95 text-slate-900 text-[10px] font-bold shadow-2xs rotate-1">
                  <span>⚡ Instant AI Scoring</span>
                </div>
              </div>

              {/* Main Iconic Headline with Yellow Tape Highlighter */}
              <h1 className="text-xs xs:text-sm sm:text-2xl md:text-3xl lg:text-[2.6rem] xl:text-[3.1rem] font-black text-slate-950 tracking-tight leading-[1.12] mb-1.5 sm:mb-2 md:mb-3">
                Crack IELTS with{" "}
                <span className="relative inline-block px-1.5 sm:px-2.5 py-0.5 bg-[#FFD51E] text-slate-950 -rotate-1 rounded-xs shadow-xs font-black">
                  REAL CBT
                </span>
                <br />
                Exam Experience.
              </h1>

              {/* Handwritten Aesthetic Accent */}
              <div className="hidden sm:flex items-center gap-2 mb-1.5 sm:mb-2">
                <span className="font-caveat text-sm sm:text-base md:text-lg font-bold text-[#FF385C] -rotate-1">
                  ✦ Guaranteed Band 7.5 to 8.5+ Strategy
                </span>
              </div>

              {/* Subtitle / Description */}
              <p className="text-[8px] sm:text-xs md:text-sm lg:text-[15px] text-slate-700 font-medium leading-tight sm:leading-relaxed line-clamp-2 sm:line-clamp-3 md:line-clamp-none mb-2 sm:mb-4 md:mb-5 max-w-md">
                Practice authentic Computer-Based tests for <strong className="font-bold text-slate-900">Reading, Listening, Writing & Speaking</strong> with instant AI evaluation and real-time score breakdowns.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
                <Link
                  href="/practice/reading"
                  className="group inline-flex items-center gap-1 sm:gap-2 px-2.5 sm:px-5 md:px-6 py-1 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl md:rounded-2xl bg-[#FF385C] hover:bg-[#E0294C] text-white text-[9px] sm:text-xs md:text-sm font-extrabold shadow-sm sm:shadow-md shadow-red-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Start Free Practice</span>
                  <ArrowRight className="w-2.5 h-2.5 sm:w-4 sm:h-4 stroke-[2.5] transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/mock-tests/full"
                  className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 md:px-5 py-1 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl md:rounded-2xl bg-white/95 hover:bg-white text-slate-800 text-[9px] sm:text-xs md:text-sm font-bold shadow-2xs border border-slate-200/90 backdrop-blur-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play className="w-2 h-2 sm:w-3 sm:h-3 text-[#FF385C] fill-[#FF385C]" />
                  <span>Full Mock Test</span>
                </Link>
              </div>

              {/* Iconic Feature Badges / Trust Strip */}
              <div className="hidden sm:flex items-center gap-2 sm:gap-2.5 mt-3 sm:mt-4 md:mt-5 flex-wrap">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/90 border border-slate-200/80 shadow-2xs text-[10px] md:text-xs font-bold text-slate-700">
                  <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-500" />
                  <span>Real Exam UI</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/90 border border-slate-200/80 shadow-2xs text-[10px] md:text-xs font-bold text-slate-700">
                  <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-500" />
                  <span>Instant AI Band</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/90 border border-slate-200/80 shadow-2xs text-[10px] md:text-xs font-bold text-slate-700">
                  <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-500" />
                  <span>500+ Test Sets</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
