"use client";

import { useEffect, useRef } from "react";

export function LandingReveal({ children }: { children: React.ReactNode }) {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const sections = Array.from(main.querySelectorAll<HTMLElement>(":scope > section"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    main.classList.add("premium-motion-ready");

    sections.forEach((section, index) => {
      section.classList.add("premium-reveal");
      section.style.setProperty("--reveal-delay", `${(index % 3) * 55}ms`);
    });

    if (reducedMotion || !("IntersectionObserver" in window)) {
      sections.forEach((section) => section.classList.add("premium-reveal-visible"));
      return;
    }

    sections[0]?.classList.add("premium-reveal-visible");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("premium-reveal-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    sections.slice(1).forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return <main ref={mainRef}>{children}</main>;
}
