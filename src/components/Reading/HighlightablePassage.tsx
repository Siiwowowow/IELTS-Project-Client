// src/components/Reading/HighlightablePassage.tsx
"use client";

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
  return (
    <div
      className="reading-passage"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
