import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseBoldText(text: string): React.ReactNode[] {
  if (!text) return [];
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return React.createElement(
        'strong',
        { key: index, className: 'font-extrabold text-black' },
        part.slice(2, -2)
      );
    }
    return part;
  });
}

export function getOptionLabel(opt: string): string {
  if (!opt) return "";
  // Extract Roman numerals (i, ii, iii, iv, v, vi, vii, viii, ix, x) or letters (A, B, C...) at the start
  const match = opt.trim().match(/^([ivxldcba0-9]+|[A-Z])(\s+|\.|\))/i);
  if (match) {
    return match[1].toUpperCase(); // Return the Roman numeral / letter prefix
  }
  return opt; // Fallback to full option text
}
