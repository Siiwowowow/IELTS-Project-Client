"use client";

import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import Link from "next/link";

export default function TopBar() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="relative flex items-center justify-center bg-ielts-red px-4 py-2 text-xs text-white sm:text-sm">
      <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-center pr-10">
        <Sparkles className="hidden size-3.5 sm:inline sm:mr-0.5" aria-hidden />
        <span>New computer-delivered mock tests — start your free trial.</span>
        <Link
          href="/register"
          className="font-semibold underline underline-offset-2 transition-colors hover:text-white/90"
        >
          Get started
        </Link>
      </p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
