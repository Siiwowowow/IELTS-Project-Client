"use client";

import { IQuestion, IQuestionGroup } from "@/types/reading.types";
import HighlightableText from "./HighlightableText";


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
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onAnswer(opt)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
            answer === opt
              ? "bg-primary text-white border-primary shadow-sm shadow-primary/30"
              : "bg-white text-gray-600 border-gray-200 hover:border-primary/50 hover:text-primary"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder = "Your answer…",
  inline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…"
        className="inline-block w-28 px-2 py-0.5 mx-1 text-sm border-b-2 border-primary/50 focus:border-primary focus:outline-none bg-transparent text-center align-baseline"
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all bg-white"
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
    <div className="mt-2 space-y-1.5">
      {opts.map((opt, i) => {
        const label = String.fromCharCode(65 + i);
        const active = answer === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onAnswer(opt)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm border text-left transition-all duration-150 ${
              active
                ? "bg-primary/10 text-primary border-primary/40 font-medium"
                : "bg-white text-gray-700 border-gray-200 hover:border-primary/40"
            }`}
          >
            <span
              className={`h-5 w-5 flex shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                active ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              {label}
            </span>
            {opt}
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
      className="mt-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all bg-white"
    >
      <option value="">— Select —</option>
      {opts.map((opt, i) => (
        <option key={i} value={opt}>
          {opt}
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
    type === "FLOW_CHART_COMPLETION" ||
    type === "TABLE_COMPLETION" ||
    type === "DIAGRAM_LABELLING"
  ) {
    const text = question.questionText ?? "";
    const parts = text.split(/_{2,}/);
    if (parts.length > 1) {
      return (
        <p className="text-sm text-gray-700 leading-relaxed flex flex-wrap items-baseline gap-0.5">
          {parts.map((part, i) => (
            <span key={i}>
              {part}
              {i < parts.length - 1 && (
                <TextInput value={answer} onChange={onAnswer} inline />
              )}
            </span>
          ))}
        </p>
      );
    }
    return (
      <>
        <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
        <TextInput value={answer} onChange={onAnswer} />
      </>
    );
  }

  /* MATCHING HEADINGS / FEATURES / SENTENCE ENDINGS */
  if (
    type === "MATCHING_HEADINGS" ||
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

  /* SHORT ANSWER (default) */
  return (
    <>
      <HighlightableText text={question.questionText ?? ""} />
      <TextInput value={answer} onChange={onAnswer} />
    </>
  );
}

// ─── Public group renderer ────────────────────────────────────────────────────

interface Props {
  group: IQuestionGroup;
  answers: Record<string, string>;
  onAnswer: (questionId: string, value: string) => void;
}

export function QuestionRenderer({ group, answers, onAnswer }: Props) {
  return (
    <div className="space-y-5">
      {/* Instruction box */}
      {group.instruction && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-line">
            {group.instruction}
          </p>
        </div>
      )}

      {/* Optional passage segment */}
      {group.passageSegment && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-900 leading-relaxed italic">
          {group.passageSegment}
        </div>
      )}

      {/* Questions */}
      {group.questions.map((q) => {
        const answered = !!(answers[q.id]?.trim());
        return (
          <div key={q.id} className="flex gap-3">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5 transition-colors ${
                answered
                  ? "bg-primary text-white"
                  : "bg-primary/10 text-primary"
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
      })}
    </div>
  );
}
