"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { getDashboardRoute } from "@/components/shared/Navbar/utils";
import { Loader2 } from "lucide-react";

export default function DashboardRouterPage() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If user info is not loaded or session does not exist, redirect to login
    if (user === undefined) return; // Wait for initial load

    if (!user) {
      router.replace("/login");
    } else {
      const destination = getDashboardRoute(user.role);
      router.replace(destination);
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="size-10 animate-spin text-red-600" />
        <div>
          <h2 className="text-lg font-bold text-neutral-800">Directing to Dashboard</h2>
          <p className="text-sm text-neutral-400 mt-1">Please wait while we route your session...</p>
        </div>
      </div>
    </div>
  );
}
