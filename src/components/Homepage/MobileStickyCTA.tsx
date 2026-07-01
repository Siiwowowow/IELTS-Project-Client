"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MobileStickyCTA() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 p-3 backdrop-blur-md sm:hidden">
      <Button className="h-11 w-full rounded-xl font-semibold" asChild>
        <Link href="/mock-tests/full">ফ্রি মক টেস্ট দিন</Link>
      </Button>
    </div>
  );
}
