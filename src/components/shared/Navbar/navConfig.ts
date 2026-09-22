import {
  Home,
  BookOpen,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Headphones,
  Mic,
  FileText,
  PenLine,
  Library,
  Timer,
  Target,
  Settings,
  Newspaper,
} from "lucide-react";
import type { NavItem, MobileDrawerSection } from "./types";

export const practiceMenuItems = [
  {
    label: "Listening",
    href: "/practice/listening",
    description: "Audio passages and question types",
    icon: Headphones,
  },
  {
    label: "Reading",
    href: "/practice/reading",
    description: "Academic & General passages",
    icon: BookOpen,
  },
  {
    label: "Writing",
    href: "/practice/writing",
    description: "Task 1 & Task 2 practice tasks",
    icon: PenLine,
  },
  {
    label: "Speaking",
    href: "/practice/speaking",
    description: "Part 1, 2 & 3 IELTS simulations",
    icon: Mic,
  },
  {
    label: "Vocabulary",
    href: "/practice/vocabulary",
    description: "Topic-based vocabulary database",
    icon: Library,
  },
];

export const mockTestsMenuItems = [
  {
    label: "Full Mock Test",
    href: "/mock-tests/full",
    description: "Complete 2 hour 45 minute exam simulation",
    icon: ClipboardList,
  },
  {
    label: "Timed Section Test",
    href: "/mock-tests/sections",
    description: "Section practice under timed conditions",
    icon: Timer,
  },
  {
    label: "Band Score Predictor",
    href: "/mock-tests/predictor",
    description: "AI-powered band score estimator",
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
  { label: "Blog", href: "/blog" },
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
  { label: "Blog", href: "/blog", icon: Newspaper },
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


