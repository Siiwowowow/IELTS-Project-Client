/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
 
"use client";

import { use, useState, useRef, useCallback, useEffect, useMemo } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { readingService } from "@/services/reading.services";
import { ExamTimer } from "@/components/Reading/ExamTimer";
import { QuestionRenderer } from "@/components/Reading/QuestionRenderer";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";
import {
  IconLoader2,
  IconSend,
  IconBook,
  IconAlertCircle,
  IconArrowLeft,
  IconArrowRight,
 
  IconMaximize,
  IconMinimize,
  IconClock,
  IconInfoCircle,
  IconUserCircle,
  IconLayoutGrid,
  IconUpload,
  IconCheck,
} from "@tabler/icons-react";


interface Props {
  params: Promise<{ examId: string }>;
}

// Format enum key → readable label
function formatGroupType(type: string) {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ExamPage({ params }: Props) {
  const { examId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  // answers: { [questionId]: submittedAnswer }
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answersRef = useRef<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  // Mobile tab: "passage" | "questions"
  const [mobileTab, setMobileTab] = useState<"passage" | "questions">("passage");

  const [isDesktop, setIsDesktop] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const toggleKioskFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        toast.error(`Kiosk Mode expansion failed: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const submittedRef = useRef(false);

  // ── Fetch exam ──────────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reading-exam", examId],
    queryFn: () => readingService.getExamById(examId),
  });
  const exam = data?.data;

  // ── Submit mutation ─────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (snap: Record<string, string>) =>
      readingService.submitAttempt(examId, {
        answers: Object.entries(snap).map(([questionId, submittedAnswer]) => ({
          questionId,
          submittedAnswer,
        })),
      }),
    onSuccess: (res) => {
      toast.success("Answers submitted! Redirecting to your results…");
      router.push(`/user/reading/${examId}/review/${res.data.id}`);
    },
    onError: (err: any) => {
      submittedRef.current = false; // allow retry
      const msg = err?.response?.data?.message || err?.message || "Submission failed. Please try again.";
      toast.error(msg);
      console.error("Submission error:", err?.response?.data || err);
    },
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAnswer = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: value };
      answersRef.current = next;
      return next;
    });
  }, []);

  const doSubmit = useCallback(
    (snap: Record<string, string>) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      mutation.mutate(snap);
    },
    [mutation]
  );

  const handleSubmitClick = () => {
    if (submittedRef.current || mutation.isPending) return;
    setShowSubmitModal(true);
  };

  const handleTimeUp = useCallback(() => {
    toast.warning("⏰ Time is up! Submitting your answers…");
    doSubmit(answersRef.current);
  }, [doSubmit]);

  const toggleFlag = (qId: string) => {
    setFlagged((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const passageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const goToNextPassage = (index: number) => {
    if (index < (exam?.passages?.length ?? 0) - 1) {
      passageRefs.current[index + 1]?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const goToPreviousPassage = (index: number) => {
    if (index > 0) {
      passageRefs.current[index - 1]?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToQuestion = (qId: string) => {
    setActiveQuestionId(qId);
    setMobileTab("questions");
    setTimeout(() => {
      const element = questionRefs.current[qId] || document.getElementById(`q-input-${qId}`);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        (element as HTMLElement).focus?.();
      }
    }, 50);
  };

  // ── Derived stats ────────────────────────────────────────────────────────────
  const processedPassages = useMemo(() => {
    let currentNum = 1;
    if (!exam?.passages) return [];
    return exam.passages.map((p) => ({
      ...p,
      questionGroups: (p.questionGroups ?? []).map((g) => ({
        ...g,
        questions: (g.questions ?? []).map((q) => ({
          ...q,
          questionNumber: currentNum++,
        })),
      })),
    }));
  }, [exam?.passages]);

  const allQuestions = useMemo(() => {
    return processedPassages.flatMap((p) => p.questionGroups.flatMap((g) => g.questions));
  }, [processedPassages]);

  const passageQuestions = useMemo(() => {
    const activePassage = processedPassages[currentPassageIndex];
    return activePassage?.questionGroups?.flatMap((g) => g.questions) ?? [];
  }, [processedPassages, currentPassageIndex]);

  const answeredCount = allQuestions.filter((q) => answers[q.id]?.trim()).length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;
  const totalCount = allQuestions.length;
  const progressPct = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;
  const unansweredCount = totalCount - answeredCount;

  // ── Loading / error states ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <IconLoader2 size={40} className="animate-spin text-primary" />
        <p className="text-sm text-gray-500 font-medium">Loading exam…</p>
      </div>
    );
  }

  if (isError || !exam) {
    return (
      <div className="flex items-center gap-3 p-5 bg-red-50 border border-red-100 rounded-2xl text-red-700 max-w-lg mx-auto mt-12">
        <IconAlertCircle size={22} className="shrink-0" />
        <div>
          <p className="font-semibold text-sm">Failed to load exam</p>
          <p className="text-xs mt-0.5 text-red-500">
            Please go back and try again.
          </p>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col h-screen bg-white text-gray-800 select-none relative font-sans -mt-4 -mx-4">
      {/* 1. CANDIDATE TOP HEADER */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-40 select-none font-sans shadow-sm">
        {/* LEFT: Logo and Candidate Details */}
        <div className="flex items-center">
          <span className="font-extrabold text-base md:text-lg text-red-750 tracking-tight">
            IELTS Reading Assessment
          </span>
          
          <div className="hidden sm:flex items-center gap-4 border-l border-gray-200 pl-4 ml-4 text-xs md:text-sm font-medium text-gray-500">
            <span>
              Candidate: <strong className="text-gray-800">{user?.name || "Student"}</strong>
            </span>
            <span>
              ID: <strong className="text-gray-800">{`BRIT${user?.id?.slice(-4).toUpperCase() || "1234"}`}</strong>
            </span>
            <span>
              Date: <strong className="text-gray-800">{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</strong>
            </span>
          </div>
        </div>

        {/* RIGHT: Countdown timer and utility icons */}
        <div className="flex items-center gap-4">
          {/* TIMER PILL */}
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-md border text-sm font-bold font-mono transition-colors shadow-sm bg-gray-50 text-red-700 border-gray-200"
            title="Time Remaining"
          >
            <IconClock size={16} className="text-red-500 animate-pulse" />
            <ExamTimer
              durationMinutes={exam.duration}
              onTimeUp={handleTimeUp}
              className="text-red-700 font-mono text-sm font-bold"
            />
          </div>

          {/* UTILITIES */}
          <div className="flex items-center gap-2.5 text-gray-400">
            <button
              type="button"
              onClick={toggleKioskFullscreen}
              className="hover:text-red-700 transition-colors p-1"
              title={isFullscreen ? "Exit Fullscreen" : "Simulate Kiosk Fullscreen"}
            >
              {isFullscreen ? <IconMinimize size={20} /> : <IconMaximize size={20} />}
            </button>
            <button
              type="button"
              className="hover:text-red-700 transition-colors p-1"
              title="Assessment Information"
            >
              <IconInfoCircle size={20} />
            </button>
            <button
              type="button"
              className="hover:text-red-700 transition-colors p-1"
              title="Candidate Profile"
            >
              <IconUserCircle size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* WORKSPACE AREA */}
      <div className="mt-14 flex-1 flex flex-col min-h-0 overflow-hidden relative pb-16 bg-[#F8FAFC]">
        
        {/* PROGRESS */}
        <div className="h-1 bg-red-950 shrink-0">
          <div
            className="h-full transition-all duration-500 bg-red-650"
            style={{
              width: `${totalCount ? (answeredCount / totalCount) * 100 : 0}%`
            }}
          />
        </div>

        {/* MOBILE TAB */}
        <div className="lg:hidden flex shrink-0 border-b border-gray-200 bg-white">
          <button
            onClick={() => setMobileTab("passage")}
            className={`flex-1 py-3 text-sm font-semibold ${
              mobileTab === "passage"
                ? "bg-red-700 text-white"
                : "bg-white text-gray-500"
            }`}
          >
            Passage
          </button>

          <button
            onClick={() => setMobileTab("questions")}
            className={`flex-1 py-3 text-sm font-semibold ${
              mobileTab === "questions"
                ? "bg-red-700 text-white"
                : "bg-white text-gray-500"
            }`}
          >
            Questions ({answeredCount}/{totalCount})
          </button>
        </div>

        {/* MAIN */}
        <div className="grow flex-1 min-h-0 overflow-hidden">
          {processedPassages.map((passage, idx) => {
            const passagePanel = (
              <div
                className={`scrollbar-hide ${
                  mobileTab === "questions" ? "hidden lg:block" : "block"
                }`}
                style={{ height: "100%", overflowY: "auto" }}
              >
                <div className="bg-white border border-gray-200 rounded-2xl p-6 h-full">
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <IconBook size={16} />
                    </div>
                    <h2 className="text-base font-bold text-gray-900">
                      {passage.title}
                    </h2>
                  </div>

                  {passage.text && (
                    <div
                      className="reading-passage"
                      dangerouslySetInnerHTML={{ __html: passage.text }}
                    />
                  )}

                  {passage.imageUrl && (
                    <img
                      src={passage.imageUrl}
                      alt="Passage"
                      className="w-full rounded-xl mt-4"
                    />
                  )}
                </div>
              </div>
            );

            const questionsPanel = (
              <div
                className={`scrollbar-hide space-y-4 ${
                  mobileTab === "passage" ? "hidden lg:block" : "block"
                }`}
                style={{ height: "100%", overflowY: "auto" }}
              >
                {passage.questionGroups.map((group, groupIdx) => (
                  <div
                    key={group.id}
                    className="bg-white border border-gray-200 rounded-2xl p-5"
                  >
                    {/* Group header */}
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                      <div className="h-6 w-6 rounded-full bg-[#B91C1C] text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {groupIdx + 1}
                      </div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                        {formatGroupType(group.type)}
                      </h3>
                      {group.questions.length > 0 && (
                        <span className="ml-auto text-xs text-gray-400">
                          Q{group.questions[0].questionNumber}
                          {group.questions.length > 1
                            ? `–${group.questions[group.questions.length - 1].questionNumber}`
                            : ""}
                        </span>
                      )}
                    </div>

                    <QuestionRenderer
                      group={group}
                      answers={answers}
                      onAnswer={handleAnswer}
                    />
                  </div>
                ))}

                {/* Bottom submit */}
                <button
                  onClick={handleSubmitClick}
                  disabled={mutation.isPending || submittedRef.current}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-2xl disabled:opacity-60 transition-all shadow-md shadow-red-700/20 text-sm animate-fade-in"
                >
                  {mutation.isPending ? (
                    <IconLoader2 size={16} className="animate-spin" />
                  ) : (
                    <IconSend size={16} />
                  )}
                  Submit All Answers
                </button>
              </div>
            );

            return (
              <div key={passage.id} className="flex-1 min-h-0 overflow-hidden">
                {isDesktop ? (
                  <ResizablePanelGroup orientation="horizontal" className="h-[calc(100vh-14rem)] w-full">
                    <ResizablePanel defaultSize={50} minSize={30}>
                      {passagePanel}
                    </ResizablePanel>
                    <ResizableHandle withHandle className="w-2 bg-gray-200 hover:bg-red-750 transition-all cursor-col-resize shrink-0 h-full mx-2 rounded-lg" />
                    <ResizablePanel defaultSize={50} minSize={30}>
                      {questionsPanel}
                    </ResizablePanel>
                  </ResizablePanelGroup>
                ) : (
                  <div className="flex-1 grid lg:grid-cols-2 gap-4 lg:h-[calc(100vh-14rem)]">
                    {passagePanel}
                    {questionsPanel}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 4. PERSISTENT NAVIGATION BAR */}
        <footer className="fixed bottom-0 left-0 right-0 h-16 bg-[#F8FAFC] border-t border-gray-200 flex items-center justify-between px-6 z-40 select-none shadow-md font-sans">
          {/* LEFT: BACK / NEXT PASSAGE */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                goToPreviousPassage(currentPassageIndex);
                setCurrentPassageIndex((i) => i - 1);
              }}
              disabled={currentPassageIndex === 0}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-bold border transition-colors select-none ${
                currentPassageIndex === 0
                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
              }`}
            >
              <IconArrowLeft size={16} />
              <span>BACK</span>
            </button>

            <button
              type="button"
              onClick={() => {
                goToNextPassage(currentPassageIndex);
                setCurrentPassageIndex((i) => i + 1);
              }}
              disabled={currentPassageIndex >= (exam?.passages?.length ?? 0) - 1}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-bold border transition-colors select-none text-white ${
                currentPassageIndex >= (exam?.passages?.length ?? 0) - 1
                  ? "bg-gray-300 border-gray-300 text-gray-400 cursor-not-allowed"
                  : "bg-red-700 hover:bg-red-800 border-red-700 cursor-pointer"
              }`}
            >
              <span>NEXT PASSAGE</span>
              <IconArrowRight size={16} />
            </button>
          </div>

          {/* CENTER: PASSAGE QUESTIONS TRACKER */}
          <div className="hidden md:flex items-center gap-2">
            {passageQuestions.map((q) => {
              const numberLabel = q.questionNumber;
              const isActive = activeQuestionId === q.id;
              const isAnswered = !!answers[q.id]?.trim();
              const isFlagged = !!flagged[q.id];

              // Box color selection
              let boxStyle = "border-gray-300 text-gray-700 bg-white hover:bg-gray-50";
              if (isActive) {
                boxStyle = "bg-red-700 border-red-700 text-white font-bold";
              } else if (isAnswered) {
                boxStyle = "bg-red-700/5 border-red-700 text-red-700 font-bold";
              }

              return (
                <div key={q.id} className="relative py-1 select-none">
                  {/* Flag Notification Dot */}
                  {isFlagged && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-650 border border-white" />
                  )}
                  <button
                    type="button"
                    onClick={() => scrollToQuestion(q.id)}
                    className={`w-9 h-9 border text-xs flex items-center justify-center font-semibold select-none cursor-pointer ${boxStyle}`}
                  >
                    {numberLabel}
                  </button>
                </div>
              );
            })}
          </div>

          {/* RIGHT: REVIEW ALL & SUBMIT TEST */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-bold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer select-none"
            >
              <IconLayoutGrid size={16} />
              <span>REVIEW ALL</span>
            </button>

            <button
              type="button"
              onClick={handleSubmitClick}
              disabled={mutation.isPending}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-black border transition-all select-none shadow-sm ${
                !mutation.isPending
                  ? "bg-red-700 border-red-700 hover:bg-red-800 text-white cursor-pointer"
                  : "bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <IconUpload size={16} />
              <span>SUBMIT TEST</span>
            </button>
          </div>
        </footer>
      </div>
    </div>

    {/* 5. OVERLAY REVIEW MODAL */}
    {showReviewModal && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 select-none">
        <div className="bg-white rounded border border-gray-300 shadow-2xl p-6 w-full max-w-[600px] flex flex-col h-[80vh] animate-fadeIn font-sans">
          <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
            <h3 className="font-extrabold text-lg text-gray-800">Review Questions</h3>
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              className="text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {processedPassages.map((passage, pIdx) => {
              const pQuestions = passage.questionGroups.flatMap((g) => g.questions);
              return (
                <div key={passage.id} className="space-y-2">
                  <h4 className="font-bold text-sm text-red-700">Passage {pIdx + 1}: {passage.title}</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {pQuestions.map((q) => {
                      const isAnswered = !!answers[q.id]?.trim();
                      const isFlagged = !!flagged[q.id];
                      const boxClass = isAnswered
                        ? "bg-red-50 border-red-700 text-red-700 font-bold"
                        : "border-gray-200 text-gray-400 bg-gray-50";

                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setShowReviewModal(false);
                            scrollToQuestion(q.id);
                          }}
                          className={`h-9 border text-xs flex items-center justify-center font-semibold rounded relative cursor-pointer hover:bg-gray-150 ${boxClass}`}
                        >
                          {isFlagged && (
                            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-650" />
                          )}
                          {q.questionNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}

    {/* SUBMIT CONFIRMATION MODAL */}
    {showSubmitModal && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 select-none">
        <div className="bg-white rounded border border-gray-300 shadow-2xl p-6 w-full max-w-[420px] text-center space-y-5 animate-fadeIn font-sans">
          <div className="space-y-2">
            <h3 className="font-extrabold text-lg text-gray-800">Submit Exam</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-semibold">
              Are you sure you want to submit your test? You cannot change your answers after submission.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-red-50 rounded-xl py-4 text-center">
              <div className="text-2xl font-extrabold text-red-600">
                {answeredCount}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-red-600">
                Answered
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl py-4 text-center">
              <div className="text-2xl font-extrabold text-gray-600">
                {unansweredCount}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                Unanswered
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl py-4 text-center">
              <div className="text-2xl font-extrabold text-amber-700">
                {flaggedCount}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                Flagged
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowSubmitModal(false)}
              className="flex-1 py-2 text-sm font-bold border border-gray-300 hover:bg-gray-50 transition rounded text-gray-600 active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => doSubmit(answersRef.current)}
              className="grow py-2 text-sm font-extrabold bg-red-700 hover:bg-red-800 text-white transition rounded shadow active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <IconCheck size={16} />
              <span>Submit</span>
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
