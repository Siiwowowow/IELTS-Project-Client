"use client";

import { cn } from "@/lib/utils";
import { useInView } from "../hooks/useInView";

type InViewProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export function InView({ children, className, delay = 0 }: InViewProps) {
  const { ref, visible } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn("hp-in-view", visible && "hp-visible", className)}
      {...(visible && delay > 0
        ? { style: { transitionDelay: `${delay}ms` } }
        : {})}
    >
      {children}
    </div>
  );
}
