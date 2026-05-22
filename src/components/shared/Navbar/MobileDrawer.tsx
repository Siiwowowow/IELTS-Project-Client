"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ChevronDown, LogOut, LayoutDashboard } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { isActivePath, getDashboardRoute } from "./utils";
import { getDrawerNavItems } from "./navConfig";
import type { NavItem } from "./types";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onClose: () => void;
}

function DrawerNavLink({
  label,
  href,
  icon: Icon,
  active,
  onNavigate,
}: {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "mx-3 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
        active
          ? "bg-ielts-red-light text-ielts-red"
          : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
      )}
    >
      {Icon && <Icon className="size-4 shrink-0 opacity-70" />}
      {label}
    </Link>
  );
}

function CollapsibleSection({
  id,
  label,
  href,
  icon: Icon,
  children,
  onNavigate,
}: {
  id: string;
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: { label: string; href: string; icon?: React.ComponentType<{ className?: string }> }[];
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const sectionActive =
    isActivePath(pathname, href) ||
    children.some((c) => isActivePath(pathname, c.href));
  const [expanded, setExpanded] = useState(sectionActive);

  useEffect(() => {
    if (sectionActive) setExpanded(true);
  }, [sectionActive]);

  return (
    <div className="border-b border-neutral-100 last:border-0 dark:border-neutral-800">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={`drawer-section-${id}`}
        className={cn(
          "flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-medium transition-colors",
          sectionActive
            ? "text-ielts-red"
            : "text-neutral-800 dark:text-neutral-200"
        )}
      >
        <span className="flex items-center gap-3">
          {Icon && <Icon className="size-4 opacity-70" />}
          {label}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-neutral-400 transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      <div
        id={`drawer-section-${id}`}
        className={cn(
          "grid transition-all duration-200 ease-out",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <ul className="overflow-hidden pb-2">
          <li>
            <Link
              href={href}
              onClick={onNavigate}
              className="mx-3 mb-1 block rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-ielts-red hover:bg-ielts-red-light"
            >
              All {label}
            </Link>
          </li>
          {children.map((child) => {
            const ChildIcon = child.icon;
            const active = isActivePath(pathname, child.href);
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "mx-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-ielts-red-light font-medium text-ielts-red"
                      : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/60"
                  )}
                >
                  {ChildIcon && (
                    <ChildIcon className="size-4 shrink-0 opacity-70" />
                  )}
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function DrawerNavItem({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);

  if (item.children?.length) {
    return (
      <CollapsibleSection
        id={item.label.toLowerCase().replace(/\s+/g, "-")}
        label={item.label}
        href={item.href}
        icon={item.icon}
        children={item.children.map(({ label, href, icon }) => ({
          label,
          href,
          icon,
        }))}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <DrawerNavLink
      label={item.label}
      href={item.href}
      icon={item.icon}
      active={active}
      onNavigate={onNavigate}
    />
  );
}

export default function MobileDrawer({ open, onClose }: Props) {
  const { user, logout } = useUser();
  const pathname = usePathname();
  const dashboardRoute = getDashboardRoute(user?.role);
  const navItems = getDrawerNavItems(user, dashboardRoute);
  const [mounted, setMounted] = useState(false);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close only when route changes — not when drawer opens
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 animate-in bg-neutral-900/50 backdrop-blur-[2px] fade-in-0 duration-200"
        onClick={onClose}
      />

      <aside
        id="nav-mobile-drawer"
        className="absolute inset-y-0 right-0 flex w-[min(320px,88vw)] flex-col border-l border-neutral-100 bg-white shadow-[-8px_0_30px_rgba(0,0,0,0.08)] dark:border-neutral-800 dark:bg-neutral-950"
        style={{
          animation: "nav-drawer-in 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-4 dark:border-neutral-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex size-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav
          className="flex-1 overflow-y-auto overscroll-contain py-2"
          aria-label="Mobile navigation"
        >
          {navItems.map((item) => (
            <DrawerNavItem key={item.href} item={item} onNavigate={onClose} />
          ))}

          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="mx-3 mt-2 flex w-[calc(100%-1.5rem)] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          )}
        </nav>

        <div className="border-t border-neutral-100 p-4 dark:border-neutral-800">
          {user ? (
            <Button
              className="h-11 w-full rounded-xl bg-ielts-red font-medium text-white hover:bg-ielts-red-dark"
              asChild
            >
              <Link href={dashboardRoute} onClick={onClose}>
                <LayoutDashboard className="mr-2 size-4" />
                Go to Dashboard
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              className="h-11 w-full rounded-xl font-medium"
              asChild
            >
              <Link href="/login" onClick={onClose}>
                Log in
              </Link>
            </Button>
          )}
        </div>
      </aside>
    </div>,
    document.body
  );
}
