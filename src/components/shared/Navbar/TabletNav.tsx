"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import Logo from "../Logo/Logo";
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
                className="hidden rounded-full bg-neutral-950 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 sm:inline-block shadow-2xs transition-all"
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
            className="flex size-9 items-center justify-center rounded-xl border border-neutral-200/80 bg-neutral-50/60 text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
          >
            <Menu className="size-4.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
