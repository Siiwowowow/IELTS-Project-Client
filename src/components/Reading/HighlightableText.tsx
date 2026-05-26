// src/components/Reading/HighlightableText.tsx
"use client";

import { useEffect, useRef } from "react";

interface HighlightableTextProps {
  /** Plain text to display and allow highlighting */
  text: string;
}

/**
 * Renders a block of plain text where users can select any portion with the mouse.
 * Selected text is wrapped in a <span class="highlighted"> element.
 * Clicking an existing highlight removes it.
 */
export default function HighlightableText({ text }: HighlightableTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      if (!container.contains(sel.anchorNode)) return;
      const range = sel.getRangeAt(0);
      const span = document.createElement("span");
      span.className = "highlighted";
      try {
        range.surroundContents(span);
      } catch {
        // Fallback for partial node selections
        const fragment = range.cloneContents();
        span.appendChild(fragment);
        range.deleteContents();
        range.insertNode(span);
      }
      sel.removeAllRanges();
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("highlighted")) {
        const parent = target.parentNode as Node;
        const textNode = document.createTextNode(target.textContent || "");
        parent.replaceChild(textNode, target);
        // Move caret after the replaced node
        const range = document.createRange();
        range.setStartAfter(textNode);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    };

    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("click", handleClick);

    return () => {
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="reading-passage"
      // Render plain text safely; preserve line breaks
      style={{ whiteSpace: "pre-wrap" }}
    >
      {text}
    </div>
  );
}
