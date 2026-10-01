"use client";

import { Loader2 } from "lucide-react";

export function ExamSubmissionOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] grid place-items-center bg-white px-6 text-slate-950"
      role="status"
      aria-live="assertive"
      aria-busy="true"
    >
      <div className="flex max-w-sm flex-col items-center text-center">
        <Loader2 className="size-11 animate-spin text-slate-900" strokeWidth={2} />
        <h2 className="mt-6 text-xl font-semibold tracking-tight">Submitting your test</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Your responses are being saved. Please do not close or refresh this page.
        </p>
      </div>
    </div>
  );
}
