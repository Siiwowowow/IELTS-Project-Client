/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { IconFlag } from "@tabler/icons-react";
import { ListeningQuestionRenderer } from "./ListeningQuestionRenderer";

function parseGroupInstruction(instruction?: string) {
  if (!instruction) {
    return { range: "", inst1: "", inst2: "", heading: "" };
  }
  if (instruction.includes("|||")) {
    const parts = instruction.split("|||");
    return {
      range: parts[0] || "",
      inst1: parts[1] || "",
      inst2: parts[2] || "",
      heading: parts[3] || "",
    };
  }
  return { range: "", inst1: instruction, inst2: "", heading: "" };
}

interface Question {
  id: string;
  questionNumber: number;
  questionText?: string;
  options?: string[];
}

interface QuestionGroup {
  id: string;
  type: string;
  instruction?: string;
  passageSegment?: string;
  imageUrl?: string;
  options?: string[];
  questions: Question[];
}

interface QuestionGroupCardProps {
  group: QuestionGroup;
  answers: Record<string, string>;
  flagged: Record<string, boolean>;
  activeQuestionId: string | null;
  onAnswer: (qId: string, val: string) => void;
  onToggleFlag: (qId: string) => void;
}

export function QuestionGroupCard({
  group,
  answers,
  flagged,
  activeQuestionId,
  onAnswer,
  onToggleFlag,
}: QuestionGroupCardProps) {
  const isTableForm = group.type === "SENTENCE_COMPLETION" || group.type === "TABLE_COMPLETION";
  const isMCQ = group.type === "MULTIPLE_CHOICE";
  const isMultiMCQ = group.type === "MULTIPLE_CHOICE_MULTIPLE";
  const isCheckboxGrid = group.type === "YES_NO_NOT_GIVEN";

  const getCardTitle = () => {
    if (group.type === "NOTES_COMPLETION") return "NOTES COMPLETION";
    if (group.type === "SUMMARY_COMPLETION" || group.type === "SUMMARY_COMPLETION_WITH_OPTIONS" || group.type === "SUMMARY_COMPLETION_WITHOUT_OPTIONS") return "SUMMARY COMPLETION";
    if (group.type === "DIAGRAM_LABELLING") return "DIAGRAM LABELLING";
    if (group.type === "FLOW_CHART_COMPLETION") return "FLOW CHART COMPLETION";
    if (isTableForm) return "ACCOMMODATION FORM";
    if (isMCQ || isMultiMCQ) return "LOCATION PREFERENCE";
    if (isCheckboxGrid) return "FACILITY AVAILABILITY";
    return "TEST QUESTIONS";
  };

  // Check if any question in this card is flagged to color the group flag
  const isAnyFlagged = group.questions.some((q) => flagged[q.id]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 md:p-6 shadow-sm select-none font-sans relative hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-shadow duration-150">
      
      {/* CARD HEADER */}
      <div className="flex items-center justify-between border-b border-gray-150 pb-3 mb-4">
        <span className="font-extrabold text-[#1B3A6B] tracking-wider text-xs md:text-sm uppercase">
          {getCardTitle()}
        </span>
        <button
          type="button"
          onClick={() => onToggleFlag(group.questions[0]?.id)}
          className={`transition-colors duration-150 ${
            isAnyFlagged ? "text-[#1B3A6B]" : "text-gray-300 hover:text-gray-400"
          }`}
          title="Review flag indicator"
        >
          <IconFlag size={18} fill={isAnyFlagged ? "#1B3A6B" : "none"} />
        </button>
      </div>

      {/* IELTS standard header block (Range, Instructions, Heading) for Table, MCQ, and Checkbox Grid */}
      {(isTableForm || isMCQ || isCheckboxGrid || isMultiMCQ) && (() => {
        const parsed = parseGroupInstruction(group.instruction);
        const finalRange = parsed.range || (group.questions.length > 0 ? (
          group.questions[0].questionNumber === group.questions[group.questions.length - 1].questionNumber
            ? `Question ${group.questions[0].questionNumber}`
            : `Questions ${group.questions[0].questionNumber}–${group.questions[group.questions.length - 1].questionNumber}`
        ) : "");
        const finalHeading = parsed.heading || (
          group.passageSegment &&
          !group.passageSegment.includes("[") &&
          !group.passageSegment.includes("|") ? group.passageSegment : ""
        );
        return (
          <div className="mb-4 space-y-1.5 select-text">
            {finalRange && (
              <h2 className="text-base md:text-lg font-bold text-gray-900 leading-tight">
                {finalRange}
              </h2>
            )}
            {parsed.inst1 && (
              <p className="text-xs md:text-sm text-gray-650 italic font-medium leading-relaxed">
                {parsed.inst1}
              </p>
            )}
            {parsed.inst2 && (
              <p className="text-xs md:text-sm text-gray-650 italic font-medium leading-relaxed">
                {parsed.inst2}
              </p>
            )}
            {finalHeading && (
              <h3 className="text-center font-bold text-sm md:text-base text-gray-800 my-4 block select-text">
                {finalHeading}
              </h3>
            )}
          </div>
        );
      })()}

      {/* 1. TABLE FORM FORMAT (Accommodation Form) */}
      {isTableForm && (
        <div className="border border-gray-200 rounded overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left w-1/2 border-r border-gray-200">Field</th>
                <th className="px-4 py-3 text-left w-1/2">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              {group.questions.map((q) => {
                const label = q.questionText?.replace(/____+/g, "") || "";
                const isSelected = activeQuestionId === q.id;
                
                return (
                  <tr key={q.id} className="hover:bg-slate-50/40">
                    <td className="px-4 py-3 font-semibold text-gray-700 border-r border-gray-200">
                      <div className="flex items-center gap-2 select-none">
                        {/* Number and small flag */}
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                            {q.questionNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => onToggleFlag(q.id)}
                            className={`p-0.5 rounded ${
                              flagged[q.id] ? "text-[#1B3A6B]" : "text-gray-300"
                            }`}
                          >
                            <IconFlag size={11} fill={flagged[q.id] ? "#1B3A6B" : "none"} />
                          </button>
                        </div>
                        <span className="text-gray-700 font-medium text-[13px] md:text-sm">{label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        id={`q-input-${q.id}`}
                        value={answers[q.id] ?? ""}
                        onChange={(e) => onAnswer(q.id, e.target.value)}
                        className={`w-full h-10 px-3 border rounded text-sm text-gray-800 transition-all font-medium bg-white focus:outline-none ${
                          isSelected
                            ? "border-[#1B3A6B] ring-1 ring-[#1B3A6B]"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        placeholder="Enter text here..."
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. MCQ FORMAT (Location Preference) */}
      {isMCQ && (
        <div className="space-y-6 select-text">
          {group.questions.map((q) => {
            return (
              <div key={q.id} className="space-y-2">
                <div className="flex items-start gap-2 text-sm md:text-base font-bold text-gray-800">
                  {/* Number & flag */}
                  <span className="bg-gray-150 px-1.5 py-0.5 rounded text-[11px] font-black shrink-0 mt-0.5 select-none">
                    {q.questionNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleFlag(q.id)}
                    className={`${flagged[q.id] ? "text-[#1B3A6B]" : "text-gray-300 hover:text-gray-400"} shrink-0 mt-1 select-none`}
                  >
                    <IconFlag size={12} fill={flagged[q.id] ? "#1B3A6B" : "none"} />
                  </button>
                  <span className="text-gray-900 font-bold ml-1 leading-snug">{q.questionText}</span>
                </div>

                <div className="grid gap-2 pl-7 md:pl-8 max-w-[650px]">
                  {q.options?.map((opt, oIdx) => {
                    const label = String.fromCharCode(65 + oIdx); // A, B, C
                    const active = answers[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => onAnswer(q.id, opt)}
                        className={`flex items-center gap-3 w-full py-1.5 px-2.5 transition-all text-left text-sm md:text-[15px] rounded-lg font-medium select-none ${
                          active
                            ? "text-[#1B3A6B] font-bold"
                            : "text-gray-650 hover:bg-slate-100/50 hover:text-black bg-transparent"
                        }`}
                      >
                        <span className="flex items-center gap-2 shrink-0">
                          {/* Bold label in a small gray circle */}
                          <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-800 select-none">
                            {label}
                          </span>
                          {/* Radio circle bullet point */}
                          <span className={`inline-flex w-4 h-4 rounded-full border items-center justify-center shrink-0 ${
                            active ? "border-[#1B3A6B]" : "border-gray-300"
                          }`}>
                            {active && <span className="w-2.5 h-2.5 rounded-full bg-[#1B3A6B]" />}
                          </span>
                        </span>
                        <span className={`flex-grow leading-relaxed ${active ? "text-gray-900 font-bold" : "text-gray-700 font-medium"}`}>
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. CHECKBOX GRID FORMAT (Facility Availability table) */}
      {isCheckboxGrid && (
        <div className="border border-gray-200 rounded overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider text-center">
              <tr>
                <th className="px-4 py-3 text-left w-1/2 border-r border-gray-200">Facility</th>
                <th className="px-4 py-3 w-1/4 border-r border-gray-200">Yes (Available)</th>
                <th className="px-4 py-3 w-1/4">No (Unavailable)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              {group.questions.map((q) => {
                const answer = answers[q.id];
                const isYes = answer === "Yes";
                const isNo = answer === "No";

                return (
                  <tr key={q.id} className="hover:bg-slate-50/40 text-center">
                    <td className="px-4 py-3 text-left font-semibold text-gray-700 border-r border-gray-200">
                      <div className="flex items-center gap-2 select-none">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                            {q.questionNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => onToggleFlag(q.id)}
                            className={`p-0.5 rounded ${
                              flagged[q.id] ? "text-[#1B3A6B]" : "text-gray-300"
                            }`}
                          >
                            <IconFlag size={11} fill={flagged[q.id] ? "#1B3A6B" : "none"} />
                          </button>
                        </div>
                        <span className="text-gray-700 font-medium text-[13px] md:text-sm">{q.questionText}</span>
                      </div>
                    </td>
                    
                    {/* YES COLUMN CHECKBOX */}
                    <td className="px-4 py-3 border-r border-gray-200 align-middle">
                      <button
                        type="button"
                        onClick={() => onAnswer(q.id, isYes ? "" : "Yes")}
                        className={`w-6 h-6 border mx-auto flex items-center justify-center shrink-0 text-white rounded transition-colors duration-100 select-none ${
                          isYes ? "bg-[#1B3A6B] border-[#1B3A6B]" : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {isYes && <span className="font-black text-sm">✓</span>}
                      </button>
                    </td>

                    {/* NO COLUMN CHECKBOX */}
                    <td className="px-4 py-3 align-middle">
                      <button
                        type="button"
                        onClick={() => onAnswer(q.id, isNo ? "" : "No")}
                        className={`w-6 h-6 border mx-auto flex items-center justify-center shrink-0 text-white rounded transition-colors duration-100 select-none ${
                          isNo ? "bg-[#1B3A6B] border-[#1B3A6B]" : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {isNo && <span className="font-black text-sm">✓</span>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 3.5 MULTI MCQ (Checkbox List) */}
      {isMultiMCQ && (
        <div className="space-y-4 select-text pl-2">
          {/* Main prompt from the first question */}
          {group.questions[0]?.questionText && (
            <div className="flex items-start gap-2.5 text-sm md:text-base font-bold text-gray-800 mb-2">
              {/* Render flags/numbers for all questions in this multi MCQ group */}
              <div className="flex items-center gap-1.5 shrink-0 mt-0.5 select-none">
                {group.questions.map((q) => (
                  <div key={q.id} className="flex items-center gap-0.5 bg-gray-100 border border-gray-205 px-1.5 py-0.5 rounded text-[10px] font-black">
                    <span>{q.questionNumber}</span>
                    <button
                      type="button"
                      onClick={() => onToggleFlag(q.id)}
                      className={`${flagged[q.id] ? "text-[#1B3A6B]" : "text-gray-300 hover:text-gray-400"} shrink-0`}
                    >
                      <IconFlag size={10} fill={flagged[q.id] ? "#1B3A6B" : "none"} />
                    </button>
                  </div>
                ))}
              </div>
              <span className="text-gray-900 font-bold ml-1 leading-snug">{group.questions[0].questionText}</span>
            </div>
          )}
          
          <div className="grid gap-2 pl-2 max-w-[650px]">
            {(() => {
              // Options are taken from the first question in the group
              const opts = group.questions[0]?.options ?? [];
              
              // Find which options are currently selected across all questions in the group
              const currentSelectedOpts = group.questions
                .map((q) => answers[q.id])
                .filter(Boolean);
                
              return opts.map((opt, oIdx) => {
                const label = String.fromCharCode(65 + oIdx); // A, B, C...
                const active = currentSelectedOpts.includes(opt);
                
                const handleToggle = () => {
                  if (active) {
                    // If already selected, find which question had this answer and clear it
                    const targetQ = group.questions.find((q) => answers[q.id] === opt);
                    if (targetQ) {
                      onAnswer(targetQ.id, "");
                    }
                  } else {
                    // If not selected, find the first question in the group that doesn't have an answer yet and assign it
                    const emptyQ = group.questions.find((q) => !answers[q.id]);
                    if (emptyQ) {
                      onAnswer(emptyQ.id, opt);
                    } else {
                      // If all are filled, replace the first question's answer
                      if (group.questions.length > 0) {
                        onAnswer(group.questions[0].id, opt);
                      }
                    }
                  }
                };
                
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={handleToggle}
                    className={`flex items-center gap-3 w-full py-1.5 px-2.5 transition-all text-left text-sm md:text-[15px] rounded-lg font-medium select-none ${
                      active
                        ? "text-[#1B3A6B] font-bold"
                        : "text-gray-650 hover:bg-slate-100/50 hover:text-black bg-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-2 shrink-0">
                      {/* Bold label in a small gray circle */}
                      <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-800 select-none">
                        {label}
                      </span>
                      {/* Checkbox square bullet point */}
                      <span className={`inline-flex w-4 h-4 rounded border items-center justify-center shrink-0 ${
                        active ? "border-[#1B3A6B] bg-[#1B3A6B] text-white" : "border-gray-300 bg-white"
                      }`}>
                        {active && <span className="text-[10px] font-black leading-none">✓</span>}
                      </span>
                    </span>
                    <span className={`flex-grow leading-relaxed ${active ? "text-gray-900 font-bold" : "text-gray-700 font-medium"}`}>
                      {opt}
                    </span>
                  </button>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* 4. OTHER FORMATS (using ListeningQuestionRenderer) */}
      {!isTableForm && !isMCQ && !isCheckboxGrid && !isMultiMCQ && (
        <ListeningQuestionRenderer
          group={group as any}
          answers={answers}
          onAnswer={onAnswer}
          hideReferenceBox={false}
        />
      )}
 
    </div>
  );
}
