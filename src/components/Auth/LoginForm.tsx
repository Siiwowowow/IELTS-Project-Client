/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { loginAction } from "@/app/(auth)/(auth)/login/_action";
import { AuthSplitLayout } from "@/components/Auth/layout/AuthSplitLayout";
import {
  AuthAlert,
  AuthButton,
  AuthCard,
  AuthCheckbox,
  AuthInput,
  AuthPasswordField,
  AuthSocialButtons,
} from "@/components/Auth/ui";
import { UserRole, getDefaultDashboardRoute } from "@/lib/authUtils";
import { authDebug } from "@/lib/authDebug";
import { useUser } from "@/hooks/useUser";
import { ILoginPayload, loginZodSchema } from "@/zod/auth.validation";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface LoginFormProps {
  redirectPath?: string;
  defaultEmail?: string;
  socialError?: string;
}

const REMEMBER_KEY = "ielts_remember_email";

const LoginForm = ({ redirectPath, defaultEmail = "", socialError }: LoginFormProps) => {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { setUser } = useUser();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: ILoginPayload) => loginAction(payload, redirectPath),
  });

  const form = useForm({
    defaultValues: {
      email: defaultEmail,
      password: "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      authDebug.info("LOGIN_SUBMITTED", {
        redirectRequested: redirectPath || null,
      });
      try {
        const result = (await mutateAsync(value)) as {
          success: boolean;
          message?: string;
          user?: { role?: string };
          redirectUrl?: string;
          debug?: { requestId: string; code: string; status?: number };
        };

        if (!result.success) {
          authDebug.error("LOGIN_FAILED", {
            message: result.message || "Login failed",
            ...result.debug,
          });
          setServerError(result.message || "Login failed");
          return;
        }

        if (rememberMe) {
          localStorage.setItem(REMEMBER_KEY, value.email);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }

        setIsRedirecting(true);
        setLoginSuccess(true);
        authDebug.info("LOGIN_SUCCEEDED", {
          role: result.user?.role || null,
          redirectUrl: result.redirectUrl || null,
          ...result.debug,
        });
        toast.success("Welcome back! Redirecting...");
        setUser(result.user as Parameters<typeof setUser>[0]);

        const destination =
          result.redirectUrl ||
          (result.user?.role
            ? getDefaultDashboardRoute(result.user.role as UserRole)
            : "/");

        // Cookies from the server action are committed before this resolves,
        // so a client transition avoids reloading the entire application.
        router.replace(destination);
      } catch (error: unknown) {
        setIsRedirecting(false);
        setLoginSuccess(false);
        const message = error instanceof Error ? error.message : "Login failed";
        authDebug.error("LOGIN_ACTION_CRASHED", {
          message,
          errorType: error instanceof Error ? error.name : typeof error,
        });
        setServerError(message);
      }
    },
  });

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setRememberMe(true);
      if (!defaultEmail) form.setFieldValue("email", saved);
    }
  }, [defaultEmail, form]);

  useEffect(() => {
    if (!socialError) return;
    toast.error(
      socialError === "social_account_not_student"
        ? "This Google email belongs to an admin or teacher account. Choose a different student Google account."
        : socialError === "social_login_failed"
          ? "Social sign-in failed. Please try another Google account or sign in with email."
          : "Social sign-in could not be completed. Please try again."
    );
  }, [socialError]);

  return (
    <AuthSplitLayout
      title="Welcome back"
      subtitle="Sign in to continue your IELTS preparation journey."
      footer={
        <p>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#DC2626] hover:underline"
          >
            Create free account
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
            validators={{ onChange: loginZodSchema.shape.email }}
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
                    ? typeof field.state.meta.errors[0] === 'string'
                      ? field.state.meta.errors[0]
                      : (field.state.meta.errors[0] as any)?.message || "Invalid input"
                    : null
                }
              />
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{ onChange: loginZodSchema.shape.password }}
          >
            {(field) => (
              <AuthPasswordField
                label="Password"
                autoComplete="current-password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={
                  field.state.meta.isTouched && field.state.meta.errors[0]
                    ? typeof field.state.meta.errors[0] === 'string'
                      ? field.state.meta.errors[0]
                      : (field.state.meta.errors[0] as any)?.message || "Invalid input"
                    : null
                }
              />
            )}
          </form.Field>

          <div className="flex items-center justify-between gap-4">
            <AuthCheckbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={setRememberMe}
              label="Remember me"
            />
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-[#DC2626] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {serverError && <AuthAlert variant="error">{serverError}</AuthAlert>}

          <form.Subscribe
            selector={(s) => [s.canSubmit, s.isSubmitting] as const}
          >
            {([canSubmit, isSubmitting]) => (
              <AuthButton
                type="submit"
                isLoading={isSubmitting || isPending || isRedirecting}
                loadingLabel={isRedirecting ? "Redirecting..." : "Signing in..."}
                success={loginSuccess && !isRedirecting}
                disabled={!canSubmit || isRedirecting}
              >
                Sign in
              </AuthButton>
            )}
          </form.Subscribe>

          <AuthSocialButtons mode="login" />
        </form>
      </AuthCard>
    </AuthSplitLayout>
  );
};

export default LoginForm;
