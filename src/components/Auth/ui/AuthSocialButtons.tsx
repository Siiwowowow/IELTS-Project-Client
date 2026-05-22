"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

type AuthSocialButtonsProps = {
  mode?: "login" | "register";
  className?: string;
};

export function AuthSocialButtons({ mode = "login", className }: AuthSocialButtonsProps) {
  const label = mode === "login" ? "Sign in" : "Sign up";

  const handleGoogle = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) return;
    const redirect = encodeURIComponent("/");
    window.location.href = `${baseUrl}/auth/login/google?redirect=${redirect}`;
  };

  const handleGitHub = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) return;
    const redirect = encodeURIComponent("/");
    window.location.href = `${baseUrl}/auth/login/github?redirect=${redirect}`;
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-100" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs font-medium uppercase tracking-wide text-neutral-400">
            Or continue with
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogle}
          className="h-11 gap-2 rounded-xl border-neutral-200 bg-white text-sm font-medium text-neutral-700 shadow-sm transition-all hover:border-[#DC2626]/30 hover:bg-neutral-50 active:scale-[0.98]"
        >
          <GoogleIcon />
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleGitHub}
          className="h-11 gap-2 rounded-xl border-neutral-200 bg-white text-sm font-medium text-neutral-700 shadow-sm transition-all hover:border-neutral-400 hover:bg-neutral-50 active:scale-[0.98]"
        >
          <GitHubIcon />
          GitHub
        </Button>
      </div>
      <p className="text-center text-[11px] text-neutral-400">
        {label} securely — we never post without permission
      </p>
    </div>
  );
}
