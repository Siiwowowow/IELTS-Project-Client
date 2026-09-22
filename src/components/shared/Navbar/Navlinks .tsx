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

function NavPillLink({
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
        "relative rounded-full px-4 py-1.5 text-xs tracking-tight transition-all duration-200",
        active
          ? "bg-red-600 text-white font-bold shadow-sm shadow-red-500/20"
          : "text-neutral-600 font-medium hover:text-neutral-950 hover:bg-white/60",
        className
      )}
    >
      <span>{label}</span>
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
            ? "flex items-center gap-1 rounded-full bg-neutral-100/70 p-1 border border-neutral-200/60 backdrop-blur-md shadow-2xs"
            : "flex flex-col gap-1"
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
                "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-all duration-200",
                active
                  ? "bg-red-600 text-white font-bold shadow-sm shadow-red-500/20"
                  : "text-neutral-600 font-medium hover:bg-neutral-100/60 hover:text-neutral-950"
              )}
            >
              {Icon && <Icon className={cn("size-4 shrink-0", active ? "text-white opacity-100" : "opacity-70")} />}
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
          ? "flex items-center justify-center gap-1 rounded-full bg-neutral-100/70 p-1 border border-neutral-200/60 backdrop-blur-md shadow-2xs"
          : "flex flex-col gap-1"
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
          <NavPillLink
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
