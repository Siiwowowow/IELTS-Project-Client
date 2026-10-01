"use client";

import { useState } from "react";
import {
  IconMinus,
  IconPhoto,
  IconPlus,
  IconRefresh,
} from "@tabler/icons-react";

interface ExamImageViewerProps {
  src: string;
  alt?: string;
  embedded?: boolean;
}

export function ExamImageViewer({ src, alt = "Writing task visual information", embedded = false }: ExamImageViewerProps) {
  const [zoom, setZoom] = useState(1);

  const zoomBy = (amount: number) => setZoom((current) => Math.min(2, Math.max(0.6, current + amount)));

  return (
    <div className={`flex flex-col overflow-hidden bg-white ${embedded ? "mt-4" : "rounded-lg border border-slate-200"}`}>
      <div className={`flex h-10 shrink-0 items-center gap-1 px-2 ${embedded ? "bg-white" : "border-b border-slate-200 bg-slate-50"}`}>
        <span className="flex items-center gap-1.5 px-2 text-xs font-bold text-slate-600">
          <IconPhoto size={15} /> Task image
        </span>
        <span className="mx-1 h-5 w-px bg-slate-300" />
        <button type="button" onClick={() => zoomBy(-0.2)} className="rounded p-1.5 text-slate-600 hover:bg-white" aria-label="Zoom out"><IconMinus size={18} /></button>
        <span className="w-12 text-center text-[11px] font-bold tabular-nums text-slate-500">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => zoomBy(0.2)} className="rounded p-1.5 text-slate-600 hover:bg-white" aria-label="Zoom in"><IconPlus size={18} /></button>
        <button type="button" onClick={() => setZoom(1)} className="rounded p-1.5 text-slate-600 hover:bg-white" aria-label="Reset zoom" title="Reset zoom"><IconRefresh size={17} /></button>
      </div>
      <div className={`overflow-x-auto overflow-y-visible ${embedded ? "bg-white" : "bg-slate-100/70"}`}>
        <div className="flex min-w-full items-start justify-center p-4">
          {/* Dynamic exam assets can come from teacher-configured storage hosts. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            draggable={false}
            className={`block max-w-none select-none bg-white ${embedded ? "shadow-none" : "shadow-sm"}`}
            style={{ width: `${zoom * 100}%`, minWidth: zoom > 1 ? `${zoom * 100}%` : undefined }}
          />
        </div>
      </div>
    </div>
  );
}
