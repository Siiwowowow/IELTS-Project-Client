import { HeroSection } from "./sections/HeroSection";
import { TrustStatsSection } from "./sections/TrustStatsSection";
import { FeatureCarouselSection } from "./sections/FeatureCarouselSection";
import { CBTExperienceSection } from "./sections/CBTExperienceSection";
import { PracticeModulesSection } from "./sections/PracticeModulesSection";
import { AnalyticsPreviewSection } from "./sections/AnalyticsPreviewSection";
import { AIFeedbackSection } from "./sections/AIFeedbackSection";
import { TestimonialsSection } from "./sections/TestimonialsSection";
import { PricingSection } from "./sections/PricingSection";
import { FAQSection } from "./sections/FAQSection";
import { FinalCTASection } from "./sections/FinalCTASection";
import { FooterSection } from "./sections/FooterSection";
import { FloatingSupportButton } from "./FloatingSupportButton";
import { MobileStickyCTA } from "./MobileStickyCTA";

export function Homepage() {
  return (
    <div className="homepage pb-20 font-[family-name:var(--font-inter)] antialiased sm:pb-0">
      <HeroSection />
      <TrustStatsSection />
      <FeatureCarouselSection />
      <CBTExperienceSection />
      <PracticeModulesSection />
      <AnalyticsPreviewSection />
      <AIFeedbackSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
      <FooterSection />
      <FloatingSupportButton />
      <MobileStickyCTA />
    </div>
  );
}
