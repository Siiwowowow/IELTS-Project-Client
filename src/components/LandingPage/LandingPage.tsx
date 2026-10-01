import { TrustStatsSection } from "./sections/TrustStatsSection";
import { SkillsSection } from "./sections/SkillsSection";
import { VocabularySection } from "./sections/VocabularySection";
import { DailyPracticeSection } from "./sections/DailyPracticeSection";
import { UniversitySection } from "./sections/UniversitySection";
import { HowItWorksSection } from "./sections/HowItWorksSection";
import { StudentResultsSection } from "./sections/StudentResultsSection";
import { FinalCtaSection } from "./sections/FinalCtaSection";
import { HeroSection } from "./sections/HeroSection";
import { TargetScoreSection } from "./sections/TargetScoreSection";
import { BandScoreCalculatorSection } from "./sections/BandScoreCalculatorSection";
import { LandingReveal } from "./LandingReveal";

export function LandingPage() {
  return (
    <div className="premium-landing min-h-screen bg-[#f8f3e9] text-slate-900 antialiased font-jakarta">
      <LandingReveal>
        <HeroSection/>
        <TrustStatsSection />
        <SkillsSection />
        <VocabularySection />
        <TargetScoreSection />
        <BandScoreCalculatorSection />
        <DailyPracticeSection />
        <HowItWorksSection />
        <UniversitySection />
        <StudentResultsSection />
        <FinalCtaSection />
      </LandingReveal>
    </div>
  );
}
