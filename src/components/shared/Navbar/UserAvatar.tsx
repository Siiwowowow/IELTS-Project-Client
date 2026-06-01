"use client";

import { useUser } from "@/hooks/useUser";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import {
  LogOut,
  User as UserIcon,
  Settings,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";

const getInitials = (name?: string, email?: string): string => {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  if (email) return email[0].toUpperCase();

  return "U";
};

interface UserAvatarProps {
  compact?: boolean;
}

export default function UserAvatar({
  compact = false,
}: UserAvatarProps) {
  const { user, logout } = useUser();

  const [open, setOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = getInitials(user?.name, user?.email);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  const handleLogout = async () => {
    setOpen(false);

    toast.loading("Logging out...", {
      id: "logout",
    });

    await logout();

    toast.success("Logged out successfully!", {
      id: "logout",
    });
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Avatar Trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open user menu"
        className="
          rounded-full
          ring-2
          ring-transparent
          transition-all
          duration-300
          hover:ring-red-200
          hover:scale-105
          focus:outline-none
        "
      >
        <Avatar
          size={compact ? "default" : "lg"}
          className="
            border-2
            border-white
            shadow-md
            transition-all
            duration-300
            hover:shadow-lg
          "
        >
          {user?.image && (
            <AvatarImage
              src={user.image}
              alt={user?.name || "User"}
              referrerPolicy="no-referrer"
            />
          )}

          <AvatarFallback className="bg-red-50 text-red-600 font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute
            right-0
            top-14
            z-50
            w-72
            overflow-hidden
            rounded-2xl
            border
            border-white/20
            bg-white/90
            backdrop-blur-xl
            shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)]
            animate-in
            fade-in-0
            zoom-in-95
            duration-200
          "
        >
          {/* Header */}
          <div className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-red-50 px-5 py-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.08),transparent)]" />

            <div className="relative flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-red-100 shadow-md">
                {user?.image && (
                  <AvatarImage
                    src={user.image}
                    alt={user?.name || "User"}
                    referrerPolicy="no-referrer"
                  />
                )}

                <AvatarFallback className="bg-red-50 text-lg font-bold text-red-600">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-gray-900">
                  {user?.name || "IELTS Candidate"}
                </h3>

                <p className="mt-1 truncate text-xs text-gray-500">
                  {user?.email}
                </p>

                <div className="mt-2 inline-flex items-center rounded-full bg-red-100 px-2 py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                   {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu */}
          <div className="p-2">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="
                flex
                items-center
                gap-3
                rounded-xl
                px-3
                py-3
                text-sm
                font-medium
                text-gray-700
                transition-all
                hover:bg-red-50
                hover:text-red-600
              "
            >
              <UserIcon className="h-4 w-4" />

              <span>My Profile</span>

              <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
            </Link>

            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="
                flex
                items-center
                gap-3
                rounded-xl
                px-3
                py-3
                text-sm
                font-medium
                text-gray-700
                transition-all
                hover:bg-red-50
                hover:text-red-600
              "
            >
              <Settings className="h-4 w-4" />

              <span>Account Settings</span>

              <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 p-2">
            <button
              onClick={handleLogout}
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                px-3
                py-3
                text-left
                text-sm
                font-semibold
                text-red-600
                transition-all
                hover:bg-red-50
              "
            >
              <LogOut className="h-4 w-4" />

              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}