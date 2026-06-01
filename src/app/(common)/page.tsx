import { Suspense } from "react";
import { GoogleLoginSuccess } from "@/components/GoogleLoginSuccess";
import { Homepage } from "@/components/Homepage";

export default function Page() {
  return (
    <>
      <Suspense fallback={null}>
        <GoogleLoginSuccess />
      </Suspense>
      <Homepage />
    </>
  );
}
