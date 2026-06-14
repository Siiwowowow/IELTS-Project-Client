"use client";

import * as React from "react";
import {
  
  IconLogout,
  IconAward,
  IconUser,
  IconFilePlus,
  IconNotebook,
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

const menuItems = [
  {
    title: "Exam Creator",
    url: "/teacher/dashboard",
    icon: IconFilePlus,
  },
  {
    title: "My Exams",
    url: "/teacher/exams",
    icon: IconNotebook,
  },
];

export function TeacherSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const renderMenuItems = (items: typeof menuItems) => {
    return items.map((item) => {
      const isActive = pathname === item.url;
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            asChild
            isActive={isActive}
            tooltip={item.title}
            className={`w-full transition-all duration-200 font-medium rounded-lg px-3 py-2.5 flex items-center gap-3 ${
              isActive
                ? "bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-50 hover:text-indigo-700"
                : "text-gray-700 hover:text-black hover:bg-gray-100"
            }`}
          >
            <Link href={item.url}>
              <item.icon
                size={20}
                className={
                  isActive
                    ? "text-indigo-600"
                    : "text-gray-500 group-hover:text-black"
                }
              />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });
  };

  return (
    <Sidebar className="border-r border-gray-200 bg-white text-black">
      {/* Premium Header */}
      <SidebarHeader className="p-4 border-b border-gray-200 bg-gray-50/50">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold hover:opacity-80 transition-opacity"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-100">
            <IconAward size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-wider uppercase text-black">
              IELTS Prep
            </span>
            <span className="text-[10px] text-indigo-600 font-semibold tracking-widest uppercase -mt-0.5">
              Instructor Portal
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 space-y-4">
        {/* Creator Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-widest text-gray-400 px-3 mb-2">
            Instructor Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderMenuItems(menuItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Instructor Footer Section */}
      <SidebarFooter className="p-3 border-t border-gray-200 bg-gray-50/50">
        <SidebarMenu>
          <SidebarMenuItem>
            {/* Premium Card Layout */}
            <div className="relative overflow-hidden rounded-xl bg-white border border-gray-200 p-3 mb-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <IconUser size={20} />
                  {/* miniature absolute star badge on avatar */}
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-extrabold text-white ring-2 ring-white">
                    ★
                  </span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-black truncate">
                      {user?.name || "IELTS Instructor"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium truncate mt-0.5">
                    {user?.email || "Senior Evaluator"}
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
