"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  IconAlertCircle,
  IconArrowRight,
  IconBook2,
  IconChartLine,
  IconCheck,
  IconClock,
  IconHeadset,
  IconLoader2,
  IconMicrophone,
  IconPencil,
  IconPlayerPlay,
} from "@tabler/icons-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/providers/AuthProvider";
import { mockTestService } from "@/services/mocktest.services";
import type { DashboardModule } from "@/types/mocktest.types";

const moduleMeta = {
  reading: { label: "Reading", icon: IconBook2, color: "#2563eb" },
  listening: { label: "Listening", icon: IconHeadset, color: "#059669" },
  writing: { label: "Writing", icon: IconPencil, color: "#d97706" },
  speaking: { label: "Speaking", icon: IconMicrophone, color: "#dc2626" },
} satisfies Record<DashboardModule, { label: string; icon: typeof IconBook2; color: string }>;

const scoreText = (score: number | null) =>
  score == null ? "—" : score.toFixed(1);

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: mockTestService.getStudentDashboard,
  });
  const dashboard = response?.data;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <IconLoader2 className="animate-spin text-red-600" size={28} />
      </div>
    );
  }

  if (isError || !dashboard) {
    return (
      <div className="mx-auto mt-12 max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <IconAlertCircle className="mx-auto text-red-600" size={30} />
        <h1 className="mt-3 text-base font-bold text-neutral-900">Dashboard could not be loaded</h1>
        <p className="mt-1 text-sm text-neutral-600">Check your connection and try again.</p>
        <button onClick={() => refetch()} className="mt-4 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700">
          Try again
        </button>
      </div>
    );
  }

  const inProgress = Math.max(0, dashboard.overview.mockTestsStarted - dashboard.overview.mockTestsCompleted);
  const chartData = [...dashboard.mockHistory].reverse().map((attempt, index) => ({
    name: `Mock ${index + 1}`,
    title: attempt.title,
    ...attempt.sectionScores,
  }));

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Overview</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
            Welcome back, {user?.name?.split(" ")[0] || "Student"}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">Track your preparation and continue where you left off.</p>
        </div>
        <Link href="/student/mock-tests" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700">
          <IconPlayerPlay size={17} /> Take a mock test
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Test summary">
        {[
          { label: "Overall band", value: scoreText(dashboard.overview.overallBandScore), detail: "Latest score", icon: IconChartLine },
          { label: "Tests started", value: dashboard.overview.mockTestsStarted, detail: `${dashboard.overview.mockTestsCompleted} completed`, icon: IconCheck },
          { label: "Practice attempts", value: dashboard.overview.practiceAttempts, detail: "Across all modules", icon: IconBook2 },
          { label: "In progress", value: inProgress, detail: "Ready to resume", icon: IconClock },
        ].map((item) => (
          <article key={item.label} className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-500">{item.label}</p>
              <span className="grid size-8 place-items-center rounded-lg bg-neutral-100 text-neutral-600"><item.icon size={17} /></span>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-neutral-950">{item.value}</p>
            <p className="mt-1 text-xs text-neutral-500">{item.detail}</p>
          </article>
        ))}
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-neutral-950">Module performance</h2>
          <p className="mt-1 text-sm text-neutral-500">Your latest score and overall average.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboard.moduleStats.map((stat) => {
            const meta = moduleMeta[stat.module];
            const Icon = meta.icon;
            return (
              <article key={stat.module} className="rounded-xl border border-neutral-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-lg bg-neutral-100 text-neutral-700"><Icon size={19} /></span>
                  <span className="text-xs text-neutral-400">{stat.completedAttempts}/{stat.totalAttempts} complete</span>
                </div>
                <div className="mt-5 flex items-end justify-between">
                  <div><p className="text-sm font-semibold text-neutral-800">{meta.label}</p><p className="mt-1 text-3xl font-bold text-neutral-950">{scoreText(stat.latestBandScore)}</p></div>
                  <div className="text-right"><p className="text-xs text-neutral-400">Average</p><p className="text-sm font-semibold text-neutral-700">{scoreText(stat.averageBandScore)}</p></div>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full" style={{ width: `${((stat.latestBandScore ?? 0) / 9) * 100}%`, backgroundColor: meta.color }} /></div>
                <p className="mt-3 text-xs text-neutral-500">{stat.change == null ? "Complete more attempts to see progress" : stat.change === 0 ? "No change from your previous score" : `${stat.change > 0 ? "+" : ""}${stat.change.toFixed(1)} from your previous score`}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
        <article className="min-w-0 rounded-xl border border-neutral-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold text-neutral-950">Score progress</h2>
          <p className="mt-1 text-sm text-neutral-500">Module scores across your mock-test history.</p>
          {chartData.length ? (
            <div className="mt-6 h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke="#e5e5e5" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis domain={[0, 9]} ticks={[0, 3, 6, 9]} tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip labelFormatter={(_, payload) => payload[0]?.payload?.title || "Mock test"} contentStyle={{ border: "1px solid #e5e5e5", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,.08)", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {(Object.keys(moduleMeta) as DashboardModule[]).map((key) => <Line key={key} type="monotone" dataKey={key} name={moduleMeta[key].label} stroke={moduleMeta[key].color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState text="Your score chart will appear after your first mock test." />}
        </article>

        <article className="rounded-xl border border-neutral-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div><h2 className="text-lg font-bold text-neutral-950">Recent tests</h2><p className="mt-1 text-sm text-neutral-500">Your latest mock-test activity.</p></div>
            <IconClock className="text-neutral-400" size={20} />
          </div>
          {dashboard.mockHistory.length ? (
            <div className="mt-4 divide-y divide-neutral-100">
              {dashboard.mockHistory.slice(0, 5).map((attempt) => (
                <Link key={attempt.id} href={`/student/mock-tests/${attempt.mockTestId}?attemptId=${attempt.id}`} className="group flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-neutral-800 group-hover:text-red-600">{attempt.title}</p><p className="mt-1 text-xs text-neutral-400">{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(attempt.startedAt))} · {attempt.status === "SUBMITTED" ? "Completed" : "In progress"}</p></div>
                  <div className="flex shrink-0 items-center gap-2"><span className="text-base font-bold text-neutral-900">{scoreText(attempt.overallBandScore)}</span><IconArrowRight size={16} className="text-neutral-300 group-hover:text-red-600" /></div>
                </Link>
              ))}
            </div>
          ) : <EmptyState text="No mock tests yet." />}
          <Link href="/student/mock-tests" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700">View all tests <IconArrowRight size={16} /></Link>
        </article>
      </section>
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="mt-5 flex min-h-40 items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-5 text-center text-sm text-neutral-500">{text}</div>;
}
