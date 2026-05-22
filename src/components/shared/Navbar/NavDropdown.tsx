"use client";

import { useRef, useState, useEffect, useId } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { isActivePath } from "./utils";
import type { NavDropdownChild } from "./types";

interface Props {
  label: string;
  href: string;
  items: NavDropdownChild[];
}

export default function NavDropdown({ label, href, items }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const pathname = usePathname();
  const active =
    isActivePath(pathname, href) ||
    items.some((item) => isActivePath(pathname, item.href));

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((v) => !v);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id={`${menuId}-trigger`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        className={cn(
          "nav-link-item group flex items-center gap-1 px-3.5 py-2 text-[0.8125rem] font-medium tracking-tight transition-colors",
          active
            ? "text-ielts-red"
            : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        )}
      >
        <span className="relative">
          {label}
          <span
            className={cn(
              "absolute -bottom-1 left-0 h-0.5 rounded-full bg-ielts-red transition-all duration-300 ease-out",
              active ? "w-full" : "w-0 group-hover:w-full"
            )}
            aria-hidden
          />
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 opacity-60 transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-labelledby={`${menuId}-trigger`}
          className="nav-glass-dropdown absolute left-1/2 top-[calc(100%+0.5rem)] z-50 min-w-[280px] -translate-x-1/2 rounded-xl p-2 animate-in fade-in-0 zoom-in-95 duration-200"
        >
          <div className="mb-1 border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
            <Link
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold uppercase tracking-wider text-ielts-red hover:text-ielts-red-dark transition-colors"
            >
              View all {label}
            </Link>
          </div>
          <ul className="space-y-0.5">
            {items.map((item) => {
              const Icon = item.icon;
              const itemActive = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors",
                      itemActive
                        ? "bg-ielts-red-light text-ielts-red"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800/80"
                    )}
                  >
                    {Icon && (
                      <span
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                          itemActive
                            ? "bg-ielts-red/10 text-ielts-red"
                            : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                    )}
                    <span>
                      <span className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {item.label}
                      </span>
                      {item.description && (
                        <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
                          {item.description}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
