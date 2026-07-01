import { TeacherSidebar } from "@/components/layout/TeacherSidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from "next/link"
import { Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <TeacherSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/55 px-6 bg-white/70 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all" />
            <Separator orientation="vertical" className="mx-2 h-4 bg-slate-200" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/teacher/dashboard" className="text-slate-500 font-bold hover:text-indigo-650 transition-colors">
                    Teacher Portal
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-extrabold text-slate-900">Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-indigo-650 hover:bg-indigo-50/50 rounded-xl transition-all font-bold">
              <Home className="size-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </Link>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6 bg-slate-50/50 min-h-[calc(100vh-4rem)]">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
