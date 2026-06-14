"use client";

import { IQuestion, IQuestionGroup } from "@/types/reading.types";
import HighlightableText from "./HighlightableText";
import { parseBoldText, getOptionLabel } from "@/lib/utils";

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
          <button
            key={opt}
            type="button"
            onClick={() => onAnswer(opt)}
            className={`flex items-center gap-3 w-full max-w-md px-4 py-2 rounded-xl border text-left text-sm transition-all duration-150 ${
              active
                ? "bg-[#003580]/5 text-[#003580] border-[#003580] font-bold"
                : "bg-white text-gray-700 border-gray-200 hover:border-[#003580]/50 hover:bg-gray-50/50"
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full flex shrink-0 items-center justify-center text-[10px] font-black ${
                active ? "bg-[#003580] text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              {label}
            </span>
            <div className="flex items-center gap-2">
              <span className={`inline-flex w-4 h-4 rounded-full border shrink-0 items-center justify-center ${
                active ? "border-[#003580]" : "border-gray-300"
              }`}>
                {active && <span className="w-2 h-2 rounded-full bg-[#003580]" />}
              </span>
              <span className="font-semibold text-gray-800">{parseBoldText(opt)}</span>
            </div>
          </button>
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
    <div className="mt-3 space-y-2 pl-2">
      {opts.map((opt, i) => {
        const label = String.fromCharCode(65 + i);
        const active = answer === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onAnswer(opt)}
            className={`flex items-center gap-3 w-full max-w-md px-4 py-2 rounded-xl border text-left text-sm transition-all duration-150 ${
              active
                ? "bg-[#003580]/5 text-[#003580] border-[#003580] font-bold"
                : "bg-white text-gray-700 border-gray-200 hover:border-[#003580]/50 hover:bg-gray-50/50"
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full flex shrink-0 items-center justify-center text-[10px] font-black ${
                active ? "bg-[#003580] text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              {label}
            </span>
            <div className="flex items-center gap-2">
              <span className={`inline-flex w-4 h-4 rounded-full border shrink-0 items-center justify-center ${
                active ? "border-[#003580]" : "border-gray-300"
              }`}>
                {active && <span className="w-2 h-2 rounded-full bg-[#003580]" />}
              </span>
              <span className="font-semibold text-gray-800 whitespace-pre-wrap">{parseBoldText(opt)}</span>
            </div>
          </button>
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
  group: IQuestionGroup;
  question: IQuestion;
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
    type === "TABLE_COMPLETION" ||
    type === "DIAGRAM_LABELLING"
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
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003580]/25 focus:border-[#003580] transition-all bg-white font-semibold text-black animate-fadeIn"
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
              Drag heading here or select:
            </span>
            {isWithoutClues ? (
              <input
                type="text"
                placeholder="i, ii..."
                value={answer}
                onChange={(e) => onAnswer(e.target.value)}
                className="w-16 text-center text-xs bg-white border border-gray-255 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-black"
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
      <>
        <HighlightableText text={question.questionText ?? ""} />
        <MatchingSelect opts={opts} answer={answer} onAnswer={onAnswer} />
      </>
    );
  }

  /* SHORT ANSWER (default) */
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="text-sm text-gray-650 font-normal leading-relaxed">
        <HighlightableText text={question.questionText ?? ""} />
      </div>
      <div className="w-full sm:w-56 shrink-0">
        <TextInput id={`q-input-${question.id}`} value={answer} onChange={onAnswer} placeholder="Enter answer..." />
      </div>
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
  questions: IQuestion[],
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
  questions: IQuestion[],
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

// ─── Public group renderer ────────────────────────────────────────────────────

interface Props {
  group: IQuestionGroup;
  answers: Record<string, string>;
  onAnswer: (questionId: string, value: string) => void;
  hideReferenceBox?: boolean;
}

export function QuestionRenderer({ group, answers, onAnswer, hideReferenceBox = false }: Props) {
  const isTable = group.type === "TABLE_COMPLETION";
  const isMatchingHeadings = group.type === "MATCHING_HEADINGS";
  const isJSONSegment = !!(group.passageSegment && group.passageSegment.trim().startsWith("{"));
  const mhdgConfig = isMatchingHeadings ? parseMatchingHeadingsConfig(group.passageSegment) : null;
  const hasInteractiveSegment = !isJSONSegment && !!(group.passageSegment && /\[\d+\]/.test(group.passageSegment));

  return (
    <div className="space-y-5">
      {/* Instruction box */}
      {group.instruction && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-line">
            {parseBoldText(group.instruction)}
          </p>
        </div>
      )}

      {/* Optional passage segment */}
      {group.passageSegment && !isTable && !isJSONSegment && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-900 leading-relaxed">
          {hasInteractiveSegment ? (
            renderInteractiveText(group.passageSegment, group.questions, answers, onAnswer, group.options)
          ) : (
            <div className="italic whitespace-pre-wrap">{parseBoldText(group.passageSegment)}</div>
          )}
        </div>
      )}

      {/* Render list of headings / features block for students to refer to */}
      {!hideReferenceBox && (group.type === "MATCHING_HEADINGS" ||
        group.type === "MATCHING_FEATURES" ||
        group.type === "MATCHING_SENTENCE_ENDINGS" ||
        group.type === "MATCHING_INFORMATION" ||
        group.type === "SUMMARY_COMPLETION_WITH_OPTIONS") &&
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
                ? "List of Features"
                : group.type === "MATCHING_INFORMATION"
                ? "Paragraph Selection"
                : group.type === "MATCHING_SENTENCE_ENDINGS"
                ? "Sentence Endings"
                : "Options List"}
            </h4>
            
            {group.type === "MATCHING_HEADINGS" ? (
              <div className="space-y-2.5 max-w-xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span>ℹ️ Drag headings below to the correct questions or select from inline inputs:</span>
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
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
                        draggable={!isAssigned}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", opt);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        className={`flex items-center gap-2.5 p-2 border rounded-xl shadow-sm transition-all select-none ${
                          isAssigned
                            ? "opacity-45 border-dashed border-gray-200 bg-gray-50/50 cursor-not-allowed"
                            : "border-gray-200 bg-white hover:border-indigo-400 hover:shadow-indigo-50/30 hover:shadow-md cursor-grab active:cursor-grabbing"
                        }`}
                        title={isAssigned ? "Already assigned to a paragraph" : "Drag to any question drop-zone"}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 max-w-3xl pl-1 bg-gray-50/50 p-4 rounded-xl border border-gray-150">
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

      {/* Render Matching Headings Example Question (Real IELTS Exam system representation) */}
      {isMatchingHeadings && mhdgConfig && mhdgConfig.exampleParagraph && (
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
              className="w-32 px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100 font-semibold text-gray-500 cursor-not-allowed"
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
      {isTable ? (
        <TableCompletion group={group} answers={answers} onAnswer={onAnswer} />
      ) : hasInteractiveSegment ? (
        // Inline inputs rendered in passageSegment, no need to list questions below
        null
      ) : (
        group.questions.map((q) => {
          const answered = !!(answers[q.id]?.trim());
          return (
            <div key={q.id} className="flex gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5 transition-colors ${
                  answered
                    ? "bg-[#003580] text-white"
                    : "bg-[#003580]/10 text-[#003580]"
                }`}
              >
                {q.questionNumber}
              </span>
              <div className="flex-1">
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
