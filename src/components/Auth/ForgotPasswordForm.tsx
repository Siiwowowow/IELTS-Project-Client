"use client";

import { forgotPasswordAction } from "@/app/(authRouteGroup)/(auth)/forgot-password/_action";
import { AuthSplitLayout } from "@/components/Auth/layout/AuthSplitLayout";
import {
  AuthAlert,
  AuthButton,
  AuthCard,
  AuthInput,
} from "@/components/Auth/ui";
import { forgotPasswordZodSchema } from "@/zod/auth.validation";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const ForgotPasswordForm = () => {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [countdown, setCountdown] = useState(5);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: { email: string }) => forgotPasswordAction(payload),
  });

  const form = useForm({
    defaultValues: { email: "" },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        const result = (await mutateAsync(value)) as {
          success: boolean;
          message?: string;
        };

        if (!result.success) {
          const msg = result.message || "Failed to send reset code";
          setServerError(msg);
          toast.error(msg);
          return;
        }

        setSubmittedEmail(value.email);
        setIsSubmitted(true);
        toast.success(result.message ?? "Reset code sent!");
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : "Failed to send reset code";
        setServerError(msg);
        toast.error(msg);
      }
    },
  });

  useEffect(() => {
    if (!isSubmitted) return;
    if (countdown <= 0) {
      router.push(
        `/reset-password?email=${encodeURIComponent(submittedEmail)}`
      );
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [isSubmitted, countdown, submittedEmail, router]);

  if (isSubmitted) {
    return (
      <AuthSplitLayout
        title="Check your email"
        subtitle="We've sent a password reset code to your inbox."
        compact
      >
        <AuthCard className="text-center">
          <div className="auth-success-pop mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl bg-[#fef2f2]">
            <Mail className="auth-mail-icon size-10 text-[#DC2626]" />
          </div>
          <p className="text-sm text-neutral-600">
            Code sent to{" "}
            <span className="font-semibold text-neutral-900">
              {submittedEmail}
            </span>
          </p>
          <div className="mt-6 space-y-3 rounded-xl border border-neutral-100 bg-neutral-50 p-4 text-left text-sm text-neutral-600">
            <p className="font-medium text-neutral-800">Next steps</p>
            <ol className="list-decimal space-y-1 pl-4">
              <li>Check your inbox and spam folder</li>
              <li>Copy the 6-digit verification code</li>
              <li>Create your new secure password</li>
            </ol>
          </div>
          <AuthButton
            className="mt-6"
            onClick={() =>
              router.push(
                `/reset-password?email=${encodeURIComponent(submittedEmail)}`
              )
            }
          >
            Continue to reset password
          </AuthButton>
          <p className="mt-4 text-xs text-neutral-400">
            Redirecting in {countdown}s...
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#DC2626] hover:underline"
          >
            <ArrowLeft className="size-4" />
            Back to login
          </Link>
        </AuthCard>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      title="Forgot password?"
      subtitle="No worries — enter your email and we'll send you a reset code."
      compact
      footer={
        <p>
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#DC2626] hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
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
          <form.Field
            name="email"
            validators={{ onChange: forgotPasswordZodSchema.shape.email }}
          >
            {(field) => (
              <AuthInput
                label="Email address"
                type="email"
                autoComplete="email"
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

          {serverError && <AuthAlert variant="error">{serverError}</AuthAlert>}

          <form.Subscribe
            selector={(s) => [s.canSubmit, s.isSubmitting] as const}
          >
            {([canSubmit, isSubmitting]) => (
              <AuthButton
                type="submit"
                isLoading={isSubmitting || isPending}
                loadingLabel="Sending code..."
                disabled={!canSubmit}
              >
                Send reset code
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

export default ForgotPasswordForm;
