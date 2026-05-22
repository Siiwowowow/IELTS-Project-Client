"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import Logo from "./Logo";
import NotificationsButton from "./NotificationsButton";
import UserAvatar from "./UserAvatar";
import AuthButtons from "./AuthButtons";
import NavLinks from "./Navlinks ";
import { getDashboardRoute } from "./utils";
import { desktopNavItems } from "./navConfig";
import type { NavItem } from "./types";

interface Props {
  onMenuOpen: () => void;
  drawerOpen?: boolean;
  notificationCount?: number;
}

export default function TabletNav({
  onMenuOpen,
  drawerOpen = false,
  notificationCount = 2,
}: Props) {
  const { user } = useUser();
  const dashboardRoute = getDashboardRoute(user?.role);

  const compactItems: NavItem[] = desktopNavItems
    .filter((item) => !item.children && !item.requiresAuth)
    .slice(0, 3);

  return (
    <div className="hidden md:block lg:hidden w-full">
      <div className="flex h-16 items-center justify-between gap-4 px-5">
        <Logo />

        <div className="flex min-w-0 flex-1 items-center justify-center overflow-x-auto scrollbar-hide">
          <NavLinks items={compactItems} orientation="horizontal" />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <NotificationsButton count={notificationCount} />
          {user ? (
            <>
              <UserAvatar />
              <Link
                href={dashboardRoute}
                className="hidden rounded-lg bg-ielts-red px-3 py-2 text-xs font-medium text-white hover:bg-ielts-red-dark sm:inline-block"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <div className="hidden sm:block">
              <AuthButtons />
            </div>
          )}
          <button
            type="button"
            onClick={onMenuOpen}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            aria-controls="nav-mobile-drawer"
            className="flex size-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-700 transition-colors hover:border-ielts-red/30 hover:bg-ielts-red-light hover:text-ielts-red dark:border-neutral-700"
          >
            <Menu className="size-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}
