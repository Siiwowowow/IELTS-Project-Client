"use client";

import { cn } from "@/lib/utils";
import { forwardRef, useId, useState } from "react";

export type AuthInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null;
  hint?: string;
  containerClassName?: string;
};

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  function AuthInput(
    { label, error, hint, className, containerClassName, id: idProp, value, defaultValue, ...props },
    ref
  ) {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const [focused, setFocused] = useState(false);
    const hasValue =
      value !== undefined && value !== ""
        ? String(value).length > 0
        : defaultValue !== undefined && String(defaultValue).length > 0;

    const floated = focused || hasValue;

    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            value={value}
            defaultValue={defaultValue}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            className={cn(
              "peer w-full rounded-xl border bg-white px-4 pb-2.5 pt-6 text-[15px] text-neutral-900 outline-none transition-all duration-200",
              "placeholder:text-transparent",
              "border-neutral-200 hover:border-neutral-300",
              "focus:border-[#DC2626] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]",
              error && "border-red-400 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]",
              props.disabled && "cursor-not-allowed bg-neutral-50 opacity-60",
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
        </div>
        {error && (
          <p id={`${id}-error`} role="alert" className="auth-shake text-xs text-red-600">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${id}-hint`} className="text-xs text-neutral-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
