import RegisterForm from "@/components/Auth/RegisterForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | IELTS Prep",
  description: "Register for realistic IELTS computer-based practice",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
