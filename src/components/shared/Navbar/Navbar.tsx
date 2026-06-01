/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import TabletNav from "./TabletNav";
import MobileDrawer from "./MobileDrawer";
import type { NavbarProps } from "./types";
import { cn } from "@/lib/utils";

export default function Navbar({
 
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
        "sticky top-0 z-50 w-full bg-red-600 transition-shadow duration-300",
        showScrolled
          ? "shadow-md shadow-red-900/10"
          : "shadow-none border-b border-red-700"
      )}
    >
  
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
