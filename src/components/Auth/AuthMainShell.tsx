"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const Navbar = dynamic(() => import("@/components/shared/Navbar/Navbar"));
const Footer = dynamic(() =>
  import("@/components/shared/Footer").then((module) => module.Footer),
);

const AUTH_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

export function AuthMainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PREFIXES.some((p) => pathname?.startsWith(p));
  const isHomePage = pathname === "/";
  
  const isExamSimulatorPage =
    (pathname?.startsWith("/practice/reading/") ||
      pathname?.startsWith("/practice/listening/") ||
      pathname?.startsWith("/practice/writing/") ||
      pathname?.startsWith("/practice/speaking/")) &&
    !pathname?.includes("/review/");

  const isDashboardPage =
    pathname?.startsWith("/student") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/teacher") ||
    pathname?.startsWith("/user") ||
    pathname?.startsWith("/dashboard");

  const isPracticePage = pathname?.startsWith("/practice");

  if (isAuthPage || isExamSimulatorPage || isDashboardPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main
        className={
          cn(
            "relative z-0 isolate",
            isHomePage || isPracticePage ? "flex-1 shrink-0" : "flex-1 shrink-0 p-4"
          )
        }
      >
        {children}
      </main>
      <Footer />
    </>
  );
}
