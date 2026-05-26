"use client";

import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { LayoutDashboard } from "lucide-react";
import Logo from "./Logo";
import AuthButtons from "./AuthButtons";
import UserAvatar from "./UserAvatar";
import SearchBar from "./SearchBar";
import NotificationsButton from "./NotificationsButton";
import NavLinks from "./Navlinks ";
import { getDashboardRoute } from "./utils";
import { desktopNavItems } from "./navConfig";
import type { NavItem } from "./types";
import { Button } from "@/components/ui/button";

interface Props {
  showSearch?: boolean;
  notificationCount?: number;
}

export default function DesktopNav({
  showSearch = true,
  notificationCount = 2,
}: Props) {
  const { user } = useUser();
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
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center gap-6 px-6 xl:px-8">
        {/* Left: Logo */}
        <Logo />

        {/* Center: Navigation */}
        <div className="flex flex-1 items-center justify-center">
          <NavLinks items={navItems} orientation="horizontal" />
        </div>

        {/* Right: Search, actions */}
        <div className="flex shrink-0 items-center gap-2 xl:gap-3">
          {showSearch && (
            <div className="hidden xl:block">
              <SearchBar compact />
            </div>
          )}

          <NotificationsButton count={notificationCount} />

          {user ? (
            <>
              <UserAvatar />
            </>
          ) : (
            <AuthButtons />
          )}
        </div>
      </div>
    </div>
  );
}
