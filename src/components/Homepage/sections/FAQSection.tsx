"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { InView } from "../shared/InView";
import { SectionHeader } from "../shared/SectionHeader";

const faqs = [
  {
    q: "আমাদের প্র্যাকটিস প্ল্যাটফর্মটি আসল IELTS CBT পরীক্ষার কতটা কাছাকাছি?",
    a: "আমাদের ইন্টারফেসটি অফিশিয়াল কম্পিউটার-বেসড টেস্ট লেআউটকে হুবহু অনুকরণ করে — যার মধ্যে সেকশন টাইমার, কোশ্চেন নেভিগেটর, স্প্লিট-স্ক্রিন রিডিং এবং রাইটিং এডিটর অন্তর্ভুক্ত রয়েছে। শিক্ষার্থীরা পরীক্ষার দিন সম্পূর্ণ আত্মবিশ্বাসী বোধ করেন।",
  },
  {
    q: "প্ল্যাটফর্মটি কি একাডেমিক এবং জেনারেল ট্রেনিং উভয় কভার করে?",
    a: "হ্যাঁ। আপনি রিডিং এবং রাইটিংয়ের জন্য একাডেমিক এবং জেনারেল ট্রেনিং মডিউলের মধ্যে যেকোনো সময় পরিবর্তন করতে পারেন, প্রতিটি ফরম্যাটের জন্য ডেডিকেটেড মক টেস্ট রয়েছে।",
  },
  {
    q: "রাইটিং এবং স্পিকিংয়ে এআই (AI) ফিডব্যাক কীভাবে কাজ করে?",
    a: "আমাদের এআই অফিশিয়াল আইইএলটিএস ব্যান্ড ডিসক্রিপ্টরের উপর ভিত্তি করে আপনার উত্তর মূল্যায়ন করে — যেমন টাস্ক অ্যাচিভমেন্ট, কোহেরেন্স, লেক্সিক্যাল রিসোর্স, গ্রামার এবং সঠিক উচ্চারণ — সাথে আনুমানিক ব্যান্ড স্কোর এবং সুনির্দিষ্ট সংশোধনের পরামর্শ দেয়।",
  },
  {
    q: "আমি কি নির্দিষ্ট সময়ের অধীনে সম্পূর্ণ মক টেস্ট দিতে পারব?",
    a: "প্রিমিয়াম এবং প্রো প্ল্যানে আনলিমিটেড ফুল মক টেস্ট (২ ঘণ্টা ৪৫ মিনিট) অন্তর্ভুক্ত রয়েছে। এতে লিসেনিং ও রিডিংয়ের জন্য অটো-স্কোরিং এবং রাইটিং ও স্পিকিংয়ের জন্য এআই মূল্যায়ন অন্তর্ভুক্ত।",
  },
  {
    q: "আমার অগ্রগতি বা প্রোগ্রেস কি বিভিন্ন ডিভাইসে সিঙ্ক হবে?",
    a: "হ্যাঁ। আপনার অ্যাকাউন্ট লগইন থাকলে আপনার স্টাডি হিস্ট্রি, অ্যানালিটিক্স, ভোকেবুলারি ডেক্স এবং মক টেস্টের ফলাফল ওয়েব ও মোবাইল ডিভাইসে সুরক্ষিতভাবে সিঙ্ক হয়ে যাবে।",
  },
  {
    q: "আমি কি ধরনের ব্যান্ড স্কোর উন্নতির আশা করতে পারি?",
    a: "ফলাফল সাধারণত আপনার বর্তমান স্তর এবং অনুশীলনের ধারাবাহিকতার উপর নির্ভর করে। মক টেস্ট এবং এআই ফিডব্যাকসহ ৮-১২ সপ্তাহের নিয়মিত অনুশীলনের মাধ্যমে আমাদের সক্রিয় ব্যবহারকারীরা গড়ে +১.২ ব্যান্ড স্কোর উন্নত করেছেন।",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="hp-section bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <InView>
          <SectionHeader
            eyebrow="সাধারণ জিজ্ঞাসা"
            title="সচরাচর জিজ্ঞাসিত প্রশ্নাবলী"
            description="আপনার প্রস্তুতি শুরু করার আগে আপনার যা কিছু জানা দরকার।"
          />
        </InView>

        <InView delay={100} className="mt-12">
          <Accordion
            type="single"
            collapsible
            className="divide-y divide-neutral-100 rounded-2xl border border-neutral-100 bg-neutral-50/30 px-2"
          >
            {faqs.map((faq, i) => (
              <AccordionItem
                key={faq.q}
                value={`item-${i}`}
                className="border-neutral-100 px-4"
              >
                <AccordionTrigger className="py-5 text-left text-base font-semibold text-neutral-900 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-neutral-600 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </InView>
      </div>
    </section>
  );
}
