import { Suspense } from "react";
import { GoogleLoginSuccess } from "@/components/GoogleLoginSuccess";
import { LandingPage } from "@/components/LandingPage/LandingPage";

export default function Page() {
  return (
    <>
      <Suspense fallback={null}>
        <GoogleLoginSuccess />
      </Suspense>
      <LandingPage />
    </>
  );
}
