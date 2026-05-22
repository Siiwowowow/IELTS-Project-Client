"use client";

import Link from "next/link";
import { AuthBrandPanel } from "./AuthBrandPanel";
import { cn } from "@/lib/utils";

type AuthSplitLayoutProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  compact?: boolean;
};

export function AuthSplitLayout({
  children,
  title,
  subtitle,
  footer,
  className,
  compact = false,
}: AuthSplitLayoutProps) {
  return (
    <div className="auth-page fixed inset-0 z-[100] flex min-h-[100dvh] flex-col overflow-hidden bg-white">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="relative hidden w-[45%] shrink-0 lg:block xl:w-[48%]">
          <AuthBrandPanel />
        </aside>

        <div className="auth-mobile-brand relative shrink-0 overflow-hidden lg:hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a2e] to-[#16213e]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#DC2626]/30 to-transparent" />
          <div className="relative z-10 px-6 py-8">
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-white"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#DC2626] text-xs font-bold text-white">
                IE
              </span>
              IELTS Prep
            </Link>
            <p className="text-lg font-bold text-white">
              Practice IELTS Like the Real Exam
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div
            className={cn(
              "mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 py-8 sm:px-8 lg:max-w-[480px] lg:py-12",
              compact && "lg:py-10",
              className
            )}
          >
            <Link
              href="/"
              className="mb-8 hidden items-center gap-2.5 lg:inline-flex"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#DC2626] text-sm font-bold text-white shadow-md shadow-[#DC2626]/25">
                IE
              </span>
              <span className="text-sm font-semibold text-neutral-800">
                IELTS Prep
              </span>
            </Link>

            <header className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.75rem]">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  {subtitle}
                </p>
              )}
            </header>

            <div className="flex-1">{children}</div>

            {footer && (
              <footer className="mt-8 border-t border-neutral-100 pt-6 text-center text-sm text-neutral-500">
                {footer}
              </footer>
            )}
          </div>
        </div>
      </div>

      <div className="auth-sticky-cta pointer-events-none fixed inset-x-0 bottom-0 z-10 h-6 bg-gradient-to-t from-white to-transparent lg:hidden" />
    </div>
  );
}
