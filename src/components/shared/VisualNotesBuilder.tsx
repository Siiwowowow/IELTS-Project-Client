"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconBold,
  IconItalic,
  IconPalette,
  IconEye,
  IconIndentDecrease,
  IconIndentIncrease,
  IconList,
  IconPlus,
  IconTrash,
  IconUnderline,
} from "@tabler/icons-react";
import { parseBoldText } from "@/lib/utils";

interface VisualNotesBuilderProps {
  value: string;
  onChange: (value: string) => void;
  questions?: { questionNumber: number }[];
}

interface NotesItem {
  id: string;
  type: "title" | "heading" | "example" | "divider" | "note";
  text: string;
  indentLevel: number;
}

let itemSequence = 0;

function createItemId() {
  itemSequence += 1;
  return `note-item-${itemSequence}`;
}

function createWildfiresTemplate(start = 1): NotesItem[] {
  const q = (offset: number) => `[${start + offset}]`;
  return [
    { id: createItemId(), type: "title", text: "Wildfires", indentLevel: 0 },
    { id: createItemId(), type: "note", text: "Characteristics of wildfires and wildfire conditions today compared to the past:", indentLevel: 0 },
    { id: createItemId(), type: "note", text: "occurrence: more frequent", indentLevel: 1 },
    { id: createItemId(), type: "note", text: "temperature: hotter", indentLevel: 1 },
    { id: createItemId(), type: "note", text: "speed: faster", indentLevel: 1 },
    { id: createItemId(), type: "note", text: `movement: ${q(0)} more unpredictably`, indentLevel: 1 },
    { id: createItemId(), type: "note", text: `size of fires: ${q(1)} greater on average than two decades ago`, indentLevel: 1 },
    { id: createItemId(), type: "note", text: "Reasons wildfires cause more damage today compared to the past:", indentLevel: 0 },
    { id: createItemId(), type: "note", text: `rainfall: ${q(2)} average`, indentLevel: 1 },
    { id: createItemId(), type: "note", text: `more brush to act as ${q(3)}`, indentLevel: 1 },
    { id: createItemId(), type: "note", text: "increase in yearly temperature", indentLevel: 1 },
    { id: createItemId(), type: "note", text: `extended fire ${q(4)}`, indentLevel: 1 },
    { id: createItemId(), type: "note", text: `more building of ${q(5)} in vulnerable places`, indentLevel: 1 },
  ];
}

function parseMarkdownToNotes(markdown: string, start = 1): NotesItem[] {
  if (!markdown.trim()) return createWildfiresTemplate(start);

  return markdown.split("\n").reduce<NotesItem[]>((parsedItems, line) => {
    const trimmed = line.trim();
    if (!trimmed) return parsedItems;

    const spaces = line.match(/^\s*/)?.[0].length ?? 0;
    const indentLevel = spaces >= 4 ? 2 : spaces >= 2 ? 1 : 0;

    if (trimmed.startsWith(">")) {
      parsedItems.push({ id: createItemId(), type: "example", text: trimmed.replace(/^>\s*/, ""), indentLevel: 0 });
      return parsedItems;
    }

    if (trimmed === "---") {
      parsedItems.push({ id: createItemId(), type: "divider", text: "", indentLevel: 0 });
      return parsedItems;
    }

    if (trimmed.startsWith("#")) {
      const hashes = (trimmed.match(/^#+/) || ["#"])[0].length;
      parsedItems.push({
        id: createItemId(),
        type: hashes <= 3 ? "title" : "heading",
        text: trimmed.replace(/^#+\s*/, ""),
        indentLevel: 0,
      });
      return parsedItems;
    }

    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      parsedItems.push({ id: createItemId(), type: "heading", text: trimmed.slice(2, -2), indentLevel: 0 });
      return parsedItems;
    }

    parsedItems.push({
      id: createItemId(),
      type: "note",
      text: trimmed.replace(/^[-*+]\s*/, ""),
      indentLevel,
    });
    return parsedItems;
  }, []);
}

function compileNotes(items: NotesItem[]) {
  return items.map((item) => {
    if (item.type === "title") return `### ${item.text}`;
    if (item.type === "heading") return `#### ${item.text}`;
    if (item.type === "example") return `> ${item.text}`;
    if (item.type === "divider") return "---";
    return `${"  ".repeat(item.indentLevel)}- ${item.text}`;
  }).join("\n");
}

function PreviewText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[\d+\])/g).map((part, index) => {
        const questionNumber = part.match(/^\[(\d+)\]$/)?.[1];
        if (!questionNumber) return <React.Fragment key={index}>{parseBoldText(part)}</React.Fragment>;
        return (
          <span key={index} className="mx-1 inline-flex items-end gap-1 align-baseline">
            <strong className="text-[11px]">{questionNumber}</strong>
            <span className="inline-block w-24 border-b border-black" />
          </span>
        );
      })}
    </>
  );
}

export default function VisualNotesBuilder({ value, onChange, questions = [] }: VisualNotesBuilderProps) {
  const firstQuestionNumber = questions[0]?.questionNumber || 1;
  const [items, setItems] = useState<NotesItem[]>(() => parseMarkdownToNotes(value, firstQuestionNumber));
  const [isRaw, setIsRaw] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const lastCompiledValue = useRef(compileNotes(items));
  const initialValue = useRef(value);
  const initialOnChange = useRef(onChange);

  useEffect(() => {
    if (!initialValue.current.trim()) {
      initialOnChange.current(lastCompiledValue.current);
    }
  }, []);

  useEffect(() => {
    if (value.trim() !== lastCompiledValue.current.trim()) {
      const parsed = parseMarkdownToNotes(value, firstQuestionNumber);
      lastCompiledValue.current = compileNotes(parsed);
      const timeoutId = window.setTimeout(() => setItems(parsed), 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [firstQuestionNumber, value]);

  const questionNumbers = useMemo(() => Array.from(new Set([
    ...questions.map((question) => question.questionNumber),
    ...Array.from(value.matchAll(/\[(\d+)\]/g), (match) => Number(match[1])),
  ])).sort((a, b) => a - b), [questions, value]);

  const updateItems = (nextItems: NotesItem[]) => {
    const compiled = compileNotes(nextItems);
    setItems(nextItems);
    lastCompiledValue.current = compiled;
    onChange(compiled);
  };

  const updateItem = (index: number, patch: Partial<NotesItem>) => {
    updateItems(items.map((item, itemIndex) => itemIndex === index
      ? { ...item, ...patch, indentLevel: patch.type && patch.type !== "note" ? 0 : item.indentLevel }
      : item));
  };

  const addItem = (type: NotesItem["type"]) => {
    updateItems([...items, {
      id: createItemId(),
      type,
      text: type === "title" ? "Notes title" : type === "heading" ? "Section heading" : type === "example" ? "Example" : type === "divider" ? "" : "Write note text here",
      indentLevel: 0,
    }]);
  };

  const moveItem = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= items.length) return;
    const nextItems = [...items];
    [nextItems[index], nextItems[target]] = [nextItems[target], nextItems[index]];
    updateItems(nextItems);
  };

  const insertBlank = (index: number, questionNumber: number) => {
    const input = document.getElementById(`notes-input-${index}`) as HTMLTextAreaElement | null;
    const start = input?.selectionStart ?? items[index].text.length;
    const end = input?.selectionEnd ?? start;
    const insertion = `${start > 0 && items[index].text[start - 1] !== " " ? " " : ""}[${questionNumber}]`;
    updateItem(index, { text: `${items[index].text.slice(0, start)}${insertion}${items[index].text.slice(end)}` });
    requestAnimationFrame(() => input?.focus());
  };

  const formatSelection = (index: number, format: "bold" | "italic" | "underline" | "color", color?: string) => {
    const input = document.getElementById(`notes-input-${index}`) as HTMLTextAreaElement | null;
    if (!input) return;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? start;
    const selectedText = items[index].text.slice(start, end);
    if (!selectedText) return;
    const [prefix, suffix] = format === "bold"
      ? ["**", "**"]
      : format === "italic"
        ? ["*", "*"]
        : format === "underline"
          ? ["__", "__"]
          : [`{color:${color || "#000000"}}`, "{/color}"];
    updateItem(index, { text: `${items[index].text.slice(0, start)}${prefix}${selectedText}${suffix}${items[index].text.slice(end)}` });
    requestAnimationFrame(() => input.focus());
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <IconList size={18} /> Note Completion Builder
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Add rows, then click a question number to place its answer blank.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => updateItems(createWildfiresTemplate(questionNumbers[0] || 1))} className="rounded-md border border-indigo-300 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-bold text-indigo-800">Load Wildfires example</button>
          <button type="button" onClick={() => addItem("title")} className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700">+ Title</button>
          <button type="button" onClick={() => addItem("heading")} className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700">+ Heading</button>
          <button type="button" onClick={() => addItem("example")} className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-bold italic text-slate-700">+ Example</button>
          <button type="button" onClick={() => addItem("divider")} className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700">+ Divider Line</button>
          <button type="button" onClick={() => addItem("note")} className="flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white"><IconPlus size={13} /> Note line</button>
        </div>
      </div>

      <div>
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Question content</p>
            <button type="button" onClick={() => setIsRaw(!isRaw)} className="text-[10px] font-bold text-slate-600 underline underline-offset-2">
              {isRaw ? "Use easy editor" : "Edit raw text"}
            </button>
          </div>

          {isRaw ? (
            <textarea
              rows={12}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="w-full resize-y rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-black outline-none focus:border-slate-600"
              placeholder="### Notes title\n#### Heading\n- Note line [1]"
            />
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="grid grid-cols-[20px_minmax(0,1fr)_28px] items-start gap-2">
                    <div className="flex shrink-0 flex-col">
                      <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} className="text-slate-500 disabled:opacity-20"><IconChevronUp size={16} /></button>
                      <button type="button" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} className="text-slate-500 disabled:opacity-20"><IconChevronDown size={16} /></button>
                    </div>
                    <div className="min-w-0 space-y-2">
                      <select value={item.type} onChange={(event) => updateItem(index, { type: event.target.value as NotesItem["type"] })} className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs font-bold text-black">
                        <option value="title">Main title</option>
                        <option value="heading">Section heading</option>
                        <option value="example">Example line</option>
                        <option value="divider">Full-width line</option>
                        <option value="note">Note / bullet</option>
                      </select>
                      {item.type === "divider" ? (
                        <div className="flex h-9 w-full items-center px-1"><span className="w-full border-t border-black" /></div>
                      ) : (
                        <textarea id={`notes-input-${index}`} rows={2} value={item.text} onChange={(event) => updateItem(index, { text: event.target.value })} className="min-h-14 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-black outline-none focus:border-slate-700" placeholder="Type what students will see" />
                      )}
                    </div>
                    <button type="button" onClick={() => updateItems(items.filter((_, itemIndex) => itemIndex !== index))} disabled={items.length === 1} className="p-2 text-slate-400 hover:text-red-600 disabled:opacity-20" title="Delete row"><IconTrash size={16} /></button>
                  </div>

                  {item.type !== "divider" && <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-500">Select text, then:</span>
                    <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => formatSelection(index, "bold")} className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-black"><IconBold size={13} /> Bold</button>
                    <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => formatSelection(index, "italic")} className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-black"><IconItalic size={13} /> Italic</button>
                    <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => formatSelection(index, "underline")} className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-black"><IconUnderline size={13} /> Underline</button>
                    <label className="flex cursor-pointer items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-black">
                      <IconPalette size={13} /> Color
                      <input type="color" defaultValue="#000000" onChange={(event) => formatSelection(index, "color", event.target.value)} className="h-4 w-4 cursor-pointer border-0 p-0" />
                    </label>
                  </div>}

                  {item.type === "note" && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <button type="button" onClick={() => updateItem(index, { indentLevel: Math.max(0, item.indentLevel - 1) })} disabled={item.indentLevel === 0} className="rounded border border-slate-200 bg-white p-1 text-slate-500 disabled:opacity-25" title="Move left"><IconIndentDecrease size={14} /></button>
                      <button type="button" onClick={() => updateItem(index, { indentLevel: Math.min(2, item.indentLevel + 1) })} disabled={item.indentLevel === 2} className="rounded border border-slate-200 bg-white p-1 text-slate-500 disabled:opacity-25" title="Move right"><IconIndentIncrease size={14} /></button>
                      <span className="ml-1 text-[10px] font-semibold text-slate-500">Insert answer blank:</span>
                      {questionNumbers.length > 0 ? questionNumbers.map((questionNumber) => (
                        <button key={questionNumber} type="button" onClick={() => insertBlank(index, questionNumber)} className="rounded border border-slate-300 bg-white px-2 py-1 text-[10px] font-black text-black hover:bg-slate-100">Q{questionNumber}</button>
                      )) : <span className="text-[10px] text-amber-700">Add questions below first.</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden border-t border-slate-200 bg-slate-100 p-4 xl:border-l xl:border-t-0">
          <button type="button" onClick={() => setShowPreview(!showPreview)} className="mb-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600"><IconEye size={15} /> {showPreview ? "Hide" : "Show"} student preview</button>
          {showPreview && (
            <div className="overflow-hidden border border-[#dddddd] bg-white p-5 font-[Arial,sans-serif] text-black shadow-sm">
              {items.map((item) => item.type === "title" ? (
                <h3 key={item.id} className="-mx-5 -mt-5 mb-2 border-b border-[#e5e5e5] px-5 py-3 text-center text-sm font-bold uppercase"><PreviewText text={item.text} /></h3>
              ) : item.type === "heading" ? (
                <h4 key={item.id} className="mb-2 mt-4 text-xs font-bold"><PreviewText text={item.text} /></h4>
              ) : item.type === "example" ? (
                <p key={item.id} className="my-3 text-[11px] italic"><PreviewText text={item.text} /></p>
              ) : item.type === "divider" ? (
                <hr key={item.id} className="-mx-5 my-3 border-0 border-t border-[#e5e5e5]" />
              ) : (
                <div key={item.id} className="my-2 flex gap-2 text-[11px] leading-5" style={{ paddingLeft: `${item.indentLevel * 20}px` }}>
                  <span>{item.indentLevel > 0 ? "•" : ""}</span><span><PreviewText text={item.text} /></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
