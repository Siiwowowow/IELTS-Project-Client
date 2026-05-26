"use client";

import { loginAction } from "@/app/(authRouteGroup)/(auth)/login/_action";
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
}

const REMEMBER_KEY = "ielts_remember_email";

const LoginForm = ({ redirectPath, defaultEmail = "" }: LoginFormProps) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const router = useRouter();
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
      try {
        const result = (await mutateAsync(value)) as {
          success: boolean;
          message?: string;
          user?: { role?: string };
          redirectUrl?: string;
        };

        if (!result.success) {
          setServerError(result.message || "Login failed");
          return;
        }

        if (rememberMe) {
          localStorage.setItem(REMEMBER_KEY, value.email);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }

        setLoginSuccess(true);
        toast.success("Welcome back! Redirecting...");
        setUser(result.user as Parameters<typeof setUser>[0]);
        router.refresh();

        setTimeout(() => {
          if (result.redirectUrl) {
            router.push(result.redirectUrl);
          } else {
            const role = result.user?.role as UserRole;
            router.push(getDefaultDashboardRoute(role));
          }
        }, 800);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Login failed";
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
                    ? String(field.state.meta.errors[0])
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
                    ? String(field.state.meta.errors[0])
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
                isLoading={isSubmitting || isPending}
                loadingLabel="Signing in..."
                success={loginSuccess}
                disabled={!canSubmit}
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
