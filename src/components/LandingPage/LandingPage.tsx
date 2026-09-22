"use client";

import React from "react";
import { TrustStatsSection } from "./sections/TrustStatsSection";
import { SkillsSection } from "./sections/SkillsSection";
import { VocabularySection } from "./sections/VocabularySection";
import { DailyPracticeSection } from "./sections/DailyPracticeSection";
import { UniversitySection } from "./sections/UniversitySection";
import { HowItWorksSection } from "./sections/HowItWorksSection";
import { StudentResultsSection } from "./sections/StudentResultsSection";
import { FinalCtaSection } from "./sections/FinalCtaSection";
import { FooterSection } from "./sections/FooterSection";
import { HeroSection } from "./sections/HeroSection";
import { TargetScoreSection } from "./sections/TargetScoreSection";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8f3e9] text-slate-900 antialiased font-jakarta">
      {/* Main Sections */}
      <main>
        <HeroSection/>
        <TrustStatsSection />
        <SkillsSection />
        <VocabularySection />
        <TargetScoreSection />
        <DailyPracticeSection />
        <HowItWorksSection />
        <UniversitySection />
        <StudentResultsSection />
        <FinalCtaSection />
      </main>

      {/* Footer */}
      <FooterSection />
    </div>
  );
};
