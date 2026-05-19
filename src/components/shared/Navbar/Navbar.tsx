"use client";

import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import type { NavbarProps } from "./types";
import { Home, Info, Phone } from "lucide-react";

// ✅ Public Links
const defaultPublicLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "About", href: "/about", icon: Info },
  { label: "Contact", href: "/contact", icon: Phone },
];

export default function Navbar({}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 shadow-sm">
      <DesktopNav publicLinks={defaultPublicLinks} />
      <MobileNav publicLinks={defaultPublicLinks} />
    </header>
  );
}