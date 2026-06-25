/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { writingService } from "@/services/writing.services";
import { WritingCandidateHeader } from "@/components/Writing/WritingCandidateHeader";
import { toast } from "sonner";
import {
  IconLoader2,
  IconAlertCircle,
  IconCheck,
  IconAlertTriangle,
  IconPhoto,
  IconFileText,
} from "@tabler/icons-react";
import { useAuth } from "@/providers/AuthProvider";
import Link from "next/link";

interface Props {
  params: Promise<{ examId: string }>;
}

// Word counting helper matching official IELTS guidelines
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

// Convert seconds into standard HH:MM:SS / MM:SS format
function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return "00:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (num: number) => String(num).padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${pad(minutes)}:${pad(secs)}`;
}

export default function WritingExamPage({ params }: Props) {
  const { examId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  // Core Exam States
  const [answers, setAnswers] = useState<Record<string, string>>({}); // key is taskId
  const [activeTaskIdx, setActiveTaskIdx] = useState<0 | 1>(0); // 0 = Task 1, 1 = Task 2
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [testTimeRemaining, setTestTimeRemaining] = useState<number | null>(null);

  // Splitscreen Resizing State
  const [leftWidth, setLeftWidth] = useState(50); // percentage of left panel
  const [isDragging, setIsDragging] = useState(false);

  // Handle document level mouse dragging event listeners
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = (e.clientX / window.innerWidth) * 100;
      // Constraints: restrict panels between 25% and 75%
      if (newWidth >= 25 && newWidth <= 75) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const submittedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Exam Query
  const { data, isLoading, isError } = useQuery({
    queryKey: ["writing-exam-practice", examId],
    queryFn: () => writingService.getExamById(examId),
    retry: 1,
  });

  const exam = data?.data;
  const sortedTasks = exam?.tasks ? [...exam.tasks].sort((a, b) => a.order - b.order) : [];
  const activeTask = sortedTasks[activeTaskIdx];

  // Tanstack submission mutation
  const submitMutation = useMutation({
    mutationFn: (snap: Record<string, string>) => {
      const responsesArray = Object.entries(snap)
        .map(([taskId, essay]) => ({
          taskId,
          essay,
          wordCount: countWords(essay),
        }));

      return writingService.submitAttempt(examId, {
        responses: responsesArray,
      });
    },
    onSuccess: (res) => {
      toast.success("Writing attempt submitted successfully!");
      router.push(`/practice/writing/${examId}/review/${res.data.id}`);
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

  // Initialize timer once exam details are fetched
  useEffect(() => {
    if (exam && testTimeRemaining === null) {
      setTestTimeRemaining(exam.duration * 60);
      
      // Initialize blank answers for both tasks
      const initialAnswers: Record<string, string> = {};
      sortedTasks.forEach((t) => {
        initialAnswers[t.id] = "";
      });
      setAnswers(initialAnswers);
    }
  }, [exam, sortedTasks, testTimeRemaining]);

  // Tick the timer
  useEffect(() => {
    if (testTimeRemaining === null) return;

    if (testTimeRemaining <= 0) {
      if (!submittedRef.current) {
        toast.info("Time is up! Auto-submitting your writing responses...");
        doSubmit(answers);
      }
      return;
    }

    timerRef.current = setTimeout(() => {
      setTestTimeRemaining((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [testTimeRemaining, answers, doSubmit]);

  // Lock-down exam listeners (context menu, reloads, keys)
  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error("Right-click context menu is locked during the exam.");
    };

    const preventReloads = (e: KeyboardEvent) => {
      if (e.key === "F5") {
        e.preventDefault();
        toast.error("Page refresh is disabled during the assessment.");
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
        e.preventDefault();
        toast.error("Page reload is disabled during the assessment.");
      }
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase()))) {
        e.preventDefault();
        toast.error("Developer inspection tools are disabled.");
      }
    };

    document.addEventListener("contextmenu", preventContextMenu);
    window.addEventListener("keydown", preventReloads);

    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.removeEventListener("contextmenu", preventContextMenu);
      window.removeEventListener("keydown", preventReloads);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        toast.error(`Kiosk fullscreen error: ${err.message}`);
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <IconLoader2 size={40} className="animate-spin text-violet-600" />
        <p className="text-sm font-bold text-gray-500">Preparing Writing Exam workspace...</p>
      </div>
    );
  }

  if (isError || !exam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 max-w-md mx-auto text-center px-4">
        <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
          <IconAlertCircle size={28} />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-black text-gray-900 text-lg">Exam Workspace Failed</h2>
          <p className="text-sm text-gray-500 font-medium leading-relaxed">
            We couldn't initialize your assessment session. The exam may have been deleted or unpublished.
          </p>
        </div>
        <Link
          href="/practice/writing"
          className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-sm transition"
        >
          Return to Practice Zone
        </Link>
      </div>
    );
  }

  const timeRemainingSeconds = testTimeRemaining ?? 3600;
  const isWarningPeriod = timeRemainingSeconds < 600; // < 10 mins
  const activeEssay = activeTask ? (answers[activeTask.id] || "") : "";
  const activeWordCount = countWords(activeEssay);
  const minWordsRequired = activeTask?.minWords ?? (activeTaskIdx === 0 ? 150 : 250);

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col select-none overflow-hidden antialiased">
      {/* Dynamic CBT Candidate Header */}
      <WritingCandidateHeader
        candidateName={user?.name || "IELTS Candidate"}
        candidateId={user?.id?.slice(0, 8).toUpperCase() || "CANDIDATE"}
        examTitle={exam.title}
        examType={exam.examType}
        timeRemainingText={formatTimeRemaining(timeRemainingSeconds)}
        isWarningPeriod={isWarningPeriod}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Main Testing Workspace Grid (Left/Right Splitscreen) */}
      <main className="flex-1 mt-14 mb-16 flex flex-row overflow-hidden w-full h-[calc(100vh-120px)] relative">
        {/* LEFT PANEL: Visual Stimulus / Exam Prompts */}
        <section 
          className="border-r border-gray-200 bg-white flex flex-col overflow-y-auto"
          style={{ width: `${leftWidth}%` }}
        >
          {activeTask ? (
            <div className="pt-4 px-6 pb-6 md:pt-4 md:px-8 md:pb-8 space-y-4">
              {/* Task Title & Guidance */}
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  Writing {activeTask.taskType === "TASK_1" ? "Task 1" : "Task 2"}
                </h2>
                <p className="text-xs font-semibold text-violet-600 mt-0.5 uppercase tracking-wide">
                  {activeTask.taskType === "TASK_1"
                    ? exam.examType === "ACADEMIC"
                      ? "Visual Information Description"
                      : "Situational Letter Writing"
                    : "Argumentative / Problem Essay"}
                </p>
                <div className="flex gap-4 mt-3 text-xs text-gray-400 font-bold">
                  <span>Suggested time: {activeTaskIdx === 0 ? "20" : "40"} mins</span>
                  <span>Minimum words: {minWordsRequired}</span>
                </div>
              </div>

              {/* Prompt Text / IELTS Question Instruction (KEPT ABOVE IMAGE & BOLDED) */}
              <div className="space-y-4 leading-relaxed text-sm select-text">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Question prompt:</p>
                <div 
                  className="whitespace-pre-wrap bg-slate-50/50 p-5 rounded-xl border border-gray-100 font-bold text-gray-900 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: activeTask.instruction }}
                />
              </div>

              {/* PDF stimulator notice */}
              {activeTask.pdfUrl && (
                <div className="flex items-center justify-between p-4 bg-violet-50 border border-violet-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <IconFileText className="text-violet-600" size={24} />
                    <div>
                      <p className="text-xs font-bold text-violet-900">Task Reference PDF</p>
                      <p className="text-[10px] text-violet-700/80 font-medium">A PDF file is attached as a visual stimulus.</p>
                    </div>
                  </div>
                  <a
                    href={activeTask.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition"
                  >
                    Open PDF
                  </a>
                </div>
              )}

              {/* Visual image stimulus (Task 1 Academic charts, maps, diagrams) */}
              {activeTask.imageUrl && (
                <div className="bg-slate-50 border border-gray-150 rounded-xl p-3 flex flex-col items-center justify-center">
                  <div className="relative group max-w-full rounded-lg overflow-hidden bg-white shadow-sm border border-gray-200">
                    <img
                      src={activeTask.imageUrl}
                      alt="Visual Stimulus"
                      className="max-h-[300px] object-contain mx-auto"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium mt-2 flex items-center gap-1">
                    <IconPhoto size={12} /> Visual representation for descriptions.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center flex-1 text-gray-400 text-sm">
              Please choose a writing task from the tabs below.
            </div>
          )}
        </section>

        {/* Resizable Divider Between Question (Left) & Answer Place (Right) */}
        <div
          className="w-1.5 hover:w-2 bg-gray-200 hover:bg-violet-500 active:bg-violet-600 cursor-col-resize transition-all h-full relative z-30 flex-shrink-0 flex items-center justify-center group"
          onMouseDown={handleMouseDown}
        >
          <div className="w-[2px] h-8 bg-gray-400 group-hover:bg-white rounded-full transition-colors" />
        </div>

        {/* RIGHT PANEL: High-performance Text Editor */}
        <section 
          className="bg-slate-50 flex flex-col overflow-hidden relative"
          style={{ width: `${100 - leftWidth}%` }}
        >
          {activeTask ? (
            <div className="flex-1 flex flex-col pt-4 px-6 pb-6 h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Response Area
                </span>
                
                {/* Live word count indicator */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                      activeWordCount >= minWordsRequired
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : activeWordCount > 0
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <span>Words:</span>
                    <strong className="font-extrabold">{activeWordCount}</strong>
                    <span className="text-[10px] opacity-60">/ {minWordsRequired}</span>
                  </span>
                  
                  {activeWordCount > 0 && activeWordCount < minWordsRequired && (
                    <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5 animate-pulse" title="Under recommended word count">
                      <IconAlertTriangle size={12} /> Needs {minWordsRequired - activeWordCount} more
                    </span>
                  )}
                </div>
              </div>

              {/* Textarea editor box */}
              <div className="flex-1 relative rounded-2xl border border-gray-200 shadow-sm overflow-hidden bg-white focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500 transition-all">
                <textarea
                  value={activeEssay}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Type your response here..."
                  className="absolute inset-0 w-full h-full p-6 outline-none border-none text-base text-gray-800 placeholder:text-gray-400 resize-none font-sans leading-relaxed select-text"
                  spellCheck={false}
                  autoComplete="off"
                  autoFocus
                />
              </div>
            </div>
          ) : null}
        </section>
      </main>

      {/* Dynamic Bottom Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-between px-6 z-40 select-none shadow-md">
        {/* Left footer: Task selector buttons */}
        <div className="flex gap-2">
          {sortedTasks.map((t, idx) => {
            const isCompleted = answers[t.id]?.trim().length > 0;
            const isSelected = activeTaskIdx === idx;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTaskIdx(idx as 0 | 1)}
                className={`px-5 py-2 rounded-xl text-xs font-black border transition-all duration-200 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-violet-600 border-violet-600 text-white shadow-sm"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>Task {idx + 1}</span>
                {isCompleted && (
                  <IconCheck
                    size={14}
                    className={`stroke-[3] ${isSelected ? "text-white" : "text-emerald-500"}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right footer: Submit button */}
        <button
          type="button"
          onClick={() => setShowSubmitModal(true)}
          disabled={submitMutation.isPending}
          className="px-6 py-2 bg-[#1B3A6B] hover:bg-[#152e54] text-white rounded-xl text-xs font-black shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {submitMutation.isPending ? "Submitting..." : "Submit Exam"}
        </button>
      </footer>

      {/* Confirmation Submission Dialog Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-gray-150 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              <IconAlertCircle size={20} className="text-violet-600 shrink-0" />
              Confirm Examination Submit
            </h3>
            
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Are you sure you want to finish and submit your writing test responses? 
              You will not be able to change your answers once submitted.
            </p>

            <div className="bg-slate-50 rounded-xl p-3 border border-gray-100 text-xs font-semibold text-gray-600 space-y-1.5">
              <div className="flex justify-between">
                <span>Task 1 Essay:</span>
                <span className={answers[sortedTasks[0]?.id]?.trim().length > 0 ? "text-emerald-600" : "text-rose-500"}>
                  {answers[sortedTasks[0]?.id]?.trim().length > 0 ? `${countWords(answers[sortedTasks[0]?.id])} words` : "Empty"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Task 2 Essay:</span>
                <span className={answers[sortedTasks[1]?.id]?.trim().length > 0 ? "text-emerald-600" : "text-rose-500"}>
                  {answers[sortedTasks[1]?.id]?.trim().length > 0 ? `${countWords(answers[sortedTasks[1]?.id])} words` : "Empty"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4.5 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-slate-50 transition"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => doSubmit(answers)}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-black shadow-md transition"
              >
                Submit Responses
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
