"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Check,
  FilePenLine,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Loader2,
  Mic2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react";
import { adminService, type ManagedStatus, type ManagedUser } from "@/services/admin.services";
import { cn } from "@/lib/utils";

const statusStyle: Record<ManagedStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  PENDING_VERIFICATION: "bg-amber-50 text-amber-700 ring-amber-600/10",
  BLOCKED: "bg-red-50 text-red-700 ring-red-600/10",
  DELETED: "bg-slate-100 text-slate-500 ring-slate-500/10",
};

const statusLabel: Record<ManagedStatus, string> = {
  ACTIVE: "Active",
  PENDING_VERIFICATION: "Pending",
  BLOCKED: "Blocked",
  DELETED: "Deleted",
};

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const overview = useQuery({ queryKey: ["admin-overview"], queryFn: adminService.getOverview });
  const users = useQuery({
    queryKey: ["managed-users", search, role, status, includeDeleted],
    queryFn: () => adminService.getUsers({ search: search || undefined, role: role || undefined, status: status || undefined, includeDeleted, limit: 8 }),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    void queryClient.invalidateQueries({ queryKey: ["managed-users"] });
  };

  const statusMutation = useMutation({ mutationFn: ({ id, next }: { id: string; next: ManagedStatus }) => adminService.updateStatus(id, next), onSuccess: refresh });
  const deleteMutation = useMutation({ mutationFn: adminService.deleteUser, onSuccess: refresh });

  const stats = overview.data?.data;
  const visibleUsers = useMemo(() => (users.data?.data ?? []).slice(0, 8), [users.data?.data]);
  const content = [
    { label: "Reading exams", count: stats?.contentCounts?.reading ?? 0, href: "/admin/exams?tab=reading", icon: BookOpen, color: "text-blue-600 bg-blue-50" },
    { label: "Listening exams", count: stats?.contentCounts?.listening ?? 0, href: "/admin/exams?tab=listening", icon: Headphones, color: "text-violet-600 bg-violet-50" },
    { label: "Writing exams", count: stats?.contentCounts?.writing ?? 0, href: "/admin/exams?tab=writing", icon: FilePenLine, color: "text-orange-600 bg-orange-50" },
    { label: "Speaking exams", count: stats?.contentCounts?.speaking ?? 0, href: "/admin/exams?tab=speaking", icon: Mic2, color: "text-rose-600 bg-rose-50" },
    { label: "Full mock tests", count: stats?.contentCounts?.mockTests ?? 0, href: "/admin/mock-tests", icon: LayoutDashboard, color: "text-emerald-600 bg-emerald-50" },
    { label: "Vocabulary", count: stats?.contentCounts?.vocabulary ?? 0, href: "/admin/vocabulary", icon: GraduationCap, color: "text-cyan-600 bg-cyan-50" },
  ];
  const contentLoading = overview.isLoading;

  const changeStatus = (user: ManagedUser, next: ManagedStatus) => {
    const action = next === "ACTIVE" ? "activate" : next === "BLOCKED" ? "block" : "update";
    if (window.confirm(`Are you sure you want to ${action} ${user.name || user.email}?`)) statusMutation.mutate({ id: user.id, next });
  };
  const remove = (user: ManagedUser) => {
    if (window.confirm(`Delete ${user.name || user.email}? This will revoke all active sessions.`)) deleteMutation.mutate(user.id);
  };

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-7 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-red-600"><ShieldCheck className="size-4" /> Administration</div>
          <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">Control center</h1>
          <p className="mt-2 text-sm text-slate-500">Manage users, exams and learning content from one workspace.</p>
        </div>
        <button onClick={refresh} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
          <RefreshCw className={cn("size-4", (overview.isFetching || users.isFetching) && "animate-spin")} /> Refresh data
        </button>
      </header>

      {overview.isError && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <p className="font-bold">Admin API is not available on the running backend.</p>
          <p className="mt-1 text-amber-800">The missing `/admin` router has been connected in the backend source. Restart or redeploy the backend once to activate it.</p>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total users" value={stats?.total} icon={Users} loading={overview.isLoading} />
        <Metric label="Active accounts" value={stats?.active} icon={Activity} loading={overview.isLoading} accent="emerald" />
        <Metric label="Teachers" value={stats?.teachers} icon={ShieldCheck} loading={overview.isLoading} accent="blue" />
        <Metric label="Pending review" value={stats?.pending} icon={UserCheck} loading={overview.isLoading} accent="amber" />
      </section>

      <section id="content" className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="font-extrabold text-slate-950">Content management</h2><p className="mt-1 text-xs text-slate-500">Open any module to create, edit, publish or remove content.</p></div>{contentLoading && <Loader2 className="size-4 animate-spin text-slate-400" />}</div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {content.map(({ label, count, href, icon: Icon, color }) => (
            <Link key={label} href={href} className="group flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
              <span className={cn("grid size-11 place-items-center rounded-xl", color)}><Icon className="size-5" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-800">{label}</span><span className="mt-1 block text-xs text-slate-400">{contentLoading ? "Loading…" : `${count} items`}</span></span>
              <ArrowUpRight className="size-4 text-slate-300 transition group-hover:text-slate-700" />
            </Link>
          ))}
        </div>
      </section>

      <section id="users" className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="font-extrabold text-slate-950">User management</h2><p className="mt-1 text-xs text-slate-500">Approve, block and manage student or teacher access.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-red-300 focus:bg-white sm:w-56" /></div>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600"><option value="">All roles</option><option value="STUDENT">Students</option><option value="TEACHER">Teachers</option></select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600"><option value="">All status</option><option value="ACTIVE">Active</option><option value="PENDING_VERIFICATION">Pending</option><option value="BLOCKED">Blocked</option></select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3 font-bold">Account</th><th className="px-5 py-3 font-bold">Role</th><th className="px-5 py-3 font-bold">Status</th><th className="px-5 py-3 font-bold">Joined</th><th className="px-5 py-3 text-right font-bold">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {users.isLoading ? <tr><td colSpan={5} className="p-14 text-center"><Loader2 className="mx-auto size-5 animate-spin text-slate-400" /></td></tr> : visibleUsers.length ? visibleUsers.map((user) => (
                <tr key={user.id} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-sm font-black text-slate-600">{(user.name || user.email)[0].toUpperCase()}</span><div><p className="text-sm font-bold text-slate-800">{user.name || "Unnamed user"}</p><p className="mt-0.5 text-xs text-slate-400">{user.email}</p></div></div></td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-600">{user.role === "TEACHER" ? "Teacher" : "Student"}</td>
                  <td className="px-5 py-4"><span className={cn("rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset", statusStyle[user.status])}>{statusLabel[user.status]}</span></td>
                  <td className="px-5 py-4 text-sm text-slate-500">{new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(user.createdAt))}</td>
                  <td className="px-5 py-4"><div className="flex justify-end gap-1">{user.status !== "ACTIVE" && !user.isDeleted && <Action title="Activate" onClick={() => changeStatus(user, "ACTIVE")} className="text-emerald-600 hover:bg-emerald-50"><Check /></Action>}{user.status !== "BLOCKED" && !user.isDeleted && <Action title="Block" onClick={() => changeStatus(user, "BLOCKED")} className="text-amber-600 hover:bg-amber-50"><UserX /></Action>}{user.status === "BLOCKED" && <Action title="Unblock" onClick={() => changeStatus(user, "ACTIVE")} className="text-blue-600 hover:bg-blue-50"><X /></Action>}{!user.isDeleted && <Action title="Delete" onClick={() => remove(user)} className="text-red-600 hover:bg-red-50"><Trash2 /></Action>}</div></td>
                </tr>
              )) : <tr><td colSpan={5} className="p-14 text-center text-sm text-slate-500">No users match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500"><label className="flex items-center gap-2"><input type="checkbox" checked={includeDeleted} onChange={(e) => setIncludeDeleted(e.target.checked)} /> Include deleted</label><Link href="/admin/users" className="font-bold text-red-600 hover:underline">View all users</Link></div>
      </section>
    </main>
  );
}

function Metric({ label, value, icon: Icon, loading, accent = "slate" }: { label: string; value?: number; icon: typeof Users; loading: boolean; accent?: "slate" | "emerald" | "blue" | "amber" }) {
  const accents = { slate: "bg-slate-100 text-slate-600", emerald: "bg-emerald-50 text-emerald-600", blue: "bg-blue-50 text-blue-600", amber: "bg-amber-50 text-amber-600" };
  return <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{loading ? "—" : value ?? 0}</p></div><span className={cn("grid size-10 place-items-center rounded-xl", accents[accent])}><Icon className="size-[18px]" /></span></div></article>;
}

function Action({ title, onClick, className, children }: { title: string; onClick: () => void; className: string; children: React.ReactElement<{ className?: string }> }) {
  return <button title={title} aria-label={title} onClick={onClick} className={cn("grid size-8 place-items-center rounded-lg transition", className)}>{children}</button>;
}
