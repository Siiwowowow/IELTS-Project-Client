/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  IconX,
  IconClock,
  IconMaximize,
  IconMinimize,
  IconFileText,
  IconPhoto,
  IconAlertTriangle,
  IconCheck,
  IconEye,
  IconSparkles,
  IconRotate,
  IconExternalLink,
} from "@tabler/icons-react";

export interface WritingPreviewTask {
  taskType: "TASK_1" | "TASK_2";
  instruction: string;
  imageUrl?: string;
  pdfUrl?: string;
  minWords: number;
  modelAnswer?: string;
  order: number;
}

export interface WritingExamPreviewData {
  title: string;
  description?: string;
  examType: "ACADEMIC" | "GENERAL_TRAINING";
  duration: number;
  tasks: WritingPreviewTask[];
}

interface WritingExamPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: WritingExamPreviewData;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return "00:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${pad(minutes)}:${pad(secs)}`;
}

export function WritingExamPreviewModal({
  isOpen,
  onClose,
  exam,
}: WritingExamPreviewModalProps) {
  const [activeTaskIdx, setActiveTaskIdx] = useState<0 | 1>(0);
  const [responses, setResponses] = useState<Record<number, string>>({
    0: "",
    1: "",
  });
  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState((exam.duration || 60) * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync timer when opened
  useEffect(() => {
    if (isOpen) {
      setTimeRemaining((exam.duration || 60) * 60);
      setIsTimerRunning(true);
    }
  }, [isOpen, exam.duration]);

  // Handle countdown
  useEffect(() => {
    if (!isOpen || !isTimerRunning) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isTimerRunning]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle divider dragging (touch + mouse)
  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const newWidth = (relativeX / rect.width) * 100;
      if (newWidth >= 20 && newWidth <= 80) {
        setLeftWidth(newWidth);
      }
    };
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX);
    };
    const handleEnd = () => setIsDragging(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleEnd);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  const currentTask = exam.tasks[activeTaskIdx] || {
    taskType: activeTaskIdx === 0 ? "TASK_1" : "TASK_2",
    instruction: "No instructions provided yet.",
    minWords: activeTaskIdx === 0 ? 150 : 250,
    order: activeTaskIdx + 1,
  };

  const currentResponse = responses[activeTaskIdx] || "";
  const currentWordCount = countWords(currentResponse);
  const minWords = currentTask.minWords || (activeTaskIdx === 0 ? 150 : 250);
  const isComplete = currentWordCount >= minWords;

  const handleResponseChange = (text: string) => {
    setResponses((prev) => ({ ...prev, [activeTaskIdx]: text }));
  };

  const handleLoadModelAnswer = () => {
    if (currentTask.modelAnswer) {
      setResponses((prev) => ({
        ...prev,
        [activeTaskIdx]: currentTask.modelAnswer || "",
      }));
    }
  };

  const handleClearCurrent = () => {
    setResponses((prev) => ({ ...prev, [activeTaskIdx]: "" }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col antialiased animate-fadeIn">
      {/* ── TOP TEACHER PREVIEW CONTROL BAR ── */}
      <header className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-white shrink-0 z-30 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-xs font-bold text-indigo-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <IconEye size={14} />
            <span>Student Exam Preview Mode</span>
          </div>
          <span className="hidden sm:inline-block text-xs font-semibold text-slate-400 truncate max-w-sm">
            {exam.title || "Untitled Writing Exam"}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {exam.examType === "GENERAL_TRAINING" ? "General Training" : "Academic"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {currentTask.modelAnswer && (
            <button
              type="button"
              onClick={handleLoadModelAnswer}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-xs font-bold text-white transition cursor-pointer"
              title="Paste your Model Answer into the candidate response area to verify formatting & word count"
            >
              <IconSparkles size={13} className="text-amber-300" />
              <span>Load Model Answer</span>
            </button>
          )}

          {currentResponse && (
            <button
              type="button"
              onClick={handleClearCurrent}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
              title="Clear typed response"
            >
              <IconRotate size={12} />
              <span>Clear</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer ml-2 shadow-sm"
          >
            <IconX size={14} />
            <span>Exit Preview</span>
          </button>
        </div>
      </header>

      {/* ── SIMULATED STUDENT CANDIDATE HEADER ── */}
      <div className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 select-none shadow-xs">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-base md:text-lg text-violet-700 tracking-tight">
            IELTS Writing Assessment
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100 uppercase tracking-wide">
            {exam.examType === "GENERAL_TRAINING" ? "General Training" : "Academic"}
          </span>
          <div className="hidden lg:flex items-center gap-4 border-l border-gray-200 pl-4 ml-2 text-xs font-medium text-gray-500">
            <span className="truncate max-w-xs">
              Test: <strong className="text-gray-800">{exam.title || "IELTS Writing"}</strong>
            </span>
            <span>
              Candidate: <strong className="text-gray-800">Preview Candidate</strong>
            </span>
            <span>
              ID: <strong className="text-gray-800">CAND-DEMO</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* TIMER */}
          <div
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-sm font-bold font-mono transition-colors shadow-2xs cursor-pointer ${
              timeRemaining < 600
                ? "text-rose-600 border-rose-200 bg-rose-50 animate-pulse"
                : "text-violet-700 border-gray-200 bg-gray-50 hover:bg-gray-100"
            }`}
            title={`Time Remaining (${isTimerRunning ? "Click to Pause" : "Click to Resume"})`}
          >
            <IconClock size={16} className={timeRemaining < 600 ? "text-rose-500" : "text-violet-600"} />
            <span>{formatTime(timeRemaining)}</span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="text-gray-400 hover:text-violet-700 p-1.5 transition rounded-lg hover:bg-gray-50 cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
          </button>
        </div>
      </div>

      {/* ── MAIN TESTING WORKSPACE (SPLITSCREEN) ── */}
      <div
        ref={containerRef}
        className="flex-1 flex flex-row overflow-hidden w-full relative bg-slate-100"
      >
        {/* LEFT PANEL: Stimulus / Prompt */}
        <section
          className="border-r border-gray-200 bg-white flex flex-col overflow-y-auto"
          style={{ width: `${leftWidth}%` }}
        >
          <div className="p-6 md:p-8 space-y-5">
            {/* Task Title & Guidance */}
            <div className="border-b border-gray-100 pb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  Writing {currentTask.taskType === "TASK_1" ? "Task 1" : "Task 2"}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLeftWidth(leftWidth > 58 ? 50 : 70)}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors shadow-2xs cursor-pointer"
                    title={leftWidth > 58 ? "Restore 50/50 Split View" : "Expand Task Prompt"}
                  >
                    {leftWidth > 58 ? <IconMinimize size={13} /> : <IconMaximize size={13} />}
                    <span>{leftWidth > 58 ? "50/50" : "Expand"}</span>
                  </button>
                  <span className="text-[11px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-2.5 py-0.5 rounded-full">
                    {currentTask.taskType === "TASK_1" ? "Suggested: 20 mins" : "Suggested: 40 mins"}
                  </span>
                </div>
              </div>
              <p className="text-xs font-semibold text-violet-600 mt-1 uppercase tracking-wide">
                {currentTask.taskType === "TASK_1"
                  ? exam.examType === "ACADEMIC"
                    ? "Visual Information Description"
                    : "Situational Letter Writing"
                  : "Argumentative / Problem Essay"}
              </p>
              <div className="flex gap-4 mt-2 text-xs text-gray-400 font-bold">
                <span>Minimum words: {minWords}</span>
                <span>Type: {exam.examType}</span>
              </div>
            </div>

            {/* Prompt Text / IELTS Question Instruction */}
            <div className="space-y-2 select-text">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Question Prompt:
              </p>
              {currentTask.instruction ? (
                currentTask.taskType === "TASK_1" &&
                !currentTask.instruction.includes("ielts-task1-sheet") &&
                !currentTask.instruction.includes("ielts-task1-box") ? (
                  <div className="bg-white p-6 md:p-8 rounded-2xl border-2 border-gray-300 shadow-sm font-sans select-text space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-base md:text-lg font-black tracking-tight text-slate-900">
                        WRITING TASK 1
                      </h3>
                      <p className="text-sm text-slate-800 font-normal leading-relaxed">
                        You should spend about 20 minutes on this task.
                      </p>
                    </div>

                    {/* The Official IELTS Box */}
                    <div className="my-4 p-5 md:p-6 border-2 border-slate-900 bg-white rounded-none shadow-2xs font-normal text-slate-900 leading-relaxed text-sm md:text-base select-text whitespace-pre-wrap">
                      <div dangerouslySetInnerHTML={{ __html: currentTask.instruction }} />
                    </div>

                    <p className="text-sm text-slate-800 font-normal">
                      Write at least {minWords} words.
                    </p>
                  </div>
                ) : currentTask.taskType === "TASK_2" &&
                !currentTask.instruction.includes("ielts-task2-sheet") &&
                !currentTask.instruction.includes("ielts-task2-box") ? (
                  <div className="bg-white p-6 md:p-8 rounded-2xl border-2 border-gray-300 shadow-sm font-sans select-text space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-base md:text-lg font-black tracking-tight text-slate-900">
                        WRITING TASK 2
                      </h3>
                      <p className="text-sm text-slate-800 font-normal leading-relaxed">
                        You should spend about 40 minutes on this task.
                      </p>
                      <p className="text-sm text-slate-800 font-normal leading-relaxed">
                        Present a written argument or case to an educated reader with no specialist knowledge of the following topic.
                      </p>
                    </div>

                    {/* The Official IELTS Box */}
                    <div className="my-4 p-5 md:p-6 border-2 border-slate-900 bg-white rounded-none shadow-2xs font-normal text-slate-900 leading-relaxed text-sm md:text-base select-text whitespace-pre-wrap">
                      <div dangerouslySetInnerHTML={{ __html: currentTask.instruction }} />
                    </div>

                    <p className="text-sm text-slate-800 font-normal leading-relaxed">
                      Give reasons for your answer and include any relevant examples from your own knowledge or experience.
                    </p>
                    <p className="text-sm text-slate-800 font-normal">
                      Write at least {minWords} words.
                    </p>
                  </div>
                ) : (
                  <div
                    className="whitespace-pre-wrap bg-white p-6 rounded-2xl border border-gray-200 font-normal text-gray-900 leading-relaxed text-sm md:text-[15px]"
                    dangerouslySetInnerHTML={{ __html: currentTask.instruction }}
                  />
                )
              ) : (
                <div className="p-5 rounded-xl border border-dashed border-gray-300 text-gray-400 italic text-sm text-center">
                  No question prompt text has been entered yet.
                </div>
              )}
            </div>

            {/* PDF Stimulus Attachment */}
            {currentTask.pdfUrl && (
              <div className="flex items-center justify-between p-4 bg-violet-50/70 border border-violet-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <IconFileText className="text-violet-600 shrink-0" size={24} />
                  <div>
                    <p className="text-xs font-bold text-violet-900">Task Reference Document (PDF)</p>
                    <p className="text-[10px] text-violet-700/80 font-medium">Visual stimulus file attached for candidates.</p>
                  </div>
                </div>
                <a
                  href={currentTask.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                >
                  <span>Open PDF</span>
                  <IconExternalLink size={13} />
                </a>
              </div>
            )}

            {/* Visual Image Stimulus (Task 1 Academic) */}
            {currentTask.imageUrl && (
              <div className="bg-slate-50 border border-gray-200 rounded-xl p-3.5 flex flex-col items-center justify-center">
                <div
                  onClick={() => setIsImageZoomed(true)}
                  className="relative group max-w-full rounded-lg overflow-hidden bg-white shadow-xs border border-gray-200 cursor-zoom-in"
                  title="Click to view full size"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentTask.imageUrl}
                    alt="Task Visual Stimulus"
                    className="max-h-[340px] w-auto object-contain mx-auto"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="px-3 py-1 bg-black/70 text-white text-xs font-bold rounded-full">
                      Click to zoom
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-gray-500 font-semibold mt-2.5 flex items-center gap-1">
                  <IconPhoto size={14} className="text-violet-500" />
                  Visual stimulus provided for candidate reference
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Resizable Divider Handle */}
        <div
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
          onDoubleClick={() => setLeftWidth(50)}
          className="w-2 hover:w-2.5 bg-gray-200 hover:bg-violet-600 active:bg-violet-600 cursor-col-resize transition-all h-full relative z-20 shrink-0 flex items-center justify-center group after:absolute after:inset-y-0 after:-inset-x-2.5 after:z-30 after:cursor-col-resize select-none"
          title="Drag anywhere to resize (Double-click to reset 50/50)"
        >
          <div className="w-1 h-10 bg-gray-400 group-hover:bg-white group-active:bg-white rounded-full transition-colors" />
        </div>

        {/* RIGHT PANEL: Interactive Response Editor */}
        <section
          className="bg-slate-50 flex flex-col overflow-hidden relative"
          style={{ width: `${100 - leftWidth}%` }}
        >
          <div className="flex-1 flex flex-col p-6 h-full">
            {/* Word count status header */}
            <div className="flex items-center justify-between mb-2 select-none">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <span>Response Area</span>
                <span className="text-[10px] text-gray-400 font-medium">(Interactive typing test)</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLeftWidth(leftWidth < 42 ? 50 : 30)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 transition-colors shadow-2xs cursor-pointer"
                  title={leftWidth < 42 ? "Restore 50/50 Split View" : "Expand Response Editor"}
                >
                  {leftWidth < 42 ? <IconMinimize size={13} /> : <IconMaximize size={13} />}
                  <span>{leftWidth < 42 ? "50/50" : "Expand"}</span>
                </button>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 transition-all shadow-2xs ${
                    isComplete
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                      : currentWordCount > 0
                      ? "bg-amber-50 text-amber-700 border border-amber-300"
                      : "bg-white text-gray-500 border border-gray-200"
                  }`}
                >
                  <span>Words:</span>
                  <strong className="font-extrabold text-sm">{currentWordCount}</strong>
                  <span className="text-[10px] opacity-70">/ {minWords}</span>
                  {isComplete && <IconCheck size={14} className="stroke-[3] text-emerald-600 ml-0.5" />}
                </span>

                {currentWordCount > 0 && !isComplete && (
                  <span className="hidden sm:flex text-[11px] text-amber-700 bg-amber-50/80 border border-amber-200 px-2 py-0.5 rounded font-semibold items-center gap-1">
                    <IconAlertTriangle size={12} />
                    <span>Needs {minWords - currentWordCount} more</span>
                  </span>
                )}
              </div>
            </div>

            {/* Textarea */}
            <div className="flex-1 relative rounded-2xl border border-gray-300 shadow-sm overflow-hidden bg-white focus-within:ring-2 focus-within:ring-violet-500/25 focus-within:border-violet-500 transition-all">
              <textarea
                value={currentResponse}
                onChange={(e) => handleResponseChange(e.target.value)}
                placeholder="Type your response here..."
                className="absolute inset-0 w-full h-full p-6 outline-none border-none text-base text-gray-800 placeholder:text-gray-400 resize-none font-sans leading-relaxed select-text"
                spellCheck={false}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── BOTTOM TASK SWITCHER FOOTER ── */}
      <footer className="h-16 bg-white border-t border-gray-200 px-6 flex items-center justify-between shrink-0 select-none z-30 shadow-xs">
        <div className="flex items-center gap-2">
          {([0, 1] as const).map((idx) => {
            const task = exam.tasks[idx];
            const words = countWords(responses[idx] || "");
            const req = task?.minWords || (idx === 0 ? 150 : 250);
            const active = activeTaskIdx === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveTaskIdx(idx)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                  active
                    ? "bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-500/20"
                    : "bg-white text-gray-700 border-gray-200 hover:border-violet-300 hover:bg-gray-50"
                }`}
              >
                <span>Task {idx + 1}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {words} / {req}w
                </span>
                {words >= req && (
                  <IconCheck size={14} className={active ? "text-emerald-300" : "text-emerald-600"} />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-semibold hidden md:inline">
            Drag the divider to adjust split views
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </footer>

      {/* Image Zoom Modal */}
      {isImageZoomed && currentTask.imageUrl && (
        <div
          onClick={() => setIsImageZoomed(false)}
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-6 cursor-zoom-out animate-fadeIn"
        >
          <div className="relative max-w-5xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentTask.imageUrl}
              alt="Zoomed Visual Stimulus"
              className="max-h-[85vh] w-auto object-contain mx-auto"
            />
            <button
              onClick={() => setIsImageZoomed(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/70 hover:bg-black text-white transition"
            >
              <IconX size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WritingExamPreviewModal;
