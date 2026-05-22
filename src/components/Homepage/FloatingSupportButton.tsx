"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function FloatingSupportButton() {
  return (
    <a
      href="#faq"
      aria-label="Get support"
      className={cn(
        "fixed bottom-20 right-4 z-40 flex size-12 items-center justify-center rounded-full bg-ielts-red text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl sm:bottom-6 sm:right-6 lg:bottom-8"
      )}
    >
      <MessageCircle className="size-5" />
    </a>
  );
}
