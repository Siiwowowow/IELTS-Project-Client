"use client";

import * as React from "react";
import {
  IconLayoutDashboard,
  IconUser,
  IconBook2,
  IconHeadset,
  IconMicrophone,
  IconPencil,
  IconLogout,
  IconTrophy,
  IconCrown, // Added for the premium aesthetic
} from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
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

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/student/dashboard",
    icon: IconLayoutDashboard,
  },
];

const practiceItems = [
  {
    title: "Reading",
    url: "/practice/reading",
    icon: IconBook2,
  },
  {
    title: "Listening",
    url: "/practice/listening",
    icon: IconHeadset,
  },
  {
    title: "Writing",
    url: "/practice/writing",
    icon: IconPencil,
  },
  {
    title: "Speaking",
    url: "/practice/speaking",
    icon: IconMicrophone,
  },
  {
    title: "Mock Tests",
    url: "/student/mock-tests",
    icon: IconTrophy,
  },
];

export function StudentSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-gray-200 bg-white text-black">
      {/* Premium Header */}
      <SidebarHeader className="p-4 border-b border-gray-200 bg-gray-50/50">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold hover:opacity-80 transition-opacity"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-md">
            <IconCrown size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-wider uppercase text-black">
              IELTS Prep
            </span>
            <span className="text-[10px] text-gray-500 font-semibold tracking-widest uppercase -mt-0.5">
              Premium Academic
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 space-y-4">
        {/* Overview Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-widest text-gray-400 px-3 mb-2">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={`w-full transition-all duration-200 font-medium rounded-lg px-3 py-2.5 flex items-center gap-3 ${
                        isActive
                          ? "bg-red-50 text-red-600 font-bold hover:bg-red-50 hover:text-red-700"
                          : "text-gray-700 hover:text-black hover:bg-gray-100"
                      }`}
                    >
                      <Link href={item.url}>
                        <item.icon
                          size={20}
                          className={
                            isActive
                              ? "text-red-600"
                              : "text-gray-500 group-hover:text-black"
                          }
                        />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Practice Zone Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-widest text-gray-400 px-3 mb-2">
            Practice Zone
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {practiceItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={`w-full transition-all duration-200 font-medium rounded-lg px-3 py-2.5 flex items-center gap-3 ${
                        isActive
                          ? "bg-red-50 text-red-600 font-bold hover:bg-red-50 hover:text-red-700"
                          : "text-gray-700 hover:text-black hover:bg-gray-100"
                      }`}
                    >
                      <Link href={item.url}>
                        <item.icon
                          size={20}
                          className={
                            isActive
                              ? "text-red-600"
                              : "text-gray-500 group-hover:text-black"
                          }
                        />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Premium User Footer Section */}
      <SidebarFooter className="p-3 border-t border-gray-200 bg-gray-50/50">
        <SidebarMenu>
          <SidebarMenuItem>
            {/* Premium Card Layout */}
            <div className="relative overflow-hidden rounded-xl bg-white border border-gray-200 p-3 mb-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-black border border-gray-200">
                  <IconUser size={20} />
                  {/* Miniature absolute crown badge on avatar */}
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-extrabold text-white ring-2 ring-white">
                    ★
                  </span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-black truncate">
                      {user?.name || "Premium Student"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium truncate mt-0.5">
                    {user?.email || "Target Band: 7.5"}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout Trigger */}
            <SidebarMenuButton
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200 font-bold"
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
