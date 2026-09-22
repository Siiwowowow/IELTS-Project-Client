"use client";

import React from "react";
import {
  Users,
  FileText,
  Target,
  Clock,
  ArrowRight,
} from "lucide-react";

export const TrustStatsSection: React.FC = () => {
  const stats = [
    {
      number: "10K+",
      icon: Users,
      color: "#FF2E1F",
      textColor: "#FFFFFF",
      tape: false,
    },
    {
      number: "500+",
      icon: FileText,
      color: "#FFD51E",
      textColor: "#111111",
      tape: true,
    },
    {
      number: "8.5+",
      icon: Target,
      color: "#1769F5",
      textColor: "#FFFFFF",
      tape: true,
    },
    {
      number: "24/7",
      icon: Clock,
      color: "#F52D73",
      textColor: "#FFFFFF",
      tape: false,
    },
  ];

  return (
    <section className="w-full py-8">
    <div className="mx-auto w-full max-w-[1450px] px-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3">
        {stats.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={index}
              className="relative h-25 sm:h-26.25"
            >
              {/* ================= PAPER ================= */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  backgroundColor: item.color,

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

              {/* ================= TOP TAPE ================= */}
              {item.tape && (
                <div
                  className="absolute -top-[7px] left-[42%] z-30 h-[22px] w-[58px] rotate-[-5deg] opacity-70"
                  style={{
                    backgroundColor:
                      index === 1 ? "#FFF4B0" : "#8EA8FF",
                  }}
                >
                  <div className="absolute inset-0 bg-white/20" />
                </div>
              )}

              {/* ================= CONTENT ================= */}
              <div className="relative z-20 flex h-full items-center px-6 sm:px-7">
                {/* ICON */}
                <div className="mr-4 flex h-[50px] w-[50px] shrink-0 items-center justify-center">
                  <Icon
                    className="h-[35px] w-[35px]"
                    strokeWidth={2.4}
                    style={{
                      color: item.textColor,
                    }}
                  />
                </div>

                {/* NUMBER ONLY */}
                <div className="flex-1">
                  <span
                    className="block text-[34px] font-black leading-none tracking-[-0.05em] sm:text-[38px]"
                    style={{
                      color: item.textColor,
                    }}
                  >
                    {item.number}
                  </span>
                </div>

                {/* ARROW */}
                <ArrowRight
                  className="h-[25px] w-[25px] shrink-0"
                  strokeWidth={2.8}
                  style={{
                    color: item.textColor,
                  }}
                />
              </div>

              {/* ================= BOTTOM SCRIBBLE ================= */}
              <div
                className="absolute bottom-[5px] right-[13%] z-30 h-[3px] w-[42px] rotate-[-7deg]"
                style={{
                  backgroundColor: item.textColor,
                  opacity: 0.8,
                }}
              />

              <div
                className="absolute bottom-[1px] right-[11%] z-30 h-[2px] w-[28px] rotate-[-10deg]"
                style={{
                  backgroundColor: item.textColor,
                  opacity: 0.65,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
    </section>
  );
};