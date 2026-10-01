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
} from "@tabler/icons-react";

export interface WritingTask2FormProps {
  instruction: string;
  minWords: number;
  modelAnswer: string;
  onInstructionChange: (val: string) => void;
  onMinWordsChange: (val: number) => void;
  onModelAnswerChange: (val: string) => void;
}

// ─── Helpers to compile and parse IELTS Task 2 HTML ──────────────────
export function compileTask2Html({
  timeGuidance,
  leadIn,
  topicText,
  reasonsGuidance,
  wordsGuidance,
}: {
  timeGuidance: string;
  leadIn: string;
  topicText: string;
  reasonsGuidance: string;
  wordsGuidance: string;
}): string {
  // Convert line breaks in topicText to HTML paragraphs / breaklines while preserving strong/em tags
  const paragraphs = topicText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const formattedTopic =
    paragraphs.length > 0
      ? paragraphs
          .map((p) => `<p class="mb-3 last:mb-0 leading-relaxed">${p.replace(/\n/g, "<br/>")}</p>`)
          .join("\n")
      : topicText;

  return `<div class="ielts-task2-sheet font-sans select-text">
  <div class="ielts-task2-header mb-4">
    <h3 class="text-base md:text-lg font-black tracking-tight text-slate-900 mb-2">WRITING TASK 2</h3>
    ${timeGuidance ? `<p data-field="time-guidance" class="text-sm text-slate-800 font-normal mb-2">${timeGuidance}</p>` : ""}
    ${leadIn ? `<p data-field="lead-in" class="text-sm text-slate-800 font-normal leading-relaxed">${leadIn}</p>` : ""}
  </div>
  <div class="ielts-task2-box my-4 p-5 md:p-6 border-2 border-slate-900 bg-white rounded-none shadow-2xs font-normal text-slate-900 leading-relaxed text-sm md:text-[15px]">
    ${formattedTopic}
  </div>
  ${reasonsGuidance ? `<p data-field="reasons-guidance" class="text-sm text-slate-800 font-normal mt-3 mb-2 leading-relaxed">${reasonsGuidance}</p>` : ""}
  ${wordsGuidance ? `<p data-field="words-guidance" class="text-sm text-slate-800 font-normal">${wordsGuidance}</p>` : ""}
</div>`;
}

export function parseTask2Html(html: string) {
  const defaultValues = {
    timeGuidance: "You should spend about 40 minutes on this task.",
    leadIn: "Present a written argument or case to an educated reader with no specialist knowledge of the following topic.",
    topicText: "",
    reasonsGuidance: "Give reasons for your answer and include any relevant examples from your own knowledge or experience.",
    wordsGuidance: "Write at least 250 words.",
  };

  if (!html || !html.trim()) return defaultValues;

  // Check if HTML contains the structured box
  const boxMatch = html.match(
    /<div[^>]*class="[^"]*(?:ielts-task2-box|border-2 border-(?:slate|gray|black)[^"]*)"[^>]*>([\s\S]*?)<\/div>/i
  );

  if (boxMatch && boxMatch[1]) {
    const inner = boxMatch[1]
      .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
      .replace(/<p[^>]*>/gi, "")
      .replace(/<\/p>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .trim();

    const timeMatch = html.match(/data-field="time-guidance"[^>]*>([\s\S]*?)<\/p>/i);
    const leadMatch = html.match(/data-field="lead-in"[^>]*>([\s\S]*?)<\/p>/i);
    const reasonsMatch = html.match(/data-field="reasons-guidance"[^>]*>([\s\S]*?)<\/p>/i);
    const wordsMatch = html.match(/data-field="words-guidance"[^>]*>([\s\S]*?)<\/p>/i);

    return {
      timeGuidance: timeMatch ? timeMatch[1] : defaultValues.timeGuidance,
      leadIn: leadMatch ? leadMatch[1] : defaultValues.leadIn,
      topicText: inner,
      reasonsGuidance: reasonsMatch ? reasonsMatch[1] : defaultValues.reasonsGuidance,
      wordsGuidance: wordsMatch ? wordsMatch[1] : defaultValues.wordsGuidance,
    };
  }

  // Fallback for raw text: strip standard boilerplate and keep the core topic
  let cleanTopic = html;
  cleanTopic = cleanTopic.replace(/<[^>]+>/g, " ");
  cleanTopic = cleanTopic.replace(/WRITING TASK 2/gi, "");
  cleanTopic = cleanTopic.replace(/You should spend about \d+ minutes on this task\.?/gi, "");
  cleanTopic = cleanTopic.replace(
    /Present a written argument or case to an educated reader with no specialist knowledge of the following topic\.?/gi,
    ""
  );
  cleanTopic = cleanTopic.replace(/Write about the following topic:?/gi, "");
  cleanTopic = cleanTopic.replace(
    /Give reasons for your answer and include any relevant examples from your own knowledge or experience\.?/gi,
    ""
  );
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

export function WritingTask2Form({
  instruction,
  minWords,
  modelAnswer,
  onInstructionChange,
  onMinWordsChange,
  onModelAnswerChange,
}: WritingTask2FormProps) {
  const [editorMode, setEditorMode] = useState<"visual" | "raw">("visual");

  // Initial parse of instruction
  const [timeGuidance, setTimeGuidance] = useState(() => parseTask2Html(instruction).timeGuidance);
  const [leadIn, setLeadIn] = useState(() => parseTask2Html(instruction).leadIn);
  const [topicText, setTopicText] = useState(() => parseTask2Html(instruction).topicText);
  const [reasonsGuidance, setReasonsGuidance] = useState(() => parseTask2Html(instruction).reasonsGuidance);
  const [wordsGuidance, setWordsGuidance] = useState(() => parseTask2Html(instruction).wordsGuidance);
  const [rawHtml, setRawHtml] = useState(instruction);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync when instruction prop changes externally (e.g., when exam data loads)
  const [lastCompiled, setLastCompiled] = useState(instruction);
  const [prevInstruction, setPrevInstruction] = useState(instruction);

  if (instruction !== prevInstruction) {
    setPrevInstruction(instruction);
    if (instruction !== lastCompiled) {
      const parsed = parseTask2Html(instruction);
      setTimeGuidance(parsed.timeGuidance);
      setLeadIn(parsed.leadIn);
      setTopicText(parsed.topicText);
      setReasonsGuidance(parsed.reasonsGuidance);
      setWordsGuidance(parsed.wordsGuidance);
      setRawHtml(instruction);
      setLastCompiled(instruction);
    }
  }

  // Sync state changes back to parent as compiled HTML
  const notifyChange = (
    newTime: string,
    newLead: string,
    newTopic: string,
    newReasons: string,
    newWords: string
  ) => {
    const compiled = compileTask2Html({
      timeGuidance: newTime,
      leadIn: newLead,
      topicText: newTopic,
      reasonsGuidance: newReasons,
      wordsGuidance: newWords,
    });
    setLastCompiled(compiled);
    setRawHtml(compiled);
    onInstructionChange(compiled);
  };

  const handleTopicChange = (newTopic: string) => {
    setTopicText(newTopic);
    notifyChange(timeGuidance, leadIn, newTopic, reasonsGuidance, wordsGuidance);
  };

  const handleTimeChange = (newTime: string) => {
    setTimeGuidance(newTime);
    notifyChange(newTime, leadIn, topicText, reasonsGuidance, wordsGuidance);
  };

  const handleLeadInChange = (newLead: string) => {
    setLeadIn(newLead);
    notifyChange(timeGuidance, newLead, topicText, reasonsGuidance, wordsGuidance);
  };

  const handleReasonsChange = (newReasons: string) => {
    setReasonsGuidance(newReasons);
    notifyChange(timeGuidance, leadIn, topicText, newReasons, wordsGuidance);
  };

  const handleWordsGuidanceChange = (newWords: string) => {
    setWordsGuidance(newWords);
    notifyChange(timeGuidance, leadIn, topicText, reasonsGuidance, newWords);
  };

  const handleRawHtmlChange = (newRaw: string) => {
    setRawHtml(newRaw);
    setLastCompiled(newRaw);
    onInstructionChange(newRaw);
    const parsed = parseTask2Html(newRaw);
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
      // If nothing selected, insert empty tags and place cursor inside
      const newText =
        topicText.substring(0, start) + openTag + closeTag + topicText.substring(end);
      handleTopicChange(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + openTag.length, start + openTag.length);
      }, 0);
      return;
    }

    // Toggle off if already wrapped in openTag ... closeTag
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

    // Wrap selection
    const wrapped = `${openTag}${selectedText}${closeTag}`;
    const newText = topicText.substring(0, start) + wrapped + topicText.substring(end);
    handleTopicChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + wrapped.length);
    }, 0);
  };

  const handleBold = () => {
    applyTagToSelection("<strong>", "</strong>");
  };

  const handleItalic = () => {
    applyTagToSelection("<em>", "</em>");
  };

  const handleClearFormat = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selectedText = topicText.substring(start, end);

    if (!selectedText) return;

    // Strip strong, b, em, i tags
    const cleaned = selectedText
      .replace(/<\/?strong>/gi, "")
      .replace(/<\/?b>/gi, "")
      .replace(/<\/?em>/gi, "")
      .replace(/<\/?i>/gi, "")
      .replace(/<\/?u>/gi, "");

    const newText = topicText.substring(0, start) + cleaned + topicText.substring(end);
    handleTopicChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + cleaned.length);
    }, 0);
  };

  // Keyboard shortcut Ctrl+B or Cmd+B
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      handleBold();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      handleItalic();
    }
  };

  // ─── Preset Templates ──────────────────────────────────────────────
  const loadPreset = (type: "punishment" | "technology" | "traffic") => {
    if (type === "punishment") {
      const topic = `It is important for children to learn the difference between right and wrong at an early age. Punishment is necessary to help them learn this distinction.

<strong>To what extent do you agree or disagree with this opinion?</strong>

<strong>What sort of punishment should parents and teachers be allowed to use to teach good behaviour to children?</strong>`;
      setLeadIn(
        "Present a written argument or case to an educated reader with no specialist knowledge of the following topic."
      );
      setTopicText(topic);
      notifyChange(
        timeGuidance,
        "Present a written argument or case to an educated reader with no specialist knowledge of the following topic.",
        topic,
        reasonsGuidance,
        wordsGuidance
      );
    } else if (type === "technology") {
      const topic = `Some people believe that technology, particularly computers and the internet, has made children's education much more interactive and effective. Others argue that traditional classroom teaching with human instructors remains essential.

<strong>Discuss both these views and give your own opinion.</strong>`;
      setLeadIn(
        "Present a written argument or case to an educated reader with no specialist knowledge of the following topic."
      );
      setTopicText(topic);
      notifyChange(
        timeGuidance,
        "Present a written argument or case to an educated reader with no specialist knowledge of the following topic.",
        topic,
        reasonsGuidance,
        wordsGuidance
      );
    } else if (type === "traffic") {
      const topic = `In many metropolitan cities around the world, severe traffic congestion has created major problems for daily commuters and increased air pollution.

<strong>What are the primary causes of this problem?</strong>

<strong>What practical measures can governments and communities take to tackle it?</strong>`;
      setLeadIn(
        "Present a written argument or case to an educated reader with no specialist knowledge of the following topic."
      );
      setTopicText(topic);
      notifyChange(
        timeGuidance,
        "Present a written argument or case to an educated reader with no specialist knowledge of the following topic.",
        topic,
        reasonsGuidance,
        wordsGuidance
      );
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
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
              IELTS Writing Task 2
            </span>
            <span className="text-[10px] font-bold text-gray-400">Essay Task</span>
          </div>
          <h2 className="font-black text-gray-900 text-base mt-1 flex items-center gap-2">
            <IconFileText size={18} className="text-violet-600" />
            <span>Task 2 Question Maker (Authentic IELTS Format)</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Build official boxed IELTS Task 2 prompts. Text is normal font by default, and teachers can bold specific questions.
          </p>
        </div>

        {/* Editor Mode Switcher */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setEditorMode("visual")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              editorMode === "visual"
                ? "bg-white text-violet-700 shadow-2xs"
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
                ? "bg-white text-violet-700 shadow-2xs"
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
            <div className="flex flex-wrap items-center gap-2 p-3 bg-violet-50/50 rounded-xl border border-violet-100">
              <span className="text-xs font-bold text-violet-900 flex items-center gap-1">
                <IconSparkles size={14} className="text-violet-600" />
                <span>Quick IELTS Presets:</span>
              </span>
              <button
                type="button"
                onClick={() => loadPreset("punishment")}
                className="px-2.5 py-1 bg-white hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
                title="Matches the official Cambridge IELTS example"
              >
                Children Punishment & Behaviour (Agree/Disagree)
              </button>
              <button
                type="button"
                onClick={() => loadPreset("technology")}
                className="px-2.5 py-1 bg-white hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                Technology in Education (Discuss Both Views)
              </button>
              <button
                type="button"
                onClick={() => loadPreset("traffic")}
                className="px-2.5 py-1 bg-white hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                City Traffic & Pollution (Problem & Solution)
              </button>
            </div>

            {/* Top Guidance Fields: Time & Lead-in */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Time Instruction Line
                </label>
                <input
                  data-format-toolbar="true"
                  type="text"
                  value={timeGuidance}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  placeholder="You should spend about 40 minutes on this task."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-medium text-gray-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700">
                    Lead-in Instruction Line
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      handleLeadInChange(
                        "Present a written argument or case to an educated reader with no specialist knowledge of the following topic."
                      )
                    }
                    className="text-[10px] text-violet-600 hover:underline font-bold"
                  >
                    Reset Default
                  </button>
                </div>
                <input
                  data-format-toolbar="true"
                  type="text"
                  value={leadIn}
                  onChange={(e) => handleLeadInChange(e.target.value)}
                  placeholder="Present a written argument or case to an educated reader..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-medium text-gray-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none bg-white"
                />
              </div>
            </div>

            {/* ── CENTRAL IELTS QUESTION BOX EDITOR ── */}
            <div className="border-2 border-slate-900 rounded-xl overflow-hidden bg-white shadow-xs">
              {/* Box Toolbar Header */}
              <div className="px-4 py-2.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    IELTS Topic Box (Text inside the Border)
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium">
                    Normal weight by default
                  </span>
                </div>

                {/* Formatting Tools */}
                <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleBold();
                    }}
                    className="px-2.5 py-1 text-xs font-black rounded-md text-white bg-slate-700 hover:bg-violet-600 transition flex items-center gap-1 cursor-pointer"
                    title="Bold selected text (Ctrl+B)"
                  >
                    <IconBold size={13} className="stroke-[3]" />
                    <span>Bold</span>
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleItalic();
                    }}
                    className="px-2.5 py-1 text-xs font-bold rounded-md text-slate-200 hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer"
                    title="Italicize selected text (Ctrl+I)"
                  >
                    <IconItalic size={13} />
                    <span>Italic</span>
                  </button>

                  <span className="h-4 w-px bg-slate-700 mx-0.5" />

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleClearFormat();
                    }}
                    className="px-2.5 py-1 text-xs font-medium rounded-md text-slate-300 hover:bg-rose-900/60 hover:text-white transition flex items-center gap-1 cursor-pointer"
                    title="Remove formatting from selection"
                  >
                    <IconEraser size={13} />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Textarea inside the Box */}
              <div className="p-4 bg-white">
                <textarea
                  ref={textareaRef}
                  data-format-toolbar="true"
                  value={topicText}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Type the IELTS topic statements and specific questions here...

Example:
It is important for children to learn the difference between right and wrong at an early age. Punishment is necessary to help them learn this distinction.

To what extent do you agree or disagree with this opinion?

What sort of punishment should parents and teachers be allowed to use to teach good behaviour to children?`}
                  rows={8}
                  className="w-full outline-none text-sm text-gray-900 font-normal leading-relaxed placeholder:text-gray-400 bg-transparent resize-y font-sans"
                />
              </div>

              {/* Bottom formatting hint */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-gray-500">
                <div className="flex items-center gap-1.5">
                  <IconInfoCircle size={13} className="text-violet-600 shrink-0" />
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

            {/* Bottom Guidance Fields: Reasons & Word Count */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Reasons & Examples Instruction
                </label>
                <input
                  data-format-toolbar="true"
                  type="text"
                  value={reasonsGuidance}
                  onChange={(e) => handleReasonsChange(e.target.value)}
                  placeholder="Give reasons for your answer and include any relevant examples from your own knowledge or experience."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-medium text-gray-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Word Count Statement
                </label>
                <input
                  data-format-toolbar="true"
                  type="text"
                  value={wordsGuidance}
                  onChange={(e) => handleWordsGuidanceChange(e.target.value)}
                  placeholder="Write at least 250 words."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-medium text-gray-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none bg-white"
                />
              </div>
            </div>

            {/* ── LIVE PREVIEW: AUTHENTIC IELTS SHEET (MATCHES USER IMAGE) ── */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <IconEye size={14} className="text-violet-600" />
                  <span>Real-time Exam Sheet Preview (What Students See)</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <IconCheck size={12} className="stroke-[3]" />
                  <span>Matches Official IELTS Format</span>
                </span>
              </div>

              {/* Authentic Paper Container */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border-2 border-gray-300 shadow-sm font-sans select-text max-w-3xl mx-auto space-y-4">
                <div className="space-y-3">
                  <h3 className="text-base md:text-lg font-black tracking-tight text-slate-900">
                    WRITING TASK 2
                  </h3>

                  {timeGuidance && (
                    <p className="text-sm text-slate-800 font-normal leading-relaxed" dangerouslySetInnerHTML={{ __html: timeGuidance }} />
                  )}

                  {leadIn && (
                    <p className="text-sm text-slate-800 font-normal leading-relaxed" dangerouslySetInnerHTML={{ __html: leadIn }} />
                  )}
                </div>

                {/* The Box */}
                <div className="my-5 p-5 md:p-6 border-2 border-slate-900 bg-white rounded-none shadow-2xs font-normal text-slate-900 leading-relaxed text-sm md:text-[15px] select-text">
                  {topicText ? (
                    <div
                      className="font-normal"
                      dangerouslySetInnerHTML={{ __html: previewBoxHtml }}
                    />
                  ) : (
                    <p className="italic text-gray-400 text-sm font-normal">
                      [Your question topic and questions will appear here inside this official bordered box]
                    </p>
                  )}
                </div>

                {reasonsGuidance && (
                  <p className="text-sm text-slate-800 font-normal leading-relaxed" dangerouslySetInnerHTML={{ __html: reasonsGuidance }} />
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
                  const compiled = compileTask2Html({
                    timeGuidance,
                    leadIn,
                    topicText,
                    reasonsGuidance,
                    wordsGuidance,
                  });
                  setRawHtml(compiled);
                  onInstructionChange(compiled);
                }}
                className="text-xs font-bold text-violet-600 hover:underline"
              >
                Regenerate from Box Builder
              </button>
            </div>
            <textarea
              value={rawHtml}
              onChange={(e) => handleRawHtmlChange(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none text-xs font-mono bg-slate-900 text-slate-100 placeholder:text-gray-500 resize-y"
            />
          </div>
        )}

        {/* Minimum Word Count Setting */}
        <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">
              Minimum Word Count Requirement
            </label>
            <input
              type="number"
              min={100}
              max={1000}
              value={minWords}
              onChange={(e) => onMinWordsChange(parseInt(e.target.value) || 250)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none bg-white"
            />
            <p className="text-[10px] text-gray-400 font-medium">
              Standard for IELTS Task 2 is 250 words.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-700">
                Model Answer <span className="text-gray-400 font-medium">(Teacher reference only)</span>
              </label>
              {modelAnswer.trim() && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    countWords(modelAnswer) >= minWords
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : "bg-amber-50 text-amber-600 border border-amber-100"
                  }`}
                >
                  {countWords(modelAnswer)} / {minWords} words
                </span>
              )}
            </div>
            <textarea
              value={modelAnswer}
              onChange={(e) => onModelAnswerChange(e.target.value)}
              placeholder="Provide a reference band 9 model essay for teacher grading guidance..."
              rows={4}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-medium text-gray-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none bg-white resize-y"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default WritingTask2Form;
