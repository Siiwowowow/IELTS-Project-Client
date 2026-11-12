"use client"

import * as React from "react"
import {
  IconLayoutDashboard,
  IconUser,
  IconSettings,
  IconShoppingBag,
  IconHeart,
  IconLogout,
  IconBook2,
  IconHeadset,
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
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useAuth } from "@/providers/AuthProvider"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Logo from "../shared/Logo/Logo"
import { SidebarProfile } from "./SidebarProfile"

const userItems = [
  {
    title: "Dashboard",
    url: "/user/dashboard",
    icon: IconLayoutDashboard,
  },
  {
    title: "Reading Practice",
    url: "/practice/reading",
    icon: IconBook2,
  },
  {
    title: "Listening Practice",
    url: "/practice/listening",
    icon: IconHeadset,
  },
  {
    title: "My Profile",
    url: "/user/profile",
    icon: IconUser,
  },
  {
    title: "My Orders",
    url: "/user/orders",
    icon: IconShoppingBag,
  },
  {
    title: "Wishlist",
    url: "/user/wishlist",
    icon: IconHeart,
  },
  {
    title: "Settings",
    url: "/user/settings",
    icon: IconSettings,
  },
]

export function UserSidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200/60 bg-linear-to-b from-slate-50/90 to-white/95 backdrop-blur-xl shadow-xs text-black">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2 border-b border-slate-200/50 bg-white">
        <div className="flex items-center justify-between gap-2">
          <div className="group-data-[collapsible=icon]:hidden"><Logo compact /></div>
          <SidebarTrigger className="shrink-0" />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3 space-y-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 mb-2">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2.5">
              {userItems.map((item) => {
                const isActive = pathname === item.url || (item.url !== "/user/dashboard" && pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={`w-full relative transition-all duration-200 text-base rounded-lg px-3 py-2.5 flex items-center gap-3 group border border-transparent ${
                        isActive
                          ? "bg-red-600 text-white font-bold shadow-sm shadow-red-500/20 hover:bg-red-600"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-xs hover:border-slate-200/60 hover:translate-x-0.5 font-medium"
                      }`}
                    >
                      <Link href={item.url}>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white" />
                        )}
                        <item.icon
                          size={20}
                          className={
                            isActive
                              ? "text-white scale-105 transition-transform duration-200"
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
      <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2 border-t border-slate-200/50 bg-slate-50/40">
        <SidebarProfile
          name={user?.name}
          email={user?.email}
          image={user?.uploadedImage || user?.image}
          role="Member"
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
  )
}
