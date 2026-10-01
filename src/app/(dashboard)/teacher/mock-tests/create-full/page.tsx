/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/jsx-no-comment-textnodes */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { mockTestService } from "@/services/mocktest.services";
import { getNextMockTestTitle } from "@/lib/mockTestNaming";
import { listeningService } from "@/services/listening.services";
import { readingService } from "@/services/reading.services";
import { writingService } from "@/services/writing.services";
import { speakingService } from "@/services/speaking.services";
import { toast } from "sonner";
import Link from "next/link";
import {
  IconArrowLeft,
  IconTrophy,
  IconHeadset,
  IconBook2,
  IconPencil,
  IconMicrophone,
  IconLoader2,
  IconSparkles,
  IconPlus,
  IconTrash,
  IconAlertCircle,
  IconFileText,
  IconCheck,
  IconLock,
  IconSettings,
  IconBold,
  IconTable,
  IconUpload,
  IconCircleCheck,
  IconInfoCircle,
  IconNotebook,
  IconClock,
  IconEdit,
  IconEye,
  IconArrowRight,
  IconPhoto,
  IconArticle,
  IconBrandYoutube,
  IconFileMusic,
  IconCloudUpload,
  IconChartBar,
  IconWriting,
  IconCrown,
} from "@tabler/icons-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import VisualNotesBuilder from "@/components/shared/VisualNotesBuilder";
import VisualTableBuilder from "@/components/shared/VisualTableBuilder";
import { parseGroupInstruction, areInstructionsCompatible, mergeQuestionGroups } from "@/lib/utils";
import WritingTask1Form from "@/components/Writing/WritingTask1Form";
import WritingTask2Form from "@/components/Writing/WritingTask2Form";
import { SpeakingQuestionPaper } from "@/components/Speaking/SpeakingQuestionPaper";
import { SpeakingCueCardBuilder } from "@/components/Speaking/SpeakingCueCardBuilder";
import { FullMockTestPreview, type MockPreviewMode } from "@/components/MockTest/FullMockTestPreview";
import { ReadingSectionTabs } from "@/components/Reading/ReadingSectionTabs";
import { FloatingSelectionToolbar } from "@/components/shared/FloatingSelectionToolbar";
import { ListeningCreatorWorkspace } from "@/app/(dashboard)/teacher/listening/create/page";
import { ReadingCreatorWorkspace } from "@/app/(dashboard)/teacher/dashboard/page";

// --- Types ---
type TabType = "listening" | "reading" | "writing" | "speaking";

function getNumberWord(n: number): string {
  const words: Record<number, string> = {
    1: "ONE",
    2: "TWO",
    3: "THREE",
    4: "FOUR",
    5: "FIVE",
  };
  return words[n] || String(n);
}

// --- IELTS Reading Question Types ---
const readingQuestionTypes = [
  { code: "R-MCQ", title: "Multiple Choice (Single Answer — Choose 1)", desc: "Standard MCQ with one single correct answer.", type: "MULTIPLE_CHOICE" },
  { code: "R-MMCQ", title: "Multiple Choice (Choose 2 or 3 Letters)", desc: "Choose TWO or THREE correct answers from list options (e.g. A–E or A–G).", type: "MULTIPLE_CHOICE_MULTIPLE" },
  { code: "R-TFN", title: "True / False / Not Given", desc: "Identify if statements agree with factual passage details.", type: "TRUE_FALSE_NOT_GIVEN" },
  { code: "R-YNN", title: "Yes / No / Not Given", desc: "Identify if statements agree with the writer's opinions/views.", type: "YES_NO_NOT_GIVEN" },
  { code: "R-MHDG", title: "List of Headings", desc: "Add a heading list, then choose the correct heading for each paragraph.", type: "MATCHING_HEADINGS" },
  { code: "R-MINF", title: "Matching Information", desc: "Decide which paragraph/section contains specific details.", type: "MATCHING_INFORMATION" },
  { code: "R-NMATCH", title: "Name Matching", desc: "Match each statement with the correct person or people from a named list.", type: "MATCHING_FEATURES" },
  { code: "R-MFT", title: "Matching Features", desc: "Match options/names with details or findings.", type: "MATCHING_FEATURES" },
  { code: "R-MSE", title: "Matching Sentence Endings", desc: "Complete sentences by matching with correct endings.", type: "MATCHING_SENTENCE_ENDINGS" },
  { code: "R-SCOMP", title: "Sentence Completion", desc: "Fill in blanks at the end of sentences.", type: "SENTENCE_COMPLETION" },
  { code: "R-SCO", title: "Summary Completion (With Options)", desc: "Complete summary using words from a provided options list.", type: "SUMMARY_COMPLETION_WITH_OPTIONS" },
  { code: "R-SCWO", title: "Summary Completion (Without Options)", desc: "Complete summary using direct words from the text.", type: "SUMMARY_COMPLETION_WITHOUT_OPTIONS" },
  { code: "R-NCOMP", title: "Notes Completion", desc: "Complete a notes outline with missing words.", type: "NOTES_COMPLETION" },
  { code: "R-TABLE", title: "Table Completion", desc: "Complete table cells with matching words/phrases.", type: "TABLE_COMPLETION" },
  { code: "R-FLOW", title: "Flow Chart Completion", desc: "Label stages of a sequence in a flowchart.", type: "FLOW_CHART_COMPLETION" },
  { code: "R-DIAG", title: "Diagram Label Completion", desc: "Label parts of a diagram or illustration.", type: "DIAGRAM_LABELLING" },
  { code: "R-SAQ", title: "Short Answer Questions", desc: "Answer comprehension questions in a few words.", type: "SHORT_ANSWER" }
];

// --- IELTS Listening Question Types ---
const QUESTION_GROUP_TYPES = [
  { value: "SENTENCE_COMPLETION", label: "Sentence Completion" },
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice (Radio)" },
  { value: "MULTIPLE_CHOICE_MULTIPLE", label: "Multiple Choice (Checkbox)" },
  { value: "MATCHING_FEATURES", label: "Matching Features (Checkbox Grid)" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "TABLE_COMPLETION", label: "Table Completion" },
  { value: "FLOW_CHART_COMPLETION", label: "Flow Chart Completion" },
  { value: "DIAGRAM_LABELLING", label: "Diagram / Map Labelling" },
  { value: "SUMMARY_COMPLETION", label: "Summary Completion" },
  { value: "NOTES_COMPLETION", label: "Notes Completion" },
];

interface ReadingQuestionItem {
  id: string;
  passageIndex: number; // 1, 2, or 3
  type: string;
  typeCode: string;
  questionNumber: number;
  text: string;
  instruction: string;
  correctAnswer: string;
  explanation?: string;
  options?: string[];
  groupOptions?: string[];
  passageSegment?: string;
  groupImageUrl?: string;
}

interface PassageData {
  title: string;
  body: string;
  instruction?: string;
  pdf: { name: string; size: string; url: string } | null;
  image: string | null;
  imageName: string;
}

// --- Format Input Component (Bold feature for Listening) ---
interface FormatInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

function FormatInput({ value, onChange, placeholder, className }: FormatInputProps) {
  const ref = useRef<HTMLInputElement>(null);

  const handleBold = () => {
    const input = ref.current;
    if (!input) return;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const selectedText = value.substring(start, end);
    const replacement = `**${selectedText}**`;
    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + 2, start + 2 + selectedText.length);
    }, 0);
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className || "w-full h-9 px-3 border border-gray-300 rounded focus:border-[#1B3A6B] text-xs bg-white pr-10 font-semibold text-gray-800"}
      />
      <button
        type="button"
        onClick={handleBold}
        className="absolute right-2 top-1.5 text-indigo-400 hover:text-[#1B3A6B] transition p-1 cursor-pointer"
        title="Bold selection"
      >
        <IconBold size={14} className="stroke-[3]" />
      </button>
    </div>
  );
}

// --- Format Textarea Component (Bold feature for Listening) ---
interface FormatTextareaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

function FormatTextarea({ value, onChange, placeholder, rows = 3, className }: FormatTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleBold = () => {
    const textarea = ref.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selectedText = value.substring(start, end);
    const replacement = `**${selectedText}**`;
    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2 + selectedText.length);
    }, 0);
  };

  return (
    <div className="relative flex flex-col w-full font-sans">
      <div className="flex justify-end mb-1">
        <button
          type="button"
          onClick={handleBold}
          className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-[#1B3A6B] bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition cursor-pointer"
          title="Bold selection"
        >
          <IconBold size={11} className="stroke-[3]" />
          <span>Bold</span>
        </button>
      </div>
      <textarea
        ref={ref}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className || "w-full p-2 border border-gray-300 rounded focus:border-[#1B3A6B] text-xs bg-white font-semibold text-gray-800 leading-relaxed"}
      />
    </div>
  );
}

// --- Reading Replica Specific Rich Input Toolbar & Field Helpers ---
interface ReadFormatToolbarProps {
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  value: string;
  onChange: (val: string) => void;
  label?: string;
}

function ReadFormatToolbar({ inputRef, value, onChange, label }: ReadFormatToolbarProps) {
  const handleBold = () => {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const selectedText = value.substring(start, end);
    const replacement = `**${selectedText}**`;
    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);
    
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + 2, start + 2 + selectedText.length);
    }, 0);
  };

  return (
    <div className="flex justify-between items-center mb-1">
      {label && (
        <label className="text-[10px] font-bold text-indigo-755 uppercase tracking-widest block font-bold">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={handleBold}
        className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded hover:bg-indigo-100 transition-all duration-150 shrink-0 cursor-pointer"
        title="Make selected text bold"
      >
        <IconBold size={12} className="stroke-[3]" />
        <span>Bold</span>
      </button>
    </div>
  );
}

interface ReadFormatInputProps {
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  required?: boolean;
}

function ReadFormatInput({ inputRef, value, onChange, placeholder, required }: ReadFormatInputProps) {
  const handleBold = () => {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const selectedText = value.substring(start, end);
    const replacement = `**${selectedText}**`;
    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);
    
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + 2, start + 2 + selectedText.length);
    }, 0);
  };

  return (
    <div className="relative flex items-start w-full">
      <textarea
        ref={inputRef}
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full text-xs font-semibold pl-3 pr-8 py-2 border border-indigo-100 rounded-lg focus:outline-hidden focus:border-indigo-400 text-black placeholder:text-gray-400 bg-white resize-y"
      />
      <button
        type="button"
        onClick={handleBold}
        className="absolute right-2 top-2 text-indigo-400 hover:text-indigo-600 transition-colors p-1 cursor-pointer"
        title="Bold"
      >
        <IconBold size={12} className="stroke-[3]" />
      </button>
    </div>
  );
}

interface ReadIeltsHeaderInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

function ReadIeltsHeaderInput({ value, onChange, placeholder, className }: ReadIeltsHeaderInputProps) {
  const ref = useRef<HTMLInputElement>(null);

  const handleBold = () => {
    const input = ref.current;
    if (!input) return;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const selectedText = value.substring(start, end);
    const replacement = `**${selectedText}**`;
    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + 2, start + 2 + selectedText.length);
    }, 0);
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className || "w-full text-xs font-semibold px-3 py-2 border border-indigo-100 rounded-lg focus:outline-hidden focus:border-indigo-400 text-black placeholder:text-gray-400 bg-white pr-8"}
      />
      <button
        type="button"
        onClick={handleBold}
        className="absolute right-2 top-2.5 text-indigo-400 hover:text-indigo-600 transition-colors p-1 cursor-pointer"
        title="Bold"
      >
        <IconBold size={12} className="stroke-[3]" />
      </button>
    </div>
  );
}




function getPlaceholderNumbers(value: string): number[] {
  const matches: number[] = [];
  const regex = /(?:\[\s*(\d+)\s*\]|\b(\d+)\s*(?:\.{3,}|_{2,}))/g;
  let match;
  while ((match = regex.exec(value)) !== null) {
    const num = Number(match[1] || match[2]);
    if (!isNaN(num)) matches.push(num);
  }
  return Array.from(new Set(matches)).sort((a, b) => a - b);
}

// --- Interfaces for Listening State ---
interface ListeningQuestion {
  questionNumber: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface ListeningQuestionGroup {
  type: string;
  instruction: string;
  passageSegment: string;
  options: string[];
  imageUrl: string;
  order: number;
  questions: ListeningQuestion[];
}

interface ListeningSection {
  title: string;
  audioUrl: string;
  youtubeUrl: string;
  script: string;
  instruction: string;
  order: number;
  questionGroups: ListeningQuestionGroup[];
}

interface ListeningExamForm {
  title: string;
  description: string;
  duration: number;
  isPublished: boolean;
  audioUrl: string;
  youtubeUrl: string;
  sections: ListeningSection[];
}

const getBlankSectionState = (order: number, title: string, prePopulate = false): ListeningSection => {
  const startQNum = (order - 1) * 10 + 1;
  return {
    title,
    audioUrl: "",
    youtubeUrl: "",
    script: "",
    instruction: "Write answers to the questions below",
    order,
    questionGroups: prePopulate
      ? [
          {
            type: "SENTENCE_COMPLETION",
            instruction: "Complete the sentences below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER.",
            passageSegment: "",
            options: [],
            imageUrl: "",
            order: 1,
            questions: Array.from({ length: 4 }, (_, idx) => ({
              questionNumber: startQNum + idx,
              questionText: "",
              options: [],
              correctAnswer: "",
              explanation: "",
            })),
          },
        ]
      : [],
  };
};

function convertMarkdownToHtml(text: string): string {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-black">$1</strong>');
  const paragraphs = html.split(/\n\s*\n/);
  const formattedParagraphs = paragraphs.map(p => {
    const lines = p.split(/\n/);
    return `<p class="mb-4 text-justify leading-relaxed text-gray-800">${lines.map(l => l.trim()).filter(Boolean).join(' ')}</p>`;
  });
  return formattedParagraphs.join("");
}

function htmlPassageToEditableText(value: string): string {
  if (!value || !/<\/?[a-z][\s\S]*>/i.test(value) || typeof window === "undefined") return value;
  const documentNode = new DOMParser().parseFromString(value, "text/html");
  documentNode.body.querySelectorAll("br").forEach((lineBreak) => lineBreak.replaceWith("\n"));
  const blocks = Array.from(documentNode.body.children)
    .map((element) => element.textContent?.replace(/\u00a0/g, " ").trim() || "")
    .filter(Boolean);
  return (blocks.length > 0 ? blocks.join("\n\n") : documentNode.body.textContent || "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// --- Demo Template Data ---
const demoTemplateData = {
  title: "IELTS Premium CBT Practice Mock Test - Vol 1",
  description: "A complete IELTS Academic CBT Simulation featuring Listening, Reading, Writing, and Speaking modules. Modeled on official test formats.",
  isPublished: true,
  isPremium: true,
  listeningExam: {
    title: "IELTS Academic Listening Simulation Exam",
    description: "IELTS Listening CBT Exam with 4 Sections and 40 questions.",
    duration: 30,
    sections: [
      {
        title: "Section 1: Rental Inquiry",
        audioUrl: "https://res.cloudinary.com/demo/video/upload/cbt_listening_s1.mp3",
        order: 1,
        instruction: "Questions 1-4. Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER.",
        questionGroups: [
          {
            type: "NOTES_COMPLETION",
            instruction: "Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
            passageSegment: "Rental Details Form\n- Name: Arthur [1]\n- Contact Number: 07412 [2]\n- Move-in date: [3] October\n- Room Type: [4] room",
            options: [],
            imageUrl: "",
            order: 1,
            questions: [
              { questionNumber: 1, questionText: "Name Arthur...", correctAnswer: "Pendelton", explanation: "The speaker states his name is Arthur Pendelton." },
              { questionNumber: 2, questionText: "Contact Number 07412...", correctAnswer: "558912", explanation: "He spells out the contact phone number." },
              { questionNumber: 3, questionText: "Move-in date...", correctAnswer: "15", explanation: "He mentions moving in on October 15th." },
              { questionNumber: 4, questionText: "Preferred Room Type...", correctAnswer: "single", explanation: "Arthur specifies he only needs a single room." },
            ],
          },
        ],
      },
      {
        title: "Section 2: Town Park Renovation Project",
        audioUrl: "https://res.cloudinary.com/demo/video/upload/cbt_listening_s2.mp3",
        order: 2,
        instruction: "Questions 5-6. Multiple Choice questions.",
        questionGroups: [
          {
            type: "MULTIPLE_CHOICE",
            instruction: "Choose the correct letter, A, B or C.",
            passageSegment: "",
            options: [],
            imageUrl: "",
            order: 1,
            questions: [
              {
                questionNumber: 5,
                questionText: "What will be built in the town park next spring?",
                options: ["A skate park", "A community garden", "A water fountain"],
                correctAnswer: "A community garden",
                explanation: "The speaker outlines the new community garden addition."
              },
            ],
          },
        ],
      },
    ],
  },
  readingExam: {
    title: "IELTS Academic Reading Simulation Exam",
    description: "IELTS Reading CBT Exam with 3 Passages and 40 questions.",
    duration: 60,
    passages: [
      {
        title: "Passage 1: The Evolution of Coral Reefs",
        order: 1,
        instruction: "You should spend about 20 minutes on Questions 1-3.",
        body: `Coral reefs are some of the most diverse ecosystems on Earth. Often called the 'rainforests of the sea', they occupy less than 0.1% of the world's ocean surface but provide a home for at least 25% of all marine species. Reefs are built by colonies of coral polyps held together by calcium carbonate. Most reefs grow best in warm, shallow, clear, and sunny waters. Over the last century, however, rising sea temperatures and acidification have placed these delicate marine nurseries under unprecedented stress. Researchers are now developing hardier 'super corals' using selective breeding in laboratory environments to help bolster wild reefs.`,
        pdfUrl: "",
        imageUrl: "",
        questionGroups: [
          {
            type: "TRUE_FALSE_NOT_GIVEN",
            instruction: "Do the following statements agree with the information given in Reading Passage 1?",
            passageSegment: "",
            options: [],
            imageUrl: "",
            order: 1,
            questions: [
              { questionNumber: 1, questionText: "Coral reefs support more than a quarter of all marine species.", correctAnswer: "FALSE", explanation: "The text says 'at least 25%' which is not 'more than a quarter' (which would mean strictly > 25%)." },
              { questionNumber: 2, questionText: "Coral polyps require cold water environments to build calcium carbonate skeletons.", correctAnswer: "FALSE", explanation: "The text states they 'grow best in warm, shallow' waters." },
              { questionNumber: 3, questionText: "Scientists have already released genetically modified super corals into the wild.", correctAnswer: "NOT GIVEN", explanation: "The text says they are developing them in laboratory environments, but does not state if they have been released into the wild yet." },
            ],
          },
        ],
      },
    ],
  },
  writingExam: {
    title: "IELTS Academic Writing Simulation Exam",
    description: "IELTS Writing CBT Exam with Task 1 and Task 2.",
    duration: 60,
    examType: "ACADEMIC" as const,
    tasks: [
      {
        taskType: "TASK_1" as const,
        order: 1,
        instruction: "The chart below shows the percentage of households with internet access in three European countries between 2018 and 2024. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
        minWords: 150,
        modelAnswer: "The bar chart illustrates the proportions of households with internet connection across three countries in Europe (Germany, France, and Spain) over a seven-year period from 2018 to 2024...",
        imageUrl: "https://res.cloudinary.com/demo/image/upload/cbt_writing_stimulus.png",
        pdfUrl: "",
      },
      {
        taskType: "TASK_2" as const,
        order: 2,
        instruction: "Some people believe that the most effective way to address environmental pollution is through rising prices on fuel and consumer goods. Others argue that government regulations on industries are more effective. Discuss both views and give your opinion. Write at least 250 words.",
        minWords: 250,
        modelAnswer: "It is widely debated whether increasing costs of consumer commodities and fuel or implementing stringent legislative measures on industrial operations is the superior approach to mitigating pollution...",
        imageUrl: "",
        pdfUrl: "",
      },
    ],
  },
  speakingExam: {
    title: "IELTS Speaking Simulation Exam",
    description: "IELTS Speaking CBT Exam with Part 1, Part 2, and Part 3.",
    duration: 15,
    parts: [
      {
        partNumber: 1,
        title: "Part 1: Introduction & Interview",
        order: 1,
        instruction: "The examiner asks the candidate about him/herself, his/her home, work or studies and other familiar topics.",
        preparationTime: 0,
        speakingTime: 60,
        questions: [
          { order: 1, questionText: "Let's talk about your hometown. Where is your hometown located?", audioUrl: "https://res.cloudinary.com/demo/video/upload/cbt_speaking_q1.mp3" },
          { order: 2, questionText: "What do you like most about your hometown?", audioUrl: null },
          { order: 3, questionText: "Would you say it is a good place for young people to live?", audioUrl: null },
        ],
      },
      {
        partNumber: 2,
        title: "Part 2: Individual Long Turn (Cue Card)",
        order: 2,
        instruction: "Describe a book you read recently that you found useful.\nYou should say:\n- What book it is\n- Why you decided to read it\n- What it is about\nand explain why you found this book useful.",
        preparationTime: 60,
        speakingTime: 120,
        questions: [
          { order: 1, questionText: "Describe a book you read recently that you found useful.", audioUrl: null },
        ],
      },
      {
        partNumber: 3,
        title: "Part 3: Discussion (Abstract Questions)",
        order: 3,
        instruction: "The examiner and candidate discuss issues related to the topic in Part 2 in a more general and abstract way.",
        preparationTime: 0,
        speakingTime: 60,
        questions: [
          { order: 1, questionText: "Why do you think some people prefer physical books over digital screens?", audioUrl: null },
          { order: 2, questionText: "In what ways has technology altered the reading habits of the younger generation?", audioUrl: null },
        ],
      },
    ],
  },
};

// ─── Word Count Helper ──────────────────────────────────────────
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

interface WriteTaskPanelProps {
  task: any;
  taskIdx: number;
  examType: "ACADEMIC" | "GENERAL_TRAINING";
  onTaskChange: (taskIdx: number, field: string, val: any) => void;
  onImageUpload: (taskIdx: number, file: File) => void;
  onPdfUpload: (taskIdx: number, file: File) => void;
  uploadingImage: number | null;
  uploadingPdf: number | null;
}

function WriteTaskPanel({
  task,
  taskIdx,
  examType,
  onTaskChange,
  onImageUpload,
  onPdfUpload,
  uploadingImage,
  uploadingPdf,
}: WriteTaskPanelProps) {
  const isTask1 = taskIdx === 0;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleBold = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selectedText = task.instruction.substring(start, end);
    const replacement = `<strong>${selectedText}</strong>`;
    const newValue = task.instruction.substring(0, start) + replacement + task.instruction.substring(end);
    onTaskChange(taskIdx, "instruction", newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 8, start + 8 + selectedText.length);
    }, 0);
  };

  const focusClasses = isTask1
    ? "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
    : "focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20";
  const taskLabel = isTask1
    ? examType === "ACADEMIC"
      ? "Task 1 — Describe a Chart, Graph, or Diagram"
      : "Task 1 — Write a Letter"
    : "Task 2 — Write an Essay";
  const taskDescription = isTask1
    ? examType === "ACADEMIC"
      ? "Candidates describe, summarise, or explain information from a visual representation (graph, table, chart, diagram, or map). Minimum 150 words in about 20 minutes."
      : "Candidates write a letter in response to a given situation. Minimum 150 words in about 20 minutes."
    : "Candidates write an essay in response to a point of view, argument, or problem. Minimum 250 words in about 40 minutes.";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
      {/* Task Header */}
      <div
        className={`px-6 py-4 border-b border-gray-100 ${
          isTask1
            ? "bg-gradient-to-r from-indigo-50 to-white"
            : "bg-gradient-to-r from-violet-50 to-white"
        }`}
      >
        <h4 className="font-black text-gray-900 text-sm flex items-center gap-2">
          {isTask1 ? (
            <IconChartBar size={18} className="text-indigo-600" />
          ) : (
            <IconWriting size={18} className="text-violet-600" />
          )}
          {taskLabel}
        </h4>
        <p className="text-xs text-gray-500 mt-1 font-medium max-w-2xl">
          {taskDescription}
        </p>
      </div>

      <div className="p-6 space-y-5">
        {/* Instruction / Prompt */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-gray-700">
              Task Instruction / Prompt <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleBold}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                isTask1
                  ? "text-indigo-700 bg-indigo-50 border-indigo-150 hover:bg-indigo-100"
                  : "text-violet-700 bg-violet-50 border-violet-150 hover:bg-violet-100"
              }`}
              title="Wrap selection in HTML bold tags"
            >
              <IconBold size={12} className="stroke-[3]" />
              <span>Bold Selection</span>
            </button>
          </div>
          <textarea
            ref={textareaRef}
            value={task.instruction}
            onChange={(e) =>
              onTaskChange(taskIdx, "instruction", e.target.value)
            }
            placeholder={
              isTask1
                ? "e.g. The graph below shows the number of visitors to three London museums between 2000 and 2010.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant."
                : "e.g. Some people believe that children should be allowed to stay at home and play until they are six or seven years old. Others believe that it is important for young children to go to school as soon as possible.\n\nDiscuss both these views and give your own opinion."
            }
            rows={6}
            className={`w-full px-4 py-3 border border-gray-300 rounded-xl ${focusClasses} outline-none text-sm bg-white font-medium text-gray-800 placeholder:text-gray-400 resize-y transition-all`}
          />
          <div className="flex items-center gap-1 mt-1.5">
            <IconInfoCircle size={12} className="text-gray-400" />
            <p className="text-[11px] text-gray-400 font-medium">
              This is the question students will see during the exam.
            </p>
          </div>
        </div>

        {/* Image Upload */}
        {isTask1 && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Visual Stimulus (Chart / Graph / Diagram / Map)
            </label>

            {task.imageUrl ? (
              <div className="relative group rounded-xl overflow-hidden border-2 border-indigo-100 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={task.imageUrl}
                  alt="Task 1 Visual Stimulus"
                  className="w-full max-h-72 object-contain bg-white p-2"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onTaskChange(taskIdx, "imageUrl", "")}
                    className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-1.5 hover:bg-rose-700 transition cursor-pointer"
                  >
                    <IconTrash size={14} />
                    Remove Image
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-200 group">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onImageUpload(taskIdx, file);
                  }}
                  disabled={uploadingImage === taskIdx}
                />
                {uploadingImage === taskIdx ? (
                  <div className="flex flex-col items-center gap-2">
                    <IconLoader2
                      size={28}
                      className="animate-spin text-indigo-500"
                    />
                    <span className="text-xs font-bold text-indigo-600">
                      Uploading image...
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <IconPhoto
                        size={22}
                        className="text-indigo-500"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-gray-700">
                        Click to upload chart/graph image
                      </p>
                      <p className="text-[10px] text-gray-450 font-medium mt-0.5">
                        PNG, JPG, or WebP — max 10 MB
                      </p>
                    </div>
                  </div>
                )}
              </label>
            )}
          </div>
        )}

        {/* PDF Upload */}
        {isTask1 && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              PDF Stimulus (optional alternative)
            </label>

            {task.pdfUrl ? (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <IconFileText size={20} className="text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-emerald-800 truncate">
                    PDF uploaded
                  </p>
                  <a
                    href={task.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-emerald-600 hover:underline font-medium"
                  >
                    View PDF →
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => onTaskChange(taskIdx, "pdfUrl", "")}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                >
                  <IconTrash size={14} />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group">
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onPdfUpload(taskIdx, file);
                  }}
                  disabled={uploadingPdf === taskIdx}
                />
                {uploadingPdf === taskIdx ? (
                  <>
                    <IconLoader2
                      size={18}
                      className="animate-spin text-indigo-500"
                    />
                    <span className="text-xs font-bold text-indigo-600">
                      Uploading PDF...
                    </span>
                  </>
                ) : (
                  <>
                    <IconUpload
                      size={18}
                      className="text-gray-400 group-hover:text-indigo-500 transition"
                    />
                    <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-800 transition">
                      Upload PDF stimulus
                    </span>
                  </>
                )}
              </label>
            )}
          </div>
        )}

        {/* Min Words */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Minimum Word Count
            </label>
            <input
              type="number"
              value={task.minWords}
              onChange={(e) =>
                onTaskChange(
                  taskIdx,
                  "minWords",
                  parseInt(e.target.value) || (isTask1 ? 150 : 250)
                )
              }
              min={1}
              className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-white font-semibold text-gray-800 transition-all"
            />
            <p className="text-[10px] text-gray-400 font-medium mt-1">
              Standard: {isTask1 ? "150 words" : "250 words"}
            </p>
          </div>
        </div>

        {/* Model Answer */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-gray-700">
              Model Answer{" "}
              <span className="text-gray-400 font-medium">
                (teacher reference only)
              </span>
            </label>
            {task.modelAnswer.trim() && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  countWords(task.modelAnswer) >= task.minWords
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : "bg-amber-50 text-amber-600 border border-amber-100"
                }`}
              >
                {countWords(task.modelAnswer)} / {task.minWords} words
              </span>
            )}
          </div>
          <textarea
            value={task.modelAnswer}
            onChange={(e) =>
              onTaskChange(taskIdx, "modelAnswer", e.target.value)
            }
            placeholder="Optionally provide a model answer for reference. This is hidden from students."
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-white font-medium text-gray-800 placeholder:text-gray-400 resize-y transition-all leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}

const FULL_MOCK_DRAFT_KEY = "ielts-full-mock-creator-draft-v1";

interface FullMockDraftState {
  mockTitle: string;
  mockDescription: string;
  isPublished: boolean;
  isPremium?: boolean;
  activeTab: TabType;
  sharedListeningExam: any;
  sharedReadingExam: any;
  writeTitle: string;
  writeDesc: string;
  writeExamType: "ACADEMIC" | "GENERAL_TRAINING";
  writeDuration: number;
  writingTasks: any[];
  speakTitle: string;
  speakDesc: string;
  speakDuration: number;
  speakingParts: any[];
}

function isFullMockDraftEmpty(draft: Partial<FullMockDraftState>): boolean {
  if (!draft) return true;
  const hasCustomTitle = Boolean(draft.mockTitle?.trim());
  const hasCustomDesc = Boolean(
    draft.mockDescription?.trim() &&
    draft.mockDescription.trim() !==
      "A complete Cambridge IELTS-style Academic mock test combining Listening, Reading, Writing, and Speaking modules under realistic exam conditions."
  );
  const hasListening = Boolean(draft.sharedListeningExam);
  const hasReading = Boolean(draft.sharedReadingExam);
  const hasWritingContent = Boolean(
    draft.writingTasks &&
      draft.writingTasks.some(
        (t) => Boolean(t?.instruction?.trim() || t?.imageUrl || t?.pdfUrl || t?.modelAnswer?.trim())
      )
  );
  const hasSpeakingContent = Boolean(
    draft.speakingParts &&
      draft.speakingParts.some(
        (p) =>
          Boolean(
            p?.questions &&
              p.questions.some(
                (q: any) =>
                  Boolean(q?.questionText?.trim() && q.questionText !== "Cue Card Long Turn Response")
              )
          )
      )
  );

  return !hasCustomTitle && !hasCustomDesc && !hasListening && !hasReading && !hasWritingContent && !hasSpeakingContent;
}

export default function CreateFullMockTestPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>("listening");
  const [mockPreviewMode, setMockPreviewMode] = useState<MockPreviewMode | null>(null);
  const [sharedListeningExam, setSharedListeningExam] = useState<any>(null);
  const [sharedReadingExam, setSharedReadingExam] = useState<any>(null);
  const showLegacyModuleBuilders = false;

  // Global Mock Test Meta
  const [mockTitle, setMockTitle] = useState("");
  const [mockDescription, setMockDescription] = useState("A complete Cambridge IELTS-style Academic mock test combining Listening, Reading, Writing, and Speaking modules under realistic exam conditions.");
  const [isPublished, setIsPublished] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  const existingMockTestsQuery = useQuery({
    queryKey: ["mock-tests-for-next-title"],
    queryFn: () => mockTestService.getAllMockTests(),
  });

  const resolvedMockTitle = mockTitle || getNextMockTestTitle(existingMockTestsQuery.data?.data ?? []);

  // ==========================================================
  // 1. Listening States & Handlers (Exactly like standalone)
  // ==========================================================
  const [listeningFormState, setListeningFormState] = useState<ListeningExamForm>({
    title: "Cambridge IELTS Academic Listening Practice Test 1",
    description: "A Cambridge IELTS-style Listening test with four sections and realistic computer-based question types.",
    duration: 30,
    isPublished: false,
    audioUrl: "",
    youtubeUrl: "",
    sections: [
      getBlankSectionState(1, "Section 1", true),
      getBlankSectionState(2, "Section 2", true),
      getBlankSectionState(3, "Section 3", true),
      getBlankSectionState(4, "Section 4", true),
    ],
  });

  const [activeListeningSectionIdx, setActiveListeningSectionIdx] = useState(0);
  const [uploadingListeningAudio, setUploadingListeningAudio] = useState(false);
  const [uploadingListeningGroupImage, setUploadingListeningGroupImage] = useState<{ sectionIdx: number; groupIdx: number } | null>(null);

  const handleListeningInputChange = (field: keyof ListeningExamForm, val: any) => {
    setListeningFormState((prev) => ({ ...prev, [field]: val }));
  };

  const handleListeningSectionChange = (sectionIdx: number, field: keyof ListeningSection, val: any) => {
    setListeningFormState((prev) => {
      const nextSecs = [...prev.sections];
      nextSecs[sectionIdx] = { ...nextSecs[sectionIdx], [field]: val };
      return { ...prev, sections: nextSecs };
    });
  };

  const addListeningQuestionGroup = (sectionIdx: number) => {
    setListeningFormState((prev) => {
      const nextSecs = [...prev.sections];
      const section = nextSecs[sectionIdx];
      const order = section.questionGroups.length + 1;
      
      const newGroup: ListeningQuestionGroup = {
        type: "SENTENCE_COMPLETION",
        instruction: "Write NO MORE THAN TWO WORDS for each answer.",
        passageSegment: "",
        options: [],
        imageUrl: "",
        order,
        questions: [],
      };
      
      section.questionGroups = [...section.questionGroups, newGroup];
      return { ...prev, sections: nextSecs };
    });
  };

  const removeListeningQuestionGroup = (sectionIdx: number, groupIdx: number) => {
    setListeningFormState((prev) => {
      const nextSecs = [...prev.sections];
      const section = nextSecs[sectionIdx];
      
      section.questionGroups = section.questionGroups.filter((_, idx) => idx !== groupIdx);
      section.questionGroups = section.questionGroups.map((g, idx) => ({ ...g, order: idx + 1 }));
      
      return { ...prev, sections: nextSecs };
    });
  };

  const handleListeningGroupChange = (sectionIdx: number, groupIdx: number, field: keyof ListeningQuestionGroup, val: any) => {
    setListeningFormState((prev) => {
      const nextSecs = [...prev.sections];
      const group = nextSecs[sectionIdx].questionGroups[groupIdx];
      
      (group as any)[field] = val;
      return { ...prev, sections: nextSecs };
    });
  };

  const addQuestionToListeningGroup = (sectionIdx: number, groupIdx: number) => {
    setListeningFormState((prev) => {
      const nextSecs = [...prev.sections];
      const group = nextSecs[sectionIdx].questionGroups[groupIdx];

      let nextNum = 1;
      const allExQuestions = nextSecs.flatMap((s) => s.questionGroups.flatMap((g) => g.questions));
      if (allExQuestions.length > 0) {
        nextNum = Math.max(...allExQuestions.map((q) => q.questionNumber)) + 1;
      }

      const firstQOptions = group.questions[0]?.options ?? [];

      const newQ: ListeningQuestion = {
        questionNumber: nextNum,
        questionText: "",
        options: group.type === "MULTIPLE_CHOICE_MULTIPLE" ? [...firstQOptions] : [],
        correctAnswer: "",
        explanation: "",
      };

      group.questions = [...group.questions, newQ];
      return { ...prev, sections: nextSecs };
    });
  };

  const removeQuestionFromListeningGroup = (sectionIdx: number, groupIdx: number, qIdx: number) => {
    setListeningFormState((prev) => {
      const nextSecs = [...prev.sections];
      const group = nextSecs[sectionIdx].questionGroups[groupIdx];
      
      group.questions = group.questions.filter((_, idx) => idx !== qIdx);
      return { ...prev, sections: nextSecs };
    });
  };

  const handleListeningQuestionChange = (
    sectionIdx: number,
    groupIdx: number,
    qIdx: number,
    field: keyof ListeningQuestion,
    val: any
  ) => {
    setListeningFormState((prev) => {
      const nextSecs = [...prev.sections];
      const group = nextSecs[sectionIdx].questionGroups[groupIdx];
      
      (group.questions[qIdx] as any)[field] = val;
      return { ...prev, sections: nextSecs };
    });
  };

  const handleAddListeningMCQOption = (sectionIdx: number, groupIdx: number, qIdx: number) => {
    setListeningFormState((prev) => {
      const nextSecs = [...prev.sections];
      const group = nextSecs[sectionIdx].questionGroups[groupIdx];
      const q = group.questions[qIdx];
      const newOptions = [...(q.options ?? []), `Option ${(q.options ?? []).length + 1}`];
      
      if (group.type === "MULTIPLE_CHOICE_MULTIPLE") {
        group.questions.forEach((question) => {
          question.options = newOptions;
        });
      } else {
        q.options = newOptions;
      }
      return { ...prev, sections: nextSecs };
    });
  };

  const handleRemoveListeningMCQOption = (sectionIdx: number, groupIdx: number, qIdx: number, optionIdx: number) => {
    setListeningFormState((prev) => {
      const nextSecs = [...prev.sections];
      const group = nextSecs[sectionIdx].questionGroups[groupIdx];
      const q = group.questions[qIdx];
      const newOptions = (q.options ?? []).filter((_, idx) => idx !== optionIdx);
      
      if (group.type === "MULTIPLE_CHOICE_MULTIPLE") {
        group.questions.forEach((question) => {
          question.options = newOptions;
        });
      } else {
        q.options = newOptions;
      }
      return { ...prev, sections: nextSecs };
    });
  };

  const handleListeningMCQOptionChange = (
    sectionIdx: number,
    groupIdx: number,
    qIdx: number,
    optionIdx: number,
    val: string
  ) => {
    setListeningFormState((prev) => {
      const nextSecs = [...prev.sections];
      const group = nextSecs[sectionIdx].questionGroups[groupIdx];
      const q = group.questions[qIdx];
      
      if (group.type === "MULTIPLE_CHOICE_MULTIPLE") {
        group.questions.forEach((question) => {
          if (!question.options) question.options = [];
          question.options[optionIdx] = val;
        });
      } else {
        q.options[optionIdx] = val;
      }
      return { ...prev, sections: nextSecs };
    });
  };

  const handleListeningGlobalAudioUpload = async (file: File) => {
    if (!file) return;
    setUploadingListeningAudio(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await listeningService.uploadAudio(formData);
      setListeningFormState((prev) => ({ ...prev, audioUrl: res.data.url }));
      toast.success("Listening audio file uploaded successfully!");
    } catch (err: any) {
      toast.error("Upload failed: " + (err?.response?.data?.message || err.message));
    } finally {
      setUploadingListeningAudio(false);
    }
  };

  const handleListeningGroupImageUpload = async (sectionIdx: number, groupIdx: number, file: File) => {
    if (!file) return;
    setUploadingListeningGroupImage({ sectionIdx, groupIdx });
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await listeningService.uploadAudio(formData);
      setListeningFormState((prev) => {
        const nextSecs = [...prev.sections];
        nextSecs[sectionIdx].questionGroups[groupIdx].imageUrl = res.data.url;
        return { ...prev, sections: nextSecs };
      });
      toast.success("Group diagram uploaded successfully!");
    } catch (err: any) {
      toast.error("Upload failed: " + (err?.response?.data?.message || err.message));
    } finally {
      setUploadingListeningGroupImage(null);
    }
  };

  // ==========================================================
  // 2. Reading States & Handlers (Exactly like standalone)
  // ==========================================================
  const [selectedQuestionType, setSelectedQuestionType] = useState<string | null>(null);
  
  // Exam metadata states
  const [readTitle, setReadTitle] = useState("Cambridge IELTS Academic Reading Practice Test 1");
  const [readDesc, setReadDesc] = useState("A Cambridge IELTS-style Academic Reading test with three passages and realistic question types.");
  const [readDuration, setReadDuration] = useState(60);
  const [passageCount, setPassageCount] = useState<1 | 2 | 3>(3);

  const [activePassage, setActivePassage] = useState<1 | 2 | 3>(1);
  const [passages, setPassages] = useState<Record<1 | 2 | 3, PassageData>>({
    1: { 
      title: '', 
      body: '', 
      instruction: 'You should spend about 20 minutes on Questions 1-13 which are based on Reading Passage 1 below.', 
      pdf: null, 
      image: null, 
      imageName: '' 
    },
    2: { 
      title: '', 
      body: '', 
      instruction: 'You should spend about 20 minutes on Questions 14-26 which are based on Reading Passage 2 below.', 
      pdf: null, 
      image: null, 
      imageName: '' 
    },
    3: { 
      title: '', 
      body: '', 
      instruction: 'You should spend about 20 minutes on Questions 27-40 which are based on Reading Passage 3 below.', 
      pdf: null, 
      image: null, 
      imageName: '' 
    },
  });

  // Uploading states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingQImage, setUploadingQImage] = useState(false);

  // PDF & Image input references
  const imageInputRef = useRef<HTMLInputElement>(null);
  const qImageInputRef = useRef<HTMLInputElement>(null);

  // Question Form States
  const [customQuestionNumber, setCustomQuestionNumber] = useState<number | ''>('');
  const [questionText, setQuestionText] = useState('');
  const [questionInstruction, setQuestionInstruction] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [questionExplanation, setQuestionExplanation] = useState('');
  
  // Custom MCQ options
  const [mcqOptA, setMcqOptA] = useState('');
  const [mcqOptB, setMcqOptB] = useState('');
  const [mcqOptC, setMcqOptC] = useState('');
  const [mcqOptD, setMcqOptD] = useState('');
  const [mcqOptE, setMcqOptE] = useState('');
  const [mcqOptF, setMcqOptF] = useState('');
  const [mcqOptG, setMcqOptG] = useState('');
  const [multiMcqCorrectAnswers, setMultiMcqCorrectAnswers] = useState<string[]>([]);
  const [multiMcqAnswerCount, setMultiMcqAnswerCount] = useState<number>(2);

  // Custom Matching options / list of headings (newlines)
  const [groupOptions, setGroupOptions] = useState('');

  // Custom Table completion segment markdown
  const [passageSegment, setPassageSegment] = useState('');
  const [noteAnswers, setNoteAnswers] = useState<Record<number, string>>({});

  // Sentence Completion mode: With Clues vs Without Clues
  const [scompMode, setScompMode] = useState<'WITH_CLUES' | 'WITHOUT_CLUES'>('WITHOUT_CLUES');
  const [scompAltAnswer1, setScompAltAnswer1] = useState('');
  const [scompAltAnswer2, setScompAltAnswer2] = useState('');
  const scompAlt1Ref = useRef<HTMLInputElement>(null);
  const scompAlt2Ref = useRef<HTMLInputElement>(null);

  // Matching Headings Configurations
  const [mhdgMode, setMhdgMode] = useState<'WITH_CLUES' | 'WITHOUT_CLUES'>('WITH_CLUES');
  const [hasExample, setHasExample] = useState(false);
  const [exampleParagraph, setExampleParagraph] = useState('');
  const [exampleAnswer, setExampleAnswer] = useState('');

  // Question attachments
  const [questionImage, setQuestionImage] = useState<string | null>(null);
  const [questionImageName, setQuestionImageName] = useState('');

  // Refs for formatting fields
  const readInstructionRef = useRef<HTMLTextAreaElement>(null);
  const readGroupOptionsRef = useRef<HTMLTextAreaElement>(null);
  const readPassageSegmentRef = useRef<HTMLTextAreaElement>(null);
  const readQuestionTextRef = useRef<HTMLTextAreaElement>(null);
  const readMcqOptARef = useRef<HTMLTextAreaElement>(null);
  const readMcqOptBRef = useRef<HTMLTextAreaElement>(null);
  const readMcqOptCRef = useRef<HTMLTextAreaElement>(null);
  const readMcqOptDRef = useRef<HTMLTextAreaElement>(null);
  const readMcqOptERef = useRef<HTMLTextAreaElement>(null);
  const readMcqOptFRef = useRef<HTMLTextAreaElement>(null);
  const readMcqOptGRef = useRef<HTMLTextAreaElement>(null);
  const readExplanationRef = useRef<HTMLTextAreaElement>(null);
  const readAnswerInputRef = useRef<HTMLTextAreaElement>(null);
  const readPassageInstructionRef = useRef<HTMLTextAreaElement>(null);
  const readPassageTitleRef = useRef<HTMLTextAreaElement>(null);
  const readPassageBodyRef = useRef<HTMLTextAreaElement>(null);

  // Compiled questions for all passages (Target 40)
  const [readingQuestions, setReadingQuestions] = useState<ReadingQuestionItem[]>([]);
  
  // Helper: Update active passage field
  const updatePassageField = (field: keyof PassageData, value: any) => {
    setPassages({
      ...passages,
      [activePassage]: {
        ...passages[activePassage],
        [field]: value
      }
    });
  };

  // Passage/Question Image selection handler
  const handleReadingImageChange = async (e: React.ChangeEvent<HTMLInputElement>, isQuestionImage = false) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (isQuestionImage) setUploadingQImage(true);
      else setUploadingImage(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await readingService.uploadFile(formData);
        if (isQuestionImage) {
          setQuestionImage(res.data.url);
          setQuestionImageName(file.name);
        } else {
          updatePassageField('image', res.data.url);
          updatePassageField('imageName', file.name);
        }
        toast.success("Image uploaded successfully!");
      } catch (err: any) {
        toast.error("Image upload failed: " + (err?.response?.data?.message || err.message));
      } finally {
        if (isQuestionImage) setUploadingQImage(false);
        else setUploadingImage(false);
      }
    }
  };

  // Add Question to Compiled list for active passage
  const handleAddReadingQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const isMultiMcq = selectedQuestionType === "R-MMCQ";
    const selectedTypeDetails = readingQuestionTypes.find(t => t.code === selectedQuestionType);
    if (!selectedTypeDetails) return;
    const notePlaceholderNumbers = selectedTypeDetails.type === "NOTES_COMPLETION"
      ? getPlaceholderNumbers(passageSegment)
      : [];
    const isBulkNotes = notePlaceholderNumbers.length > 0;
    if (!questionInstruction || (!correctAnswer && !isMultiMcq && !isBulkNotes)) {
      toast.error("Please fill in the required instruction and correct answer values.");
      return;
    }

    const tablePlaceholderNumbers = selectedTypeDetails.type === "TABLE_COMPLETION"
      ? getPlaceholderNumbers(passageSegment)
      : [];
    const firstUnansweredTableNumber = tablePlaceholderNumbers.find((questionNumber) => {
      const existingQuestion = readingQuestions.find(
        (question) => question.passageIndex === activePassage && question.questionNumber === questionNumber
      );
      return !existingQuestion?.correctAnswer.trim();
    });
    const firstUnansweredNoteNumber = notePlaceholderNumbers.find((questionNumber) => {
      const existingQuestion = readingQuestions.find(
        (question) => question.passageIndex === activePassage && question.questionNumber === questionNumber
      );
      return !existingQuestion?.correctAnswer.trim();
    });

    // Table answers are entered sequentially, including placeholder records created earlier.
    const qNum = customQuestionNumber !== ''
      ? Number(customQuestionNumber)
      : firstUnansweredTableNumber ?? firstUnansweredNoteNumber ?? readingQuestions.length + 1;

    // 1. Special Handling for MULTIPLE_CHOICE_MULTIPLE (R-MMCQ Checkboxes)
    if (selectedTypeDetails.type === "MULTIPLE_CHOICE_MULTIPLE") {
      if (multiMcqCorrectAnswers.length !== multiMcqAnswerCount) {
        toast.error(`Select exactly ${multiMcqAnswerCount} correct answers.`);
        return;
      }
      
      const generatedQs: ReadingQuestionItem[] = [];
      const opts = [mcqOptA, mcqOptB, mcqOptC, mcqOptD, mcqOptE, mcqOptF, mcqOptG].filter(Boolean);
      
      const lastLetter = String.fromCharCode(64 + Math.max(opts.length, multiMcqAnswerCount + 2, 5));
      const countWord = getNumberWord(multiMcqAnswerCount);
      const effectiveInstruction = `Questions ${qNum}–${qNum + multiMcqAnswerCount - 1}|||Choose ${countWord} letters, A–${lastLetter}.|||Write the correct letters in boxes ${qNum}–${qNum + multiMcqAnswerCount - 1} on your answer sheet.|||`;

      const letterAnswers = multiMcqCorrectAnswers;
      const textAnswers = letterAnswers.map((l) => {
        if (l === "A") return mcqOptA;
        if (l === "B") return mcqOptB;
        if (l === "C") return mcqOptC;
        if (l === "D") return mcqOptD;
        if (l === "E") return mcqOptE;
        if (l === "F") return mcqOptF;
        if (l === "G") return mcqOptG;
        return "";
      }).filter(Boolean);

      const combinedAnswerKey = Array.from(new Set([...letterAnswers, ...textAnswers])).join(" / ");

      for (let i = 0; i < multiMcqAnswerCount; i++) {
        generatedQs.push({
          id: `q-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`,
          passageIndex: activePassage,
          type: selectedTypeDetails.title,
          typeCode: selectedTypeDetails.type,
          questionNumber: qNum + i,
          text: questionText,
          instruction: effectiveInstruction,
          correctAnswer: combinedAnswerKey,
          explanation: questionExplanation,
          options: opts.length > 0 ? opts : undefined,
          groupImageUrl: questionImage || undefined
        });
      }
      
      setReadingQuestions([...readingQuestions, ...generatedQs].sort((a, b) => a.questionNumber - b.questionNumber));
      
      // Reset Form for checkboxes
      setQuestionText('');
      setQuestionExplanation('');
      setMultiMcqCorrectAnswers([]);
      setMcqOptA('');
      setMcqOptB('');
      setMcqOptC('');
      setMcqOptD('');
      setMcqOptE('');
      setMcqOptF('');
      setMcqOptG('');
      setCustomQuestionNumber('');
      setQuestionImage(null);
      setQuestionImageName('');
      toast.success(`Added ${generatedQs.length} questions starting from Question ${qNum}!`);
      return;
    }

    // 2. Standard single correct answer MCQ mapping
    let finalCorrectAnswer = correctAnswer;
    let finalOptions: string[] = [];
    if (selectedTypeDetails.type === "MULTIPLE_CHOICE") {
      finalOptions = [mcqOptA, mcqOptB, mcqOptC, mcqOptD, mcqOptE, mcqOptF, mcqOptG].filter(Boolean);
      let letterText = "";
      if (correctAnswer === "A") letterText = mcqOptA;
      else if (correctAnswer === "B") letterText = mcqOptB;
      else if (correctAnswer === "C") letterText = mcqOptC;
      else if (correctAnswer === "D") letterText = mcqOptD;
      else if (correctAnswer === "E") letterText = mcqOptE;
      else if (correctAnswer === "F") letterText = mcqOptF;
      else if (correctAnswer === "G") letterText = mcqOptG;
      finalCorrectAnswer = Array.from(new Set([correctAnswer, letterText].filter(Boolean))).join(" / ");
    } else if (selectedQuestionType === "R-SCOMP" && scompMode !== "WITH_CLUES") {
      const deduped: string[] = [];
      const seen = new Set<string>();
      for (const raw of [correctAnswer, scompAltAnswer1, scompAltAnswer2]) {
        if (!raw) continue;
        const segments = raw.split("/").map((s) => s.trim()).filter(Boolean);
        for (const seg of segments) {
          const lower = seg.toLowerCase();
          if (!seen.has(lower)) {
            seen.add(lower);
            deduped.push(seg);
          }
        }
      }
      if (deduped.length === 0) {
        toast.error("Please enter at least one correct answer for Sentence Completion.");
        return;
      }
      finalCorrectAnswer = deduped.join(" / ");
    }

    let finalGroupOptions: string[] = [];
    if (
      ["MATCHING_HEADINGS", "MATCHING_FEATURES", "MATCHING_INFORMATION", "MATCHING_SENTENCE_ENDINGS", "SUMMARY_COMPLETION_WITH_OPTIONS"].includes(selectedTypeDetails.type) ||
      (selectedQuestionType === "R-SCOMP" && scompMode === "WITH_CLUES")
    ) {
      finalGroupOptions = groupOptions.split("\n").map(o => o.trim()).filter(Boolean);
    }

    const newQ: ReadingQuestionItem = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      passageIndex: activePassage,
      type: selectedTypeDetails.title,
      typeCode: selectedTypeDetails.type,
      questionNumber: qNum,
      text: questionText,
      instruction: questionInstruction,
      correctAnswer: finalCorrectAnswer,
      explanation: questionExplanation,
      options: finalOptions.length > 0 ? finalOptions : undefined,
      groupOptions: finalGroupOptions.length > 0 ? finalGroupOptions : undefined,
      passageSegment: selectedTypeDetails.type === "MATCHING_HEADINGS"
        ? JSON.stringify({
            mode: mhdgMode,
            exampleParagraph: hasExample ? exampleParagraph : "",
            exampleAnswer: hasExample ? exampleAnswer : ""
          })
        : selectedQuestionType === "R-NMATCH"
        ? JSON.stringify({ variant: "NAME_MATCHING" })
        : ["TABLE_COMPLETION", "NOTES_COMPLETION", "FLOW_CHART_COMPLETION", "SUMMARY_COMPLETION_WITH_OPTIONS", "SUMMARY_COMPLETION_WITHOUT_OPTIONS"].includes(selectedTypeDetails.type)
        ? passageSegment
        : undefined,
      groupImageUrl: questionImage || undefined
    };

    if (selectedTypeDetails.type === "NOTES_COMPLETION" && notePlaceholderNumbers.length > 0) {
      const answersByNumber = new Map(notePlaceholderNumbers.map((questionNumber) => {
        const savedAnswer = readingQuestions.find(
          (question) => question.passageIndex === activePassage && question.questionNumber === questionNumber
        )?.correctAnswer ?? "";
        return [questionNumber, (noteAnswers[questionNumber] ?? savedAnswer).trim()] as const;
      }));
      const missingAnswer = notePlaceholderNumbers.find((questionNumber) => !answersByNumber.get(questionNumber));
      if (missingAnswer !== undefined) {
        toast.error(`Please enter the answer for Question ${missingAnswer}.`);
        return;
      }

      const existingNumbers = new Set(readingQuestions
        .filter((question) => question.passageIndex === activePassage)
        .map((question) => question.questionNumber));
      const updatedQuestions = readingQuestions.map((question) =>
        question.passageIndex === activePassage && answersByNumber.has(question.questionNumber)
          ? { ...question, type: selectedTypeDetails.title, typeCode: selectedTypeDetails.type, passageSegment, instruction: questionInstruction, correctAnswer: answersByNumber.get(question.questionNumber) ?? "" }
          : question
      );
      const missingQuestions = notePlaceholderNumbers
        .filter((questionNumber) => !existingNumbers.has(questionNumber))
        .map((questionNumber, index) => ({
          ...newQ,
          id: `q-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`,
          questionNumber,
          correctAnswer: answersByNumber.get(questionNumber) ?? "",
        }));
      setReadingQuestions([...updatedQuestions, ...missingQuestions].sort((a, b) => a.questionNumber - b.questionNumber));
      setNoteAnswers({});
      setCorrectAnswer("");
      setQuestionText("");
      setQuestionExplanation("");
      setCustomQuestionNumber("");
      toast.success(`Note answers for Questions ${notePlaceholderNumbers.join(", ")} saved successfully!`);
      return;
    }

    const existingQuestionNumbers = new Set(
      readingQuestions
        .filter((question) => question.passageIndex === activePassage)
        .map((question) => question.questionNumber)
    );
    const questionsToAdd: ReadingQuestionItem[] = tablePlaceholderNumbers.length > 0
      ? tablePlaceholderNumbers
        .filter((questionNumber) => !existingQuestionNumbers.has(questionNumber))
        .map((questionNumber, index) => ({
          ...newQ,
          id: index === 0 ? newQ.id : `q-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`,
          questionNumber,
          correctAnswer: questionNumber === qNum ? newQ.correctAnswer : "",
        }))
      : [newQ];

    const updatedQuestions = readingQuestions.map((question) =>
      selectedTypeDetails.type === "TABLE_COMPLETION" &&
      question.passageIndex === activePassage &&
      question.questionNumber === qNum
        ? {
            ...question,
            text: newQ.text,
            correctAnswer: newQ.correctAnswer,
            explanation: newQ.explanation,
            options: newQ.options,
            groupOptions: newQ.groupOptions ?? question.groupOptions,
          }
        : question
    );

    // Create missing placeholders once; subsequent submissions update their answers in order.
    setReadingQuestions([...updatedQuestions, ...questionsToAdd].sort((a, b) => a.questionNumber - b.questionNumber));
    
    // Reset Form
    setQuestionText('');
    setQuestionExplanation('');
    setCorrectAnswer('');
    setScompAltAnswer1('');
    setScompAltAnswer2('');
    setCustomQuestionNumber('');
    setMcqOptA('');
    setMcqOptB('');
    setMcqOptC('');
    setMcqOptD('');
    setMcqOptE('');
    setMcqOptF('');
    setMcqOptG('');
    setMultiMcqCorrectAnswers([]);
    setQuestionImage(null);
    setQuestionImageName('');
    toast.success(`Question ${qNum} added!`);
  };

  // Delete Question
  const handleDeleteReadingQuestion = (id: string) => {
    setReadingQuestions(readingQuestions.filter(q => q.id !== id));
  };

  // ==========================================
  // 3. Writing States & Handlers
  // ==========================================
  const [writeTitle, setWriteTitle] = useState("Cambridge IELTS Academic Writing Practice Test 1");
  const [writeDesc, setWriteDesc] = useState("A Cambridge IELTS-style Academic Writing test featuring Task 1 and Task 2.");
  const [writeDuration, setWriteDuration] = useState(60);
  const [writeExamType, setWriteExamType] = useState<"ACADEMIC" | "GENERAL_TRAINING">("ACADEMIC");
  const [activeWritingTaskIdx, setActiveWritingTaskIdx] = useState<0 | 1>(0); // 0 = Task 1, 1 = Task 2
  const [uploadingWritingImage, setUploadingWritingImage] = useState<number | null>(null); // task index
  const [uploadingWritingPdf, setUploadingWritingPdf] = useState<number | null>(null);

  const [writingTasks, setWritingTasks] = useState<any[]>([
    {
      taskType: "TASK_1",
      instruction: "",
      imageUrl: "",
      pdfUrl: "",
      minWords: 150,
      modelAnswer: "",
      order: 1,
    },
    {
      taskType: "TASK_2",
      instruction: "",
      imageUrl: "",
      pdfUrl: "",
      minWords: 250,
      modelAnswer: "",
      order: 2,
    },
  ]);

  const handleWritingTaskChange = (taskIdx: number, field: string, val: any) => {
    setWritingTasks((prev) => {
      const nextTasks = [...prev];
      nextTasks[taskIdx] = { ...nextTasks[taskIdx], [field]: val };
      return nextTasks;
    });
  };

  const handleWritingImageUpload = async (taskIdx: number, file: File) => {
    if (!file) return;
    setUploadingWritingImage(taskIdx);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await writingService.uploadFile(formData);
      setWritingTasks((prev) => {
        const nextTasks = [...prev];
        nextTasks[taskIdx] = { ...nextTasks[taskIdx], imageUrl: res.data.url };
        return nextTasks;
      });
      toast.success("Image uploaded successfully!");
    } catch (err: any) {
      toast.error("Failed to upload image: " + (err?.response?.data?.message || err.message));
    } finally {
      setUploadingWritingImage(null);
    }
  };

  const handleWritingPdfUpload = async (taskIdx: number, file: File) => {
    if (!file) return;
    setUploadingWritingPdf(taskIdx);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await writingService.uploadFile(formData);
      setWritingTasks((prev) => {
        const nextTasks = [...prev];
        nextTasks[taskIdx] = { ...nextTasks[taskIdx], pdfUrl: res.data.url };
        return nextTasks;
      });
      toast.success("PDF uploaded successfully!");
    } catch (err: any) {
      toast.error("Failed to upload PDF: " + (err?.response?.data?.message || err.message));
    } finally {
      setUploadingWritingPdf(null);
    }
  };

  // ==========================================
  // 4. Speaking States & Handlers
  // ==========================================
  const [speakTitle, setSpeakTitle] = useState("Cambridge IELTS Speaking Practice Test 1");
  const [speakDesc, setSpeakDesc] = useState("A Cambridge IELTS-style Speaking test covering Part 1, Part 2, and Part 3.");
  const [speakDuration, setSpeakDuration] = useState(15);
  const [activeSpeakingTab, setActiveSpeakingTab] = useState(1); // 1, 2, 3
  
  const [speakingParts, setSpeakingParts] = useState<any[]>([
    {
      partNumber: 1,
      title: "Part 1: Introduction and Interview",
      instruction: "The examiner asks the candidate about him/herself, his/her home, work or studies and other familiar topics.<p><strong>School</strong></p>",
      preparationTime: 0,
      speakingTime: 60,
      order: 1,
      questions: [
        { questionText: "Did you go to secondary/high school near to where you lived? Why/Why not?", order: 1 },
        { questionText: "What did you like about your secondary/high school? Why?", order: 2 },
        { questionText: "How do you think your school could be improved?", order: 3 },
      ],
    },
    {
      partNumber: 2,
      title: "Part 2: Individual Long Turn (Cue Card)",
      instruction: "<p class=\"cue-topic\"><strong>Describe a shop near where you live that you sometimes use.</strong></p><p class=\"cue-label\"><strong>You should say:</strong></p><ul class=\"cue-points\"><li>what sorts of products or services it sells</li><li>what the shop looks like</li><li>where it is located</li></ul><p class=\"cue-final\">and explain why you use this shop.</p>",
      preparationTime: 60,
      speakingTime: 120,
      order: 2,
      questions: [
        { questionText: "Cue Card Long Turn Response", order: 1 },
      ],
    },
    {
      partNumber: 3,
      title: "Part 3: Two-way Discussion",
      instruction: "<strong>Local shops and shopping habits</strong>",
      preparationTime: 0,
      speakingTime: 60,
      order: 3,
      questions: [
        { questionText: "What kinds of local shops are popular in your country?", order: 1 },
        { questionText: "Why do some people prefer small shops to large stores?", order: 2 },
        { questionText: "How might shopping habits change in the future?", order: 3 },
      ],
    },
  ]);

  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const [isDraftHydrated, setIsDraftHydrated] = useState(false);
  const restoredDraftRef = useRef(false);
  const latestDraftRef = useRef<FullMockDraftState | null>(null);

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(FULL_MOCK_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { draft: FullMockDraftState; savedAt: string };
        const draft = parsed?.draft;
        if (draft && !isFullMockDraftEmpty(draft)) {
          if (draft.mockTitle !== undefined) setMockTitle(draft.mockTitle);
          if (draft.mockDescription !== undefined) setMockDescription(draft.mockDescription);
          if (draft.isPublished !== undefined) setIsPublished(draft.isPublished);
          if (draft.isPremium !== undefined) setIsPremium(draft.isPremium);
          if (draft.activeTab) setActiveTab(draft.activeTab);
          if (draft.sharedListeningExam) setSharedListeningExam(draft.sharedListeningExam);
          if (draft.sharedReadingExam) setSharedReadingExam(draft.sharedReadingExam);
          if (draft.writeTitle !== undefined) setWriteTitle(draft.writeTitle);
          if (draft.writeDesc !== undefined) setWriteDesc(draft.writeDesc);
          if (draft.writeExamType !== undefined) setWriteExamType(draft.writeExamType);
          if (draft.writeDuration !== undefined) setWriteDuration(draft.writeDuration);
          if (draft.writingTasks) setWritingTasks(draft.writingTasks);
          if (draft.speakTitle !== undefined) setSpeakTitle(draft.speakTitle);
          if (draft.speakDesc !== undefined) setSpeakDesc(draft.speakDesc);
          if (draft.speakDuration !== undefined) setSpeakDuration(draft.speakDuration);
          if (draft.speakingParts) setSpeakingParts(draft.speakingParts);

          setLastDraftSavedAt(parsed.savedAt || null);
          restoredDraftRef.current = true;
          toast.info("Your unfinished Full Mock Test draft has been restored.");
        } else {
          window.localStorage.removeItem(FULL_MOCK_DRAFT_KEY);
        }
      }
    } catch {
      window.localStorage.removeItem(FULL_MOCK_DRAFT_KEY);
    }
    setIsDraftHydrated(true);
  }, []);

  // Update latest draft ref
  useEffect(() => {
    latestDraftRef.current = {
      mockTitle,
      mockDescription,
      isPublished,
      isPremium,
      activeTab,
      sharedListeningExam,
      sharedReadingExam,
      writeTitle,
      writeDesc,
      writeExamType,
      writeDuration,
      writingTasks,
      speakTitle,
      speakDesc,
      speakDuration,
      speakingParts,
    };
  }, [
    mockTitle,
    mockDescription,
    isPublished,
    isPremium,
    activeTab,
    sharedListeningExam,
    sharedReadingExam,
    writeTitle,
    writeDesc,
    writeExamType,
    writeDuration,
    writingTasks,
    speakTitle,
    speakDesc,
    speakDuration,
    speakingParts,
  ]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!isDraftHydrated) return;

    const timeoutId = window.setTimeout(() => {
      const currentDraft = latestDraftRef.current;
      if (!currentDraft) return;

      if (isFullMockDraftEmpty(currentDraft)) {
        try {
          window.localStorage.removeItem(FULL_MOCK_DRAFT_KEY);
          setLastDraftSavedAt(null);
        } catch {}
        return;
      }

      const savedAt = new Date().toISOString();
      try {
        window.localStorage.setItem(
          FULL_MOCK_DRAFT_KEY,
          JSON.stringify({ draft: currentDraft, savedAt })
        );
        setLastDraftSavedAt(savedAt);
      } catch {}
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [
    isDraftHydrated,
    mockTitle,
    mockDescription,
    isPublished,
    activeTab,
    sharedListeningExam,
    sharedReadingExam,
    writeTitle,
    writeDesc,
    writeExamType,
    writeDuration,
    writingTasks,
    speakTitle,
    speakDesc,
    speakDuration,
    speakingParts,
  ]);

  // Immediate save on page unload
  useEffect(() => {
    if (!isDraftHydrated) return;
    const persistBeforeExit = () => {
      const currentDraft = latestDraftRef.current;
      if (!currentDraft || isFullMockDraftEmpty(currentDraft)) return;
      try {
        window.localStorage.setItem(
          FULL_MOCK_DRAFT_KEY,
          JSON.stringify({
            draft: currentDraft,
            savedAt: new Date().toISOString(),
          })
        );
      } catch {}
    };
    window.addEventListener("pagehide", persistBeforeExit);
    window.addEventListener("beforeunload", persistBeforeExit);
    return () => {
      window.removeEventListener("pagehide", persistBeforeExit);
      window.removeEventListener("beforeunload", persistBeforeExit);
    };
  }, [isDraftHydrated]);

  const handleResetDraft = () => {
    window.localStorage.removeItem(FULL_MOCK_DRAFT_KEY);
    setMockTitle("");
    setMockDescription("A complete Cambridge IELTS-style Academic mock test combining Listening, Reading, Writing, and Speaking modules under realistic exam conditions.");
    setIsPublished(true);
    setIsPremium(false);
    setSharedListeningExam(null);
    setSharedReadingExam(null);
    setWriteTitle("Cambridge IELTS Academic Writing Practice Test 1");
    setWriteDesc("A Cambridge IELTS-style Academic Writing test featuring Task 1 and Task 2.");
    setWriteDuration(60);
    setWriteExamType("ACADEMIC");
    setWritingTasks([
      { taskType: "TASK_1", instruction: "", imageUrl: "", pdfUrl: "", minWords: 150, modelAnswer: "", order: 1 },
      { taskType: "TASK_2", instruction: "", imageUrl: "", pdfUrl: "", minWords: 250, modelAnswer: "", order: 2 },
    ]);
    setSpeakTitle("Cambridge IELTS Speaking Practice Test 1");
    setSpeakDesc("A Cambridge IELTS-style Speaking test covering Part 1, Part 2, and Part 3.");
    setSpeakDuration(15);
    setLastDraftSavedAt(null);
    toast.success("Full Mock Test draft cleared.");
  };

  const handleSpeakingPartFieldChange = (partIdx: number, field: string, val: any) => {
    setSpeakingParts((prev) => {
      const updated = [...prev];
      if (updated[partIdx]) {
        updated[partIdx] = {
          ...updated[partIdx],
          [field]: val,
        };
      }
      return updated;
    });
  };

  const handleSpeakingAddQuestion = (partIdx: number) => {
    setSpeakingParts((prev) => {
      const updated = [...prev];
      const part = updated[partIdx];
      if (!part) return prev;
      const nextOrder = part.questions.length + 1;
      part.questions.push({
        questionText: "",
        order: nextOrder,
      });
      return updated;
    });
  };

  const handleSpeakingRemoveQuestion = (partIdx: number, qIdx: number) => {
    setSpeakingParts((prev) => {
      const updated = [...prev];
      const part = updated[partIdx];
      if (!part) return prev;
      part.questions = part.questions.filter((_: any, idx: number) => idx !== qIdx);
      // Re-sort orders
      part.questions.forEach((q: any, idx: number) => {
        q.order = idx + 1;
      });
      return updated;
    });
  };

  const handleSpeakingQuestionTextChange = (partIdx: number, qIdx: number, text: string) => {
    setSpeakingParts((prev) => {
      const updated = [...prev];
      if (updated[partIdx]) {
        updated[partIdx].questions[qIdx].questionText = text;
      }
      return updated;
    });
  };

  // Upload progress indicator states
  const [uploadingStatus, setUploadingStatus] = useState<string | null>(null);

  const uploadFileToServer = async (file: File, type: "audio" | "image" | "pdf", service: any): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    setUploadingStatus(`Uploading ${type} to Cloudinary...`);
    try {
      let res;
      if (type === "audio") {
        res = await service.uploadAudio(formData);
      } else {
        res = await service.uploadFile(formData);
      }
      toast.success(`${type} uploaded successfully!`);
      return res.data.url;
    } catch (err: any) {
      toast.error("Upload failed: " + (err?.response?.data?.message || err.message));
      throw err;
    } finally {
      setUploadingStatus(null);
    }
  };

  // ==========================================
  // Load Demo Mock Test Template
  // ==========================================
  const handleLoadDemoTemplate = () => {
    setMockTitle(demoTemplateData.title);
    setMockDescription(demoTemplateData.description);
    setIsPublished(demoTemplateData.isPublished);
    setIsPremium(demoTemplateData.isPremium ?? false);

    // 1. Listening - Map Sections 1-4
    const listeningSectionsData = [1, 2, 3, 4].map((order) => {
      const existing: any = demoTemplateData.listeningExam.sections.find((s: any) => s.order === order);
      if (existing) {
        return {
          title: existing.title,
          audioUrl: existing.audioUrl,
          youtubeUrl: existing.youtubeUrl || "",
          script: existing.script || "",
          instruction: existing.instruction || "",
          order: existing.order,
          questionGroups: existing.questionGroups.map((g: any, gIdx: number) => ({
            type: g.type,
            instruction: g.instruction,
            passageSegment: g.passageSegment || "",
            options: g.options || [],
            imageUrl: g.imageUrl || "",
            order: g.order || gIdx + 1,
            questions: g.questions.map((q: any) => ({
              questionNumber: q.questionNumber,
              questionText: q.questionText,
              options: q.options || [],
              correctAnswer: q.correctAnswer,
              explanation: q.explanation || "",
            })),
          })),
        };
      }
      return getBlankSectionState(order, `Section ${order}`, true);
    });

    setListeningFormState({
      title: demoTemplateData.listeningExam.title,
      description: demoTemplateData.listeningExam.description,
      duration: demoTemplateData.listeningExam.duration,
      isPublished: demoTemplateData.isPublished,
      audioUrl: (demoTemplateData.listeningExam.sections[0] as any)?.audioUrl || "",
      youtubeUrl: (demoTemplateData.listeningExam.sections[0] as any)?.youtubeUrl || "",
      sections: listeningSectionsData,
    });
    setActiveListeningSectionIdx(0);

    // 2. Reading - passages metadata
    const passagesMetadata: Record<1 | 2 | 3, PassageData> = {
      1: { title: "", body: "", instruction: "You should spend about 20 minutes on Questions 1-13 which are based on Reading Passage 1 below.", pdf: null, image: null, imageName: "" },
      2: { title: "", body: "", instruction: "You should spend about 20 minutes on Questions 14-26 which are based on Reading Passage 2 below.", pdf: null, image: null, imageName: "" },
      3: { title: "", body: "", instruction: "You should spend about 20 minutes on Questions 27-40 which are based on Reading Passage 3 below.", pdf: null, image: null, imageName: "" },
    };
    demoTemplateData.readingExam.passages.forEach((p, idx) => {
      passagesMetadata[idx + 1 as 1 | 2 | 3] = {
        title: p.title,
        body: p.body,
        instruction: p.instruction,
        pdf: null,
        image: p.imageUrl || null,
        imageName: p.imageUrl ? "Uploaded Image" : "",
      };
    });
    setPassages(passagesMetadata);
    setPassageCount(demoTemplateData.readingExam.passages.length as 1 | 2 | 3);

    // 2. Reading - flat compiled questions
    const flatQuestions: ReadingQuestionItem[] = [];
    demoTemplateData.readingExam.passages.forEach((p, pIdx) => {
      p.questionGroups.forEach((g) => {
        g.questions.forEach((q: any) => {
          flatQuestions.push({
            id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            passageIndex: pIdx + 1,
            type: readingQuestionTypes.find(t => t.type === g.type)?.title || g.type,
            typeCode: g.type,
            questionNumber: q.questionNumber,
            text: q.questionText,
            instruction: g.instruction,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || "",
            options: q.options || [],
            groupOptions: g.options || [],
            passageSegment: g.passageSegment || "",
            groupImageUrl: g.imageUrl || "",
          });
        });
      });
    });
    setReadingQuestions(flatQuestions.sort((a, b) => a.questionNumber - b.questionNumber));
    setActivePassage(1);

    // 3. Writing
    setWriteTitle(demoTemplateData.writingExam.title);
    setWriteDesc(demoTemplateData.writingExam.description || "");
    setWriteDuration(demoTemplateData.writingExam.duration);
    setWriteExamType(demoTemplateData.writingExam.examType);
    setWritingTasks(JSON.parse(JSON.stringify(demoTemplateData.writingExam.tasks)));
    setActiveWritingTaskIdx(0);

    // 4. Speaking
    setSpeakTitle(demoTemplateData.speakingExam.title);
    setSpeakDesc(demoTemplateData.speakingExam.description || "");
    setSpeakDuration(demoTemplateData.speakingExam.duration);
    setSpeakingParts(JSON.parse(JSON.stringify(demoTemplateData.speakingExam.parts)));
    setActiveSpeakingTab(1);

    toast.success("Loaded pre-populated IELTS Mock Test demo data!");
  };

  // ==========================================
  // Submit Mutation & Main Payload Formulation
  // ==========================================
  const createMutation = useMutation({
    mutationFn: (payload: any) => mockTestService.createFullMockTest(payload),
    onSuccess: () => {
      try {
        window.localStorage.removeItem(FULL_MOCK_DRAFT_KEY);
      } catch {}
      toast.success("Premium CBT Mock Test assembled and saved with all modules!");
      queryClient.invalidateQueries({ queryKey: ["teacher-mock-tests"] });
      router.push("/teacher/mock-tests");
    },
    onError: (err: any) => {
      toast.error(
        "Failed to save mock test: " +
          (err?.response?.data?.message || err.message)
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!resolvedMockTitle.trim()) {
      toast.error("Mock Test Title is required.");
      return;
    }

    // Validate passages created with the local fallback builder.
    if (!sharedReadingExam) {
      for (let idx = 1; idx <= passageCount; idx++) {
        if (!passages[idx as 1 | 2 | 3].title) {
          toast.error(`Please ensure Reading Passage ${idx} has a title drafted.`);
          return;
        }
      }
    }

    // Validate Writing
    if (!writeTitle.trim()) {
      toast.error("Please enter a Writing exam title.");
      return;
    }
    if (!writingTasks[0].instruction.trim()) {
      toast.error("Please enter Writing Task 1 instruction/prompt.");
      return;
    }
    if (!writingTasks[1].instruction.trim()) {
      toast.error("Please enter Writing Task 2 instruction/prompt.");
      return;
    }

    // Validate Speaking
    if (!speakTitle.trim()) {
      toast.error("Please enter a Speaking exam title.");
      return;
    }

    // Force Part 2 to have a dummy question so it passes backend checks if empty
    const validatedSpeakingParts = speakingParts.map((p) => {
      if (p.partNumber === 2) {
        return {
          ...p,
          questions: [{ questionText: "Cue Card Long Turn Response", order: 1 }],
        };
      }
      return p;
    });

    for (const p of validatedSpeakingParts) {
      if (p.questions.length === 0) {
        toast.error(`Please add at least one question to ${p.title}`);
        return;
      }
      for (const q of p.questions) {
        if (!q.questionText.trim()) {
          toast.error(`Please fill in all question text fields in ${p.title}`);
          return;
        }
      }
    }

    // Map Reading questions flat structure into sequential nested group schema
    const mappedReadingPassages = Array.from({ length: passageCount }, (_, i) => i + 1).map((idx) => {
      const p = passages[idx as 1 | 2 | 3];
      const passageQuestions = readingQuestions.filter(q => q.passageIndex === idx);
      
      const questionGroups: any[] = [];
      let currentGroup: any = null;

      for (const q of passageQuestions) {
        const isSameType =
          currentGroup &&
          currentGroup.type === q.typeCode &&
          areInstructionsCompatible(currentGroup.instruction, q.instruction);
        if (isSameType) {
          if ((!currentGroup.options || currentGroup.options.length === 0) && q.groupOptions && q.groupOptions.length > 0) {
            currentGroup.options = q.groupOptions;
          }
          if (!currentGroup.passageSegment && q.passageSegment) {
            currentGroup.passageSegment = q.passageSegment;
          }
          if (!currentGroup.instruction && q.instruction) {
            currentGroup.instruction = q.instruction;
          }
          if (!currentGroup.imageUrl && q.groupImageUrl) {
            currentGroup.imageUrl = q.groupImageUrl;
          }
        } else {
          currentGroup = {
            type: q.typeCode,
            instruction: q.instruction || "",
            passageSegment: q.passageSegment || "",
            options: q.groupOptions || [],
            imageUrl: q.groupImageUrl || "",
            order: questionGroups.length + 1,
            questions: []
          };
          questionGroups.push(currentGroup);
        }

        currentGroup.questions.push({
          questionNumber: q.questionNumber,
          questionText: q.text || "",
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || ""
        });
      }

      questionGroups.forEach((g) => {
        if (g.questions.length > 0) {
          const qStart = g.questions[0].questionNumber;
          const qEnd = g.questions[g.questions.length - 1].questionNumber;
          const autoRange = qStart === qEnd ? `Question ${qStart}` : `Questions ${qStart}–${qEnd}`;
          if (g.instruction) {
            const parsed = parseGroupInstruction(g.instruction);
            const inst3Part = parsed.inst3 ? `|||INST3:${parsed.inst3}` : "";
            const listPart = parsed.listItems.length > 0 ? "|||" + parsed.listItems.join("|||") : "";
            g.instruction = `${autoRange}|||${parsed.inst1}|||${parsed.inst2}|||${parsed.heading}${inst3Part}${listPart}`;
          }
        }
      });

      const instructionHtml = p.instruction 
        ? `<div class="mb-6 p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-750 leading-relaxed font-semibold italic shadow-sm">
             <span class="text-xs font-black uppercase tracking-wider block text-indigo-700 mb-1">READING PASSAGE ${idx}</span>
             ${convertMarkdownToHtml(p.instruction)}
           </div>` 
        : `<div class="mb-6 p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-750 leading-relaxed font-semibold italic shadow-sm">
             <span class="text-xs font-black uppercase tracking-wider block text-indigo-700 mb-1">READING PASSAGE ${idx}</span>
             You should spend about 20 minutes on Questions which are based on Reading Passage ${idx} below.
           </div>`;
           
      const titleHtml = `<h2 class="text-2xl font-extrabold text-black mb-5 mt-2 tracking-tight whitespace-pre-wrap">${p.title.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-black">$1</strong>')}</h2>`;
      const bodyHtml = convertMarkdownToHtml(p.body || "");
      const combinedText = `${instructionHtml}${titleHtml}${bodyHtml}`;

      return {
        title: p.title,
        text: combinedText,
        body: p.body || "",
        instruction: p.instruction || "",
        pdfUrl: p.pdf?.url || "",
        imageUrl: p.image || "",
        order: idx,
        questionGroups
      };
    });

    const payload = {
      title: resolvedMockTitle,
      description: mockDescription,
      isPublished,
      isPremium,
      listeningExam: sharedListeningExam || {
        title: listeningFormState.title,
        description: listeningFormState.description,
        duration: Number(listeningFormState.duration),
        sections: listeningFormState.sections.map((s) => ({
          title: s.title,
          audioUrl: listeningFormState.audioUrl,
          youtubeUrl: listeningFormState.youtubeUrl || "",
          script: s.script || "",
          instruction: s.instruction || "",
          order: s.order,
          questionGroups: s.questionGroups.map((g) => ({
            type: g.type,
            instruction: g.instruction,
            passageSegment: g.passageSegment,
            options: g.options,
            imageUrl: g.imageUrl || "",
            order: g.order,
            questions: g.questions.map((q) => ({
              questionNumber: Number(q.questionNumber),
              questionText: q.questionText,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
            })),
          })),
        })),
      },
      readingExam: sharedReadingExam || {
        title: readTitle,
        description: readDesc,
        duration: readDuration,
        passages: mappedReadingPassages,
      },
      writingExam: {
        title: writeTitle,
        description: writeDesc.trim() || undefined,
        duration: Number(writeDuration),
        examType: writeExamType,
        tasks: writingTasks.map((t) => ({
          taskType: t.taskType,
          instruction: t.instruction.trim(),
          imageUrl: t.imageUrl || undefined,
          pdfUrl: t.pdfUrl || undefined,
          minWords: t.minWords,
          modelAnswer: t.modelAnswer?.trim() || undefined,
          order: t.order,
        })),
      },
      speakingExam: {
        title: speakTitle,
        description: speakDesc,
        duration: Number(speakDuration),
        parts: validatedSpeakingParts.map((p) => ({
          partNumber: p.partNumber,
          title: p.title,
          instruction: p.instruction,
          preparationTime: Number(p.preparationTime),
          speakingTime: Number(p.speakingTime),
          order: p.order,
          questions: p.questions.map((q: any) => ({
            questionText: q.questionText,
            audioUrl: q.audioUrl || undefined,
            order: q.order,
          })),
        })),
      },
    };

    createMutation.mutate(payload);
  };

  const activeListeningSection = listeningFormState.sections[activeListeningSectionIdx];
  const moduleCompletion: Record<TabType, boolean> = {
    listening: Boolean(sharedListeningExam || (listeningFormState.title.trim() && listeningFormState.sections.every((section) => section.questionGroups.length > 0))),
    reading: Boolean(sharedReadingExam || (readTitle.trim() && Object.values(passages).slice(0, passageCount).every((passage) => passage.title.trim() && passage.body.trim()))),
    writing: Boolean(writeTitle.trim() && writingTasks[0]?.instruction?.trim() && writingTasks[1]?.instruction?.trim()),
    speaking: Boolean(speakTitle.trim() && speakingParts[1]?.instruction?.trim() && speakingParts[0]?.questions?.length && speakingParts[2]?.questions?.length),
  };
  const previewListeningExam = sharedListeningExam || listeningFormState;
  const previewReadingExam = sharedReadingExam
    ? {
        title: sharedReadingExam.title,
        passages: sharedReadingExam.passages,
        questions: sharedReadingExam.passages.flatMap((passage: any, passageIndex: number) =>
          (passage.questionGroups || []).flatMap((group: any) =>
            (group.questions || []).map((question: any) => ({
              ...question,
              id: question.id || `shared-reading-${passageIndex + 1}-${question.questionNumber}`,
              passageIndex: passageIndex + 1,
              typeCode: group.type,
              instruction: group.instruction,
              passageSegment: group.passageSegment,
              groupOptions: group.options,
              groupImageUrl: group.imageUrl,
              text: question.questionText,
            }))
          )
        ),
      }
    : { title: readTitle, passages: Object.values(passages).slice(0, passageCount), questions: readingQuestions };

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 py-5 font-sans">
      {(activeTab === "writing" || activeTab === "speaking") && (
        <FloatingSelectionToolbar allEditableFields syntax="html" />
      )}
      {/* Uploading full-page overlay loading indicator */}
      {(uploadingStatus || uploadingListeningAudio || uploadingImage || uploadingQImage) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-white z-50">
          <IconLoader2 className="animate-spin text-amber-400" size={40} />
          <p className="font-extrabold text-sm tracking-wide">
            {uploadingListeningAudio
              ? "Uploading Listening audio track..."
              : uploadingImage || uploadingQImage
              ? "Uploading Reading illustration file..."
              : uploadingStatus}
          </p>
        </div>
      )}

      {/* Back Navigation & Load Demo Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/teacher/mock-tests"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-slate-900 transition-colors"
        >
          <IconArrowLeft size={16} />
          <span>Back to Mock Tests</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          {lastDraftSavedAt && (
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                Draft auto-saved ({new Date(lastDraftSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </span>
              <button
                type="button"
                onClick={handleResetDraft}
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition active:scale-95 cursor-pointer"
                title="Discard full draft and reset"
              >
                Reset Draft
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleLoadDemoTemplate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs shadow-md transition duration-155 active:scale-95 cursor-pointer"
          >
            <IconSparkles size={15} className="text-amber-300" />
            <span>Load Demo Mock Test</span>
          </button>
        </div>
      </div>

      {/* Header Banner - Replaced with shadcn Card */}
      <Card className="border border-slate-200 shadow-xs bg-white p-5 md:p-6">
        <CardHeader className="p-0 pb-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[10px] font-bold text-purple-700 uppercase tracking-widest">
                <IconLock size={12} className="text-purple-600" />
                <span>Premium Full Exam Simulation Builder</span>
              </div>
              <CardTitle className="text-2xl font-black text-gray-900 tracking-tight">
                Create Full Mock Test
              </CardTitle>
              <CardDescription className="text-gray-500 text-sm font-medium">
                Construct a complete IELTS CBT Mock Test with Listening, Reading, Writing, and Speaking modules loaded with comprehensive builders.
              </CardDescription>
            </div>
            <div className="flex items-center justify-center h-13 w-13 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 shadow-xs shrink-0 self-start md:self-auto">
              <IconTrophy size={28} />
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-6">
        {/* Step 1: Mock Test Meta Details */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-xs space-y-5">
          <h2 className="text-base font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-xs font-black">1</span>
            <span>Mock Test Details</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-black text-gray-700 uppercase" htmlFor="mockTitle">
                Mock Test Title *
              </label>
              <input
                id="mockTitle"
                type="text"
                required
                placeholder="e.g. IELTS Academic Full Practice Exam Vol 1"
                value={resolvedMockTitle}
                onChange={(e) => setMockTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-purple-600 focus:outline-hidden transition duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-700 uppercase" htmlFor="isPublished">
                Publish Status
              </label>
              <select
                id="isPublished"
                value={isPublished ? "true" : "false"}
                onChange={(e) => setIsPublished(e.target.value === "true")}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold bg-white focus:border-purple-600 focus:outline-hidden transition duration-200"
              >
                <option value="true">🟢 Published (Students can attempt)</option>
                <option value="false">📝 Draft (Hidden from students)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-700 uppercase flex items-center gap-1.5" htmlFor="isPremium">
                <IconCrown size={14} className={isPremium ? "text-amber-500 fill-amber-500" : "text-slate-400"} />
                <span>Access Tier</span>
              </label>
              <select
                id="isPremium"
                value={isPremium ? "true" : "false"}
                onChange={(e) => setIsPremium(e.target.value === "true")}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold bg-white focus:border-purple-600 focus:outline-hidden transition duration-200"
              >
                <option value="false">🆓 Free Mock Test (All Candidates)</option>
                <option value="true">👑 Premium Mock Test (Paid Access)</option>
              </select>
            </div>

            {/* Visual Access Tier Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:col-span-2">
              <div
                onClick={() => setIsPremium(false)}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                  !isPremium
                    ? "border-emerald-500 bg-emerald-50/40 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/30"
                }`}
              >
                <input
                  type="radio"
                  name="cbtAccessTier"
                  checked={!isPremium}
                  onChange={() => setIsPremium(false)}
                  className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                    Free Mock Test
                  </span>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Open to all registered candidates for free practice without any payment or subscription.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setIsPremium(true)}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                  isPremium
                    ? "border-amber-500 bg-amber-50/40 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/30"
                }`}
              >
                <input
                  type="radio"
                  name="cbtAccessTier"
                  checked={isPremium}
                  onChange={() => setIsPremium(true)}
                  className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                    <IconCrown size={12} className="fill-amber-500 text-amber-600" />
                    <span>Premium Mock Test</span>
                  </span>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Locked for free users. Students must purchase premium access to unlock this and all other premium tests.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-black text-gray-700 uppercase" htmlFor="mockDescription">
                Mock Test Guidelines / Instructions
              </label>
              <textarea
                id="mockDescription"
                rows={3}
                placeholder="Guidelines shown to students before starting the test"
                value={mockDescription}
                onChange={(e) => setMockDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-purple-600 focus:outline-hidden transition duration-200 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Tabs for modules */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="bg-slate-50 border-b border-gray-200 px-4 md:px-8 flex overflow-x-auto gap-2">
            {[
              { id: "listening", label: "Listening", icon: <IconHeadset size={18} />, color: "text-blue-600 border-blue-500" },
              { id: "reading", label: "Reading", icon: <IconBook2 size={18} />, color: "text-emerald-600 border-emerald-500" },
              { id: "writing", label: "Writing", icon: <IconPencil size={18} />, color: "text-amber-600 border-amber-500" },
              { id: "speaking", label: "Speaking", icon: <IconMicrophone size={18} />, color: "text-rose-600 border-rose-500" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id as TabType);
                    if (tab.id === "reading") {
                      // auto select type null to prevent errors
                      setSelectedQuestionType(null);
                    }
                  }}
                  className={`flex items-center gap-2.5 px-6 py-4.5 text-sm font-black border-b-2 tracking-tight transition-all duration-155 whitespace-nowrap outline-hidden cursor-pointer ${
                    isActive
                      ? `${tab.color} text-slate-900 bg-white`
                      : "border-transparent text-gray-400 hover:text-slate-600 hover:bg-slate-100/50"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span className={`ml-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${moduleCompletion[tab.id as TabType] ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                    {moduleCompletion[tab.id as TabType] ? <IconCheck size={12} stroke={3} /> : ["listening", "reading", "writing", "speaking"].indexOf(tab.id) + 1}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {/* ========================================================== */}
            {/* TAB: LISTENING (Hubuhu matching standalone create form) */}
            {/* ========================================================== */}
            {activeTab === "listening" && (
              <div>
                <ListeningCreatorWorkspace embedded onExamReady={setSharedListeningExam} />
              </div>
            )}

            {showLegacyModuleBuilders && activeTab === "listening" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                {/* LEFT COLUMN: EXAM CORE METADATA */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-sm text-[#1B3A6B] border-b border-gray-100 pb-2 uppercase tracking-wide">
                      Exam Information
                    </h3>

                    {/* Exam Title */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase">Exam Title</label>
                      <input
                        type="text"
                        required
                        value={listeningFormState.title}
                        onChange={(e) => handleListeningInputChange("title", e.target.value)}
                        className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] text-sm text-gray-800 bg-white"
                        placeholder="e.g. Cambridge IELTS 19 Test 1"
                      />
                    </div>

                    {/* Exam Description */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase">Description</label>
                      <textarea
                        value={listeningFormState.description}
                        onChange={(e) => handleListeningInputChange("description", e.target.value)}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] text-sm text-gray-800 bg-white"
                        placeholder="General description or instructions for the student..."
                      />
                    </div>

                    {/* Duration */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase">Duration (Minutes)</label>
                      <input
                        type="number"
                        required
                        value={listeningFormState.duration}
                        onChange={(e) => handleListeningInputChange("duration", Number(e.target.value))}
                        className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] text-sm text-gray-800 bg-white"
                      />
                    </div>

                    {/* Global Audio Upload */}
                    <div className="space-y-1.5 relative">
                      <label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1.5">
                        <IconFileMusic size={15} />
                        <span>Audio Recording File</span>
                      </label>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={listeningFormState.audioUrl}
                          onChange={(e) => handleListeningInputChange("audioUrl", e.target.value)}
                          className="flex-grow h-10 px-3 border border-gray-300 rounded-lg focus:border-[#1B3A6B] text-xs font-medium bg-white truncate"
                          placeholder="Audio File URL (or choose upload)"
                        />
                        
                        <label className="h-10 px-3.5 border border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer bg-gray-55 flex items-center justify-center shrink-0">
                          {uploadingListeningAudio ? (
                            <IconLoader2 size={16} className="animate-spin text-gray-500" />
                          ) : (
                            <IconUpload size={16} className="text-gray-500" />
                          )}
                          <input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleListeningGlobalAudioUpload(file);
                            }}
                            disabled={uploadingListeningAudio}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Global YouTube video link */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1.5">
                        <IconBrandYoutube size={15} className="text-red-500" />
                        <span>YouTube Video Link (Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={listeningFormState.youtubeUrl}
                        onChange={(e) => handleListeningInputChange("youtubeUrl", e.target.value)}
                        className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] text-xs font-medium bg-white"
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </div>

                    {/* Summary details */}
                    <div className="bg-slate-50 rounded-xl p-4 text-xs font-medium text-gray-555 border border-slate-100 space-y-1">
                      <div className="flex justify-between">
                        <span>Total Sections:</span>
                        <span className="font-bold text-gray-800">{listeningFormState.sections.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Questions:</span>
                        <span className="font-bold text-gray-800">
                          {listeningFormState.sections.reduce((acc, s) => acc + s.questionGroups.reduce((gAcc, g) => gAcc + g.questions.length, 0), 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: ACTIVE SECTION & QUESTIONS WORKSPACE */}
                <div className="lg:col-span-2 space-y-6">
                  {/* SECTION selector tabs */}
                  <div className="flex bg-gray-150 p-1 rounded-xl border border-gray-200 overflow-x-auto gap-1">
                    {listeningFormState.sections.map((s, idx) => {
                      const active = activeListeningSectionIdx === idx;
                      const hasContent = s.script || s.instruction || s.questionGroups.length > 0;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveListeningSectionIdx(idx)}
                          className={`flex-1 py-2 text-center rounded-lg text-xs font-bold uppercase transition select-none tracking-wider whitespace-nowrap px-3 cursor-pointer ${
                            active
                              ? "bg-[#1B3A6B] text-white shadow-sm"
                              : "text-gray-600 hover:text-black hover:bg-gray-100"
                          }`}
                        >
                          {s.title} {hasContent && <span className="text-emerald-500 ml-1">●</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* ACTIVE SECTION EDITOR PANELS */}
                  {activeListeningSection && (
                    <div className="space-y-6">
                      {/* SECTION MEDIA FIELDS (Script Transcription, Instructions) */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                        <h3 className="font-extrabold text-sm text-[#1B3A6B] border-b border-gray-100 pb-2 uppercase tracking-wide">
                          Section Info & Script (Part {activeListeningSectionIdx + 1})
                        </h3>
                        {/* Script Transcription Textarea */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1.5">
                            <IconArticle size={15} />
                            <span>Listening Transcript / Script</span>
                          </label>
                          <textarea
                            value={activeListeningSection.script}
                            onChange={(e) => handleListeningSectionChange(activeListeningSectionIdx, "script", e.target.value)}
                            rows={5}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] text-sm text-gray-800 bg-white font-mono leading-relaxed"
                            placeholder="Type or paste the complete audio dialogue script transcript here..."
                          />
                        </div>
                      </div>

                      {/* SECTION QUESTIONS & BLOCKS */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-extrabold uppercase text-gray-500 tracking-wider">
                            Question Blocks ({activeListeningSection.questionGroups.length})
                          </h3>
                          <button
                            type="button"
                            onClick={() => addListeningQuestionGroup(activeListeningSectionIdx)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B3A6B] hover:bg-[#152e54] text-white text-xs font-bold rounded shadow transition active:scale-95 cursor-pointer"
                          >
                            <IconPlus size={14} />
                            <span>Add Question Block</span>
                          </button>
                        </div>

                        {activeListeningSection.questionGroups.length === 0 && (
                          <div className="bg-white border border-gray-200 rounded-2xl py-12 px-6 text-center text-gray-400 font-semibold shadow-sm">
                            No question blocks have been added to this section yet.
                          </div>
                        )}

                        {activeListeningSection.questionGroups.map((group, groupIdx) => {
                          return (
                            <div
                              key={groupIdx}
                              className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4 hover:border-blue-200 transition relative"
                            >
                              {/* Block Title and deletion */}
                              <div className="flex items-center justify-between border-b border-gray-150 pb-2">
                                <span className="font-extrabold text-xs text-[#1B3A6B] uppercase tracking-wide">
                                  Block {groupIdx + 1} Settings
                                </span>
                                
                                <button
                                  type="button"
                                  onClick={() => removeListeningQuestionGroup(activeListeningSectionIdx, groupIdx)}
                                  className="text-gray-400 hover:text-rose-600 transition p-1 cursor-pointer"
                                  title="Remove block"
                                >
                                  <IconTrash size={16} />
                                </button>
                              </div>

                              {/* Config Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Question type selector */}
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase">Question Format Type</label>
                                  <select
                                    value={group.type}
                                    onChange={(e) => handleListeningGroupChange(activeListeningSectionIdx, groupIdx, "type", e.target.value)}
                                    className="w-full h-9 px-2 border border-gray-300 rounded focus:border-[#1B3A6B] text-xs font-semibold bg-white cursor-pointer"
                                  >
                                    {QUESTION_GROUP_TYPES.map((type) => (
                                      <option key={type.value} value={type.value}>
                                        {type.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* 4 Extra Input Fields before any type question */}
                                {(() => {
                                  const parsed = parseGroupInstruction(group.instruction);
                                  const updateField = (field: "range" | "inst1" | "inst2" | "heading", val: string) => {
                                    const next = { ...parsed, [field]: val };
                                    const serialized = `${next.range.trim()}|||${next.inst1.trim()}|||${next.inst2.trim()}|||${next.heading.trim()}`;
                                    handleListeningGroupChange(activeListeningSectionIdx, groupIdx, "instruction", serialized);
                                  };

                                  return (
                                    <div className="space-y-3 md:col-span-2 bg-slate-50 p-4 rounded-xl border border-gray-200">
                                      <span className="text-[10px] font-extrabold uppercase text-[#1B3A6B] tracking-wider block mb-1">
                                        IELTS Block Header Configuration (4 Header Fields)
                                      </span>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                          <label className="text-[9px] font-black text-gray-555 uppercase">1. Question Range (e.g. Questions 11–15)</label>
                                          <FormatInput
                                            value={parsed.range}
                                            onChange={(val) => updateField("range", val)}
                                            placeholder="e.g. Questions 11–15"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <label className="text-[9px] font-black text-gray-555 uppercase">2. Question Title/Heading (Centered)</label>
                                          <FormatInput
                                            value={parsed.heading}
                                            onChange={(val) => updateField("heading", val)}
                                            placeholder="e.g. Stanthorpe Twinning Association"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <label className="text-[9px] font-black text-gray-555 uppercase">3. Instruction Line 1 (Italic)</label>
                                          <FormatInput
                                            value={parsed.inst1}
                                            onChange={(val) => updateField("inst1", val)}
                                            placeholder="e.g. Choose the correct letter, A, B or C."
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <label className="text-[9px] font-black text-gray-555 uppercase">4. Instruction Line 2 (Italic)</label>
                                          <FormatInput
                                            value={parsed.inst2}
                                            onChange={(val) => updateField("inst2", val)}
                                            placeholder="e.g. Write the correct letter, A–H, next to Questions..."
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Diagram Labelling Image Upload */}
                                <div className="space-y-1.5 relative">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                                    <IconPhoto size={15} />
                                    <span>Diagram Image (Optional)</span>
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={group.imageUrl}
                                      onChange={(e) => handleListeningGroupChange(activeListeningSectionIdx, groupIdx, "imageUrl", e.target.value)}
                                      className="flex-grow h-9 px-3 border border-gray-300 rounded focus:border-[#1B3A6B] text-xs bg-white truncate"
                                      placeholder="Image URL (or choose upload)"
                                    />
                                    <label className="h-9 px-3.5 border border-gray-300 rounded hover:border-gray-400 cursor-pointer bg-gray-50 flex items-center justify-center shrink-0">
                                      {uploadingListeningGroupImage?.sectionIdx === activeListeningSectionIdx && uploadingListeningGroupImage?.groupIdx === groupIdx ? (
                                        <IconLoader2 size={15} className="animate-spin text-gray-500" />
                                      ) : (
                                        <IconUpload size={15} className="text-gray-500" />
                                      )}
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleListeningGroupImageUpload(activeListeningSectionIdx, groupIdx, file);
                                        }}
                                        disabled={uploadingListeningGroupImage !== null}
                                      />
                                    </label>
                                  </div>
                                </div>

                                {/* Block Options List (one per line) */}
                                {(group.type === "MATCHING_FEATURES" || group.type === "SUMMARY_COMPLETION") && (
                                  <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">
                                      Block Options List (one option per line)
                                    </label>
                                    <FormatTextarea
                                      value={group.options?.join("\n") || ""}
                                      onChange={(val) => handleListeningGroupChange(activeListeningSectionIdx, groupIdx, "options", val.split("\n"))}
                                      rows={3}
                                      className="w-full p-2 border border-gray-300 rounded focus:border-[#1B3A6B] text-xs bg-white font-semibold"
                                      placeholder="Option A&#10;Option B&#10;Option C"
                                    />
                                  </div>
                                )}

                                {/* Segment text for blanks/segment */}
                                {["SENTENCE_COMPLETION", "TABLE_COMPLETION", "FLOW_CHART_COMPLETION", "SUMMARY_COMPLETION", "NOTES_COMPLETION"].includes(group.type) && (
                                  <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                                      <span>Segment Text or Table Markup (Optional)</span>
                                    </label>
                                    {group.type === "TABLE_COMPLETION" ? (
                                      <VisualTableBuilder
                                        value={group.passageSegment || ""}
                                        onChange={(val) => handleListeningGroupChange(activeListeningSectionIdx, groupIdx, "passageSegment", val)}
                                      />
                                    ) : group.type === "NOTES_COMPLETION" ? (
                                      <VisualNotesBuilder
                                        value={group.passageSegment || ""}
                                        onChange={(val) => handleListeningGroupChange(activeListeningSectionIdx, groupIdx, "passageSegment", val)}
                                        questions={group.questions}
                                      />
                                    ) : (
                                      <FormatTextarea
                                        value={group.passageSegment || ""}
                                        onChange={(val) => handleListeningGroupChange(activeListeningSectionIdx, groupIdx, "passageSegment", val)}
                                        rows={3}
                                        className="w-full p-2 border border-gray-300 rounded focus:border-[#1B3A6B] text-xs bg-white font-mono"
                                        placeholder="Use [1], [2], etc. to place blank input boxes matching the Question Numbers."
                                      />
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* QUESTIONS TABLE LIST */}
                              <div className="space-y-3 mt-4 pt-3 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-extrabold uppercase text-gray-555">
                                    Questions ({group.questions.length})
                                  </span>
                                  
                                  <button
                                    type="button"
                                    onClick={() => addQuestionToListeningGroup(activeListeningSectionIdx, groupIdx)}
                                    className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 bg-white text-gray-650 hover:text-black rounded hover:bg-gray-50 text-[10px] font-bold transition shadow-sm select-none active:scale-[0.98] cursor-pointer"
                                  >
                                    <IconPlus size={12} />
                                    <span>Add Question</span>
                                  </button>
                                </div>

                                {group.questions.length === 0 && (
                                  <div className="bg-slate-50 border border-dashed border-gray-200 rounded-lg p-6 text-center text-xs text-gray-400 font-semibold select-none">
                                    No questions added to this block yet. Click Add Question.
                                  </div>
                                )}

                                {group.questions.map((q, qIdx) => {
                                  const isMCQ = group.type === "MULTIPLE_CHOICE" || group.type === "MULTIPLE_CHOICE_MULTIPLE";
                                  const isCheckbox = group.type === "MATCHING_FEATURES" || group.type === "MATCHING_HEADINGS" || group.type === "MATCHING_SENTENCE_ENDINGS";
                                  return (
                                    <div
                                      key={qIdx}
                                      className="border border-gray-200 rounded-xl p-4 bg-slate-50/50 space-y-3 relative group"
                                    >
                                      <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-black uppercase text-[#1B3A6B] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                            Question {qIdx + 1}
                                          </span>
                                          <div className="flex items-center gap-1 select-none">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Q No.</span>
                                            <input
                                              type="number"
                                              value={q.questionNumber}
                                              onChange={(e) => handleListeningQuestionChange(activeListeningSectionIdx, groupIdx, qIdx, "questionNumber", Number(e.target.value))}
                                              className="w-12 h-6 border border-gray-300 rounded text-center text-xs font-bold text-gray-800 bg-white"
                                            />
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => removeQuestionFromListeningGroup(activeListeningSectionIdx, groupIdx, qIdx)}
                                          className="text-gray-400 hover:text-rose-550 transition p-1 cursor-pointer"
                                          title="Delete question"
                                        >
                                          <IconTrash size={14} />
                                        </button>
                                      </div>

                                      {/* Question Details Form */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {!["TABLE_COMPLETION", "NOTES_COMPLETION", "FLOW_CHART_COMPLETION", "SUMMARY_COMPLETION"].includes(group.type) ? (
                                          <>
                                            <div className="space-y-1">
                                              <label className="text-[9px] font-bold text-gray-500 uppercase">Question Prompt / Text</label>
                                              <FormatInput
                                                value={q.questionText}
                                                onChange={(val) => handleListeningQuestionChange(activeListeningSectionIdx, groupIdx, qIdx, "questionText", val)}
                                                placeholder="e.g. Farm shop / Given name: John..."
                                              />
                                            </div>

                                            <div className="space-y-1">
                                              <label className="text-[9px] font-bold text-gray-500 uppercase">Correct Answer</label>
                                              <FormatInput
                                                value={q.correctAnswer}
                                                onChange={(val) => handleListeningQuestionChange(activeListeningSectionIdx, groupIdx, qIdx, "correctAnswer", val)}
                                                placeholder="Enter exact correct answer..."
                                              />
                                            </div>
                                          </>
                                        ) : (
                                          <div className="md:col-span-2 space-y-1">
                                            <label className="text-[9px] font-bold text-gray-555 uppercase">Correct Answer</label>
                                            <FormatInput
                                              value={q.correctAnswer}
                                              onChange={(val) => handleListeningQuestionChange(activeListeningSectionIdx, groupIdx, qIdx, "correctAnswer", val)}
                                              placeholder="Enter exact correct answer..."
                                            />
                                          </div>
                                        )}

                                        <div className="md:col-span-2 space-y-1">
                                          <label className="text-[9px] font-bold text-gray-555 uppercase">Explanation / Notes</label>
                                          <FormatInput
                                            value={q.explanation}
                                            onChange={(val) => handleListeningQuestionChange(activeListeningSectionIdx, groupIdx, qIdx, "explanation", val)}
                                            placeholder="Provide correct answer explanations..."
                                          />
                                        </div>
                                      </div>

                                      {/* MCQ / CHECKBOX OPTIONS LIST */}
                                      {(isMCQ || isCheckbox) && (
                                        group.type === "MULTIPLE_CHOICE_MULTIPLE" && qIdx > 0 ? (
                                          <div className="mt-3 bg-slate-50 border border-gray-250 rounded-lg p-3 text-[10px] text-gray-500 font-semibold italic">
                                            Option choices are shared with Question 1. Edit options in the first question card above.
                                          </div>
                                        ) : (
                                          <div className="mt-3 bg-white border border-gray-150 rounded-lg p-3 space-y-2.5">
                                            <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                                              <span className="text-[9px] font-bold text-gray-500 uppercase">Options (Choices) List</span>
                                              <button
                                                type="button"
                                                onClick={() => handleAddListeningMCQOption(activeListeningSectionIdx, groupIdx, qIdx)}
                                                className="px-2 py-0.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-[9px] font-bold text-gray-655 transition select-none cursor-pointer"
                                              >
                                                + Add Choice
                                              </button>
                                            </div>

                                            {q.options?.length === 0 && (
                                              <div className="text-[10px] text-gray-400 font-semibold py-1">No choices configured yet. Click Add Choice.</div>
                                            )}

                                            <div className="space-y-1.5">
                                              {q.options?.map((opt: string, optionIdx: number) => {
                                                const labelChar = String.fromCharCode(65 + optionIdx);
                                                return (
                                                  <div key={optionIdx} className="flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-full bg-slate-100 text-[10px] font-black text-gray-500 flex items-center justify-center shrink-0">
                                                      {labelChar}
                                                    </span>
                                                    <FormatInput
                                                      value={opt}
                                                      onChange={(val) => handleListeningMCQOptionChange(activeListeningSectionIdx, groupIdx, qIdx, optionIdx, val)}
                                                      className="flex-grow h-7 px-2 border border-gray-300 rounded text-xs text-gray-700 bg-white font-medium pr-8"
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={() => handleRemoveListeningMCQOption(activeListeningSectionIdx, groupIdx, qIdx, optionIdx)}
                                                      className="text-gray-400 hover:text-rose-550 transition p-1 shrink-0 cursor-pointer"
                                                    >
                                                      &times;
                                                    </button>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* TAB: READING (Hubuhu matching standalone create form) */}
            {/* ========================================================== */}
            {activeTab === "reading" && (
              <div>
                <ReadingCreatorWorkspace embedded onExamReady={setSharedReadingExam} />
              </div>
            )}

            {showLegacyModuleBuilders && activeTab === "reading" && (
              <div className="flex-1 space-y-6">
                
                {/* Top Welcome & Header Info (re-styled to fit in layout frame) */}
                <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-205 shadow-2xs relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />
                  
                  <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="text-base font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
                      <IconNotebook size={20} className="text-indigo-650" />
                      <span>Reading CBT Assembly Desk</span>
                    </h3>
                    <p className="text-gray-505 font-medium text-xs leading-normal">
                      Copy-replica of the standalone Reading creator workspace. Supports <strong>3 Passages</strong> and up to <strong>40 Questions</strong>.
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-12">
                  
                  {/* Left Workspace Column (8) */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* Exam metadata specifications */}
                    <Card className="bg-white border-gray-200 shadow-xs">
                      <CardHeader className="pb-3 border-b border-gray-100">
                        <CardTitle className="font-bold text-black text-sm uppercase tracking-wide">Exam Metadata</CardTitle>
                        <CardDescription className="text-gray-500 text-xs font-semibold">Set the title, instructions description, and duration timer for this module.</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-5 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-gray-505 uppercase tracking-widest block font-bold">Reading Title <span className="text-rose-500">*</span></label>
                            <textarea 
                              rows={2}
                              value={readTitle}
                              onChange={(e) => setReadTitle(e.target.value)}
                              placeholder="e.g. Cambridge IELTS Academic Reading Practice Test 1" 
                              className="w-full font-bold text-xs text-black px-4.5 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-400 bg-gray-50/50 text-black placeholder:text-gray-400 resize-y"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-505 uppercase tracking-widest block">Duration (Minutes)</label>
                            <input 
                              type="number" 
                              value={readDuration}
                              onChange={(e) => setReadDuration(Number(e.target.value))}
                              placeholder="60" 
                              className="w-full font-bold text-xs text-black px-4.5 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-400 bg-gray-50/50 text-black h-9"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-555 uppercase tracking-widest block">Description Instruction (Optional)</label>
                          <textarea 
                            rows={2}
                            value={readDesc}
                            onChange={(e) => setReadDesc(e.target.value)}
                            placeholder="e.g. Academic reading evaluation. Consists of 3 sections." 
                            className="w-full font-bold text-xs text-black px-4.5 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-400 bg-gray-50/50 text-black placeholder:text-gray-400 resize-y"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Passage Tab Selectors */}
                    <ReadingSectionTabs
                      sectionCount={passageCount}
                      activeSection={activePassage}
                      onSectionChange={(section) => {
                        setActivePassage(section);
                        setSelectedQuestionType(null);
                      }}
                      isSectionComplete={(section) => Boolean(passages[section].title.trim())}
                    />

                    {/* Passage Form Card */}
                    <Card className="bg-white border-gray-200 shadow-xs relative overflow-hidden pt-5">
                      <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-indigo-500 to-indigo-600" />
                      
                      <CardHeader className="pb-3 border-b border-gray-100">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <CardTitle className="font-extrabold text-black text-sm uppercase tracking-wide flex items-center gap-2">
                              Passage {activePassage} Specifications
                            </CardTitle>
                            <CardDescription className="text-gray-555 text-xs font-semibold">Input reading text body, upload documents (PDF) or graphs (Images) for Passage {activePassage}.</CardDescription>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
                            Section {activePassage}
                          </span>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-5 space-y-5">
                        
                        {/* Passage Title */}
                        <div className="space-y-1">
                          <ReadFormatToolbar 
                            inputRef={readPassageTitleRef}
                            value={passages[activePassage].title}
                            onChange={(val) => updatePassageField('title', val)}
                            label={`Passage ${activePassage} Title`}
                          />
                          <textarea 
                            ref={readPassageTitleRef}
                            rows={2}
                            value={passages[activePassage].title}
                            onChange={(e) => updatePassageField('title', e.target.value)}
                            placeholder={`e.g. Passage ${activePassage}: History and Development of English Bridges`} 
                            className="w-full font-semibold text-xs text-black px-4.5 py-2.5 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-400 bg-gray-50/50 text-black placeholder:text-gray-400 resize-y"
                          />
                        </div>

                        {/* Passage Description */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                            Passage {activePassage} Description / Spent Time Instruction
                          </label>
                          <textarea 
                            ref={readPassageInstructionRef}
                            rows={2}
                            value={passages[activePassage].instruction || ''}
                            onChange={(e) => updatePassageField('instruction', e.target.value)}
                            placeholder="e.g. You should spend about 20 minutes on Questions 14-26 which are based on Reading Passage 2 below." 
                            className="w-full text-xs font-normal px-4.5 py-2.5 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-400 bg-gray-50/50 text-black placeholder:text-gray-400 resize-y"
                          />
                        </div>

                        {/* Image Upload System */}
                        <div className="flex flex-col">
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Attach Passage Image Diagram</label>
                          <input 
                            type="file" 
                            accept="image/*" 
                            ref={imageInputRef}
                            onChange={(e) => handleReadingImageChange(e)}
                            className="hidden" 
                          />
                          
                          {uploadingImage ? (
                            <div className="flex flex-col items-center justify-center p-5 border border-indigo-205 bg-indigo-50/30 rounded-xl h-36">
                              <IconLoader2 size={32} className="text-indigo-650 animate-spin" />
                              <span className="text-xs text-indigo-950 font-bold mt-2">Uploading Image...</span>
                            </div>
                          ) : passages[activePassage].image ? (
                            <div className="relative group rounded-xl overflow-hidden border border-gray-200 h-36 flex items-center justify-center bg-gray-50/55 animate-fadeIn">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={passages[activePassage].image || ''} alt="Passage visual chart reference" className="h-full w-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center transition-opacity duration-200 text-white p-2">
                                <span className="font-bold text-xs truncate max-w-[150px]">{passages[activePassage].imageName}</span>
                                <Button 
                                  onClick={() => { updatePassageField('image', null); updatePassageField('imageName', ''); }}
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-400 hover:text-red-600 font-bold hover:bg-transparent text-[10px] mt-2 h-6 p-0 cursor-pointer"
                                >
                                  Remove Image
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              onClick={() => imageInputRef.current?.click()}
                              className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-200 hover:border-indigo-300 rounded-xl cursor-pointer hover:bg-gray-50/40 transition-all duration-205 h-36 text-center group"
                            >
                              <IconPhoto size={32} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
                              <span className="font-bold text-xs text-gray-800 mt-2">Upload Visual Diagram</span>
                              <span className="text-[10px] text-gray-400 font-semibold mt-1">For chart, graph, map details</span>
                            </div>
                          )}
                        </div>

                        {/* Passage Body Text */}
                        <div className="space-y-1">
                          <ReadFormatToolbar 
                            inputRef={readPassageBodyRef}
                            value={passages[activePassage].body}
                            onChange={(val) => updatePassageField('body', val)}
                            label={`Passage ${activePassage} Body Text`}
                          />
                          <textarea 
                            ref={readPassageBodyRef}
                            rows={8}
                            value={passages[activePassage].body}
                            onChange={(e) => updatePassageField('body', htmlPassageToEditableText(e.target.value))}
                            placeholder="Enter the full Reading Passage paragraphs..." 
                            className="w-full text-xs font-semibold px-4.5 py-3 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-400 bg-gray-50/50 text-black placeholder:text-gray-400 resize-y"
                          />
                        </div>

                      </CardContent>
                    </Card>

                    {/* Questions Configurator */}
                    <Card className="bg-white border-gray-200 shadow-xs">
                      <CardHeader className="pb-3 border-b border-gray-100">
                        <CardTitle className="font-bold text-black text-sm uppercase tracking-wide">Add Questions to Passage {activePassage}</CardTitle>
                        <CardDescription className="text-gray-500 text-xs font-semibold">Select an official IELTS question type to build and associate questions specifically under Passage {activePassage}.</CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pt-5 space-y-5">
                        
                        {/* Question Types List Grid */}
                        <div className="grid gap-2 sm:grid-cols-3">
                          {readingQuestionTypes.map((type) => {
                            const isSelected = selectedQuestionType === type.code;
                            return (
                              <button
                                key={type.code}
                                type="button"
                                onClick={() => {
                                  setSelectedQuestionType(type.code);
                                  if (type.code === "R-MINF") {
                                    if (!groupOptions.trim()) setGroupOptions("A\nB\nC\nD\nE\nF\nG");
                                    if (!questionInstruction.trim() || questionInstruction === "||||||" || questionInstruction === "|||") {
                                      setQuestionInstruction("|||Which paragraph contains the following information?|||Write the correct letter, A–G. NB You may use any letter more than once.|||");
                                    }
                                  } else if (type.code === "R-NMATCH") {
                                    if (!groupOptions.trim()) setGroupOptions("A  Person one\nB  Person two\nC  Person three");
                                    if (!questionInstruction.trim() || questionInstruction === "||||||" || questionInstruction === "|||") {
                                      setQuestionInstruction("|||Look at the following statements and the list of people below.|||Match each statement with the correct person or people, A–E.|||Write the correct letter, A–E, in the boxes on your answer sheet.");
                                    }
                                  } else if (type.code === "R-TFN") {
                                    if (!questionInstruction.trim() || questionInstruction === "||||||" || questionInstruction === "|||") {
                                      setQuestionInstruction("|||Do the following statements agree with the information given in Reading Passage?|||In boxes on your answer sheet, write:||||||TRUE  if the statement agrees with the information|||FALSE  if the statement contradicts the information|||NOT GIVEN  if there is no information on this");
                                    }
                                  } else if (type.code === "R-YNN") {
                                    if (!questionInstruction.trim() || questionInstruction === "||||||" || questionInstruction === "|||") {
                                      setQuestionInstruction("|||Do the following statements agree with the claims of the writer in Reading Passage?|||In boxes on your answer sheet, write:||||||YES  if the statement agrees with the claims|||NO  if the statement contradicts the claims|||NOT GIVEN  if there is no information on this");
                                    }
                                  } else if (type.code === "R-MHDG") {
                                    if (!questionInstruction.trim() || questionInstruction === "||||||" || questionInstruction === "|||") {
                                      setQuestionInstruction("|||Choose the correct heading for each paragraph from the list of headings below.|||Write the correct number, i–x, in boxes on your answer sheet.|||");
                                    }
                                  } else if (type.code === "R-SCOMP") {
                                    if (!questionInstruction.trim() || questionInstruction === "||||||" || questionInstruction === "|||") {
                                      setQuestionInstruction("|||Complete the sentences below.|||Choose NO MORE THAN TWO WORDS from the passage for each answer.||||||INST3:Write your answers in boxes on your answer sheet.");
                                    }
                                  }
                                }}
                                className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-50/75 border-indigo-455 text-indigo-950 font-bold ring-2 ring-indigo-100 shadow-inner'
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/20'
                                }`}
                              >
                                <span className="text-[8px] font-black uppercase bg-indigo-50 border border-indigo-100 text-indigo-650 px-1.5 py-0.5 rounded block w-max">
                                  {type.code}
                                </span>
                                <h4 className="font-extrabold text-xs text-black mt-2 leading-snug">{type.title}</h4>
                                <p className="text-[10px] text-gray-400 font-semibold mt-1 leading-normal line-clamp-2">{type.desc}</p>
                              </button>
                            );
                          })}
                        </div>

                        {/* Question Building Form */}
                        {selectedQuestionType ? (
                          <div className="p-5 border border-indigo-100 bg-indigo-50/20 rounded-xl space-y-4 animate-fadeIn">
                            <div className="flex justify-between items-center border-b border-indigo-100/50 pb-2">
                              <span className="text-xs font-black text-indigo-955">
                                Configuring for Passage {activePassage}: {readingQuestionTypes.find(t => t.code === selectedQuestionType)?.title}
                              </span>
                              <Button 
                                type="button"
                                onClick={() => setSelectedQuestionType(null)} 
                                variant="ghost" 
                                className="text-[10px] text-gray-400 font-bold h-6 hover:bg-transparent cursor-pointer"
                              >
                                Cancel
                              </Button>
                            </div>

                            {selectedQuestionType === "R-MHDG" && (
                              <div className="bg-white p-4 rounded-xl border border-indigo-100/55 space-y-4 shadow-xs animate-fadeIn">
                                {/* Clue Mode Toggle */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-50/50 pb-3">
                                  <div className="space-y-0.5">
                                    <span className="text-xs font-bold text-gray-800">Matching Headings Clue Type</span>
                                    <p className="text-[10px] text-gray-455 font-semibold leading-relaxed">Choose whether students select headings from a dropdown list (With Clues) or manually type Roman numerals (Without Clues).</p>
                                  </div>
                                  <div className="flex gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setMhdgMode("WITHOUT_CLUES")}
                                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-150 cursor-pointer ${
                                        mhdgMode === "WITHOUT_CLUES"
                                          ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                                          : "bg-slate-50 border-gray-200 text-gray-700 hover:bg-slate-100"
                                      }`}
                                    >
                                      Without Clues
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setMhdgMode("WITH_CLUES")}
                                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-150 cursor-pointer ${
                                        mhdgMode === "WITH_CLUES"
                                          ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                                          : "bg-slate-50 border-gray-200 text-gray-700 hover:bg-slate-100"
                                      }`}
                                    >
                                      With Clues
                                    </button>
                                  </div>
                                </div>

                                {/* Example Checkbox */}
                                <div className="space-y-2">
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={hasExample}
                                      onChange={(e) => setHasExample(e.target.checked)}
                                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                    />
                                    <span className="text-xs font-bold text-gray-800">Include Example Question (Standard IELTS format)</span>
                                  </label>

                                  {hasExample && (
                                    <div className="grid gap-3 sm:grid-cols-2 p-3 bg-slate-50/70 border border-slate-200 rounded-lg animate-fadeIn">
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-indigo-705 uppercase tracking-widest block">Example Paragraph/Section</label>
                                        <input
                                          type="text"
                                          value={exampleParagraph}
                                          onChange={(e) => setExampleParagraph(e.target.value)}
                                          placeholder="e.g. Paragraph A"
                                          className="w-full text-xs font-semibold px-3 py-2 border border-gray-200 rounded-lg bg-white text-black focus:outline-hidden focus:border-indigo-400"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-indigo-705 uppercase tracking-widest block">Example Correct Heading Answer</label>
                                        {groupOptions.trim() ? (
                                          <select
                                            value={exampleAnswer}
                                            onChange={(e) => setExampleAnswer(e.target.value)}
                                            className="w-full text-xs font-semibold px-2 py-2 border border-gray-200 rounded-lg bg-white text-black focus:outline-hidden focus:border-indigo-400"
                                          >
                                            <option value="">-- Choose Option --</option>
                                            {groupOptions.split("\n").map(o => o.trim()).filter(Boolean).map((opt, idx) => (
                                              <option key={idx} value={opt}>{opt}</option>
                                            ))}
                                          </select>
                                        ) : (
                                          <input
                                            type="text"
                                            value={exampleAnswer}
                                            onChange={(e) => setExampleAnswer(e.target.value)}
                                            placeholder="e.g. iii"
                                            className="w-full text-xs font-semibold px-3 py-2 border border-gray-200 rounded-lg bg-white text-black focus:outline-hidden focus:border-indigo-400"
                                          />
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Question Reference Image */}
                            <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
                              <input 
                                type="file" 
                                accept="image/*" 
                                ref={qImageInputRef}
                                onChange={(e) => handleReadingImageChange(e, true)}
                                className="hidden" 
                              />
                              {uploadingQImage ? (
                                <div className="flex items-center gap-2">
                                  <IconLoader2 size={16} className="text-indigo-650 animate-spin shrink-0" />
                                  <span className="text-xs font-semibold text-gray-500">Uploading visual chart...</span>
                                </div>
                              ) : (
                                <Button
                                  type="button"
                                  onClick={() => qImageInputRef.current?.click()}
                                  size="sm"
                                  variant="outline"
                                  className="font-bold border-gray-200 text-xs shrink-0 text-gray-700 cursor-pointer"
                                >
                                  <IconPhoto size={16} className="text-indigo-500 mr-1" />
                                  {questionImageName ? 'Change Image' : 'Attach Question Image'}
                                </Button>
                              )}
                              {!uploadingQImage && (
                                <>
                                  <span className="text-xs text-gray-400 font-semibold truncate flex-1">
                                    {questionImageName || "Optional flowchart, chart segment, or blank labelling visual."}
                                  </span>
                                  {questionImage && (
                                    <Button 
                                      onClick={() => { setQuestionImage(null); setQuestionImageName(''); }}
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-red-500 p-1 hover:bg-transparent cursor-pointer"
                                    >
                                      <IconTrash size={16} />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Question Number Override & IELTS Header Configuration */}
                            <div className="grid gap-3 sm:grid-cols-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-indigo-705 uppercase tracking-widest block">Q# (Optional)</label>
                                <input 
                                  type="number" 
                                  value={customQuestionNumber}
                                  onChange={(e) => setCustomQuestionNumber(e.target.value === '' ? '' : Number(e.target.value))}
                                  placeholder={String(readingQuestions.length + 1)} 
                                  className="w-full text-xs font-bold px-3 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-hidden focus:border-indigo-400 text-black h-9"
                                />
                              </div>
                              
                              {selectedQuestionType === "R-SCOMP" && (() => {
                                const parsed = parseGroupInstruction(questionInstruction);
                                const currentPassageQuestions = readingQuestions.filter(q => q.passageIndex === activePassage);
                                const scompQuestions = currentPassageQuestions.filter(q => q.typeCode === "R-SCOMP" || q.type === "SENTENCE_COMPLETION");
                                const nextQNum = typeof customQuestionNumber === "number" && customQuestionNumber > 0
                                  ? customQuestionNumber
                                  : readingQuestions.length + 1;
                                const rangeStart = scompQuestions.length > 0 ? Math.min(...scompQuestions.map(q => q.questionNumber)) : nextQNum;
                                const rangeEnd = scompQuestions.length > 0 ? Math.max(...scompQuestions.map(q => q.questionNumber), nextQNum) : nextQNum;
                                const automaticRange = rangeStart === rangeEnd
                                  ? `Question ${rangeStart}`
                                  : `Questions ${rangeStart}–${rangeEnd}`;
                                const rangeBoxStr = rangeStart === rangeEnd ? `box ${rangeStart}` : `boxes ${rangeStart}–${rangeEnd}`;

                                const updateScompInstruction = (field: "range" | "inst1" | "inst2" | "inst3" | "heading", val: string) => {
                                  const next = { ...parsed, [field]: val };
                                  const inst3Part = next.inst3?.trim() ? `|||INST3:${next.inst3.trim()}` : "";
                                  const listItemsJoined = (next.listItems || []).join("|||");
                                  const serialized = `${next.range.trim()}|||${next.inst1.trim()}|||${next.inst2.trim()}|||${next.heading.trim()}${inst3Part}${
                                    listItemsJoined ? "|||" + listItemsJoined : ""
                                  }`;
                                  setQuestionInstruction(serialized);
                                };

                                return (
                                  <div className="sm:col-span-3 space-y-4 bg-indigo-50/40 p-4 rounded-xl border border-indigo-200 shadow-xs animate-fadeIn">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="text-[11px] font-black uppercase text-indigo-900 tracking-wider block">
                                          Sentence Completion Instruction Configuration
                                        </span>
                                        <p className="text-[10px] font-medium text-gray-500 mt-0.5">
                                          Configure the 3 instruction lines to match standard IELTS exam format.
                                        </p>
                                      </div>
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                        IELTS Standard (3 Lines)
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {/* 1. Question Range Header */}
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-black text-gray-600 uppercase flex items-center justify-between">
                                          <span>1. Question Range Header</span>
                                          <span className="text-gray-400 font-normal lowercase">(optional heading)</span>
                                        </label>
                                        <ReadIeltsHeaderInput
                                          value={parsed.range || automaticRange}
                                          onChange={(val) => updateScompInstruction("range", val)}
                                          placeholder="e.g. Questions 23–26"
                                        />
                                      </div>

                                      {/* 2. Instruction Line 1: Main Task */}
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-black text-gray-600 uppercase">
                                          2. Instruction Line 1 (Main Task)
                                        </label>
                                        <ReadIeltsHeaderInput
                                          value={parsed.inst1}
                                          onChange={(val) => updateScompInstruction("inst1", val)}
                                          placeholder="Complete the sentences below."
                                        />
                                      </div>

                                      {/* 3. Instruction Line 2: Word Limit Rule */}
                                      <div className="space-y-1 sm:col-span-2">
                                        <label className="text-[9px] font-black text-gray-600 uppercase flex items-center justify-between">
                                          <span>3. Instruction Line 2 (Word Limit Rule)</span>
                                          <span className="text-indigo-600 font-bold text-[9px]">Click quick presets to auto-fill</span>
                                        </label>
                                        <ReadIeltsHeaderInput
                                          value={parsed.inst2}
                                          onChange={(val) => updateScompInstruction("inst2", val)}
                                          placeholder="Choose NO MORE THAN TWO WORDS from the passage for each answer."
                                        />
                                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                          <span className="text-[9px] font-bold text-gray-500">Quick Word Limits:</span>
                                          {[
                                            "Choose NO MORE THAN TWO WORDS from the passage for each answer.",
                                            "Choose ONE WORD ONLY from the passage for each answer.",
                                            "Choose NO MORE THAN THREE WORDS AND/OR A NUMBER from the passage for each answer.",
                                            "Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer."
                                          ].map((preset, pIdx) => {
                                            const shortLabel = preset.includes("TWO WORDS AND/OR A NUMBER")
                                              ? "NO MORE THAN 2 WORDS & NUMBER"
                                              : preset.includes("THREE WORDS")
                                              ? "NO MORE THAN 3 WORDS"
                                              : preset.includes("ONE WORD ONLY")
                                              ? "ONE WORD ONLY"
                                              : "NO MORE THAN 2 WORDS";
                                            return (
                                              <button
                                                key={pIdx}
                                                type="button"
                                                onClick={() => updateScompInstruction("inst2", preset)}
                                                className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                                                  parsed.inst2 === preset
                                                    ? "bg-indigo-600 text-white border-indigo-600"
                                                    : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                                                }`}
                                              >
                                                {shortLabel}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      {/* 4. Instruction Line 3: Answer Sheet Box Instruction */}
                                      <div className="space-y-1 sm:col-span-2">
                                        <div className="flex items-center justify-between">
                                          <label className="text-[9px] font-black text-gray-600 uppercase">
                                            4. Instruction Line 3 (Answer Sheet Boxes)
                                          </label>
                                          <button
                                            type="button"
                                            onClick={() => updateScompInstruction("inst3", `Write your answers in ${rangeBoxStr} on your answer sheet.`)}
                                            className="text-[9px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                          >
                                            ⚡ Auto-fill: &quot;Write your answers in {rangeBoxStr} on your answer sheet.&quot;
                                          </button>
                                        </div>
                                        <ReadIeltsHeaderInput
                                          value={parsed.inst3 || ""}
                                          onChange={(val) => updateScompInstruction("inst3", val)}
                                          placeholder={`Write your answers in ${rangeBoxStr} on your answer sheet.`}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              {selectedQuestionType !== "R-SCOMP" && (() => {
                                const parsed = parseGroupInstruction(questionInstruction);
                                
                                const updateField = (field: "range" | "inst1" | "inst2" | "heading" | "inst3", val: string) => {
                                  const next = { ...parsed, [field]: val };
                                  const inst3Part = next.inst3?.trim() ? `|||INST3:${next.inst3.trim()}` : "";
                                  const listItemsJoined = (next.listItems || []).join("|||");
                                  const serialized = `${next.range.trim()}|||${next.inst1.trim()}|||${next.inst2.trim()}|||${next.heading.trim()}${inst3Part}${
                                    listItemsJoined ? "|||" + listItemsJoined : ""
                                  }`;
                                  setQuestionInstruction(serialized);
                                };

                                const handleAddListItem = () => {
                                  const currentItems = parsed.listItems || [];
                                  const nextItems = [...currentItems, ""];
                                  const inst3Part = parsed.inst3?.trim() ? `|||INST3:${parsed.inst3.trim()}` : "";
                                  const serialized = `${parsed.range.trim()}|||${parsed.inst1.trim()}|||${parsed.inst2.trim()}|||${parsed.heading.trim()}${inst3Part}|||${nextItems.join("|||")}`;
                                  setQuestionInstruction(serialized);
                                };

                                const handleUpdateListItem = (index: number, val: string) => {
                                  const nextItems = [...(parsed.listItems || [])];
                                  nextItems[index] = val;
                                  const inst3Part = parsed.inst3?.trim() ? `|||INST3:${parsed.inst3.trim()}` : "";
                                  const serialized = `${parsed.range.trim()}|||${parsed.inst1.trim()}|||${parsed.inst2.trim()}|||${parsed.heading.trim()}${inst3Part}|||${nextItems.join("|||")}`;
                                  setQuestionInstruction(serialized);
                                };

                                const handleRemoveListItem = (index: number) => {
                                  const nextItems = (parsed.listItems || []).filter((_, idx) => idx !== index);
                                  const inst3Part = parsed.inst3?.trim() ? `|||INST3:${parsed.inst3.trim()}` : "";
                                  const serialized = `${parsed.range.trim()}|||${parsed.inst1.trim()}|||${parsed.inst2.trim()}|||${parsed.heading.trim()}${inst3Part}${nextItems.length > 0 ? "|||" + nextItems.join("|||") : ""}`;
                                  setQuestionInstruction(serialized);
                                };

                                return (
                                  <div className="sm:col-span-3 space-y-4 bg-slate-50 p-4 rounded-xl border border-indigo-100">
                                    <span className="text-[10px] font-extrabold uppercase text-indigo-900 tracking-wider block mb-1 font-bold">
                                      IELTS Block Header Configuration
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-black text-gray-500 uppercase">1. Question Range</label>
                                        <ReadIeltsHeaderInput
                                          value={parsed.range}
                                          onChange={(val) => updateField("range", val)}
                                          placeholder="e.g. Questions 1–5"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-black text-gray-500 uppercase">2. Question Title/Heading (Centered)</label>
                                        <ReadIeltsHeaderInput
                                          value={parsed.heading}
                                          onChange={(val) => updateField("heading", val)}
                                          placeholder="e.g. Clean energy solution"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-black text-gray-500 uppercase">3. Instruction Line 1 (Italic)</label>
                                        <ReadIeltsHeaderInput
                                          value={parsed.inst1}
                                          onChange={(val) => updateField("inst1", val)}
                                          placeholder="e.g. Choose the correct letter..."
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-black text-gray-500 uppercase">4. Instruction Line 2 (Italic)</label>
                                        <ReadIeltsHeaderInput
                                          value={parsed.inst2}
                                          onChange={(val) => updateField("inst2", val)}
                                          placeholder="e.g. Write the correct letter..."
                                        />
                                      </div>
                                      <div className="space-y-1 sm:col-span-2">
                                        <label className="text-[9px] font-black text-gray-500 uppercase">5. Instruction Line 3 (Italic - Optional)</label>
                                        <ReadIeltsHeaderInput
                                          value={parsed.inst3 || ""}
                                          onChange={(val) => updateField("inst3", val)}
                                          placeholder="e.g. Write your answers in boxes on your answer sheet."
                                        />
                                      </div>
                                    </div>

                                    {/* Dynamic list items block */}
                                    <div className="border-t border-indigo-100/60 pt-3 space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-bold uppercase text-indigo-900 tracking-wider block">
                                          Custom Instruction List Box (e.g. TRUE/FALSE Keys)
                                        </span>
                                        <button
                                          type="button"
                                          onClick={handleAddListItem}
                                          className="text-[9px] font-extrabold uppercase px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
                                        >
                                          + Add Instruction Line
                                        </button>
                                      </div>

                                      <div className="space-y-3">
                                        {(parsed.listItems || []).map((item, itemIdx) => (
                                          <div key={itemIdx} className="flex gap-2 items-start bg-white p-2.5 rounded-lg border border-indigo-100">
                                            <div className="flex-1 min-w-0">
                                              <ReadIeltsHeaderInput
                                                value={item}
                                                onChange={(val) => handleUpdateListItem(itemIdx, val)}
                                                placeholder="e.g. TRUE  if the statement agrees with the information"
                                              />
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveListItem(itemIdx)}
                                              className="text-[10px] font-bold text-red-500 hover:text-red-750 px-2 py-2 mt-7 shrink-0 cursor-pointer"
                                            >
                                              Remove
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Conditional input: Matching Options */}
                            {["R-MHDG", "R-MINF", "R-NMATCH", "R-MFT", "R-MSE", "R-SCO"].includes(selectedQuestionType) && (
                              <div className="space-y-1">
                                <ReadFormatToolbar 
                                  inputRef={readGroupOptionsRef}
                                  value={groupOptions}
                                  onChange={setGroupOptions}
                                  label={selectedQuestionType === "R-MHDG"
                                    ? "List of Headings"
                                    : selectedQuestionType === "R-MINF"
                                    ? "Paragraph dropdown options"
                                    : selectedQuestionType === "R-NMATCH"
                                    ? "List of People"
                                    : "List of Options (One per line)"}
                                />
                                {selectedQuestionType === "R-MSE" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setGroupOptions([
                                        "A  the question of how certain long-lost traits could reappear.",
                                        "B  the occurrence of a particular feature in different species.",
                                        "C  parallels drawn between behaviour and appearance.",
                                        "D  the continued existence of certain genetic information.",
                                        "E  the doubts felt about evolutionary throwbacks.",
                                        "F  the possibility of evolution being reversible.",
                                        "G  Dollo's findings and the convictions held by Lombroso."
                                      ].join("\n"));
                                      setQuestionInstruction("|||Complete each sentence with the correct ending, A–G, below.|||Write the correct letter, A–G, in boxes on your answer sheet.|||");
                                      toast.success("Loaded Matching Sentence Endings template (A–G).");
                                    }}
                                    className="rounded border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-800 hover:bg-indigo-100"
                                  >
                                    Load Evolutionary Throwbacks sample (A–G)
                                  </button>
                                )}
                                <textarea 
                                  ref={readGroupOptionsRef}
                                  rows={4}
                                  value={groupOptions}
                                  onChange={(e) => setGroupOptions(e.target.value)}
                                  placeholder={
                                    selectedQuestionType === "R-SCO"
                                      ? `e.g.\nA  constant conflict\nB  additional evidence\nC  different locations\nD  experimental subjects`
                                      : selectedQuestionType === "R-NMATCH"
                                      ? `A  Freeman\nB  Shore and Kanevsky\nC  Elshout\nD  Simonton\nE  Boekaerts`
                                      : selectedQuestionType === "R-MSE"
                                      ? `A  first possible ending.\nB  second possible ending.\nC  third possible ending.`
                                      : `e.g.\ni   Heading 1\nii  Heading 2\niii Heading 3`
                                  } 
                                  className="w-full text-xs font-semibold px-3.5 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-hidden focus:border-indigo-400 text-black placeholder:text-gray-400 resize-none font-mono"
                                  required
                                />
                                <p className="text-[10px] text-gray-400 font-semibold">Enter options, features, or headings that the student will select from in a select dropdown.</p>
                              </div>
                            )}

                            {/* Conditional input: Table / Flow-chart / Notes / Summary Template */}
                            {["R-TABLE", "R-FLOW", "R-NCOMP", "R-SCO", "R-SCWO"].includes(selectedQuestionType) && (
                              <div className="space-y-1">
                                {selectedQuestionType === "R-TABLE" ? (
                                  <>
                                    <label className="text-[10px] font-bold text-indigo-705 uppercase tracking-widest block font-bold mb-1">
                                      Table Template Editor <span className="text-rose-500">*</span>
                                    </label>
                                    <VisualTableBuilder 
                                      value={passageSegment} 
                                      onChange={(val) => setPassageSegment(val)} 
                                    />
                                  </>
                                ) : selectedQuestionType === "R-NCOMP" ? (
                                  <>
                                    <label className="text-[10px] font-bold text-indigo-705 uppercase tracking-widest block font-bold mb-1">
                                      Notes Completion Editor <span className="text-rose-500">*</span>
                                    </label>
                                    <VisualNotesBuilder
                                      value={passageSegment}
                                      onChange={(val) => setPassageSegment(val)}
                                      questions={
                                        (() => {
                                          const existing = readingQuestions
                                            .filter(q => q.passageIndex === activePassage && q.typeCode === "R-NCOMP")
                                            .map(q => q.questionNumber);
                                          const nextQNum = Number(customQuestionNumber) || (readingQuestions.length + 1);
                                          const allNums = Array.from(new Set([...existing, nextQNum])).sort((a, b) => a - b);
                                          return allNums.map(num => ({ questionNumber: num }));
                                        })()
                                      }
                                    />
                                    {getPlaceholderNumbers(passageSegment).length > 0 && (
                                      <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
                                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                          <p className="text-xs font-extrabold uppercase tracking-wide text-indigo-950">
                                            Correct answers — {getPlaceholderNumbers(passageSegment).length} blanks
                                          </p>
                                          <span className="rounded-full bg-indigo-700 px-2.5 py-1 text-[10px] font-bold text-white">
                                            Questions {getPlaceholderNumbers(passageSegment).join(", ")}
                                          </span>
                                        </div>
                                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                          {getPlaceholderNumbers(passageSegment).map((questionNumber) => {
                                            const savedAnswer = readingQuestions.find(
                                              (question) => question.passageIndex === activePassage && question.questionNumber === questionNumber
                                            )?.correctAnswer ?? "";
                                            return (
                                              <label key={questionNumber} className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-white p-2.5 shadow-sm">
                                                <span className="flex h-7 w-9 shrink-0 items-center justify-center rounded-md bg-indigo-700 text-xs font-black text-white">
                                                  {questionNumber}
                                                </span>
                                                <input
                                                  type="text"
                                                  value={noteAnswers[questionNumber] ?? savedAnswer}
                                                  onChange={(event) => setNoteAnswers((current) => ({ ...current, [questionNumber]: event.target.value }))}
                                                  placeholder={`Answer for [${questionNumber}]`}
                                                  className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-black outline-none"
                                                />
                                              </label>
                                            );
                                          })}
                                        </div>
                                        <p className="mt-3 text-[10px] font-medium text-indigo-800">Fill every box, then save all Note Completion answers together.</p>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <ReadFormatToolbar 
                                      inputRef={readPassageSegmentRef}
                                      value={passageSegment}
                                      onChange={setPassageSegment}
                                      label="Paragraph / Outline Template"
                                    />
                                    <textarea 
                                      ref={readPassageSegmentRef}
                                      rows={5}
                                      value={passageSegment}
                                      onChange={(e) => setPassageSegment(e.target.value)}
                                      placeholder={
                                        selectedQuestionType === "R-FLOW"
                                          ? "Step 1: Process begins\n↓\nStep 2: Temperature rises to [10]\n↓\nStep 3: Output details [11]"
                                          : selectedQuestionType === "R-SCO"
                                          ? "What happens when people encounter misinformation?\n\nAlthough people have [31] to misinformation, there is debate about precisely how and when we label something as true or untrue. The philosophers Descartes and Spinoza had [32] about how people engage..."
                                          : "Write summary text or bulleted notes. Place [1], [2], etc., where blanks should appear."
                                      }
                                      className="w-full text-xs font-semibold px-3.5 py-2.5 border border-indigo-100 rounded-lg bg-white focus:outline-hidden focus:border-indigo-400 text-black placeholder:text-gray-400 font-mono resize-y"
                                      required
                                    />
                                  </>
                                )}
                                <p className="text-[10px] text-gray-400 font-semibold">Define the text or table content. Put placeholders like <strong className="text-indigo-650">[9]</strong> inside cells or text to render dynamic student input fields.</p>
                              </div>
                            )}

                            {/* Question Text */}
                            <div className="space-y-1">
                              <ReadFormatToolbar 
                                inputRef={readQuestionTextRef}
                                value={questionText}
                                onChange={setQuestionText}
                                label={selectedQuestionType === "R-MHDG" ? "Paragraph/Section Reference" : "Question Text Prompt / Template"}
                              />
                              <textarea 
                                ref={readQuestionTextRef}
                                rows={2}
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                placeholder={
                                  selectedQuestionType === "R-MHDG"
                                    ? "e.g. Paragraph A"
                                    : selectedQuestionType === "R-MCQ"
                                    ? "e.g. Why did the company reduce working hours?"
                                    : "e.g. The experiment lasted for ______."
                                } 
                                className="w-full text-xs font-semibold px-3.5 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-hidden focus:border-indigo-400 text-black placeholder:text-gray-400 resize-none"
                              />
                              {["R-SCOMP", "R-SCO", "R-SCWO", "R-NCOMP", "R-FLOW", "R-DIAG"].includes(selectedQuestionType) && (
                                <p className="text-[10px] text-gray-405 font-semibold">Note: Write double underscores (____) to represent blanks inline if not using a template paragraph.</p>
                              )}
                            </div>

                            {/* MCQ Options Choices */}
                            {(selectedQuestionType === "R-MCQ" || selectedQuestionType === "R-MMCQ") && (
                              <div className="space-y-3">
                                <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/70 to-purple-50/40 p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-indigo-950">
                                      Question Format & Number of Answers
                                    </p>
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-white border border-indigo-200 px-2 py-0.5 rounded-full shadow-2xs">
                                      Unified MCQ Builder
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedQuestionType("R-MCQ");
                                        if (multiMcqCorrectAnswers.length > 0 && !correctAnswer) {
                                          setCorrectAnswer(multiMcqCorrectAnswers[0]);
                                        }
                                      }}
                                      className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                                        selectedQuestionType === "R-MCQ"
                                          ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                                          : "border-indigo-100 bg-white text-indigo-900 hover:border-indigo-300 hover:bg-indigo-50/30"
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 font-bold text-xs">
                                        <span>Choose 1 letter</span>
                                        {selectedQuestionType === "R-MCQ" && <span className="text-[10px] font-black">✓</span>}
                                      </div>
                                      <span className={`text-[10px] mt-0.5 ${selectedQuestionType === "R-MCQ" ? "text-indigo-100" : "text-gray-500"}`}>
                                        Standard 1 Question (A–D)
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedQuestionType("R-MMCQ");
                                        setMultiMcqAnswerCount(2);
                                        if (correctAnswer && !multiMcqCorrectAnswers.includes(correctAnswer)) {
                                          setMultiMcqCorrectAnswers([correctAnswer]);
                                        } else {
                                          setMultiMcqCorrectAnswers((current) => current.slice(0, 2));
                                        }
                                      }}
                                      className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                                        selectedQuestionType === "R-MMCQ" && multiMcqAnswerCount === 2
                                          ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                                          : "border-indigo-100 bg-white text-indigo-900 hover:border-indigo-300 hover:bg-indigo-50/30"
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 font-bold text-xs">
                                        <span>Choose TWO letters</span>
                                        {selectedQuestionType === "R-MMCQ" && multiMcqAnswerCount === 2 && <span className="text-[10px] font-black">✓</span>}
                                      </div>
                                      <span className={`text-[10px] mt-0.5 ${selectedQuestionType === "R-MMCQ" && multiMcqAnswerCount === 2 ? "text-indigo-100" : "text-gray-500"}`}>
                                        2 Questions (A–E)
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedQuestionType("R-MMCQ");
                                        setMultiMcqAnswerCount(3);
                                        if (correctAnswer && !multiMcqCorrectAnswers.includes(correctAnswer)) {
                                          setMultiMcqCorrectAnswers([correctAnswer]);
                                        } else {
                                          setMultiMcqCorrectAnswers((current) => current.slice(0, 3));
                                        }
                                      }}
                                      className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                                        selectedQuestionType === "R-MMCQ" && multiMcqAnswerCount === 3
                                          ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                                          : "border-indigo-100 bg-white text-indigo-900 hover:border-indigo-300 hover:bg-indigo-50/30"
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 font-bold text-xs">
                                        <span>Choose THREE letters</span>
                                        {selectedQuestionType === "R-MMCQ" && multiMcqAnswerCount === 3 && <span className="text-[10px] font-black">✓</span>}
                                      </div>
                                      <span className={`text-[10px] mt-0.5 ${selectedQuestionType === "R-MMCQ" && multiMcqAnswerCount === 3 ? "text-indigo-100" : "text-gray-500"}`}>
                                        3 Questions (A–G)
                                      </span>
                                    </button>
                                  </div>

                                  <p className="mt-2 text-[10.5px] text-indigo-800 font-medium">
                                    {selectedQuestionType === "R-MCQ"
                                      ? "💡 Standard IELTS: Student chooses 1 answer. Options A to D are typical (E optional)."
                                      : selectedQuestionType === "R-MMCQ" && multiMcqAnswerCount === 2
                                      ? "💡 Standard IELTS: Creates 2 numbered questions (e.g. 37–38). Fill options A through E."
                                      : "💡 Standard IELTS: Creates 3 numbered questions (e.g. 24–26). Fill options A through G."}
                                  </p>
                                </div>
                                <label className="text-[10px] font-bold text-indigo-705 uppercase tracking-widest block">Multiple Choice Options</label>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <ReadFormatInput 
                                    inputRef={readMcqOptARef}
                                    value={mcqOptA}
                                    onChange={setMcqOptA}
                                    placeholder="Option A text"
                                    required
                                  />
                                  <ReadFormatInput 
                                    inputRef={readMcqOptBRef}
                                    value={mcqOptB}
                                    onChange={setMcqOptB}
                                    placeholder="Option B text"
                                    required
                                  />
                                  <ReadFormatInput 
                                    inputRef={readMcqOptCRef}
                                    value={mcqOptC}
                                    onChange={setMcqOptC}
                                    placeholder="Option C text"
                                    required
                                  />
                                  <ReadFormatInput 
                                    inputRef={readMcqOptDRef}
                                    value={mcqOptD}
                                    onChange={setMcqOptD}
                                    placeholder="Option D text"
                                    required
                                  />
                                  <ReadFormatInput 
                                    inputRef={readMcqOptERef}
                                    value={mcqOptE}
                                    onChange={setMcqOptE}
                                    placeholder="Option E text (Optional)"
                                  />
                                  <ReadFormatInput 
                                    inputRef={readMcqOptFRef}
                                    value={mcqOptF}
                                    onChange={setMcqOptF}
                                    placeholder="Option F text (Optional)"
                                  />
                                  <ReadFormatInput 
                                    inputRef={readMcqOptGRef}
                                    value={mcqOptG}
                                    onChange={setMcqOptG}
                                    placeholder="Option G text (Optional)"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Correct Answer & Explanation */}
                            {!(selectedQuestionType === "R-NCOMP" && getPlaceholderNumbers(passageSegment).length > 0) && (
                            selectedQuestionType === "R-SCOMP" && scompMode !== "WITH_CLUES" ? (
                              <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/20 p-3.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider">
                                    Sentence Completion Answer Keys (3 Fields)
                                  </span>
                                  <span className="text-[10px] font-bold text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded-full shadow-2xs">
                                    Auto-deduplicated
                                  </span>
                                </div>
                                
                                <div className="grid gap-3 sm:grid-cols-3">
                                  {/* 1. Primary Correct Answer */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider block">
                                        Primary Correct Answer <span className="text-rose-500">*</span>
                                      </label>
                                      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-100/60 px-1.5 py-0.5 rounded">
                                        Required
                                      </span>
                                    </div>
                                    <ReadFormatInput 
                                      inputRef={readAnswerInputRef}
                                      value={correctAnswer}
                                      onChange={setCorrectAnswer}
                                      placeholder="e.g. books and activities"
                                      required
                                    />
                                  </div>

                                  {/* 2. Extra Correct Answer 1 */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider block">
                                        Extra Correct Answer 1
                                      </label>
                                      {scompAltAnswer1.trim() && correctAnswer.trim().toLowerCase() === scompAltAnswer1.trim().toLowerCase() ? (
                                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                          Duplicate (ignored)
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                          Optional
                                        </span>
                                      )}
                                    </div>
                                    <input 
                                      ref={scompAlt1Ref}
                                      type="text"
                                      value={scompAltAnswer1}
                                      onChange={(e) => setScompAltAnswer1(e.target.value)}
                                      placeholder="e.g. activities and books"
                                      className={`w-full text-xs font-semibold px-3 py-2 border rounded-lg bg-white focus:outline-hidden text-black placeholder:text-gray-400 transition-colors h-9 ${
                                        scompAltAnswer1.trim() && correctAnswer.trim().toLowerCase() === scompAltAnswer1.trim().toLowerCase()
                                          ? "border-amber-300 bg-amber-50/40"
                                          : "border-indigo-100"
                                      }`}
                                    />
                                  </div>

                                  {/* 3. Extra Correct Answer 2 */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider block">
                                        Extra Correct Answer 2
                                      </label>
                                      {scompAltAnswer2.trim() &&
                                      (correctAnswer.trim().toLowerCase() === scompAltAnswer2.trim().toLowerCase() ||
                                       scompAltAnswer1.trim().toLowerCase() === scompAltAnswer2.trim().toLowerCase()) ? (
                                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                          Duplicate (ignored)
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                          Optional
                                        </span>
                                      )}
                                    </div>
                                    <input 
                                      ref={scompAlt2Ref}
                                      type="text"
                                      value={scompAltAnswer2}
                                      onChange={(e) => setScompAltAnswer2(e.target.value)}
                                      placeholder="e.g. books, activities"
                                      className={`w-full text-xs font-semibold px-3 py-2 border rounded-lg bg-white focus:outline-hidden text-black placeholder:text-gray-400 transition-colors h-9 ${
                                        scompAltAnswer2.trim() &&
                                        (correctAnswer.trim().toLowerCase() === scompAltAnswer2.trim().toLowerCase() ||
                                         scompAltAnswer1.trim().toLowerCase() === scompAltAnswer2.trim().toLowerCase())
                                          ? "border-amber-300 bg-amber-50/40"
                                          : "border-indigo-100"
                                      }`}
                                    />
                                  </div>
                                </div>

                                {/* Deduplicated Accepted Answers Live Preview */}
                                {(() => {
                                  const deduped: string[] = [];
                                  const seen = new Set<string>();
                                  for (const raw of [correctAnswer, scompAltAnswer1, scompAltAnswer2]) {
                                    if (!raw) continue;
                                    const segments = raw.split("/").map((s) => s.trim()).filter(Boolean);
                                    for (const seg of segments) {
                                      const lower = seg.toLowerCase();
                                      if (!seen.has(lower)) {
                                        seen.add(lower);
                                        deduped.push(seg);
                                      }
                                    }
                                  }
                                  return (
                                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-indigo-200/60 bg-white px-3 py-2 text-[11px]">
                                      <span className="font-extrabold text-indigo-950">Valid Answer Variations ({deduped.length}):</span>
                                      {deduped.length > 0 ? (
                                        deduped.map((ans, i) => (
                                          <span key={i} className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700 border border-indigo-200 shadow-2xs">
                                            <span className="text-[9px] text-indigo-400 font-semibold">#{i + 1}</span> {ans}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-gray-400 italic">Enter primary answer above</span>
                                      )}
                                      <span className="ml-auto text-[10px] text-emerald-700 font-bold">
                                        ✓ Cleaned & saved together without duplicate questions
                                      </span>
                                    </div>
                                  );
                                })()}

                                {/* Answer Explanation */}
                                <div className="space-y-1 pt-1">
                                  <label className="text-[10px] font-bold text-indigo-705 uppercase tracking-widest block">Answer Explanation (Optional)</label>
                                  <ReadFormatInput 
                                    inputRef={readExplanationRef}
                                    value={questionExplanation}
                                    onChange={setQuestionExplanation}
                                    placeholder="e.g. Para 3 mentions stepwells provided shade during dry seasons."
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-indigo-705 uppercase tracking-widest block font-bold">Correct Answer Value <span className="text-rose-500">*</span></label>
                                  {selectedQuestionType === "R-MMCQ" ? (
                                    <div className="space-y-2 py-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-indigo-900">
                                          Click options to select {getNumberWord(multiMcqAnswerCount)} correct answers:
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                          multiMcqCorrectAnswers.length === multiMcqAnswerCount
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                            : "bg-amber-50 text-amber-700 border-amber-300"
                                        }`}>
                                          {multiMcqCorrectAnswers.length} of {multiMcqAnswerCount} selected
                                        </span>
                                      </div>
                                      
                                      {[mcqOptA, mcqOptB, mcqOptC, mcqOptD, mcqOptE, mcqOptF, mcqOptG].every(v => !v.trim()) ? (
                                        <p className="text-xs text-gray-400 italic py-1">
                                          Please enter option texts above first to select the correct answers.
                                        </p>
                                      ) : (
                                        <div className="grid gap-1.5 sm:grid-cols-2">
                                          {(["A", "B", "C", "D", "E", "F", "G"] as const).map((letter) => {
                                            const optVal = letter === "A" ? mcqOptA : letter === "B" ? mcqOptB : letter === "C" ? mcqOptC : letter === "D" ? mcqOptD : letter === "E" ? mcqOptE : letter === "F" ? mcqOptF : mcqOptG;
                                            if (!optVal.trim()) return null;
                                            const isChecked = multiMcqCorrectAnswers.includes(letter);
                                            const handleCheck = () => {
                                              if (isChecked) {
                                                setMultiMcqCorrectAnswers(multiMcqCorrectAnswers.filter(item => item !== letter));
                                              } else if (multiMcqCorrectAnswers.length < multiMcqAnswerCount) {
                                                setMultiMcqCorrectAnswers([...multiMcqCorrectAnswers, letter]);
                                              } else {
                                                toast.error(`You can select exactly ${multiMcqAnswerCount} answers.`);
                                              }
                                            };
                                            return (
                                              <div
                                                key={letter}
                                                onClick={handleCheck}
                                                className={`flex items-center gap-2.5 p-2 rounded-lg border text-left cursor-pointer transition-all ${
                                                  isChecked
                                                    ? "border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold shadow-2xs"
                                                    : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-gray-50/60"
                                                }`}
                                              >
                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                                  isChecked ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700"
                                                }`}>
                                                  {letter}
                                                </span>
                                                <span className="text-xs grow truncate">
                                                  {optVal}
                                                </span>
                                                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                                  isChecked ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-300 bg-white"
                                                }`}>
                                                  {isChecked && <span className="text-[10px] font-black">✓</span>}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  ) : selectedQuestionType === "R-MCQ" ? (
                                    <div className="space-y-1.5">
                                      <select 
                                        value={correctAnswer}
                                        onChange={(e) => setCorrectAnswer(e.target.value)}
                                        className="w-full text-xs font-semibold px-2 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-hidden text-black cursor-pointer h-9"
                                        required
                                      >
                                        <option value="">-- Choose Option Letter --</option>
                                        {(["A", "B", "C", "D", "E", "F", "G"] as const).map((letter) => {
                                          const optVal = letter === "A" ? mcqOptA : letter === "B" ? mcqOptB : letter === "C" ? mcqOptC : letter === "D" ? mcqOptD : letter === "E" ? mcqOptE : letter === "F" ? mcqOptF : mcqOptG;
                                          if (!optVal.trim() && !["A", "B", "C", "D"].includes(letter)) return null;
                                          return (
                                            <option key={letter} value={letter}>
                                              Option {letter} {optVal.trim() ? `— ${optVal.slice(0, 40)}${optVal.length > 40 ? "..." : ""}` : ""}
                                            </option>
                                          );
                                        })}
                                      </select>
                                      {mcqOptA.trim() && (
                                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                                          {(["A", "B", "C", "D", "E", "F", "G"] as const).map((letter) => {
                                            const optVal = letter === "A" ? mcqOptA : letter === "B" ? mcqOptB : letter === "C" ? mcqOptC : letter === "D" ? mcqOptD : letter === "E" ? mcqOptE : letter === "F" ? mcqOptF : mcqOptG;
                                            if (!optVal.trim()) return null;
                                            const isSelected = correctAnswer === letter;
                                            return (
                                              <button
                                                key={letter}
                                                type="button"
                                                onClick={() => setCorrectAnswer(letter)}
                                                className={`px-2.5 py-1 text-xs rounded-md border font-bold transition-all ${
                                                  isSelected
                                                    ? "border-indigo-600 bg-indigo-600 text-white shadow-2xs"
                                                    : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"
                                                }`}
                                              >
                                                {letter}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  ) : selectedQuestionType === "R-TFN" ? (
                                    <select 
                                      value={correctAnswer}
                                      onChange={(e) => setCorrectAnswer(e.target.value)}
                                      className="w-full text-xs font-semibold px-2 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-hidden text-black cursor-pointer h-9"
                                      required
                                    >
                                      <option value="">-- Select Answer --</option>
                                      <option value="TRUE">TRUE</option>
                                      <option value="FALSE">FALSE</option>
                                      <option value="NOT GIVEN">NOT GIVEN</option>
                                    </select>
                                  ) : selectedQuestionType === "R-YNN" ? (
                                    <select 
                                      value={correctAnswer}
                                      onChange={(e) => setCorrectAnswer(e.target.value)}
                                      className="w-full text-xs font-semibold px-2 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-hidden text-black cursor-pointer h-9"
                                      required
                                    >
                                      <option value="">-- Select Answer --</option>
                                      <option value="YES">YES</option>
                                      <option value="NO">NO</option>
                                      <option value="NOT GIVEN">NOT GIVEN</option>
                                    </select>
                                  ) : (["R-MHDG", "R-MINF", "R-NMATCH", "R-MFT", "R-MSE", "R-SCO"].includes(selectedQuestionType) || (selectedQuestionType === "R-SCOMP" && scompMode === "WITH_CLUES")) && groupOptions.trim() ? (
                                    <select 
                                      value={correctAnswer}
                                      onChange={(e) => setCorrectAnswer(e.target.value)}
                                      className="w-full text-xs font-semibold px-2 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-hidden text-black cursor-pointer h-9"
                                      required
                                    >
                                      <option value="">-- Select Option --</option>
                                      {groupOptions.split("\n").map(o => o.trim()).filter(Boolean).map((opt, idx) => (
                                        <option key={idx} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <ReadFormatInput 
                                      inputRef={readAnswerInputRef}
                                      value={correctAnswer}
                                      onChange={setCorrectAnswer}
                                      placeholder="e.g. shade / 1990s"
                                      required
                                    />
                                  )}
                                </div>
                                
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-indigo-705 uppercase tracking-widest block">Answer Explanation (Optional)</label>
                                  <ReadFormatInput 
                                    inputRef={readExplanationRef}
                                    value={questionExplanation}
                                    onChange={setQuestionExplanation}
                                    placeholder="e.g. Para 3 mentions stepwells provided shade during dry seasons."
                                  />
                                </div>
                              </div>
                            ))}

                            <button 
                              type="button"
                              onClick={handleAddReadingQuestion}
                              className="w-full bg-indigo-650 hover:bg-indigo-755 text-white font-bold transition-all duration-200 shadow-md shadow-indigo-100 flex items-center justify-center gap-2 py-2 rounded-lg text-xs cursor-pointer"
                            >
                              <IconPlus size={16} /> {selectedQuestionType === "R-NCOMP" && getPlaceholderNumbers(passageSegment).length > 0
                                ? `Save Note Answers (${getPlaceholderNumbers(passageSegment).length} Blanks)`
                                : `Append to Passage ${activePassage} Questions`}
                            </button>

                          </div>
                        ) : (
                          <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                            <p className="text-xs text-gray-500 font-semibold">Select a standardized IELTS question pattern above to add to Passage {activePassage}.</p>
                          </div>
                        )}

                      </CardContent>
                    </Card>

                  </div>

                  {/* Right Columns (4): Questions Tracker & Passages Preview */}
                  <div className="lg:col-span-4 space-y-6">
                    
                    {/* Real 40 Questions Tracker Card */}
                    <Card className="bg-white border-gray-200 shadow-xs relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-50/40 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
                      
                      <CardHeader className="pb-3 border-b border-gray-100">
                        <CardTitle className="font-bold text-black text-xs uppercase tracking-wide flex items-center justify-between">
                          <span>IELTS Exam Overview</span>
                          <span className="text-[10px] font-black tracking-widest uppercase bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                            {readingQuestions.length} / 40 Qs
                          </span>
                        </CardTitle>
                        <CardDescription className="text-[10px] text-gray-400 font-semibold">Monitoring standard IELTS Academic questions counts across the 3 passages.</CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pt-4">
                        
                        {/* IELTS Questions Progress Bar */}
                        <div className="space-y-1.5 mb-4">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-gray-505">IELTS Target Limit</span>
                            <span className="text-indigo-600 font-black">{Math.round((readingQuestions.length / 40) * 100)}% Complete</span>
                          </div>
                          <Progress 
                            value={Math.min((readingQuestions.length / 40) * 100, 100)} 
                            className="h-2 bg-gray-100 [&>div]:bg-indigo-650 shadow-inner"
                          />
                          {readingQuestions.length !== 40 && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg border border-amber-100 mt-1 animate-pulse">
                              <IconInfoCircle size={14} className="shrink-0" />
                              <span>Note: IELTS Academic standard expects exactly 40 questions.</span>
                            </div>
                          )}
                        </div>

                        {/* Collapsible Passages Summary & Questions list */}
                        <div className="space-y-4">
                          
                          {([1, 2, 3] as const).slice(0, passageCount).map((passIdx) => {
                            const passQs = readingQuestions.filter(q => q.passageIndex === passIdx);
                            const title = passages[passIdx].title || `Passage ${passIdx} Title (Not Drafted)`;
                            const isDrafted = passages[passIdx].title !== '';
                            
                            return (
                              <div key={passIdx} className="space-y-2 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                  <div className="min-w-0">
                                    <span className="text-[8px] font-black uppercase tracking-wider text-gray-400 block">Passage {passIdx}</span>
                                    <span className={`font-extrabold text-xs block truncate ${
                                      isDrafted ? 'text-black' : 'text-gray-400 italic'
                                    }`}>
                                      {title}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-black bg-indigo-50 border border-indigo-100 text-indigo-755 px-2 py-0.5 rounded-full shrink-0">
                                    {passQs.length} Qs
                                  </span>
                                </div>

                                {passQs.length > 0 ? (
                                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                                    {passQs.map((q) => (
                                      <div key={q.id} className="p-2 bg-white border border-gray-100 rounded-lg hover:border-indigo-100 flex justify-between items-start gap-2 relative group animate-fadeIn">
                                        <div className="flex items-start gap-1.5 min-w-0">
                                          <span className="h-4 w-4 bg-indigo-50 text-indigo-600 rounded-full font-bold text-[8px] flex items-center justify-center shrink-0 mt-0.5">
                                            {q.questionNumber}
                                          </span>
                                          <div className="min-w-0">
                                            <p className="font-extrabold text-[10px] text-gray-905 truncate leading-snug">{q.text || `Blank Completion Group`}</p>
                                            <p className="text-[8px] font-bold text-gray-400 mt-0.5">Type: {q.type.split("Questions")[0]} • Ans: {q.correctAnswer}</p>
                                          </div>
                                        </div>
                                        <Button 
                                          onClick={() => handleDeleteReadingQuestion(q.id)}
                                          variant="ghost" 
                                          size="sm" 
                                          className="text-red-500 p-0.5 opacity-0 group-hover:opacity-100 hover:bg-transparent h-5 w-5 transition-opacity cursor-pointer"
                                        >
                                          <IconTrash size={10} />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[9px] text-gray-400 italic text-center py-2">No questions added yet for this passage.</p>
                                )}
                              </div>
                            );
                          })}

                        </div>

                      </CardContent>
                    </Card>

                    {/* IELTS Reading Module Rules Panel */}
                    <Card className="bg-gradient-to-tr from-indigo-950 to-indigo-900 border-none shadow-md text-white">
                      <CardHeader className="pb-2">
                        <CardTitle className="font-bold text-sm tracking-wider uppercase text-indigo-305 flex items-center gap-1.5">
                          Reading Exam Rules
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-3 leading-relaxed">
                        <div className="border-l-2 border-indigo-500 pl-3">
                          <span className="font-bold text-indigo-200">Standard Sections:</span> An official Reading paper has precisely 3 sections corresponding to Passage 1, Passage 2, and Passage 3.
                        </div>
                        <div className="border-l-2 border-indigo-500 pl-3">
                          <span className="font-bold text-indigo-205">Question Limits:</span> Passages typically divide the 40 questions as: Passage 1 (13), Passage 2 (13), Passage 3 (14).
                        </div>
                        <div className="border-l-2 border-indigo-500 pl-3">
                          <span className="font-bold text-indigo-205">Authentic Uploads:</span> Attaching graphs or process diagrams is essential for academic information-matching and diagram-labeling questions.
                        </div>
                      </CardContent>
                    </Card>

                  </div>

                </div>
              </div>
            )}
            {/* ========================================== */}
            {activeTab === "writing" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <div>
                      <h4 className="flex items-center gap-2 text-base font-black text-black"><IconFileText size={18} /> IELTS Writing Overview</h4>
                      <p className="mt-1 text-xs font-medium text-gray-400">Configure the two official IELTS writing tasks.</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black">
                      {[writingTasks[0].instruction, writingTasks[1].instruction].filter((value) => value.trim()).length} / 2 Tasks Ready
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-gray-600">Exam Type</label>
                      <select value={writeExamType} onChange={(event) => setWriteExamType(event.target.value as any)} className="h-11 w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-800 outline-none focus:border-black">
                        <option value="ACADEMIC">Academic</option>
                        <option value="GENERAL_TRAINING">General Training</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-gray-600">Duration (Minutes)</label>
                      <input type="number" value={writeDuration} onChange={(event) => setWriteDuration(parseInt(event.target.value) || 60)} min={1} className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 outline-none focus:border-black" />
                    </div>
                  </div>
                </div>

                {/* Task Tabs */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveWritingTaskIdx(0)}
                    className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-black border-2 transition-all duration-200 cursor-pointer ${
                      activeWritingTaskIdx === 0
                        ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs shadow-indigo-100"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <IconChartBar
                      size={18}
                      className={activeWritingTaskIdx === 0 ? "text-indigo-500" : "text-gray-400"}
                    />
                    <span>Task 1</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        activeWritingTaskIdx === 0
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {writeExamType === "ACADEMIC" ? "Chart / Graph" : "Letter"}
                    </span>
                    {writingTasks[0].instruction.trim() && (
                      <IconCheck
                        size={14}
                        className="text-emerald-500 stroke-[3] ml-1"
                      />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveWritingTaskIdx(1)}
                    className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-black border-2 transition-all duration-200 cursor-pointer ${
                      activeWritingTaskIdx === 1
                        ? "bg-violet-50 border-violet-300 text-violet-700 shadow-xs shadow-violet-100"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <IconWriting
                      size={18}
                      className={activeWritingTaskIdx === 1 ? "text-violet-505" : "text-gray-400"}
                    />
                    <span>Task 2</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        activeWritingTaskIdx === 1
                          ? "bg-violet-100 text-violet-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      Essay
                    </span>
                    {writingTasks[1].instruction.trim() && (
                      <IconCheck
                        size={14}
                        className="text-emerald-500 stroke-[3] ml-1"
                      />
                    )}
                  </button>
                </div>

                {/* Task Panels */}
                {activeWritingTaskIdx === 0 ? (
                  <WritingTask1Form
                    instruction={writingTasks[0].instruction}
                    minWords={writingTasks[0].minWords || 150}
                    modelAnswer={writingTasks[0].modelAnswer || ""}
                    imageUrl={writingTasks[0].imageUrl}
                    pdfUrl={writingTasks[0].pdfUrl}
                    examType={writeExamType}
                    onInstructionChange={(val) => handleWritingTaskChange(0, "instruction", val)}
                    onMinWordsChange={(val) => handleWritingTaskChange(0, "minWords", val)}
                    onModelAnswerChange={(val) => handleWritingTaskChange(0, "modelAnswer", val)}
                    onImageUpload={(file) => handleWritingImageUpload(0, file)}
                    onImageUrlChange={(url) => handleWritingTaskChange(0, "imageUrl", url)}
                    onPdfUpload={(file) => handleWritingPdfUpload(0, file)}
                    onPdfUrlChange={(url) => handleWritingTaskChange(0, "pdfUrl", url)}
                    uploadingImage={uploadingWritingImage === 0}
                    uploadingPdf={uploadingWritingPdf === 0}
                  />
                ) : (
                  <WritingTask2Form
                    instruction={writingTasks[1].instruction}
                    minWords={writingTasks[1].minWords || 250}
                    modelAnswer={writingTasks[1].modelAnswer || ""}
                    onInstructionChange={(val) => handleWritingTaskChange(1, "instruction", val)}
                    onMinWordsChange={(val) => handleWritingTaskChange(1, "minWords", val)}
                    onModelAnswerChange={(val) => handleWritingTaskChange(1, "modelAnswer", val)}
                  />
                )}
              </div>
            )}

            {/* ========================================== */}
            {/* TAB: SPEAKING (Hubuhu matching standalone create form) */}
            {/* ========================================== */}
            {activeTab === "speaking" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <div>
                      <h4 className="flex items-center gap-2 text-base font-black text-black"><IconMicrophone size={18} /> IELTS Speaking Overview</h4>
                      <p className="mt-1 text-xs font-medium text-gray-400">Configure all three official IELTS speaking parts.</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-gray-600">Duration (Minutes)</label>
                      <input type="number" min="1" value={isNaN(speakDuration) ? "" : speakDuration} onChange={(event) => setSpeakDuration(parseInt(event.target.value) || 0)} className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 outline-none focus:border-black" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-gray-600">Total Parts</label>
                      <div className="flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-lg font-black text-black">{speakingParts.length}</div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-gray-600">Total Questions</label>
                      <div className="flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-lg font-black text-black">{speakingParts.reduce((total, part) => total + part.questions.length, 0)}</div>
                    </div>
                  </div>
                </div>

                {/* IELTS Speaking Setup Parts */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <h4 className="text-sm font-black text-slate-805">Exam Parts (IELTS Speaking Setup)</h4>
                  </div>

                  {/* 3-Part Tabs Selector */}
                  <div className="flex border-2 border-slate-200 bg-slate-100/50 p-1.5 rounded-2xl max-w-3xl mx-auto shadow-xs">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setActiveSpeakingTab(num)}
                        className={`flex-1 py-3 px-4 text-xs font-black uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer flex items-center justify-center gap-2 ${
                          activeSpeakingTab === num
                            ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                        }`}
                      >
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                          activeSpeakingTab === num ? "bg-white text-rose-600" : "bg-slate-200 text-slate-600"
                        }`}>
                          {num}
                        </span>
                        <span>
                          {num === 1 ? "Part 1: Interview" : num === 2 ? "Part 2: Cue Card" : "Part 3: Discussion"}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Active Tab Part Container */}
                  <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500" />

                    {/* Part 1 Editor View */}
                    {activeSpeakingTab === 1 && (
                      <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                          <div>
                            <h5 className="text-base font-black text-slate-950 uppercase tracking-tight">
                              {speakingParts[0]?.title || "Part 1: Introduction and Interview"}
                            </h5>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
                              General questions about yourself, home, studies, or interests
                            </p>
                          </div>
                          <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-black">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Speaking Limit</span>
                              <span className="text-slate-800 font-extrabold">{speakingParts[0]?.speakingTime || 60} Seconds</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Part 1 Title</label>
                            <input
                              type="text"
                              value={speakingParts[0]?.title || ""}
                              onChange={(e) => handleSpeakingPartFieldChange(0, "title", e.target.value)}
                              className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black font-semibold"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Response Recording Limit (Seconds)</label>
                            <input
                              type="number"
                              min="1"
                              value={isNaN(speakingParts[0]?.speakingTime) ? "" : speakingParts[0]?.speakingTime}
                              onChange={(e) => handleSpeakingPartFieldChange(0, "speakingTime", parseInt(e.target.value) || 0)}
                              className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black font-semibold"
                            />
                          </div>

                          <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Part Instructions / Directions</label>
                            <textarea
                              rows={2}
                              value={speakingParts[0]?.instruction || ""}
                              onChange={(e) => handleSpeakingPartFieldChange(0, "instruction", e.target.value)}
                              placeholder="Provide guidance context for Part 1 questions..."
                              className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black resize-y"
                            />
                            <span className="text-[10px] text-gray-400 font-bold mt-1 block">Tip: You can use HTML tags like &lt;b&gt;bold text&lt;/b&gt; or &lt;strong&gt;bold text&lt;/strong&gt; to style specific words or lines.</span>
                          </div>
                        </div>

                        {/* Questions Listing */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                          <div className="flex justify-between items-center">
                            <h5 className="text-xs font-black uppercase tracking-wider text-slate-500">Interview Questions ({speakingParts[0]?.questions.length || 0})</h5>
                            <button
                              type="button"
                              onClick={() => handleSpeakingAddQuestion(0)}
                              className="inline-flex items-center gap-1 text-xs font-black text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 transition active:scale-95 cursor-pointer shadow-xs"
                            >
                              <IconPlus size={14} /> Add Question
                            </button>
                          </div>

                          {(!speakingParts[0] || speakingParts[0].questions.length === 0) && (
                            <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-xs font-black text-slate-400 flex items-center justify-center gap-2 select-none">
                              <IconInfoCircle size={16} /> No questions added to Part 1 yet. Click "Add Question" above.
                            </div>
                          )}

                          <div className="space-y-3">
                            {speakingParts[0]?.questions.map((q: any, qIdx: number) => (
                              <div key={qIdx} className="flex gap-4 items-center animate-fadeIn">
                                <span className="text-xs font-black text-slate-500 shrink-0 w-10">
                                  Q{q.order}:
                                </span>
                                <input
                                  type="text"
                                  value={q.questionText}
                                  onChange={(e) => handleSpeakingQuestionTextChange(0, qIdx, e.target.value)}
                                  placeholder="Enter the Part 1 question prompt..."
                                  required
                                  className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black font-semibold"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSpeakingRemoveQuestion(0, qIdx)}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition border border-transparent hover:border-red-105 cursor-pointer"
                                  title="Delete Question"
                                >
                                  <IconTrash size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Part 2 Editor View */}
                    {activeSpeakingTab === 2 && (
                      <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                          <div>
                            <h5 className="text-base font-black text-slate-950 uppercase tracking-tight">
                              {speakingParts[1]?.title || "Part 2: Individual Long Turn (Cue Card)"}
                            </h5>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
                              1 minute preparation time, 2 minutes speaking response
                            </p>
                          </div>
                          <div className="flex items-center gap-6 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-black">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prep Time</span>
                              <span className="text-slate-800 font-extrabold">{speakingParts[1]?.preparationTime || 60} Seconds</span>
                            </div>
                            <div className="flex flex-col border-l border-slate-200 pl-4">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Speaking Limit</span>
                              <span className="text-slate-800 font-extrabold">{speakingParts[1]?.speakingTime || 120} Seconds</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Part 2 Title</label>
                            <input
                              type="text"
                              value={speakingParts[1]?.title || ""}
                              onChange={(e) => handleSpeakingPartFieldChange(1, "title", e.target.value)}
                              className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black font-semibold"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Preparation Time (Seconds)</label>
                            <input
                              type="number"
                              min="0"
                              value={isNaN(speakingParts[1]?.preparationTime) ? "" : speakingParts[1]?.preparationTime}
                              onChange={(e) => handleSpeakingPartFieldChange(1, "preparationTime", parseInt(e.target.value) || 0)}
                              className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black font-semibold"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Speaking limit (Seconds)</label>
                            <input
                              type="number"
                              min="1"
                              value={isNaN(speakingParts[1]?.speakingTime) ? "" : speakingParts[1]?.speakingTime}
                              onChange={(e) => handleSpeakingPartFieldChange(1, "speakingTime", parseInt(e.target.value) || 0)}
                              className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black font-semibold"
                            />
                          </div>

                          <div className="md:col-span-3 space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Part 2 Cue Card Maker</label>
                            <SpeakingCueCardBuilder
                              value={speakingParts[1]?.instruction || ""}
                              onChange={(value) => handleSpeakingPartFieldChange(1, "instruction", value)}
                            />
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex gap-3 items-center">
                          <IconInfoCircle className="text-rose-500 shrink-0" size={20} />
                          <div className="text-[11px] font-black text-slate-505 leading-normal">
                            IELTS Part 2 (Cue Card) requires a single voice recording response. The candidate gets 1 minute to plan using the prompt instructions, and then records their speech for up to 2 minutes. The response question is automatically generated.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Part 3 Editor View */}
                    {activeSpeakingTab === 3 && (
                      <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                          <div>
                            <h5 className="text-base font-black text-slate-950 uppercase tracking-tight">
                              {speakingParts[2]?.title || "Part 3: Two-way Discussion"}
                            </h5>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
                              Questions related to the Cue Card topic discussed in Part 2
                            </p>
                          </div>
                          <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-black">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Speaking Limit</span>
                              <span className="text-slate-800 font-extrabold">{speakingParts[2]?.speakingTime || 60} Seconds</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Part 3 Title</label>
                            <input
                              type="text"
                              value={speakingParts[2]?.title || ""}
                              onChange={(e) => handleSpeakingPartFieldChange(2, "title", e.target.value)}
                              className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black font-semibold"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Response Recording Limit (Seconds)</label>
                            <input
                              type="number"
                              min="1"
                              value={isNaN(speakingParts[2]?.speakingTime) ? "" : speakingParts[2]?.speakingTime}
                              onChange={(e) => handleSpeakingPartFieldChange(2, "speakingTime", parseInt(e.target.value) || 0)}
                              className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black font-semibold"
                            />
                          </div>

                          <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Part Instructions / Directions</label>
                            <textarea
                              rows={2}
                              value={speakingParts[2]?.instruction || ""}
                              onChange={(e) => handleSpeakingPartFieldChange(2, "instruction", e.target.value)}
                              placeholder="Provide guidance context for Part 3 discussion questions..."
                              className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black resize-y"
                            />
                            <span className="text-[10px] text-gray-400 font-bold mt-1 block">Tip: You can use HTML tags like &lt;b&gt;bold text&lt;/b&gt; or &lt;strong&gt;bold text&lt;/strong&gt; to style specific words or lines.</span>
                          </div>
                        </div>

                        {/* Questions Listing */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                          <div className="flex justify-between items-center">
                            <h5 className="text-xs font-black uppercase tracking-wider text-slate-500">Discussion Questions ({speakingParts[2]?.questions.length || 0})</h5>
                            <button
                              type="button"
                              onClick={() => handleSpeakingAddQuestion(2)}
                              className="inline-flex items-center gap-1 text-xs font-black text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 transition active:scale-95 cursor-pointer shadow-xs"
                            >
                              <IconPlus size={14} /> Add Question
                            </button>
                          </div>

                          {(!speakingParts[2] || speakingParts[2].questions.length === 0) && (
                            <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-xs font-black text-slate-400 flex items-center justify-center gap-2 select-none">
                              <IconInfoCircle size={16} /> No questions added to Part 3 yet. Click "Add Question" above.
                            </div>
                          )}

                          <div className="space-y-3">
                            {speakingParts[2]?.questions.map((q: any, qIdx: number) => (
                              <div key={qIdx} className="flex gap-4 items-center animate-fadeIn">
                                <span className="text-xs font-black text-slate-500 shrink-0 w-10">
                                  Q{q.order}:
                                </span>
                                <input
                                  type="text"
                                  value={q.questionText}
                                  onChange={(e) => handleSpeakingQuestionTextChange(2, qIdx, e.target.value)}
                                  placeholder="Enter the Part 3 discussion question..."
                                  required
                                  className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black font-semibold"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSpeakingRemoveQuestion(2, qIdx)}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition border border-transparent hover:border-red-105 cursor-pointer"
                                  title="Delete Question"
                                >
                                  <IconTrash size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <section className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
                  <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                    <h4 className="text-sm font-bold text-slate-900">Speaking question-paper preview</h4>
                    <p className="text-xs text-slate-500">This is the same Part 1–3 layout candidates will see.</p>
                  </div>
                  <SpeakingQuestionPaper title={speakTitle} parts={speakingParts} compact />
                </section>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons & Bottom Previews */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-xs">
          {/* 4 Module Previews + Full Mock Preview */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1.5">
              <IconEye size={15} /> Previews:
            </span>
            <button
              type="button"
              onClick={() => setMockPreviewMode("listening")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              Listening Preview
            </button>
            <button
              type="button"
              onClick={() => setMockPreviewMode("reading")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              Reading Preview
            </button>
            <button
              type="button"
              onClick={() => setMockPreviewMode("writing")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              Writing Preview
            </button>
            <button
              type="button"
              onClick={() => setMockPreviewMode("speaking")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              Speaking Preview
            </button>
            <button
              type="button"
              onClick={() => setMockPreviewMode("full")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-purple-700 text-xs font-bold text-white transition shadow-sm cursor-pointer"
            >
              <IconEye size={15} /> Full Mock Simulation
            </button>
          </div>

          {/* Cancel & Save Action Buttons */}
          <div className="flex items-center justify-end gap-3 shrink-0">
            <Link
              href="/teacher/mock-tests"
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-extrabold text-slate-600 hover:text-slate-900 hover:bg-slate-50 active:scale-98 transition duration-150"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-extrabold text-xs shadow-md shadow-purple-600/20 active:scale-98 transition-all duration-150 cursor-pointer"
            >
              {createMutation.isPending ? (
                <>
                  <IconLoader2 className="animate-spin" size={16} />
                  <span>Saving Full Mock Test...</span>
                </>
              ) : (
                <>
                  <IconCheck size={16} />
                  <span>{isPublished ? "Save & Publish Full Mock Test" : "Save Full Mock as Draft"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>


      <FullMockTestPreview
        isOpen={mockPreviewMode !== null}
        mode={mockPreviewMode || "full"}
        onClose={() => setMockPreviewMode(null)}
        title={resolvedMockTitle}
        listening={previewListeningExam}
        reading={previewReadingExam}
        writing={{ title: writeTitle, tasks: writingTasks }}
        speaking={{ title: speakTitle, parts: speakingParts }}
      />
    </div>
  );
}
