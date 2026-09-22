// src/components/Reading/HighlightablePassage.tsx
"use client";

import { formatPassageText } from "@/lib/utils";

interface HighlightablePassageProps {
  /**
   * HTML string containing the passage content.
   */
  html: string;
}

/**
 * Component that renders a passage.
 * Highlighting is coordinated by the parent workspace's useTextHighlighter hook.
 */
export default function HighlightablePassage({ html }: HighlightablePassageProps) {
  const formattedHtml = formatPassageText(html);
  return (
    <div
      className="reading-passage"
      dangerouslySetInnerHTML={{ __html: formattedHtml }}
    />
  );
}
