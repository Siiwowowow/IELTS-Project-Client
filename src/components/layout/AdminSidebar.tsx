"use client"

import * as React from "react"
import {
  IconLayoutDashboard,
  IconUsers,
  IconSettings,
  IconLogs,
  IconUserCircle,
  IconLogout,
} from "@tabler/icons-react"

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
} from "@/components/ui/sidebar"
import { useAuth } from "@/providers/AuthProvider"
import Link from "next/link"
import { usePathname } from "next/navigation"

const adminItems = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: IconLayoutDashboard,
  },
  {
    title: "User Management",
    url: "/admin/users",
    icon: IconUsers,
  },
  {
    title: "System Logs",
    url: "/admin/logs",
    icon: IconLogs,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: IconSettings,
  },
]

export function AdminSidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-slate-200/60 bg-linear-to-b from-slate-50/90 to-white/95 backdrop-blur-xl shadow-xs text-black">
      <SidebarHeader className="p-4 border-b border-slate-200/50 bg-slate-50/40">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold hover:opacity-80 transition-opacity group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-200/50 ring-1 ring-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
            <IconUserCircle size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-wider uppercase text-slate-900">
              IELTS Prep
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold tracking-widest uppercase -mt-0.5">
              Admin Portal
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3 space-y-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 mb-2">Administrative</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2.5">
              {adminItems.map((item) => {
                const isActive = pathname === item.url || (item.url !== "/admin/dashboard" && pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={`w-full relative transition-all duration-200 text-base rounded-lg px-3 py-2.5 flex items-center gap-3 group border border-transparent ${
                        isActive
                          ? "bg-red-600 text-black font-bold shadow-sm shadow-red-500/10 hover:bg-red-600"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-xs hover:border-slate-200/60 hover:translate-x-0.5 font-medium"
                      }`}
                    >
                      <Link href={item.url}>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-black" />
                        )}
                        <item.icon
                          size={20}
                          className={
                            isActive
                              ? "text-black scale-105 transition-transform duration-200"
                              : "text-slate-400 group-hover:text-slate-900 transition-colors duration-200"
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
      <SidebarFooter className="p-3 border-t border-slate-200/50 bg-slate-50/40">
        <SidebarMenu>
          <SidebarMenuItem>
            {/* Premium Card Layout */}
            <div className="relative overflow-hidden rounded-xl bg-white border border-slate-200/55 p-3 mb-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/50 shadow-inner">
                  <IconUserCircle size={20} />
                  {/* Miniature absolute crown badge on avatar */}
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-extrabold text-white ring-2 ring-white">
                    ★
                  </span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-800 truncate">
                      {user?.name || "Admin"}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    {user?.email}
                  </span>
                </div>
              </div>
            </div>
            {/* Logout Trigger */}
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
  )
}
