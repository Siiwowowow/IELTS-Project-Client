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
    name: "Priya Sharma",
    country: "🇮🇳 India",
    before: 6.0,
    after: 7.5,
    quote:
      "The CBT interface was identical to my test centre. I walked in confident — and achieved my target band on the first attempt.",
    verified: true,
  },
  {
    name: "James Okonkwo",
    country: "🇳🇬 Nigeria",
    before: 5.5,
    after: 7.0,
    quote:
      "AI writing feedback transformed my Task 2 structure. I improved by 1.5 bands in six weeks of focused practice.",
    verified: true,
  },
  {
    name: "Maria Chen",
    country: "🇨🇳 China",
    before: 6.5,
    after: 8.0,
    quote:
      "Mock tests with real timers prepared me mentally. Analytics showed exactly where to spend my study hours.",
    verified: true,
  },
  {
    name: "Ahmed Al-Rashid",
    country: "🇦🇪 UAE",
    before: 6.0,
    after: 7.0,
    quote:
      "Speaking practice with pronunciation analysis fixed issues I never noticed. Highly recommend for CBT candidates.",
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
            eyebrow="Success Stories"
            title="Trusted by Students Worldwide"
            description="Real band improvements from learners who prepared with our authentic CBT platform."
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
                        <p className="text-xs text-neutral-400">Band</p>
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
              { label: "4.9/5 average rating", sub: "12,400+ reviews" },
              { label: "Verified student stories", sub: "Band scores confirmed" },
              { label: "Video testimonials", sub: "Watch success journeys" },
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
