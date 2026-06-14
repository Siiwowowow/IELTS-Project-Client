/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/refs */
"use client";

import { use, useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { readingService } from "@/services/reading.services";
import { ExamTimer } from "@/components/Reading/ExamTimer";
import HighlightablePassage from "@/components/Reading/HighlightablePassage";
import { QuestionRenderer } from "@/components/Reading/QuestionRenderer";
import { toast } from "sonner";
import {
  IconLoader2,
  IconSend,
  IconBook,
  IconAlertCircle,
  IconArrowLeft, IconArrowRight,
  IconFlag,
  IconHelp,
  IconChevronUp,
  IconChevronDown,
  IconMaximize,
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

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answersRef = useRef<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const [mobileTab, setMobileTab] = useState<"passage" | "questions">(
    "passage"
  );

  const [showNavPanel, setShowNavPanel] = useState(true);
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

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

    onSuccess: (res) => {
      toast.success("Answers submitted! Redirecting to your results…");

      router.push(`/practice/reading/${examId}/review/${res.data.id}`);
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

  const allQuestions =
    exam?.passages?.flatMap((p) =>
      p.questionGroups.flatMap((g) => g.questions)
    ) ?? [];

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
      `}</style>

      <div className="ielts-root">
        {/* HEADER */}
        <header
          className="px-4 lg:px-6 flex items-center justify-between shrink-0"
          style={{
            background:
              "linear-gradient(180deg, #002D6E 0%, #003580 100%)",
            borderBottom: "3px solid #C8993A",
            minHeight: 72,
          }}
        >
          <div className="flex items-center gap-3">
            <Link
              href="/practice/reading"
              className="flex items-center justify-center w-8 h-8 rounded hover:bg-white/10 text-white/70 hover:text-white transition"
            >
              <IconArrowLeft size={16} />
            </Link>

            <div
              className="text-white font-bold text-xl pr-4 mr-2"
              style={{
                letterSpacing: "0.18em",
                borderRight: "2px solid rgba(255,255,255,.2)",
              }}
            >
              IELTS
            </div>

            <div>
              <p className="text-white/50 text-[10px] uppercase tracking-[0.2em]">
                Academic Reading
              </p>

              <p className="text-white font-semibold text-sm">
                {exam.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="px-4 py-2 rounded-lg border border-white/10"
              style={{
                background: "rgba(0,0,0,.2)",
              }}
            >
              <p className="text-white/50 text-[9px] uppercase tracking-widest mb-1">
                Time Left
              </p>

              <ExamTimer
                durationMinutes={exam.duration}
                onTimeUp={handleTimeUp}
                className="text-[#ff5722] font-mono text-lg font-bold"
              />
            </div>

            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => {
                  goToPreviousPassage(currentPassageIndex);
                  setCurrentPassageIndex((i) => i - 1);
                }}
                disabled={currentPassageIndex === 0}
                className="text-white/80 border border-white/20 px-3 py-2 rounded text-xs flex items-center gap-1"
              >
                <IconArrowLeft size={13} />
                Prev Passage
              </button>
              <button
                onClick={() => {
                  goToNextPassage(currentPassageIndex);
                  setCurrentPassageIndex((i) => i + 1);
                }}
                disabled={currentPassageIndex >= (exam?.passages?.length ?? 0) - 1}
                className="text-white/80 border border-white/20 px-3 py-2 rounded text-xs flex items-center gap-1"
              >
                <IconArrowRight size={13} />
                Next Passage
              </button>
            </div>

            <button
              onClick={handleSubmitClick}
              disabled={mutation.isPending}
              className="bg-[#C8993A] text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
            >
              {mutation.isPending ? (
                <IconLoader2 size={14} className="animate-spin" />
              ) : (
                <IconSend size={14} />
              )}

              Submit
            </button>
          </div>
        </header>

        {/* PROGRESS */}
        <div className="h-1 bg-[#001F4D] shrink-0">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${
                totalCount
                  ? (answeredCount / totalCount) * 100
                  : 0
              }%`,
              background:
                "linear-gradient(90deg, #00A651, #34D399)",
            }}
          />
        </div>

        {/* MOBILE TAB */}
        <div className="lg:hidden flex shrink-0 border-b border-gray-200">
          <button
            onClick={() => setMobileTab("passage")}
            className={`flex-1 py-3 text-sm font-semibold ${
              mobileTab === "passage"
                ? "bg-[#003580] text-white"
                : "bg-white text-gray-500"
            }`}
          >
            Passage
          </button>

          <button
            onClick={() => setMobileTab("questions")}
            className={`flex-1 py-3 text-sm font-semibold ${
              mobileTab === "questions"
                ? "bg-[#003580] text-white"
                : "bg-white text-gray-500"
            }`}
          >
            Questions ({answeredCount}/{totalCount})
          </button>
        </div>

        {/* MAIN */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {exam.passages?.map((passage, idx) => (
            <div
              key={passage.id}
              ref={(el) => { passageRefs.current[idx] = el; }}
              className="h-full flex flex-col lg:flex-row overflow-hidden"
            >
              {/* PASSAGE */}
              <div
                className={`
                  ${
                    mobileTab === "questions"
                      ? "hidden lg:flex"
                      : "flex"
                  }
                  flex-col
                  h-[50vh]
                  lg:h-full
                  lg:w-1/2
                  overflow-hidden
                  bg-white
                  border-r
                  border-gray-200
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
                      className="text-[#003580]"
                    />

                    <span className="font-bold text-[#003580] text-sm">
                      {passage.title}
                    </span>
                  </div>

                  <button
                    onClick={() => setMobileTab("questions")}
                    className="ml-auto lg:hidden bg-[#003580] text-white px-3 py-1 rounded text-xs"
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

              {/* QUESTIONS */}
              <div
                className={`
                  ${
                    mobileTab === "passage"
                      ? "hidden lg:flex"
                      : "flex"
                  }
                  flex-col
                  h-[50vh]
                  lg:h-full
                  lg:w-1/2
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
                  <span className="font-bold text-[#003580] text-sm">
                    Questions
                  </span>

                  <div className="ml-auto text-xs text-gray-500">
                    {answeredCount}/{totalCount} Answered
                  </div>

                  <button
                    onClick={() => setMobileTab("passage")}
                    className="ml-3 lg:hidden bg-[#003580] text-white px-3 py-1 rounded text-xs"
                  >
                    Passage
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto panel-scroll p-5">
                  <div className="space-y-5">
                    {passage.questionGroups.map((group, idx) => (
                      <div
                        key={group.id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm"
                      >
                        {/* HEADER */}
                        <div
                          className="px-5 py-4 flex items-center gap-3"
                          style={{
                            background: "#003580",
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
                            {idx + 1}
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
                          {/* Render the reference list once at the top of the questions container if not a table or inline templates */}
                          {group.type !== "TABLE_COMPLETION" && (!group.passageSegment || !/\[\d+\]/.test(group.passageSegment)) && group.options && group.options.length > 0 && (
                            <QuestionRenderer
                              group={{
                                ...group,
                                instruction: "",
                                questions: []
                              }}
                              answers={answers}
                              onAnswer={handleAnswer}
                            />
                          )}

                          {group.type === "TABLE_COMPLETION" || (group.passageSegment && /\[\d+\]/.test(group.passageSegment)) ? (
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
                              const isAnswered =
                                !!answers[
                                  question.id
                                ]?.trim();

                              const isFlagged =
                                !!flagged[question.id];

                              const isActive =
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
                                  onClick={() =>
                                    setActiveQuestionId(
                                      question.id
                                    )
                                  }
                                  className="rounded-xl p-4 transition-all"
                                  style={{
                                    border: isActive
                                      ? "2px solid #003580"
                                      : isFlagged
                                      ? "2px solid #F59E0B"
                                      : "2px solid #E2E8F0",

                                    background: isActive
                                      ? "#EFF6FF"
                                      : isFlagged
                                      ? "#FFFBEB"
                                      : "#FFFFFF",
                                  }}
                                >
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                      {/* Question number removed for clean UI */}

                                      {isAnswered && (
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
                                          isFlagged
                                            ? "#FEF3C7"
                                            : "transparent",

                                        borderColor:
                                          isFlagged
                                            ? "#F59E0B"
                                            : "#E5E7EB",

                                        color:
                                          isFlagged
                                            ? "#92400E"
                                            : "#6B7280",
                                      }}
                                    >
                                      <IconFlag size={12} />

                                      {isFlagged
                                        ? "Flagged"
                                        : "Flag"}
                                    </button>
                                  </div>

                                  {/* IMPORTANT */}
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
            </div>
          ))}
        </div>

        {/* BOTTOM NAV */}
        <div
          className="bottom-nav shrink-0"
          style={{
            borderTop: "3px solid #C8993A",
          }}
        >
          <button
            onClick={() =>
              setShowNavPanel(!showNavPanel)
            }
            className="w-full py-2 text-xs font-semibold text-white/70 flex items-center justify-center gap-2"
          >
            {showNavPanel ? (
              <IconChevronDown size={14} />
            ) : (
              <IconChevronUp size={14} />
            )}

            {showNavPanel
              ? "Hide Navigator"
              : "Show Navigator"}
          </button>

          {showNavPanel && (
            <div className="px-5 py-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {allQuestions.map((q) => {
                  const isAnswered =
                    !!answers[q.id]?.trim();

                  const isFlagged =
                    !!flagged[q.id];

                  const isActive =
                    activeQuestionId === q.id;

                  let pillClass = "unanswered";

                  if (isFlagged)
                    pillClass = "flagged";
                  else if (isAnswered)
                    pillClass = "answered";

                  if (isActive)
                    pillClass += " active";

                  return (
                    <button
                      key={q.id}
                      className={`q-pill ${pillClass}`}
                      onClick={() =>
                        scrollToQuestion(q.id)
                      }
                    >
                      {q.questionNumber}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4 text-xs text-white/70">
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-[#003580] rounded border border-[#003580]" />
                    Answered
                  </span>

                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-white/10 rounded border border-white/30" />
                    Unanswered
                  </span>

                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-[#FEF3C7] rounded border border-[#F59E0B]" />
                    Flagged
                  </span>
                </div>

                <button
                  onClick={handleSubmitClick}
                  className="bg-[#C8993A] text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                >
                  <IconSend size={14} />
                  Submit Test
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {showSubmitModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                <IconSend
                  size={20}
                  color="#003580"
                />
              </div>

              <div>
                <h2 className="font-bold text-lg text-gray-900">
                  Submit Test
                </h2>

                <p className="text-xs text-gray-500">
                  Review before submit
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-blue-50 rounded-xl py-4 text-center">
                <div className="text-2xl font-extrabold text-[#003580]">
                  {answeredCount}
                </div>

                <div className="text-[10px] font-semibold uppercase tracking-wide text-[#003580]">
                  Answered
                </div>
              </div>

              <div className="bg-red-50 rounded-xl py-4 text-center">
                <div className="text-2xl font-extrabold text-red-600">
                  {unansweredCount}
                </div>

                <div className="text-[10px] font-semibold uppercase tracking-wide text-red-600">
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

            {unansweredCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-5">
                <IconAlertCircle
                  size={18}
                  className="text-red-600 mt-0.5"
                />

                <p className="text-sm text-red-700 leading-6">
                  You still have{" "}
                  <strong>
                    {unansweredCount}
                  </strong>{" "}
                  unanswered question
                  {unansweredCount > 1
                    ? "s"
                    : ""}
                  .
                </p>
              </div>
            )}

            <p className="text-sm text-gray-600 leading-6 mb-6">
              Once submitted you cannot return
              to this test.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setShowSubmitModal(false)
                }
                className="flex-1 border border-gray-300 rounded-xl py-3 font-semibold text-gray-700"
              >
                Continue Review
              </button>

              <button
                onClick={() =>
                  doSubmit(answersRef.current)
                }
                className="flex-1 bg-[#003580] text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2"
              >
                <IconSend size={14} />
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}