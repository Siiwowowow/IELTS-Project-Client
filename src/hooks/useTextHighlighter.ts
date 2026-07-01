/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, RefObject } from "react";

export function useTextHighlighter(containerRef: RefObject<HTMLElement | null>, dependencies: any[] = []) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create the floating tooltip button dynamically
    const tooltip = document.createElement("button");
    tooltip.type = "button";
    tooltip.className = "fixed z-[9999] hidden items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white text-[11px] font-black rounded-full shadow-lg border border-neutral-700 hover:bg-red-600 transition-all active:scale-95 duration-150";
    
    tooltip.style.display = "none";
    tooltip.style.position = "fixed";
    tooltip.style.pointerEvents = "auto";
    tooltip.style.cursor = "pointer";
    tooltip.innerHTML = `
      <span style="background-color: #fdff32; width: 8px; height: 8px; border-radius: 99px; display: inline-block; border: 1px solid #eab308; shrink: 0;"></span>
      <span>Highlight</span>
    `;
    
    document.body.appendChild(tooltip);

    let activeRange: Range | null = null;

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button !== 0) return;
      // Small timeout to allow the browser to update selection
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          hideTooltip();
          return;
        }

        // Ensure selection anchor is inside this container
        if (!container.contains(sel.anchorNode)) {
          hideTooltip();
          return;
        }

        // Don't show tooltip inside inputs, buttons, textareas, etc.
        let node: Node | null = sel.anchorNode;
        while (node && node !== container) {
          if (
            node.nodeName === "INPUT" ||
            node.nodeName === "TEXTAREA" ||
            node.nodeName === "BUTTON" ||
            node.nodeName === "SELECT" ||
            (node as HTMLElement).contentEditable === "true"
          ) {
            hideTooltip();
            return;
          }
          node = node.parentNode;
        }

        const range = sel.getRangeAt(0);
        activeRange = range.cloneRange();

        const rects = range.getClientRects();
        if (rects.length > 0) {
          // Calculate tooltip position (centered above selection)
          const rect = rects[0];
          const tooltipWidth = 90; // approximate width
          const tooltipHeight = 36; // height + offset
          
          let top = rect.top - tooltipHeight;
          let left = rect.left + rect.width / 2 - tooltipWidth / 2;

          // Constraints check
          if (top < 10) top = rect.bottom + 10;
          if (left < 10) left = 10;
          if (left + tooltipWidth > window.innerWidth - 10) {
            left = window.innerWidth - tooltipWidth - 10;
          }

          tooltip.style.top = `${top}px`;
          tooltip.style.left = `${left}px`;
          tooltip.style.display = "inline-flex";
        }
      }, 50);
    };

    const handleTooltipClick = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (!activeRange) return;
      const span = document.createElement("span");
      span.className = "highlighted text-black cursor-pointer rounded-sm px-0.5 select-all";
      span.style.backgroundColor = "#fdff32";
      span.style.color = "#000000";
      span.style.cursor = "pointer";

      // Restore selection to allow surroundContents
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(activeRange);
      }

      try {
        activeRange.surroundContents(span);
      } catch {
        const fragment = activeRange.cloneContents();
        span.appendChild(fragment);
        activeRange.deleteContents();
        activeRange.insertNode(span);
      }

      if (sel) {
        sel.removeAllRanges();
      }
      hideTooltip();
    };

    const hideTooltip = () => {
      tooltip.style.display = "none";
      activeRange = null;
    };

    const handleDocumentMouseDown = (e: MouseEvent) => {
      // Hide tooltip if clicking outside selection/tooltip
      if (e.target !== tooltip && !tooltip.contains(e.target as Node)) {
        hideTooltip();
      }
    };

    const handleContainerClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("highlighted")) {
        // Remove highlight by replacing the span with its text content
        const parent = target.parentNode as Node;
        const textNode = document.createTextNode(target.textContent || "");
        parent.replaceChild(textNode, target);

        const range = document.createRange();
        range.setStartAfter(textNode);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
        hideTooltip();
      }
    };

    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("click", handleContainerClick);
    document.addEventListener("mousedown", handleDocumentMouseDown);
    tooltip.addEventListener("click", handleTooltipClick);

    return () => {
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("click", handleContainerClick);
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      tooltip.removeEventListener("click", handleTooltipClick);
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    };
  // eslint-disable-next-line react-hooks/refs
  }, [containerRef, containerRef.current, ...dependencies]);
}
