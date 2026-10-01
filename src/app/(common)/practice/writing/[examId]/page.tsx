/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { use, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { writingService } from "@/services/writing.services";
import { mockTestService } from "@/services/mocktest.services";
import { ExamTimer } from "@/components/Reading/ExamTimer";
import { ExamImageViewer } from "@/components/Writing/ExamImageViewer";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { toast } from "sonner";
import {
  IconLoader2,
  IconAlertCircle,
  IconCheck,
  IconFileText,
  IconArrowLeft,
  IconClock,
  IconMaximize,
  IconMinimize,
  IconInfoCircle,
  IconUserCircle,
  IconUpload,
} from "@tabler/icons-react";
import { useAuth } from "@/providers/AuthProvider";
import { useTextHighlighter } from "@/hooks/useTextHighlighter";
import Link from "next/link";
import {
  pendingWritingAssessmentStorageKey,
  type PendingWritingAssessment,
} from "@/types/writing-assessment.types";
import { ExamSubmissionOverlay } from "@/components/shared/ExamSubmissionOverlay";

interface Props {
  params: Promise<{ examId: string }>;
}

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export default function WritingExamPage({ params }: Props) {
  const { examId } = use(params);
  const router = useRouter();
  const workspaceRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const searchParams = useSearchParams();
  const mockAttemptId = searchParams.get("mockAttemptId");
  const mockTestId = searchParams.get("mockTestId");

  // Core Exam States
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answersRef = useRef<Record<string, string>>({});
  const [activeTaskIdx, setActiveTaskIdx] = useState<0 | 1>(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Responsive & Mobile Tab
  const [isDesktop, setIsDesktop] = useState(false);
  const [mobileTab, setMobileTab] = useState<"prompt" | "response">("prompt");

  const submittedRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Responsive listener matching Reading Exam
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch Exam Query
  const { data, isLoading, isError } = useQuery({
    queryKey: ["writing-exam-practice", examId],
    queryFn: () => writingService.getExamById(examId),
    retry: 1,
  });

  const exam = data?.data;
  useTextHighlighter(workspaceRef, [exam]);
  const sortedTasks = useMemo(
    () => (exam?.tasks ? [...exam.tasks].sort((a, b) => a.order - b.order) : []),
    [exam],
  );
  const activeTask = sortedTasks[activeTaskIdx];

  // Initialize blank answers when tasks are loaded
  useEffect(() => {
    if (sortedTasks.length > 0 && Object.keys(answers).length === 0) {
      const initialAnswers: Record<string, string> = {};
      sortedTasks.forEach((t) => {
        initialAnswers[t.id] = "";
      });
      setAnswers(initialAnswers);
    }
  }, [sortedTasks, answers]);

  // Submission mutation
  const submitMutation = useMutation({
    mutationFn: (snap: Record<string, string>) => {
      const responsesArray = Object.entries(snap).map(([taskId, essay]) => ({
        taskId,
        essay,
        wordCount: countWords(essay),
      }));

      return writingService.submitAttempt(examId, {
        responses: responsesArray,
      });
    },
    onSuccess: async (res, submittedAnswers) => {
      toast.success("Writing attempt submitted successfully!");
      const attemptId = res.data.id as string;
      const pendingAssessment: PendingWritingAssessment = {
        version: 1,
        attemptId,
        tasks: sortedTasks.map((task) => ({
          taskId: task.id,
          request: {
            examType: exam?.examType ?? "ACADEMIC",
            taskType: task.taskType,
            prompt: task.instruction,
            essay: submittedAnswers[task.id] || "",
            minWords: task.minWords ?? (task.taskType === "TASK_1" ? 150 : 250),
            imageUrl: task.imageUrl || null,
          },
        })),
      };

      try {
        const serialized = JSON.stringify(pendingAssessment);
        sessionStorage.setItem(pendingWritingAssessmentStorageKey(attemptId), serialized);
        localStorage.setItem(pendingWritingAssessmentStorageKey(attemptId), serialized);
      } catch (storageErr) {
        console.warn("Storage error for pending assessment:", storageErr);
      }

      if (mockAttemptId && mockTestId) {
        try {
          await mockTestService.updateAttempt(mockAttemptId, {
            writingAttemptId: res.data.id,
          });
          router.push(
            `/student/mock-tests/run/${mockAttemptId}/transition?mockTestId=${mockTestId}&completedModule=writing`
          );
        } catch {
          toast.error("Failed to link attempt to mock test session.");
          router.push(`/practice/writing/${examId}/review/${res.data.id}?assessing=1`);
        }
      } else {
        router.push(`/practice/writing/${examId}/review/${attemptId}?assessing=1`);
      }
    },
    onError: (err: any) => {
      submittedRef.current = false;
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Submission failed. Please try again.";
      toast.error(msg);
    },
  });

  const doSubmit = useCallback(
    (snap: Record<string, string>) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setShowSubmitModal(false);
      submitMutation.mutate(snap);
    },
    [submitMutation]
  );

  const handleTimeUp = useCallback(() => {
    if (!submittedRef.current) {
      toast.info("Time is up! Auto-submitting your writing responses...");
      doSubmit(answersRef.current);
    }
  }, [doSubmit]);

  // Exam environment lock-down listeners
  useEffect(() => {
    const preventReloads = (e: KeyboardEvent) => {
      if (e.key === "F5") {
        e.preventDefault();
        toast.error("Page refresh is disabled during the assessment.");
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
        e.preventDefault();
        toast.error("Page reload is disabled during the assessment.");
      }
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        toast.error("Developer inspection tools are disabled.");
      }
    };

    window.addEventListener("keydown", preventReloads);

    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      window.removeEventListener("keydown", preventReloads);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  const toggleKioskFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        toast.error(`Kiosk Mode expansion failed: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleTextChange = (val: string) => {
    if (!activeTask) return;
    setAnswers((prev) => ({
      ...prev,
      [activeTask.id]: val,
    }));
  };

  const handleSwitchTask = (idx: 0 | 1) => {
    setActiveTaskIdx(idx);
    setMobileTab("prompt");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white gap-4">
        <IconLoader2 size={40} className="animate-spin text-black" />
        <p className="text-sm font-bold text-gray-500">Preparing Writing Exam workspace...</p>
      </div>
    );
  }

  if (isError || !exam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 font-sans">
        <div className="bg-white border border-gray-300 p-8 rounded-none max-w-md w-full text-center shadow-sm">
          <IconAlertCircle className="mx-auto text-red-600 mb-3" size={40} />
          <h2 className="font-bold text-gray-900 text-lg mb-1">Failed to Load Exam</h2>
          <p className="text-gray-500 text-sm mb-4">Please go back and try again.</p>
          <Link
            href="/practice/writing"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium"
          >
            <IconArrowLeft size={15} />
            Back to Practice
          </Link>
        </div>
      </div>
    );
  }

  const activeEssay = activeTask ? answers[activeTask.id] || "" : "";
  const activeWordCount = countWords(activeEssay);
  const minWordsRequired = activeTask?.minWords ?? (activeTaskIdx === 0 ? 150 : 250);

  // Left Panel (Task Instruction / Stimulus)
  const promptPanel = (
    <div
      className={`
        ${mobileTab === "response" ? "hidden lg:flex" : "flex"}
        flex-col
        h-full
        overflow-hidden
        bg-white
        lg:border-r
        lg:border-gray-200
      `}
    >
      {/* Sticky Panel Header matching Reading Exam */}
      <div
        className="sticky top-0 z-20 px-4 py-2 flex items-center justify-between shrink-0"
        style={{
          background: "#F8FAFC",
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <IconFileText size={16} className="text-black shrink-0" />
          <span className="font-bold text-black text-sm">
            Writing {activeTask?.taskType === "TASK_1" ? "Task 1" : "Task 2"}
          </span>
          <span className="text-xs text-gray-500 font-medium hidden sm:inline">
            {activeTask?.taskType === "TASK_1" ? "(Suggested: 20 mins)" : "(Suggested: 40 mins)"}
          </span>
        </div>

        <button
          onClick={() => setMobileTab("response")}
          className="ml-auto lg:hidden bg-black text-white px-3 py-1 text-xs font-semibold cursor-pointer"
        >
          Response Area
        </button>
      </div>

      {/* Scrollable Prompt & Question Details */}
      <div className="flex-1 overflow-y-auto panel-scroll px-6 py-5 space-y-4">
        {activeTask ? (
          <>
            {/* Prompt Text / IELTS Question Instruction */}
            <div className="space-y-4 leading-relaxed text-sm select-text">
              {activeTask.taskType === "TASK_1" &&
              !activeTask.instruction.includes("ielts-task1-sheet") &&
              !activeTask.instruction.includes("ielts-task1-box") ? (
                <div className="bg-white font-sans select-text space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold tracking-tight text-slate-900">
                      WRITING TASK 1
                    </h3>
                    <p className="text-sm text-slate-800 font-normal leading-relaxed">
                      You should spend about 20 minutes on this task.
                    </p>
                  </div>

                  {/* The Official IELTS Box */}
                  <div className="my-3 p-4 md:p-5 border-2 border-slate-900 bg-white rounded-none font-normal text-slate-900 leading-relaxed text-sm select-text whitespace-pre-wrap">
                    <div dangerouslySetInnerHTML={{ __html: activeTask.instruction }} />
                  </div>

                  <p className="text-sm text-slate-800 font-normal">
                    Write at least {minWordsRequired} words.
                  </p>
                </div>
              ) : activeTask.taskType === "TASK_2" &&
                !activeTask.instruction.includes("ielts-task2-sheet") &&
                !activeTask.instruction.includes("ielts-task2-box") ? (
                <div className="bg-white font-sans select-text space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold tracking-tight text-slate-900">
                      WRITING TASK 2
                    </h3>
                    <p className="text-sm text-slate-800 font-normal leading-relaxed">
                      You should spend about 40 minutes on this task.
                    </p>
                    <p className="text-sm text-slate-800 font-normal leading-relaxed">
                      Present a written argument or case to an educated reader with no specialist
                      knowledge of the following topic.
                    </p>
                  </div>

                  {/* The Official IELTS Box */}
                  <div className="my-3 p-4 md:p-5 border-2 border-slate-900 bg-white rounded-none font-normal text-slate-900 leading-relaxed text-sm select-text whitespace-pre-wrap">
                    <div dangerouslySetInnerHTML={{ __html: activeTask.instruction }} />
                  </div>

                  <p className="text-sm text-slate-800 font-normal leading-relaxed">
                    Give reasons for your answer and include any relevant examples from your own
                    knowledge or experience.
                  </p>
                  <p className="text-sm text-slate-800 font-normal">
                    Write at least {minWordsRequired} words.
                  </p>
                </div>
              ) : (
                <div
                  className="font-normal text-gray-900 leading-relaxed bg-white p-1"
                  dangerouslySetInnerHTML={{ __html: activeTask.instruction }}
                />
              )}

              {activeTask.taskType === "TASK_1" && activeTask.imageUrl && (
                <ExamImageViewer key={activeTask.imageUrl} src={activeTask.imageUrl} embedded />
              )}
            </div>

            {/* PDF visual stimulus notice */}
            {activeTask.pdfUrl && (
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 mt-4">
                <div className="flex items-center gap-2.5">
                  <IconFileText className="text-black" size={20} />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Task Reference PDF</p>
                    <p className="text-[11px] text-slate-500">
                      A visual stimulus document is attached to this task.
                    </p>
                  </div>
                </div>
                <a
                  href={activeTask.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-black hover:bg-gray-800 text-white text-xs font-bold transition"
                >
                  Open PDF
                </a>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 text-gray-400 text-sm">
            Please choose a writing task from the tabs below.
          </div>
        )}
      </div>
    </div>
  );

  // Right Panel (Response Area / Writing Textarea)
  const responsePanel = (
    <div
      className={`
        ${mobileTab === "prompt" ? "hidden lg:flex" : "flex"}
        flex-col
        h-full
        overflow-hidden
        bg-white
      `}
    >
      {/* Sticky Panel Header matching Reading Exam */}
      <div
        className="sticky top-0 z-20 px-4 py-2 flex items-center justify-between shrink-0"
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <span className="font-bold text-black text-sm">Response Area</span>

        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-600 font-medium">
            Words:{" "}
            <strong className="text-black font-bold tabular-nums">{activeWordCount}</strong> /{" "}
            {minWordsRequired}
          </div>

          <button
            onClick={() => setMobileTab("prompt")}
            className="ml-2 lg:hidden bg-black text-white px-3 py-1 text-xs font-semibold cursor-pointer"
          >
            Task Prompt
          </button>
        </div>
      </div>

      {/* Editor Content Area - Full bleed, minimal CBT design */}
      <div className="flex-1 flex flex-col p-4 md:p-6 min-h-0 bg-white">
        <div className="flex-1 relative border border-gray-300 rounded-none overflow-hidden bg-white focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-colors">
          <textarea
            value={activeEssay}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Type your response here..."
            className="panel-scroll absolute inset-0 h-full w-full resize-none border-none p-4 md:p-5 font-sans text-base leading-relaxed text-gray-900 outline-none placeholder:text-gray-400 select-text"
            spellCheck={false}
            autoComplete="off"
            autoFocus
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <ExamSubmissionOverlay visible={submitMutation.isPending} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

        html,
        body {
          overflow: hidden;
        }

        .panel-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .panel-scroll::-webkit-scrollbar-track {
          background: #F3F4F6;
        }

        .panel-scroll::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 999px;
        }

        .highlighted {
          background-color: #fdff32 !important;
          color: #000000 !important;
          cursor: pointer;
        }
      `}</style>

      <div className="flex flex-col h-screen bg-white text-gray-800 relative font-sans overflow-hidden">
        {/* 1. CANDIDATE TOP HEADER (Identical to Reading Exam) */}
        <header className="fixed top-0 left-0 right-0 h-12 bg-white border-b-2 border-black flex items-center justify-between px-4 z-40 select-none font-sans">
          {/* LEFT: Badge and Candidate Details */}
          <div className="flex items-center">
            <span className="font-bold text-sm md:text-base text-black tracking-tight border border-black px-3 py-1">
              Writing Exam
            </span>

            <div className="hidden sm:flex items-center gap-4 border-l border-gray-300 pl-4 ml-4 text-xs font-medium text-gray-600">
              <span>
                Candidate: <strong className="text-gray-800">{user?.name || "Student"}</strong>
              </span>
              <span>
                ID:{" "}
                <strong className="text-gray-800">
                  {`BRIT${user?.id?.slice(-4).toUpperCase() || "1234"}`}
                </strong>
              </span>
              <span>
                Date:{" "}
                <strong className="text-gray-800">
                  {new Date().toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </strong>
              </span>
            </div>
          </div>

          {/* RIGHT: Countdown timer & utilities */}
          <div className="flex items-center gap-4">
            {/* TIMER PILL */}
            <div
              className="flex items-center gap-1.5 px-3 py-1 border text-sm font-bold font-mono bg-white text-black border-black"
              title="Time Remaining"
            >
              <IconClock size={15} className="text-black" />
              <ExamTimer
                durationMinutes={exam.duration}
                onTimeUp={handleTimeUp}
                className="text-black font-mono text-sm font-bold bg-transparent p-0 rounded-none border-none"
              />
            </div>

            {/* UTILITIES */}
            <div className="flex items-center gap-2.5 text-gray-400">
              <button
                type="button"
                onClick={toggleKioskFullscreen}
                className="hover:text-black transition-colors p-1 cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Simulate Kiosk Fullscreen"}
              >
                {isFullscreen ? <IconMinimize size={20} /> : <IconMaximize size={20} />}
              </button>
              <button
                type="button"
                className="hover:text-black transition-colors p-1 cursor-pointer"
                title="Assessment Information"
              >
                <IconInfoCircle size={20} />
              </button>
              <button
                type="button"
                className="hover:text-black transition-colors p-1 cursor-pointer"
                title="Candidate Profile"
              >
                <IconUserCircle size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* 2. WORKSPACE AREA (mt-12 perfectly balances h-12 header with zero extra gap) */}
        <div
          ref={workspaceRef}
          className="mt-12 flex-1 flex flex-col min-h-0 overflow-hidden relative pb-14 bg-white"
        >
          {/* PROGRESS LINE */}
          <div className="h-0.5 bg-gray-200 shrink-0">
            <div
              className="h-full transition-all duration-500 bg-black"
              style={{
                width: `${
                  sortedTasks.length > 0
                    ? ((answers[sortedTasks[0]?.id]?.trim() ? 50 : 0) +
                        (answers[sortedTasks[1]?.id]?.trim() ? 50 : 0))
                    : 0
                }%`,
              }}
            />
          </div>

          {/* MOBILE TABS (Matching Reading Exam style) */}
          <div className="lg:hidden flex shrink-0 border-b border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setMobileTab("prompt")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                mobileTab === "prompt"
                  ? "bg-black text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              Task {activeTaskIdx + 1} Prompt
            </button>

            <button
              type="button"
              onClick={() => setMobileTab("response")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                mobileTab === "response"
                  ? "bg-black text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              Response Area ({activeWordCount} words)
            </button>
          </div>

          {/* MAIN SPLITSCREEN WORKSPACE */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {isDesktop ? (
              <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={50} minSize={30}>
                  {promptPanel}
                </ResizablePanel>

                {/* Resizable Divider identical to Reading Exam */}
                <ResizableHandle
                  withHandle
                  className="w-1.5 bg-gray-200 hover:bg-black transition-all cursor-col-resize shrink-0 h-full"
                />

                <ResizablePanel defaultSize={50} minSize={30}>
                  {responsePanel}
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <div className="h-full flex flex-col overflow-hidden">
                <div
                  className={`${
                    mobileTab === "response" ? "hidden" : "flex"
                  } flex-col h-full overflow-hidden`}
                >
                  {promptPanel}
                </div>
                <div
                  className={`${
                    mobileTab === "prompt" ? "hidden" : "flex"
                  } flex-col h-full overflow-hidden`}
                >
                  {responsePanel}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. PERSISTENT NAVIGATION BAR (Matching Reading Exam footer) */}
        <footer className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t-2 border-black flex items-center justify-between px-4 z-40 select-none font-sans">
          {/* LEFT: TASK SELECTORS */}
          <div className="flex items-center gap-2">
            {sortedTasks.map((t, idx) => {
              const isCompleted = !!answers[t.id]?.trim();
              const isSelected = activeTaskIdx === idx;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSwitchTask(idx as 0 | 1)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-bold border transition-colors select-none cursor-pointer ${
                    isSelected
                      ? "bg-black border-black text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>Task {idx + 1}</span>
                  {isCompleted && (
                    <IconCheck
                      size={14}
                      className={isSelected ? "text-white" : "text-green-600 font-bold"}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* CENTER: WORD COUNTS STATUS */}
          <div className="hidden md:flex items-center gap-4 text-xs font-medium text-gray-600">
            <span>
              Task 1:{" "}
              <strong
                className={
                  answers[sortedTasks[0]?.id]?.trim() ? "text-black" : "text-gray-400"
                }
              >
                {countWords(answers[sortedTasks[0]?.id] || "")} words
              </strong>
            </span>
            <span className="text-gray-300">|</span>
            <span>
              Task 2:{" "}
              <strong
                className={
                  answers[sortedTasks[1]?.id]?.trim() ? "text-black" : "text-gray-400"
                }
              >
                {countWords(answers[sortedTasks[1]?.id] || "")} words
              </strong>
            </span>
          </div>

          {/* RIGHT: SUBMIT TEST */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              disabled={submitMutation.isPending}
              className={`flex items-center gap-1.5 px-5 py-2 text-xs md:text-sm font-black border transition-all select-none shadow-sm ${
                !submitMutation.isPending
                  ? "bg-black border-black hover:bg-gray-800 text-white cursor-pointer"
                  : "bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <IconUpload size={16} />
              <span>{submitMutation.isPending ? "SUBMITTING..." : "SUBMIT EXAM"}</span>
            </button>
          </div>
        </footer>

        {/* 4. CONFIRMATION SUBMISSION MODAL */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 select-none">
            <div className="bg-white rounded-none border-2 border-black shadow-2xl p-6 w-full max-w-[480px] flex flex-col font-sans animate-fadeIn">
              <h3 className="font-bold text-lg text-black mb-2 flex items-center gap-2">
                <IconAlertCircle size={20} className="text-black shrink-0" />
                Submit Writing Assessment
              </h3>

              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Are you sure you want to finish and submit your writing test responses? You will
                not be able to modify your essays once submitted.
              </p>

              <div className="border border-gray-200 p-3 mb-5 space-y-2 bg-gray-50 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Task 1 Response:</span>
                  <span
                    className={
                      answers[sortedTasks[0]?.id]?.trim()
                        ? "text-black font-bold"
                        : "text-red-500 font-medium"
                    }
                  >
                    {answers[sortedTasks[0]?.id]?.trim()
                      ? `${countWords(answers[sortedTasks[0]?.id])} words`
                      : "No response entered"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Task 2 Response:</span>
                  <span
                    className={
                      answers[sortedTasks[1]?.id]?.trim()
                        ? "text-black font-bold"
                        : "text-red-500 font-medium"
                    }
                  >
                    {answers[sortedTasks[1]?.id]?.trim()
                      ? `${countWords(answers[sortedTasks[1]?.id])} words`
                      : "No response entered"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                >
                  RETURN TO EXAM
                </button>
                <button
                  type="button"
                  onClick={() => doSubmit(answers)}
                  className="px-5 py-2 bg-black hover:bg-gray-800 text-white text-xs font-black transition cursor-pointer"
                >
                  YES, SUBMIT TEST
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
