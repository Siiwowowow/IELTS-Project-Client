//src/components/shared/form/AppField.tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { AnyFieldApi } from "@tanstack/react-form";
import React from "react";

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
  }
  return String(error);
};

type AppFieldProps = {
  field: AnyFieldApi;
  label: string;
  type?: "text" | "email" | "password" | "number" | "date" | "time";
  placeholder?: string;
  append?: React.ReactNode;
  prepend?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  required?: boolean;
};

const AppField = ({
  field,
  label,
  type = "text",
  placeholder,
  append,
  prepend,
  className,
  disabled = false,
  required = false,
}: AppFieldProps) => {
  const firstError =
    field.state.meta.isTouched && field.state.meta.errors.length > 0
      ? getErrorMessage(field.state.meta.errors[0])
      : null;

  const hasError = firstError !== null;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label
        htmlFor={field.name}
        className={cn(hasError && "text-destructive", "text-sm font-medium")}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <div className="relative">
        {/* Prepend Icon/Button - Left Side */}
        {prepend && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 z-10">
            {prepend}
          </div>
        )}

        <Input
          id={field.name}
          name={field.name}
          type={type}
          value={field.state.value}
          placeholder={placeholder}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${field.name}-error` : undefined}
          className={cn(
            "w-full rounded-xl border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all outline-none py-2.5",
            prepend && "pl-10",
            append && "pr-10",
            hasError && "border-destructive focus-visible:ring-destructive/20"
          )}
        />

        {/* Append Button - Right Side (Properly Aligned) */}
        {append && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 z-10">
            {append}
          </div>
        )}
      </div>

      {/* Error Message */}
      {hasError && (
        <p
          id={`${field.name}-error`}
          role="alert"
          className="text-sm text-destructive mt-1"
        >
          {firstError}
        </p>
      )}
    </div>
  );
};

export default AppField;