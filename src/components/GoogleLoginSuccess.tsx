//src/components/GoogleLoginSuccess.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { getUserInfo } from "@/services/auth.services";
import { setTokenInCookies } from "@/lib/tokenUtils";

export function GoogleLoginSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser } = useUser(); // ✅ ADD THIS
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) return;
    shownRef.current = true;

    const loginStatus = searchParams.get("login");
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const sessionToken = searchParams.get("sessionToken");

    const storeTokensAndFetchUser = async () => {
      try {
        const threeDays = 3 * 24 * 60 * 60;
        
        // 1. Store tokens in frontend domain cookies
        if (accessToken) {
          await setTokenInCookies("accessToken", accessToken, 24 * 60 * 60, threeDays);
        }
        if (refreshToken) {
          await setTokenInCookies("refreshToken", refreshToken, 24 * 60 * 60, threeDays);
        }
        if (sessionToken) {
          await setTokenInCookies("better-auth.session_token", sessionToken, 24 * 60 * 60, threeDays);
        }

        // 2. Fetch user details from backend using the now-accessible cookies
        const userData = await getUserInfo();
        if (userData) {
          setUser(userData); // 🔥 THIS FIXES EVERYTHING
        }
      } catch (err) {
        console.error("Error storing tokens or fetching user:", err);
      }
    };

    if (loginStatus === "success") {
      setTimeout(() => {
        toast.success("Logged in successfully! 🎉", {
          duration: 2500,
        });
      }, 100);

      storeTokensAndFetchUser(); // 🔥 STORE TOKENS & REFRESH USER HERE
    }

    if (loginStatus === "error") {
      setTimeout(() => {
        toast.error("Login failed. Please try again.", {
          duration: 2500,
        });
      }, 100);
    }

    router.replace("/");
  }, [searchParams, router, setUser]);

  return null;
}