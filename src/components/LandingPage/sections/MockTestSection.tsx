"use client";

import React from "react";
import Link from "next/link";
import { Clock, BookOpen, Headphones, Mic, PenTool, ArrowRight } from "lucide-react";

export const MockTestSection: React.FC = () => {
  return (
    <section id="mock-test" className="py-16 bg-[#f8f3e9] font-jakarta">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Dark Slate Rounded Container */}
        <div className="bg-[#0F172A] rounded-3xl p-8 sm:p-10 lg:p-12 text-white shadow-xl relative overflow-hidden">
          
          {/* Subtle glow background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            
            {/* Left Column: Heading & Subtitle */}
            <div className="lg:col-span-4">
              <div className="inline-flex items-center px-3 py-1 bg-white/10 text-white text-xs font-bold rounded-full w-fit mb-3 border border-white/10">
                <span>REAL IELTS PRACTICE</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
                Test Yourself.
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
                Experience realistic IELTS practice tests and understand where you need to improve.
              </p>
            </div>

            {/* Middle Column: White Full IELTS Mock Test Card */}
            <div className="lg:col-span-5">
              <div className="bg-white text-slate-900 rounded-2xl p-5 sm:p-6 shadow-lg">
                <div className="text-base font-extrabold text-slate-900 mb-3">
                  Full IELTS Mock Test
                </div>

                {/* 4 Skills Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700">
                    <BookOpen className="w-3 h-3 text-blue-500" /> Reading
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700">
                    <Headphones className="w-3 h-3 text-amber-500" /> Listening
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700">
                    <PenTool className="w-3 h-3 text-emerald-500" /> Writing
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700">
                    <Mic className="w-3 h-3 text-purple-500" /> Speaking
                  </span>
                </div>

                {/* Bottom Row: Time & CTA */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-slate-700" />
                    <span>2h 45m</span>
                  </div>

                  <Link
                    href="/mock-tests/full"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF385C] hover:bg-[#E0294C] text-white text-xs font-bold rounded-full shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Start Mock Test</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: IELTS Test Paper & 8.5+ Stamp + "Better Results" */}
            <div className="lg:col-span-3 flex items-center justify-center lg:justify-end">
              <div className="relative select-none">
                
                {/* Paper sheet */}
                <div className="w-36 sm:w-40 bg-white/95 text-slate-900 rounded-xl p-3 shadow-xl transform rotate-3 border border-slate-200">
                  <div className="text-[10px] font-black text-slate-800 tracking-wider uppercase mb-1">
                    IELTS
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-1 bg-slate-200 rounded-full w-full" />
                    <div className="h-1 bg-slate-200 rounded-full w-4/5" />
                    <div className="h-1 bg-slate-200 rounded-full w-3/5" />
                    <div className="h-1 bg-slate-200 rounded-full w-full" />
                  </div>
                </div>

                {/* Red Circular Stamp: 8.5+ */}
                <div className="absolute -bottom-2 -left-3 sm:-left-4 w-14 h-14 rounded-full bg-[#FF385C] text-white font-black text-sm flex items-center justify-center shadow-lg border-2 border-white transform -rotate-12">
                  8.5+
                </div>

                {/* Handwritten script: "Better Results" */}
                <div className="absolute -top-3 -right-6 font-caveat text-lg sm:text-xl font-bold text-red-200 transform rotate-6 whitespace-nowrap">
                  Better<br />Results
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
