"use client";

import {
  resendResetOtpAction,
  resetPasswordAction,
} from "@/app/(auth)/(auth)/reset-password/_action";
import { AuthSplitLayout } from "@/components/Auth/layout/AuthSplitLayout";
import {
  AuthAlert,
  AuthButton,
  AuthCard,
  AuthOtpInput,
  AuthPasswordField,
  PasswordStrengthMeter,
} from "@/components/Auth/ui";
import { resetPasswordZodSchema } from "@/zod/auth.validation";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const ResetPasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";

  const [serverError, setServerError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  useEffect(() => {
    if (!emailFromUrl) router.push("/forgot-password");
  }, [emailFromUrl, router]);

  const { mutateAsync: resetPassword, isPending: isResetting } = useMutation({
    mutationFn: resetPasswordAction,
  });

  const { mutateAsync: resendOtp, isPending: isResending } = useMutation({
    mutationFn: (email: string) => resendResetOtpAction(email),
  });

  const form = useForm({
    defaultValues: {
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      setOtpError(null);

      if (!value.otp || value.otp.length !== 6) {
        setOtpError("Verification code must be 6 digits");
        return;
      }

      try {
        const result = (await resetPassword({
          email: emailFromUrl,
          otp: value.otp,
          newPassword: value.newPassword,
          confirmPassword: value.confirmPassword,
        })) as { success: boolean; message?: string };

        if (!result.success) {
          setServerError(result.message ?? "Failed to reset password");
          toast.error(result.message);
          return;
        }

        setResetSuccess(true);
        toast.success(result.message ?? "Password updated!");
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : "Failed to reset password";
        setServerError(msg);
        toast.error(msg);
      }
    },
  });

  useEffect(() => {
    if (!resetSuccess) return;
    if (redirectCountdown <= 0) {
      router.push("/login");
      return;
    }
    const t = setTimeout(() => setRedirectCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resetSuccess, redirectCountdown, router]);

  const handleResendOtp = async () => {
    if (countdown > 0 || !emailFromUrl) return;
    try {
      const result = (await resendOtp(emailFromUrl)) as {
        success: boolean;
        message?: string;
      };
      if (result.success) {
        toast.success(result.message ?? "Code resent");
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(result.message ?? "Failed to resend");
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to resend code"
      );
    }
  };

  if (!emailFromUrl) return null;

  if (resetSuccess) {
    return (
      <AuthSplitLayout
        title="Password updated"
        subtitle="Your account is now secured with your new password."
        compact
      >
        <AuthCard className="text-center">
          <div className="auth-success-pop mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl bg-emerald-50">
            <ShieldCheck className="size-10 text-emerald-600" />
          </div>
          <AuthAlert variant="success">
            You can now sign in with your new password.
          </AuthAlert>
          <AuthButton className="mt-6" onClick={() => router.push("/login")}>
            Go to login
          </AuthButton>
          <p className="mt-4 text-xs text-neutral-400">
            Redirecting in {redirectCountdown}s...
          </p>
        </AuthCard>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      title="Reset your password"
      subtitle={
        <>
          Enter the code sent to{" "}
          <span className="font-medium text-neutral-800">{emailFromUrl}</span>
        </>
      }
      compact
    >
      <AuthCard>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-5"
        >
          <AuthOtpInput
            value={form.state.values.otp}
            onChange={(v) => form.setFieldValue("otp", v)}
            error={!!otpError}
          />

          <form.Field
            name="newPassword"
            validators={{
              onChange: ({ value }) => {
                const r = resetPasswordZodSchema.shape.newPassword.safeParse(
                  value
                );
                return r.success ? undefined : r.error.issues[0].message;
              },
            }}
          >
            {(field) => (
              <AuthPasswordField
                label="New password"
                autoComplete="new-password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                showStrength
                strengthSlot={
                  <PasswordStrengthMeter password={field.state.value} />
                }
                error={
                  field.state.meta.isTouched && field.state.meta.errors[0]
                    ? String(field.state.meta.errors[0])
                    : null
                }
              />
            )}
          </form.Field>

          <form.Field
            name="confirmPassword"
            validators={{
              onChange: ({ value, fieldApi }) => {
                const np = fieldApi.form.getFieldValue("newPassword");
                if (value !== np) return "Passwords do not match";
                return undefined;
              },
            }}
          >
            {(field) => (
              <AuthPasswordField
                label="Confirm new password"
                autoComplete="new-password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={
                  field.state.meta.isTouched && field.state.meta.errors[0]
                    ? String(field.state.meta.errors[0])
                    : null
                }
              />
            )}
          </form.Field>

          <div className="text-right">
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={handleResendOtp}
              disabled={isResending || countdown > 0}
              className="h-auto p-0 text-sm text-[#DC2626]"
            >
              {isResending
                ? "Sending..."
                : countdown > 0
                  ? `Resend in ${countdown}s`
                  : "Didn't receive the code? Resend"}
            </Button>
          </div>

          {serverError && <AuthAlert variant="error">{serverError}</AuthAlert>}

          <form.Subscribe
            selector={(s) => [s.canSubmit, s.isSubmitting] as const}
          >
            {([canSubmit, isSubmitting]) => (
              <AuthButton
                type="submit"
                isLoading={isSubmitting || isResetting}
                loadingLabel="Updating password..."
                disabled={!canSubmit}
              >
                Update password
              </AuthButton>
            )}
          </form.Subscribe>

          <Link
            href="/login"
            className="flex items-center justify-center gap-1 text-sm font-medium text-neutral-500 hover:text-[#DC2626]"
          >
            <ArrowLeft className="size-4" />
            Back to login
          </Link>
        </form>
      </AuthCard>
    </AuthSplitLayout>
  );
};

export default ResetPasswordForm;
