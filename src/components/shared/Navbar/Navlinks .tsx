"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActivePath } from "./utils";
import NavDropdown from "./NavDropdown";
import type { NavItem, NavLink } from "./types";

interface Props {
  items?: NavItem[];
  links?: NavLink[];
  onLinkClick?: () => void;
  orientation?: "horizontal" | "vertical";
}

function NavUnderlineLink({
  label,
  href,
  active,
  onClick,
  className,
}: {
  label: string;
  href: string;
  active: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "nav-link-item group relative px-3.5 py-2 text-[0.8125rem] font-medium tracking-tight transition-colors",
        active
          ? "text-ielts-red"
          : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
        className
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
    </Link>
  );
}

export default function NavLinks({
  items,
  links,
  onLinkClick,
  orientation = "horizontal",
}: Props) {
  const pathname = usePathname();

  if (links?.length) {
    return (
      <nav
        aria-label="Main navigation"
        className={
          orientation === "horizontal"
            ? "flex items-center gap-0.5"
            : "flex flex-col gap-0.5"
        }
      >
        {links.map((link) => {
          const active = isActivePath(pathname, link.href);
          const Icon = link.icon;
          return (
            <Link
              key={`link-${link.href}`}
              href={link.href}
              onClick={onLinkClick}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-ielts-red-light text-ielts-red"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60"
              )}
            >
              {Icon && <Icon className="size-4 shrink-0 opacity-70" />}
              {link.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  const navItems = items ?? [];

  return (
    <nav
      aria-label="Main navigation"
      className={
        orientation === "horizontal"
          ? "flex items-center justify-center gap-0.5"
          : "flex flex-col gap-0.5"
      }
    >
      {navItems.map((item) => {
        if (item.children?.length) {
          return (
            <NavDropdown
              key={item.label}
              label={item.label}
              href={item.href}
              items={item.children}
            />
          );
        }

        const active = isActivePath(pathname, item.href);
        return (
          <NavUnderlineLink
            key={`item-${item.href}`}
            label={item.label}
            href={item.href}
            active={active}
            onClick={onLinkClick}
          />
        );
      })}
    </nav>
  );
}
