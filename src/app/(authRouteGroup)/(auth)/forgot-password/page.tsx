import ForgotPasswordForm from "@/components/Auth/ForgotPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | IELTS Prep",
  description: "Reset your IELTS Prep account password",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
