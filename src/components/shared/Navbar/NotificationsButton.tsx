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
        "relative flex size-9 items-center justify-center rounded-lg text-red-100 transition-colors hover:bg-white/10 hover:text-white",
        className
      )}
    >
      <Bell className="size-[1.125rem]" strokeWidth={1.75} />
      {hasUnread && (
        <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-red-600 ring-2 ring-red-600">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
