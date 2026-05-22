"use client";

import { useCallback, useEffect, useState } from "react";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import TabletNav from "./TabletNav";
import MobileDrawer from "./MobileDrawer";
import TopBar from "./TopBar";
import type { NavbarProps } from "./types";
import { cn } from "@/lib/utils";

export default function Navbar({
  showTopBar = true,
  showSearch = true,
  notificationCount = 2,
}: NavbarProps) {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showScrolled = mounted && scrolled;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md transition-shadow duration-300 dark:bg-neutral-950/95",
        showScrolled
          ? "shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)]"
          : "shadow-none border-b border-neutral-100/80 dark:border-neutral-800/80"
      )}
    >
      {showTopBar && <TopBar />}

      <DesktopNav
        showSearch={showSearch}
        notificationCount={notificationCount}
      />
      <TabletNav
        onMenuOpen={openDrawer}
        drawerOpen={drawerOpen}
        notificationCount={notificationCount}
      />
      <MobileNav onMenuOpen={openDrawer} drawerOpen={drawerOpen} />

      <MobileDrawer open={drawerOpen} onClose={closeDrawer} />
    </header>
  );
}
