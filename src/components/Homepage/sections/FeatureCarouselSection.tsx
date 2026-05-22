"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Monitor,
  Headphones,
  BookOpen,
  PenLine,
  Mic,
  Library,
  Sparkles,
  BarChart3,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { InView } from "../shared/InView";
import { SectionHeader } from "../shared/SectionHeader";

const features = [
  {
    icon: Monitor,
    title: "Real CBT Exam Interface",
    description:
      "Pixel-accurate computer-based test UI with timers, navigator, and official question layouts.",
    gradient: "from-red-500/20 to-red-600/5",
  },
  {
    icon: Headphones,
    title: "Listening Practice",
    description:
      "Authentic audio passages with note-taking, review time, and section timers.",
    gradient: "from-blue-500/20 to-blue-600/5",
  },
  {
    icon: BookOpen,
    title: "Reading Practice",
    description:
      "Academic and general training passages with highlight tools and split-screen layout.",
    gradient: "from-violet-500/20 to-violet-600/5",
  },
  {
    icon: PenLine,
    title: "Writing Evaluation",
    description:
      "Task 1 & 2 editors with word count, auto-save, and band-scored AI feedback.",
    gradient: "from-amber-500/20 to-amber-600/5",
  },
  {
    icon: Mic,
    title: "Speaking Practice",
    description:
      "Timed parts with recording, playback, and pronunciation analysis.",
    gradient: "from-emerald-500/20 to-emerald-600/5",
  },
  {
    icon: Library,
    title: "Vocabulary Flashcards",
    description:
      "Topic-based decks with spaced repetition and IELTS high-frequency word lists.",
    gradient: "from-cyan-500/20 to-cyan-600/5",
  },
  {
    icon: Sparkles,
    title: "AI Feedback",
    description:
      "Instant corrections for grammar, coherence, lexical resource, and pronunciation.",
    gradient: "from-fuchsia-500/20 to-fuchsia-600/5",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track band progress, weak skills, study streaks, and mock test performance.",
    gradient: "from-neutral-500/15 to-neutral-600/5",
  },
];

export function FeatureCarouselSection() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, 5000);
    return () => clearInterval(interval);
  }, [api]);

  return (
    <section id="features" className="hp-section bg-neutral-50/80 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <InView>
          <SectionHeader
            eyebrow="Platform Features"
            title="Everything You Need for IELTS Success"
            description="A complete preparation ecosystem — from authentic CBT practice to AI-powered insights."
          />
        </InView>

        <InView delay={100} className="mt-14">
          <Carousel
            setApi={setApi}
            opts={{ align: "start", loop: true, dragFree: true }}
            className="w-full"
          >
            <CarouselContent className="-ml-4 md:-ml-6">
              {features.map((feature) => (
                <CarouselItem
                  key={feature.title}
                  className="pl-4 md:basis-1/2 md:pl-6 lg:basis-1/3"
                >
                  <div
                    className={cn(
                      "group relative h-full overflow-hidden rounded-2xl border border-white/80 bg-white p-8 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-xl",
                      `bg-gradient-to-br ${feature.gradient}`
                    )}
                  >
                    <div className="hp-glass mb-6 inline-flex size-14 items-center justify-center rounded-2xl">
                      <feature.icon className="size-7 text-ielts-red" />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                      {feature.description}
                    </p>
                    <div className="absolute -right-8 -bottom-8 size-32 rounded-full bg-ielts-red/5 blur-2xl transition-transform duration-500 group-hover:scale-150" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 border-neutral-200 bg-white shadow-md sm:-left-4" />
            <CarouselNext className="right-0 border-neutral-200 bg-white shadow-md sm:-right-4" />
          </Carousel>

          <div className="mt-8 flex justify-center gap-2">
            {features.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => api?.scrollTo(i)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  current === i
                    ? "w-8 bg-ielts-red"
                    : "w-2 bg-neutral-300 hover:bg-neutral-400"
                )}
              />
            ))}
          </div>
        </InView>
      </div>
    </section>
  );
}
