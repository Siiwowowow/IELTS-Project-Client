/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  IconTable,
  IconBold,
  IconUnderline,
  IconItalic,
  IconPalette,
  IconEraser,
  IconTrash,
  IconSparkles,
  IconInfoCircle,
} from "@tabler/icons-react";
import { toast } from "sonner";

export interface VisualTableBuilderProps {
  value: string;
  onChange: (val: string) => void;
  questions?: { questionNumber: number }[];
  suggestedStartNumber?: number;
}

/**
 * Intelligent parser that can parse:
 * - Markdown tables (| H1 | H2 | \n | --- | --- | \n | C1 | C2 |)
 * - Tab-separated text (TSV from Excel / Google Sheets / Word)
 * - Comma-separated text (CSV)
 * - Pipe text without outer pipes (H1 | H2)
 */
export function parseAnyTableText(text: string): string[][] {
  if (!text || !text.trim()) {
    return [
      ["Header 1", "Header 2", "Header 3"],
      ["Text Details", "Restored in [7]", "Steps [8]"],
      ["Row 2 Col 1", "Row 2 Col 2", "Row 2 Col 3"]
    ];
  }

  const rawLines = text.trim().split("\n");
  const filteredLines = rawLines.map((l) => l.trim()).filter(Boolean);

  if (filteredLines.length === 0) {
    return [["Header 1", "Header 2"], ["", ""]];
  }

  const hasTabs = filteredLines.some((l) => l.includes("\t"));
  const hasPipes = filteredLines.some((l) => l.includes("|"));
  const hasCommas = filteredLines.some((l) => l.includes(","));

  const parsedRows: string[][] = [];

  for (const line of filteredLines) {
    let cells: string[] = [];

    if (hasPipes && line.includes("|")) {
      let content = line;
      if (content.startsWith("|")) content = content.slice(1);
      if (content.endsWith("|")) content = content.slice(0, -1);
      cells = content.split("|").map((c) => c.trim());
      const isSep = cells.every((c) => /^[-:\s]+$/.test(c));
      if (isSep) continue;
    } else if (hasTabs && line.includes("\t")) {
      cells = line.split("\t").map((c) => c.trim());
    } else if (hasCommas && line.includes(",")) {
      cells = line.split(",").map((c) => c.trim());
    } else if (/\s{2,}/.test(line)) {
      cells = line.split(/\s{2,}/).map((c) => c.trim());
    } else {
      cells = [line];
    }

    if (cells.length > 0) {
      parsedRows.push(cells);
    }
  }

  if (parsedRows.length === 0) {
    return [["Header 1", "Header 2"], ["", ""]];
  }

  const maxCols = Math.max(...parsedRows.map((r) => r.length), 1);
  const normalized = parsedRows.map((row) => {
    if (row.length < maxCols) {
      return [...row, ...Array(maxCols - row.length).fill("")];
    }
    return row;
  });

  if (normalized.length === 1) {
    normalized.push(Array(maxCols).fill(""));
  }

  return normalized;
}

export function gridToMarkdown(grid: string[][]): string {
  if (!grid || grid.length === 0) return "";
  const headers = grid[0] || ["Header 1"];
  const separator = headers.map(() => "---");
  const rows = grid.slice(1);

  const lines = [
    `| ${headers.map((h) => h || " ").join(" | ")} |`,
    `| ${separator.join(" | ")} |`,
    ...rows.map((r) => `| ${r.map((c) => c || " ").join(" | ")} |`),
  ];
  return lines.join("\n");
}

export default function VisualTableBuilder({
  value,
  onChange,
  questions,
  suggestedStartNumber = 1,
}: VisualTableBuilderProps) {
  const initialGrid = useMemo(() => parseAnyTableText(value), [value]);

  const [grid, setGrid] = useState<string[][]>(initialGrid);
  const [isRaw, setIsRaw] = useState(false);

  // Keep track of the last serialized markdown to prevent self-re-parsing loops
  const lastSerializedMdRef = useRef<string>(value);

  // Active cell and selection tracking
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [markedText, setMarkedText] = useState<string>("");
  const activeInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const rawTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const savedSelectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  // Sync state when external value changes (not from internal typing)
  useEffect(() => {
    if (value !== lastSerializedMdRef.current) {
      lastSerializedMdRef.current = value;
      const parsed = parseAnyTableText(value);
      setGrid(parsed);
    }
  }, [value]);

  // Compute next available blank number
  const nextAvailableQuestionNumber = useMemo(() => {
    const foundNumbers: number[] = [];
    grid.forEach((row) => {
      row.forEach((cell) => {
        const matches = cell.matchAll(/\[(\d+)\]/g);
        for (const match of matches) {
          foundNumbers.push(parseInt(match[1], 10));
        }
      });
    });

    if (foundNumbers.length > 0) {
      return Math.max(...foundNumbers) + 1;
    }

    if (questions && questions.length > 0) {
      return questions[0].questionNumber;
    }

    return suggestedStartNumber;
  }, [grid, questions, suggestedStartNumber]);

  const updateMarkdown = (newGrid: string[][]) => {
    setGrid(newGrid);
    const md = gridToMarkdown(newGrid);
    lastSerializedMdRef.current = md;
    onChange(md);
  };

  const handleCellChange = (rIdx: number, cIdx: number, val: string) => {
    const next = grid.map((row, r) =>
      row.map((cell, c) => (r === rIdx && c === cIdx ? val : cell))
    );
    updateMarkdown(next);
  };

  // Remember current selection and update marked text state
  const handleSelection = useCallback((
    row: number,
    col: number,
    element: HTMLInputElement | HTMLTextAreaElement
  ) => {
    setActiveCell({ row, col });
    activeInputRef.current = element;
    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? 0;
    savedSelectionRef.current = { start, end };
    const sel = element.value.substring(start, end);
    setMarkedText(sel);
  }, []);

  const handleRawSelection = useCallback((element: HTMLTextAreaElement) => {
    rawTextareaRef.current = element;
    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? 0;
    savedSelectionRef.current = { start, end };
    const sel = element.value.substring(start, end);
    setMarkedText(sel);
  }, []);

  // Apply formatting to marked text or current cell
  const applyFormat = (prefix: string, suffix: string = prefix) => {
    // 1. Raw Markdown Mode
    if (isRaw) {
      const el = rawTextareaRef.current;
      if (!el) {
        toast.info("Click inside the markdown text first.");
        return;
      }
      const curStart = el.selectionStart ?? 0;
      const curEnd = el.selectionEnd ?? 0;
      const saved = savedSelectionRef.current;
      const start = curStart !== curEnd ? curStart : saved.start;
      const end = curStart !== curEnd ? curEnd : saved.end;
      const selected = value.substring(start, end);

      const replacement = selected ? `${prefix}${selected}${suffix}` : `${prefix}text${suffix}`;
      const newVal = value.substring(0, start) + replacement + value.substring(end);
      lastSerializedMdRef.current = newVal;
      onChange(newVal);

      setTimeout(() => {
        el.focus();
        const selStart = start + prefix.length;
        const selEnd = selStart + (selected ? selected.length : 4);
        el.setSelectionRange(selStart, selEnd);
        handleRawSelection(el);
      }, 0);
      return;
    }

    // 2. Visual Table Mode
    if (!activeCell) {
      // Default to first cell if none focused yet
      setActiveCell({ row: 0, col: 0 });
      toast.info("Cell selected. Now choose your format.");
      return;
    }

    const { row, col } = activeCell;
    const currentVal = grid[row]?.[col] || "";
    const el = activeInputRef.current;

    const curStart = el?.selectionStart ?? 0;
    const curEnd = el?.selectionEnd ?? 0;
    const saved = savedSelectionRef.current;
    const start = curStart !== curEnd ? curStart : saved.start;
    const end = curStart !== curEnd ? curEnd : saved.end;
    const selected = currentVal.substring(start, end);

    let newVal = currentVal;
    let newStart = start;
    let newEnd = end;

    if (selected) {
      const formatted = `${prefix}${selected}${suffix}`;
      newVal = currentVal.substring(0, start) + formatted + currentVal.substring(end);
      newStart = start + prefix.length;
      newEnd = newStart + selected.length;
    } else {
      if (!currentVal) {
        newVal = `${prefix}text${suffix}`;
        newStart = prefix.length;
        newEnd = newStart + 4;
      } else {
        const formatted = `${prefix}${currentVal}${suffix}`;
        newVal = formatted;
        newStart = prefix.length;
        newEnd = newStart + currentVal.length;
      }
    }

    handleCellChange(row, col, newVal);

    setTimeout(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(newStart, newEnd);
        handleSelection(row, col, el);
      }
    }, 0);
  };

  // Remove formatting from marked text or current cell
  const removeFormat = () => {
    if (isRaw) {
      const el = rawTextareaRef.current;
      if (!el) return;
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      const selected = value.substring(start, end);
      if (!selected) {
        toast.info("Select formatted text first.");
        return;
      }
      const cleaned = selected
        .replace(/\{color:#[0-9a-fA-F]{6}\}/g, "")
        .replace(/\{\/color\}/g, "")
        .replace(/\*\*|__|\*/g, "");
      const newVal = value.substring(0, start) + cleaned + value.substring(end);
      lastSerializedMdRef.current = newVal;
      onChange(newVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start, start + cleaned.length);
        handleRawSelection(el);
      }, 0);
      return;
    }

    if (!activeCell) return;
    const { row, col } = activeCell;
    const currentVal = grid[row]?.[col] || "";
    const el = activeInputRef.current;
    const start = el?.selectionStart ?? 0;
    const end = el?.selectionEnd ?? 0;
    const selected = currentVal.substring(start, end);

    if (selected) {
      const cleaned = selected
        .replace(/\{color:#[0-9a-fA-F]{6}\}/g, "")
        .replace(/\{\/color\}/g, "")
        .replace(/\*\*|__|\*/g, "");
      const newVal = currentVal.substring(0, start) + cleaned + currentVal.substring(end);
      handleCellChange(row, col, newVal);
      setTimeout(() => {
        if (el) {
          el.focus();
          el.setSelectionRange(start, start + cleaned.length);
          handleSelection(row, col, el);
        }
      }, 0);
    } else {
      const cleaned = currentVal
        .replace(/\{color:#[0-9a-fA-F]{6}\}/g, "")
        .replace(/\{\/color\}/g, "")
        .replace(/\*\*|__|\*/g, "");
      handleCellChange(row, col, cleaned);
    }
  };

  // Insert Question Blank [Q]
  const insertQuestionBlank = () => {
    applyFormat(`[${nextAvailableQuestionNumber}]`, "");
  };

  const addColumn = () => {
    const next = grid.map((row, rIdx) => [...row, rIdx === 0 ? `Header ${row.length + 1}` : ""]);
    updateMarkdown(next);
  };

  const removeColumn = (cIdx: number) => {
    if (grid[0].length <= 1) return;
    const next = grid.map((row) => row.filter((_, c) => c !== cIdx));
    updateMarkdown(next);
  };

  const addRow = () => {
    const numCols = grid[0].length;
    const next = [...grid, Array(numCols).fill("")];
    updateMarkdown(next);
  };

  const removeRow = (rIdx: number) => {
    if (grid.length <= 2) return;
    const next = grid.filter((_, r) => r !== rIdx);
    updateMarkdown(next);
  };

  const resetTable = () => {
    const defaultGrid = [
      ["Header 1", "Header 2", "Header 3"],
      ["Text Details", "Restored in [7]", "Steps [8]"],
      ["Row 2 Col 1", "Row 2 Col 2", "Row 2 Col 3"]
    ];
    updateMarkdown(defaultGrid);
  };

  const autoFormatRawMarkdown = () => {
    const parsed = parseAnyTableText(value);
    const cleaned = gridToMarkdown(parsed);
    lastSerializedMdRef.current = cleaned;
    onChange(cleaned);
    toast.success("Table formatted cleanly!");
  };

  const handleToggleMode = () => {
    if (isRaw) {
      const parsed = parseAnyTableText(value);
      setGrid(parsed);
    }
    setIsRaw(!isRaw);
  };

  // Active cell label for UI
  const activeLabel = useMemo(() => {
    if (isRaw) return "Markdown Editor";
    if (!activeCell) return "Click any cell to format";
    if (activeCell.row === 0) return `Header ${activeCell.col + 1}`;
    return `Row ${activeCell.row}, Col ${activeCell.col + 1}`;
  }, [isRaw, activeCell]);

  return (
    <div className="space-y-3 p-4 bg-slate-50 border border-indigo-100 rounded-xl relative">
      {/* Top Bar with Header, Format Toolbar, and Operations */}
      <div className="flex flex-wrap justify-between items-center gap-2 bg-white p-2.5 rounded-lg border border-gray-100">
        {/* Left: Title & Active Cell indicator */}
        <div className="flex items-center gap-2">
          <IconTable className="text-indigo-600 shrink-0" size={18} />
          <span className="text-xs font-bold text-gray-800">Visual Table Editor</span>
        </div>

        {/* Center: Formatting Toolbar (Bold, Italic, Underline, Color, Clear, Blank) */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/60 p-1 shadow-2xs">
          <span className="text-[10px] font-extrabold text-indigo-700 px-1 flex items-center gap-1">
            <span>{activeLabel}</span>
            {markedText && (
              <span className="text-[9.5px] font-normal text-emerald-700 bg-emerald-100/90 px-1 py-0.2 rounded border border-emerald-200 truncate max-w-28" title={`Marked: "${markedText}"`}>
                &quot;{markedText}&quot;
              </span>
            )}
          </span>

          <span className="h-4 w-px bg-indigo-200" />

          {/* Bold */}
          <button
            type="button"
            onMouseDown={(event) => { event.preventDefault(); }}
            onClick={() => applyFormat("**", "**")}
            className="rounded p-1 text-gray-700 hover:bg-white hover:text-indigo-700 cursor-pointer transition font-bold"
            title="Bold marked text (**text**)"
          >
            <IconBold size={14} className="stroke-[2.5]" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onMouseDown={(event) => { event.preventDefault(); }}
            onClick={() => applyFormat("*", "*")}
            className="rounded p-1 text-gray-700 hover:bg-white hover:text-indigo-700 cursor-pointer transition"
            title="Italic marked text (*text*)"
          >
            <IconItalic size={14} className="stroke-[2.5]" />
          </button>

          {/* Underline */}
          <button
            type="button"
            onMouseDown={(event) => { event.preventDefault(); }}
            onClick={() => applyFormat("__", "__")}
            className="rounded p-1 text-gray-700 hover:bg-white hover:text-indigo-700 cursor-pointer transition font-bold"
            title="Underline marked text (__text__)"
          >
            <IconUnderline size={14} className="stroke-[2.5]" />
          </button>

          {/* Color Picker */}
          <label
            onMouseDown={(event) => { event.preventDefault(); }}
            className="relative flex cursor-pointer items-center rounded p-1 text-gray-700 hover:bg-white hover:text-indigo-700 transition"
            title="Color marked text"
          >
            <IconPalette size={14} className="text-purple-600" />
            <input
              type="color"
              defaultValue="#dc2626"
              className="absolute inset-0 cursor-pointer opacity-0 w-full h-full"
              onChange={(event) => applyFormat(`{color:${event.target.value}}`, "{/color}")}
            />
          </label>

          <span className="h-4 w-px bg-indigo-200" />

          {/* Clear Format */}
          <button
            type="button"
            onMouseDown={(event) => { event.preventDefault(); }}
            onClick={removeFormat}
            className="rounded p-1 text-gray-600 hover:bg-rose-50 hover:text-rose-600 cursor-pointer transition"
            title="Remove formatting from marked text"
          >
            <IconEraser size={14} />
          </button>

          <span className="h-4 w-px bg-indigo-200" />

          {/* Insert Question Blank [Q] */}
          <button
            type="button"
            onMouseDown={(event) => { event.preventDefault(); }}
            onClick={insertQuestionBlank}
            className="px-2 py-0.5 rounded bg-[#003580] hover:bg-[#002766] text-white font-bold text-[10.5px] flex items-center gap-1 shadow-2xs cursor-pointer transition"
            title={`Insert question blank [${nextAvailableQuestionNumber}]`}
          >
            <span>+ Blank [{nextAvailableQuestionNumber}]</span>
          </button>
        </div>

        {/* Right: Mode & Table Operations */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleMode}
            className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-200 transition cursor-pointer"
          >
            {isRaw ? "Visual Mode" : "Markdown Mode"}
          </button>

          {!isRaw ? (
            <>
              <button
                type="button"
                onClick={addColumn}
                className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 hover:bg-indigo-100/70 transition cursor-pointer"
              >
                + Col
              </button>
              <button
                type="button"
                onClick={addRow}
                className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 hover:bg-indigo-100/70 transition cursor-pointer"
              >
                + Row
              </button>
              <button
                type="button"
                onClick={resetTable}
                className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-600 rounded-lg border border-rose-100 hover:bg-rose-100/70 transition cursor-pointer"
              >
                Reset
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={autoFormatRawMarkdown}
              className="px-2.5 py-1 text-[11px] font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer flex items-center gap-1"
              title="Convert tab-separated or raw text into clean table"
            >
              <IconSparkles size={13} />
              <span>Format Table</span>
            </button>
          )}
        </div>
      </div>

      {/* Raw Markdown Mode */}
      {isRaw ? (
        <div className="space-y-1.5">
          <textarea
            ref={rawTextareaRef}
            rows={6}
            value={value}
            onFocus={(e) => handleRawSelection(e.currentTarget)}
            onSelect={(e) => handleRawSelection(e.currentTarget)}
            onKeyUp={(e) => handleRawSelection(e.currentTarget)}
            onMouseUp={(e) => handleRawSelection(e.currentTarget)}
            onChange={(e) => {
              lastSerializedMdRef.current = e.target.value;
              onChange(e.target.value);
            }}
            placeholder="| Column 1 | Column 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |"
            className="w-full text-xs font-semibold px-3.5 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-none focus:border-indigo-400 text-black font-mono resize-y leading-relaxed"
          />
          <p className="text-[10px] text-gray-500 flex items-center gap-1 font-medium">
            <IconInfoCircle size={13} className="text-indigo-500 shrink-0" />
            <span>Mark any text here and click <strong>Bold</strong>, <strong>Italic</strong>, <strong>Underline</strong> or <strong>Color</strong> above.</span>
          </p>
        </div>
      ) : (
        /* Visual Table Mode (Exact original table layout & style) */
        <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-xs">
          <table className="min-w-full divide-y divide-gray-200 text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70">
                {grid[0]?.map((headerVal, cIdx) => (
                  <th key={cIdx} className="p-2 border-r border-gray-200 last:border-r-0 min-w-32">
                    <div className={`flex items-center gap-1 bg-white border rounded px-1.5 py-0.5 transition ${activeCell?.row === 0 && activeCell?.col === cIdx ? "border-indigo-500 ring-1 ring-indigo-200" : "border-gray-200"}`}>
                      <input
                        type="text"
                        value={headerVal}
                        onFocus={(e) => handleSelection(0, cIdx, e.currentTarget)}
                        onSelect={(e) => handleSelection(0, cIdx, e.currentTarget)}
                        onKeyUp={(e) => handleSelection(0, cIdx, e.currentTarget)}
                        onMouseUp={(e) => handleSelection(0, cIdx, e.currentTarget)}
                        onChange={(e) => handleCellChange(0, cIdx, e.target.value)}
                        className="w-full text-xs font-bold text-indigo-950 bg-transparent focus:outline-none"
                        placeholder={`Header ${cIdx + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeColumn(cIdx)}
                        disabled={grid[0].length <= 1}
                        className="text-gray-400 hover:text-red-500 disabled:opacity-35 font-bold text-xs shrink-0 cursor-pointer"
                        title="Delete Column"
                      >
                        ×
                      </button>
                    </div>
                  </th>
                ))}
                <th className="p-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {grid.slice(1).map((row, rIdx) => {
                const actualRowIdx = rIdx + 1;
                return (
                  <tr key={rIdx} className="hover:bg-slate-50/50">
                    {row.map((cellVal, cIdx) => {
                      const isActive = activeCell?.row === actualRowIdx && activeCell?.col === cIdx;
                      return (
                        <td key={cIdx} className="p-2 border-r border-gray-200 last:border-r-0">
                          <input
                            type="text"
                            value={cellVal}
                            onFocus={(e) => handleSelection(actualRowIdx, cIdx, e.currentTarget)}
                            onSelect={(e) => handleSelection(actualRowIdx, cIdx, e.currentTarget)}
                            onKeyUp={(e) => handleSelection(actualRowIdx, cIdx, e.currentTarget)}
                            onMouseUp={(e) => handleSelection(actualRowIdx, cIdx, e.currentTarget)}
                            onChange={(e) => handleCellChange(actualRowIdx, cIdx, e.target.value)}
                            placeholder="e.g. text [7]"
                            className={`w-full text-xs bg-transparent focus:outline-none focus:bg-white px-2 py-1 border rounded text-black font-semibold placeholder:text-gray-300 placeholder:font-normal transition ${isActive ? "border-indigo-400 bg-indigo-50/20" : "border-transparent focus:border-indigo-300"}`}
                          />
                        </td>
                      );
                    })}
                    <td className="p-2 text-center w-8">
                      <button
                        type="button"
                        onClick={() => removeRow(actualRowIdx)}
                        disabled={grid.length <= 2}
                        className="text-gray-400 hover:text-red-500 disabled:opacity-35 text-xs cursor-pointer p-1"
                        title="Delete Row"
                      >
                        <IconTrash size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Helper Legend */}
      <p className="text-[10px] text-gray-500 bg-white p-2 rounded-lg border border-gray-100 flex items-center justify-between gap-1 font-medium leading-relaxed">
        <span className="flex items-center gap-1">
          <IconInfoCircle size={14} className="text-indigo-500 shrink-0" />
          <span>Mark any text in a cell and click <strong>Bold</strong>, <strong>Italic</strong>, <strong>Underline</strong> or <strong>Color</strong> above.</span>
        </span>
        <span className="text-gray-400 font-mono text-[9.5px]">Use [7], [8] for question input blanks</span>
      </p>
    </div>
  );
}
