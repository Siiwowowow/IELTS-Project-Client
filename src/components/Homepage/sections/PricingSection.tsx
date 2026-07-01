"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InView } from "../shared/InView";
import { SectionHeader } from "../shared/SectionHeader";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "ফ্রি (Free)",
    monthly: 0,
    yearly: 0,
    description: "প্রয়োজনীয় প্র্যাকটিস টুলস দিয়ে এখনই আপনার প্রস্তুতি শুরু করুন।",
    features: [
      "প্রতি মাসে ৩টি মক টেস্ট",
      "বেসিক প্র্যাকটিস মডিউল",
      "সীমাবদ্ধ এআই ফিডব্যাক",
      "কমিউনিটি ফোরাম সাপোর্ট",
    ],
    cta: "ফ্রি শুরু করুন",
    href: "/register",
    popular: false,
  },
  {
    name: "প্রিমিয়াম (Premium)",
    monthly: 19,
    yearly: 15,
    description: "গুরুত্বসহকারে সম্পূর্ণ সিবিটি প্রস্তুতির জন্য পারফেক্ট প্যাকেজ।",
    features: [
      "আনলিমিটেড মক টেস্ট",
      "সকল প্র্যাকটিস মডিউল",
      "সম্পূর্ণ এআই রাইটিং ও স্পিকিং ফিডব্যাক",
      "অ্যানালিটিক্স ড্যাশবোর্ড",
      "ভোকেবুলারি ও গ্রামার টুলস",
      "ইমেইল সাপোর্ট",
    ],
    cta: "প্রিমিয়াম শুরু করুন",
    href: "/register?plan=premium",
    popular: true,
  },
  {
    name: "প্রো (Pro)",
    monthly: 39,
    yearly: 32,
    description: "অভিজ্ঞ মেন্টর ও এক্সপার্ট ফিচারের মাধ্যমে সর্বোচ্চ প্রস্তুতি।",
    features: [
      "প্রিমিয়ামের সবকিছু অন্তর্ভুক্ত",
      "১-অন-১ লাইভ স্পিকিং রিভিউ",
      "ব্যক্তিগত স্টাডি প্ল্যান",
      "অগ্রাধিকার ভিত্তিক এআই প্রসেসিং",
      "ডাউনলোডযোগ্য প্রোগ্রেস রিপোর্ট",
      "অগ্রাধিকার সাপোর্ট",
    ],
    cta: "প্রো শুরু করুন",
    href: "/register?plan=pro",
    popular: false,
  },
];

export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="hp-section bg-neutral-50/80 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <InView>
          <SectionHeader
            eyebrow="প্যাকেজ ও মূল্য"
            title="আপনার প্রস্তুতির প্রতিটি ধাপের জন্য উপযুক্ত প্যাকেজ"
            description="ফ্রি দিয়ে শুরু করুন, আপনার প্রয়োজন অনুযায়ী যেকোনো সময় আপগ্রেড করুন। যেকোনো সময় বাতিল করার সুবিধা।"
          />

          <div className="mt-10 flex items-center justify-center gap-3">
            <span
              className={cn(
                "text-sm font-medium",
                !yearly ? "text-neutral-900" : "text-neutral-400"
              )}
            >
              মাসিক
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={yearly}
              onClick={() => setYearly(!yearly)}
              className={cn(
                "relative h-8 w-14 rounded-full transition-colors",
                yearly ? "bg-ielts-red" : "bg-neutral-200"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 left-1 size-6 rounded-full bg-white shadow transition-transform",
                  yearly && "translate-x-6"
                )}
              />
            </button>
            <span
              className={cn(
                "text-sm font-medium",
                yearly ? "text-neutral-900" : "text-neutral-400"
              )}
            >
              বার্ষিক
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              ২০% ছাড়!
            </span>
          </div>
        </InView>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <InView key={plan.name} delay={i * 80}>
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                  plan.popular
                    ? "border-ielts-red/40 shadow-lg shadow-red-500/10 ring-1 ring-ielts-red/20"
                    : "border-neutral-100"
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-ielts-red px-3 py-1 text-xs font-semibold text-white">
                    <Sparkles className="size-3" />
                    সেরা পছন্দ
                  </span>
                )}
                <h3 className="text-xl font-bold text-neutral-900">{plan.name}</h3>
                <p className="mt-2 text-sm text-neutral-500">{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-neutral-900">
                    ${yearly ? plan.yearly : plan.monthly}
                  </span>
                  <span className="text-neutral-500">
                    {plan.monthly === 0 ? "" : "/মাস"}
                  </span>
                </div>
                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-neutral-600"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-ielts-red" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={cn(
                    "mt-8 h-11 w-full rounded-xl font-semibold",
                    plan.popular
                      ? "shadow-lg shadow-red-500/20"
                      : ""
                  )}
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </div>
            </InView>
          ))}
        </div>
      </div>
    </section>
  );
}
