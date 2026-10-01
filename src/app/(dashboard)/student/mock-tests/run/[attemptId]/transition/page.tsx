"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { mockTestService } from "@/services/mocktest.services";
import {
  IconAlertCircle,
  IconArrowRight,
  IconBook2,
  IconCheck,
  IconClock,
  IconHeadphones,
  IconLoader2,
  IconMicrophone,
  IconPencil,
  IconShieldCheck,
} from "@tabler/icons-react";

interface Props {
  params: Promise<{ attemptId: string }>;
}

const BREAK_SECONDS = 5 * 60;
const moduleOrder = ["listening", "reading", "writing", "speaking"] as const;

const sectionCopy = {
  listening: {
    title: "Listening",
    icon: IconHeadphones,
    accent: "bg-blue-700",
    introduction: "You will hear a series of recordings and answer questions as you listen.",
    instructions: [
      "Check that your headphones are working before you begin.",
      "The recording will play once. Read each question carefully.",
      "Follow the word limit shown in the question. Spelling matters.",
      "Your answers will be submitted automatically when time ends.",
    ],
  },
  reading: {
    title: "Reading",
    icon: IconBook2,
    accent: "bg-emerald-700",
    introduction: "Read the passages and answer all questions within the time allowed.",
    instructions: [
      "You may move between passages and questions at any time.",
      "Use highlighting and review tools where available.",
      "Follow every answer and word-limit instruction exactly.",
      "There is no extra transfer time. The test submits when time ends.",
    ],
  },
  writing: {
    title: "Writing",
    icon: IconPencil,
    accent: "bg-amber-600",
    introduction: "Complete both writing tasks. Task 2 carries more weight than Task 1.",
    instructions: [
      "Spend about 20 minutes on Task 1 and 40 minutes on Task 2.",
      "Write at least 150 words for Task 1 and 250 words for Task 2.",
      "Write in full sentences and organise your response clearly.",
      "Your saved responses submit automatically when time ends.",
    ],
  },
  speaking: {
    title: "Speaking",
    icon: IconMicrophone,
    accent: "bg-rose-700",
    introduction: "Record your responses naturally across all three parts of the speaking test.",
    instructions: [
      "Allow microphone access and check that the input level moves.",
      "Answer in English and speak clearly at a natural pace.",
      "Part 2 includes preparation time before recording begins.",
      "The test will submit your recorded responses when time ends.",
    ],
  },
} as const;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function MockTestTransitionPage({ params }: Props) {
  const { attemptId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const mockTestId = searchParams.get("mockTestId");
  const completedModule = searchParams.get("completedModule");
  const [secondsLeft, setSecondsLeft] = useState(completedModule ? BREAK_SECONDS : 0);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["mock-attempt-transition", attemptId],
    queryFn: () => mockTestService.getAttemptById(attemptId),
  });
  const attempt = data?.data;

  const nextSection = (() => {
    if (!attempt) return null;
    for (const sectionName of moduleOrder) {
      const examId = attempt.mockTest[`${sectionName}ExamId`];
      const moduleAttemptId = attempt[`${sectionName}AttemptId`];
      if (examId && !moduleAttemptId) {
        return {
          module: sectionName,
          examId,
          duration: attempt.mockTest[`${sectionName}Exam`]?.duration || (sectionName === "speaking" ? 15 : sectionName === "listening" ? 40 : 60),
          ...sectionCopy[sectionName],
        };
      }
    }
    return null;
  })();
  const nextModule = nextSection?.module;

  useEffect(() => {
    if (!completedModule || !nextModule) return;
    const storageKey = `mock-break:${attemptId}:${completedModule}`;
    const savedEnd = sessionStorage.getItem(storageKey);
    const endAt = savedEnd ? Number(savedEnd) : Date.now() + BREAK_SECONDS * 1000;
    sessionStorage.setItem(storageKey, String(endAt));

    const update = () => setSecondsLeft(Math.max(0, Math.ceil((endAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [attemptId, completedModule, nextModule]);

  const handleProceed = useCallback(() => {
    if (isRedirecting || secondsLeft > 0) return;
    setIsRedirecting(true);
    if (nextSection) {
      router.push(`/practice/${nextSection.module}/${nextSection.examId}?mockAttemptId=${attemptId}&mockTestId=${mockTestId}&mode=continuous`);
      return;
    }
    router.push(`/student/mock-tests/${mockTestId}?attemptId=${attemptId}&assessing=1`);
  }, [attemptId, isRedirecting, mockTestId, nextSection, router, secondsLeft]);

  if (isLoading) {
    return <div className="min-h-screen bg-slate-100 grid place-items-center"><IconLoader2 className="animate-spin text-slate-700" size={36} /></div>;
  }

  if (isError || !attempt || !mockTestId) {
    return (
      <div className="min-h-screen bg-slate-100 grid place-items-center p-6 text-center">
        <div className="max-w-sm space-y-3"><IconAlertCircle className="mx-auto text-red-700" size={40} /><h1 className="text-xl font-semibold">We could not open this test session.</h1><button onClick={() => router.push("/student/mock-tests")} className="rounded bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">Return to mock tests</button></div>
      </div>
    );
  }

  if (!nextSection) {
    return (
      <main className="min-h-screen bg-slate-100 px-5 py-12 grid place-items-center text-slate-900">
        <section className="w-full max-w-xl border border-slate-200 bg-white p-8 md:p-10 shadow-sm text-center">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-700"><IconCheck size={28} /></div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Test complete</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Your responses have been received</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">We will now mark all four sections and prepare one complete band-score report in your student dashboard.</p>
          <button onClick={handleProceed} disabled={isRedirecting} className="mt-7 inline-flex w-full items-center justify-center gap-2 bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {isRedirecting ? <IconLoader2 className="animate-spin" size={17} /> : <IconArrowRight size={17} />} View score report
          </button>
        </section>
      </main>
    );
  }

  const SectionIcon = nextSection.icon;
  const isBreak = secondsLeft > 0;

  return (
    <main className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <header className="border-b border-slate-300 bg-white px-5 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Full mock test</p><p className="text-sm font-semibold">{attempt.mockTest.title}</p></div>
          <div className="hidden items-center gap-2 text-xs font-medium text-slate-600 sm:flex"><IconShieldCheck size={16} /> Secure exam session</div>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-61px)] max-w-5xl place-items-center px-5 py-8">
        <section className="w-full overflow-hidden border border-slate-300 bg-white shadow-sm">
          <div className={`h-1.5 ${nextSection.accent}`} />
          <div className="grid md:grid-cols-[240px_1fr]">
            <aside className="border-b border-slate-200 bg-slate-50 p-7 md:border-b-0 md:border-r">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-slate-800 ring-1 ring-slate-200"><SectionIcon size={24} /></div>
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Next section</p>
              <h1 className="mt-1 text-2xl font-semibold">{nextSection.title}</h1>
              <div className="mt-5 space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2"><IconClock size={16} /> {nextSection.duration} minutes</p>
                <p>Section {moduleOrder.indexOf(nextSection.module) + 1} of 4</p>
              </div>
            </aside>

            <div className="p-7 md:p-10">
              {isBreak ? (
                <div className="max-w-xl">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">{completedModule} submitted</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight">Take a five-minute break</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">Your answers are saved. Rest your eyes, stretch, and return before the countdown ends. The next section cannot be opened during the break.</p>
                  <div className="my-8 inline-flex items-center gap-3 border border-slate-300 bg-slate-50 px-6 py-4 font-mono text-4xl font-semibold tabular-nums"><IconClock size={27} />{formatTime(secondsLeft)}</div>
                  <p className="text-xs text-slate-500">The instructions for {nextSection.title} will appear when the break finishes.</p>
                </div>
              ) : (
                <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Read before you begin</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight">{nextSection.title} test instructions</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{nextSection.introduction}</p>
                  <ol className="mt-6 space-y-3">
                    {nextSection.instructions.map((instruction, index) => <li key={instruction} className="flex gap-3 text-sm leading-6 text-slate-700"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold">{index + 1}</span><span>{instruction}</span></li>)}
                  </ol>
                  <div className="mt-7 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">Once you start, the timer runs continuously. Do not refresh or close the page.</div>
                  <button onClick={handleProceed} disabled={isRedirecting} className="mt-7 inline-flex min-w-52 items-center justify-center gap-2 bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                    {isRedirecting ? <IconLoader2 className="animate-spin" size={17} /> : <IconArrowRight size={17} />} Start {nextSection.title}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
