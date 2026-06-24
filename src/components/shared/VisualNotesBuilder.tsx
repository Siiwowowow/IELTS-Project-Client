"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  IconPlus,
  IconTrash,
  IconChevronUp,
  IconChevronDown,
  IconIndentIncrease,
  IconIndentDecrease,
  IconInfoCircle,
  IconList,
} from "@tabler/icons-react";

interface VisualNotesBuilderProps {
  value: string;
  onChange: (val: string) => void;
  questions?: { questionNumber: number }[];
}

interface NotesItem {
  id: string;
  type: "title" | "heading" | "note";
  text: string;
  indentLevel: number; // 0, 1, or 2
}

function parseMarkdownToNotes(markdown: string): NotesItem[] {
  if (!markdown.trim()) {
    return [
      { id: "1", type: "title", text: "Notes Title", indentLevel: 0 },
      { id: "2", type: "heading", text: "Section Heading", indentLevel: 0 },
      { id: "3", type: "note", text: "Area: [1] hectares", indentLevel: 0 },
      { id: "4", type: "note", text: "Habitats: wetland, grassland and woodland", indentLevel: 0 },
      { id: "5", type: "note", text: "Wetland: lakes, ponds and a [2]", indentLevel: 1 },
    ];
  }

  const lines = markdown.split("\n");
  const items: NotesItem[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Detect indentation level of the raw line
    const leadingSpaces = line.match(/^\s*/)?.[0].length ?? 0;
    let indentLevel = 0;
    if (leadingSpaces >= 4) {
      indentLevel = 2;
    } else if (leadingSpaces >= 2) {
      indentLevel = 1;
    }

    const id = `${index}-${Date.now()}-${Math.random()}`;

    if (trimmed.startsWith("#")) {
      const hashCount = (trimmed.match(/^#+/) || ["#"])[0].length;
      const text = trimmed.replace(/^#+\s*/, "");
      items.push({
        id,
        type: hashCount <= 3 ? "title" : "heading",
        text,
        indentLevel: 0,
      });
    } else if (trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.startsWith("+")) {
      const text = trimmed.replace(/^[-*+]\s*/, "");
      items.push({
        id,
        type: "note",
        text,
        indentLevel,
      });
    } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      const text = trimmed.substring(2, trimmed.length - 2);
      items.push({
        id,
        type: "heading",
        text,
        indentLevel: 0,
      });
    } else {
      items.push({
        id,
        type: "note",
        text: trimmed,
        indentLevel,
      });
    }
  });

  return items;
}

function compileNotesToMarkdown(items: NotesItem[]): string {
  return items
    .map((item) => {
      if (item.type === "title") {
        return `### ${item.text}`;
      }
      if (item.type === "heading") {
        return `#### ${item.text}`;
      }
      const spaces = "  ".repeat(item.indentLevel);
      return `${spaces}- ${item.text}`;
    })
    .join("\n");
}

export default function VisualNotesBuilder({ value, onChange, questions = [] }: VisualNotesBuilderProps) {
  const [items, setItems] = useState<NotesItem[]>(() => parseMarkdownToNotes(value));
  const [isRaw, setIsRaw] = useState(false);

  // Sync from parent if value changes from outside
  useEffect(() => {
    const compiled = compileNotesToMarkdown(items);
    if (value.trim() !== compiled.trim()) {
      setItems(parseMarkdownToNotes(value));
    }
  }, [value]);

  const updateParent = (newItems: NotesItem[]) => {
    setItems(newItems);
    onChange(compileNotesToMarkdown(newItems));
  };

  const handleItemChange = (index: number, field: keyof NotesItem, val: any) => {
    const next = items.map((item, idx) => {
      if (idx === index) {
        const updated = { ...item, [field]: val };
        // Titles and Headings cannot be indented
        if (field === "type" && val !== "note") {
          updated.indentLevel = 0;
        }
        return updated;
      }
      return item;
    });
    updateParent(next);
  };

  const addRow = (type: "title" | "heading" | "note") => {
    const newItem: NotesItem = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      text: type === "title" ? "New Notes Title" : type === "heading" ? "New Heading" : "Note description [blank]",
      indentLevel: 0,
    };
    updateParent([...items, newItem]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    updateParent(items.filter((_, idx) => idx !== index));
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === items.length - 1) return;

    const next = [...items];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;

    updateParent(next);
  };

  const changeIndent = (index: number, delta: number) => {
    const next = items.map((item, idx) => {
      if (idx === index && item.type === "note") {
        const nextLevel = Math.max(0, Math.min(2, item.indentLevel + delta));
        return { ...item, indentLevel: nextLevel };
      }
      return item;
    });
    updateParent(next);
  };

  const insertBlankAtCursor = (index: number, qNum: number) => {
    const inputEl = document.getElementById(`notes-input-${index}`) as HTMLInputElement;
    if (!inputEl) {
      const item = items[index];
      const newText = item.text + ` [${qNum}]`;
      handleItemChange(index, "text", newText);
      return;
    }

    const start = inputEl.selectionStart ?? 0;
    const end = inputEl.selectionEnd ?? 0;
    const val = inputEl.value;
    const insertion = ` [${qNum}]`;
    const newText = val.substring(0, start) + insertion + val.substring(end);

    const next = items.map((item, idx) =>
      idx === index ? { ...item, text: newText } : item
    );
    updateParent(next);

    setTimeout(() => {
      inputEl.focus();
      const newPos = start + insertion.length;
      inputEl.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const questionNumbers = React.useMemo(() => {
    return questions.map((q) => q.questionNumber).sort((a, b) => a - b);
  }, [questions]);

  return (
    <div className="space-y-3 p-4 bg-slate-50 border border-indigo-100 rounded-xl w-full font-sans">
      {/* Visual Editor Header Controls */}
      <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-150">
        <div className="flex items-center gap-2">
          <IconList className="text-indigo-600 shrink-0" size={18} />
          <span className="text-xs font-bold text-gray-800">Visual Notes Outline Editor</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsRaw(!isRaw)}
            className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-200 transition cursor-pointer"
          >
            {isRaw ? "Visual Mode" : "Markdown Mode"}
          </button>
          {!isRaw && (
            <>
              <button
                type="button"
                onClick={() => addRow("note")}
                className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-[#003580] rounded-lg border border-blue-100 hover:bg-blue-100/70 transition cursor-pointer"
              >
                + Note Line
              </button>
              <button
                type="button"
                onClick={() => addRow("heading")}
                className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-[#003580] rounded-lg border border-blue-100 hover:bg-blue-100/70 transition cursor-pointer"
              >
                + Section Heading
              </button>
              <button
                type="button"
                onClick={() => addRow("title")}
                className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-[#003580] rounded-lg border border-blue-100 hover:bg-blue-100/70 transition cursor-pointer"
              >
                + Title
              </button>
            </>
          )}
        </div>
      </div>

      {isRaw ? (
        <textarea
          rows={7}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="### Notes Title&#10;#### Section Heading&#10;- Note line [1]&#10;  - Indented Note [2]"
          className="w-full text-xs font-semibold px-3.5 py-2.5 border border-indigo-100 rounded-lg bg-white focus:outline-none focus:border-indigo-400 text-black font-mono resize-y"
        />
      ) : (
        <div className="space-y-2.5 w-full">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-150 shadow-sm hover:border-indigo-200 transition"
            >
              {/* Reorder controls */}
              <div className="flex flex-col gap-0.5 shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => moveItem(idx, "up")}
                  disabled={idx === 0}
                  className="p-0.5 hover:bg-slate-100 rounded disabled:opacity-35 transition text-gray-500 hover:text-black cursor-pointer"
                  title="Move Up"
                >
                  <IconChevronUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(idx, "down")}
                  disabled={idx === items.length - 1}
                  className="p-0.5 hover:bg-slate-100 rounded disabled:opacity-35 transition text-gray-500 hover:text-black cursor-pointer"
                  title="Move Down"
                >
                  <IconChevronDown size={14} />
                </button>
              </div>

              {/* Type Select */}
              <select
                value={item.type}
                onChange={(e) => handleItemChange(idx, "type", e.target.value as any)}
                className="h-8 px-1 text-[11px] font-bold bg-white border border-gray-300 rounded text-gray-700 cursor-pointer focus:outline-none shrink-0"
              >
                <option value="title">Title</option>
                <option value="heading">Heading</option>
                <option value="note">Note</option>
              </select>

              {/* Indentation buttons (only for note type) */}
              {item.type === "note" ? (
                <div className="flex gap-0.5 shrink-0 border border-gray-250 rounded p-0.5 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => changeIndent(idx, -1)}
                    disabled={item.indentLevel === 0}
                    className="p-1 hover:bg-white rounded disabled:opacity-30 transition text-gray-600 cursor-pointer"
                    title="Decrease Indent"
                  >
                    <IconIndentDecrease size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => changeIndent(idx, 1)}
                    disabled={item.indentLevel === 2}
                    className="p-1 hover:bg-white rounded disabled:opacity-30 transition text-gray-600 cursor-pointer"
                    title="Increase Indent"
                  >
                    <IconIndentIncrease size={12} />
                  </button>
                </div>
              ) : (
                <div className="w-[50px] shrink-0" />
              )}

              {/* Bullet level helper visual prefix */}
              <span
                className="text-gray-400 font-extrabold shrink-0 text-xs text-center min-w-[20px]"
                style={{ marginLeft: `${item.indentLevel * 12}px` }}
              >
                {item.type === "title" ? "T" : item.type === "heading" ? "H" : "•"}
              </span>

              {/* Text Input & Badge list */}
              <div className="flex-grow flex flex-col gap-1 min-w-0">
                <input
                  id={`notes-input-${idx}`}
                  type="text"
                  value={item.text}
                  onChange={(e) => handleItemChange(idx, "text", e.target.value)}
                  placeholder={
                    item.type === "title"
                      ? "Enter main notes title..."
                      : item.type === "heading"
                      ? "Enter section heading..."
                      : "Enter note line (e.g. Area: [1] hectares)..."
                  }
                  className="w-full h-8 px-2.5 border border-gray-300 rounded text-xs font-semibold bg-white focus:outline-none focus:border-indigo-400 text-black placeholder:font-normal placeholder:text-gray-400"
                />

                {item.type === "note" && questionNumbers.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap select-none">
                    <span className="text-[9px] text-gray-400 font-medium">Insert:</span>
                    {questionNumbers.map((qNum) => (
                      <button
                        key={qNum}
                        type="button"
                        onClick={() => insertBlankAtCursor(idx, qNum)}
                        className="px-1.5 py-0.5 bg-blue-50 border border-blue-150 rounded text-[9px] font-bold text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition shrink-0 cursor-pointer animate-fadeIn"
                      >
                        [{qNum}]
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Remove Action */}
              <button
                type="button"
                onClick={() => removeItem(idx)}
                disabled={items.length <= 1}
                className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded transition shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Delete Row"
              >
                <IconTrash size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Helper Info Footer */}
      <div className="text-[10px] text-gray-500 bg-white p-2.5 rounded-lg border border-gray-150 flex items-center gap-1.5 font-medium leading-relaxed select-none shadow-sm">
        <IconInfoCircle size={15} className="text-indigo-500 shrink-0" />
        <span>Create notes with titles, headers and list bullets. Write placeholders like <strong>[1]</strong>, <strong>[2]</strong> to inline dynamic question inputs.</span>
      </div>
    </div>
  );
}
