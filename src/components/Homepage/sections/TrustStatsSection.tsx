"use client";

import { Globe2, Users, ClipboardCheck, TrendingUp, Activity } from "lucide-react";
import { InView } from "../shared/InView";
import { AnimatedCounter } from "../shared/AnimatedCounter";

const stats = [
  {
    icon: Users,
    label: "নিবন্ধিত শিক্ষার্থী",
    end: 284000,
    suffix: "+",
    gradient: "from-red-500 to-red-600",
  },
  {
    icon: ClipboardCheck,
    label: "সম্পন্ন মক টেস্ট",
    end: 1200000,
    suffix: "+",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    icon: TrendingUp,
    label: "গড় ব্যান্ড স্কোর উন্নতি",
    end: 1.2,
    suffix: "",
    decimals: 1,
    prefix: "+",
    gradient: "from-emerald-500 to-emerald-600",
  },
  {
    icon: Globe2,
    label: "অংশগ্রহণকারী দেশ",
    end: 142,
    suffix: "",
    gradient: "from-violet-500 to-violet-600",
  },
  {
    icon: Activity,
    label: "প্রতিদিনের সক্রিয় শিক্ষার্থী",
    end: 18500,
    suffix: "+",
    gradient: "from-amber-500 to-orange-500",
  },
];

export function TrustStatsSection() {
  return (
    <section className="hp-section border-y border-neutral-100 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <InView>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="group rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-neutral-200 hover:shadow-lg"
              >
                <div
                  className={`mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-md`}
                >
                  <stat.icon className="size-5" />
                </div>
                <p className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                  <AnimatedCounter
                    end={stat.end}
                    suffix={stat.suffix}
                    prefix={stat.prefix ?? ""}
                    decimals={stat.decimals ?? 0}
                  />
                </p>
                <p className="mt-1 text-sm text-neutral-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </InView>
      </div>
    </section>
  );
}
