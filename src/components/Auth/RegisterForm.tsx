"use client";

import { registerAction } from "@/app/(auth)/(auth)/register/_action";
import { AuthSplitLayout } from "@/components/Auth/layout/AuthSplitLayout";
import {
  AuthAlert,
  AuthButton,
  AuthCard,
  AuthCheckbox,
  AuthInput,
  AuthPasswordField,
  AuthSocialButtons,
  AuthStepper,
  PasswordStrengthMeter,
} from "@/components/Auth/ui";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerZodSchema } from "@/zod/auth.validation";
import { useForm } from "@tanstack/react-form";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BAND_OPTIONS = ["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"];

const RegisterForm = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      targetBand: "7.0",
      examType: "ACADEMIC" as "ACADEMIC" | "GENERAL",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      setIsLoading(true);

      const parsed = registerZodSchema.safeParse(value);
      if (!parsed.success) {
        setServerError(parsed.error.issues[0]?.message ?? "Invalid form data");
        setIsLoading(false);
        return;
      }

      if (!acceptedTerms) {
        setServerError("Please accept the terms and conditions");
        setIsLoading(false);
        return;
      }

      try {
        const formData = new FormData();
        formData.append("name", value.name);
        formData.append("email", value.email);
        formData.append("password", value.password);
        formData.append("role", "CUSTOMER");
        formData.append("targetBand", value.targetBand);
        formData.append("examType", value.examType);

        const result = (await registerAction(formData)) as {
          success: boolean;
          message?: string;
        };

        if (!result.success) {
          setServerError(result.message ?? "Registration failed");
          toast.error(result.message);
          setIsLoading(false);
          return;
        }

        setRegisterSuccess(true);
        toast.success("Account created! Check your email to verify.");
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(value.email)}`);
        }, 1200);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Registration failed";
        setServerError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
  });

  const validateStep = (current: number): boolean => {
    const v = form.state.values;
    if (current === 1) {
      if (v.name.trim().length < 2) {
        setServerError("Please enter your full name");
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) {
        setServerError("Please enter a valid email");
        return false;
      }
    }
    if (current === 2) {
      if (v.password.length < 6) {
        setServerError("Password must be at least 6 characters");
        return false;
      }
      if (v.password !== v.confirmPassword) {
        setServerError("Passwords do not match");
        return false;
      }
    }
    if (current === 3 && !acceptedTerms) {
      setServerError("Please accept the terms and conditions");
      return false;
    }
    setServerError(null);
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep((s) => Math.min(3, s + 1));
  };

  const prevStep = () => {
    setServerError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  return (
    <AuthSplitLayout
      title="Start your IELTS journey"
      subtitle="Create your account and access realistic computer-based practice tests."
      compact
      footer={
        <p>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#DC2626] hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <AuthStepper currentStep={step} />

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3">
        <Mail className="mt-0.5 size-4 shrink-0 text-blue-600" />
        <p className="text-xs leading-relaxed text-blue-800">
          After registration, we&apos;ll send a verification code to your email.
          Verify to unlock full practice access.
        </p>
      </div>

      <AuthCard>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 3) nextStep();
            else form.handleSubmit();
          }}
          className="space-y-5"
        >
          {step === 1 && (
            <div className="auth-fade-in space-y-5">
              <form.Field name="name">
                {(field) => (
                  <AuthInput
                    label="Full name"
                    autoComplete="name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              </form.Field>
              <form.Field name="email">
                {(field) => (
                  <AuthInput
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              </form.Field>
            </div>
          )}

          {step === 2 && (
            <div className="auth-fade-in space-y-5">
              <form.Field name="password">
                {(field) => (
                  <AuthPasswordField
                    label="Password"
                    autoComplete="new-password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    showStrength
                    strengthSlot={
                      <PasswordStrengthMeter password={field.state.value} />
                    }
                  />
                )}
              </form.Field>
              <form.Field name="confirmPassword">
                {(field) => (
                  <AuthPasswordField
                    label="Confirm password"
                    autoComplete="new-password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    error={
                      field.state.meta.isTouched &&
                      field.state.value !== form.state.values.password
                        ? "Passwords do not match"
                        : null
                    }
                  />
                )}
              </form.Field>
            </div>
          )}

          {step === 3 && (
            <div className="auth-fade-in space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-neutral-700">
                  Target IELTS band
                </Label>
                <form.Field name="targetBand">
                  {(field) => (
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v)}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-neutral-200">
                        <SelectValue placeholder="Select target band" />
                      </SelectTrigger>
                      <SelectContent>
                        {BAND_OPTIONS.map((band) => (
                          <SelectItem key={band} value={band}>
                            Band {band}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </form.Field>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-neutral-700">
                  Exam type
                </Label>
                <form.Field name="examType">
                  {(field) => (
                    <RadioGroup
                      value={field.state.value}
                      onValueChange={(v) =>
                        field.handleChange(v as "ACADEMIC" | "GENERAL")
                      }
                      className="grid grid-cols-2 gap-3"
                    >
                      {(
                        [
                          { value: "ACADEMIC", label: "Academic" },
                          { value: "GENERAL", label: "General Training" },
                        ] as const
                      ).map(({ value, label }) => (
                        <label
                          key={value}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all",
                            field.state.value === value
                              ? "border-[#DC2626] bg-[#fef2f2] ring-2 ring-[#DC2626]/10"
                              : "border-neutral-200 hover:border-neutral-300"
                          )}
                        >
                          <RadioGroupItem value={value} id={value} />
                          <span className="text-sm font-medium">{label}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  )}
                </form.Field>
              </div>

              <AuthCheckbox
                checked={acceptedTerms}
                onCheckedChange={setAcceptedTerms}
                label={
                  <>
                    I agree to the{" "}
                    <Link href="/terms" className="text-[#DC2626] hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-[#DC2626] hover:underline">
                      Privacy Policy
                    </Link>
                  </>
                }
              />
            </div>
          )}

          {serverError && <AuthAlert variant="error">{serverError}</AuthAlert>}

          <div className="flex gap-3 pt-1">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="h-11 flex-1 rounded-xl border-neutral-200"
              >
                <ArrowLeft className="mr-1 size-4" />
                Back
              </Button>
            )}
            {step < 3 ? (
              <AuthButton
                type="submit"
                className={cn("gap-2", step === 1 && "w-full")}
              >
                <span className="inline-flex items-center gap-2">
                  Continue
                  <ArrowRight className="size-4" />
                </span>
              </AuthButton>
            ) : (
              <AuthButton
                type="submit"
                isLoading={isLoading}
                loadingLabel="Creating account..."
                success={registerSuccess}
                className="flex-1"
              >
                Create account
              </AuthButton>
            )}
          </div>

          {step === 1 && <AuthSocialButtons mode="register" />}
        </form>
      </AuthCard>
    </AuthSplitLayout>
  );
};

export default RegisterForm;
