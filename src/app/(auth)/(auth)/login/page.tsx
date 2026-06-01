import LoginForm from "@/components/Auth/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | IELTS Prep",
  description: "Sign in to your IELTS computer-based practice account",
};

interface LoginParams {
  searchParams: Promise<{ redirect?: string; email?: string }>;
}

export default async function LoginPage({ searchParams }: LoginParams) {
  const params = await searchParams;
  return (
    <LoginForm
      redirectPath={params.redirect}
      defaultEmail={params.email || ""}
    />
  );
}
