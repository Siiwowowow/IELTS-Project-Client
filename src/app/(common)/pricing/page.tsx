"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/shared/Footer";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free Plan",
    monthly: 0,
    yearly: 0,
    description: "Start your preparation with essential IELTS practice tools.",
    features: [
      "3 Full Mock Tests per month",
      "Access to basic practice modules",
      "Limited AI feedback & evaluation",
      "Community support forum access",
    ],
    cta: "Start for Free",
    href: "/register",
    popular: false,
  },
  {
    name: "Premium Plan",
    monthly: 19,
    yearly: 15,
    description: "Perfect package for serious, comprehensive computer-based preparation.",
    features: [
      "Unlimited full mock tests",
      "Full access to all practice modules",
      "Uncapped AI Writing & Speaking feedback",
      "Advanced analytics dashboard",
      "Interactive vocabulary & grammar tools",
      "24/7 dedicated email support",
    ],
    cta: "Go Premium",
    href: "/register?plan=premium",
    popular: true,
  },
  {
    name: "Pro Mentor Plan",
    monthly: 39,
    yearly: 32,
    description: "Ultimate preparation with expert human mentoring & priority processing.",
    features: [
      "Everything in Premium plan",
      "1-on-1 live speaking mock reviews",
      "Personalized weekly study planner",
      "Priority AI processing queue",
      "Downloadable progress certificates",
      "Priority live chat support",
    ],
    cta: "Get Pro",
    href: "/register?plan=pro",
    popular: false,
  },
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50">
      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-block bg-red-50 text-red-600 text-xs font-black uppercase px-3 py-1 rounded-full mb-3 border border-red-100">
              Plans & Pricing
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-neutral-900 tracking-tight">
              Choose the Perfect Plan for Your Journey
            </h1>
            <p className="mt-4 text-neutral-600 text-base sm:text-lg">
              Start for free, upgrade when you need to. Simple, transparent pricing tailored to help you hit your target band score.
            </p>

            <div className="mt-8 flex items-center justify-center gap-3">
              <span
                className={cn(
                  "text-sm font-semibold transition-colors duration-200",
                  !yearly ? "text-neutral-900" : "text-neutral-400"
                )}
              >
                Monthly
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={yearly}
                onClick={() => setYearly(!yearly)}
                className={cn(
                  "relative h-8 w-14 rounded-full transition-colors cursor-pointer border border-transparent shadow-inner focus:outline-hidden",
                  yearly ? "bg-red-600" : "bg-neutral-200"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-md transition-transform duration-200 ease-out",
                    yearly && "translate-x-6"
                  )}
                />
              </button>
              <span
                className={cn(
                  "text-sm font-semibold transition-colors duration-200",
                  yearly ? "text-neutral-900" : "text-neutral-400"
                )}
              >
                Annually
              </span>
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-600 border border-red-200">
                Save 20%
              </span>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 items-stretch max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl",
                  plan.popular
                    ? "border-red-600/30 shadow-lg shadow-red-500/5 ring-2 ring-red-600/10"
                    : "border-neutral-200/80"
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-red-600 px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                    <Sparkles className="size-3" />
                    Most Popular
                  </span>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-neutral-900">{plan.name}</h3>
                  <p className="mt-2 text-sm text-neutral-500 min-h-[40px]">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1 py-4 border-y border-neutral-100">
                  <span className="text-4xl font-extrabold text-neutral-900">
                    ${yearly ? plan.yearly : plan.monthly}
                  </span>
                  <span className="text-sm font-medium text-neutral-400">
                    {plan.monthly === 0 ? "/ forever" : yearly ? "/ month (billed annually)" : "/ month"}
                  </span>
                </div>

                <ul className="mt-8 flex-1 space-y-4">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 text-sm text-neutral-600"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 border border-red-100/50 mt-0.5">
                        <Check className="size-3 stroke-3" />
                      </span>
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    "mt-8 h-12 w-full rounded-xl font-extrabold text-sm transition-transform active:scale-98 shadow-sm cursor-pointer",
                    plan.popular
                      ? "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20"
                      : "bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 hover:text-neutral-900"
                  )}
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
