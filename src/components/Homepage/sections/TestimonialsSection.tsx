"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Play, Quote } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { InView } from "../shared/InView";
import { SectionHeader } from "../shared/SectionHeader";
import { GlassCard } from "../shared/GlassCard";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    name: "প্রিয়া শর্মা",
    country: "🇮🇳 ভারত",
    before: 6.0,
    after: 7.5,
    quote:
      "এই প্ল্যাটফর্মের CBT ইন্টারফেস আমার বাস্তব পরীক্ষার কেন্দ্রের মতোই হুবহু ছিল। আমি সম্পূর্ণ আত্মবিশ্বাসের সাথে পরীক্ষা দিয়ে প্রথমবারেই আমার কাঙ্ক্ষিত ব্যান্ড অর্জন করেছি।",
    verified: true,
  },
  {
    name: "জেমস ওকোনকো",
    country: "🇳🇬 নাইজেরিয়া",
    before: 5.5,
    after: 7.0,
    quote:
      "এআই রাইটিং ফিডব্যাক আমার টাস্ক ২-এর গঠন সম্পূর্ণ বদলে দিয়েছে। মাত্র ৬ সপ্তাহের নিবিড় অনুশীলনে আমার স্কোর ১.৫ ব্যান্ড বৃদ্ধি পেয়েছে।",
    verified: true,
  },
  {
    name: "মারিয়া চেন",
    country: "🇨🇳 চীন",
    before: 6.5,
    after: 8.0,
    quote:
      "রিয়েল টাইমারসহ মক টেস্ট আমাকে মানসিকভাবে প্রস্তুত করেছিল। অ্যানালিটিক্স খুব নির্ভুলভাবে দেখিয়েছিল যে আমার কোন বিষয়ে আরও মনোযোগ দেওয়া দরকার।",
    verified: true,
  },
  {
    name: "আহমেদ আল-রশিদ",
    country: "🇦🇪 সংযুক্ত আরব আমিরাত",
    before: 6.0,
    after: 7.0,
    quote:
      "উচ্চারণ বিশ্লেষণ সহ স্পিকিং প্র্যাকটিস আমার এমন কিছু ত্রুটি সংশোধন করেছে যা আমি আগে কখনও লক্ষ্য করিনি। সকল CBT পরীক্ষার্থীদের জন্য অত্যন্ত সুপারিশ করছি।",
    verified: true,
  },
];

export function TestimonialsSection() {
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, 6000);
    return () => clearInterval(interval);
  }, [api]);

  return (
    <section id="reviews" className="hp-section bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <InView>
          <SectionHeader
            eyebrow="সফলতার গল্প"
            title="বিশ্বজুড়ে শিক্ষার্থীদের আস্থার প্রতীক"
            description="আমাদের বাস্তবসম্মত সিবিটি প্ল্যাটফর্ম ব্যবহার করে শিক্ষার্থীদের অর্জিত ব্যান্ড স্কোরের অভূতপূর্ব উন্নতি।"
          />
        </InView>

        <InView delay={80} className="mt-14">
          <Carousel setApi={setApi} opts={{ align: "start", loop: true }}>
            <CarouselContent className="-ml-4">
              {testimonials.map((t) => (
                <CarouselItem
                  key={t.name}
                  className="pl-4 md:basis-1/2 lg:basis-1/3"
                >
                  <GlassCard className="flex h-full flex-col p-6 transition-shadow hover:shadow-xl">
                    <Quote className="size-8 text-red-100" />
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-neutral-600">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="mt-6 flex items-center gap-3 border-t border-neutral-100 pt-4">
                      <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-red-50 text-sm font-bold text-ielts-red">
                        {t.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-neutral-900">{t.name}</p>
                          {t.verified && (
                            <BadgeCheck className="size-4 text-blue-600" />
                          )}
                        </div>
                        <p className="text-xs text-neutral-500">{t.country}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-neutral-400">ব্যান্ড</p>
                        <p className="font-bold text-neutral-900">
                          <span className="text-neutral-400 line-through">
                            {t.before}
                          </span>{" "}
                          → {t.after}
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </InView>

        <InView delay={120} className="mt-10">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "৪.৯/৫ গড় রেটিং", sub: "১২,৪০০+ রিভিউ" },
              { label: "যাচাইকৃত শিক্ষার্থীর গল্প", sub: "ব্যান্ড স্কোর নিশ্চিত" },
              { label: "ভিডিও প্রশংসাপত্র", sub: "সফলতার যাত্রা দেখুন" },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-4 rounded-2xl border border-neutral-100 bg-neutral-50/50 p-5"
                )}
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-ielts-red/10 text-ielts-red">
                  <Play className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">{item.label}</p>
                  <p className="text-sm text-neutral-500">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </InView>
      </div>
    </section>
  );
}
