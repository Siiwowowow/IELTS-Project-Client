"use client";

import {
  resendOtpAction,
  verifyEmailAction,
} from "@/app/(auth)/(auth)/verify-email/_action";
import { AuthSplitLayout } from "@/components/Auth/layout/AuthSplitLayout";
import {
  AuthAlert,
  AuthButton,
  AuthCard,
  AuthOtpInput,
} from "@/components/Auth/ui";
import { verifyEmailZodSchema } from "@/zod/auth.validation";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const VerifyEmailForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";

  const [serverError, setServerError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [verified, setVerified] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [otpError, setOtpError] = useState(false);

  useEffect(() => {
    if (!emailFromUrl) {
      router.push("/login");
    }
  }, [emailFromUrl, router]);

  const { mutateAsync: verifyEmail, isPending: isVerifying } = useMutation({
    mutationFn: (payload: { email: string; otp: string }) =>
      verifyEmailAction(payload),
  });

  const { mutateAsync: resendOtp, isPending: isResending } = useMutation({
    mutationFn: resendOtpAction,
  });

  const form = useForm({
    defaultValues: { otp: "" },
    onSubmit: async ({ value }) => {
      setServerError(null);
      setOtpError(false);
      
      const parsed = verifyEmailZodSchema.safeParse(value);
      if (!parsed.success) {
        setServerError(parsed.error.issues[0]?.message ?? "Invalid code");
        setOtpError(true);
        return;
      }

      try {
        const result = (await verifyEmail({
          email: emailFromUrl,
          otp: value.otp,
        })) as { success: boolean; message?: string };

        if (!result.success) {
          setServerError(result.message ?? "Verification failed");
          setOtpError(true);
          toast.error(result.message);
          return;
        }

        setVerified(true);
        toast.success("Email verified successfully!");
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : "Verification failed";
        setServerError(msg);
        setOtpError(true);
        toast.error(msg);
      }
    },
  });

  // Handle redirect after verification
  useEffect(() => {
    if (!verified) return;
    
    if (redirectCountdown <= 0) {
      router.push("/login");
      return;
    }
    
    const timer = setTimeout(() => setRedirectCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [verified, redirectCountdown, router]);

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    try {
      const result = (await resendOtp(emailFromUrl)) as {
        success: boolean;
        message?: string;
      };
      
      if (result.success) {
        toast.success("A new code has been sent to your email.");
        setCountdown(60);
        setOtpError(false);
        setServerError(null);
        form.setFieldValue("otp", ""); // Clear OTP field
        
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
        toast.error(result.message ?? "Failed to resend code");
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to resend OTP"
      );
    }
  };

  // Show loading state
  if (!emailFromUrl) {
    return (
      <AuthSplitLayout title="Loading..." subtitle="Please wait" compact>
        <AuthCard>
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
          </div>
        </AuthCard>
      </AuthSplitLayout>
    );
  }

  // Show success state after verification
  if (verified) {
    return (
      <AuthSplitLayout
        title="Email verified!"
        subtitle="Your account is ready. Start practicing for your target band."
        compact
      >
        <AuthCard className="text-center">
          <div className="auth-success-pop mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl bg-emerald-50">
            <MailCheck className="size-10 text-emerald-600" />
          </div>
          <AuthAlert variant="success">
            Welcome to IELTS Prep — your full practice suite is unlocked.
          </AuthAlert>
          <AuthButton className="mt-6" onClick={() => router.push("/login")}>
            Continue to login
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
      title="Verify your email"
      subtitle={
        <>
          Enter the 6-digit code we sent to{" "}
          <span className="font-medium text-neutral-800">{emailFromUrl}</span>
        </>
      }
      compact
    >
      <AuthCard>
        <div className="mb-6 flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-ielts-red-light">
            <MailCheck className="auth-mail-icon size-8 text-[#DC2626]" />
          </div>
        </div>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-5"
        >
          <form.Field name="otp">
            {(field) => (
              <AuthOtpInput
                value={field.state.value}
                onChange={(v) => {
                  field.handleChange(v);
                  if (serverError) {
                    setServerError(null);
                    setOtpError(false);
                  }
                }}
                error={otpError}
              />
            )}
          </form.Field>

          {serverError && (
            <AuthAlert variant="error">{serverError}</AuthAlert>
          )}

          <form.Subscribe
            selector={(s) => [s.canSubmit, s.isSubmitting] as const}
          >
            {([canSubmit, isSubmitting]) => (
              <AuthButton
                type="submit"
                isLoading={isSubmitting || isVerifying}
                loadingLabel="Verifying..."
                disabled={!canSubmit || form.getFieldValue("otp").length < 6}
              >
                Verify email
              </AuthButton>
            )}
          </form.Subscribe>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={handleResendOtp}
              disabled={isResending || countdown > 0}
              className="text-sm text-[#DC2626] hover:text-ielts-red-dark"
            >
              {isResending
                ? "Sending..."
                : countdown > 0
                ? `Resend code in ${countdown}s`
                : "Didn't receive the code? Resend"}
            </Button>
          </div>

          <Link
            href="/login"
            className="flex items-center justify-center gap-1 text-sm font-medium text-neutral-500 transition-colors hover:text-[#DC2626]"
          >
            <ArrowLeft className="size-4" />
            Back to login
          </Link>
        </form>
      </AuthCard>
    </AuthSplitLayout>
  );
};

export default VerifyEmailForm;