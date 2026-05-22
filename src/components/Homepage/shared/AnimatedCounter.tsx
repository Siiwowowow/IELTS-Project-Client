"use client";

import { useInView } from "../hooks/useInView";
import { useAnimatedCounter } from "../hooks/useAnimatedCounter";

type AnimatedCounterProps = {
  end: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
};

export function AnimatedCounter({
  end,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 2000,
  className,
}: AnimatedCounterProps) {
  const { ref, visible } = useInView<HTMLSpanElement>();
  const value = useAnimatedCounter(end, duration, visible, decimals);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {decimals > 0
        ? value.toFixed(decimals)
        : value.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}
