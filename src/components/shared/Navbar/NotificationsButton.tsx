"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  count?: number;
  className?: string;
}

export default function NotificationsButton({
  count = 0,
  className,
}: Props) {
  const hasUnread = count > 0;

  return (
    <Link
      href="/notifications"
      aria-label={
        hasUnread
          ? `Notifications, ${count} unread`
          : "Notifications"
      }
      className={cn(
        "relative flex size-9 items-center justify-center rounded-full text-neutral-700 transition-all hover:bg-neutral-100/80 hover:text-neutral-950 border border-transparent hover:border-neutral-200/60",
        className
      )}
    >
      <Bell className="size-4" strokeWidth={1.75} />
      {hasUnread && (
        <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white ring-2 ring-white shadow-2xs">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
