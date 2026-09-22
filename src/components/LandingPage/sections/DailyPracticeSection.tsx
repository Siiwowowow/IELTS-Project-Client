"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  Headphones,
  Mic2,
  PenLine,
} from "lucide-react";

const INITIAL_TASKS = [
  { id: 1, title: "20 new words", completed: true, weight: 36 },
  { id: 2, title: "1 reading passage", completed: true, weight: 37 },
  { id: 3, title: "1 listening test", completed: false, weight: 9 },
  { id: 4, title: "10 speaking questions", completed: false, weight: 9 },
  { id: 5, title: "1 writing task", completed: false, weight: 9 },
];

const TEST_SKILLS = [
  { label: "Reading", icon: BookOpen },
  { label: "Listening", icon: Headphones },
  { label: "Writing", icon: PenLine },
  { label: "Speaking", icon: Mic2 },
];

export function DailyPracticeSection() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const progress = tasks.reduce(
    (total, task) => total + (task.completed ? task.weight : 0),
    0,
  );

  const toggleTask = (id: number) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

  return (
    <section id="daily-practice" className="bg-[#f8f3e9] py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden border-[3px] border-[#171715] bg-[#171715] shadow-[8px_10px_0_rgba(23,23,21,0.12)] lg:grid-cols-[0.82fr_1.18fr]">
          <div className="relative overflow-hidden bg-[#f5f0e4] px-6 py-7 text-[#171715] sm:px-9 sm:py-9 lg:px-10">
            <div
              className="pointer-events-none absolute inset-0 opacity-35"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent 0, transparent 27px, rgba(23,23,21,.08) 28px)",
              }}
            />

            <div className="relative z-10">
              <div className="flex items-start justify-between gap-6">
                <h2 className="text-[2.05rem] font-black uppercase leading-[0.82] tracking-[-0.075em] sm:text-[2.7rem] lg:text-[3.25rem]">
                  Today&apos;s
                  <span className="flex items-center gap-3">
                    Mission
                    <ArrowRight className="mt-1 size-7 stroke-[3.5] sm:size-9" />
                  </span>
                </h2>
                <span className="mt-1 border border-[#171715] px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em]">
                  Daily 01
                </span>
              </div>

              <div className="mt-7 space-y-2.5 sm:mt-8">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className="group flex w-full items-center gap-3 text-left text-xs font-extrabold uppercase tracking-[0.02em] sm:text-sm"
                  >
                    <span
                      className={`grid size-4 shrink-0 place-items-center border-[1.5px] border-[#171715] transition-colors ${
                        task.completed
                          ? "bg-[#171715] text-[#f5f0e4]"
                          : "bg-[#f5f0e4] group-hover:bg-[#e7dfcf]"
                      }`}
                    >
                      {task.completed && <Check className="size-3 stroke-[3.5]" />}
                    </span>
                    <span className={task.completed ? "line-through decoration-1" : ""}>
                      {task.title}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-7 sm:mt-8">
                <div className="mb-2 flex items-end justify-between text-[11px] font-black uppercase tracking-[0.08em]">
                  <span>{progress}% complete</span>
                  <span className="text-[#67665f]">Keep moving</span>
                </div>
                <div className="h-4 border-2 border-[#171715] bg-[#f5f0e4] p-0.5">
                  <div
                    className="h-full bg-[#e4ef35] transition-[width] duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="relative min-h-90 overflow-hidden bg-[#10100f] px-6 py-8 text-white sm:min-h-105 sm:px-10 sm:py-10 lg:min-h-0 lg:px-12">
            <Image
              src="/img/mock_test_student.jpg"
              alt="Student taking an IELTS mock test"
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover object-[65%_center] grayscale"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#10100f_0%,rgba(16,16,15,.94)_35%,rgba(16,16,15,.38)_70%,rgba(16,16,15,.12)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(16,16,15,.65),transparent_58%)]" />

            <span className="absolute right-3 top-0 z-20 -rotate-8 text-6xl font-black uppercase leading-none tracking-[-0.09em] text-[#f02f1f] sm:right-8 sm:text-8xl lg:text-[7rem]">
              Test
            </span>

            <div className="relative z-10 flex h-full max-w-md flex-col justify-between">
              <div>
                <p className="text-[2.15rem] font-black uppercase leading-[0.82] tracking-[-0.075em] sm:text-[3rem] lg:text-[3.6rem]">
                  Test
                  <span className="block text-[#f02f1f]">Yourself.</span>
                </p>
                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.08em] text-white/80 sm:text-xs">
                  Full IELTS mock test
                </p>

                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-[9px] font-semibold text-white/65 sm:text-[10px]">
                  {TEST_SKILLS.map(({ label, icon: Icon }) => (
                    <span key={label} className="flex items-center gap-1">
                      <Icon className="size-3" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-10 sm:mt-14">
                <div className="mb-5 flex items-center gap-2 text-sm font-black">
                  <Clock3 className="size-5" />
                  2h 45m
                </div>
                <Link
                  href="/mock-tests/full"
                  className="inline-flex items-center gap-3 border-2 border-white bg-[#f02f1f] px-5 py-3 text-xs font-black uppercase tracking-[0.04em] transition-colors hover:bg-white hover:text-[#171715] sm:px-6"
                >
                  Start mock test
                  <ArrowRight className="size-4 stroke-[3]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
