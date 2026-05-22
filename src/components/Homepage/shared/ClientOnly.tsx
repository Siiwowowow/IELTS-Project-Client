"use client";

import { useEffect, useState } from "react";

type ClientOnlyProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

/** Renders children only after mount — avoids SSR/client DOM mismatches (e.g. Recharts). */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
