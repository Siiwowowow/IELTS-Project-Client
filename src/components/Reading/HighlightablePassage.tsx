// src/components/Reading/HighlightablePassage.tsx
"use client";

import { useEffect, useRef } from "react";

interface HighlightablePassageProps {
  /**
   * HTML string containing the passage content.
   * It is rendered using `dangerouslySetInnerHTML` because the API returns pre‑formatted HTML.
   */
  html: string;
}

/**
 * Component that renders a passage and enables the user to highlight any
 * selected text with a mouse click. Highlights are created by wrapping the
 * selected range in a `<span>` with the `highlighted` class. Clicking an
 * existing highlight removes it.
 */
export default function HighlightablePassage({ html }: HighlightablePassageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      // Ensure the selection is inside this passage container.
      if (!container.contains(sel.anchorNode)) return;
      const range = sel.getRangeAt(0);
      // Create the highlight wrapper.
      const span = document.createElement("span");
      span.className = "highlighted";
      // `surroundContents` throws if the range splits non‑text nodes (e.g., partial tags).
      // In that case we fall back to a safe approach: replace the range with a span that
      // contains the selected text.
      try {
        range.surroundContents(span);
      } catch {
        const fragment = range.cloneContents();
        span.appendChild(fragment);
        range.deleteContents();
        range.insertNode(span);
      }
      // Clear the selection so the UI does not stay highlighted.
      sel.removeAllRanges();
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("highlighted")) {
        // Remove the highlight by replacing the span with its text content.
        const parent = target.parentNode as Node;
        const textNode = document.createTextNode(target.textContent || "");
        parent.replaceChild(textNode, target);
        // Move the caret out of the replaced node to avoid weird selection artifacts.
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
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Global CSS for highlight styling. If you use a CSS‑in‑JS solution or a
 * dedicated stylesheet, move this rule there.
 */
/*
.highlighted {
  background-color: rgba(255, 235, 0, 0.4);
  cursor: pointer;
}
*/
