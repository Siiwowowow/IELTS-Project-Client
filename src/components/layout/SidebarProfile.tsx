"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

interface SidebarProfileProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
}

export function SidebarProfile({ name, email, image, role }: SidebarProfileProps) {
  const displayName = name?.trim() || role;
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || email?.[0]?.toUpperCase() || "U";
  const avatar = (
    <Avatar
      role="img"
      aria-label={`${displayName} profile`}
      className="border-2 border-white bg-indigo-50 text-indigo-700 shadow-sm ring-2 ring-indigo-100"
    >
      {image && <AvatarImage src={image} alt="" referrerPolicy="no-referrer" />}
      <AvatarFallback className="bg-indigo-50 text-xs font-extrabold text-indigo-700">
        {initials}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <>
      <div className="group-data-[collapsible=icon]:hidden">
        <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-indigo-50/60 p-3 shadow-sm">
          <Avatar
            size="lg"
            role="img"
            aria-label={`${displayName} profile`}
            className="border-2 border-white bg-indigo-50 text-indigo-700 shadow-sm ring-2 ring-indigo-100"
          >
            {image && <AvatarImage src={image} alt="" referrerPolicy="no-referrer" />}
            <AvatarFallback className="bg-indigo-50 text-sm font-extrabold text-indigo-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-800">{displayName}</p>
            {email && <p className="mt-0.5 truncate text-xs text-slate-500">{email}</p>}
            <span className="mt-1.5 inline-flex max-w-full items-center rounded-full bg-indigo-100/80 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-indigo-700">
              {role}
            </span>
          </div>
        </div>
      </div>
      <div className="hidden justify-center group-data-[collapsible=icon]:flex">
        <div title={`${displayName}${email ? ` | ${email}` : ""}`} className="rounded-full transition hover:bg-indigo-50">
          {avatar}
        </div>
      </div>
    </>
  );
}
