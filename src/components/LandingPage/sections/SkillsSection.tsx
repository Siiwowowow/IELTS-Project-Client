"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const SkillsSection: React.FC = () => {
  const modules = [
    {
      number: "01",
      title: "READING",
      desc: "Improve comprehension, skimming and scanning.",
      image: "/banner/reading-card.png",
      href: "/practice/reading",
    },
    {
      number: "02",
      title: "LISTENING",
      desc: "Train your listening skills with realistic audio.",
      image: "/banner/listening-card.png",
      href: "/practice/listening",
    },
    {
      number: "03",
      title: "SPEAKING",
      desc: "Build fluency, vocabulary and confidence.",
      image: "/banner/speaking-card.png",
      href: "/practice/speaking",
    },
    {
      number: "04",
      title: "WRITING",
      desc: "Learn clear structures and stronger academic writing.",
      image: "/banner/writing-card.png",
      href: "/practice/writing",
    },
  ];

  return (
    <section
      id="skills"
      className="relative isolate overflow-hidden bg-[#f8f3e9] py-10 font-jakarta sm:py-12 lg:py-16"
    >
      <div className="relative mx-auto flex w-full max-w-330 flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-end lg:gap-0 xl:px-8">
        {/* =======================================================
            LEFT COLUMN: TEXT + BIGGER BOTTOM ILLUSTRATION
            - Illustration fills up to the right edge of this column
            - Sits level with the bottom line of the cards
            - ZERO gap between illustration and first card
            - Text and 4 Goals PNG centered in the middle of the cards
            - Text and illustration share the exact same start line
        ======================================================== */}
        <div className="relative flex w-full shrink-0 flex-col justify-start py-2 lg:w-102.5 lg:self-stretch lg:pb-16 lg:pb-0 xl:w-110">
          {/* Text at top & 4 Goals PNG in illustration area */}
          <div className="relative z-30 flex flex-col items-start justify-start pt-1 sm:pt-2">
            {/* Badge */}
            <span className="inline-flex w-fit rounded-full border border-[#ff4638]/35 bg-white/70 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.06em] text-[#ef4032] sm:text-[10px]">
              IELTS MODULES
            </span>

            {/* Main Heading */}
            <h2 className="mt-2.5 font-black uppercase leading-[0.88] tracking-[-0.055em] text-[#111828] text-[25px] sm:text-[34px] lg:text-[38px] xl:text-[42px] ">
              EVERYTHING YOU 
              <br/>
             NEED TO
              <br />
              <span className="text-[#f2382e]">MASTER IELTS.</span>
            </h2>

            {/* Description */}
            <p className="mt-2.5 max-w-64 text-[10px] font-medium leading-[1.45] text-[#4b535c] sm:text-[11px] lg:text-[12px]">
              Practice every skill with focused lessons and real-world exam
              simulations.
            </p>

            {/* 4 Skills 1 Goal Arrow (Positioned in the illustration area, floating on top) */}
            <div className="relative z-40 mt-6 h-14 w-full sm:mt-7 lg:mt-8">
              <div className="pointer-events-none absolute left-6 top-0 z-40 select-none sm:left-10 lg:left-34">
                <Image
                  src="/banner/goal_arrow.png"
                  alt="4 Skills 1 Goal"
                  width={470}
                  height={180}
                  priority
                  className="pointer-events-none h-auto w-20 select-none object-contain drop-shadow-md sm:w-26 lg:w-30"
                />
              </div>
            </div>
          </div>

          {/* Bigger Illustration:
              Stretches across the left column right up to where Card 01 begins
              with ZERO gap, perfectly level at the bottom */}
          <div className="pointer-events-none absolute bottom-0 rounded-2xl mb-1 z-0 w-full select-none">
            <Image
              src="/banner/iillustration.png"
              alt=""
              width={1536}
              height={1024}
              priority
              aria-hidden="true"
              className="h-auto w-full object-contain object-bottom-left"
            />
          </div>
        </div>

        {/* =======================================================
            RIGHT COLUMN: 4 SKILL CARDS (Bigger size, starts right at illustration edge)
            - ZERO gap between illustration and Card 01 (lg:ml-0)
            - Cards are larger and more prominent
            - Level baseline at the bottom with the illustration
        ======================================================== */}
        <div className="relative z-20 grid w-full flex-1 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-3.5 xl:gap-4 lg:ml-0">
          {modules.map((item, index) => (
            <Link
              key={item.number}
              href={item.href}
              className="group relative block aspect-[0.60] w-full overflow-hidden rounded-[13px] sm:rounded-[15px] lg:rounded-[18px]"
            >
              {/* Card Background Image */}
              <Image
                src={item.image}
                alt={item.title}
                fill
                priority={index < 4}
                sizes="(max-width: 640px) 48vw, (max-width: 1024px) 24vw, 215px"
                className="pointer-events-none select-none object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />

              {/* Card Content Overlay */}
              <div className="pointer-events-none absolute inset-0 p-3 sm:p-3.5 md:p-4 xl:p-4.5 text-[#101820]">
                {/* Number */}
                <span className="block text-[20px] font-black leading-none tracking-[-0.06em] text-[#101820] sm:text-[22px] md:text-[24px] lg:text-[25px] xl:text-[27px]">
                  {item.number}
                </span>

                {/* Title */}
                <h3 className="mt-1.5 text-[11.5px] font-black uppercase leading-none tracking-[-0.035em] text-[#101820] sm:text-[13px] md:text-[14px] lg:text-[15px] xl:text-[16px]">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="mt-1.5 max-w-[145px] text-[7.5px] font-semibold leading-[1.24] text-[#18232d] sm:text-[8.5px] md:text-[9px] lg:text-[9.5px] xl:text-[10px]">
                  {item.desc}
                </p>

                {/* Learn More */}
                <span className="mt-2 inline-flex items-center gap-0.5 text-[8px] font-black text-[#101820] sm:text-[8.5px] md:text-[9px] lg:text-[9.5px] xl:text-[10px]">
                  Learn More
                  <ArrowRight className="h-2.5 w-2.5 transition-transform duration-300 group-hover:translate-x-1 sm:h-3 sm:w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};