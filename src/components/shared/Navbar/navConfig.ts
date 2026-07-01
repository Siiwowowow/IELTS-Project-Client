import {
  Home,
  BookOpen,
  ClipboardList,
  CreditCard,
  BarChart3,
  LayoutDashboard,
  Headphones,
  Mic,
  FileText,
  PenLine,
  Library,
  Timer,
  Target,
  Settings,
} from "lucide-react";
import type { NavItem, MobileDrawerSection } from "./types";

export const practiceMenuItems = [
  {
    label: "লিসেনিং",
    href: "/practice/listening",
    description: "অডিও প্যাসেজ ও প্রশ্নের ধরণসমূহ",
    icon: Headphones,
  },
  {
    label: "রিডিং",
    href: "/practice/reading",
    description: "একাডেমিক ও জেনারেল প্যাসেজ",
    icon: BookOpen,
  },
  {
    label: "রাইটিং",
    href: "/practice/writing",
    description: "টাস্ক ১ ও টাস্ক ২ প্র্যাকটিস",
    icon: PenLine,
  },
  {
    label: "স্পিকিং",
    href: "/practice/speaking",
    description: "পার্ট ১, ২ ও ৩ সিমুলেশন",
    icon: Mic,
  },
  {
    label: "ভোকেবুলারি",
    href: "/practice/vocabulary",
    description: "টপিক-ভিত্তিক শব্দভাণ্ডার",
    icon: Library,
  },
];

export const mockTestsMenuItems = [
  {
    label: "ফুল মক টেস্ট",
    href: "/mock-tests/full",
    description: "সম্পূর্ণ ২ ঘণ্টা ৪৫ মিনিটের পরীক্ষা",
    icon: ClipboardList,
  },
  {
    label: "টাইমড সেকশন টেস্ট",
    href: "/mock-tests/sections",
    description: "বাস্তব সময়ের অধীনে প্র্যাকটিস",
    icon: Timer,
  },
  {
    label: "ব্যান্ড স্কোর প্রেডিক্টর",
    href: "/mock-tests/predictor",
    description: "AI-চালিত ব্যান্ড স্কোর অনুমান",
    icon: Target,
  },
];

export const desktopNavItems: NavItem[] = [
  { label: "হোম", href: "/" },
  {
    label: "প্র্যাকটিস",
    href: "/practice",
    children: practiceMenuItems,
  },
  {
    label: "মক টেস্ট",
    href: "/mock-tests",
    children: mockTestsMenuItems,
  },
  { label: "প্রাইসিং", href: "/pricing" },
  { label: "অ্যানালিটিক্স", href: "/analytics" },
  {
    label: "ড্যাশবোর্ড",
    href: "/dashboard",
    requiresAuth: true,
    icon: LayoutDashboard,
  },
];

export const mobileDrawerSections: MobileDrawerSection[] = [
  {
    id: "practice",
    label: "প্র্যাকটিস",
    href: "/practice",
    icon: BookOpen,
    children: practiceMenuItems.map(({ label, href, icon }) => ({
      label,
      href,
      icon,
    })),
  },
  {
    id: "mock-tests",
    label: "মক টেস্ট",
    href: "/mock-tests",
    icon: ClipboardList,
    children: mockTestsMenuItems.map(({ label, href, icon }) => ({
      label,
      href,
      icon,
    })),
  },
];

export const mobileDrawerLinks = [
  { label: "হোম", href: "/", icon: Home },
  { label: "অ্যানালিটিক্স", href: "/analytics", icon: BarChart3 },
  { label: "প্রাইসিং", href: "/pricing", icon: CreditCard },
  { label: "সেটিংস", href: "/settings", icon: Settings },
];

export const mobileStandaloneSkills = [
  { label: "লিসেনিং", href: "/practice/listening", icon: Headphones },
  { label: "রিডিং", href: "/practice/reading", icon: BookOpen },
  { label: "রাইটিং", href: "/practice/writing", icon: FileText },
  { label: "স্পিকিং", href: "/practice/speaking", icon: Mic },
  { label: "ভোকেবুলারি", href: "/practice/vocabulary", icon: Library },
];

/** All routes shown in the mobile/tablet drawer (mirrors desktop nav + extras). */
export function getDrawerNavItems(
  user: { role?: string } | null | undefined,
  dashboardRoute: string
): NavItem[] {
  const items = desktopNavItems
    .filter((item) => !item.requiresAuth || user)
    .map((item) =>
      item.label === "Dashboard"
        ? { ...item, href: dashboardRoute }
        : item
    );

  const hasSettings = items.some((item) => item.href === "/settings");
  if (!hasSettings) {
    items.push({
      label: "Settings",
      href: "/settings",
      icon: Settings,
    });
  }

  return items;
}

