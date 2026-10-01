"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

type AuthButtonProps = React.ComponentProps<typeof Button> & {
  isLoading?: boolean;
  loadingLabel?: string;
  success?: boolean;
};

export function AuthButton({
  isLoading,
  loadingLabel = "Please wait...",
  success,
  children,
  className,
  disabled,
  ...props
}: AuthButtonProps) {
  return (
    <Button
      disabled={disabled || isLoading || success}
      className={cn(
        "h-12 w-full rounded-xl bg-[#e3262e] text-sm font-bold text-white shadow-[0_12px_24px_-12px_rgba(227,38,46,.9)]",
        "transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#c91f27] hover:shadow-[0_16px_28px_-12px_rgba(227,38,46,.8)] active:translate-y-0 active:scale-[0.99]",
        "disabled:opacity-60",
        success && "bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-600",
        className
      )}
      {...props}
    >
      {success ? (
        <>
          <Check className="size-4 animate-in zoom-in" />
          Done!
        </>
      ) : isLoading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
