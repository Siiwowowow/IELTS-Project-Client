"use client";

import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useId, useState } from "react";
import { Button } from "@/components/ui/button";

export type AuthPasswordFieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: string;
  error?: string | null;
  showStrength?: boolean;
  strengthSlot?: React.ReactNode;
};

export const AuthPasswordField = forwardRef<
  HTMLInputElement,
  AuthPasswordFieldProps
>(function AuthPasswordField(
  {
    label,
    error,
    className,
    showStrength,
    strengthSlot,
    id: idProp,
    value,
    defaultValue,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const hasValue =
    value !== undefined && value !== ""
      ? String(value).length > 0
      : defaultValue !== undefined && String(defaultValue).length > 0;
  const floated = focused || hasValue;

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={show ? "text" : "password"}
          value={value}
          defaultValue={defaultValue}
          aria-invalid={!!error}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          className={cn(
            "peer w-full rounded-xl border bg-white px-4 pb-2.5 pt-6 pr-12 text-[15px] text-neutral-900 outline-none transition-all duration-200",
            "placeholder:text-transparent",
            "border-neutral-200 hover:border-neutral-300",
            "focus:border-[#DC2626] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]",
            error && "border-red-400 focus:border-red-500",
            className
          )}
          placeholder={label}
          {...props}
        />
        <label
          htmlFor={id}
          className={cn(
            "pointer-events-none absolute left-4 text-neutral-500 transition-all duration-200",
            floated
              ? "top-2 text-[11px] font-medium text-[#DC2626]"
              : "top-1/2 -translate-y-1/2 text-sm"
          )}
        >
          {label}
        </label>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
      {showStrength && strengthSlot}
      {error && (
        <p role="alert" className="auth-shake text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});
