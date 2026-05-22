"use client";

import { useEffect, useState } from "react";

export function useAnimatedCounter(
  end: number,
  duration = 2000,
  active = true,
  decimals = 0
) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;

    let start = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setValue(
        decimals > 0
          ? parseFloat(current.toFixed(decimals))
          : Math.floor(current)
      );
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [end, duration, active, decimals]);

  return value;
}
