"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // When pathname or searchParams change, complete the progress bar if it was active
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const hideTimer = setTimeout(() => {
      setProgress(100);
      timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 250);
    }, 50);

    return () => {
      clearTimeout(hideTimer);
      if (timer) clearTimeout(timer);
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    // Intercept clicks on internal links to give instant tactile feedback
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external links, mailto, tel, anchor hashes, new tabs, modifier keys
      if (
        href.startsWith("http") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.target === "_blank" ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // If navigation is to the exact same page, don't trigger
      try {
        const url = new URL(href, window.location.origin);
        if (url.pathname === window.location.pathname && url.search === window.location.search) {
          return;
        }
      } catch {
        return;
      }

      // Start progress bar immediately
      setLoading(true);
      setProgress(30);

      setTimeout(() => {
        setProgress((prev) => (prev > 0 && prev < 85 ? prev + 35 : prev));
      }, 150);
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
    };
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-9999 h-0.75 pointer-events-none overflow-hidden bg-transparent"
    >
      <div
        className="h-full bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-600 transition-all duration-300 ease-out shadow-xs shadow-indigo-500/50"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
