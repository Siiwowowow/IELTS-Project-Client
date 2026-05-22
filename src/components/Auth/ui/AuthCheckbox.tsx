"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type AuthCheckboxProps = {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

export function AuthCheckbox({
  id,
  checked,
  onCheckedChange,
  label,
  className,
  disabled,
}: AuthCheckboxProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 text-sm text-neutral-600",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange?.(v === true)}
        disabled={disabled}
        className="mt-0.5 size-[18px] rounded-md border-neutral-300 data-checked:border-[#DC2626] data-checked:bg-[#DC2626]"
      />
      <span className="leading-snug">{label}</span>
    </label>
  );
}
