"use client";

import { IListeningQuestion, IListeningQuestionGroup } from "@/types/listening.types";
import HighlightableText from "../Reading/HighlightableText";
import { parseBoldText, getOptionLabel } from "@/lib/utils";
import React from "react";

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

function parseMatchingHeadingsConfig(passageSegment?: string) {
  if (!passageSegment) {
    return { mode: "WITH_CLUES", exampleParagraph: "", exampleAnswer: "" };
  }
  try {
    const trimmed = passageSegment.trim();
    if (trimmed.startsWith("{")) {
      const parsed = JSON.parse(trimmed);
      return {
        mode: parsed.mode || "WITH_CLUES",
        exampleParagraph: parsed.exampleParagraph || "",
        exampleAnswer: parsed.exampleAnswer || ""
      };
    }
  } catch (e) {
    // fallback
  }
  return { mode: "WITH_CLUES", exampleParagraph: "", exampleAnswer: "" };
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
    <div className="mt-3 space-y-2 pl-2">
      {options.map((opt, i) => {
        const label = String.fromCharCode(65 + i); // A, B, C
        const active = answer.trim().toLowerCase() === opt.trim().toLowerCase();
        return (
          <div
            key={opt}
            onClick={() => onAnswer(opt)}
            className={`flex items-center gap-3 w-full max-w-md px-4 py-2 rounded-xl border text-left text-sm transition-all duration-150 cursor-pointer ${
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
              <span className={`inline-flex w-4 h-4 rounded-full border shrink-0 items-center justify-center select-none ${
                active ? "border-[#003580]" : "border-gray-300"
              }`}>
                {active && <span className="w-2.5 h-2.5 rounded-full bg-[#003580]" />}
              </span>
              <span className="font-semibold text-gray-800">{parseBoldText(opt)}</span>
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
        className="inline-block w-32 px-2 py-0.5 mx-1 text-sm border border-gray-300 rounded focus:border-[#003580] focus:outline-none bg-white text-center align-baseline h-7 font-semibold text-black"
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
      className="w-full px-3.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003580]/25 focus:border-[#003580] transition-all bg-white font-semibold text-black"
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
    <div className="mt-3 space-y-2 pl-7 md:pl-8 max-w-[650px]">
      {opts.map((opt, i) => {
        const label = String.fromCharCode(65 + i);
        const active = answer === opt;
        return (
          <div
            key={opt}
            onClick={() => onAnswer(opt)}
            className={`flex items-center gap-3 w-full py-1.5 px-2.5 transition-all text-left text-sm md:text-[15px] rounded-lg font-medium cursor-pointer ${
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
              <span className={`inline-flex w-4 h-4 rounded-full border items-center justify-center shrink-0 select-none ${
                active ? "border-[#1B3A6B]" : "border-gray-300"
              }`}>
                {active && <span className="w-2.5 h-2.5 rounded-full bg-[#1B3A6B]" />}
              </span>
            </span>
            <span className={`flex-grow leading-relaxed ${active ? "text-gray-900 font-bold" : "text-gray-700 font-medium"}`}>
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
      className="mt-2 w-full max-w-md px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003580]/25 focus:border-[#003580] transition-all bg-white font-semibold text-black"
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
  group: IListeningQuestionGroup;
  question: IListeningQuestion;
  answer: string;
  onAnswer: (v: string) => void;
}) {
  const type = group.type;

  /* TRUE / FALSE / NOT GIVEN */
  if (type === "TRUE_FALSE_NOT_GIVEN") {
    return (
      <>
        <HighlightableText text={question.questionText ?? ""} />
        <TFNGButtons options={["TRUE", "FALSE", "NOT GIVEN"]} answer={answer} onAnswer={onAnswer} />
      </>
    );
  }

  /* YES / NO / NOT GIVEN */
  if (type === "YES_NO_NOT_GIVEN") {
    return (
      <>
        <HighlightableText text={question.questionText ?? ""} />
        <TFNGButtons options={["YES", "NO", "NOT GIVEN"]} answer={answer} onAnswer={onAnswer} />
      </>
    );
  }

  /* MULTIPLE CHOICE */
  if (type === "MULTIPLE_CHOICE") {
    const opts = question.options ?? group.options ?? [];
    return (
      <>
        <HighlightableText text={question.questionText ?? ""} />
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
    const text = question.questionText ?? "";
    const parts = text.split(/_{2,}/);
    const hasOptions = group.options && group.options.length > 0;

    if (parts.length > 1) {
      return (
        <p className="text-sm text-gray-650 leading-relaxed flex flex-wrap items-baseline gap-0.5 font-normal">
          {parts.map((part, i) => (
            <span key={i}>
              {parseBoldText(part)}
              {i < parts.length - 1 && (
                hasOptions ? (
                  <select
                    id={`q-input-${question.id}`}
                    value={answer}
                    onChange={(e) => onAnswer(e.target.value)}
                    className="inline-block w-32 px-1 py-0.5 mx-1 text-sm border border-gray-300 rounded focus:border-[#003580] focus:outline-none bg-white font-semibold text-black"
                  >
                    <option value="">—</option>
                    {group.options!.map((opt, oIdx) => (
                      <option key={oIdx} value={opt}>
                        {getOptionLabel(opt)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <TextInput id={`q-input-${question.id}`} value={answer} onChange={onAnswer} inline />
                )
              )}
            </span>
          ))}
        </p>
      );
    }
    return (
      <>
        <p className="text-sm text-gray-650 leading-relaxed font-normal whitespace-pre-wrap">{parseBoldText(text)}</p>
        <div className="mt-2 max-w-md">
          {hasOptions ? (
            <select
              id={`q-input-${question.id}`}
              value={answer}
              onChange={(e) => onAnswer(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003580]/25 focus:border-[#003580] transition-all bg-white font-semibold text-black"
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
    const config = parseMatchingHeadingsConfig(group.passageSegment);
    const isWithoutClues = config.mode === "WITHOUT_CLUES";

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const optionText = e.dataTransfer.getData("text/plain");
      if (optionText) {
        if (isWithoutClues) {
          onAnswer(getOptionLabel(optionText));
        } else {
          onAnswer(optionText);
        }
      }
    };

    const isAnswered = !!answer;
    const label = getOptionLabel(answer);
    const answerText = isWithoutClues 
      ? answer 
      : answer.replace(new RegExp(`^${label}(\\s+|\\.|\\))`, 'i'), '');

    return (
      <div className="space-y-2">
        <div className="text-sm text-gray-650 font-normal leading-relaxed">
          <HighlightableText text={question.questionText ?? ""} />
        </div>
        
        {isAnswered ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="w-full max-w-md border border-indigo-200 bg-indigo-50 text-indigo-950 rounded-xl px-3 py-2 flex items-center justify-between gap-3 font-semibold shadow-sm animate-fadeIn"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-indigo-800 bg-indigo-100 border border-indigo-200 font-black text-xs rounded px-1.5 py-0.5 shrink-0 select-none">
                {label}
              </span>
              {!isWithoutClues && (
                <span className="text-xs truncate font-medium text-gray-700">
                  {answerText}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onAnswer("")}
              className="text-gray-400 hover:text-red-500 font-bold text-sm h-5 w-5 flex items-center justify-center rounded-full hover:bg-red-50 transition"
              title="Clear selection"
            >
              ×
            </button>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="w-full max-w-md border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all flex items-center justify-between px-3 py-1.5 group cursor-pointer"
          >
            <span className="text-[11px] font-semibold text-gray-400 group-hover:text-indigo-600">
              Drag option here or select:
            </span>
            {isWithoutClues ? (
              <input
                type="text"
                placeholder="A, B, C..."
                value={answer}
                onChange={(e) => onAnswer(e.target.value)}
                className="w-16 text-center text-xs bg-white border border-gray-250 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-black"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <select
                value={answer}
                onChange={(e) => onAnswer(e.target.value)}
                className="text-xs bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-black cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">— Select —</option>
                {opts.map((opt, i) => (
                  <option key={i} value={opt}>
                    {getOptionLabel(opt)}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>
    );
  }

  /* FEATURES / SENTENCE ENDINGS / MATCHING INFORMATION */
  if (
    type === "MATCHING_FEATURES" ||
    type === "MATCHING_SENTENCE_ENDINGS" ||
    type === "MATCHING_INFORMATION"
  ) {
    const opts = group.options ?? [];
    return (
      <div className="flex items-center justify-between gap-4 py-1.5 border-b border-gray-100 last:border-b-0 max-w-2xl select-text">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900 shrink-0 select-none">
            {question.questionNumber}.
          </span>
          {question.questionText && (
            <span className="text-sm text-gray-800 font-semibold leading-relaxed">
              <HighlightableText text={question.questionText} />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            id={`q-input-${question.id}`}
            value={answer}
            onChange={(e) => onAnswer(e.target.value)}
            className="w-40 h-8 px-2 border border-gray-300 rounded text-xs font-semibold text-black bg-white focus:outline-none focus:border-[#1B3A6B]"
          >
            <option value="">— Select —</option>
            {opts.map((opt, i) => (
              <option key={i} value={opt}>
                {getOptionLabel(opt)}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  /* SHORT ANSWER (default) */
  const cleanText = (question.questionText ?? "").replace(new RegExp(`^\\s*${question.questionNumber}\\s*(\\.\\s*|\\s+)`, 'i'), '');
  return (
    <div className="flex items-center gap-2 py-1 select-text">
      <span className="text-sm font-bold text-gray-900 shrink-0 select-none">
        {question.questionNumber}.
      </span>
      {cleanText && (
        <span className="text-sm text-gray-800 font-semibold leading-relaxed">
          <HighlightableText text={cleanText} />
        </span>
      )}
      <input
        type="text"
        id={`q-input-${question.id}`}
        value={answer}
        onChange={(e) => onAnswer(e.target.value)}
        className="w-32 h-8 px-2.5 border border-gray-300 rounded focus:border-[#003580] focus:outline-none bg-white font-semibold text-black text-sm ml-1 shrink-0"
        placeholder=""
      />
    </div>
  );
}

// ─── Table Completion Parser & Renderer ──────────────────────────────────────

function parseMarkdownTable(markdown: string) {
  const lines = markdown.trim().split("\n");
  const tableRows: string[][] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());

      const isSeparator = cells.every((cell) => /^[-:\s]+$/.test(cell));
      if (!isSeparator) {
        tableRows.push(cells);
      }
    }
  }
  return tableRows;
}

function renderTableCellContent(
  text: string,
  questions: IListeningQuestion[],
  answers: Record<string, string>,
  onAnswer: (qId: string, value: string) => void,
  options?: string[]
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
            const answered = !!(answers[q.id]?.trim());
            return (
              <span key={index} className="inline-flex items-center gap-1.5 mx-1 my-0.5 align-middle">
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold shrink-0 ${
                  answered ? "bg-[#003580] text-white" : "bg-gray-200 text-gray-700"
                }`}>
                  {qNum}
                </span>
                {options && options.length > 0 ? (
                  <select
                    id={`q-input-${q.id}`}
                    value={answers[q.id] ?? ""}
                    onChange={(e) => onAnswer(q.id, e.target.value)}
                    className="w-28 px-1 py-0.5 text-xs border border-gray-300 rounded focus:border-[#003580] focus:outline-none bg-white font-semibold text-black"
                  >
                    <option value="">—</option>
                    {options.map((opt, oIdx) => (
                      <option key={oIdx} value={opt}>
                        {getOptionLabel(opt)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={answers[q.id] ?? ""}
                    onChange={(e) => onAnswer(q.id, e.target.value)}
                    className="w-28 px-2 py-0.5 text-xs border border-gray-300 rounded focus:border-[#003580] focus:outline-none bg-white font-semibold text-black"
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
  questions: IListeningQuestion[],
  answers: Record<string, string>,
  onAnswer: (qId: string, value: string) => void,
  options?: string[]
) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <div className="text-sm text-gray-650 leading-relaxed font-normal whitespace-pre-wrap">
      {parts.map((part, index) => {
        const match = part.match(/^\[(\d+)\]$/);
        if (match) {
          const qNum = parseInt(match[1], 10);
          const q = questions.find((item) => item.questionNumber === qNum);
          if (q) {
            const answered = !!(answers[q.id]?.trim());
            return (
              <span key={index} className="inline-flex items-center gap-1.5 mx-1 my-0.5 align-middle">
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold shrink-0 ${
                  answered ? "bg-[#003580] text-white" : "bg-gray-200 text-gray-700"
                }`}>
                  {qNum}
                </span>
                {options && options.length > 0 ? (
                  <select
                    id={`q-input-${q.id}`}
                    value={answers[q.id] ?? ""}
                    onChange={(e) => onAnswer(q.id, e.target.value)}
                    className="w-28 px-1 py-0.5 text-xs border border-gray-300 rounded focus:border-[#003580] focus:outline-none bg-white font-semibold text-black"
                  >
                    <option value="">—</option>
                    {options.map((opt, oIdx) => (
                      <option key={oIdx} value={opt}>
                        {getOptionLabel(opt)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    id={`q-input-${q.id}`}
                    value={answers[q.id] ?? ""}
                    onChange={(e) => onAnswer(q.id, e.target.value)}
                    className="w-28 px-2 py-0.5 text-xs border border-gray-300 rounded focus:border-[#003580] focus:outline-none bg-white font-semibold text-black"
                  />
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
  group: IListeningQuestionGroup;
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
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold bg-[#003580]/15 text-[#003580]">
              {q.questionNumber}
            </span>
            <div className="flex-1">
              <p className="text-sm text-gray-650 leading-relaxed font-normal">{q.questionText}</p>
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
                {h}
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
                  className="px-4 py-3 text-sm text-gray-650 border-r border-gray-200 last:border-r-0 font-normal"
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
  group: IListeningQuestionGroup;
  answers: Record<string, string>;
  onAnswer: (qId: string, value: string) => void;
}) {
  const passageSegment = group.passageSegment || "";
  const items = React.useMemo(() => {
    const lines = passageSegment.split("\n");
    const parsedItems: {
      type: "title" | "heading" | "note";
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

      if (trimmed.startsWith("#")) {
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
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold bg-[#003580]/15 text-[#003580]">
              {q.questionNumber}
            </span>
            <div className="flex-1">
              <p className="text-sm text-gray-650 leading-relaxed font-normal">{q.questionText}</p>
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
    <div className="my-4 border border-gray-250 bg-white rounded-2xl p-6 md:p-8 max-w-2xl mx-auto shadow-sm border-t-4 border-t-[#003580] animate-fadeIn">
      {items.map((item, idx) => {
        if (item.type === "title") {
          return (
            <h3 key={idx} className="text-base font-black text-[#003580] text-center mb-6 tracking-wide uppercase leading-snug border-b border-gray-100 pb-3 select-none">
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

        return (
          <div
            key={idx}
            className="flex items-start gap-2 text-sm text-gray-700 font-normal leading-relaxed my-1.5"
            style={{ paddingLeft: `${item.indentLevel * 1.5}rem` }}
          >
            <span className="text-gray-400 shrink-0 select-none mt-1.5 text-[8px]">•</span>
            <div className="flex-grow min-w-0">
              {renderTableCellContent(item.text, group.questions, answers, onAnswer, group.options)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Public group renderer ────────────────────────────────────────────────────

interface Props {
  group: IListeningQuestionGroup;
  answers: Record<string, string>;
  onAnswer: (questionId: string, value: string) => void;
  hideReferenceBox?: boolean;
}

export function ListeningQuestionRenderer({ group, answers, onAnswer, hideReferenceBox = false }: Props) {
  const isTable = group.type === "TABLE_COMPLETION";
  const isNotes = group.type === "NOTES_COMPLETION";
  const isMatchingHeadings = group.type === "MATCHING_HEADINGS";
  const isJSONSegment = !!(group.passageSegment && group.passageSegment.trim().startsWith("{"));
  const hasInteractiveSegment = !isJSONSegment && !!(group.passageSegment && /\[\d+\]/.test(group.passageSegment));

  return (
    <div className="space-y-5">
      {/* IELTS standard header block (Range, Instructions, Heading) */}
      {(() => {
        const parsed = parseGroupInstruction(group.instruction);
        const finalRange = parsed.range || (group.questions.length > 0 ? (
          group.questions[0].questionNumber === group.questions[group.questions.length - 1].questionNumber
            ? `Question ${group.questions[0].questionNumber}`
            : `Questions ${group.questions[0].questionNumber}–${group.questions[group.questions.length - 1].questionNumber}`
        ) : "");
        const finalHeading = parsed.heading || (
          group.passageSegment &&
          !group.passageSegment.includes("[") &&
          !group.passageSegment.includes("|") &&
          !isNotes ? group.passageSegment : ""
        );
        return (
          <div className="space-y-1.5 select-text mb-4">
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

      {/* Image Renderer (Diagram / Map labeling etc) */}
      {group.imageUrl && (
        <div className="w-full flex items-center justify-center p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <img
            src={group.imageUrl}
            alt="Listening section diagram"
            className="max-w-full max-h-[350px] rounded-lg object-contain"
          />
        </div>
      )}

      {/* Optional passage segment */}
      {group.passageSegment && !isTable && !isNotes && !isJSONSegment && hasInteractiveSegment && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-900 leading-relaxed">
          {renderInteractiveText(group.passageSegment, group.questions, answers, onAnswer, group.options)}
        </div>
      )}

      {/* Render list of options block for students to refer to */}
      {!hideReferenceBox && (group.type === "MATCHING_HEADINGS" ||
        group.type === "MATCHING_FEATURES" ||
        group.type === "MATCHING_SENTENCE_ENDINGS" ||
        group.type === "MATCHING_INFORMATION" ||
        group.type === "SUMMARY_COMPLETION_WITH_OPTIONS") &&
        group.options &&
        group.options.length > 0 && (
          <div className={`p-5 rounded-xl shadow-sm my-4 ${
            group.type === "MATCHING_HEADINGS"
              ? "bg-slate-50 border border-slate-200"
              : "bg-white border border-gray-200"
          }`}>
            <h4 className={`font-extrabold text-sm pb-2 mb-3 tracking-wide uppercase border-b ${
              group.type === "MATCHING_HEADINGS"
                ? "text-slate-900 border-slate-250 text-center"
                : "text-[#003580] border-gray-100"
            }`}>
              {group.type === "MATCHING_HEADINGS"
                ? "Matching Options"
                : group.type === "MATCHING_FEATURES"
                ? "List of Features"
                : group.type === "MATCHING_INFORMATION"
                ? "Matching Info List"
                : group.type === "MATCHING_SENTENCE_ENDINGS"
                ? "Sentence Endings"
                : "Options List"}
            </h4>
            
            {group.type === "MATCHING_HEADINGS" ? (
              <div className="space-y-2.5 max-w-xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span>Drag options below to the correct questions or select from inputs:</span>
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {group.options.map((opt, idx) => {
                    const label = getOptionLabel(opt);
                    const hasLabel = label !== opt;
                    const optText = hasLabel ? opt.replace(new RegExp(`^${label}(\\s+|\\.|\\))`, 'i'), '') : opt;
                    
                    // Check if assigned
                    const isAssigned = Object.values(answers).some(
                      (ans) => ans === opt || ans === label || ans === getOptionLabel(opt)
                    );

                    return (
                      <div
                        key={idx}
                        draggable={!isAssigned}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", opt);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        className={`flex items-center gap-2.5 p-2 border rounded-xl shadow-sm transition-all select-none ${
                          isAssigned
                            ? "opacity-45 border-dashed border-gray-200 bg-gray-50 cursor-not-allowed"
                            : "border-gray-200 bg-white hover:border-indigo-400 hover:shadow-indigo-50/30 cursor-grab active:cursor-grabbing"
                        }`}
                        title={isAssigned ? "Already assigned" : "Drag to drop-zone"}
                      >
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-gray-300 font-black text-xs select-none">⋮⋮</span>
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
                        <span className={`text-[11px] leading-relaxed truncate font-semibold ${
                          isAssigned ? "text-gray-400 line-through" : "text-gray-700"
                        }`}>
                          {parseBoldText(hasLabel ? optText : opt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : group.type === "SUMMARY_COMPLETION_WITH_OPTIONS" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 max-w-3xl pl-1 bg-gray-50 p-4 rounded-xl border border-gray-150">
                {group.options.map((opt, idx) => {
                  const label = getOptionLabel(opt);
                  const hasLabel = label !== opt;
                  const optText = hasLabel ? opt.replace(new RegExp(`^${label}(\\s+|\\.|\\))`, 'i'), '') : opt;
                  
                  return (
                    <div key={idx} className="flex gap-3 items-center leading-relaxed text-gray-850">
                      {hasLabel ? (
                        <span className="text-indigo-800 font-black text-xs min-w-[24px] h-6 flex items-center justify-center bg-indigo-50 border border-indigo-100 rounded shrink-0 select-none">
                          {label}
                        </span>
                      ) : (
                        <span className="text-indigo-600 font-black shrink-0">•</span>
                      )}
                      <span className="text-xs font-bold text-gray-800 truncate">
                        {parseBoldText(hasLabel ? optText : opt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <ul className="space-y-3 text-sm pl-1">
                {group.options.map((opt, idx) => {
                  const label = getOptionLabel(opt);
                  const hasLabel = label !== opt;
                  const optText = hasLabel ? opt.replace(new RegExp(`^${label}(\\s+|\\.|\\))`, 'i'), '') : opt;
                  
                  return (
                    <li key={idx} className="flex gap-4 items-start leading-relaxed text-gray-700">
                      {hasLabel ? (
                        <span className="text-[#003580] font-black text-xs min-w-[28px] text-center bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 shrink-0 select-none">
                          {label}
                        </span>
                      ) : (
                        <span className="text-[#003580] font-black shrink-0 mt-0.5">•</span>
                      )}
                      <span className="whitespace-pre-wrap text-gray-700 font-normal">
                        {parseBoldText(hasLabel ? optText : opt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

      {/* Render Sub-questions */}
      <div className="space-y-4">
        {isTable ? (
          <TableCompletion group={group} answers={answers} onAnswer={onAnswer} />
        ) : isNotes ? (
          <NotesCompletion group={group} answers={answers} onAnswer={onAnswer} />
        ) : (
          group.questions.map((question) => (
            <div key={question.id} className="p-1">
              <SingleQuestion
                group={group}
                question={question}
                answer={answers[question.id] ?? ""}
                onAnswer={(val) => onAnswer(question.id, val)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
