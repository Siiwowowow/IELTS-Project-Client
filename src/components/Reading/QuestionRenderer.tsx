/* eslint-disable prefer-const */
"use client";

import React from "react";
import { IQuestion, IQuestionGroup } from "@/types/reading.types";
import HighlightableText from "./HighlightableText";
import { parseBoldText, getOptionLabel, parseGroupInstruction } from "@/lib/utils";

function parseMatchingHeadingsConfig(passageSegment?: string) {
  if (!passageSegment) {
    return { mode: "WITH_CLUES", introText: "", exampleParagraph: "", exampleAnswer: "" };
  }
  try {
    const trimmed = passageSegment.trim();
    if (trimmed.startsWith("{")) {
      const parsed = JSON.parse(trimmed);
      return {
        mode: parsed.mode || "WITH_CLUES",
        introText: parsed.introText || "",
        exampleParagraph: parsed.exampleParagraph || "",
        exampleAnswer: parsed.exampleAnswer || ""
      };
    }
  } catch {
    // fallback
  }
  return { mode: "WITH_CLUES", introText: "", exampleParagraph: "", exampleAnswer: "" };
}

function isNameMatchingGroup(group: IQuestionGroup): boolean {
  if (group.type !== "MATCHING_FEATURES" || !group.passageSegment) return false;
  try {
    return JSON.parse(group.passageSegment).variant === "NAME_MATCHING";
  } catch {
    return false;
  }
}

function cleanQuestionText(text: string | undefined, questionNumber?: number): string {
  if (!text) return "";
  let trimmed = text.trim();
  if (questionNumber !== undefined) {
    const bracketRegex = new RegExp(`^(\\[\\s*${questionNumber}\\s*\\]|Question\\s+${questionNumber}\\s*[.:\\-)]|${questionNumber}\\s*[.\\-)]|${questionNumber}\\s+)`, "i");
    if (bracketRegex.test(trimmed)) {
      return trimmed.replace(bracketRegex, "").trim();
    }
  }
  const generalBracketRegex = new RegExp(`^(\\[\\s*\\d+\\s*\\]|Question\\s+\\d+\\s*[.:\\-)]|\\d+\\s*[.\\-)]|\\d+\\s+)`, "i");
  if (generalBracketRegex.test(trimmed)) {
    return trimmed.replace(generalBracketRegex, "").trim();
  }
  return trimmed;
}

function QuestionNumberBadge({ number }: { number: number }) {
  return (
    <span className="inline-flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-[#003580]">
      {number}
    </span>
  );
}

// Regex matching blank placeholders: [], [ ], [23], [blank], ____, .........., …
export const BLANK_REGEX = /(?:\[\s*\d*\s*\]|\[\s*blank\s*\]|_{2,}|\.{3,}|…)/i;

function getSubAnswer(answer: string, blankIndex: number, totalBlanks: number): string {
  if (totalBlanks <= 1) return answer;
  if (answer.includes(" and ")) {
    const split = answer.split(" and ");
    return split[blankIndex] ?? "";
  }
  if (answer.includes(",")) {
    const split = answer.split(/\s*,\s*/);
    return split[blankIndex] ?? "";
  }
  if (answer.includes("/")) {
    const split = answer.split(/\s*\/\s*/);
    return split[blankIndex] ?? "";
  }
  const words = answer.trim().split(/\s+/);
  if (words.length === totalBlanks) {
    return words[blankIndex] ?? "";
  }
  return blankIndex === 0 ? answer : "";
}

function updateSubAnswer(currentAnswer: string, blankIndex: number, newValue: string, totalBlanks: number): string {
  if (totalBlanks <= 1) return newValue;
  const values: string[] = [];
  for (let idx = 0; idx < totalBlanks; idx++) {
    values.push(idx === blankIndex ? newValue : getSubAnswer(currentAnswer, idx, totalBlanks));
  }
  if (values.every((v) => !v.trim())) return "";
  const filled = values.filter((v) => v.trim());
  if (filled.length === 1) {
    return filled[0].trim();
  }
  return values.map((v) => v.trim()).filter(Boolean).join(" and ");
}

// ─── Sub-question renderers ───────────────────────────────────────────────────

function TFNGButtons({
  options,
  answer,
  onAnswer,
}: {
  options: string[];
  answer: string;
  onAnswer: (v: string) => void;
}) {
  return (
    <div className="mt-2.5 space-y-1.5 pl-1">
      {options.map((opt, i) => {
        const label = String.fromCharCode(65 + i); // A, B, C
        const active = answer.trim().toLowerCase() === opt.trim().toLowerCase();
        return (
          <div
            key={opt}
            onClick={() => onAnswer(opt)}
            className={`flex items-center gap-2.5 w-full max-w-sm px-3.5 py-1.5 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
              active
                ? "bg-[#003580]/5 text-[#003580] border-[#003580] font-bold"
                : "bg-white text-gray-700 border-gray-200 hover:border-[#003580]/50 hover:bg-gray-50/50"
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full flex shrink-0 items-center justify-center text-[10px] font-black select-none ${
                active ? "bg-[#003580] text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              {label}
            </span>
            <div className="flex items-center gap-2">
              <span className={`inline-flex w-3.5 h-3.5 rounded-full border shrink-0 items-center justify-center select-none ${
                active ? "border-[#003580]" : "border-gray-300"
              }`}>
                {active && <span className="w-2 h-2 rounded-full bg-[#003580]" />}
              </span>
              <span className="font-semibold text-gray-800 text-[14px] md:text-[14.5px]">{parseBoldText(opt)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder = "Your answer…",
  inline = false,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inline?: boolean;
  id?: string;
}) {
  if (inline) {
    return (
      <input
        type="text"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="inline-block w-28 sm:w-32 px-2 py-0.5 mx-1.5 text-xs md:text-[13px] border border-gray-300 rounded focus:border-[#003580] focus:ring-1 focus:ring-[#003580] focus:outline-none bg-white text-center align-middle h-7 font-semibold text-black"
      />
    );
  }
  return (
    <input
      type="text"
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-1.5 text-xs md:text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003580]/25 focus:border-[#003580] transition-all bg-white font-semibold text-black"
    />
  );
}

function MCQButtons({
  opts,
  answer,
  onAnswer,
}: {
  opts: string[];
  answer: string;
  onAnswer: (v: string) => void;
}) {
  return (
    <div className="mt-2.5 space-y-1.5 pl-6 md:pl-7 max-w-[620px]">
      {opts.map((opt, i) => {
        const label = String.fromCharCode(65 + i);
        const active = answer === opt || answer.trim().toUpperCase() === label;
        return (
          <div
            key={opt}
            onClick={() => onAnswer(opt)}
            className={`flex items-center gap-2.5 w-full py-1.5 px-2.5 transition-all text-left text-[14px] md:text-[15px] rounded-lg cursor-pointer ${
              active
                ? "text-[#1B3A6B] font-bold"
                : "text-gray-650 hover:bg-slate-100/50 hover:text-black bg-transparent"
            }`}
          >
            <span className="flex items-center gap-2 shrink-0">
              {/* Bold label in a small gray circle */}
              <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-800 select-none">
                {label}
              </span>
              {/* Radio circle bullet point */}
              <span
                className={`inline-flex w-3.5 h-3.5 rounded-full border items-center justify-center shrink-0 select-none ${
                  active ? "border-[#1B3A6B]" : "border-gray-300"
                }`}
              >
                {active && <span className="w-2 h-2 rounded-full bg-[#1B3A6B]" />}
              </span>
            </span>
            <span className={`flex-grow leading-relaxed ${active ? "text-gray-900 font-semibold" : "text-gray-700 font-normal"}`}>
              {parseBoldText(opt)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MatchingSelect({
  opts,
  answer,
  onAnswer,
}: {
  opts: string[];
  answer: string;
  onAnswer: (v: string) => void;
}) {
  return (
    <select
      value={answer}
      onChange={(e) => onAnswer(e.target.value)}
      className="mt-2 w-full max-w-sm px-2.5 py-1.5 text-xs md:text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003580]/25 focus:border-[#003580] transition-all bg-white font-semibold text-black"
    >
      <option value="">— Select —</option>
      {opts.map((opt, i) => (
        <option key={i} value={opt}>
          {getOptionLabel(opt)}
        </option>
      ))}
    </select>
  );
}

// ─── Per-question dispatcher ──────────────────────────────────────────────────

function SingleQuestion({
  group,
  question,
  answer,
  onAnswer,
}: {
  group: IQuestionGroup;
  question: IQuestion;
  answer: string;
  onAnswer: (v: string) => void;
}) {
  const type = group.type;
  const text = cleanQuestionText(question.questionText ?? "", question.questionNumber);

  /* TRUE / FALSE / NOT GIVEN */
  if (type === "TRUE_FALSE_NOT_GIVEN") {
    return (
      <>
        <HighlightableText text={text} />
        <TFNGButtons options={["TRUE", "FALSE", "NOT GIVEN"]} answer={answer} onAnswer={onAnswer} />
      </>
    );
  }

  /* YES / NO / NOT GIVEN */
  if (type === "YES_NO_NOT_GIVEN") {
    return (
      <>
        <HighlightableText text={text} />
        <TFNGButtons options={["YES", "NO", "NOT GIVEN"]} answer={answer} onAnswer={onAnswer} />
      </>
    );
  }

  /* MULTIPLE CHOICE */
  if (type === "MULTIPLE_CHOICE") {
    const opts = question.options ?? group.options ?? [];
    return (
      <>
        <HighlightableText text={text} />
        <MCQButtons opts={opts} answer={answer} onAnswer={onAnswer} />
      </>
    );
  }

  /* MULTIPLE CHOICE (MULTIPLE ANSWERS) FALLBACK */
  if (type === "MULTIPLE_CHOICE_MULTIPLE") {
    const opts = question.options ?? group.options ?? [];
    return (
      <>
        <HighlightableText text={text} />
        <MCQButtons opts={opts} answer={answer} onAnswer={onAnswer} />
      </>
    );
  }

  /* SENTENCE / SUMMARY / FLOW-CHART / TABLE / DIAGRAM – may have blanks */
  if (
    type === "SENTENCE_COMPLETION" ||
    type === "SUMMARY_COMPLETION" ||
    type === "SUMMARY_COMPLETION_WITH_OPTIONS" ||
    type === "SUMMARY_COMPLETION_WITHOUT_OPTIONS" ||
    type === "NOTES_COMPLETION" ||
    type === "FLOW_CHART_COMPLETION" ||
    type === "TABLE_COMPLETION"
  ) {
    const rawText = cleanQuestionText(question.questionText ?? "", question.questionNumber);
    const text = type === "SENTENCE_COMPLETION" ? rawText.replace(/\r?\n+/g, " ").trim() : rawText;
    const parts = text.split(BLANK_REGEX);
    const hasOptions = type !== "SUMMARY_COMPLETION_WITHOUT_OPTIONS" && group.options && group.options.length > 0;

    if (parts.length > 1) {
      const numBlanks = parts.length - 1;
      return (
        <p className="text-[15px] md:text-base text-gray-900 leading-[2.2rem] font-medium">
          {parts.map((part, i) => (
            <React.Fragment key={i}>
              <span>{parseBoldText(part)}</span>
              {i < numBlanks && (
                hasOptions ? (
                  <select
                    id={`q-input-${question.id}${numBlanks > 1 ? `-${i}` : ""}`}
                    value={getSubAnswer(answer, i, numBlanks)}
                    onChange={(e) => onAnswer(updateSubAnswer(answer, i, e.target.value, numBlanks))}
                    className="inline-block w-28 sm:w-32 px-2 py-0.5 mx-1.5 text-xs md:text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003580]/25 focus:border-[#003580] transition-all bg-white font-semibold text-black align-middle h-7 cursor-pointer"
                  >
                    <option value="">— Select —</option>
                    {group.options!.map((opt, oIdx) => (
                      <option key={oIdx} value={opt}>
                        {getOptionLabel(opt)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <TextInput
                    id={`q-input-${question.id}${numBlanks > 1 ? `-${i}` : ""}`}
                    value={getSubAnswer(answer, i, numBlanks)}
                    onChange={(val) => onAnswer(updateSubAnswer(answer, i, val, numBlanks))}
                    inline
                  />
                )
              )}
            </React.Fragment>
          ))}
        </p>
      );
    }
    return (
      <>
        <p className="text-[15px] md:text-base text-gray-900 leading-relaxed font-medium whitespace-pre-wrap">{parseBoldText(text)}</p>
        <div className="mt-2 max-w-sm">
          {hasOptions ? (
            <select
              id={`q-input-${question.id}`}
              value={answer}
              onChange={(e) => onAnswer(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs md:text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003580]/25 focus:border-[#003580] transition-all bg-white font-semibold text-black animate-fadeIn"
            >
              <option value="">— Select —</option>
              {group.options!.map((opt, oIdx) => (
                <option key={oIdx} value={opt}>
                  {getOptionLabel(opt)}
                </option>
              ))}
            </select>
          ) : (
            <TextInput id={`q-input-${question.id}`} value={answer} onChange={onAnswer} placeholder="Enter answer..." />
          )}
        </div>
      </>
    );
  }

  /* MATCHING HEADINGS */
  if (type === "MATCHING_HEADINGS") {
    const opts = group.options ?? [];

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const optionText = e.dataTransfer.getData("text/plain");
      if (optionText) {
        onAnswer(optionText);
      }
    };

    const isAnswered = !!answer;

    return (
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`grid gap-2 rounded-md border p-2.5 transition-colors sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center ${
          isAnswered ? "border-[#003580]/30 bg-[#003580]/5" : "border-gray-200 bg-white"
        }`}
      >
        <div className="text-[15px] md:text-base font-medium leading-relaxed text-gray-900">
          <HighlightableText text={cleanQuestionText(question.questionText, question.questionNumber)} />
        </div>
        {opts.length > 0 ? (
          <select
            id={`q-input-${question.id}`}
            aria-label={`Select heading for question ${question.questionNumber}`}
            value={answer}
            onChange={(e) => onAnswer(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs md:text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003580]/25 focus:border-[#003580] transition-all bg-white font-semibold text-black cursor-pointer"
          >
            <option value="">— Select —</option>
            {opts.map((opt, i) => {
              const optionLabel = getOptionLabel(opt);
              const hasLabel = optionLabel !== opt;
              const displayLabel = /^[IVXLCDM]+$/.test(optionLabel) ? optionLabel.toLowerCase() : optionLabel;
              const optionText = hasLabel
                ? opt.replace(new RegExp(`^${optionLabel}(\\s+|\\.|\\))`, "i"), "")
                : opt;
              return (
                <option key={i} value={opt}>
                  {hasLabel ? `${displayLabel} — ${optionText}` : optionText}
                </option>
              );
            })}
          </select>
        ) : (
          <input
            id={`q-input-${question.id}`}
            type="text"
            placeholder="i, ii, iii..."
            value={answer}
            onChange={(e) => onAnswer(e.target.value)}
            className="h-9 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20"
          />
        )}
      </div>
    );
  }

  /* FEATURES / SENTENCE ENDINGS / MATCHING INFORMATION */
  if (isNameMatchingGroup(group)) {
    const opts = group.options ?? [];
    return (
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-center">
        <div className="text-[15px] md:text-base font-medium leading-relaxed text-gray-900">
          <HighlightableText text={cleanQuestionText(question.questionText, question.questionNumber)} />
        </div>
        <MatchingSelect opts={opts} answer={answer} onAnswer={onAnswer} />
      </div>
    );
  }

  if (type === "MATCHING_INFORMATION") {
    const opts = group.options ?? [];
    return (
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-center">
        <div className="text-[15px] md:text-base font-medium leading-relaxed text-gray-900">
          <HighlightableText text={cleanQuestionText(question.questionText, question.questionNumber)} />
        </div>
        <select
          id={`q-input-${question.id}`}
          aria-label={`Select paragraph for question ${question.questionNumber}`}
          value={answer}
          onChange={(event) => onAnswer(event.target.value)}
          className="w-full px-2.5 py-1.5 text-xs md:text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003580]/25 focus:border-[#003580] transition-all bg-white font-semibold text-black cursor-pointer"
        >
          <option value="">— Select —</option>
          {opts.map((option, index) => (
            <option key={index} value={option}>{getOptionLabel(option)}</option>
          ))}
        </select>
      </div>
    );
  }

  if (
    type === "MATCHING_FEATURES" ||
    type === "MATCHING_SENTENCE_ENDINGS"
  ) {
    const opts = group.options ?? [];
    return (
      <>
        <HighlightableText text={question.questionText ?? ""} />
        <MatchingSelect opts={opts} answer={answer} onAnswer={onAnswer} />
      </>
    );
  }

  /* SHORT ANSWER / DIAGRAM LABEL */
  const isDiagramLabel = type === "DIAGRAM_LABELLING";
  const isShortAnswer = type === "SHORT_ANSWER";
  const cleanText = cleanQuestionText(question.questionText ?? "", question.questionNumber);
  return (
    <div className="flex flex-wrap items-center gap-2 py-1 select-text">
      {cleanText && (
        <span className="text-[15px] md:text-base text-gray-900 font-medium leading-relaxed">
          <HighlightableText text={cleanText} />
        </span>
      )}
      <input
        type="text"
        id={`q-input-${question.id}`}
        value={answer}
        onChange={(e) => onAnswer(e.target.value)}
        className="w-32 h-7 px-2.5 border border-gray-300 rounded focus:border-[#003580] focus:outline-none bg-white font-medium text-black text-[13px] ml-1 shrink-0"
        placeholder={isDiagramLabel ? "Enter label" : isShortAnswer ? "Enter answer" : "Enter answer"}
      />
    </div>
  );
}

// ─── Table Completion Parser & Renderer ──────────────────────────────────────

function parseMarkdownTable(markdown: string): string[][] {
  if (!markdown || !markdown.trim()) return [];
  const lines = markdown.trim().split("\n");
  const tableRows: string[][] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let cells: string[] = [];
    if (trimmed.includes("|")) {
      let content = trimmed;
      if (content.startsWith("|")) content = content.slice(1);
      if (content.endsWith("|")) content = content.slice(0, -1);
      cells = content.split("|").map((cell) => cell.trim());
      const isSeparator = cells.every((cell) => /^[-:\s]+$/.test(cell));
      if (isSeparator) continue;
    } else if (trimmed.includes("\t")) {
      cells = trimmed.split("\t").map((cell) => cell.trim());
    } else {
      cells = [trimmed];
    }

    if (cells.length > 0) {
      tableRows.push(cells);
    }
  }
  return tableRows;
}

function renderTableCellContent(
  text: string,
  questions: IQuestion[],
  answers: Record<string, string>,
  onAnswer: (qId: string, value: string) => void,
  options?: string[],
  notesStyle = false
) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <>
      {parts.map((part, index) => {
        const match = part.match(/^\[(\d+)\]$/);
        if (match) {
          const qNum = parseInt(match[1], 10);
          const q = questions.find((item) => item.questionNumber === qNum);
          if (q) {
            return (
              <span key={index} className="inline-flex items-end gap-1 mx-1 align-baseline">
                <QuestionNumberBadge number={qNum} />
                {options && options.length > 0 ? (
                  <select
                    id={`q-input-${q.id}`}
                    value={answers[q.id] ?? ""}
                    onChange={(e) => onAnswer(q.id, e.target.value)}
                    className="w-28 sm:w-32 px-1.5 py-0.5 text-xs md:text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003580]/25 focus:border-[#003580] transition-all bg-white font-semibold text-black cursor-pointer"
                  >
                    <option value="">— Select —</option>
                    {options.map((opt, oIdx) => (
                      <option key={oIdx} value={opt}>
                        {getOptionLabel(opt)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`q-input-${q.id}`}
                    aria-label={`Answer for question ${q.questionNumber}`}
                    type="text"
                    value={answers[q.id] ?? ""}
                    onChange={(e) => onAnswer(q.id, e.target.value)}
                    className={notesStyle
                      ? "h-7 w-28 border-0 border-b border-dotted border-black bg-transparent px-1 text-sm font-semibold text-black outline-none focus:border-b-2"
                      : "w-28 px-2 py-0.5 text-xs border border-gray-300 rounded focus:border-[#003580] focus:outline-none bg-white font-semibold text-black"}
                  />
                )}
              </span>
            );
          }
        }
        return <span key={index}>{parseBoldText(part)}</span>;
      })}
    </>
  );
}

function renderInteractiveText(
  text: string,
  questions: IQuestion[],
  answers: Record<string, string>,
  onAnswer: (qId: string, value: string) => void,
  options?: string[],
  groupType?: string
) {
  const parts = text.split(/(\[\s*\d*\s*\](?:\s*\.{3,}|\s*_{2,})?|\b\d+\s*(?:\.{3,}|_{2,}))/g);
  let unnumberedIdx = 0;
  return (
    <div className="text-[15px] md:text-base text-gray-900 leading-[2.2rem] font-medium whitespace-pre-wrap select-text">
      {parts.map((part, index) => {
        const isBlank = /^(\[\s*\d*\s*\](?:\s*\.{3,}|\s*_{2,})?|\b\d+\s*(?:\.{3,}|_{2,}))$/.test(part);
        if (isBlank) {
          const numMatch = part.match(/\d+/);
          let q: IQuestion | undefined;
          let qNum: number | undefined;
          if (numMatch) {
            qNum = parseInt(numMatch[0], 10);
            q = questions.find((item) => item.questionNumber === qNum);
          } else {
            q = questions[unnumberedIdx++];
            qNum = q?.questionNumber;
          }
          if (q) {
            const answered = !!(answers[q.id]?.trim());
            const rawAns = answers[q.id] ?? "";

            const isWithOptions = groupType !== "SUMMARY_COMPLETION_WITHOUT_OPTIONS" && options && options.length > 0;

            if (isWithOptions) {
              const matchedOpt = options.find((opt) => {
                const lbl = getOptionLabel(opt);
                return (
                  lbl.toUpperCase() === rawAns.trim().toUpperCase() ||
                  opt.trim().toLowerCase() === rawAns.trim().toLowerCase()
                );
              });
              const selectedVal = matchedOpt ? getOptionLabel(matchedOpt) : rawAns;

              return (
                <span key={index} className="inline-flex items-center gap-1.5 mx-1.5 my-0.5 align-middle select-none">
                  {qNum !== undefined && (
                    <QuestionNumberBadge number={qNum} />
                  )}
                  <span className="inline-flex items-center gap-1">
                    <select
                      id={`q-input-${q.id}`}
                      aria-label={`Select answer for question ${q.questionNumber}`}
                      value={selectedVal}
                      onChange={(e) => onAnswer(q.id, e.target.value)}
                      className="inline-block w-32 sm:w-36 px-2 py-1 text-xs md:text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003580]/25 focus:border-[#003580] transition-all bg-white font-semibold text-gray-900 align-middle h-8 cursor-pointer shadow-2xs hover:border-gray-400"
                    >
                      <option value="">— Select —</option>
                      {options.map((opt, oIdx) => {
                        const lbl = getOptionLabel(opt);
                        const hasLbl = lbl !== opt;
                        const txt = hasLbl ? opt.replace(new RegExp(`^${lbl}(\\s+|\\.|\\))`, 'i'), '').trim() : opt;
                        const displayLbl = hasLbl ? lbl : String.fromCharCode(65 + oIdx);
                        return (
                          <option key={oIdx} value={displayLbl}>
                            {displayLbl} {txt ? `— ${txt}` : ""}
                          </option>
                        );
                      })}
                    </select>
                    {answered && (
                      <button
                        type="button"
                        onClick={() => onAnswer(q.id, "")}
                        className="text-gray-400 hover:text-red-500 font-bold text-xs cursor-pointer px-0.5"
                        title="Clear answer"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                </span>
              );
            }

            // Authentic IELTS Summary Blank Box (Without Clues / Direct Text Input)
            return (
              <span key={index} className="inline-flex items-center gap-1.5 mx-1.5 my-0.5 align-baseline select-none">
                {qNum !== undefined && (
                  <QuestionNumberBadge number={qNum} />
                )}
                <input
                  type="text"
                  id={`q-input-${q.id}`}
                  aria-label={`Answer for question ${q.questionNumber}`}
                  value={rawAns}
                  onChange={(e) => onAnswer(q.id, e.target.value)}
                  className={`inline-block w-32 sm:w-40 md:w-48 px-3 py-0.5 text-[14px] md:text-[15px] border-2 rounded-md font-semibold text-gray-950 align-baseline h-8 transition-all shadow-2xs ${
                    answered
                      ? "border-[#003580] bg-blue-50/20 text-[#003580]"
                      : "border-gray-350 bg-white hover:border-gray-400 focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20"
                  }`}
                  placeholder=""
                />
                {answered && (
                  <button
                    type="button"
                    onClick={() => onAnswer(q.id, "")}
                    className="text-gray-400 hover:text-red-500 font-bold text-xs cursor-pointer px-0.5"
                    title="Clear answer"
                  >
                    ✕
                  </button>
                )}
              </span>
            );
          }
        }
        return <span key={index}>{parseBoldText(part)}</span>;
      })}
    </div>
  );
}

function TableCompletion({
  group,
  answers,
  onAnswer,
}: {
  group: IQuestionGroup;
  answers: Record<string, string>;
  onAnswer: (qId: string, value: string) => void;
}) {
  const tableMarkdown = group.passageSegment || "";
  const tableRows = parseMarkdownTable(tableMarkdown);

  if (tableRows.length < 2) {
    return (
      <div className="space-y-4">
        {group.questions.map((q) => (
          <div key={q.id} className="flex gap-3">
            <QuestionNumberBadge number={q.questionNumber} />
            <div className="flex-1">
              <p className="text-[15px] md:text-base text-gray-900 leading-relaxed font-medium">{parseBoldText(cleanQuestionText(q.questionText, q.questionNumber))}</p>
              <div className="mt-1 max-w-xs">
                <TextInput value={answers[q.id] ?? ""} onChange={(v) => onAnswer(q.id, v)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const headers = tableRows[0];
  const bodyRows = tableRows.slice(1);

  return (
    <div className="overflow-x-auto my-4 border border-gray-200 rounded-xl shadow-sm bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-left border-collapse">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-4 py-3 text-xs font-bold text-[#003580] uppercase tracking-wider border-r border-gray-200 last:border-r-0"
              >
                {parseBoldText(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {bodyRows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-50/55 transition-colors">
              {row.map((cell, cIdx) => (
                <td
                  key={cIdx}
                  className="px-4 py-3 text-[14px] md:text-[15px] text-gray-800 border-r border-gray-200 last:border-r-0 font-medium"
                >
                  {renderTableCellContent(cell, group.questions, answers, onAnswer, group.options)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Note Completion Parser & Renderer ──────────────────────────────────────

function NotesCompletion({
  group,
  answers,
  onAnswer,
}: {
  group: IQuestionGroup;
  answers: Record<string, string>;
  onAnswer: (qId: string, value: string) => void;
}) {
  const passageSegment = group.passageSegment || "";
  const items = React.useMemo(() => {
    const lines = passageSegment.split("\n");
    const parsedItems: {
      type: "title" | "heading" | "example" | "divider" | "note";
      text: string;
      indentLevel: number;
    }[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const leadingSpaces = line.match(/^\s*/)?.[0].length ?? 0;
      let indentLevel = 0;
      if (leadingSpaces >= 4) {
        indentLevel = 2;
      } else if (leadingSpaces >= 2) {
        indentLevel = 1;
      }

      if (trimmed === "---") {
        parsedItems.push({ type: "divider", text: "", indentLevel: 0 });
      } else if (trimmed.startsWith(">")) {
        parsedItems.push({ type: "example", text: trimmed.replace(/^>\s*/, ""), indentLevel: 0 });
      } else if (trimmed.startsWith("#")) {
        const hashCount = (trimmed.match(/^#+/) || ["#"])[0].length;
        const text = trimmed.replace(/^#+\s*/, "");
        parsedItems.push({
          type: hashCount <= 3 ? "title" : "heading",
          text,
          indentLevel: 0,
        });
      } else if (trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.startsWith("+")) {
        const text = trimmed.replace(/^[-*+]\s*/, "");
        parsedItems.push({
          type: "note",
          text,
          indentLevel,
        });
      } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
        const text = trimmed.substring(2, trimmed.length - 2);
        parsedItems.push({
          type: "heading",
          text,
          indentLevel: 0,
        });
      } else {
        parsedItems.push({
          type: "note",
          text: trimmed,
          indentLevel,
        });
      }
    });

    return parsedItems;
  }, [passageSegment]);

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        {group.questions.map((q) => (
          <div key={q.id} className="flex gap-3">
            <QuestionNumberBadge number={q.questionNumber} />
            <div className="flex-grow">
              <p className="text-[15px] md:text-base text-gray-900 leading-relaxed font-medium">{parseBoldText(cleanQuestionText(q.questionText, q.questionNumber))}</p>
              <div className="mt-1 max-w-xs">
                <TextInput value={answers[q.id] ?? ""} onChange={(v) => onAnswer(q.id, v)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="my-4 border border-gray-700 bg-white p-5 md:p-7 max-w-3xl mx-auto font-[Arial,sans-serif] text-black">
      {items.map((item, idx) => {
        if (item.type === "title") {
          return (
            <h3 key={idx} className="mb-5 text-center text-base font-bold leading-snug select-none">
              {item.text}
            </h3>
          );
        }
        if (item.type === "heading") {
          return (
            <h4 key={idx} className="text-sm font-extrabold text-gray-900 mt-5 mb-2.5 first:mt-0 leading-tight">
              {item.text}
            </h4>
          );
        }
        if (item.type === "example") {
          return <p key={idx} className="my-3 text-sm italic">{parseBoldText(item.text)}</p>;
        }
        if (item.type === "divider") {
          return <hr key={idx} className="my-4 border-0 border-t border-gray-400" />;
        }

        return (
          <div
            key={idx}
            className="flex items-start gap-3 text-sm text-black leading-7 my-1"
            style={{ paddingLeft: `${item.indentLevel * 1.5}rem` }}
          >
            <span className="shrink-0 select-none font-bold">{item.indentLevel > 0 ? "–" : "•"}</span>
            <div className="flex-grow min-w-0">
              {renderTableCellContent(item.text, group.questions, answers, onAnswer, group.options, true)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Public group renderer ────────────────────────────────────────────────────

interface Props {
  group: IQuestionGroup;
  answers: Record<string, string>;
  onAnswer: (questionId: string, value: string) => void;
  hideReferenceBox?: boolean;
  referenceOnly?: boolean;
  hideHeaderBlock?: boolean;
}

export function QuestionRenderer({
  group,
  answers,
  onAnswer,
  hideReferenceBox = false,
  referenceOnly = false,
  hideHeaderBlock = false,
}: Props) {
  const isTable = group.type === "TABLE_COMPLETION";
  const isNotes = group.type === "NOTES_COMPLETION";
  const isMultiMCQ = group.type === "MULTIPLE_CHOICE_MULTIPLE";
  const isMatchingHeadings = group.type === "MATCHING_HEADINGS";
  const isNameMatching = isNameMatchingGroup(group);
  const isJSONSegment = !!(group.passageSegment && group.passageSegment.trim().startsWith("{"));
  const mhdgConfig = isMatchingHeadings ? parseMatchingHeadingsConfig(group.passageSegment) : null;
  const hasInteractiveSegment = !isJSONSegment && !!(
    group.passageSegment &&
    (/\[\d+\]/.test(group.passageSegment) || /\[\s*\]/.test(group.passageSegment) || /\b\d+\s*(?:\.{3,}|_{2,})/.test(group.passageSegment))
  );

  return (
    <div className="space-y-5">
      {/* IELTS standard header block (Range, Instructions, Heading) */}
      {!hideHeaderBlock && !hideReferenceBox && Boolean(group.instruction?.trim() || referenceOnly || group.questions.length > 1) && (() => {
        const parsed = parseGroupInstruction(group.instruction);
        const qStart = group.questions[0]?.questionNumber;
        const qEnd = group.questions[group.questions.length - 1]?.questionNumber;
        const calculatedRange = qStart !== undefined && qEnd !== undefined
          ? (qStart === qEnd ? `Question ${qStart}` : `Questions ${qStart}–${qEnd}`)
          : "";
        const finalRange = (group.questions.length > 1 && calculatedRange)
          ? calculatedRange
          : (parsed.range.trim() || calculatedRange);
        const finalHeading = parsed.heading || (
          group.passageSegment &&
          !isJSONSegment &&
          group.type !== "MATCHING_INFORMATION" &&
          !group.passageSegment.includes("[") &&
          !group.passageSegment.includes("|") &&
          !isNotes ? group.passageSegment : ""
        );
        
        // Display question range header whenever a range is available
        const showRange = !!finalRange;
        
        return (
          <div className="mb-4 space-y-2 rounded-md border border-slate-200 bg-slate-50/70 px-4 py-3 select-text">
            {showRange && (
              <h2 className="text-base md:text-lg font-bold text-gray-900 leading-tight">
                {parseBoldText(finalRange)}
              </h2>
            )}
            {isMatchingHeadings && !hideReferenceBox && mhdgConfig?.introText && (
              <p className="pt-2 text-xs font-medium leading-relaxed text-gray-700 md:text-sm">
                {parseBoldText(mhdgConfig.introText)}
              </p>
            )}
            {group.type === "MATCHING_INFORMATION" && group.passageSegment && (
              <p className="pt-1 text-xs font-medium leading-relaxed text-gray-700 md:text-sm">
                {parseBoldText(group.passageSegment)}
              </p>
            )}
            {parsed.inst1 && (
              <p className="text-xs md:text-sm text-gray-650 italic font-medium leading-relaxed">
                {parseBoldText(parsed.inst1)}
              </p>
            )}
            {parsed.inst2 && (
              <p className="text-xs md:text-sm text-gray-650 italic font-medium leading-relaxed">
                {parseBoldText(parsed.inst2)}
              </p>
            )}
            {parsed.inst3 && (
              <p className="text-xs md:text-sm text-gray-650 italic font-medium leading-relaxed">
                {parseBoldText(parsed.inst3)}
              </p>
            )}
            {parsed.listItems && parsed.listItems.length > 0 && (
              <div className={group.type === "MATCHING_INFORMATION"
                ? "mt-2 max-w-2xl space-y-1 select-text"
                : "mt-2 max-w-2xl space-y-1.5 rounded border border-slate-200 bg-white/80 p-3 select-text"
              }>
                {parsed.listItems.map((item, itemIdx) => {
                  const firstWordMatch = item.match(/^(TRUE|FALSE|NOT GIVEN|YES|NO|NB|TRUE\/FALSE\/NOT GIVEN|YES\/NO\/NOT GIVEN|[A-G])\s+(.*)$/i);
                  if (firstWordMatch) {
                    if (firstWordMatch[1].toUpperCase() === "NB") {
                      return (
                        <p key={itemIdx} className="text-xs leading-relaxed text-black md:text-sm">
                          <span className="mr-2 font-extrabold italic">NB</span>
                          <span className="italic text-black">{parseBoldText(firstWordMatch[2])}</span>
                        </p>
                      );
                    }
                    return (
                      <div key={itemIdx} className="text-xs md:text-sm text-gray-700 leading-relaxed flex gap-2 font-medium">
                        <span className="font-extrabold text-black shrink-0 w-24 uppercase">{firstWordMatch[1]}</span>
                        <span className="italic text-gray-600">{parseBoldText(firstWordMatch[2])}</span>
                      </div>
                    );
                  }
                  return (
                    <div key={itemIdx} className="text-xs md:text-sm text-gray-650 italic font-medium leading-relaxed">
                      {parseBoldText(item)}
                    </div>
                  );
                })}
              </div>
            )}
            {finalHeading && (
              <h3 className="text-center font-bold text-base md:text-lg text-gray-900 my-4 block select-text">
                {parseBoldText(finalHeading)}
              </h3>
            )}
          </div>
        );
      })()}

      {/* Optional passage segment */}
      {group.passageSegment && !isTable && !isNotes && !isJSONSegment && hasInteractiveSegment && (
        <div className={
          group.type === "SUMMARY_COMPLETION" ||
          group.type === "SUMMARY_COMPLETION_WITH_OPTIONS" ||
          group.type === "SUMMARY_COMPLETION_WITHOUT_OPTIONS"
            ? "py-2 px-1 text-[15px] md:text-base text-gray-900 leading-[2.2rem] font-medium"
            : "p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-900 leading-relaxed"
        }>
          {renderInteractiveText(
            group.passageSegment,
            group.questions,
            answers,
            onAnswer,
            group.type === "SUMMARY_COMPLETION_WITHOUT_OPTIONS" ? undefined : group.options,
            group.type
          )}
        </div>
      )}

      {/* Authentic IELTS Options Box for Summary Completion With Options */}
      {!hideReferenceBox && group.type === "SUMMARY_COMPLETION_WITH_OPTIONS" && group.options && group.options.length > 0 && (
        <div className="my-5 border border-gray-300 rounded-lg bg-white p-4 sm:p-5 select-none shadow-xs">
          <p className="mb-3 text-xs font-semibold text-gray-500 italic select-none">
            💡 Options list for the blanks above. Options you select will automatically blur below.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2.5">
            {group.options.map((opt, idx) => {
              const label = getOptionLabel(opt);
              const hasLabel = label !== opt;
              const optText = hasLabel ? opt.replace(new RegExp(`^${label}(\\s+|\\.|\\))`, 'i'), '').trim() : opt;
              const displayLabel = hasLabel ? label : String.fromCharCode(65 + idx);
              
              // Check if already assigned
              const isAssigned = Object.values(answers).some((ans) => {
                const a = (ans || "").trim().toUpperCase();
                return a === displayLabel.toUpperCase() || a === opt.trim().toUpperCase() || a === optText.trim().toUpperCase();
              });

              return (
                <div
                  key={idx}
                  className={`flex items-baseline gap-3 text-[14px] md:text-[15px] leading-relaxed px-3 py-2 rounded-lg transition-all border ${
                    isAssigned
                      ? "bg-slate-100/90 border-slate-200 opacity-30 filter blur-[0.6px] line-through cursor-not-allowed select-none text-gray-400"
                      : "bg-white border-gray-250 shadow-2xs text-gray-900"
                  }`}
                  title={isAssigned ? `${displayLabel} is already selected` : undefined}
                >
                  <span className={`font-bold min-w-5 shrink-0 select-none ${isAssigned ? "text-gray-400" : "text-black"}`}>
                    {displayLabel}
                  </span>
                  <span className={isAssigned ? "text-gray-400 font-normal truncate" : "text-gray-900 font-normal truncate"}>
                    {parseBoldText(hasLabel ? optText : opt)}
                  </span>
                  {isAssigned && (
                    <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded shrink-0 no-underline not-italic">
                      ✓ Selected
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Render list of headings / features block for students to refer to */}
      {!hideReferenceBox && (group.type === "MATCHING_HEADINGS" ||
        group.type === "MATCHING_FEATURES") &&
        group.options &&
        group.options.length > 0 && (
          <div className={`p-5 rounded-xl shadow-sm my-4 ${
            group.type === "MATCHING_HEADINGS"
              ? "bg-slate-50 border border-slate-350"
              : "bg-white border border-gray-200"
          }`}>
            <h4 className={`font-extrabold text-sm pb-2 mb-3 tracking-wide uppercase border-b ${
              group.type === "MATCHING_HEADINGS"
                ? "text-slate-900 border-slate-200 text-center"
                : "text-[#003580] border-gray-100"
            }`}>
              {group.type === "MATCHING_HEADINGS"
                ? "List of Headings"
                : group.type === "MATCHING_FEATURES"
                ? isNameMatching ? "List of People" : "List of Features"
                : "Sentence Endings"}
            </h4>
            
            {group.type === "MATCHING_HEADINGS" ? (
              <div className="mx-auto max-w-2xl space-y-2.5">
                <p className="mb-2 text-center text-xs font-medium text-gray-500">
                  Select a heading from each paragraph&apos;s dropdown. You can also drag a heading onto a paragraph.
                </p>
                <div className="space-y-1.5">
                  {group.options.map((opt, idx) => {
                    const label = getOptionLabel(opt);
                    const hasLabel = label !== opt;
                    const optText = hasLabel ? opt.replace(new RegExp(`^${label}(\\s+|\\.|\\))`, 'i'), '') : opt;
                    
                    // Check if this option is already chosen in the answers record
                    const isAssigned = Object.values(answers).some(
                      (ans) => ans === opt || ans === label || ans === getOptionLabel(opt)
                    );

                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 px-3 py-1.5 transition-all select-none rounded ${
                          isAssigned
                            ? "opacity-30 filter blur-[0.6px] line-through bg-slate-100/80 text-gray-400 cursor-not-allowed"
                            : "hover:bg-white/80 cursor-default"
                        }`}
                        title={isAssigned ? "Already assigned to a paragraph" : undefined}
                      >
                        <div className="flex items-center gap-1 shrink-0">
                          {hasLabel ? (
                            <span className={`font-black text-xs min-w-[26px] text-center rounded px-1 py-0.5 shrink-0 ${
                              isAssigned
                                ? "bg-gray-100 text-gray-400 border border-gray-200"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                            }`}>
                              {label}
                            </span>
                          ) : (
                            <span className="text-[#003580] font-black shrink-0">•</span>
                          )}
                        </div>
                        <span className={`text-sm leading-relaxed font-medium ${
                          isAssigned ? "text-gray-400" : "text-gray-700"
                        }`}>
                          {parseBoldText(hasLabel ? optText : opt)}
                        </span>
                        {isAssigned && (
                          <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded shrink-0 no-underline not-italic">
                            ✓ Selected
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <ul className="space-y-3 text-sm pl-1">
                {group.options.map((opt, idx) => {
                  const label = getOptionLabel(opt);
                  const hasLabel = label !== opt;
                  const optText = hasLabel ? opt.replace(new RegExp(`^${label}(\\s+|\\.|\\))`, 'i'), '') : opt;
                  
                  const isAssigned = Object.values(answers).some((ans) => {
                    const a = (ans || "").trim().toUpperCase();
                    return a === label.toUpperCase() || a === opt.trim().toUpperCase() || a === optText.trim().toUpperCase();
                  });

                  return (
                    <li
                      key={idx}
                      className={`flex gap-4 items-start leading-relaxed text-gray-700 px-2 py-1 rounded transition-all ${
                        isAssigned
                          ? "opacity-30 filter blur-[0.6px] line-through bg-slate-100/80 text-gray-400 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {hasLabel ? (
                        <span className={`font-black text-xs min-w-[28px] text-center rounded px-1.5 py-0.5 shrink-0 select-none ${
                          isAssigned
                            ? "bg-gray-200 text-gray-400 border border-gray-300"
                            : "bg-indigo-50 text-[#003580] border border-indigo-100"
                        }`}>
                          {label}
                        </span>
                      ) : (
                        <span className="text-[#003580] font-black shrink-0 mt-0.5">•</span>
                      )}
                      <span className="whitespace-pre-wrap font-normal">
                        {parseBoldText(hasLabel ? optText : opt)}
                      </span>
                      {isAssigned && (
                        <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded shrink-0 no-underline not-italic">
                          ✓ Selected
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

      {/* Render Matching Headings Example Question (Real IELTS Exam system representation) */}
      {isMatchingHeadings && !hideReferenceBox && mhdgConfig && mhdgConfig.exampleParagraph && (
        <div className="p-4 border border-slate-200 bg-slate-50/70 rounded-xl max-w-md my-3 shadow-sm flex items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-14 shrink-0 items-center justify-center rounded bg-indigo-50 border border-indigo-100 text-[9px] font-black uppercase text-indigo-700 tracking-wider">
              Example
            </span>
            <span className="text-sm font-semibold text-gray-800">{mhdgConfig.exampleParagraph}</span>
          </div>
          {mhdgConfig.mode === "WITH_CLUES" ? (
            <select
              disabled
              value={mhdgConfig.exampleAnswer}
              className="w-32 px-2.5 py-1 text-xs md:text-[13px] border border-gray-200 rounded-lg bg-gray-100 font-semibold text-gray-500 cursor-not-allowed"
            >
              <option value={mhdgConfig.exampleAnswer}>{getOptionLabel(mhdgConfig.exampleAnswer)}</option>
            </select>
          ) : (
            <input
              type="text"
              disabled
              value={getOptionLabel(mhdgConfig.exampleAnswer)}
              className="w-16 px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100 font-semibold text-gray-500 text-center cursor-not-allowed"
            />
          )}
        </div>
      )}

      {/* Questions */}
      {referenceOnly ? null : isTable ? (
        <TableCompletion group={group} answers={answers} onAnswer={onAnswer} />
      ) : isNotes ? (
        <NotesCompletion group={group} answers={answers} onAnswer={onAnswer} />
      ) : group.type === "MATCHING_SENTENCE_ENDINGS" ? (
        <div className="space-y-5 font-[Arial,sans-serif] text-black">
          <div className="space-y-2">
            {group.questions.map((question) => (
              <div key={question.id} className="grid grid-cols-[2rem_minmax(0,1fr)_5rem] items-center gap-2 text-sm leading-6">
                <QuestionNumberBadge number={question.questionNumber} />
                <HighlightableText text={cleanQuestionText(question.questionText, question.questionNumber)} />
                <select
                  id={`q-input-${question.id}`}
                  aria-label={`Select ending for question ${question.questionNumber}`}
                  value={answers[question.id] ?? ""}
                  onChange={(event) => onAnswer(question.id, event.target.value)}
                  className="h-8 border border-gray-400 bg-white px-2 text-xs font-bold text-black outline-none focus:border-black"
                >
                  <option value="">—</option>
                  {(group.options ?? []).map((option, index) => {
                    const label = getOptionLabel(option) || String.fromCharCode(65 + index);
                    return <option key={index} value={option}>{label}</option>;
                  })}
                </select>
              </div>
            ))}
          </div>
          {!hideReferenceBox && <div className="mx-auto max-w-2xl border border-gray-700 bg-white px-4 py-3">
            <div className="space-y-1.5">
              {(group.options ?? []).map((option, index) => {
                const label = getOptionLabel(option) || String.fromCharCode(65 + index);
                const hasLabel = label !== option;
                const text = hasLabel
                  ? option.replace(new RegExp(`^${label}(\\s+|\\.|\\))`, "i"), "").trim()
                  : option;
                return (
                  <div key={index} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2 text-sm leading-6">
                    <span className="font-bold">{label}</span>
                    <span>{parseBoldText(text)}</span>
                  </div>
                );
              })}
            </div>
          </div>}
        </div>
      ) : isMultiMCQ ? (
        <div className="space-y-4 select-text pl-2">
          {/* Question Number Badges Row with selection status */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase text-gray-500 mr-1 select-none">Questions:</span>
            {group.questions.map((question) => (
              <span key={question.id} id={`q-input-${question.id}`}>
                <QuestionNumberBadge number={question.questionNumber} />
              </span>
            ))}
            <span className="ml-2 text-xs font-semibold text-gray-500 select-none">
              ({group.questions.filter((q) => !!answers[q.id]?.trim()).length} of {group.questions.length} selected)
            </span>
          </div>
          {/* Main prompt from the first question */}
          {group.questions[0]?.questionText && (
            <div className="flex items-start gap-2 text-[15px] md:text-base font-semibold text-gray-900 mb-3">
              <span className="text-gray-950 font-medium leading-relaxed">
                {parseBoldText(group.questions[0].questionText)}
              </span>
            </div>
          )}
          
          <div className="grid gap-2 pl-1 max-w-165">
            {(() => {
              const opts = group.questions[0]?.options ?? group.options ?? [];
                
              return opts.map((opt, oIdx) => {
                const cleanLabel = getOptionLabel(opt);
                const hasExplicitLabel = cleanLabel !== opt;
                const label = hasExplicitLabel ? cleanLabel : String.fromCharCode(65 + oIdx);
                const optText = hasExplicitLabel
                  ? opt.replace(new RegExp(`^${label}[\\s.:)-]+`, 'i'), '').trim()
                  : opt;

                const active = group.questions.some((q) => {
                  const ans = (answers[q.id] || "").trim().toLowerCase();
                  return (
                    ans === label.toLowerCase() ||
                    ans === opt.trim().toLowerCase() ||
                    ans === optText.trim().toLowerCase()
                  );
                });
                
                const handleToggle = () => {
                  if (active) {
                    const targetQ = group.questions.find((q) => {
                      const ans = (answers[q.id] || "").trim().toLowerCase();
                      return (
                        ans === label.toLowerCase() ||
                        ans === opt.trim().toLowerCase() ||
                        ans === optText.trim().toLowerCase()
                      );
                    });
                    if (targetQ) {
                      onAnswer(targetQ.id, "");
                    }
                  } else {
                    const emptyQ = group.questions.find((q) => !answers[q.id]?.trim());
                    if (emptyQ) {
                      onAnswer(emptyQ.id, label);
                    } else if (group.questions.length > 0) {
                      const lastQ = group.questions[group.questions.length - 1];
                      onAnswer(lastQ.id, label);
                    }
                  }
                };
                
                return (
                  <div
                    key={opt}
                    onClick={handleToggle}
                    className={`flex items-start gap-3 w-full py-2 px-3 transition-all text-left text-[14px] md:text-[15px] rounded-lg cursor-pointer border ${
                      active
                        ? "bg-[#003580]/5 border-[#003580] text-[#003580] font-bold shadow-2xs"
                        : "bg-white border-gray-200 text-gray-800 hover:border-gray-400 hover:bg-gray-50/50"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 shrink-0 mt-0.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black select-none ${
                        active ? "bg-[#003580] text-white" : "bg-gray-100 text-gray-800"
                      }`}>
                        {label}
                      </span>
                      <span className={`inline-flex w-4 h-4 rounded border items-center justify-center shrink-0 select-none ${
                        active ? "border-[#003580] bg-[#003580] text-white" : "border-gray-300 bg-white"
                      }`}>
                        {active && <span className="text-[10px] font-black leading-none">✓</span>}
                      </span>
                    </span>
                    <span className={`flex-grow leading-relaxed ${active ? "text-gray-950 font-semibold" : "text-gray-800 font-normal"}`}>
                      {parseBoldText(optText)}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      ) : hasInteractiveSegment ? (
        // Inline inputs rendered in passageSegment, no need to list questions below
        null
      ) : (
        group.questions.map((q) => {
          return (
            <div key={q.id} id={`q-input-${q.id}`} className="flex gap-3">
              <QuestionNumberBadge number={q.questionNumber} />
              <div className="flex-1 min-w-0">
                <SingleQuestion
                  group={group}
                  question={q}
                  answer={answers[q.id] ?? ""}
                  onAnswer={(v) => onAnswer(q.id, v)}
                />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
