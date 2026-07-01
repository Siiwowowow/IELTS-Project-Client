"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InView } from "../shared/InView";

export function FinalCTASection() {
  return (
    <section className="hp-section relative overflow-hidden py-20 sm:py-28">
      <div className="absolute inset-0 bg-gradient-to-br from-ielts-red via-red-700 to-neutral-900" />
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute size-2 rounded-full bg-white/20"
            style={{
              left: `${8 + i * 8}%`,
              top: `${15 + (i % 4) * 20}%`,
              animation: `hp-particle ${4 + (i % 3)}s ease-in-out ${i * 0.3}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <InView>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            আজই আপনার আইইএলটিএস সফলতার যাত্রা শুরু করুন
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-red-100">
            সবচেয়ে নির্ভরযোগ্য ও বাস্তবসম্মত কম্পিউটার-বেসড আইইএলটিএস প্র্যাকটিস প্ল্যাটফর্ম ব্যবহার করে নিজেকে পরীক্ষার জন্য শতভাগ প্রস্তুত করুন।
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="h-12 rounded-xl bg-white px-8 text-base font-semibold text-ielts-red hover:bg-red-50"
              asChild
            >
              <Link href="/mock-tests/full">
                ফ্রি মক টেস্ট দিন
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-xl border-white/40 bg-transparent px-8 text-base font-semibold text-white hover:bg-white/10"
              asChild
            >
              <Link href="/register">অ্যাকাউন্ট তৈরি করুন</Link>
            </Button>
          </div>
        </InView>
      </div>
    </section>
  );
}
