"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { getUserInfo } from "@/services/auth.services";
import { setTokenInCookies } from "@/lib/tokenUtils";
import { authDebug } from "@/lib/authDebug";

export function GoogleLoginSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser } = useUser();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const loginStatus = searchParams.get("login");
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const sessionToken = searchParams.get("sessionToken");

    const storeTokensAndFetchUser = async (): Promise<boolean> => {
      authDebug.info("GOOGLE_CALLBACK_RECEIVED", {
        hasAccessToken: Boolean(accessToken),
        hasRefreshToken: Boolean(refreshToken),
        hasSessionToken: Boolean(sessionToken),
      });

      if (!accessToken || !refreshToken) {
        authDebug.error("GOOGLE_CALLBACK_MISSING_TOKENS", {
          hasAccessToken: Boolean(accessToken),
          hasRefreshToken: Boolean(refreshToken),
        });
        return false;
      }

      try {
        const threeDays = 3 * 24 * 60 * 60;
        await setTokenInCookies("accessToken", accessToken, 24 * 60 * 60, threeDays);
        await setTokenInCookies("refreshToken", refreshToken, 24 * 60 * 60, threeDays);
        if (sessionToken) {
          await setTokenInCookies(
            "better-auth.session_token",
            sessionToken,
            24 * 60 * 60,
            threeDays
          );
        }

        const userData = await getUserInfo();
        if (!userData) {
          authDebug.error("GOOGLE_USER_FETCH_FAILED", {
            reason: "Tokens were stored but /auth/me returned no user",
          });
          return false;
        }

        setUser(userData);
        authDebug.info("GOOGLE_SESSION_READY", { role: userData.role });
        return true;
      } catch (error) {
        authDebug.error("GOOGLE_LOGIN_FAILED", {
          message:
            error instanceof Error ? error.message : "Unknown Google login error",
          errorType: error instanceof Error ? error.name : typeof error,
        });
        return false;
      }
    };

    const completeGoogleLogin = async () => {
      if (loginStatus === "success") {
        const success = await storeTokensAndFetchUser();
        if (success) {
          toast.success("Logged in successfully!", { duration: 2500 });
        } else {
          toast.error("Google login session could not be created.");
        }
      } else if (loginStatus === "error") {
        authDebug.error("GOOGLE_PROVIDER_REJECTED_LOGIN", {
          reason: searchParams.get("reason") || "No reason supplied",
        });
        toast.error("Login failed. Please try again.", { duration: 2500 });
      }

      router.replace("/");
    };

    void completeGoogleLogin();
  }, [searchParams, router, setUser]);

  return null;
}
