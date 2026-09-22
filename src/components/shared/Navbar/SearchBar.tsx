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
        "flex items-center gap-2 rounded-full border transition-all duration-200",
        compact ? "h-9 w-44 xl:w-52 px-3" : "h-9.5 w-full max-w-60 px-3.5",
        focused
          ? "border-neutral-400 bg-white shadow-xs ring-2 ring-neutral-900/5"
          : "border-neutral-200/80 bg-neutral-50/80 hover:bg-neutral-100/60 hover:border-neutral-300",
        className
      )}
    >
      <Search
        className={cn(
          "size-3.5 shrink-0 transition-colors",
          focused ? "text-neutral-900" : "text-neutral-400"
        )}
        strokeWidth={2}
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
        className="min-w-0 flex-1 bg-transparent text-xs text-neutral-900 placeholder:text-neutral-400 outline-none"
        aria-label="Search platform"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="rounded-full p-0.5 text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          <X className="size-3" />
        </button>
      )}
    </form>
  );
}
