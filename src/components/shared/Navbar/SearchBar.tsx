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
        "flex items-center gap-2 rounded-xl border px-3 transition-all duration-200",
        compact ? "h-9 max-w-[200px]" : "h-10 w-full max-w-[240px]",
        focused
          ? "border-white bg-white shadow-sm ring-2 ring-white/20"
          : "border-white/30 bg-white/10 hover:border-white/50",
        className
      )}
    >
      <Search
        className={cn("size-4 shrink-0", focused ? "text-red-600" : "text-red-200")}
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
        className={cn(
          "min-w-0 flex-1 bg-transparent text-sm outline-none transition-colors",
          focused ? "text-neutral-900 placeholder:text-neutral-400" : "text-white placeholder:text-red-200"
        )}
        aria-label="Search platform"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className={cn("rounded-md p-0.5 transition-colors", focused ? "text-neutral-400 hover:text-neutral-600" : "text-red-200 hover:text-white")}
        >
          <X className="size-3.5" />
        </button>
      )}
    </form>
  );
}
