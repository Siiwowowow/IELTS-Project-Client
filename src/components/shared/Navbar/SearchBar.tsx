"use client";

import { useState, useRef } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { SearchBarProps } from "./types";

export default function SearchBar({
  placeholder = "Search practice, mock tests…",
  onSearch,
  compact = false,
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch?.(query.trim());
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex items-center gap-2 rounded-xl border bg-neutral-50/80 px-3 transition-all duration-200 dark:bg-neutral-900/50",
        compact ? "h-9 max-w-[200px]" : "h-10 w-full max-w-[240px]",
        focused
          ? "border-ielts-red/30 bg-white shadow-sm ring-2 ring-ielts-red/10 dark:bg-neutral-900"
          : "border-neutral-200/80 hover:border-neutral-300 dark:border-neutral-800",
        className
      )}
    >
      <Search
        className="size-4 shrink-0 text-neutral-400"
        strokeWidth={1.75}
        aria-hidden
      />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100"
        aria-label="Search platform"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="rounded-md p-0.5 text-neutral-400 transition-colors hover:text-neutral-600"
        >
          <X className="size-3.5" />
        </button>
      )}
    </form>
  );
}
