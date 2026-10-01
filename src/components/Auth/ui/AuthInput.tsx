"use client";

import { cn } from "@/lib/utils";
import { forwardRef, useId } from "react";
import { Mail, UserRound } from "lucide-react";

export type AuthInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null;
  hint?: string;
  containerClassName?: string;
};

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  function AuthInput(
    { label, error, hint, className, containerClassName, id: idProp, type, placeholder, ...props },
    ref
  ) {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const Icon = type === "email" ? Mail : UserRound;

    return (
      <div className={cn("space-y-2", containerClassName)}>
        <label htmlFor={id} className="block text-[13px] font-bold text-slate-700">
          {label}
        </label>
        <div className="relative">
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-[17px] -translate-y-1/2 text-slate-400" />
          <input
            ref={ref}
            id={id}
            type={type}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            className={cn(
              "h-12 w-full rounded-xl border bg-slate-50/70 pl-11 pr-4 text-sm font-medium text-slate-950 outline-none transition-all duration-200",
              "border-slate-200 placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 hover:bg-white",
              "focus:border-[#e3262e] focus:bg-white focus:shadow-[0_0_0_4px_rgba(227,38,46,0.09)]",
              error && "border-red-400 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]",
              props.disabled && "cursor-not-allowed bg-neutral-50 opacity-60",
              className
            )}
            placeholder={placeholder ?? `Enter your ${label.toLowerCase()}`}
            {...props}
          />
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
