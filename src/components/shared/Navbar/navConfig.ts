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
    label: "Listening",
    href: "/practice/listening",
    description: "Audio passages & question types",
    icon: Headphones,
  },
  {
    label: "Reading",
    href: "/practice/reading",
    description: "Academic & general passages",
    icon: BookOpen,
  },
  {
    label: "Writing",
    href: "/practice/writing",
    description: "Task 1 & Task 2 practice",
    icon: PenLine,
  },
  {
    label: "Speaking",
    href: "/practice/speaking",
    description: "Parts 1, 2 & 3 simulations",
    icon: Mic,
  },
  {
    label: "Vocabulary",
    href: "/practice/vocabulary",
    description: "Topic-based word banks",
    icon: Library,
  },
];

export const mockTestsMenuItems = [
  {
    label: "Full Mock Test",
    href: "/mock-tests/full",
    description: "Complete 2h 45m CBT simulation",
    icon: ClipboardList,
  },
  {
    label: "Timed Section Tests",
    href: "/mock-tests/sections",
    description: "Practice under real time limits",
    icon: Timer,
  },
  {
    label: "Band Score Predictor",
    href: "/mock-tests/predictor",
    description: "AI-assisted score estimation",
    icon: Target,
  },
];

export const desktopNavItems: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Practice",
    href: "/practice",
    children: practiceMenuItems,
  },
  {
    label: "Mock Tests",
    href: "/mock-tests",
    children: mockTestsMenuItems,
  },
  { label: "Pricing", href: "/pricing" },
  { label: "Analytics", href: "/analytics" },
  {
    label: "Dashboard",
    href: "/dashboard",
    requiresAuth: true,
    icon: LayoutDashboard,
  },
];

export const mobileDrawerSections: MobileDrawerSection[] = [
  {
    id: "practice",
    label: "Practice",
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
    label: "Mock Tests",
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
  { label: "Home", href: "/", icon: Home },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Pricing", href: "/pricing", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const mobileStandaloneSkills = [
  { label: "Listening", href: "/practice/listening", icon: Headphones },
  { label: "Reading", href: "/practice/reading", icon: BookOpen },
  { label: "Writing", href: "/practice/writing", icon: FileText },
  { label: "Speaking", href: "/practice/speaking", icon: Mic },
  { label: "Vocabulary", href: "/practice/vocabulary", icon: Library },
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

