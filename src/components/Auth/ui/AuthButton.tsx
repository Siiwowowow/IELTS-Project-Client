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
        "h-11 w-full rounded-xl bg-[#DC2626] text-[15px] font-semibold text-white shadow-md shadow-[#DC2626]/20",
        "transition-all duration-200 hover:bg-[#b91c1c] active:scale-[0.98]",
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
