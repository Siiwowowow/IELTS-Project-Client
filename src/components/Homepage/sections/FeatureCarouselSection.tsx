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
    title: "বাস্তব CBT পরীক্ষা ইন্টারফেস",
    description:
      "টাইমার, কোয়েশ্চেন নেভিগেটর এবং অফিশিয়াল লেআউটসহ সম্পূর্ণ বাস্তবসম্মত কম্পিউটার-বেসড টেস্ট UI।",
    gradient: "from-red-500/20 to-red-600/5",
  },
  {
    icon: Headphones,
    title: "লিসেনিং প্র্যাকটিস",
    description:
      "নোট নেওয়ার সুবিধা, রিভিও টাইম এবং সেকশন টাইমারসহ আসল পরীক্ষার উপযোগী অডিও প্যাসেজ।",
    gradient: "from-blue-500/20 to-blue-600/5",
  },
  {
    icon: BookOpen,
    title: "রিডিং প্র্যাকটিস",
    description:
      "হাইলাইট টুল এবং স্প্লিট-স্ক্রিন লেআউটসহ একাডেমিক এবং জেনারেল ট্রেনিংসের প্যাসেজ।",
    gradient: "from-violet-500/20 to-violet-600/5",
  },
  {
    icon: PenLine,
    title: "রাইটিং মূল্যায়ন",
    description:
      "শব্দ সংখ্যা ট্র্যাকার, অটো-সেভ এবং এআই ব্যান্ড স্কোর ফিডব্যাকসহ রাইটিং টাস্ক ১ ও ২ এডিটর।",
    gradient: "from-amber-500/20 to-amber-600/5",
  },
  {
    icon: Mic,
    title: "স্পিকিং প্র্যাকটিস",
    description:
      "রেকর্ডিং, প্লেব্যাক এবং উচ্চারণ বিশ্লেষণের সুবিধাসহ সময়-নিয়ন্ত্রিত পার্টস প্র্যাকটিস।",
    gradient: "from-emerald-500/20 to-emerald-600/5",
  },
  {
    icon: Library,
    title: "ভোকেবুলারি ফ্ল্যাশকার্ডস",
    description:
      "স্পেসড রিপিটেশন এবং আইইএলটিএস হাই-ফ্রিকোয়েন্সি ওয়ার্ড লিস্টসহ বিষয়ভিত্তিক ফ্ল্যাশকার্ড ডেক।",
    gradient: "from-cyan-500/20 to-cyan-600/5",
  },
  {
    icon: Sparkles,
    title: "এআই ফিডব্যাক",
    description:
      "ব্যাকরণ, সুসংগতি, লেক্সিক্যাল রিসোর্স এবং উচ্চারণের জন্য তাত্ক্ষণিক এআই সংশোধন ও পরামর্শ।",
    gradient: "from-fuchsia-500/20 to-fuchsia-600/5",
  },
  {
    icon: BarChart3,
    title: "অ্যানালিটিক্স ড্যাশবোর্ড",
    description:
      "ব্যান্ড প্রোগ্রেস, দুর্বল দক্ষতা, স্টাডি স্ট্রিক এবং মক টেস্টের ফলাফল নিখুঁতভাবে ট্র্যাকিংয়ের সুবিধা।",
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
            eyebrow="প্ল্যাটফর্মের সুবিধাসমূহ"
            title="আইইএলটিএস সফলতার সম্পূর্ণ প্যাকেজ"
            description="আইইএলটিএস প্রস্তুতির একটি সম্পূর্ণ মাধ্যম — যেখানে পাবেন বাস্তব CBT প্র্যাকটিস থেকে শুরু করে AI-চালিত ফিডব্যাক ও বিশ্লেষণ।"
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
