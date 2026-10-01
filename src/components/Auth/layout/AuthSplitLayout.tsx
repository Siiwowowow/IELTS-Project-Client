"use client";

import { AuthBrandPanel } from "./AuthBrandPanel";
import { AuthLogo } from "./AuthLogo";
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
    <div className="auth-page fixed inset-0 z-[100] flex min-h-[100dvh] w-full min-w-0 flex-col overflow-x-hidden bg-[#f7f7f5]">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
        <aside className="relative hidden h-full min-w-0 w-[44%] shrink-0 overflow-hidden lg:block xl:w-[46%]">
          <AuthBrandPanel />
        </aside>

        <div className="relative shrink-0 border-b border-slate-200/70 bg-white px-5 py-4 lg:hidden">
          <div className="mx-auto flex max-w-[460px] items-center justify-between">
            <AuthLogo />
            <span className="rounded-full bg-red-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#d92129]">
              CBT Practice
            </span>
          </div>
        </div>

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain">
          <div className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-red-100/55 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-10 size-72 rounded-full bg-amber-100/55 blur-3xl" />
          <div
            className={cn(
              "relative mx-auto my-auto flex w-full max-w-[500px] shrink-0 flex-col px-5 py-7 sm:px-8 lg:px-10 lg:py-10",
              compact && "my-0 xl:my-auto",
              className
            )}
          >
            <div className="mb-8 hidden lg:block"><AuthLogo /></div>

            <header className="mb-6">
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#d92129]">Your IELTS workspace</p>
              <h1 className="text-[1.75rem] font-black tracking-[-0.045em] text-slate-950 sm:text-[2rem]">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {subtitle}
                </p>
              )}
            </header>

            <div className="flex-1">{children}</div>

            {footer && (
              <footer className="mt-6 text-center text-sm text-slate-500">
                {footer}
              </footer>
            )}
          </div>
        </div>
      </div>

      <div className="auth-sticky-cta pointer-events-none fixed inset-x-0 bottom-0 z-10 h-5 bg-gradient-to-t from-[#f7f7f5] to-transparent lg:hidden" />
    </div>
  );
}
