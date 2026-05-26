// src/components/Reading/UserSidebar.tsx
"use client";

import Link from "next/link";
import { IconHome, IconBook, IconMicrophone, IconMessageCircle2, IconPencil, IconUser } from "@tabler/icons-react";

// Sample user data – in a real app this would come from auth context / API
const user = {
  name: "James Dragon",
  avatar: "https://raw.githubusercontent.com/identicons/jamesdragon/master.png",
  email: "james.dragon@example.com",
};

const navItems = [
  { href: "/", label: "Dashboard", icon: IconHome },
  { href: "/user/reading", label: "Reading", icon: IconBook },
  { href: "/user/listening", label: "Listening", icon: IconMicrophone },
  { href: "/user/writing", label: "Writing", icon: IconPencil },
  { href: "/user/speaking", label: "Speaking", icon: IconMessageCircle2 },
];

export default function UserSidebar() {
  return (
    <aside className="w-64 h-full bg-white/80 backdrop-blur-md shadow-lg rounded-xl border border-gray-100 p-6 flex flex-col gap-6">
      {/* Profile */}
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user.avatar}
          alt={user.name}
          className="w-12 h-12 rounded-full object-cover border-2 border-primary"
        />
        <div>
          <p className="font-medium text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500 truncate" title={user.email}>
            {user.email}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-3 p-2 rounded-lg text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <item.icon size={18} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer – optional quick actions */}
      <div className="text-center text-xs text-gray-400">
        © {new Date().getFullYear()} IELTS‑Project
      </div>
    </aside>
  );
}
