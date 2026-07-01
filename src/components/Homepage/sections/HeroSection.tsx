"use client";

import Link from "next/link";
import Image from "next/image";
import { Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeroBackground } from "./HeroBackground";
import { HeroVisual } from "./HeroVisual";

const STUDENT_AVATARS = [
  {
    src: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=80&h=80&fit=crop",
    alt: "Student",
  },
  {
    src: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=80&h=80&fit=crop",
    alt: "Student",
  },
  {
    src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=80&h=80&fit=crop",
    alt: "Student",
  },
];

export function HeroSection() {
  return (
    <section
      id="hero"
      className="hp-section relative overflow-hidden bg-white"
    >
      <HeroBackground />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-16 px-4 pb-20 pt-12 max-md:gap-20 md:flex-row md:px-8 md:pt-16 lg:px-12 xl:px-16">
        <div className="flex flex-col items-center md:items-start">
          <div className="flex flex-wrap items-center justify-center rounded-full border border-slate-300/80 p-1.5 text-xs text-slate-600">
            <div className="flex items-center">
              {STUDENT_AVATARS.map((avatar, i) => (
                <Image
                  key={avatar.src}
                  src={avatar.src}
                  alt={avatar.alt}
                  width={28}
                  height={28}
                  className={cn(
                    "size-7 rounded-full border-[3px] border-white object-cover",
                    i > 0 && "-ml-2"
                  )}
                />
              ))}
            </div>
            <p className="-ml-2 pr-2 font-medium">
              বিশ্বজুড়ে ২৮০,০০০+ আইইএলটিএস শিক্ষার্থীর সাথে যুক্ত হোন
            </p>
          </div>

          <h1 className="mt-8 max-w-xl text-center text-5xl font-medium leading-[1.2] text-slate-900 md:text-left md:text-6xl md:leading-[1.15]">
            বাস্তব কম্পিউটারের মতো{" "}
            <span className="text-ielts-red">IELTS পরীক্ষা</span> প্র্যাকটিস করুন
          </h1>

          <p className="mt-4 max-w-lg text-center text-sm leading-relaxed text-slate-600 md:text-left md:text-base">
            লিসেনিং, রিডিং, রাইটিং এবং স্পিকিংয়ের নির্ভুল সিবিটি (CBT) সিমুলেশন — সাথে আপনার কাঙ্ক্ষিত ব্যান্ড স্কোর অর্জনে রয়েছে মক টেস্ট, অ্যানালিটিক্স এবং এআই (AI) ফিডব্যাক।
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm md:justify-start">
            <Link
              href="/mock-tests/full"
              className="inline-flex h-11 items-center justify-center rounded-md bg-ielts-red px-7 font-medium text-white transition hover:bg-ielts-red-dark active:scale-[0.98]"
            >
              ফ্রি মক টেস্ট শুরু করুন
            </Link>
            <Link
              href="#cbt"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-400 px-6 font-medium text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
            >
              <Video className="size-5 stroke-[1.25]" strokeWidth={1.25} />
              <span>ডেমো দেখুন</span>
            </Link>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
