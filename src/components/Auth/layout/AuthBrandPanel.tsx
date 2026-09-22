"use client";

import Image from "next/image";
import { Award, Star, Quote, ChevronRight } from "lucide-react";

const stats = [
  { value: "50K+", label: "Active learners" },
  { value: "8.5", label: "Avg. band achieved" },
  { value: "98%", label: "Success rate" },
];

export function AuthBrandPanel() {
  return (
    <div className="relative flex h-full min-h-[500px] flex-col justify-between overflow-hidden p-8 lg:p-12">
      {/* Background Student Image */}
      <div className="absolute inset-0 pointer-events-none">
        <Image
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop"
          alt="Focused student preparing for computer-based IELTS test"
          fill
          className="object-cover"
          priority
        />
        {/* Dark mask overlay */}
        <div className="absolute inset-0 bg-slate-950/80 mix-blend-multiply" />
        {/* Gradient brand overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-red-950/50 via-slate-950/20 to-slate-950/60" />
      </div>

      {/* Top Section */}
      <div className="relative z-10">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/95 backdrop-blur-md">
          <Award className="size-3.5 text-red-400" />
          Official CBT IELTS Simulation
        </div>
        <h1 className="max-w-md text-3xl font-black leading-tight tracking-tight text-white lg:text-4xl xl:text-[2.75rem]">
          Practice IELTS Like the <span className="text-red-500">Real Exam</span>
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-300 lg:text-base">
          Unlock realistic full mock tests, section-specific practices, and instant AI analytics designed to elevate your band score.
        </p>
      </div>

      {/* Middle Floating Testimonial Section */}
      <div className="relative z-10 my-8 hidden flex-1 items-center justify-center lg:flex">
        <div className="relative w-full max-w-md">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-amber-400 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-3.5 fill-amber-400" />
              ))}
            </div>
            
            <div className="relative">
              <Quote className="absolute -left-2 -top-2 size-8 text-white/10 rotate-180" />
              <p className="text-sm font-medium leading-relaxed text-white/90 pl-6 italic">
                The practice simulation matched the actual IELTS computer-delivered exam perfectly. The instant AI writing evaluation helped me improve my band from 6.5 to 8.5!
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
              <div className="flex items-center gap-3">
                <div className="relative size-9 overflow-hidden rounded-full border border-white/20 bg-neutral-800">
                  <Image
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop"
                    alt="IELTS candidate success story"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Emily Watson</h4>
                  <p className="text-[10px] font-medium text-neutral-400">Band 8.5 Achieved</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-0.5 rounded-lg bg-red-500/20 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-red-300 border border-red-500/10">
                +2.0 Bands
              </span>
            </div>
          </div>

          {/* Miniature status notifications */}
          <div className="absolute -right-4 -top-6 rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2.5 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <span className="flex size-2 items-center justify-center rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Exam Mode Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats Footer */}
      <div className="relative z-10 grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/5 bg-white/5 px-3 py-3.5 text-center backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/10"
          >
            <p className="text-xl font-black text-white lg:text-2xl tracking-tight">{stat.value}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-300 lg:text-[11px]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
