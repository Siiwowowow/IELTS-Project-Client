"use client";

import { Award, Briefcase, GraduationCap, Globe, ArrowRight } from "lucide-react";
import { InView } from "../shared/InView";
import { SectionHeader } from "../shared/SectionHeader";
import Link from "next/link";

const importanceCards = [
  {
    icon: GraduationCap,
    title: "উচ্চশিক্ষা ও স্কলারশিপ",
    description: "যুক্তরাজ্য, যুক্তরাষ্ট্র, কানাডাসহ বিশ্বের ১০,০০০-এরও বেশি শীর্ষ বিশ্ববিদ্যালয়ে ভর্তির প্রধান যোগ্যতা এবং আন্তর্জাতিক স্কলারশিপ পাওয়ার অনন্য সুযোগ।",
    gradient: "from-red-500/20 to-red-600/5",
    badge: "উচ্চশিক্ষা",
  },
  {
    icon: Briefcase,
    title: "গ্লোবাল ক্যারিয়ার ও প্রমোশন",
    description: "বহুজাতিক প্রতিষ্ঠানে চাকরি এবং আন্তর্জাতিক কর্পোরেট সেক্টরে আকর্ষণীয় পদে কাজের সুযোগ সৃষ্টি করে। ইংরেজি দক্ষতার বিশ্বস্ত সনদ আপনার সিভিকে করবে অনন্য।",
    gradient: "from-red-600/10 to-neutral-100",
    badge: "ক্যারিয়ার",
  },
  {
    icon: Globe,
    title: "ইমিগ্রেশন ও স্থায়ীভাবে বসবাস",
    description: "কানাডা, অস্ট্রেলিয়া, যুক্তরাজ্য বা নিউজিল্যান্ডের মতো উন্নত দেশগুলোতে স্থায়ী নাগরিকত্ব (PR) বা কাজের ভিসা পাওয়ার জন্য আইইএলটিএস স্কোর বাধ্যতামূলক ও নির্ভরযোগ্য প্রমাণ।",
    gradient: "from-neutral-500/10 to-red-500/5",
    badge: "ভিসা ও পিআর",
  },
  {
    icon: Award,
    title: "সাবলীল যোগাযোগের আত্মবিশ্বাস",
    description: "বাস্তব জীবনের ৪টি দক্ষতা—লিসেনিং, রিডিং, রাইটিং এবং স্পিকিং উন্নত করার মাধ্যমে যেকোনো আন্তর্জাতিক পরিবেশে ইংরেজিতে যোগাযোগের ভয় দূর করে।",
    gradient: "from-red-500/15 to-neutral-500/5",
    badge: "দক্ষতা উন্নয়ন",
  },
];

export function IeltsImportanceSection() {
  return (
    <section id="importance" className="hp-section relative overflow-hidden bg-white py-20 sm:py-28">
      {/* Decorative Background Elements */}
      <div className="pointer-events-none absolute -top-40 -right-40 size-96 rounded-full bg-red-50/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 size-96 rounded-full bg-red-50/30 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <InView>
          <SectionHeader
            eyebrow="আইইএলটিএস কেন প্রয়োজন?"
            title="আপনার স্বপ্নের লক্ষ্যে পৌঁছাতে আইইএলটিএস-এর ভূমিকা"
            description="বিশ্বজুড়ে নিজের ক্যারিয়ার ও শিক্ষাজীবনকে অনন্য উচ্চতায় নিয়ে যেতে আইইএলটিএস হলো সফলতার প্রথম চাবিকাঠি।"
          />
        </InView>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {importanceCards.map((card, i) => (
            <InView key={card.title} delay={i * 80}>
              <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-red-500/20 hover:shadow-xl hover:shadow-red-500/5">
                
                {/* Background Card Hover Accent */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-b from-red-50/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                
                <div>
                  <div className="flex items-center justify-between">
                    {/* Premium Icon Container */}
                    <div className="flex size-12 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-all duration-500 group-hover:bg-red-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                      <card.icon className="size-6" />
                    </div>
                    {/* Tag Badge */}
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600 transition-all duration-300 group-hover:bg-red-50 group-hover:text-red-700">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="mt-6 text-xl font-bold text-neutral-900 transition-colors duration-300 group-hover:text-red-600">
                    {card.title}
                  </h3>
                  
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                    {card.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-neutral-50 flex items-center justify-between text-xs text-neutral-400 group-hover:text-neutral-600 transition-colors">
                  <span className="font-semibold text-red-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                    বিস্তারিত জানুন
                    <ArrowRight className="size-3" />
                  </span>
                  <span>ধাপ {i + 1}</span>
                </div>

                {/* Decorative Bottom Bar */}
                <div className="absolute inset-x-0 bottom-0 h-1 scale-x-0 bg-red-600 transition-transform duration-500 group-hover:scale-x-100" />
              </div>
            </InView>
          ))}
        </div>

        {/* Dynamic CTA box inside Section */}
        <InView delay={300}>
          <div className="relative mt-16 overflow-hidden rounded-3xl border border-red-100 bg-red-50/30 p-8 sm:p-12">
            <div className="absolute -right-16 -top-16 size-48 rounded-full bg-red-100/30 blur-2xl" />
            <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="text-center md:text-left">
                <h4 className="text-2xl font-bold text-neutral-900">আজই আপনার স্বপ্ন পূরণ করতে প্রস্তুত হোন</h4>
                <p className="mt-2 text-sm text-neutral-600 max-w-xl">
                  আমাদের সঠিক প্র্যাকটিস মডিউল এবং রিয়েল কম্পিউটার-বেসড পরীক্ষা সিস্টেমের সাহায্যে নিজের কাঙ্ক্ষিত ব্যান্ড স্কোর অর্জন করুন।
                </p>
              </div>
              <Link
                href="/mock-tests/full"
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-red-600 px-8 font-semibold text-white transition-all duration-300 hover:bg-red-700 hover:scale-[1.02] shadow-lg shadow-red-500/20 active:scale-[0.98]"
              >
                ফ্রি মক টেস্ট শুরু করুন
              </Link>
            </div>
          </div>
        </InView>
      </div>
    </section>
  );
}
