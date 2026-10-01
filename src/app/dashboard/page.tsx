"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { getDashboardRoute } from "@/components/shared/Navbar/utils";
import { Loader2 } from "lucide-react";

export default function DashboardRouterPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Wait until session is hydrated
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
    } else {
      const destination = getDashboardRoute(user.role);
      router.replace(destination);
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="size-10 animate-spin text-[#DC2626]" />
        <div>
          <h2 className="text-lg font-bold text-neutral-800">Directing to Dashboard</h2>
          <p className="text-sm text-neutral-400 mt-1">Please wait while we route your session...</p>
        </div>
      </div>
    </div>
  );
}
