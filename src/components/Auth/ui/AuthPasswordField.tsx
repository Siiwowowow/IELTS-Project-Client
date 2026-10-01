"use client";

import { cn } from "@/lib/utils";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
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
    placeholder,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-[13px] font-bold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-[17px] -translate-y-1/2 text-slate-400" />
        <input
          ref={ref}
          id={id}
          type={show ? "text" : "password"}
          aria-invalid={!!error}
          className={cn(
            "h-12 w-full rounded-xl border bg-slate-50/70 pl-11 pr-12 text-sm font-medium text-slate-950 outline-none transition-all duration-200",
            "border-slate-200 placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 hover:bg-white",
            "focus:border-[#e3262e] focus:bg-white focus:shadow-[0_0_0_4px_rgba(227,38,46,0.09)]",
            error && "border-red-400 focus:border-red-500",
            className
          )}
          placeholder={placeholder ?? `Enter your ${label.toLowerCase()}`}
          {...props}
        />
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
