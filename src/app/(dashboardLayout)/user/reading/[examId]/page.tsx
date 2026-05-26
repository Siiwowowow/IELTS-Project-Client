/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/refs */
"use client";

import { use, useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { readingService } from "@/services/reading.services";
import { ExamTimer } from "@/components/Reading/ExamTimer";
import { QuestionRenderer } from "@/components/Reading/QuestionRenderer";
import { toast } from "sonner";
import {
  IconLoader2,
  IconSend,
  IconBook,
  IconAlertCircle,
  IconArrowLeft,
  IconLayoutColumns,
  IconNote,
} from "@tabler/icons-react";
import Link from "next/link";

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

  // answers: { [questionId]: submittedAnswer }
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answersRef = useRef<Record<string, string>>({});

  // Mobile tab: "passage" | "questions"
  const [mobileTab, setMobileTab] = useState<"passage" | "questions">("passage");

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
    doSubmit(answersRef.current);
  };

  const handleTimeUp = useCallback(() => {
    toast.warning("⏰ Time is up! Submitting your answers…");
    doSubmit(answersRef.current);
  }, [doSubmit]);

  // ── Derived stats ────────────────────────────────────────────────────────────
  const allQuestions =
    exam?.passages?.flatMap((p) =>
      p.questionGroups.flatMap((g) => g.questions)
    ) ?? [];
  const answeredCount = allQuestions.filter((q) => answers[q.id]?.trim()).length;
  const totalCount = allQuestions.length;
  const progressPct = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

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
    <div className="flex flex-col gap-3 -mt-4 -mx-4 px-4 pt-4 min-h-[calc(100vh-4rem)]">

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border border-gray-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
        {/* Left: back + title */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/user/reading"
            className="flex items-center justify-center h-7 w-7 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-all shrink-0"
          >
            <IconArrowLeft size={16} />
          </Link>
          <IconBook size={18} className="text-primary shrink-0" />
          <h1 className="font-semibold text-gray-900 text-sm truncate">
            {exam.title}
          </h1>
        </div>

        {/* Right: progress + timer + submit */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Answered counter */}
          <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded-lg font-medium">
            <span className="text-gray-900 font-bold">{answeredCount}</span>
            /{totalCount}
          </span>

          <ExamTimer durationMinutes={exam.duration} onTimeUp={handleTimeUp} />

          <button
            id="submit-exam-btn"
            onClick={handleSubmitClick}
            disabled={mutation.isPending || submittedRef.current}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition-all shadow-sm shadow-primary/20"
          >
            {mutation.isPending ? (
              <IconLoader2 size={14} className="animate-spin" />
            ) : (
              <IconSend size={14} />
            )}
            Submit
          </button>
        </div>
      </div>

      {/* ── Progress bar ──────────────────────────────────────────────────── */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden -mt-1">
        <div
          className="h-full bg-gradient-to-r from-primary to-red-400 rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* ── Mobile tab switcher ───────────────────────────────────────────── */}
      <div className="flex lg:hidden bg-gray-100 rounded-xl p-1 gap-1">
        {(["passage", "questions"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              mobileTab === tab
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "passage" ? (
              <IconLayoutColumns size={15} />
            ) : (
              <IconNote size={15} />
            )}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Passages ──────────────────────────────────────────────────────── */}
      {exam.passages?.map((passage) => (
        <div key={passage.id} className="flex-1 grid lg:grid-cols-2 gap-4">

          {/* Passage panel */}
          <div
            className={`lg:h-[calc(100vh-14rem)] lg:overflow-y-auto scrollbar-hide ${
              mobileTab === "questions" ? "hidden lg:block" : "block"
            }`}
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
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={passage.imageUrl}
                  alt="Passage"
                  className="w-full rounded-xl mt-4"
                />
              )}
            </div>
          </div>

          {/* Questions panel */}
          <div
            className={`lg:h-[calc(100vh-14rem)] lg:overflow-y-auto scrollbar-hide space-y-4 ${
              mobileTab === "passage" ? "hidden lg:block" : "block"
            }`}
          >
            {passage.questionGroups.map((group, idx) => (
              <div
                key={group.id}
                className="bg-white border border-gray-200 rounded-2xl p-5"
              >
                {/* Group header */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                  <div className="h-6 w-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
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
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-2xl disabled:opacity-60 transition-all shadow-md shadow-primary/20 text-sm"
            >
              {mutation.isPending ? (
                <IconLoader2 size={16} className="animate-spin" />
              ) : (
                <IconSend size={16} />
              )}
              Submit All Answers
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
