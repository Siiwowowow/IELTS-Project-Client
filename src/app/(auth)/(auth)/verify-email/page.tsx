import VerifyEmailForm from "@/components/Auth/VerifyEmailForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Verify Email | IELTS Prep",
  description: "Verify your email to unlock full practice access",
};

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-page fixed inset-0 z-[100] flex items-center justify-center bg-white">
          <div className="size-8 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
