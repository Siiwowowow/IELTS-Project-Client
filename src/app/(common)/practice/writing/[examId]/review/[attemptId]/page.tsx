/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { writingService } from "@/services/writing.services";
import {
  IconLoader2,
  IconAlertCircle,
  IconArrowLeft,
  IconClock,
  IconFileText,
  IconAward,
  IconAlertTriangle,
  IconMessage,
  IconCircleCheck,
  IconBulb,
} from "@tabler/icons-react";
import Link from "next/link";
import { format } from "date-fns";

interface Props {
  params: Promise<{ examId: string; attemptId: string }>;
}

// Round to standard IELTS half band format
const formatBand = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return "N/A";
  return n.toFixed(1);
};

// Return border/text classes matching IELTS band scores
function bandColor(band: number) {
  if (band >= 8) return { ring: "border-emerald-400", text: "text-emerald-600", bg: "bg-emerald-50" };
  if (band >= 7) return { ring: "border-green-400",   text: "text-green-600",   bg: "bg-green-50" };
  if (band >= 6) return { ring: "border-blue-400",    text: "text-blue-600",    bg: "bg-blue-50" };
  if (band >= 5) return { ring: "border-orange-400",  text: "text-orange-600",  bg: "bg-orange-50" };
  return         { ring: "border-rose-400",    text: "text-rose-600",    bg: "bg-rose-50" };
}

function bandLabel(band: number) {
  if (band >= 8.5) return "Expert User";
  if (band >= 7.5) return "Very Good User";
  if (band >= 6.5) return "Good User";
  if (band >= 5.5) return "Competent User";
  if (band >= 4.5) return "Modest User";
  return "Limited User";
}

export default function WritingReviewPage({ params }: Props) {
  const { examId, attemptId } = use(params);
  const [activeTaskTab, setActiveTaskTab] = useState<0 | 1>(0); // 0 = Task 1, 1 = Task 2

  const { data, isLoading, isError } = useQuery({
    queryKey: ["writing-attempt-review", attemptId],
    queryFn: () => writingService.getAttemptReview(attemptId),
  });

  const attempt = data?.data;
  const exam = attempt?.exam;
  const sortedResponses = attempt?.responses
    ? [...attempt.responses].sort((a: any, b: any) => (a.task?.order ?? 0) - (b.task?.order ?? 0))
    : [];

  const activeResponse = sortedResponses[activeTaskTab];
  const activeTask = activeResponse?.task;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <IconLoader2 size={40} className="animate-spin text-violet-600" />
        <p className="text-sm font-bold text-gray-500">Retrieving assessment feedback...</p>
      </div>
    );
  }

  if (isError || !attempt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 max-w-md mx-auto text-center px-4">
        <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
          <IconAlertCircle size={28} />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-black text-gray-900 text-lg">Failed to load attempt</h2>
          <p className="text-sm text-gray-500 font-medium leading-relaxed">
            We couldn't retrieve the grade report for this writing attempt. It may have been archived.
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

  const isGraded = attempt.bandScore !== null;
  const dateFormatted = attempt.createdAt
    ? format(new Date(attempt.createdAt), "MMMM d, yyyy 'at' h:mm a")
    : "Date unavailable";

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 px-4 pb-16">
      {/* Back Button & Top Meta */}
      <div className="flex flex-col gap-3">
        <Link
          href="/practice/writing"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-violet-600 transition self-start"
        >
          <IconArrowLeft size={14} />
          Back to Writing Practice
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Review Writing Mock: {exam?.title}
            </h1>
            <p className="text-xs font-medium text-gray-500 mt-1">
              Submitted on {dateFormatted}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                isGraded
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {isGraded ? "Graded" : "Awaiting Evaluation"}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-100 uppercase tracking-wide">
              {exam?.examType === "GENERAL_TRAINING" ? "General Training" : "Academic"}
            </span>
          </div>
        </div>
      </div>

      {/* Graded Assessment Scorecard Dashboard */}
      {isGraded ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main calculated band score */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden md:col-span-1">
            <div className="absolute top-0 left-0 w-full h-1 bg-violet-600" />
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">
              Overall Band Score
            </span>
            <div className={`h-24 w-24 rounded-full border-4 ${bandColor(attempt.bandScore!).ring} flex flex-col items-center justify-center bg-slate-50/50 mb-3`}>
              <span className={`text-3xl font-black ${bandColor(attempt.bandScore!).text}`}>
                {formatBand(attempt.bandScore)}
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider -mt-1">
                Band
              </span>
            </div>
            <h3 className="font-extrabold text-sm text-gray-800">
              {bandLabel(attempt.bandScore!)}
            </h3>
            <p className="text-[10px] text-gray-400 font-medium mt-1">
              Task 2 carries twice the scoring weight of Task 1.
            </p>
          </div>

          {/* Task 1 & Task 2 Breakdown summaries */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm md:col-span-2 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600" />
            <div>
              <h3 className="font-black text-gray-900 text-sm flex items-center gap-1.5 mb-4">
                <IconAward size={18} className="text-indigo-600" />
                Individual Task Breakdown
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sortedResponses.map((res: any, idx: number) => {
                  const taskBand = res.taskBandScore ?? 0;
                  const wordCountVal = res.wordCount ?? 0;
                  const isTask1 = idx === 0;

                  return (
                    <div
                      key={res.id}
                      className="p-4 rounded-xl border border-gray-150 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black text-gray-800">
                            Task {idx + 1}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                            {isTask1 ? "Task Report" : "Opinion Essay"}
                          </p>
                        </div>
                        <span className={`text-base font-black ${bandColor(taskBand).text}`}>
                          Band {formatBand(taskBand)}
                        </span>
                      </div>

                      <div className="flex gap-4 text-[10px] text-gray-500 font-bold">
                        <span className="flex items-center gap-1">
                          <IconFileText size={12} />
                          {wordCountVal} words
                        </span>
                        <span className="flex items-center gap-1">
                          <IconClock size={12} />
                          {isTask1 ? "20m recommended" : "40m recommended"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl mt-4">
              <IconCircleCheck size={18} className="text-indigo-600 shrink-0" />
              <p className="text-[11px] text-indigo-900 leading-normal font-semibold">
                Your essays have been graded manually by an official examiner using IELTS assessment descriptors. 
                View details and criteria breakdowns below.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Awaiting Evaluation banner state */
        <div className="flex gap-4 p-5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 items-start">
          <IconAlertTriangle size={24} className="shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-black text-sm text-amber-900">Awaiting Examiner Evaluation</h3>
            <p className="text-xs text-amber-700/90 leading-relaxed font-medium">
              Your writing attempt has been recorded and submitted. Writing tasks require manual assessment by an administrator 
              or teacher. Once graded, you will see a detailed report including overall band scores and grading rubrics.
            </p>
          </div>
        </div>
      )}

      {/* Task Switcher Tabs */}
      <div className="flex border-b border-gray-200">
        {sortedResponses.map((res: any, idx: number) => {
          const isSelected = activeTaskTab === idx;
          return (
            <button
              key={res.id}
              onClick={() => setActiveTaskTab(idx as 0 | 1)}
              className={`px-6 py-3 border-b-2 text-sm font-black transition-all ${
                isSelected
                  ? "border-violet-600 text-violet-700 bg-violet-50/10"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Task {idx + 1} Review
            </button>
          );
        })}
      </div>

      {/* Selected Task Details & Essay Display */}
      {activeResponse && activeTask && (
        <div className="space-y-6">
          {/* Detailed Criteria Scoring Rubrics & Feedback (ONLY if graded) */}
          {isGraded && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left col: Rubric scorecards */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Criteria Scorecard (IELTS Band 0-9)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Criterion 1 */}
                  <div className="bg-white border border-gray-150 p-4 rounded-xl flex items-center justify-between shadow-xs">
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">
                        {activeTask.taskType === "TASK_1" ? "Task Achievement" : "Task Response"}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-medium">Core answers address of target instruction.</p>
                    </div>
                    <span className="h-10 w-10 shrink-0 bg-violet-50 text-violet-700 font-black text-sm rounded-lg flex items-center justify-center border border-violet-100">
                      {formatBand(activeResponse.taskAchievement)}
                    </span>
                  </div>

                  {/* Criterion 2 */}
                  <div className="bg-white border border-gray-150 p-4 rounded-xl flex items-center justify-between shadow-xs">
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">Coherence & Cohesion</h4>
                      <p className="text-[10px] text-gray-400 font-medium">Logical structure, links, paragraph clarity.</p>
                    </div>
                    <span className="h-10 w-10 shrink-0 bg-violet-50 text-violet-700 font-black text-sm rounded-lg flex items-center justify-center border border-violet-100">
                      {formatBand(activeResponse.coherenceCohesion)}
                    </span>
                  </div>

                  {/* Criterion 3 */}
                  <div className="bg-white border border-gray-150 p-4 rounded-xl flex items-center justify-between shadow-xs">
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">Lexical Resource</h4>
                      <p className="text-[10px] text-gray-400 font-medium">Range, flexibility, precision of vocabulary.</p>
                    </div>
                    <span className="h-10 w-10 shrink-0 bg-violet-50 text-violet-700 font-black text-sm rounded-lg flex items-center justify-center border border-violet-100">
                      {formatBand(activeResponse.lexicalResource)}
                    </span>
                  </div>

                  {/* Criterion 4 */}
                  <div className="bg-white border border-gray-150 p-4 rounded-xl flex items-center justify-between shadow-xs">
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">Grammatical Accuracy</h4>
                      <p className="text-[10px] text-gray-400 font-medium">Sentence range complexity and error rate.</p>
                    </div>
                    <span className="h-10 w-10 shrink-0 bg-violet-50 text-violet-700 font-black text-sm rounded-lg flex items-center justify-center border border-violet-100">
                      {formatBand(activeResponse.grammaticalRange)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right col: Teacher written remarks */}
              <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <IconMessage size={16} />
                    Teacher's Feedback
                  </h4>
                  <p className="text-xs text-gray-700 font-medium leading-relaxed italic whitespace-pre-wrap select-text">
                    {activeResponse.feedback || "No written remarks provided for this task. Focus on band score criteria targets."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Prompt, Response & Model Answer Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left side: prompt instructions */}
            <div className="space-y-5">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Question Prompt
                </h3>
                <div 
                  className="whitespace-pre-wrap text-sm font-bold text-gray-900 bg-slate-50 p-4 rounded-xl border border-gray-100 leading-relaxed select-text"
                  dangerouslySetInnerHTML={{ __html: activeTask.instruction }}
                />
              </div>

              {/* Visual image stimulus display */}
              {activeTask.imageUrl && (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col items-center">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 self-start mb-3">
                    Visual Stimulus
                  </h3>
                  <img
                    src={activeTask.imageUrl}
                    alt="Task Visual Stimulus"
                    className="max-h-72 object-contain border border-gray-100 rounded-lg p-1 bg-white"
                  />
                </div>
              )}
            </div>

            {/* Right side: Student essay & Examiner model answer */}
            <div className="space-y-6">
              {/* Student Essay Response */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Your Response
                  </h3>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">
                    Word Count: <strong className="text-gray-800">{activeResponse.wordCount ?? 0} words</strong>
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-800 leading-relaxed whitespace-pre-wrap select-text">
                  {activeResponse.essay && activeResponse.essay.trim() !== "" ? (
                    <div className="bg-slate-50/30 p-4 rounded-xl border border-gray-100/50">
                      {activeResponse.essay}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center gap-3 border border-dashed border-amber-250 rounded-2xl bg-amber-50/15 text-amber-850 p-6">
                      <IconAlertTriangle size={28} className="text-amber-500 animate-pulse" />
                      <div className="space-y-1">
                        <p className="font-bold text-sm text-amber-900">Task Left Unanswered</p>
                        <p className="text-xs text-gray-500 font-medium max-w-xs mx-auto">
                          You did not write or submit any response for this writing task during the assessment.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Examiner Model Answer (if available) */}
              {activeTask.modelAnswer && (
                <div className="bg-emerald-50/20 border border-emerald-200 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-800 flex items-center gap-1.5">
                    <IconBulb size={16} />
                    Model Reference Answer
                  </h3>
                  <div className="text-sm font-medium text-emerald-950 leading-relaxed whitespace-pre-wrap bg-white/70 p-4 rounded-xl border border-emerald-100/50 select-text">
                    {activeTask.modelAnswer}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
