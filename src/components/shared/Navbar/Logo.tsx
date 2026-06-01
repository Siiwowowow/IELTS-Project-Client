import { BookOpenCheck } from "lucide-react";
import Link from "next/link";

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="group flex shrink-0 items-center gap-3 transition-opacity hover:opacity-90"
    >
      <div className="relative flex size-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-white/20 transition-shadow group-hover:shadow-md">
        <BookOpenCheck
          className="size-5 text-red-600"
          strokeWidth={2}
          aria-hidden
        />
      </div>

      {!compact && (
        <div className="hidden sm:block leading-tight">
          <span className="block text-[1.05rem] font-bold tracking-tight text-white">
            IELTS<span className="text-red-200">CBT</span>
          </span>
          <span className="block text-[0.65rem] font-medium uppercase tracking-[0.12em] text-red-100">
            Exam Preparation
          </span>
        </div>
      )}
    </Link>
  );
}
