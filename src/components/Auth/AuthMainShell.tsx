"use client";

import Navbar from "@/components/shared/Navbar/Navbar";
import { usePathname } from "next/navigation";

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
  
  // Hide global navbar/footer during active exams to simulate the real computer-based IELTS environment
  const isExamSimulatorPage = pathname?.startsWith("/practice/reading/") && !pathname?.includes("/review/");

  if (isAuthPage || isExamSimulatorPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar showTopBar={!isHomePage} />
      <main
        className={
          isHomePage ? "flex-1 shrink-0" : "flex-1 shrink-0 p-4"
        }
      >
        {children}
      </main>
    </>
  );
}
