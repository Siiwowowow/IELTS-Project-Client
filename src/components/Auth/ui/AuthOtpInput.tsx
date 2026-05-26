"use client";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

type AuthOtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  label?: string;
  className?: string;
};

export function AuthOtpInput({
  value,
  onChange,
  error,
  label = "Verification code",
  className,
}: AuthOtpInputProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label
        className={cn(
          "text-sm font-medium text-neutral-700",
          error && "text-red-600"
        )}
      >
        {label}
      </Label>
      <InputOTP
        maxLength={6}
        value={value}
        onChange={onChange}
        containerClassName="justify-center gap-2"
      >
        <InputOTPGroup className="gap-2 border-0 shadow-none">
          {Array.from({ length: 6 }).map((_, i) => (
            <InputOTPSlot
              key={i}
              index={i}
              className={cn(
                "size-11 rounded-xl border border-neutral-200 text-lg font-semibold shadow-sm",
                "first:rounded-xl last:rounded-xl first:border last:border",
                "data-[active=true]:border-[#DC2626] data-[active=true]:ring-[3px] data-[active=true]:ring-[#DC2626]/15",
                error && "border-red-300"
              )}
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
      {error && (
        <p role="alert" className="auth-shake text-center text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
