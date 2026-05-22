"use client";

import { cn } from "@/lib/utils";
import {
  getPasswordStrength,
  strengthColors,
  strengthLabels,
} from "./auth-utils";

type PasswordStrengthMeterProps = {
  password: string;
  className?: string;
};

export function PasswordStrengthMeter({
  password,
  className,
}: PasswordStrengthMeterProps) {
  const strength = getPasswordStrength(password);
  if (!password) return null;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              strength >= level ? strengthColors[strength] : "bg-neutral-100"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-neutral-500">
        Strength:{" "}
        <span
          className={cn(
            "font-medium",
            strength <= 1 && "text-red-500",
            strength === 2 && "text-amber-600",
            strength >= 3 && "text-emerald-600"
          )}
        >
          {strengthLabels[strength]}
        </span>
      </p>
    </div>
  );
}
