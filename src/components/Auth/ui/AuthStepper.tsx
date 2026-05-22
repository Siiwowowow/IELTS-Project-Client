"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const steps = ["Account", "Security", "Goals"];

type AuthStepperProps = {
  currentStep: number;
};

export function AuthStepper({ currentStep }: AuthStepperProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isComplete = currentStep > stepNum;
          const isActive = currentStep === stepNum;

          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
                    isComplete && "bg-[#DC2626] text-white",
                    isActive &&
                      "bg-[#DC2626] text-white ring-4 ring-[#DC2626]/15",
                    !isComplete &&
                      !isActive &&
                      "border border-neutral-200 bg-white text-neutral-400"
                  )}
                >
                  {isComplete ? (
                    <Check className="size-4" />
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={cn(
                    "hidden text-[11px] font-medium sm:block",
                    isActive ? "text-[#DC2626]" : "text-neutral-400"
                  )}
                >
                  {label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded-full transition-colors duration-300",
                    isComplete ? "bg-[#DC2626]" : "bg-neutral-100"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
