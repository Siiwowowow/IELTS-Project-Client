"use client";

import React, { useState, useRef } from "react";
import {
  IconBold,
  IconItalic,
  IconEraser,
  IconInfoCircle,
  IconSparkles,
  IconEye,
  IconCode,
  IconFileText,
  IconCheck,
  IconPhoto,
  IconUpload,
  IconTrash,
  IconLoader2,
  IconExternalLink,
} from "@tabler/icons-react";
import { ExamImageViewer } from "@/components/Writing/ExamImageViewer";

export interface WritingTask1FormProps {
  instruction: string;
  minWords: number;
  modelAnswer: string;
  imageUrl?: string;
  pdfUrl?: string;
  examType?: "ACADEMIC" | "GENERAL_TRAINING";
  onInstructionChange: (val: string) => void;
  onMinWordsChange: (val: number) => void;
  onModelAnswerChange: (val: string) => void;
  onImageUpload?: (file: File) => void;
  onImageUrlChange?: (url: string) => void;
  onPdfUpload?: (file: File) => void;
  onPdfUrlChange?: (url: string) => void;
  uploadingImage?: boolean;
  uploadingPdf?: boolean;
}

// ─── Helpers to compile and parse IELTS Task 1 HTML ──────────────────
export function compileTask1Html({
  timeGuidance,
  topicText,
  wordsGuidance,
}: {
  timeGuidance: string;
  topicText: string;
  wordsGuidance: string;
}): string {
  const paragraphs = topicText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const formattedTopic =
    paragraphs.length > 0
      ? paragraphs
          .map((p) => `<p class="mb-3 last:mb-0 leading-relaxed font-normal">${p.replace(/\n/g, "<br/>")}</p>`)
          .join("\n")
      : topicText;

  return `<div class="ielts-task1-sheet font-sans select-text">
  <div class="ielts-task1-header mb-4">
    <h3 class="text-base md:text-lg font-black tracking-tight text-slate-900 mb-2">WRITING TASK 1</h3>
    ${timeGuidance ? `<p data-field="time-guidance" class="text-sm text-slate-800 font-normal mb-2">${timeGuidance}</p>` : ""}
  </div>
  <div class="ielts-task1-box my-4 p-5 md:p-6 border-2 border-slate-900 bg-white rounded-none shadow-2xs font-normal text-slate-900 leading-relaxed text-sm md:text-[15px]">
    ${formattedTopic}
  </div>
  ${wordsGuidance ? `<p data-field="words-guidance" class="text-sm text-slate-800 font-normal mt-3">${wordsGuidance}</p>` : ""}
</div>`;
}

export function parseTask1Html(html: string) {
  const defaultValues = {
    timeGuidance: "You should spend about 20 minutes on this task.",
    topicText: "",
    wordsGuidance: "Write at least 150 words.",
  };

  if (!html || !html.trim()) return defaultValues;

  // Check if HTML contains the structured box
  const boxMatch = html.match(
    /<div[^>]*class="[^"]*(?:ielts-task1-box|border-2 border-(?:slate|gray|black)[^"]*)"[^>]*>([\s\S]*?)<\/div>/i
  );

  if (boxMatch && boxMatch[1]) {
    const inner = boxMatch[1]
      .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
      .replace(/<p[^>]*>/gi, "")
      .replace(/<\/p>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .trim();

    const timeMatch = html.match(/data-field="time-guidance"[^>]*>([\s\S]*?)<\/p>/i);
    const wordsMatch = html.match(/data-field="words-guidance"[^>]*>([\s\S]*?)<\/p>/i);

    return {
      timeGuidance: timeMatch ? timeMatch[1] : defaultValues.timeGuidance,
      topicText: inner,
      wordsGuidance: wordsMatch ? wordsMatch[1] : defaultValues.wordsGuidance,
    };
  }

  // Fallback for raw text: strip standard boilerplate and keep the core topic
  let cleanTopic = html;
  cleanTopic = cleanTopic.replace(/<[^>]+>/g, " ");
  cleanTopic = cleanTopic.replace(/WRITING TASK 1/gi, "");
  cleanTopic = cleanTopic.replace(/You should spend about \d+ minutes on this task\.?/gi, "");
  cleanTopic = cleanTopic.replace(/Write at least \d+ words\.?/gi, "");
  cleanTopic = cleanTopic.trim();

  return {
    ...defaultValues,
    topicText: cleanTopic || html,
  };
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function WritingTask1Form({
  instruction,
  minWords = 150,
  modelAnswer = "",
  imageUrl = "",
  pdfUrl = "",
  examType = "ACADEMIC",
  onInstructionChange,
  onMinWordsChange,
  onModelAnswerChange,
  onImageUpload,
  onImageUrlChange,
  onPdfUpload,
  onPdfUrlChange,
  uploadingImage = false,
  uploadingPdf = false,
}: WritingTask1FormProps) {
  const [editorMode, setEditorMode] = useState<"visual" | "raw">("visual");

  // Initial parse of instruction
  const [timeGuidance, setTimeGuidance] = useState(() => parseTask1Html(instruction).timeGuidance);
  const [topicText, setTopicText] = useState(() => parseTask1Html(instruction).topicText);
  const [wordsGuidance, setWordsGuidance] = useState(() => parseTask1Html(instruction).wordsGuidance);
  const [rawHtml, setRawHtml] = useState(instruction);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync when instruction prop changes externally
  const [lastCompiled, setLastCompiled] = useState(instruction);
  const [prevInstruction, setPrevInstruction] = useState(instruction);

  if (instruction !== prevInstruction) {
    setPrevInstruction(instruction);
    if (instruction !== lastCompiled) {
      const parsed = parseTask1Html(instruction);
      setTimeGuidance(parsed.timeGuidance);
      setTopicText(parsed.topicText);
      setWordsGuidance(parsed.wordsGuidance);
      setRawHtml(instruction);
      setLastCompiled(instruction);
    }
  }

  // Sync state changes back to parent as compiled HTML
  const notifyChange = (newTime: string, newTopic: string, newWords: string) => {
    const compiled = compileTask1Html({
      timeGuidance: newTime,
      topicText: newTopic,
      wordsGuidance: newWords,
    });
    setLastCompiled(compiled);
    setRawHtml(compiled);
    onInstructionChange(compiled);
  };

  const handleTopicChange = (newTopic: string) => {
    setTopicText(newTopic);
    notifyChange(timeGuidance, newTopic, wordsGuidance);
  };

  const handleTimeChange = (newTime: string) => {
    setTimeGuidance(newTime);
    notifyChange(newTime, topicText, wordsGuidance);
  };

  const handleWordsGuidanceChange = (newWords: string) => {
    setWordsGuidance(newWords);
    notifyChange(timeGuidance, topicText, newWords);
  };

  const handleRawHtmlChange = (newRaw: string) => {
    setRawHtml(newRaw);
    setLastCompiled(newRaw);
    onInstructionChange(newRaw);
    const parsed = parseTask1Html(newRaw);
    setTopicText(parsed.topicText);
  };

  // ─── Format Actions (Bold / Italic / Clear) ────────────────────────
  const applyTagToSelection = (openTag: string, closeTag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selectedText = topicText.substring(start, end);

    if (!selectedText) {
      const newText =
        topicText.substring(0, start) + openTag + closeTag + topicText.substring(end);
      handleTopicChange(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + openTag.length, start + openTag.length);
      }, 0);
      return;
    }

    if (
      selectedText.startsWith(openTag) &&
      selectedText.endsWith(closeTag) &&
      selectedText.length >= openTag.length + closeTag.length
    ) {
      const unwrapped = selectedText.substring(
        openTag.length,
        selectedText.length - closeTag.length
      );
      const newText = topicText.substring(0, start) + unwrapped + topicText.substring(end);
      handleTopicChange(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + unwrapped.length);
      }, 0);
      return;
    }

    const wrapped = `${openTag}${selectedText}${closeTag}`;
    const newText = topicText.substring(0, start) + wrapped + topicText.substring(end);
    handleTopicChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + wrapped.length);
    }, 0);
  };

  const handleBold = () => applyTagToSelection("<strong>", "</strong>");
  const handleItalic = () => applyTagToSelection("<em>", "</em>");

  const handleClearFormatting = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selectedText = topicText.substring(start, end);

    if (!selectedText) {
      const stripped = topicText.replace(/<\/?(?:strong|b|em|i|u|span|p|br)[^>]*>/gi, "");
      handleTopicChange(stripped);
      return;
    }

    const stripped = selectedText.replace(/<\/?(?:strong|b|em|i|u|span|p|br)[^>]*>/gi, "");
    const newText = topicText.substring(0, start) + stripped + topicText.substring(end);
    handleTopicChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + stripped.length);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      handleBold();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      handleItalic();
    }
  };

  // ─── Quick Presets ────────────────────────────────────────────────
  const loadPreset = (type: "energy" | "internet" | "water" | "letter") => {
    if (type === "energy") {
      // Exactly matches the user's uploaded screenshot!
      const topic = `The first chart below shows how energy is used in an average Australian household. The second chart shows the greenhouse gas emissions which result from this energy use.

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.`;
      setTopicText(topic);
      notifyChange(timeGuidance, topic, wordsGuidance);
    } else if (type === "internet") {
      const topic = `The chart below shows the percentage of households with internet access in three European countries between 2018 and 2024.

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.`;
      setTopicText(topic);
      notifyChange(timeGuidance, topic, wordsGuidance);
    } else if (type === "water") {
      const topic = `The diagram below illustrates the process by which water is treated and made safe for domestic consumption.

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.`;
      setTopicText(topic);
      notifyChange(timeGuidance, topic, wordsGuidance);
    } else if (type === "letter") {
      const topic = `You recently stayed at a hotel and left an important item behind.

Write a letter to the hotel manager. In your letter:
- describe the item you left behind
- explain where you think you left it
- state what you would like the manager to do about it`;
      setTopicText(topic);
      notifyChange(timeGuidance, topic, wordsGuidance);
    }
  };

  // Formatted preview of the topic text inside the box
  const previewBoxHtml = (topicText || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p class="mb-3 last:mb-0 leading-relaxed font-normal">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden select-text">
      {/* Task Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
              IELTS Writing Task 1
            </span>
            <span className="text-[10px] font-bold text-gray-400">
              {examType === "ACADEMIC" ? "Visual Stimulus (Chart/Graph/Diagram)" : "Letter Writing"}
            </span>
          </div>
          <h2 className="font-black text-gray-900 text-base mt-1 flex items-center gap-2">
            <IconFileText size={18} className="text-indigo-600" />
            <span>Task 1 Question Maker (Authentic IELTS Format)</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Build official boxed IELTS Task 1 prompts. Text is normal font by default, and teachers can bold specific questions.
          </p>
        </div>

        {/* Editor Mode Switcher */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setEditorMode("visual")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              editorMode === "visual"
                ? "bg-white text-indigo-700 shadow-2xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <IconEye size={14} />
            <span>IELTS Box Builder</span>
          </button>
          <button
            type="button"
            onClick={() => setEditorMode("raw")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              editorMode === "raw"
                ? "bg-white text-indigo-700 shadow-2xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <IconCode size={14} />
            <span>HTML Editor</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {editorMode === "visual" ? (
          <>
            {/* Template Presets Bar */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                <IconSparkles size={14} className="text-indigo-600" />
                <span>Quick IELTS Presets:</span>
              </span>
              <button
                type="button"
                onClick={() => loadPreset("energy")}
                className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
                title="Matches the official Cambridge IELTS example from your screenshot"
              >
                Australian Household Energy (Image Sample)
              </button>
              <button
                type="button"
                onClick={() => loadPreset("internet")}
                className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                Internet Access in Europe (Bar Chart)
              </button>
              <button
                type="button"
                onClick={() => loadPreset("water")}
                className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                Water Purification Process (Diagram)
              </button>
              <button
                type="button"
                onClick={() => loadPreset("letter")}
                className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                Hotel Complaint Letter (GT)
              </button>
            </div>

            {/* Top Guidance Field: Time */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">
                Time Instruction Line
              </label>
              <input
                data-format-toolbar="true"
                type="text"
                value={timeGuidance}
                onChange={(e) => handleTimeChange(e.target.value)}
                placeholder="You should spend about 20 minutes on this task."
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-medium text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
              />
            </div>

            {/* Central IELTS Topic Box Editor */}
            <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-2xs focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-500 transition-all">
              {/* Box Editor Toolbar */}
              <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-indigo-600 inline-block" />
                    IELTS Task 1 Box Content (Inside Border Box)
                  </span>
                </div>

                {/* Formatting Tools: Bold, Italic, Clear */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleBold}
                    className="p-1.5 rounded-lg bg-white border border-slate-300 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 transition cursor-pointer flex items-center gap-1 text-xs font-bold shadow-2xs"
                    title="Make selected text Bold (Ctrl+B)"
                  >
                    <IconBold size={14} className="stroke-[3]" />
                    <span className="hidden sm:inline">Bold</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleItalic}
                    className="p-1.5 rounded-lg bg-white border border-slate-300 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 transition cursor-pointer flex items-center gap-1 text-xs font-bold shadow-2xs"
                    title="Make selected text Italic (Ctrl+I)"
                  >
                    <IconItalic size={14} />
                    <span className="hidden sm:inline">Italic</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearFormatting}
                    className="p-1.5 rounded-lg bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 text-slate-700 hover:text-rose-700 transition cursor-pointer flex items-center gap-1 text-xs font-bold shadow-2xs"
                    title="Clear formatting tags"
                  >
                    <IconEraser size={14} />
                    <span className="hidden sm:inline">Clear Format</span>
                  </button>
                </div>
              </div>

              {/* Textarea for Topic Inside Box */}
              <div className="p-4 bg-white">
                <textarea
                  ref={textareaRef}
                  data-format-toolbar="true"
                  value={topicText}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`e.g. The first chart below shows how energy is used in an average Australian household. The second chart shows the greenhouse gas emissions which result from this energy use.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.`}
                  rows={6}
                  className="w-full text-sm font-normal text-slate-900 leading-relaxed outline-none resize-y placeholder:text-gray-400 placeholder:italic font-sans"
                />
              </div>

              {/* Bottom formatting hint */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-gray-500">
                <div className="flex items-center gap-1.5">
                  <IconInfoCircle size={13} className="text-indigo-600 shrink-0" />
                  <span>
                    Text starts <strong>normal</strong> by default. Highlight any question or words and click{" "}
                    <strong>Bold</strong> (or press <kbd className="px-1 py-0.5 bg-gray-200 rounded font-mono text-[10px]">Ctrl+B</kbd>) to make them bold.
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-semibold">
                  Lines separated by blank rows will render as paragraphs.
                </span>
              </div>
            </div>

            {/* Stimulus Media Upload (Chart/Graph/Diagram or PDF) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image Stimulus */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <IconPhoto size={14} className="text-indigo-600" />
                  <span>Chart / Graph / Diagram Image</span>
                </label>

                {imageUrl ? (
                  <div className="p-3 bg-white border border-gray-300 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                        <IconCheck size={14} className="text-emerald-600 stroke-[3]" />
                        Image Attached
                      </span>
                      {onImageUrlChange && (
                        <button
                          type="button"
                          onClick={() => onImageUrlChange("")}
                          className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <IconTrash size={13} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    {/* Thumbnail */}
                    <div className="relative overflow-hidden bg-white max-h-44 flex items-center justify-center p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt="Stimulus preview" className="max-h-32 object-contain" />
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-xl bg-white transition cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && onImageUpload) onImageUpload(file);
                      }}
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold py-2">
                        <IconLoader2 size={16} className="animate-spin" />
                        <span>Uploading Image...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 py-1 text-center">
                        <IconUpload size={20} className="text-gray-400 group-hover:text-indigo-600 transition" />
                        <span className="text-xs font-bold text-gray-700 group-hover:text-indigo-700">
                          Upload Chart/Graph Image
                        </span>
                        <span className="text-[10px] text-gray-400">PNG, JPG, or WebP</span>
                      </div>
                    )}
                  </label>
                )}
              </div>

              {/* PDF Stimulus */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <IconFileText size={14} className="text-indigo-600" />
                  <span>PDF Stimulus (Optional Alternative)</span>
                </label>

                {pdfUrl ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                        <IconCheck size={14} className="text-emerald-600 stroke-[3]" />
                        PDF Document Attached
                      </span>
                      {onPdfUrlChange && (
                        <button
                          type="button"
                          onClick={() => onPdfUrlChange("")}
                          className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <IconTrash size={13} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <IconExternalLink size={13} />
                      <span>View Uploaded PDF</span>
                    </a>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-xl bg-gray-50/50 hover:bg-indigo-50/30 transition cursor-pointer group">
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && onPdfUpload) onPdfUpload(file);
                      }}
                      disabled={uploadingPdf}
                    />
                    {uploadingPdf ? (
                      <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold py-2">
                        <IconLoader2 size={16} className="animate-spin" />
                        <span>Uploading PDF...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 py-1 text-center">
                        <IconUpload size={20} className="text-gray-400 group-hover:text-indigo-600 transition" />
                        <span className="text-xs font-bold text-gray-700 group-hover:text-indigo-700">
                          Upload PDF Document
                        </span>
                        <span className="text-[10px] text-gray-400">PDF Document</span>
                      </div>
                    )}
                  </label>
                )}
              </div>
            </div>

            {/* Bottom Guidance Field: Word Count */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">
                Word Count Statement
              </label>
              <input
                data-format-toolbar="true"
                type="text"
                value={wordsGuidance}
                onChange={(e) => handleWordsGuidanceChange(e.target.value)}
                placeholder="Write at least 150 words."
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-medium text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
              />
            </div>

            {/* ── LIVE PREVIEW: AUTHENTIC IELTS SHEET (DIRECTLY BENEATH THE FORM) ── */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <IconEye size={14} className="text-indigo-600" />
                  <span>Real-time Exam Sheet Preview (What Students See)</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <IconCheck size={12} className="stroke-[3]" />
                  <span>Matches Official IELTS Format</span>
                </span>
              </div>

              {/* Authentic Paper Container */}
              <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm font-sans select-text max-w-3xl mx-auto space-y-4">
                <div className="space-y-2">
                  <h3 className="text-base md:text-lg font-black tracking-tight text-slate-900">
                    WRITING TASK 1
                  </h3>

                  {timeGuidance && (
                    <p className="text-sm text-slate-800 font-normal leading-relaxed" dangerouslySetInnerHTML={{ __html: timeGuidance }} />
                  )}
                </div>

                {/* The Box */}
                <div className="my-4 p-5 md:p-6 border-2 border-slate-900 bg-white rounded-none shadow-2xs font-normal text-slate-900 leading-relaxed text-sm md:text-[15px] select-text">
                  {topicText ? (
                    <div
                      className="font-normal"
                      dangerouslySetInnerHTML={{ __html: previewBoxHtml }}
                    />
                  ) : (
                    <p className="italic text-gray-400 text-sm font-normal">
                      [Your question topic and instructions will appear here inside this official bordered box]
                    </p>
                  )}
                </div>

                {/* Image remains in the same light outer question sheet. */}
                {imageUrl && (
                  <ExamImageViewer src={imageUrl} embedded />
                )}

                {/* Attached PDF stimulus notice in preview */}
                {pdfUrl && (
                  <div className="my-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconFileText size={18} className="text-indigo-600" />
                      <span className="text-xs font-bold text-indigo-900">
                        Reference PDF Document Attached
                      </span>
                    </div>
                    <span className="text-xs text-indigo-600 font-semibold underline">
                      Candidates will have access to this PDF
                    </span>
                  </div>
                )}

                {wordsGuidance && (
                  <p className="text-sm text-slate-800 font-normal" dangerouslySetInnerHTML={{ __html: wordsGuidance }} />
                )}
              </div>
            </div>
          </>
        ) : (
          /* RAW HTML / ADVANCED MODE */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-700">
                Direct HTML / Markdown Code Editor
              </label>
              <button
                type="button"
                onClick={() => {
                  const compiled = compileTask1Html({
                    timeGuidance,
                    topicText,
                    wordsGuidance,
                  });
                  setRawHtml(compiled);
                  onInstructionChange(compiled);
                }}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Regenerate from Box Builder
              </button>
            </div>
            <textarea
              value={rawHtml}
              onChange={(e) => handleRawHtmlChange(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 font-mono text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-y"
            />
          </div>
        )}

        {/* ── Minimum Word Requirement & Model Answer ── */}
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Minimum Word Count
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={minWords}
                  onChange={(e) => onMinWordsChange(parseInt(e.target.value) || 150)}
                  min={50}
                  step={10}
                  className="w-full h-10 px-3 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-white font-semibold text-gray-800"
                />
                <span className="text-xs text-gray-400 font-medium">words</span>
              </div>
            </div>
          </div>

          {/* Model Answer (Optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <IconSparkles size={14} className="text-amber-500" />
                <span>Model Answer / Sample Band 9 Response (Optional)</span>
              </label>
              <span className="text-[11px] font-semibold text-gray-400">
                Word count: {countWords(modelAnswer)}
              </span>
            </div>
            <textarea
              value={modelAnswer}
              onChange={(e) => onModelAnswerChange(e.target.value)}
              placeholder="Provide a high-scoring sample essay or model response for student reference..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs bg-white font-medium text-gray-800 placeholder:text-gray-400 resize-y"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
