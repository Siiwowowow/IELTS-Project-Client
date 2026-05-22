"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type AuthAlertProps = {
  variant: "error" | "success";
  children: React.ReactNode;
  className?: string;
};

export function AuthAlert({ variant, children, className }: AuthAlertProps) {
  const isError = variant === "error";
  return (
    <div
      role="alert"
      className={cn(
        "auth-fade-in flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        isError
          ? "border-red-100 bg-red-50 text-red-800"
          : "border-emerald-100 bg-emerald-50 text-emerald-800",
        className
      )}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
      ) : (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
      )}
      <div className="flex-1 leading-relaxed">{children}</div>
    </div>
  );
}
