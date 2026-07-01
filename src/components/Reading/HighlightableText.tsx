// src/components/Reading/HighlightableText.tsx
"use client";

import { parseBoldText } from "@/lib/utils";

interface HighlightableTextProps {
  /** Plain text to display and allow highlighting */
  text: string;
}

/**
 * Renders a block of plain text.
 * Highlighting is coordinated by the parent workspace's useTextHighlighter hook.
 */
export default function HighlightableText({ text }: HighlightableTextProps) {
  return (
    <div
      className="reading-passage inline-block"
      style={{ whiteSpace: "pre-wrap" }}
    >
      {parseBoldText(text)}
    </div>
  );
}
