/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
 
"use client";

import { use, useState, useRef, useCallback, useEffect, useMemo } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { readingService } from "@/services/reading.services";
import { mockTestService } from "@/services/mocktest.services";
import { ExamTimer } from "@/components/Reading/ExamTimer";
import HighlightablePassage from "@/components/Reading/HighlightablePassage";
import { QuestionRenderer } from "@/components/Reading/QuestionRenderer";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";
import { useTextHighlighter } from "@/hooks/useTextHighlighter";
import {
 
  IconBook,
  IconAlertCircle,
  IconArrowLeft,
  IconArrowRight,
  IconFlag,
 
  IconMaximize,
  IconMinimize,
  IconClock,
  IconInfoCircle,
  IconUserCircle,
  IconLayoutGrid,
  IconUpload,
  IconCheck,
} from "@tabler/icons-react";
import Link from "next/link";

interface Props {
  params: Promise<{ examId: string }>;
}

function formatGroupType(type: string) {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ExamPage({ params }: Props) {
  const { examId } = use(params);
  const router = useRouter();
  const workspaceRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const mockAttemptId = searchParams.get("mockAttemptId");
  const mockTestId = searchParams.get("mockTestId");

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answersRef = useRef<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const [mobileTab, setMobileTab] = useState<"passage" | "questions">("passage");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase()))) {
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

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const submittedRef = useRef(false);

  const passageRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ["reading-exam", examId],
    queryFn: () => readingService.getExamById(examId),
  });

  const exam = data?.data;
  useTextHighlighter(workspaceRef, [exam]);

  const mutation = useMutation({
    mutationFn: (snap: Record<string, string>) => {
      const answersArray = Object.entries(snap)
        .filter(([, value]) => value?.trim() !== "")
        .map(([questionId, submittedAnswer]) => ({
          questionId,
          submittedAnswer,
        }));

      return readingService.submitAttempt(examId, {
        answers: answersArray,
      } as const);
    },

    onSuccess: async (res) => {
      toast.success("Answers submitted! Redirecting to your results…");
      if (mockAttemptId && mockTestId) {
        try {
          await mockTestService.updateAttempt(mockAttemptId, {
            readingAttemptId: res.data.id,
          });
          router.push(`/student/mock-tests/run/${mockAttemptId}/transition?mockTestId=${mockTestId}&completedModule=reading`);
        } catch (err) {
          toast.error("Failed to link attempt to mock test session.");
          router.push(`/practice/reading/${examId}/review/${res.data.id}`);
        }
      } else {
        router.push(`/practice/reading/${examId}/review/${res.data.id}`);
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

  const handleAnswer = useCallback(
    (questionId: string, value: string) => {
      setAnswers((prev) => {
        const next = {
          ...prev,
          [questionId]: value,
        };

        answersRef.current = next;

        return next;
      });

      setActiveQuestionId(questionId);
    },
    []
  );

  const doSubmit = useCallback(
    (snap: Record<string, string>) => {
      if (submittedRef.current) return;

      submittedRef.current = true;

      setShowSubmitModal(false);

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

  const answeredCount = allQuestions.filter(
    (q) => answers[q.id]?.trim()
  ).length;

  const flaggedCount = Object.values(flagged).filter(Boolean).length;

  const totalCount = allQuestions.length;

  const unansweredCount = totalCount - answeredCount;

  // LOADING
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#F0F4F8] gap-4">
        <div className="w-16 h-16 border-4 border-[#003580] border-t-transparent rounded-full animate-spin" />

        <p className="text-[#003580] font-semibold text-sm tracking-wide">
          Loading Exam…
        </p>
      </div>
    );
  }

  // ERROR
  if (isError || !exam) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F0F4F8]">
        <div className="bg-white border border-red-200 rounded-xl p-8 max-w-sm text-center shadow-lg">
          <IconAlertCircle
            size={40}
            className="text-red-500 mx-auto mb-3"
          />

          <h2 className="font-bold text-gray-900 text-lg mb-1">
            Failed to Load Exam
          </h2>

          <p className="text-gray-500 text-sm mb-4">
            Please go back and try again.
          </p>

          <Link
            href="/practice/reading"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#003580] text-white rounded-lg text-sm font-medium"
          >
            <IconArrowLeft size={15} />
            Back to Practice
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

        html,
        body {
          overflow: hidden;
        }

        .ielts-root {
          font-family: 'IBM Plex Sans', sans-serif;
          background: #EAEEF3;
          height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .passage-text {
          font-family: 'IBM Plex Serif', serif;
          font-size: 15px;
          line-height: 1.9;
          color: #1a1a1a;
        }

        .passage-text p {
          margin-bottom: 1rem;
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

        .instruction-box {
          background: #EFF6FF;
          border-left: 4px solid #003580;
          padding: 12px 16px;
          border-radius: 0 8px 8px 0;
          font-size: 13px;
          color: #1E3A5F;
          line-height: 1.7;
        }

        .q-pill {
          width: 34px;
          height: 34px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all .15s;
        }

        .q-pill:hover {
          transform: scale(1.05);
        }

        .q-pill.unanswered {
          background: white;
          border: 2px solid #9CA3AF;
          color: #6B7280;
        }

        .q-pill.answered {
          background: #003580;
          border: 2px solid #003580;
          color: white;
        }

        .q-pill.flagged {
          background: #FEF3C7;
          border: 2px solid #F59E0B;
          color: #92400E;
        }

        .q-pill.active {
          outline: 3px solid #60A5FA;
          outline-offset: 2px;
        }

        .bottom-nav {
          background: #002D6E;
          color: white;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          backdrop-filter: blur(2px);
        }

        .modal-box {
          background: white;
          border-radius: 16px;
          padding: 32px;
          width: 92%;
          max-width: 450px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
        }

        .highlighted {
          background-color: #fdff32 !important;
          color: #000000 !important;
          cursor: pointer;
        }
      `}</style>
      <div className="flex flex-col h-screen bg-white text-gray-800 relative font-sans">
        {/* 1. CANDIDATE TOP HEADER */}
        <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-40 select-none font-sans shadow-sm">
          {/* LEFT: Logo and Candidate Details */}
          <div className="flex items-center">
            <span className="font-extrabold text-base md:text-lg text-red-700 tracking-tight">
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
        <div ref={workspaceRef} className="mt-14 flex-1 flex flex-col min-h-0 overflow-hidden relative pb-16 bg-[#F8FAFC]">
          
          {/* PROGRESS */}
          <div className="h-1 bg-red-950 shrink-0">
            <div
              className="h-full transition-all duration-500 bg-red-600"
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
          <div className="flex-1 min-h-0 overflow-hidden">
            {processedPassages.map((passage, idx) => {
              const passagePanel = (
                <div
                  className={`
                    ${mobileTab === "questions" ? "hidden lg:flex" : "flex"}
                    flex-col
                    h-full
                    overflow-hidden
                    bg-white
                    lg:border-r
                    lg:border-gray-200
                  `}
                >
                  <div
                    className="sticky top-0 z-20 px-6 py-4 flex items-center shrink-0"
                    style={{
                      background: "#F8FAFC",
                      borderBottom: "1px solid #E2E8F0",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <IconBook
                        size={16}
                        className="text-red-700"
                      />

                      <span className="font-bold text-red-700 text-sm">
                        {passage.title}
                      </span>
                    </div>

                    <button
                      onClick={() => setMobileTab("questions")}
                      className="ml-auto lg:hidden bg-red-700 text-white px-3 py-1 rounded text-xs"
                    >
                      Questions
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto panel-scroll px-8 py-6">
                    <div className="passage-text">
                      {passage.text && (
                        <HighlightablePassage
                          html={passage.text}
                        />
                      )}

                      {passage.imageUrl && (
                        <img
                          src={passage.imageUrl}
                          alt="Passage"
                          className="w-full rounded-lg mt-6 border border-gray-200"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );

              const questionsPanel = (
                <div
                  className={`
                    ${mobileTab === "passage" ? "hidden lg:flex" : "flex"}
                    flex-col
                    h-full
                    overflow-hidden
                    bg-[#F8FAFC]
                  `}
                >
                  <div
                    className="sticky top-0 z-20 px-6 py-4 flex items-center shrink-0"
                    style={{
                      background: "#FFFFFF",
                      borderBottom: "1px solid #E2E8F0",
                    }}
                  >
                    <span className="font-bold text-red-700 text-sm">
                      Questions
                    </span>

                    <div className="ml-auto text-xs text-gray-500">
                      {answeredCount}/{totalCount} Answered
                    </div>

                    <button
                      onClick={() => setMobileTab("passage")}
                      className="ml-3 lg:hidden bg-red-700 text-white px-3 py-1 rounded text-xs"
                    >
                      Passage
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto panel-scroll p-5">
                    <div className="space-y-5">
                      {passage.questionGroups.map((group, groupIdx) => (
                        <div
                          key={group.id}
                          className="bg-white rounded-xl border border-gray-200 shadow-sm"
                        >
                          {/* HEADER */}
                          <div
                            className="px-5 py-4 flex items-center gap-3"
                            style={{
                              background: "#B91C1C",
                              borderRadius:
                                "12px 12px 0 0",
                            }}
                          >
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{
                                background: "#C8993A",
                              }}
                            >
                              {groupIdx + 1}
                            </div>

                            <span className="text-white text-xs font-bold uppercase tracking-wider">
                              {formatGroupType(group.type)}
                            </span>
                          </div>

                          {/* SINGLE INSTRUCTION */}
                          {group.instruction && (
                            <div className="instruction-box mx-4 mt-4">
                              {group.instruction}
                            </div>
                          )}

                          {/* QUESTIONS */}
                          <div className="p-5 space-y-5">
                            {group.type !== "TABLE_COMPLETION" && (!group.passageSegment || !/\[\d+\]/.test(group.passageSegment)) && group.options && group.options.length > 0 && (
                              <QuestionRenderer
                                group={{
                                  ...group,
                                  instruction: "",
                                }}
                                answers={answers}
                                onAnswer={handleAnswer}
                              />
                            )}

                            {group.type === "TABLE_COMPLETION" ? (
                              <div
                                className="rounded-xl p-5 border border-gray-200 bg-white shadow-sm"
                              >
                                <QuestionRenderer
                                  group={group}
                                  answers={answers}
                                  onAnswer={handleAnswer}
                                />
                              </div>
                            ) : (
                              group.questions.map((question) => {
                                const isQuestionAnswered =
                                  !!answers[
                                    question.id
                                  ]?.trim();

                                const isQuestionFlagged =
                                  !!flagged[question.id];

                                const isQuestionActive =
                                  activeQuestionId ===
                                  question.id;

                                return (
                                  <div
                                    key={question.id}
                                    ref={(el) => {
                                      questionRefs.current[
                                        question.id
                                      ] = el;
                                    }}
                                    onClick={() => {
                                      const sel = window.getSelection();
                                      if (sel && !sel.isCollapsed) return;
                                      setActiveQuestionId(question.id);
                                    }}
                                    className="rounded-xl p-4 transition-all"
                                    style={{
                                      border: isQuestionActive
                                        ? "2px solid #B91C1C"
                                        : isQuestionFlagged
                                        ? "2px solid #F59E0B"
                                        : "2px solid #E2E8F0",

                                      background: isQuestionActive
                                        ? "#FEF2F2"
                                        : isQuestionFlagged
                                        ? "#FFFBEB"
                                        : "#FFFFFF",
                                    }}
                                  >
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-2">
                                        {isQuestionAnswered && (
                                          <span className="text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700 px-2 py-1 rounded">
                                            Answered
                                          </span>
                                        )}
                                      </div>

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();

                                          toggleFlag(
                                            question.id
                                          );
                                        }}
                                        className="text-xs px-3 py-1 rounded border flex items-center gap-1"
                                        style={{
                                          background:
                                            isQuestionFlagged
                                              ? "#FEF3C7"
                                              : "transparent",

                                          borderColor:
                                            isQuestionFlagged
                                              ? "#F59E0B"
                                              : "#E5E7EB",

                                          color:
                                            isQuestionFlagged
                                              ? "#92400E"
                                              : "#6B7280",
                                        }}
                                      >
                                        <IconFlag size={12} />

                                        {isQuestionFlagged
                                          ? "Flagged"
                                          : "Flag"}
                                      </button>
                                    </div>

                                    <QuestionRenderer
                                      group={{
                                        ...group,
                                        instruction: "",
                                        questions: [
                                          question,
                                        ],
                                      }}
                                      answers={answers}
                                      onAnswer={handleAnswer}
                                      hideReferenceBox={true}
                                    />
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );

              return (
                <div
                  key={passage.id}
                  ref={(el) => { passageRefs.current[idx] = el; }}
                  className="h-full flex flex-col overflow-hidden"
                >
                  {isDesktop ? (
                    <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
                      <ResizablePanel defaultSize={50} minSize={30}>
                        {passagePanel}
                      </ResizablePanel>
                      <ResizableHandle withHandle className="w-2 bg-gray-200 hover:bg-red-700 hover:w-2.5 transition-all cursor-col-resize shrink-0 h-full" />
                      <ResizablePanel defaultSize={50} minSize={30}>
                        {questionsPanel}
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  ) : (
                    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
                      <div className={`${mobileTab === "questions" ? "hidden lg:flex" : "flex"} flex-col h-[50vh] lg:h-full lg:w-1/2 overflow-hidden`}>
                        {passagePanel}
                      </div>
                      <div className={`${mobileTab === "passage" ? "hidden lg:flex" : "flex"} flex-col h-[50vh] lg:h-full lg:w-1/2 overflow-hidden`}>
                        {questionsPanel}
                      </div>
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
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-600 border border-white" />
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