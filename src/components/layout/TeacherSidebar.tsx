"use client";

import * as React from "react";
import {
  
  IconLogout,
  IconFilePlus,
  IconNotebook,
  IconWriting,
  IconMicrophone,
  IconTrophy,
  IconBook2,
} from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { useAuth } from "@/providers/AuthProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "../shared/Logo/Logo";
import { SidebarProfile } from "./SidebarProfile";

const menuItems = [
  {
    title: "Reading Creator",
    url: "/teacher/dashboard",
    icon: IconFilePlus,
  },
  {
    title: "My Reading Exams",
    url: "/teacher/exams",
    icon: IconNotebook,
  },
  {
    title: "Listening Creator",
    url: "/teacher/listening/create",
    icon: IconFilePlus,
  },
  {
    title: "My Listening Exams",
    url: "/teacher/listening/exams",
    icon: IconNotebook,
  },
  {
    title: "Writing Creator",
    url: "/teacher/writing/create",
    icon: IconWriting,
  },
  {
    title: "My Writing Exams",
    url: "/teacher/writing/exams",
    icon: IconNotebook,
  },
  {
    title: "Speaking Creator",
    url: "/teacher/speaking/create",
    icon: IconMicrophone,
  },
  {
    title: "My Speaking Exams",
    url: "/teacher/speaking/exams",
    icon: IconNotebook,
  },
  {
    title: "Full Mock Test",
    url: "/teacher/mock-tests",
    icon: IconTrophy,
  },
  {
    title: "Vocabulary",
    url: "/teacher/vocabulary",
    icon: IconBook2,
  },
];

export function TeacherSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const renderMenuItems = (items: typeof menuItems) => {
    return items.map((item) => {
      const isActive = pathname === item.url || (item.url !== "/teacher/dashboard" && pathname.startsWith(item.url));
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            asChild
            isActive={isActive}
            tooltip={item.title}
            className={`w-full relative transition-all duration-200 text-sm rounded-xl px-3.5 py-3 flex items-center gap-3 group border ${
              isActive
                ? "bg-indigo-50/80 border-indigo-100 text-indigo-700 font-bold shadow-xs shadow-indigo-100/50"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 hover:translate-x-1 font-medium"
            }`}
          >
            <Link href={item.url} className="flex items-center gap-3 w-full">
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-indigo-600" />
              )}
              <item.icon
                size={18}
                className={
                  isActive
                    ? "text-indigo-600 scale-105 transition-transform duration-200 stroke-[2.2]"
                    : "text-slate-400 group-hover:text-slate-900 transition-colors duration-200"
                }
              />
              <span className="tracking-tight">{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200/60 bg-linear-to-b from-slate-50/90 to-white/95 backdrop-blur-xl shadow-xs text-black">
      {/* Premium Header */}
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2 border-b border-slate-200/50 bg-white">
        <div className="flex items-center justify-between gap-2">
          <div className="group-data-[collapsible=icon]:hidden"><Logo compact /></div>
          <SidebarTrigger className="shrink-0" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 space-y-4">
        {/* Creator Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 mb-2">
            Instructor Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2.5">{renderMenuItems(menuItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Instructor Footer Section */}
      <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2 border-t border-slate-200/50 bg-slate-50/40">
        <SidebarProfile
          name={user?.name}
          email={user?.email}
          image={user?.uploadedImage || user?.image}
          role="Instructor"
        />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 bg-red-50/50 hover:bg-red-500/10 border border-red-500/10 rounded-lg transition-colors duration-200 font-bold"
            >
              <IconLogout size={18} />
              <span className="text-sm">Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
