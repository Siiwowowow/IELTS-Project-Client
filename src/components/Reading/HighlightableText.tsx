// src/components/Reading/HighlightableText.tsx
"use client";

import { parseBoldText } from "@/lib/utils";

interface HighlightableTextProps {
  /** Plain text to display and allow highlighting */
  text: string;
  className?: string;
}

/**
 * Renders a block of plain text.
 * Highlighting is coordinated by the parent workspace's useTextHighlighter hook.
 */
export default function HighlightableText({ text, className = "" }: HighlightableTextProps) {
  return (
    <div
      className={`reading-question-text text-[15px] md:text-base font-medium text-gray-900 leading-relaxed inline-block ${className}`}
    >
      {parseBoldText(text)}
    </div>
  );
}
