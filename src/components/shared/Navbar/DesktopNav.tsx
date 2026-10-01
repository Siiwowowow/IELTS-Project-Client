"use client";

import { useUser } from "@/hooks/useUser";
import AuthButtons from "./AuthButtons";
import UserAvatar from "./UserAvatar";
import NavLinks from "./Navlinks ";
import { getDashboardRoute } from "./utils";
import { desktopNavItems } from "./navConfig";
import type { NavItem } from "./types";
import Logo from "../Logo/Logo";
import AccountLoadingState from "./AccountLoadingState";

export default function DesktopNav() {
  const { user, isLoading } = useUser();
  const dashboardRoute = getDashboardRoute(user?.role);

  const navItems: NavItem[] = desktopNavItems
    .filter((item) => !item.requiresAuth || user)
    .map((item) =>
      item.label === "Dashboard"
        ? { ...item, href: dashboardRoute }
        : item
    );

  return (
    <div className="hidden lg:block w-full">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-6 px-6 xl:px-8">
        {/* Left: Logo */}
        <Logo />

        {/* Center: Navigation */}
        <div className="flex flex-1 items-center justify-center">
          <NavLinks items={navItems} orientation="horizontal" />
        </div>

        {/* Right: Account actions */}
        <div className="flex shrink-0 items-center gap-2 xl:gap-3">
          {isLoading ? (
            <AccountLoadingState />
          ) : user ? (
            <UserAvatar />
          ) : (
            <AuthButtons />
          )}
        </div>
      </div>
    </div>
  );
}
