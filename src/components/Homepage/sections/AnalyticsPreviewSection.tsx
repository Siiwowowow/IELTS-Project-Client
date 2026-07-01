"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ClientOnly } from "../shared/ClientOnly";
import { InView } from "../shared/InView";
import { SectionHeader } from "../shared/SectionHeader";
import { GlassCard } from "../shared/GlassCard";

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-100 ${className ?? ""}`}
      aria-hidden
    />
  );
}

const bandTrend = [
  { week: "সপ্তাহ ১", listening: 6.0, reading: 5.5, writing: 5.5, speaking: 6.0 },
  { week: "সপ্তাহ ২", listening: 6.5, reading: 6.0, writing: 5.5, speaking: 6.0 },
  { week: "সপ্তাহ ৩", listening: 6.5, reading: 6.5, writing: 6.0, speaking: 6.5 },
  { week: "সপ্তাহ ৪", listening: 7.0, reading: 6.5, writing: 6.0, speaking: 6.5 },
  { week: "সপ্তাহ ৫", listening: 7.0, reading: 7.0, writing: 6.5, speaking: 7.0 },
  { week: "সপ্তাহ ৬", listening: 7.5, reading: 7.0, writing: 6.5, speaking: 7.0 },
];

const weeklyStudy = [
  { day: "সোম", hours: 2.5 },
  { day: "মঙ্গল", hours: 1.8 },
  { day: "বুধ", hours: 3.2 },
  { day: "বৃহ", hours: 2.0 },
  { day: "শুক্র", hours: 4.1 },
  { day: "শনি", hours: 5.0 },
  { day: "রবি", hours: 3.5 },
];

const skills = [
  { skill: "লিসেনিং", score: 7.5, weak: false },
  { skill: "রিডিং", score: 7.0, weak: false },
  { skill: "রাইটিং", score: 6.0, weak: true },
  { skill: "স্পিকিং", score: 7.0, weak: false },
];

const heatmap = [
  [2, 3, 1, 4, 2, 0, 3],
  [1, 2, 4, 3, 2, 1, 2],
  [3, 4, 2, 5, 3, 2, 4],
  [0, 1, 2, 3, 4, 3, 1],
];

export function AnalyticsPreviewSection() {
  return (
    <section id="analytics" className="hp-section bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <InView>
          <SectionHeader
            eyebrow="ফলাফল ও বিশ্লেষণ"
            title="ডাটা-চালিত প্রোগ্রেস ট্র্যাকিং"
            description="আপনার শক্তির জায়গাগুলো বুঝুন, দুর্বলতাগুলো চিহ্নিত করুন এবং নিখুঁত বিশ্লেষণের মাধ্যমে নিজের ব্যান্ড স্কোর উন্নত হতে দেখুন।"
          />
        </InView>

        <InView delay={100} className="mt-14">
          <div className="grid gap-6 lg:grid-cols-3">
            <GlassCard className="lg:col-span-2 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-neutral-900">ব্যান্ড স্কোর ট্রেন্ড</h3>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  +১.৫ ওভারঅল বৃদ্ধি
                </span>
              </div>
              <div className="relative h-[220px] w-full">
                <ClientOnly fallback={<ChartSkeleton className="h-full w-full" />}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 320, height: 220 }}>
                    <AreaChart data={bandTrend}>
                      <defs>
                        <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#dc2626" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#a3a3a3" />
                      <YAxis domain={[5, 8]} tick={{ fontSize: 11 }} stroke="#a3a3a3" />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="listening"
                        stroke="#dc2626"
                        fill="url(#bandGrad)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ClientOnly>
              </div>
            </GlassCard>

            <div className="space-y-4">
              {skills.map((s) => (
                <GlassCard key={s.skill} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">{s.skill}</p>
                    <p className="text-2xl font-bold text-neutral-900">{s.score}</p>
                  </div>
                  {s.weak && (
                    <span className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                      চর্চা বৃদ্ধি করুন
                    </span>
                  )}
                </GlassCard>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <GlassCard className="p-6">
              <h3 className="mb-4 font-semibold text-neutral-900">সাপ্তাহিক প্র্যাকটিসের ঘণ্টা</h3>
              <div className="relative h-[180px] w-full">
                <ClientOnly fallback={<ChartSkeleton className="h-full w-full" />}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 320, height: 180 }}>
                    <BarChart data={weeklyStudy}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                        {weeklyStudy.map((_, i) => (
                          <Cell
                            key={i}
                            fill={i === 5 ? "#dc2626" : "#93c5fd"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ClientOnly>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="mb-4 font-semibold text-neutral-900">অ্যাক্টিভিটি হিটম্যাপ</h3>
              <div className="grid grid-cols-7 gap-1.5">
                {heatmap.flat().map((level, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-md"
                    style={{
                      backgroundColor:
                        level === 0
                          ? "#f5f5f5"
                          : `rgba(220, 38, 38, ${0.15 + level * 0.17})`,
                    }}
                  />
                ))}
              </div>
              <p className="mt-4 text-xs text-neutral-500">
                গাঢ় রঙের সেলগুলো অধিক প্র্যাকটিস নির্দেশ করে — আপনার প্র্যাকটিসের বিরতিগুলো সহজেই চিহ্নিত করুন।
              </p>
            </GlassCard>
          </div>
        </InView>
      </div>
    </section>
  );
}
