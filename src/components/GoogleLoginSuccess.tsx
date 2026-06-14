//src/components/GoogleLoginSuccess.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { getUserInfo } from "@/services/auth.services";

export function GoogleLoginSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser } = useUser(); // ✅ ADD THIS
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) return;
    shownRef.current = true;

    const loginStatus = searchParams.get("login");

    const fetchUser = async () => {
      try {
        const userData = await getUserInfo();
        if (userData) {
          setUser(userData); // 🔥 THIS FIXES EVERYTHING
        }
      } catch (err) {
        console.log(err);
      }
    };

    if (loginStatus === "success") {
      setTimeout(() => {
        toast.success("Logged in successfully! 🎉", {
          duration: 2500,
        });
      }, 100);

      fetchUser(); // 🔥 REFRESH USER HERE
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