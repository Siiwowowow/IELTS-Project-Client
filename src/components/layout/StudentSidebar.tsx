"use client";

import {
  IconBook2,
  IconHeadset,
  IconLayoutDashboard,
  IconLogout,
  IconMicrophone,
  IconPencil,
  IconTrophy,
  IconUser,
} from "@tabler/icons-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/providers/AuthProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "../shared/Logo/Logo";

const navigation = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/student/dashboard", icon: IconLayoutDashboard }],
  },
  {
    label: "Practice",
    items: [
      { title: "Reading", url: "/practice/reading", icon: IconBook2 },
      { title: "Listening", url: "/practice/listening", icon: IconHeadset },
      { title: "Writing", url: "/practice/writing", icon: IconPencil },
      { title: "Speaking", url: "/practice/speaking", icon: IconMicrophone },
      { title: "Mock Tests", url: "/student/mock-tests", icon: IconTrophy },
    ],
  },
];

export function StudentSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-neutral-200 bg-white text-neutral-900">
      <SidebarHeader className="flex h-16 justify-center border-b border-neutral-200 px-4">
        <Logo compact />
      </SidebarHeader>

      <SidebarContent className="px-3 py-5">
        {navigation.map((section) => (
          <SidebarGroup key={section.label} className="p-0 [&+&]:mt-6">
            <SidebarGroupLabel className="mb-2 h-auto px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.url || (item.url !== "/student/dashboard" && pathname.startsWith(item.url));
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className={`h-10 rounded-lg px-3 text-sm font-medium transition-colors ${isActive ? "bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"}`}>
                        <Link href={item.url}>
                          <item.icon size={18} strokeWidth={1.8} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-neutral-200 p-3">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600"><IconUser size={18} /></span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-neutral-800">{user?.name || "Student"}</p><p className="truncate text-xs text-neutral-400">{user?.email || "IELTS candidate"}</p></div>
        </div>
        <SidebarMenuButton onClick={logout} className="mt-1 h-9 rounded-lg px-3 text-sm font-medium text-neutral-500 hover:bg-red-50 hover:text-red-600">
          <IconLogout size={17} /><span>Log out</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
