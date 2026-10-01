/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { use, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { writingService } from "@/services/writing.services";
import { ExamImageViewer } from "@/components/Writing/ExamImageViewer";
import {
  IconLoader2,
  IconAlertCircle,
  IconArrowLeft,
  IconFileText,
  IconPhoto,
  IconAlertTriangle,
  IconMessage,
  IconBulb,
  IconSparkles,
  IconRefresh,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import type {
  PendingWritingAssessment,
  StoredWritingAssessment,
  WritingAssessment,
} from "@/types/writing-assessment.types";
import {
  pendingWritingAssessmentStorageKey,
  writingAssessmentStorageKey,
} from "@/types/writing-assessment.types";

interface Props {
  params: Promise<{ examId: string; attemptId: string }>;
}

// Round to standard IELTS half band format
const formatBand = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return "N/A";
  return n.toFixed(1);
};

// Return border/text/background classes matching IELTS band scores
function bandColor(band: number) {
  if (band >= 8)
    return { ring: "border-emerald-400", text: "text-emerald-600", bg: "bg-emerald-50", fill: "#059669" };
  if (band >= 7)
    return { ring: "border-green-400", text: "text-green-600", bg: "bg-green-50", fill: "#16a34a" };
  if (band >= 6)
    return { ring: "border-blue-400", text: "text-blue-600", bg: "bg-blue-50", fill: "#2563eb" };
  if (band >= 5)
    return { ring: "border-orange-400", text: "text-orange-600", bg: "bg-orange-50", fill: "#ea580c" };
  return { ring: "border-rose-400", text: "text-rose-600", bg: "bg-rose-50", fill: "#e11d48" };
}

function bandLabel(band: number) {
  if (band >= 8.5) return "Expert User";
  if (band >= 7.5) return "Very Good User";
  if (band >= 6.5) return "Good User";
  if (band >= 5.5) return "Competent User";
  if (band >= 4.5) return "Modest User";
  return "Limited User";
}

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

type AnnotatedIssue = {
  key: string;
  kind: "grammar" | "spelling" | "vocabulary" | "punctuation" | "connector" | "relevance";
  original: string;
  corrected: string;
  explanationBn: string;
  improvedVersion?: string;
};

function AnnotatedEssay({ essay, assessment }: { essay: string; assessment: WritingAssessment }) {
  const [selectedIssue, setSelectedIssue] = useState<AnnotatedIssue | null>(null);
  const issues: AnnotatedIssue[] = [
    ...assessment.grammarErrors.map((item, index) => ({
      ...item,
      key: `grammar-${index}`,
      kind: "grammar" as const,
    })),
    ...assessment.spellingErrors.map((item, index) => ({
      ...item,
      key: `spelling-${index}`,
      kind: "spelling" as const,
    })),
    ...(assessment.vocabularyErrors ?? []).map((item, index) => ({
      ...item,
      key: `vocabulary-${index}`,
      kind: "vocabulary" as const,
    })),
    ...(assessment.punctuationErrors ?? []).map((item, index) => ({
      ...item,
      key: `punctuation-${index}`,
      kind: "punctuation" as const,
    })),
    ...(assessment.cohesionAnalysis?.misusedOrOverusedConnectors ?? []).map((item, index) => ({
      ...item,
      key: `connector-${index}`,
      kind: "connector" as const,
    })),
    ...(assessment.relevanceIssues ?? [])
      .filter((item) => item.issueType !== "MISSED_KEY_FEATURE")
      .map((item, index) => ({
        original: item.excerpt,
        corrected: "Remove this point or replace it with directly relevant and accurate information.",
        explanationBn: item.reasonBn,
        key: `relevance-${index}`,
        kind: "relevance" as const,
      })),
  ].filter((issue) => issue.original.trim().length > 0);

  const segments: Array<{ text: string; issue?: AnnotatedIssue }> = [];
  let cursor = 0;

  while (cursor < essay.length) {
    let nextMatch: { index: number; issue: AnnotatedIssue } | null = null;
    for (const issue of issues) {
      const index = essay.indexOf(issue.original, cursor);
      if (index >= 0 && (!nextMatch || index < nextMatch.index)) nextMatch = { index, issue };
    }

    if (!nextMatch) {
      segments.push({ text: essay.slice(cursor) });
      break;
    }

    if (nextMatch.index > cursor) segments.push({ text: essay.slice(cursor, nextMatch.index) });
    segments.push({ text: nextMatch.issue.original, issue: nextMatch.issue });
    cursor = nextMatch.index + nextMatch.issue.original.length;
  }

  if (!essay) return <p className="text-sm text-gray-500">No response submitted.</p>;

  return (
    <div className="space-y-4">
      <div className="whitespace-pre-wrap text-sm leading-7 text-gray-800 select-text">
        {segments.map((segment, index) =>
          segment.issue ? (
            <button
              key={`${segment.issue.key}-${index}`}
              type="button"
              onClick={() => setSelectedIssue(segment.issue!)}
              className="text-left text-rose-700 underline decoration-rose-500 decoration-2 underline-offset-4 hover:bg-rose-50 rounded-sm cursor-pointer"
              title="Click to see correction"
            >
              {segment.text}
            </button>
          ) : (
            <React.Fragment key={index}>{segment.text}</React.Fragment>
          ),
        )}
      </div>

      {selectedIssue && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-700">
              {selectedIssue.kind} review
            </span>
            <button type="button" onClick={() => setSelectedIssue(null)} className="text-xs text-gray-500 hover:text-black">Close</button>
          </div>
          <p className="text-sm text-rose-700"><strong>ভুল:</strong> {selectedIssue.original}</p>
          <p className="text-sm text-emerald-700"><strong>সঠিক:</strong> {selectedIssue.corrected}</p>
          <p className="text-xs leading-relaxed text-gray-600">{selectedIssue.explanationBn}</p>
          {selectedIssue.improvedVersion && (
            <p className="text-sm text-blue-700"><strong>Complex improved version:</strong> {selectedIssue.improvedVersion}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Clean Prompt Viewer Component (Fixes huge gaps) ─────────────────────────
function TaskPromptViewer({ task, taskIdx }: { task: any; taskIdx: number }) {
  if (!task) return null;

  const isTask1 = task.taskType === "TASK_1";
  const minWords = task.minWords ?? (isTask1 ? 150 : 250);
  const rawInstruction = task.instruction || "";

  // Check if rawInstruction already has structured IELTS sheet/box templates
  const hasIeltsLayout =
    rawInstruction.includes("ielts-task1-sheet") ||
    rawInstruction.includes("ielts-task2-sheet") ||
    rawInstruction.includes("ielts-task1-box") ||
    rawInstruction.includes("ielts-task2-box");

  // Clean empty paragraphs, excessive br tags, and extra newlines that cause huge blank spaces
  const cleanedHtml = rawInstruction
    .replace(/(?:<p[^>]*>\s*(?:&nbsp;|<br\s*\/?>|\s*)*<\/p>)+/gi, "")
    .replace(/(?:<br\s*\/?>\s*){3,}/gi, "<br/><br/>")
    .replace(/\n{3,}/g, "\n\n");

  if (hasIeltsLayout) {
    return (
      <div
        className="font-sans text-gray-900 leading-relaxed select-text space-y-2.5 text-sm [&_.ielts-task1-header]:mb-2 [&_.ielts-task2-header]:mb-2 [&_.ielts-task1-box]:my-2.5 [&_.ielts-task2-box]:my-2.5 [&_.ielts-task1-box]:p-4 [&_.ielts-task2-box]:p-4 [&_.ielts-task1-box]:border-2 [&_.ielts-task2-box]:border-2 [&_.ielts-task1-box]:border-slate-900 [&_.ielts-task2-box]:border-slate-900 [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_h3]:font-black [&_h3]:text-base"
        dangerouslySetInnerHTML={{ __html: cleanedHtml }}
      />
    );
  }

  // If raw instruction without sheet template, render official British Council CBT format
  return (
    <div className="font-sans select-text space-y-3 text-slate-900 text-sm">
      <div className="space-y-1">
        <h3 className="text-base font-bold tracking-tight text-slate-900">
          WRITING TASK {taskIdx + 1}
        </h3>
        <p className="text-sm text-slate-700 font-normal leading-relaxed">
          {isTask1
            ? "You should spend about 20 minutes on this task."
            : "You should spend about 40 minutes on this task."}
        </p>
        {!isTask1 && (
          <p className="text-sm text-slate-700 font-normal leading-relaxed">
            Present a written argument or case to an educated reader with no specialist knowledge of the
            following topic.
          </p>
        )}
      </div>

      {/* Official IELTS Prompt Box */}
      <div className="my-2.5 p-4 md:p-5 border-2 border-slate-900 bg-white font-normal text-slate-900 leading-relaxed text-sm select-text">
        <div
          className="space-y-2 [&_p]:mb-2 [&_p:last-child]:mb-0"
          dangerouslySetInnerHTML={{ __html: cleanedHtml }}
        />
      </div>

      {!isTask1 && (
        <p className="text-sm text-slate-700 font-normal leading-relaxed">
          Give reasons for your answer and include any relevant examples from your own knowledge or
          experience.
        </p>
      )}

      <p className="text-sm text-slate-800 font-medium">Write at least {minWords} words.</p>
    </div>
  );
}

// ─── Clean Response Essay Viewer Component ──────────────────────────────────
function ResponseEssayViewer({
  essay,
  wordCount,
  minWords,
}: {
  essay?: string;
  wordCount: number;
  minWords: number;
}) {
  if (!essay || essay.trim() === "") {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-2 border border-dashed border-amber-300 rounded-xl bg-amber-50/40 p-6 text-amber-800">
        <IconAlertTriangle size={26} className="text-amber-500" />
        <p className="font-bold text-sm text-amber-900">Task Left Unanswered</p>
        <p className="text-xs text-gray-500 max-w-xs">
          No response was submitted for this writing task during the assessment.
        </p>
      </div>
    );
  }

  // Split paragraphs by one or more newlines and filter out empty strings
  const paragraphs = essay
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3 font-sans text-sm leading-relaxed text-gray-900 select-text bg-white p-5 rounded-xl border border-gray-200">
      {paragraphs.map((p, i) => (
        <p key={i} className="leading-relaxed">
          {p}
        </p>
      ))}

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
        <span>Submitted Response</span>
        <span className={wordCount >= minWords ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
          {wordCount} / {minWords} words {wordCount < minWords && `(under length by ${minWords - wordCount})`}
        </span>
      </div>
    </div>
  );
}

// ─── Clean Model Answer Viewer Component ────────────────────────────────────
function ModelAnswerViewer({ modelAnswer }: { modelAnswer?: string }) {
  if (!modelAnswer || !modelAnswer.trim()) return null;

  const paragraphs = modelAnswer
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-5 space-y-3 relative overflow-hidden">
      <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
        <IconBulb size={16} className="text-emerald-600 shrink-0" />
        <span>Band 9 Model Reference Answer</span>
      </div>
      <div className="space-y-2.5 text-sm leading-relaxed text-emerald-950 font-normal select-text">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}

// ─── Main Review Page Component ─────────────────────────────────────────────
export default function WritingReviewPage({ params }: Props) {
  const { examId, attemptId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const assessmentRequested = searchParams.get("assessing") === "1";
  const [activeTaskTab, setActiveTaskTab] = useState<0 | 1>(0);
  const [aiAssessment, setAiAssessment] = useState<StoredWritingAssessment | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentProgress, setAssessmentProgress] = useState<string | null>(
    assessmentRequested ? "আপনার উত্তর প্রস্তুত করা হচ্ছে..." : null,
  );
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const assessmentStartedRef = useRef(false);

  // Fetch attempt review data
  const { data: attemptData, isLoading: attemptLoading, isError: attemptError } = useQuery({
    queryKey: ["writing-attempt-review", attemptId],
    queryFn: () => writingService.getAttemptReview(attemptId),
  });

  // Fetch full exam data in parallel (guarantees tasks, images, model answers are never missing)
  const { data: examData, isLoading: examLoading } = useQuery({
    queryKey: ["writing-exam-review-exam", examId],
    queryFn: () => writingService.getExamById(examId),
    enabled: !!examId,
  });

  const attempt = attemptData?.data;
  const fullExam = examData?.data || attempt?.exam;
  const examTasks = fullExam?.tasks
    ? [...fullExam.tasks].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
    : [];

  const sortedResponses = attempt?.responses
    ? [...attempt.responses].sort((a: any, b: any) => {
        const orderA =
          a.task?.order ??
          (a.taskId ? examTasks.find((t: any) => t.id === a.taskId)?.order : 0) ??
          0;
        const orderB =
          b.task?.order ??
          (b.taskId ? examTasks.find((t: any) => t.id === b.taskId)?.order : 0) ??
          0;
        return orderA - orderB;
      })
    : [];

  useEffect(() => {
    let parsed: StoredWritingAssessment | null = null;
    try {
      const stored = localStorage.getItem(writingAssessmentStorageKey(attemptId));
      if (stored) parsed = JSON.parse(stored) as StoredWritingAssessment;
    } catch {
      localStorage.removeItem(writingAssessmentStorageKey(attemptId));
    }

    const timer = window.setTimeout(() => setAiAssessment(parsed), 0);
    return () => window.clearTimeout(timer);
  }, [attemptId]);

  const runAssessment = async () => {
    setIsAssessing(true);
    setAssessmentError(null);
    setAssessmentProgress("আপনার উত্তর প্রস্তুত করা হচ্ছে...");

    try {
      let pending: PendingWritingAssessment | null = null;

      // 1. Try sessionStorage
      const rawSession = sessionStorage.getItem(pendingWritingAssessmentStorageKey(attemptId));
      if (rawSession) {
        try {
          pending = JSON.parse(rawSession) as PendingWritingAssessment;
        } catch {}
      }

      // 2. Try localStorage
      if (!pending) {
        const rawLocal = localStorage.getItem(pendingWritingAssessmentStorageKey(attemptId));
        if (rawLocal) {
          try {
            pending = JSON.parse(rawLocal) as PendingWritingAssessment;
          } catch {}
        }
      }

      // 3. Fallback: Reconstruct directly from attempt.responses & fullExam.tasks
      if (!pending && sortedResponses.length > 0) {
        pending = {
          version: 1,
          attemptId,
          tasks: sortedResponses.map((res: any) => {
            const task =
              examTasks.find((t: any) => t.id === res.taskId) ||
              res.task ||
              examTasks.find((t: any) => t.taskType === "TASK_1") ||
              {};
            return {
              taskId: res.taskId,
              request: {
                examType: fullExam?.examType ?? "ACADEMIC",
                taskType: task.taskType || "TASK_2",
                prompt: task.instruction || "",
                essay: res.response || "",
                minWords: task.minWords ?? (task.taskType === "TASK_1" ? 150 : 250),
                imageUrl: task.imageUrl || null,
              },
            };
          }),
        };
      }

      if (!pending || pending.tasks.length === 0) {
        throw new Error("Assessment data পাওয়া যায়নি। পেজটি রিফ্রেশ করুন অথবা পুনরায় চেষ্টা করুন।");
      }

      const taskAssessments: Record<string, WritingAssessment> = {};

      for (let index = 0; index < pending.tasks.length; index += 1) {
        const task = pending.tasks[index];
        setAssessmentProgress(
          `Task ${index + 1} বিশ্লেষণ করা হচ্ছে — grammar, spelling এবং IELTS criteria যাচাই চলছে...`,
        );
        taskAssessments[task.taskId] = await writingService.assessTask(task.request);
      }

      setAssessmentProgress("Task 1 ও Task 2 মিলিয়ে final band score হিসাব করা হচ্ছে...");
      const task1 = pending.tasks.find((task) => task.request.taskType === "TASK_1");
      const task2 = pending.tasks.find((task) => task.request.taskType === "TASK_2");
      const task1Band = task1 ? taskAssessments[task1.taskId]?.taskBandScore : undefined;
      const task2Band = task2 ? taskAssessments[task2.taskId]?.taskBandScore : undefined;
      const rawOverall =
        task1Band !== undefined && task2Band !== undefined
          ? (task1Band + task2Band * 2) / 3
          : task2Band ?? task1Band ?? 0;

      const completed: StoredWritingAssessment = {
        version: 1,
        attemptId,
        createdAt: new Date().toISOString(),
        overallBand: Math.max(0, Math.min(9, Math.round(rawOverall * 2) / 2)),
        tasks: taskAssessments,
      };

      localStorage.setItem(writingAssessmentStorageKey(attemptId), JSON.stringify(completed));
      try {
        sessionStorage.removeItem(pendingWritingAssessmentStorageKey(attemptId));
      } catch {}
      setAiAssessment(completed);

      // Auto-save official grades to database!
      const grades = sortedResponses.map((res: any) => {
        const tAssess = taskAssessments[res.taskId];
        const isT1 = tAssess?.taskType === "TASK_1";
        const ta = isT1
          ? (tAssess?.criteria as any)?.taskAchievement?.score ?? 6.0
          : (tAssess?.criteria as any)?.taskResponse?.score ?? 6.0;
        const cc = tAssess?.criteria?.coherenceCohesion?.score ?? 6.0;
        const lr = tAssess?.criteria?.lexicalResource?.score ?? 6.0;
        const gra = tAssess?.criteria?.grammaticalRangeAccuracy?.score ?? 6.0;
        return {
          responseId: res.id,
          taskAchievement: Number(ta),
          coherenceCohesion: Number(cc),
          lexicalResource: Number(lr),
          grammaticalRange: Number(gra),
          feedback: tAssess?.summaryBn || "AI evaluated",
        };
      });

      if (grades.length > 0) {
        try {
          await writingService.gradeAttempt(attemptId, { grades });
          queryClient.invalidateQueries({ queryKey: ["writing-attempt-review", attemptId] });
        } catch (dbErr) {
          console.warn("Auto-saving writing grades to DB failed:", dbErr);
        }
      }

      setAssessmentProgress(null);
      toast.success("AI Writing Assessment সফলভাবে সম্পন্ন হয়েছে!");
      router.replace(`/practice/writing/${examId}/review/${attemptId}`, { scroll: false });
    } catch (error) {
      console.error("AI writing assessment error:", error);
      setAssessmentError(error instanceof Error ? error.message : "AI assessment সম্পন্ন করা যায়নি।");
      setAssessmentProgress(null);
      toast.error("Writing Assessment ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
    } finally {
      setIsAssessing(false);
    }
  };

  useEffect(() => {
    if (!assessmentRequested || assessmentStartedRef.current) return;
    const hasPendingInStorage =
      typeof window !== "undefined" &&
      (!!sessionStorage.getItem(pendingWritingAssessmentStorageKey(attemptId)) ||
        !!localStorage.getItem(pendingWritingAssessmentStorageKey(attemptId)));

    if (!hasPendingInStorage && (attemptLoading || !attempt)) return;

    assessmentStartedRef.current = true;
    void runAssessment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentRequested, attemptId, attemptLoading, attempt]);

  const activeResponse = sortedResponses[activeTaskTab];

  // Resolve active task using both attempt response task and fullExam task
  const activeExamTask =
    examTasks.find((t: any) => t.id === activeResponse?.taskId) ||
    examTasks.find((t: any) => t.taskType === (activeTaskTab === 0 ? "TASK_1" : "TASK_2")) ||
    examTasks[activeTaskTab];

  const activeTask = {
    ...activeExamTask,
    ...activeResponse?.task,
    imageUrl: activeResponse?.task?.imageUrl || activeExamTask?.imageUrl,
    pdfUrl: activeResponse?.task?.pdfUrl || activeExamTask?.pdfUrl,
    instruction: activeResponse?.task?.instruction || activeExamTask?.instruction,
    modelAnswer: activeResponse?.task?.modelAnswer || activeExamTask?.modelAnswer,
  };
  const activeAssessment = activeResponse?.taskId
    ? aiAssessment?.tasks[activeResponse.taskId]
    : undefined;

  const isLoading = attemptLoading || (examLoading && !attempt);

  if (assessmentProgress) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 text-white">
        <div className="w-full max-w-xl text-center space-y-7">
          <div className="mx-auto h-20 w-20 rounded-3xl border border-slate-700 bg-slate-900 flex items-center justify-center shadow-2xl">
            <IconLoader2 size={38} className="animate-spin text-blue-400" />
          </div>
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">AI Writing Assessment</p>
            <h1 className="text-2xl sm:text-3xl font-black">আপনার result তৈরি হচ্ছে</h1>
            <p className="text-sm sm:text-base leading-relaxed text-slate-300 min-h-12">{assessmentProgress}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px] font-bold text-slate-400">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">Grammar</div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">Spelling</div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">Band Score</div>
          </div>
          <p className="text-xs text-slate-500">Page বন্ধ বা refresh করবেন না। এটি কিছুক্ষণ সময় নিতে পারে।</p>
        </div>
      </div>
    );
  }

  if (assessmentError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-7 text-center shadow-sm space-y-4">
          <IconAlertCircle size={38} className="mx-auto text-rose-600" />
          <h1 className="text-xl font-black text-gray-900">Assessment সম্পন্ন হয়নি</h1>
          <p className="text-sm leading-relaxed text-gray-600">{assessmentError}</p>
          <button type="button" onClick={() => window.location.reload()} className="rounded-lg bg-black px-5 py-2.5 text-sm font-bold text-white">
            আবার চেষ্টা করুন
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <IconLoader2 size={40} className="animate-spin text-black" />
        <p className="text-sm font-bold text-gray-500">Retrieving assessment feedback...</p>
      </div>
    );
  }

  if (attemptError || !attempt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 max-w-md mx-auto text-center px-4 font-sans">
        <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
          <IconAlertCircle size={28} />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-bold text-gray-900 text-lg">Failed to load attempt</h2>
          <p className="text-sm text-gray-500 font-medium leading-relaxed">
            We couldn't retrieve the grade report for this writing attempt. It may have been archived.
          </p>
        </div>
        <Link
          href="/practice/writing"
          className="px-5 py-2.5 rounded-lg bg-black hover:bg-gray-800 text-white font-bold text-sm shadow-sm transition"
        >
          Return to Practice Zone
        </Link>
      </div>
    );
  }

  const displayedOverallBand = aiAssessment?.overallBand ?? attempt.bandScore;
  const isGraded = displayedOverallBand !== null && displayedOverallBand !== undefined;
  const dateFormatted = attempt.createdAt
    ? format(new Date(attempt.createdAt), "MMMM d, yyyy 'at' h:mm a")
    : "Date unavailable";
  const bc = bandColor(displayedOverallBand ?? 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans pb-16">
      <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-6">
        {/* Back Link & Header Title */}
        <div className="flex flex-col gap-2">
          <Link
            href="/practice/writing"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-black transition self-start"
          >
            <IconArrowLeft size={14} />
            Back to Writing Practice
          </Link>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Review: {fullExam?.title || "Writing Practice Assessment"}
              </h1>
              <p className="text-xs font-medium text-gray-500 mt-0.5">Submitted on {dateFormatted}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isGraded && (
                <button
                  type="button"
                  onClick={() => void runAssessment()}
                  disabled={isAssessing}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
                  title="Re-run AI Assessment"
                >
                  {isAssessing ? (
                    <IconLoader2 size={14} className="animate-spin text-purple-600" />
                  ) : (
                    <IconRefresh size={14} />
                  )}
                  <span>{isAssessing ? "মূল্যায়ন চলছে..." : "Re-run AI Assessment"}</span>
                </button>
              )}
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  isGraded
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {isGraded ? "Graded" : "Awaiting Evaluation"}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-gray-700 border border-gray-200 uppercase tracking-wide">
                {fullExam?.examType === "GENERAL_TRAINING" ? "General Training" : "Academic"}
              </span>
            </div>
          </div>
        </div>

        {/* ── ASSESSMENT ERROR BANNER ───────────────────────────────────── */}
        {assessmentError && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-900 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <IconAlertCircle size={20} className="text-rose-600 shrink-0" />
              <p className="text-xs font-medium text-rose-800">{assessmentError}</p>
            </div>
            <button
              type="button"
              onClick={() => void runAssessment()}
              disabled={isAssessing}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition shrink-0"
            >
              পুনরায় চেষ্টা করুন
            </button>
          </div>
        )}

        {/* ── HERO ASSESSMENT CARD ────────────────────────────────────────── */}
        {isGraded ? (
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Left: Overall Band Score */}
              <div className="flex items-center gap-5">
                <div
                  className={`h-20 w-20 rounded-2xl border-2 ${bc.ring} bg-slate-800/80 flex flex-col items-center justify-center shrink-0 shadow-inner`}
                >
                  <span className={`text-3xl font-extrabold ${bc.text}`}>{formatBand(displayedOverallBand)}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider -mt-0.5">
                    Band
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">AI Estimated Final Band</p>
                  <h2 className="text-lg font-bold text-white mt-0.5">{bandLabel(displayedOverallBand!)}</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Task 2 carries twice the scoring weight of Task 1 in calculating overall band.
                  </p>
                </div>
              </div>

              {/* Right: Individual Task Band Summaries */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                {sortedResponses.map((res: any, idx: number) => {
                  const taskBand = aiAssessment?.tasks[res.taskId]?.taskBandScore ?? res.taskBandScore;
                  const wordCount = res.wordCount ?? countWords(res.essay || "");
                  return (
                    <div
                      key={res.id || idx}
                      className="flex-1 md:w-36 bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 text-center space-y-1"
                    >
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Task {idx + 1} Score
                      </span>
                      <span className="text-lg font-black text-white block">
                        {taskBand !== null && taskBand !== undefined ? `Band ${formatBand(taskBand)}` : "Pending"}
                      </span>
                      <span className="text-[11px] text-gray-400 block font-medium">{wordCount} words</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Awaiting Evaluation banner state */
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <IconAlertTriangle size={24} className="shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h3 className="font-bold text-sm text-amber-950">Awaiting Examiner Evaluation</h3>
                <p className="text-amber-800 leading-relaxed font-normal">
                  Your writing attempt has been recorded. You can run instant AI evaluation according to official IELTS band descriptors.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void runAssessment()}
              disabled={isAssessing}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition shrink-0 cursor-pointer"
            >
              {isAssessing ? <IconLoader2 size={16} className="animate-spin" /> : <IconSparkles size={16} />}
              <span>{isAssessing ? "মূল্যায়ন চলছে..." : "AI দ্বারা মূল্যায়ন করুন"}</span>
            </button>
          </div>
        )}

        {/* ── TASK SWITCHER TABS ─────────────────────────────────────────── */}
        <div className="flex border-b border-gray-200 gap-2">
          {sortedResponses.map((res: any, idx: number) => {
            const isSelected = activeTaskTab === idx;
            const wordCount = res.wordCount ?? countWords(res.essay || "");
            const taskBand = aiAssessment?.tasks[res.taskId]?.taskBandScore ?? res.taskBandScore;

            return (
              <button
                key={res.id || idx}
                type="button"
                onClick={() => setActiveTaskTab(idx as 0 | 1)}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "border-black text-black bg-white shadow-2xs"
                    : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
                } rounded-t-lg`}
              >
                <IconFileText size={16} />
                <span>Task {idx + 1} Review</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {wordCount} words
                </span>
                {isGraded && taskBand !== null && taskBand !== undefined && (
                  <span
                    className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${bandColor(taskBand).bg} ${
                      bandColor(taskBand).text
                    }`}
                  >
                    Band {formatBand(taskBand)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── SELECTED TASK CONTENT ──────────────────────────────────────── */}
        {activeTask && (
          <div className="flex flex-col gap-6">
            {/* Criteria Scoring Rubrics & Feedback (Only if Graded) */}
            {isGraded && activeResponse && (
              <div className="order-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
                  IELTS Band Assessment Criteria
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Criterion 1 */}
                  <div className="p-3.5 rounded-xl border border-gray-150 bg-slate-50/60 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">
                        {activeTask.taskType === "TASK_1" ? "Task Achievement" : "Task Response"}
                      </h4>
                      <p className="text-[10px] text-gray-400">Addressing prompt instructions</p>
                    </div>
                    <span className="h-9 w-9 shrink-0 bg-white text-black font-extrabold text-sm rounded-lg flex items-center justify-center border border-gray-300">
                      {formatBand(activeAssessment?.taskAchievement.score ?? activeResponse.taskAchievement)}
                    </span>
                  </div>

                  {/* Criterion 2 */}
                  <div className="p-3.5 rounded-xl border border-gray-150 bg-slate-50/60 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">Coherence & Cohesion</h4>
                      <p className="text-[10px] text-gray-400">Structure & paragraph flow</p>
                    </div>
                    <span className="h-9 w-9 shrink-0 bg-white text-black font-extrabold text-sm rounded-lg flex items-center justify-center border border-gray-300">
                      {formatBand(activeAssessment?.coherenceCohesion.score ?? activeResponse.coherenceCohesion)}
                    </span>
                  </div>

                  {/* Criterion 3 */}
                  <div className="p-3.5 rounded-xl border border-gray-150 bg-slate-50/60 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">Lexical Resource</h4>
                      <p className="text-[10px] text-gray-400">Vocabulary range & accuracy</p>
                    </div>
                    <span className="h-9 w-9 shrink-0 bg-white text-black font-extrabold text-sm rounded-lg flex items-center justify-center border border-gray-300">
                      {formatBand(activeAssessment?.lexicalResource.score ?? activeResponse.lexicalResource)}
                    </span>
                  </div>

                  {/* Criterion 4 */}
                  <div className="p-3.5 rounded-xl border border-gray-150 bg-slate-50/60 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">Grammar & Accuracy</h4>
                      <p className="text-[10px] text-gray-400">Grammatical range & control</p>
                    </div>
                    <span className="h-9 w-9 shrink-0 bg-white text-black font-extrabold text-sm rounded-lg flex items-center justify-center border border-gray-300">
                      {formatBand(
                        activeAssessment?.grammaticalRangeAccuracy.score ?? activeResponse.grammaticalRange
                      )}
                    </span>
                  </div>
                </div>

                {/* Examiner Feedback */}
                {activeResponse.feedback && (
                  <div className="p-4 bg-amber-50/40 border border-amber-200/80 rounded-xl space-y-1.5">
                    <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wide">
                      <IconMessage size={15} />
                      Examiner Remarks
                    </h4>
                    <p className="text-xs text-gray-700 leading-relaxed italic whitespace-pre-wrap select-text">
                      "{activeResponse.feedback}"
                    </p>
                  </div>
                )}

                {activeAssessment && (
                  <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1.5">
                    <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wide">
                      <IconMessage size={15} />
                      AI Assessment Summary
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed select-text">
                      {activeAssessment.summaryBn}
                    </p>
                    <p className="text-[11px] text-gray-500">{activeAssessment.disclaimerBn}</p>
                  </div>
                )}
              </div>
            )}

            {activeAssessment && (
              <div className="order-3 grid grid-cols-1 lg:grid-cols-2 gap-5">
                <section className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black text-gray-900">Your original response</h3>
                      <p className="text-xs text-gray-500 mt-1">Red-underlined text-এ click করলে ভুল, correction এবং explanation দেখা যাবে।</p>
                    </div>
                    <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-[11px] font-bold text-rose-700">
                      {activeAssessment.grammarErrors.length +
                        activeAssessment.spellingErrors.length +
                        (activeAssessment.vocabularyErrors ?? []).length +
                        (activeAssessment.punctuationErrors ?? []).length +
                        (activeAssessment.cohesionAnalysis?.misusedOrOverusedConnectors ?? []).length +
                        (activeAssessment.relevanceIssues ?? []).filter((item) => item.issueType !== "MISSED_KEY_FEATURE").length} issues found
                    </span>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-slate-50/60 p-4">
                    <AnnotatedEssay essay={activeResponse?.essay || ""} assessment={activeAssessment} />
                  </div>
                </section>

                <section className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <h3 className="text-sm font-black text-gray-900">Relevance & data accuracy</h3>
                  {(activeAssessment.relevanceIssues ?? []).length === 0 ? (
                    <p className="text-sm text-gray-500">কোনো স্পষ্ট irrelevant statement বা data inaccuracy পাওয়া যায়নি।</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(activeAssessment.relevanceIssues ?? []).map((issue, index) => (
                        <div key={`${issue.issueType}-${index}`} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">{issue.issueType.replaceAll("_", " ")}</span>
                          <p className="text-sm text-gray-900">{issue.excerpt}</p>
                          <p className="text-xs leading-relaxed text-gray-600">{issue.reasonBn}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-gray-900">Grammar corrections</h3>
                  {activeAssessment.grammarErrors.length === 0 ? (
                    <p className="text-sm text-gray-500">কোনো স্পষ্ট grammar error পাওয়া যায়নি।</p>
                  ) : (
                    <div className="space-y-3">
                      {activeAssessment.grammarErrors.map((item, index) => (
                        <div key={`${item.original}-${index}`} className="rounded-xl border border-gray-200 p-4 space-y-2">
                          <p className="text-sm text-rose-700"><strong>ভুল:</strong> {item.original}</p>
                          <p className="text-sm text-emerald-700"><strong>সঠিক:</strong> {item.corrected}</p>
                          <p className="text-xs text-gray-600">{item.explanationBn}</p>
                          <p className="text-sm text-blue-700"><strong>আরও ভালো:</strong> {item.improvedVersion}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-gray-900">Spelling corrections</h3>
                  {activeAssessment.spellingErrors.length === 0 ? (
                    <p className="text-sm text-gray-500">কোনো spelling error পাওয়া যায়নি।</p>
                  ) : (
                    <div className="space-y-3">
                      {activeAssessment.spellingErrors.map((item, index) => (
                        <div key={`${item.original}-${index}`} className="rounded-xl border border-gray-200 p-4">
                          <p className="text-sm"><span className="text-rose-700 line-through">{item.original}</span>{" → "}<span className="font-bold text-emerald-700">{item.corrected}</span></p>
                          <p className="text-xs text-gray-600 mt-1">{item.explanationBn}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-gray-900">Vocabulary & word choice</h3>
                  {(activeAssessment.vocabularyErrors ?? []).length === 0 ? (
                    <p className="text-sm text-gray-500">কোনো স্পষ্ট vocabulary misuse পাওয়া যায়নি।</p>
                  ) : (
                    <div className="space-y-3">
                      {(activeAssessment.vocabularyErrors ?? []).map((item, index) => (
                        <div key={`${item.original}-${index}`} className="rounded-xl border border-gray-200 p-4 space-y-1.5">
                          <p className="text-sm"><span className="text-rose-700">{item.original}</span>{" → "}<span className="font-bold text-emerald-700">{item.corrected}</span></p>
                          <p className="text-xs leading-relaxed text-gray-600">{item.explanationBn}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-gray-900">Punctuation</h3>
                  {(activeAssessment.punctuationErrors ?? []).length === 0 ? (
                    <p className="text-sm text-gray-500">কোনো স্পষ্ট punctuation error পাওয়া যায়নি।</p>
                  ) : (
                    <div className="space-y-3">
                      {(activeAssessment.punctuationErrors ?? []).map((item, index) => (
                        <div key={`${item.original}-${index}`} className="rounded-xl border border-gray-200 p-4 space-y-1.5">
                          <p className="text-sm"><span className="text-rose-700">{item.original}</span>{" → "}<span className="font-bold text-emerald-700">{item.corrected}</span></p>
                          <p className="text-xs leading-relaxed text-gray-600">{item.explanationBn}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {activeAssessment.sentenceAnalysis && (
                  <section className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-gray-900">Sentence range & accuracy</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      {[
                        ["Simple", activeAssessment.sentenceAnalysis.simpleCount],
                        ["Compound", activeAssessment.sentenceAnalysis.compoundCount],
                        ["Complex", activeAssessment.sentenceAnalysis.complexCount],
                        ["Compound-complex", activeAssessment.sentenceAnalysis.compoundComplexCount],
                        ["Fragments", activeAssessment.sentenceAnalysis.fragmentCount],
                        ["Run-ons", activeAssessment.sentenceAnalysis.runOnCount],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="rounded-xl border border-gray-200 bg-slate-50 p-3 text-center">
                          <strong className="block text-lg text-gray-900">{value}</strong>
                          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-gray-700">{activeAssessment.sentenceAnalysis.feedbackBn}</p>
                  </section>
                )}

                {activeAssessment.cohesionAnalysis && (
                  <section className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-gray-900">Connectors & cohesion</h3>
                    <p className="text-sm leading-relaxed text-gray-700">{activeAssessment.cohesionAnalysis.feedbackBn}</p>
                    <div className="flex flex-wrap gap-2">
                      {activeAssessment.cohesionAnalysis.effectiveConnectors.map((connector, index) => (
                        <span key={`${connector}-${index}`} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{connector}</span>
                      ))}
                    </div>
                    {activeAssessment.cohesionAnalysis.misusedOrOverusedConnectors.map((item, index) => (
                      <div key={`${item.original}-${index}`} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                        <p className="text-sm"><span className="text-rose-700">{item.original}</span>{" → "}<span className="font-bold text-emerald-700">{item.corrected}</span></p>
                        <p className="text-xs leading-relaxed text-gray-600 mt-1">{item.explanationBn}</p>
                      </div>
                    ))}
                  </section>
                )}

                <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <h3 className="text-sm font-black text-gray-900 flex items-center gap-2"><IconBulb size={17} /> Band score কীভাবে বাড়াবেন</h3>
                  <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
                    {activeAssessment.bandImprovementAdviceBn.map((advice, index) => <li key={index}>{advice}</li>)}
                  </ul>
                </section>

                <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <h3 className="text-sm font-black text-gray-900">Corrected essay</h3>
                  <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap select-text max-h-80 overflow-y-auto">
                    {activeAssessment.correctedEssay || "No response submitted."}
                  </div>
                </section>

                <section className="lg:col-span-2 bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
                  <h3 className="text-sm font-black">Band 7–8 sample answer</h3>
                  <div className="text-sm leading-7 whitespace-pre-wrap select-text max-h-96 overflow-y-auto text-slate-200">
                    {activeAssessment.higherBandSample || "No sample was generated."}
                  </div>
                </section>
              </div>
            )}

            {/* Split Comparison Grid (Left: Prompt & Stimulus, Right: Response & Model Answer) */}
            <div className="order-1 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* LEFT COLUMN: QUESTION PROMPT & VISUAL STIMULUS */}
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <IconFileText size={15} className="text-black" />
                      Question Prompt & Instructions
                    </h3>
                    <span className="text-[11px] font-semibold text-gray-400">
                      {activeTask.taskType === "TASK_1" ? "Suggested: 20 mins" : "Suggested: 40 mins"}
                    </span>
                  </div>

                  {/* Clean Prompt Viewer without any huge gaps */}
                  <TaskPromptViewer task={activeTask} taskIdx={activeTaskTab} />

                  {/* Visual Stimulus Image directly inside prompt view */}
                  {activeTask.imageUrl && (
                    <div className="pt-4 border-t border-gray-200 mt-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider">
                        <IconPhoto size={16} className="text-black" />
                        <span>Task 1 Visual Stimulus Chart</span>
                      </div>
                      <ExamImageViewer src={activeTask.imageUrl} embedded />
                    </div>
                  )}

                  {/* PDF Reference Document */}
                  {activeTask.pdfUrl && (
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-gray-200 rounded-xl mt-4">
                      <div className="flex items-center gap-2.5">
                        <IconFileText className="text-black" size={20} />
                        <div>
                          <p className="text-xs font-bold text-gray-900">Task Reference PDF</p>
                          <p className="text-[11px] text-gray-500">A stimulus document is attached to this task.</p>
                        </div>
                      </div>
                      <a
                        href={activeTask.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                      >
                        Open PDF
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: CANDIDATE ESSAY & MODEL ANSWER */}
              <div className="space-y-4">
                {/* Candidate Submitted Essay */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Your Submitted Response
                    </h3>
                    <span className="text-[11px] font-bold text-gray-600">
                      Word Count:{" "}
                      <strong className="text-black">
                        {activeResponse?.wordCount ?? countWords(activeResponse?.essay || "")}
                      </strong>
                    </span>
                  </div>

                  {/* Response Essay Viewer */}
                  <ResponseEssayViewer
                    essay={activeResponse?.essay}
                    wordCount={activeResponse?.wordCount ?? countWords(activeResponse?.essay || "")}
                    minWords={activeTask.minWords ?? (activeTaskTab === 0 ? 150 : 250)}
                  />
                </div>

                {/* Examiner Model Answer (if provided) */}
                {activeTask.modelAnswer && <ModelAnswerViewer modelAnswer={activeTask.modelAnswer} />}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
