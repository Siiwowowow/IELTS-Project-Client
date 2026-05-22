import ResetPasswordForm from "@/components/Auth/ResetPasswordForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Reset Password | IELTS Prep",
  description: "Create a new secure password",
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-page fixed inset-0 z-[100] flex items-center justify-center bg-white">
          <div className="size-8 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
