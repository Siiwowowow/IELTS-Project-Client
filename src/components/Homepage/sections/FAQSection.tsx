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
    q: "How close is the practice environment to the real IELTS CBT?",
    a: "Our interface replicates the official computer-based test layout — including section timers, question navigator, split-screen reading, and writing editor. Students report feeling fully prepared on exam day.",
  },
  {
    q: "Does the platform cover Academic and General Training?",
    a: "Yes. You can switch between Academic and General Training modules for Reading and Writing, with dedicated mock tests for each format.",
  },
  {
    q: "How does AI writing and speaking feedback work?",
    a: "Our AI evaluates responses against official IELTS band descriptors — Task Achievement, Coherence, Lexical Resource, Grammar, and Pronunciation — providing estimated band scores and actionable suggestions.",
  },
  {
    q: "Can I take full mock tests under real time limits?",
    a: "Premium and Pro plans include unlimited full mock tests (2 hours 45 minutes) with authentic section timing, auto-scoring for Listening and Reading, and AI evaluation for Writing and Speaking.",
  },
  {
    q: "Is my progress synced across devices?",
    a: "Yes. Your study history, analytics, vocabulary decks, and mock test results sync securely across web and mobile when you sign in.",
  },
  {
    q: "What band improvement can I expect?",
    a: "Results vary by starting level and study consistency. Our average active user reports +1.2 band improvement over 8–12 weeks of structured practice with mock tests and AI feedback.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="hp-section bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <InView>
          <SectionHeader
            eyebrow="FAQ"
            title="Frequently Asked Questions"
            description="Everything you need to know before starting your preparation."
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
