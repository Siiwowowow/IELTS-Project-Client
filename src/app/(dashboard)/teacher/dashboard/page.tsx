/* eslint-disable react/jsx-no-comment-textnodes */
'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { readingService } from '@/services/reading.services'
import { toast } from 'sonner'
import { useSearchParams, useRouter } from 'next/navigation'
import { parseGroupInstruction, areInstructionsCompatible, mergeQuestionGroups } from '@/lib/utils'

function toRomanNumeral(value: number): string {
  const numerals: Array<[number, string]> = [
    [1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"],
    [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"],
  ];
  let remaining = value;
  return numerals.reduce((result, [amount, numeral]) => {
    while (remaining >= amount) {
      result += numeral;
      remaining -= amount;
    }
    return result;
  }, "");
}

function getListOfHeadingOptions(value: string): string[] {
  return value
    .split("\n")
    .map((heading) => heading.trim())
    .filter(Boolean)
    .map((heading, index) =>
      /^[ivxlcdm]+(?:\s+|\.|\))/i.test(heading)
        ? heading
        : `${toRomanNumeral(index + 1)}  ${heading}`
    );
}
import { 
  IconBook2, 
  IconPlus, 
  IconFileText, 
  IconPhoto, 
  IconTrash, 
  IconCheck, 
  IconAlertCircle,
  IconArrowRight,
  IconSparkles,
  IconCircleCheck,
  IconCloudUpload,
  IconNotebook,
  IconInfoCircle,
  IconLoader2,
  IconTable,
  IconBold,
  IconItalic,
  IconUnderline,
  IconPalette,
  IconEraser,
  IconEye
} from '@tabler/icons-react'
import VisualNotesBuilder from '@/components/shared/VisualNotesBuilder'
import VisualTableBuilder from '@/components/shared/VisualTableBuilder'
import { QuestionRenderer } from '@/components/Reading/QuestionRenderer'
import { ReadingSectionTabs } from '@/components/Reading/ReadingSectionTabs'
import { FloatingSelectionToolbar } from '@/components/shared/FloatingSelectionToolbar'
import type { IQuestionGroup, QuestionGroupType } from '@/types/reading.types'

// Tab definitions for IELTS modules (removed)

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

// All Official IELTS Reading Question Types
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
]

const defaultQuestionInstructions: Record<string, string> = {
  "R-MCQ": "|||Choose the correct letter, A, B, C or D.|||Write the correct letter in the answer box.|||",
  "R-MMCQ": "|||Choose the correct answers.|||Select the required options from the list.|||",
  "R-TFN": "|||Do the following statements agree with the information given in Reading Passage?|||In boxes on your answer sheet, write:||||||TRUE  if the statement agrees with the information|||FALSE  if the statement contradicts the information|||NOT GIVEN  if there is no information on this",
  "R-YNN": "|||Do the following statements agree with the claims of the writer in Reading Passage?|||In boxes on your answer sheet, write:||||||YES  if the statement agrees with the claims|||NO  if the statement contradicts the claims|||NOT GIVEN  if there is no information on this",
  "R-MHDG": "|||Choose the correct heading for each paragraph from the list of headings below.|||Write the correct number, i–x, in boxes on your answer sheet.|||",
  "R-MINF": "|||Which paragraph contains the following information?|||Write the correct letter, A–G, in the boxes on your answer sheet.||||||NB  You may use any letter more than once.",
  "R-NMATCH": "|||Look at the following statements and the list of people below.|||Match each statement with the correct person or people, A–E.|||Write the correct letter, A–E, in the boxes on your answer sheet.",
  "R-MFT": "|||Match each statement with the correct feature.|||Write the correct letter in the answer box.|||",
  "R-MSE": "|||Complete each sentence with the correct ending.|||Choose the correct letter from the list.|||",
  "R-SCOMP": "|||Complete the sentences below.|||Choose NO MORE THAN TWO WORDS from the passage for each answer.|||",
  "R-SCO": "|||Complete the summary using the list of words, A–L, below.|||Write the correct letter, A–L, in boxes on your answer sheet.|||",
  "R-SCWO": "|||Complete the summary below.|||Choose NO MORE THAN TWO WORDS from the passage for each answer.||||||INST3:Write your answers in boxes on your answer sheet.",
  "R-NCOMP": "|||Complete the notes below.|||Choose NO MORE THAN TWO WORDS from the passage for each answer.|||",
  "R-TABLE": "|||Complete the table below.|||Choose NO MORE THAN TWO WORDS from the passage for each answer.|||",
  "R-FLOW": "|||Complete the flow chart below.|||Choose NO MORE THAN TWO WORDS from the passage for each answer.|||",
  "R-DIAG": "|||Label the diagram below.|||Choose NO MORE THAN TWO WORDS from the passage for each answer.|||",
  "R-SAQ": "|||Answer the questions below.|||Choose NO MORE THAN THREE WORDS from the passage for each answer.|||",
}

interface QuestionItem {
  id: string
  passageIndex: number // 1, 2, or 3
  type: string
  typeCode: string
  questionNumber: number
  text: string
  instruction: string
  correctAnswer: string
  explanation?: string
  options?: string[]
  groupOptions?: string[]
  passageSegment?: string
  groupImageUrl?: string
}

interface PassageData {
  title: string
  subtitle: string
  body: string
  instruction?: string
  pdf: { name: string; size: string; url: string } | null
  image: string | null
  imageName: string
}

const READING_CREATOR_DRAFT_KEY = "ielts-reading-creator-draft-v1";

function getDefaultPassages(): Record<1 | 2 | 3, PassageData> {
  return {
    1: { 
      title: '', 
      subtitle: '',
      body: '', 
      instruction: 'You should spend about 20 minutes on Questions 1-13 which are based on Reading Passage 1 below.', 
      pdf: null, 
      image: null, 
      imageName: '' 
    },
    2: { 
      title: '', 
      subtitle: '',
      body: '', 
      instruction: 'You should spend about 20 minutes on Questions 14-26 which are based on Reading Passage 2 below.', 
      pdf: null, 
      image: null, 
      imageName: '' 
    },
    3: { 
      title: '', 
      subtitle: '',
      body: '', 
      instruction: 'You should spend about 20 minutes on Questions 27-40 which are based on Reading Passage 3 below.', 
      pdf: null, 
      image: null, 
      imageName: '' 
    },
  };
}

interface ReadingCreatorDraft {
  examTitle: string;
  examDescription: string;
  examDuration: number;
  passageCount: 1 | 2 | 3;
  activePassage: 1 | 2 | 3;
  passages: Record<1 | 2 | 3, PassageData>;
  compiledQuestions: QuestionItem[];
  selectedQuestionType: string | null;
  customQuestionNumber: number | '';
  questionText: string;
  questionInstruction: string;
  correctAnswer: string;
  questionExplanation: string;
  mcqOptA: string;
  mcqOptB: string;
  mcqOptC: string;
  mcqOptD: string;
  mcqOptE: string;
  mcqOptF: string;
  mcqOptG: string;
  multiMcqCorrectAnswers: string[];
  groupOptions: string;
  passageSegment: string;
  scompMode: 'WITH_CLUES' | 'WITHOUT_CLUES';
  mhdgMode: 'WITH_CLUES' | 'WITHOUT_CLUES';
  mhdgIntroText: string;
  hasExample: boolean;
  exampleParagraph: string;
  exampleAnswer: string;
  questionImage: string | null;
  questionImageName: string;
  scompAltAnswer1?: string;
  scompAltAnswer2?: string;
}

function getDeduplicatedAnswers(...answers: (string | undefined | null)[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const raw of answers) {
    if (!raw) continue;
    const segments = raw.split("/").map((s) => s.trim()).filter(Boolean);
    for (const seg of segments) {
      const lower = seg.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        result.push(seg);
      }
    }
  }
  return result;
}

function isReadingDraftEmpty(draft: Partial<ReadingCreatorDraft>): boolean {
  const hasMetadata = Boolean(draft.examTitle?.trim() || draft.examDescription?.trim());
  const hasQuestions = (draft.compiledQuestions?.length ?? 0) > 0;
  const hasPassageContent = draft.passages && Object.values(draft.passages).some(
    (p) => Boolean(p?.title?.trim() || p?.subtitle?.trim() || p?.body?.trim() || p?.image || p?.pdf)
  );
  const hasFormInput = Boolean(
    draft.questionText?.trim() ||
    draft.correctAnswer?.trim() ||
    draft.scompAltAnswer1?.trim() ||
    draft.scompAltAnswer2?.trim() ||
    draft.questionExplanation?.trim() ||
    draft.passageSegment?.trim() ||
    draft.groupOptions?.trim() ||
    draft.mcqOptA?.trim() ||
    draft.mcqOptB?.trim()
  );
  return !hasMetadata && !hasQuestions && !hasPassageContent && !hasFormInput;
}

function createReadingPreviewGroups(questions: QuestionItem[], passageIndex: number): IQuestionGroup[] {
  const groups: IQuestionGroup[] = []

  questions
    .filter((question) => question.passageIndex === passageIndex)
    .forEach((question) => {
      const previousGroup = groups[groups.length - 1]
      const canJoinPrevious =
        previousGroup &&
        previousGroup.type === question.typeCode &&
        areInstructionsCompatible(previousGroup.instruction, question.instruction)
      const group = canJoinPrevious
        ? previousGroup
        : {
            id: `preview-group-${passageIndex}-${groups.length}`,
            passageId: `preview-passage-${passageIndex}`,
            type: question.typeCode as QuestionGroupType,
            instruction: question.instruction,
            passageSegment: question.passageSegment,
            options: question.typeCode === "SUMMARY_COMPLETION_WITHOUT_OPTIONS" ? undefined : question.groupOptions,
            imageUrl: question.groupImageUrl,
            order: groups.length + 1,
            questions: [],
          }

      if (!canJoinPrevious) groups.push(group)
      group.questions.push({
        id: question.id,
        groupId: group.id,
        questionNumber: question.questionNumber,
        questionText: question.text,
        options: question.options,
      })
    })

  return mergeQuestionGroups(groups)
}

function getPlaceholderNumbers(value: string): number[] {
  const matches = Array.from(
    value.matchAll(/(?:\[\s*(\d+)\s*\]|\b(\d+)\s*(?:\.{3,}|_{2,}))/g)
  );
  const nums = matches.map((m) => Number(m[1] || m[2])).filter(Boolean);
  return Array.from(new Set(nums)).sort((a, b) => a - b);
}


interface FormatToolbarProps {
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>
  value: string
  onChange: (val: string) => void
  label?: string
}

function FormatToolbar({ inputRef, value, onChange, label }: FormatToolbarProps) {
  const savedSelectionRef = useRef({ start: 0, end: 0 })

  const rememberSelection = () => {
    const input = inputRef.current
    if (!input) return
    savedSelectionRef.current = {
      start: input.selectionStart ?? 0,
      end: input.selectionEnd ?? 0,
    }
  }

  const applyFormat = (prefix: string, suffix: string = prefix) => {
    const input = inputRef.current
    if (!input) return
    const currentStart = input.selectionStart ?? 0
    const currentEnd = input.selectionEnd ?? 0
    const savedSelection = savedSelectionRef.current
    const start = currentStart !== currentEnd ? currentStart : savedSelection.start
    const end = currentStart !== currentEnd ? currentEnd : savedSelection.end
    const selectedText = value.substring(start, end)
    if (!selectedText) {
      toast.info("Select some text first.")
      input.focus()
      return
    }
    const replacement = `${prefix}${selectedText}${suffix}`
    const newValue = value.substring(0, start) + replacement + value.substring(end)
    onChange(newValue)
    
    setTimeout(() => {
      input.focus()
      input.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length)
    }, 0)
  }

  const removeFormatting = () => {
    const input = inputRef.current
    if (!input) return
    const currentStart = input.selectionStart ?? 0
    const currentEnd = input.selectionEnd ?? 0
    const savedSelection = savedSelectionRef.current
    const start = currentStart !== currentEnd ? currentStart : savedSelection.start
    const end = currentStart !== currentEnd ? currentEnd : savedSelection.end
    let replacementStart = start
    let replacementEnd = end
    let beforeSelection = value.substring(0, replacementStart)
    let afterSelection = value.substring(replacementEnd)

    const colorPrefix = beforeSelection.match(/\{color:#[0-9a-fA-F]{6}\}$/)?.[0]
    if (colorPrefix && afterSelection.startsWith("{/color}")) {
      replacementStart -= colorPrefix.length
      replacementEnd += "{/color}".length
      beforeSelection = value.substring(0, replacementStart)
      afterSelection = value.substring(replacementEnd)
    }

    for (const marker of ["**", "__", "*"]) {
      if (beforeSelection.endsWith(marker) && afterSelection.startsWith(marker)) {
        replacementStart -= marker.length
        replacementEnd += marker.length
        beforeSelection = value.substring(0, replacementStart)
        afterSelection = value.substring(replacementEnd)
      }
    }

    const selectedText = value.substring(replacementStart, replacementEnd)
    if (!selectedText) {
      toast.info("Select formatted text first.")
      input.focus()
      return
    }
    const cleanedText = selectedText
      .replace(/\{color:#[0-9a-fA-F]{6}\}/g, "")
      .replace(/\{\/color\}/g, "")
      .replace(/\*\*|__|\*/g, "")
    onChange(value.substring(0, replacementStart) + cleanedText + value.substring(replacementEnd))
    setTimeout(() => {
      input.focus()
      input.setSelectionRange(replacementStart, replacementStart + cleanedText.length)
    }, 0)
  }

  return (
    <div className="flex flex-wrap justify-between gap-2 items-center mb-1">
      {label && (
        <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block font-bold">
          {label}
        </label>
      )}
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
        <button type="button" onMouseDown={(event) => { event.preventDefault(); rememberSelection() }} onClick={() => applyFormat("**")} className="rounded p-1.5 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700" title="Bold selected text"><IconBold size={14} /></button>
        <button type="button" onMouseDown={(event) => { event.preventDefault(); rememberSelection() }} onClick={() => applyFormat("*")} className="rounded p-1.5 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700" title="Italic selected text"><IconItalic size={14} /></button>
        <button type="button" onMouseDown={(event) => { event.preventDefault(); rememberSelection() }} onClick={() => applyFormat("__")} className="rounded p-1.5 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700" title="Underline selected text"><IconUnderline size={14} /></button>
        <label onMouseDown={rememberSelection} className="relative flex cursor-pointer items-center rounded p-1.5 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700" title="Color selected text">
          <IconPalette size={14} />
          <input
            type="color"
            defaultValue="#dc2626"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(event) => applyFormat(`{color:${event.target.value}}`, "{/color}")}
          />
        </label>
        <span className="mx-0.5 h-4 w-px bg-gray-200" />
        <button type="button" onMouseDown={(event) => { event.preventDefault(); rememberSelection() }} onClick={removeFormatting} className="rounded p-1.5 text-gray-600 hover:bg-rose-50 hover:text-rose-600" title="Remove formatting from selected text"><IconEraser size={14} /></button>
      </div>
    </div>
  )
}

interface FormatInputProps {
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (val: string) => void
  placeholder: string
  required?: boolean
}

function FormatInput({ inputRef, value, onChange, placeholder, required }: FormatInputProps) {
  return (
    <div className="w-full">
      <FormatToolbar inputRef={inputRef} value={value} onChange={onChange} />
      <textarea
        ref={inputRef}
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full text-xs font-semibold px-3 py-2 border border-indigo-100 rounded-lg focus:outline-none focus:border-indigo-400 text-black placeholder:text-gray-400 bg-white resize-y"
      />
    </div>
  )
}

interface IeltsHeaderInputProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
}

function IeltsHeaderInput({ value, onChange, placeholder, className }: IeltsHeaderInputProps) {
  const ref = useRef<HTMLInputElement>(null)

  return (
    <div className="w-full">
      <FormatToolbar inputRef={ref} value={value} onChange={onChange} />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className || "w-full text-xs font-semibold px-3 py-2 border border-indigo-100 rounded-lg focus:outline-none focus:border-indigo-400 text-black placeholder:text-gray-400 bg-white"}
      />
    </div>
  )
}

function convertInlineMarkdownToHtml(text: string): string {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/\{color:(#[0-9a-fA-F]{6})\}([\s\S]+?)\{\/color\}/g, '<span style="color: $1">$2</span>');
  html = html.replace(/\*\*([\s\S]+?)\*\*/g, '<strong class="font-extrabold">$1</strong>');
  html = html.replace(/__([\s\S]+?)__/g, '<u class="underline underline-offset-2">$1</u>');
  html = html.replace(/(^|[^*])\*([^*]+?)\*(?!\*)/g, '$1<em class="italic">$2</em>');
  return html;
}

function convertMarkdownToHtml(text: string): string {
  if (!text) return "";
  const html = convertInlineMarkdownToHtml(text);
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
  const body = documentNode.body;
  body.querySelectorAll("br").forEach((lineBreak) => lineBreak.replaceWith("\n"));

  const blocks = Array.from(body.children)
    .map((element) => element.textContent?.replace(/\u00a0/g, " ").trim() || "")
    .filter(Boolean);

  return (blocks.length > 0 ? blocks.join("\n\n") : body.textContent || "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function recoverPassageFields(passage: any): { body: string; subtitle: string } {
  if (passage.body) {
    return {
      body: htmlPassageToEditableText(passage.body),
      subtitle: passage.subtitle || passage.passageDescription || "",
    };
  }

  const storedText = typeof passage.text === "string" ? passage.text.trim() : "";
  if (!storedText || typeof window === "undefined") {
    return { body: storedText, subtitle: passage.subtitle || passage.passageDescription || "" };
  }

  const documentNode = new DOMParser().parseFromString(`<main>${storedText}</main>`, "text/html");
  const root = documentNode.querySelector("main");
  if (!root) return { body: storedText, subtitle: "" };

  const instructionBlock = root.querySelector("div.mb-6");
  const titleBlock = root.querySelector("h2");
  const subtitleBlock = root.querySelector("div.font-serif.italic");
  const recoveredSubtitle = subtitleBlock?.textContent?.trim() || passage.subtitle || passage.passageDescription || "";
  instructionBlock?.remove();
  titleBlock?.remove();
  subtitleBlock?.remove();

  return { body: htmlPassageToEditableText(root.innerHTML.trim()), subtitle: recoveredSubtitle };
}

function ReadingPassagePreview({ passageNumber, passage }: { passageNumber: number; passage: PassageData }) {
  return (
    <div className="bg-white px-5 py-6 font-[Arial,sans-serif] text-black md:px-8 md:py-7">
      <div className="mb-5">
        <p className="text-sm font-black uppercase tracking-[0.12em] text-[#242424]">
          Reading Passage {passageNumber}
        </p>
        <div
          className="mt-3 max-w-3xl text-xs italic leading-5 text-[#222] md:text-sm"
          dangerouslySetInnerHTML={{
            __html: convertInlineMarkdownToHtml(
              passage.instruction || `You should spend about 20 minutes on the questions based on Reading Passage ${passageNumber} below.`
            ),
          }}
        />
      </div>

      <div className="border border-dotted border-[#777] px-5 py-5 md:px-8">
        <h2
          className={`${passage.subtitle ? "mb-2" : "mb-5"} text-center font-serif text-3xl font-bold leading-tight text-[#222]`}
          dangerouslySetInnerHTML={{
            __html: convertInlineMarkdownToHtml(passage.title || "Passage title preview"),
          }}
        />
        {passage.subtitle && (
          <div
            className="mx-auto mb-5 max-w-3xl text-center font-serif text-sm italic leading-5 text-[#333] md:text-base"
            dangerouslySetInnerHTML={{ __html: convertInlineMarkdownToHtml(passage.subtitle) }}
          />
        )}
        <div
          className="font-serif text-sm leading-6 text-[#222] [&_p]:mb-4 [&_p]:text-justify"
          dangerouslySetInnerHTML={{
            __html: passage.body
              ? convertMarkdownToHtml(passage.body)
              : '<p class="text-center italic text-gray-400">Your formatted passage text will appear here.</p>',
          }}
        />
        {passage.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={passage.image}
            alt={`Reading Passage ${passageNumber} visual`}
            className="mx-auto mt-5 max-h-72 w-full object-contain"
          />
        )}
      </div>
    </div>
  )
}

type ReadingCreatorWorkspaceProps = {
  embedded?: boolean;
  onExamReady?: (exam: any) => void;
};

function TeacherDashboardContent({ embedded = false, onExamReady }: ReadingCreatorWorkspaceProps = {}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const editId = searchParams.get('edit')
  const localDraftKey = `${READING_CREATOR_DRAFT_KEY}:${editId ?? "new"}`
  const [loadingEdit, setLoadingEdit] = useState(false)

  const [selectedQuestionType, setSelectedQuestionType] = useState<string | null>(null)
  
  // Exam metadata states
  const [examTitle, setExamTitle] = useState('Cambridge IELTS Academic Reading Practice Test 1')
  const [examDescription, setExamDescription] = useState('A Cambridge IELTS-style Academic Reading test with three passages and realistic question types for computer-based practice.')
  const [examDuration, setExamDuration] = useState(60)
  const [passageCount, setPassageCount] = useState<1 | 2 | 3>(3)

  // 3 Passages independent states
  const [activePassage, setActivePassage] = useState<1 | 2 | 3>(1)
  const [passages, setPassages] = useState<Record<1 | 2 | 3, PassageData>>(getDefaultPassages)

  // Uploading states
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingQImage, setUploadingQImage] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  // PDF & Image input references
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Question Form States
  const [customQuestionNumber, setCustomQuestionNumber] = useState<number | ''>('')
  const [questionText, setQuestionText] = useState('')
  const [questionInstruction, setQuestionInstruction] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [tableAnswers, setTableAnswers] = useState<Record<number, string>>({})
  const [summaryAnswers, setSummaryAnswers] = useState<Record<number, string>>({})
  const [questionExplanation, setQuestionExplanation] = useState('')
  
  // Custom MCQ options
  const [mcqOptA, setMcqOptA] = useState('')
  const [mcqOptB, setMcqOptB] = useState('')
  const [mcqOptC, setMcqOptC] = useState('')
  const [mcqOptD, setMcqOptD] = useState('')
  const [mcqOptE, setMcqOptE] = useState('')
  const [mcqOptF, setMcqOptF] = useState('')
  const [mcqOptG, setMcqOptG] = useState('')
  const [multiMcqCorrectAnswers, setMultiMcqCorrectAnswers] = useState<string[]>([])
  const [multiMcqAnswerCount, setMultiMcqAnswerCount] = useState<number>(2)

  // Custom Matching options / list of headings (newlines)
  const [groupOptions, setGroupOptions] = useState('')

  // Custom Table completion segment markdown
  const [passageSegment, setPassageSegment] = useState('')

  // Sentence Completion mode: With Clues vs Without Clues
  const [scompMode, setScompMode] = useState<'WITH_CLUES' | 'WITHOUT_CLUES'>('WITHOUT_CLUES')
  const [scompAltAnswer1, setScompAltAnswer1] = useState('')
  const [scompAltAnswer2, setScompAltAnswer2] = useState('')
  const scompAlt1Ref = useRef<HTMLInputElement>(null)
  const scompAlt2Ref = useRef<HTMLInputElement>(null)

  // Matching Headings Configurations
  const [mhdgMode, setMhdgMode] = useState<'WITH_CLUES' | 'WITHOUT_CLUES'>('WITH_CLUES')
  const [mhdgIntroText, setMhdgIntroText] = useState('')
  const [hasExample, setHasExample] = useState(false)
  const [exampleParagraph, setExampleParagraph] = useState('')
  const [exampleAnswer, setExampleAnswer] = useState('')

  // Question attachments
  const [questionImage, setQuestionImage] = useState<string | null>(null)
  const [questionImageName, setQuestionImageName] = useState('')
  const qImageInputRef = useRef<HTMLInputElement>(null)

  // Refs for formatting fields
  const instructionRef = useRef<HTMLTextAreaElement>(null)
  const groupOptionsRef = useRef<HTMLTextAreaElement>(null)
  const passageSegmentRef = useRef<HTMLTextAreaElement>(null)
  const questionTextRef = useRef<HTMLTextAreaElement>(null)
  const mcqOptARef = useRef<HTMLTextAreaElement>(null)
  const mcqOptBRef = useRef<HTMLTextAreaElement>(null)
  const mcqOptCRef = useRef<HTMLTextAreaElement>(null)
  const mcqOptDRef = useRef<HTMLTextAreaElement>(null)
  const mcqOptERef = useRef<HTMLTextAreaElement>(null)
  const mcqOptFRef = useRef<HTMLTextAreaElement>(null)
  const mcqOptGRef = useRef<HTMLTextAreaElement>(null)
  const explanationRef = useRef<HTMLTextAreaElement>(null)
  const answerInputRef = useRef<HTMLTextAreaElement>(null)
  const passageInstructionRef = useRef<HTMLTextAreaElement>(null)
  const passageTitleRef = useRef<HTMLTextAreaElement>(null)
  const passageSubtitleRef = useRef<HTMLTextAreaElement>(null)
  const passageBodyRef = useRef<HTMLTextAreaElement>(null)

  // Compiled questions for all passages (Target 40)
  const [compiledQuestions, setCompiledQuestions] = useState<QuestionItem[]>([])
  const nextQuestionNumber = compiledQuestions.reduce(
    (highest, question) => Math.max(highest, question.questionNumber),
    0
  ) + 1

  // Draft persistence states
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null)
  const [isDraftHydrated, setIsDraftHydrated] = useState(false)
  const restoredLocalDraft = useRef(false)
  const latestDraftRef = useRef<ReadingCreatorDraft | null>(null)

  // Load exam from server if editing
  const loadExamFromServer = async (id: string) => {
    setLoadingEdit(true)
    try {
      const res = await readingService.getExamById(id)
      const exam = res.data
      
      setExamTitle(exam.title || "")
      setExamDescription(exam.description || "")
      setExamDuration(exam.duration || 60)
      
      const initialPassages = getDefaultPassages()
      
      exam.passages?.forEach((p: any) => {
        const idx = p.order as 1 | 2 | 3
        const recovered = recoverPassageFields(p)
        initialPassages[idx] = {
          title: p.title || "",
          subtitle: recovered.subtitle,
          body: recovered.body,
          instruction: p.instruction || "",
          pdf: p.pdfUrl ? { name: "Uploaded PDF", size: "Unknown", url: p.pdfUrl } : null,
          image: p.imageUrl || null,
          imageName: p.imageUrl ? "Uploaded Image" : "",
        }
      })
      setPassageCount(Math.max(1, Math.min(3, exam.passages?.length || 1)) as 1 | 2 | 3)
      setPassages(initialPassages)

      const loadedQuestions: QuestionItem[] = []
      exam.passages?.forEach((passage: any) => {
        const passageIdx = passage.order as 1 | 2 | 3
        passage.questionGroups?.forEach((group: any) => {
          group.questions?.forEach((q: any) => {
            let correctAnswer = q.correctAnswer
            if ((group.type === "MULTIPLE_CHOICE" || group.type === "MULTIPLE_CHOICE_MULTIPLE") && q.options && q.options.length > 0) {
              const idx = q.options.indexOf(q.correctAnswer)
              if (idx === 0) correctAnswer = "A"
              else if (idx === 1) correctAnswer = "B"
              else if (idx === 2) correctAnswer = "C"
              else if (idx === 3) correctAnswer = "D"
              else if (idx === 4) correctAnswer = "E"
            }

            loadedQuestions.push({
              id: q.id || `q-${Date.now()}-${Math.random()}`,
              passageIndex: passageIdx,
              type: readingQuestionTypes.find(t => t.type === group.type)?.title || group.type,
              typeCode: group.type,
              questionNumber: q.questionNumber,
              text: q.questionText || "",
              instruction: group.instruction || "",
              correctAnswer: correctAnswer,
              explanation: q.explanation || "",
              options: q.options || undefined,
              groupOptions: group.options || undefined,
              passageSegment: group.passageSegment || undefined,
              groupImageUrl: group.imageUrl || undefined
            })
          })
        })
      })
      
      setCompiledQuestions(loadedQuestions)
      toast.success("Exam loaded for editing!")
    } catch (err: any) {
      toast.error("Failed to load exam: " + (err?.response?.data?.message || err.message))
    } finally {
      setLoadingEdit(false)
    }
  }

  // Restore draft or load from server
  useEffect(() => {
    if (embedded) {
      setIsDraftHydrated(true)
      return
    }

    try {
      const savedDraft = editId
        ? null
        : window.localStorage.getItem(localDraftKey) ?? window.localStorage.getItem(READING_CREATOR_DRAFT_KEY)

      if (savedDraft) {
        const parsed = JSON.parse(savedDraft) as { draft?: ReadingCreatorDraft; formState?: any; savedAt?: string }
        const draft = parsed?.draft || parsed?.formState

        if (draft && !isReadingDraftEmpty(draft)) {
          if (draft.examTitle !== undefined) setExamTitle(draft.examTitle)
          if (draft.examDescription !== undefined) setExamDescription(draft.examDescription)
          if (draft.examDuration !== undefined) setExamDuration(draft.examDuration)
          if (draft.passageCount !== undefined) setPassageCount(draft.passageCount)
          if (draft.activePassage !== undefined) setActivePassage(draft.activePassage)
          if (draft.passages) setPassages(draft.passages)
          if (draft.compiledQuestions) setCompiledQuestions(draft.compiledQuestions)

          if (draft.selectedQuestionType !== undefined) setSelectedQuestionType(draft.selectedQuestionType)
          if (draft.customQuestionNumber !== undefined) setCustomQuestionNumber(draft.customQuestionNumber)
          if (draft.questionText !== undefined) setQuestionText(draft.questionText)
          if (draft.questionInstruction !== undefined) setQuestionInstruction(draft.questionInstruction)
          if (draft.correctAnswer !== undefined) setCorrectAnswer(draft.correctAnswer)
          if (draft.questionExplanation !== undefined) setQuestionExplanation(draft.questionExplanation)
          if (draft.mcqOptA !== undefined) setMcqOptA(draft.mcqOptA)
          if (draft.mcqOptB !== undefined) setMcqOptB(draft.mcqOptB)
          if (draft.mcqOptC !== undefined) setMcqOptC(draft.mcqOptC)
          if (draft.mcqOptD !== undefined) setMcqOptD(draft.mcqOptD)
          if (draft.mcqOptE !== undefined) setMcqOptE(draft.mcqOptE)
          if (draft.mcqOptF !== undefined) setMcqOptF(draft.mcqOptF)
          if (draft.mcqOptG !== undefined) setMcqOptG(draft.mcqOptG)
          if (draft.multiMcqCorrectAnswers !== undefined) setMultiMcqCorrectAnswers(draft.multiMcqCorrectAnswers)
          if (draft.groupOptions !== undefined) setGroupOptions(draft.groupOptions)
          if (draft.passageSegment !== undefined) setPassageSegment(draft.passageSegment)
          if (draft.scompMode !== undefined) setScompMode(draft.scompMode)
          if (draft.mhdgMode !== undefined) setMhdgMode(draft.mhdgMode)
          if (draft.mhdgIntroText !== undefined) setMhdgIntroText(draft.mhdgIntroText)
          if (draft.hasExample !== undefined) setHasExample(draft.hasExample)
          if (draft.exampleParagraph !== undefined) setExampleParagraph(draft.exampleParagraph)
          if (draft.exampleAnswer !== undefined) setExampleAnswer(draft.exampleAnswer)
          if (draft.questionImage !== undefined) setQuestionImage(draft.questionImage)
          if (draft.questionImageName !== undefined) setQuestionImageName(draft.questionImageName)
          if (draft.scompAltAnswer1 !== undefined) setScompAltAnswer1(draft.scompAltAnswer1)
          if (draft.scompAltAnswer2 !== undefined) setScompAltAnswer2(draft.scompAltAnswer2)

          setLastDraftSavedAt(parsed.savedAt || null)
          restoredLocalDraft.current = true
          window.localStorage.setItem(localDraftKey, savedDraft)
          if (!editId) window.localStorage.removeItem(READING_CREATOR_DRAFT_KEY)
          toast.info("Your unfinished reading draft has been restored.")
        }
      }
    } catch {
      window.localStorage.removeItem(localDraftKey)
    }

    setIsDraftHydrated(true)

    if (editId) {
      loadExamFromServer(editId)
    }
  }, [localDraftKey, editId])

  // Keep latest snapshot synced
  useEffect(() => {
    latestDraftRef.current = {
      examTitle,
      examDescription,
      examDuration,
      passageCount,
      activePassage,
      passages,
      compiledQuestions,
      selectedQuestionType,
      customQuestionNumber,
      questionText,
      questionInstruction,
      correctAnswer,
      questionExplanation,
      mcqOptA,
      mcqOptB,
      mcqOptC,
      mcqOptD,
      mcqOptE,
      mcqOptF,
      mcqOptG,
      multiMcqCorrectAnswers,
      groupOptions,
      passageSegment,
      scompMode,
      mhdgMode,
      mhdgIntroText,
      hasExample,
      exampleParagraph,
      exampleAnswer,
      questionImage,
      questionImageName,
      scompAltAnswer1,
      scompAltAnswer2,
    }
  }, [
    examTitle,
    examDescription,
    examDuration,
    passageCount,
    activePassage,
    passages,
    compiledQuestions,
    selectedQuestionType,
    customQuestionNumber,
    questionText,
    questionInstruction,
    correctAnswer,
    questionExplanation,
    mcqOptA,
    mcqOptB,
    mcqOptC,
    mcqOptD,
    mcqOptE,
    mcqOptF,
    mcqOptG,
    multiMcqCorrectAnswers,
    groupOptions,
    passageSegment,
    scompMode,
    mhdgMode,
    mhdgIntroText,
    hasExample,
    exampleParagraph,
    exampleAnswer,
    questionImage,
    questionImageName,
    scompAltAnswer1,
    scompAltAnswer2,
  ])

  // Debounced auto-save effect
  useEffect(() => {
    if (embedded || !isDraftHydrated) return

    const timeoutId = window.setTimeout(() => {
      const currentDraft = latestDraftRef.current
      if (!currentDraft) return

      if (isReadingDraftEmpty(currentDraft)) {
        try {
          window.localStorage.removeItem(localDraftKey)
          setLastDraftSavedAt(null)
        } catch {}
        return
      }

      const savedAt = new Date().toISOString()
      try {
        window.localStorage.setItem(
          localDraftKey,
          JSON.stringify({ draft: currentDraft, savedAt })
        )
        setLastDraftSavedAt(savedAt)
      } catch {}
    }, 700)

    return () => window.clearTimeout(timeoutId)
  }, [
    embedded,
    isDraftHydrated,
    localDraftKey,
    examTitle,
    examDescription,
    examDuration,
    passageCount,
    activePassage,
    passages,
    compiledQuestions,
    selectedQuestionType,
    customQuestionNumber,
    questionText,
    questionInstruction,
    correctAnswer,
    questionExplanation,
    mcqOptA,
    mcqOptB,
    mcqOptC,
    mcqOptD,
    mcqOptE,
    mcqOptF,
    mcqOptG,
    multiMcqCorrectAnswers,
    groupOptions,
    passageSegment,
    scompMode,
    mhdgMode,
    hasExample,
    exampleParagraph,
    exampleAnswer,
    questionImage,
    questionImageName,
  ])

  // Immediate save on page unload / navigation
  useEffect(() => {
    if (embedded || !isDraftHydrated) return
    const persistBeforeExit = () => {
      const currentDraft = latestDraftRef.current
      if (!currentDraft || isReadingDraftEmpty(currentDraft)) return
      try {
        window.localStorage.setItem(
          localDraftKey,
          JSON.stringify({
            draft: currentDraft,
            savedAt: new Date().toISOString(),
          })
        )
      } catch {}
    }
    window.addEventListener("pagehide", persistBeforeExit)
    window.addEventListener("beforeunload", persistBeforeExit)
    return () => {
      window.removeEventListener("pagehide", persistBeforeExit)
      window.removeEventListener("beforeunload", persistBeforeExit)
    }
  }, [embedded, isDraftHydrated, localDraftKey])

  const saveLocalDraftManual = () => {
    const currentDraft = latestDraftRef.current
    if (!currentDraft) return
    const savedAt = new Date().toISOString()
    try {
      window.localStorage.setItem(
        localDraftKey,
        JSON.stringify({ draft: currentDraft, savedAt })
      )
      setLastDraftSavedAt(savedAt)
      toast.success("Draft saved on this device.")
    } catch {
      toast.error("Draft could not be saved in this browser.")
    }
  }

  const clearDraftAndResetForm = () => {
    try {
      window.localStorage.removeItem(localDraftKey)
      window.localStorage.removeItem(READING_CREATOR_DRAFT_KEY)
    } catch {}
    restoredLocalDraft.current = false
    setExamTitle('')
    setExamDescription('')
    setExamDuration(60)
    setPassageCount(3)
    setActivePassage(1)
    setPassages(getDefaultPassages())
    setCompiledQuestions([])
    setSelectedQuestionType(null)
    setCustomQuestionNumber('')
    setQuestionText('')
    setQuestionInstruction('')
    setCorrectAnswer('')
    setTableAnswers({})
    setQuestionExplanation('')
    setMcqOptA('')
    setMcqOptB('')
    setMcqOptC('')
    setMcqOptD('')
    setMcqOptE('')
    setMcqOptF('')
    setMcqOptG('')
    setMultiMcqCorrectAnswers([])
    setGroupOptions('')
    setPassageSegment('')
    setScompMode('WITHOUT_CLUES')
    setScompAltAnswer1('')
    setScompAltAnswer2('')
    setMhdgMode('WITH_CLUES')
    setMhdgIntroText('')
    setHasExample(false)
    setExampleParagraph('')
    setExampleAnswer('')
    setQuestionImage(null)
    setQuestionImageName('')
    setLastDraftSavedAt(null)
  }

  const handleDiscardDraft = () => {
    if (!window.confirm("Are you sure you want to discard this draft and reset all fields?")) return
    clearDraftAndResetForm()
    toast.info("Draft discarded and form reset.")
  }

  const hasDraftContent = Boolean(
    examTitle.trim() ||
    examDescription.trim() ||
    compiledQuestions.length > 0 ||
    Object.values(passages).some(p => p.title.trim() || p.body.trim()) ||
    questionText.trim()
  )
  
  // Helper: Update active passage field
  const updatePassageField = (field: keyof PassageData, value: any) => {
    setPassages({
      ...passages,
      [activePassage]: {
        ...passages[activePassage],
        [field]: value
      }
    })
  }



  // Passage/Question Image selection handler
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, isQuestionImage = false) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (isQuestionImage) setUploadingQImage(true)
      else setUploadingImage(true)

      try {
        const formData = new FormData()
        formData.append("file", file)
        const res = await readingService.uploadFile(formData)
        if (isQuestionImage) {
          setQuestionImage(res.data.url)
          setQuestionImageName(file.name)
        } else {
          updatePassageField('image', res.data.url)
          updatePassageField('imageName', file.name)
        }
        toast.success("Image uploaded successfully!")
      } catch (err: any) {
        toast.error("Image upload failed: " + (err?.response?.data?.message || err.message))
      } finally {
        if (isQuestionImage) setUploadingQImage(false)
        else setUploadingImage(false)
      }
    }
  }

  // Add Question to Compiled list for active passage
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault()

    const selectedTypeDetails = readingQuestionTypes.find(t => t.code === selectedQuestionType)
    if (!selectedTypeDetails) return

    if (selectedTypeDetails.type === "MATCHING_HEADINGS") {
      const headingOptions = getListOfHeadingOptions(groupOptions)
      if (headingOptions.length < 2) {
        toast.error("Add at least two headings to the List of Headings.")
        return
      }
      if (!questionText.trim()) {
        toast.error("Enter the paragraph name, for example Paragraph A.")
        return
      }
      if (!correctAnswer || !headingOptions.includes(correctAnswer)) {
        toast.error("Select the correct heading for this paragraph.")
        return
      }
    }

    const isSummaryType = [
      "SUMMARY_COMPLETION_WITH_OPTIONS",
      "SUMMARY_COMPLETION_WITHOUT_OPTIONS",
      "SUMMARY_COMPLETION"
    ].includes(selectedTypeDetails.type);

    const tablePlaceholderNumbers = selectedTypeDetails.type === "TABLE_COMPLETION"
      ? getPlaceholderNumbers(passageSegment)
      : [];
    const summaryPlaceholderNumbers = (isSummaryType || selectedTypeDetails.type === "NOTES_COMPLETION")
      ? getPlaceholderNumbers(passageSegment)
      : [];

    const firstUnansweredTableNumber = tablePlaceholderNumbers.find((questionNumber) => {
      const existingQuestion = compiledQuestions.find(
        (question) => question.passageIndex === activePassage && question.questionNumber === questionNumber
      );
      return !existingQuestion?.correctAnswer.trim();
    });

    const firstUnansweredSummaryNumber = summaryPlaceholderNumbers.find((questionNumber) => {
      const existingQuestion = compiledQuestions.find(
        (question) => question.passageIndex === activePassage && question.questionNumber === questionNumber
      );
      return !existingQuestion?.correctAnswer.trim();
    });

    // Table / Summary answers are entered sequentially, including placeholder records created earlier.
    const qNum = customQuestionNumber !== ''
      ? Number(customQuestionNumber)
      : firstUnansweredTableNumber ?? firstUnansweredSummaryNumber ?? nextQuestionNumber;

    // 1. Special Handling for MULTIPLE_CHOICE_MULTIPLE (R-MMCQ Checkboxes)
    if (selectedTypeDetails.type === "MULTIPLE_CHOICE_MULTIPLE") {
      if (multiMcqCorrectAnswers.length !== multiMcqAnswerCount) {
        toast.error(`Select exactly ${multiMcqAnswerCount} correct answers.`)
        return
      }
      const generatedQs: QuestionItem[] = [];
      const opts = [mcqOptA, mcqOptB, mcqOptC, mcqOptD, mcqOptE, mcqOptF, mcqOptG].filter(Boolean);
      const autoRange = multiMcqAnswerCount > 1 ? `Questions ${qNum}–${qNum + multiMcqAnswerCount - 1}` : `Question ${qNum}`;
      const lastLetter = String.fromCharCode(64 + Math.max(opts.length, multiMcqAnswerCount + 2, 5));
      const countWord = getNumberWord(multiMcqAnswerCount);
      const effectiveInstruction = `${autoRange}|||Choose ${countWord} letters, A–${lastLetter}.|||Write your answers in boxes ${qNum}–${qNum + multiMcqAnswerCount - 1} on your answer sheet.|||`;
      
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
          id: `q-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
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
      
      setCompiledQuestions([...compiledQuestions, ...generatedQs]);
      
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
    let finalCorrectAnswer = correctAnswer
    let finalOptions: string[] = []
    if (selectedTypeDetails.type === "MULTIPLE_CHOICE") {
      finalOptions = [mcqOptA, mcqOptB, mcqOptC, mcqOptD, mcqOptE, mcqOptF, mcqOptG].filter(Boolean)
      if (correctAnswer === "A") finalCorrectAnswer = mcqOptA
      else if (correctAnswer === "B") finalCorrectAnswer = mcqOptB
      else if (correctAnswer === "C") finalCorrectAnswer = mcqOptC
      else if (correctAnswer === "D") finalCorrectAnswer = mcqOptD
      else if (correctAnswer === "E") finalCorrectAnswer = mcqOptE
      else if (correctAnswer === "F") finalCorrectAnswer = mcqOptF
      else if (correctAnswer === "G") finalCorrectAnswer = mcqOptG
    } else if (selectedQuestionType === "R-SCOMP" && scompMode !== "WITH_CLUES") {
      const deduped = getDeduplicatedAnswers(correctAnswer, scompAltAnswer1, scompAltAnswer2)
      if (deduped.length === 0) {
        toast.error("Please enter at least one correct answer for Sentence Completion.")
        return
      }
      finalCorrectAnswer = deduped.join(" / ")
    }

    let finalGroupOptions: string[] = []
    if (
      ["MATCHING_HEADINGS", "MATCHING_FEATURES", "MATCHING_INFORMATION", "MATCHING_SENTENCE_ENDINGS", "SUMMARY_COMPLETION_WITH_OPTIONS"].includes(selectedTypeDetails.type) ||
      (selectedQuestionType === "R-SCOMP" && scompMode === "WITH_CLUES")
    ) {
      finalGroupOptions = selectedTypeDetails.type === "MATCHING_HEADINGS"
        ? getListOfHeadingOptions(groupOptions)
        : groupOptions.split("\n").map(o => o.trim()).filter(Boolean)
    }

    const singleEffectiveInstruction = questionInstruction;

    const newQ: QuestionItem = {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      passageIndex: activePassage,
      type: selectedTypeDetails.title,
      typeCode: selectedTypeDetails.type,
      questionNumber: qNum,
      text: questionText,
      instruction: singleEffectiveInstruction,
      correctAnswer: finalCorrectAnswer,
      explanation: questionExplanation,
      options: finalOptions.length > 0 ? finalOptions : undefined,
      groupOptions: finalGroupOptions.length > 0 ? finalGroupOptions : undefined,
      passageSegment: selectedTypeDetails.type === "MATCHING_HEADINGS"
        ? JSON.stringify({
            mode: mhdgMode,
            introText: mhdgIntroText,
            exampleParagraph: hasExample ? exampleParagraph : "",
            exampleAnswer: hasExample ? exampleAnswer : ""
          })
        : selectedTypeDetails.type === "MATCHING_INFORMATION"
        ? passageSegment
        : selectedQuestionType === "R-NMATCH"
        ? JSON.stringify({ variant: "NAME_MATCHING" })
        : ["TABLE_COMPLETION", "NOTES_COMPLETION", "FLOW_CHART_COMPLETION", "SUMMARY_COMPLETION_WITH_OPTIONS", "SUMMARY_COMPLETION_WITHOUT_OPTIONS"].includes(selectedTypeDetails.type)
        ? passageSegment
        : undefined,
      groupImageUrl: questionImage || undefined
    }

    if (selectedTypeDetails.type === "TABLE_COMPLETION" && tablePlaceholderNumbers.length > 0) {
      const answersByNumber = new Map(
        tablePlaceholderNumbers.map((questionNumber) => {
          const savedAnswer = compiledQuestions.find(
            (question) => question.passageIndex === activePassage && question.questionNumber === questionNumber
          )?.correctAnswer ?? "";
          return [questionNumber, (tableAnswers[questionNumber] ?? savedAnswer).trim()] as const;
        })
      );
      const missingAnswer = tablePlaceholderNumbers.find((questionNumber) => !answersByNumber.get(questionNumber));
      if (missingAnswer !== undefined) {
        toast.error(`Please enter the answer for Question ${missingAnswer}.`);
        return;
      }

      const existingTableNumbers = new Set(
        compiledQuestions
          .filter((question) => question.passageIndex === activePassage)
          .map((question) => question.questionNumber)
      );
      const updatedQuestions = compiledQuestions.map((question) => {
        if (question.passageIndex !== activePassage || !answersByNumber.has(question.questionNumber)) return question;
        return {
          ...question,
          passageSegment,
          correctAnswer: answersByNumber.get(question.questionNumber) ?? "",
          groupOptions: finalGroupOptions.length > 0 ? finalGroupOptions : question.groupOptions,
        };
      });
      const missingQuestions = tablePlaceholderNumbers
        .filter((questionNumber) => !existingTableNumbers.has(questionNumber))
        .map((questionNumber, index) => ({
          ...newQ,
          id: `q-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`,
          questionNumber,
          correctAnswer: answersByNumber.get(questionNumber) ?? "",
        }));

      setCompiledQuestions([...updatedQuestions, ...missingQuestions].sort((a, b) => a.questionNumber - b.questionNumber));
      setTableAnswers({});
      setCorrectAnswer("");
      setQuestionText("");
      setQuestionExplanation("");
      setCustomQuestionNumber("");
      toast.success(`Table answers ${tablePlaceholderNumbers.join(", ")} saved successfully!`);
      return;
    }

    if ((isSummaryType || selectedTypeDetails.type === "NOTES_COMPLETION") && summaryPlaceholderNumbers.length > 0) {
      const answersByNumber = new Map(
        summaryPlaceholderNumbers.map((questionNumber) => {
          const savedAnswer = compiledQuestions.find(
            (question) => question.passageIndex === activePassage && question.questionNumber === questionNumber
          )?.correctAnswer ?? "";
          const entered = summaryAnswers[questionNumber] !== undefined ? summaryAnswers[questionNumber] : (questionNumber === qNum ? correctAnswer : savedAnswer);
          return [questionNumber, entered.trim()] as const;
        })
      );
      const missingAnswer = summaryPlaceholderNumbers.find((questionNumber) => !answersByNumber.get(questionNumber));
      if (missingAnswer !== undefined) {
        toast.error(`Please enter the answer for Question ${missingAnswer}.`);
        return;
      }

      const existingSummaryNumbers = new Set(
        compiledQuestions
          .filter((question) => question.passageIndex === activePassage)
          .map((question) => question.questionNumber)
      );
      const updatedQuestions = compiledQuestions.map((question) => {
        if (question.passageIndex !== activePassage || !answersByNumber.has(question.questionNumber)) return question;
        return {
          ...question,
          type: selectedTypeDetails.title,
          typeCode: selectedTypeDetails.type,
          passageSegment,
          instruction: singleEffectiveInstruction,
          correctAnswer: answersByNumber.get(question.questionNumber) ?? "",
          options: selectedTypeDetails.type === "SUMMARY_COMPLETION_WITHOUT_OPTIONS" ? undefined : question.options,
          groupOptions: selectedTypeDetails.type === "SUMMARY_COMPLETION_WITHOUT_OPTIONS" ? undefined : (finalGroupOptions.length > 0 ? finalGroupOptions : question.groupOptions),
        };
      });
      const missingQuestions = summaryPlaceholderNumbers
        .filter((questionNumber) => !existingSummaryNumbers.has(questionNumber))
        .map((questionNumber, index) => ({
          ...newQ,
          id: `q-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`,
          questionNumber,
          instruction: singleEffectiveInstruction,
          correctAnswer: answersByNumber.get(questionNumber) ?? "",
          options: selectedTypeDetails.type === "SUMMARY_COMPLETION_WITHOUT_OPTIONS" ? undefined : newQ.options,
          groupOptions: selectedTypeDetails.type === "SUMMARY_COMPLETION_WITHOUT_OPTIONS" ? undefined : newQ.groupOptions,
        }));

      setCompiledQuestions([...updatedQuestions, ...missingQuestions].sort((a, b) => a.questionNumber - b.questionNumber));
      setSummaryAnswers({});
      setCorrectAnswer("");
      setQuestionText("");
      setQuestionExplanation("");
      setCustomQuestionNumber("");
      toast.success(`${selectedTypeDetails.type === "NOTES_COMPLETION" ? "Note" : "Summary"} answers for Questions ${summaryPlaceholderNumbers.join(", ")} saved successfully!`);
      return;
    }

    const existingQuestionNumbers = new Set(
      compiledQuestions
        .filter((question) => question.passageIndex === activePassage)
        .map((question) => question.questionNumber)
    )
    const questionsToAdd: QuestionItem[] = tablePlaceholderNumbers.length > 0
      ? tablePlaceholderNumbers
        .filter((questionNumber) => !existingQuestionNumbers.has(questionNumber))
        .map((questionNumber, index) => ({
          ...newQ,
          id: index === 0 ? newQ.id : `q-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`,
          questionNumber,
          correctAnswer: questionNumber === qNum ? newQ.correctAnswer : "",
        }))
      : [newQ]

    const updatedQuestions = compiledQuestions.map((question) =>
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
    )

    // Create missing placeholders once; subsequent submissions update their answers in order.
    setCompiledQuestions([...updatedQuestions, ...questionsToAdd].sort((a, b) => a.questionNumber - b.questionNumber))
    
    // Reset Form
    setQuestionText('')
    setQuestionExplanation('')
    setCorrectAnswer('')
    setScompAltAnswer1('')
    setScompAltAnswer2('')
    setCustomQuestionNumber('')
    setMcqOptA('')
    setMcqOptB('')
    setMcqOptC('')
    setMcqOptD('')
    setMcqOptE('')
    setMcqOptF('')
    setMcqOptG('')
    setMultiMcqCorrectAnswers([])
    setQuestionImage(null)
    setQuestionImageName('')
    // Keep instruction, groupOptions, and table template for convenience when adding sequential questions
    toast.success(`Question ${qNum} added!`)
  }

  // Delete Question
  const handleDeleteQuestion = (id: string) => {
    setCompiledQuestions(compiledQuestions.filter(q => q.id !== id))
  }

  // Complete Paper Publish
  const handlePublishPaper = async () => {
    setIsPublishing(true)
    try {
      // Re-map flat questions list into nested structure expected by database
      const mappedPassages = Array.from({ length: passageCount }, (_, i) => i + 1).map((idx) => {
        const p = passages[idx as 1 | 2 | 3]
        const passageQuestions = compiledQuestions.filter(q => q.passageIndex === idx)
        
        // Group questions sequentially
        const questionGroups: any[] = []
        let currentGroup: any = null

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
            }
            questionGroups.push(currentGroup)
          }

          currentGroup.questions.push({
            questionNumber: q.questionNumber,
            questionText: q.text || "",
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || ""
          })
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

        // Formulate instructions and title as pre-formatted HTML prepended to the body
        const instructionHtml = p.instruction 
          ? `<div class="mb-6 p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-750 leading-relaxed font-semibold italic shadow-sm">
               <span class="text-xs font-black uppercase tracking-wider block text-indigo-700 mb-1">READING PASSAGE ${idx}</span>
               ${convertMarkdownToHtml(p.instruction)}
             </div>` 
          : `<div class="mb-6 p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-750 leading-relaxed font-semibold italic shadow-sm">
               <span class="text-xs font-black uppercase tracking-wider block text-indigo-700 mb-1">READING PASSAGE ${idx}</span>
               You should spend about 20 minutes on Questions which are based on Reading Passage ${idx} below.
             </div>`;
             
        const effectivePassageTitle = p.title.trim() || `Reading Passage ${idx}`;
        const titleHtml = `<h2 class="text-2xl font-extrabold text-black mb-3 mt-2 tracking-tight whitespace-pre-wrap text-center">${convertInlineMarkdownToHtml(effectivePassageTitle)}</h2>`;
        const subtitleHtml = p.subtitle
          ? `<div class="mb-5 text-center font-serif italic leading-relaxed text-gray-800">${convertInlineMarkdownToHtml(p.subtitle)}</div>`
          : "";
        const bodyHtml = convertMarkdownToHtml(p.body || "");
        const combinedText = `${instructionHtml}${titleHtml}${subtitleHtml}${bodyHtml}`;

        return {
          title: effectivePassageTitle,
          subtitle: p.subtitle || "",
          text: combinedText,
          body: p.body || "",
          instruction: p.instruction || "",
          pdfUrl: p.pdf?.url || "",
          imageUrl: p.image || "",
          order: idx,
          questionGroups
        }
      })

      const examPayload = {
        title: examTitle.trim() || "Untitled IELTS Reading Exam",
        description: examDescription.trim() || "IELTS Academic Reading Mock Exam",
        duration: Number(examDuration) || 60,
        isPublished: true,
        passages: mappedPassages
      }

      if (embedded && onExamReady) {
        onExamReady(examPayload)
        return
      }

      if (editId) {
        await readingService.updateExam(editId, examPayload)
        toast.success("Congratulations! IELTS Exam updated successfully.")
        clearDraftAndResetForm()
        router.push("/teacher/exams")
        router.refresh()
      } else {
        await readingService.createExam(examPayload)
        toast.success("Congratulations! IELTS Exam created successfully.")
        clearDraftAndResetForm()
      }
    } catch (err: any) {
      toast.error("Failed to publish mock exam: " + (err?.response?.data?.message || err.message))
    } finally {
      setIsPublishing(false)
    }
  }

  // Auto-sync reading payload to Full Mock parent when embedded
  useEffect(() => {
    if (!embedded || !onExamReady) return
    const mappedPassages = Object.entries(passages).map(([idxStr, p]) => {
      const idx = Number(idxStr) as 1 | 2 | 3
      const passageQuestions = compiledQuestions.filter((q) => q.passageIndex === idx)
      const questionGroups: any[] = []
      let currentGroup: any = null

      for (const q of passageQuestions) {
        const isSameType =
          currentGroup &&
          currentGroup.type === q.typeCode &&
          areInstructionsCompatible(currentGroup.instruction, q.instruction)

        if (isSameType) {
          if ((!currentGroup.options || currentGroup.options.length === 0) && q.groupOptions && q.groupOptions.length > 0) {
            currentGroup.options = q.groupOptions
          }
          if (!currentGroup.passageSegment && q.passageSegment) {
            currentGroup.passageSegment = q.passageSegment
          }
          if (!currentGroup.instruction && q.instruction) {
            currentGroup.instruction = q.instruction
          }
          if (!currentGroup.imageUrl && q.groupImageUrl) {
            currentGroup.imageUrl = q.groupImageUrl
          }
        } else {
          currentGroup = {
            type: q.typeCode,
            instruction: q.instruction || "",
            passageSegment: q.passageSegment || "",
            options: q.groupOptions || [],
            imageUrl: q.groupImageUrl || "",
            order: questionGroups.length + 1,
            questions: [],
          }
          questionGroups.push(currentGroup)
        }

        currentGroup.questions.push({
          questionNumber: q.questionNumber,
          questionText: q.text || "",
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || "",
        })
      }

      questionGroups.forEach((g) => {
        if (g.questions.length > 0) {
          const qStart = g.questions[0].questionNumber
          const qEnd = g.questions[g.questions.length - 1].questionNumber
          const autoRange = qStart === qEnd ? `Question ${qStart}` : `Questions ${qStart}–${qEnd}`
          if (g.instruction) {
            const parsed = parseGroupInstruction(g.instruction)
            const inst3Part = parsed.inst3 ? `|||INST3:${parsed.inst3}` : ""
            const listPart = parsed.listItems.length > 0 ? "|||" + parsed.listItems.join("|||") : ""
            g.instruction = `${autoRange}|||${parsed.inst1}|||${parsed.inst2}|||${parsed.heading}${inst3Part}${listPart}`
          }
        }
      })

      const instructionHtml = p.instruction
        ? `<div class="mb-6 p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-750 leading-relaxed font-semibold italic shadow-sm">
             <span class="text-xs font-black uppercase tracking-wider block text-indigo-700 mb-1">READING PASSAGE ${idx}</span>
             ${convertMarkdownToHtml(p.instruction)}
           </div>`
        : `<div class="mb-6 p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-750 leading-relaxed font-semibold italic shadow-sm">
             <span class="text-xs font-black uppercase tracking-wider block text-indigo-700 mb-1">READING PASSAGE ${idx}</span>
             You should spend about 20 minutes on Questions which are based on Reading Passage ${idx} below.
           </div>`

      const titleHtml = `<h2 class="text-2xl font-extrabold text-black mb-5 mt-2 tracking-tight whitespace-pre-wrap">${p.title.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-black">$1</strong>')}</h2>`
      const bodyHtml = convertMarkdownToHtml(p.body || "")
      const combinedText = `${instructionHtml}${titleHtml}${bodyHtml}`

      return {
        title: p.title,
        text: combinedText,
        body: p.body || "",
        instruction: p.instruction || "",
        pdfUrl: p.pdf?.url || "",
        imageUrl: p.image || "",
        order: idx,
        questionGroups,
      }
    })

    const examPayload = {
      title: examTitle.trim() || "Untitled IELTS Reading Exam",
      description: examDescription.trim() || "IELTS Academic Reading Mock Exam",
      duration: Number(examDuration) || 60,
      isPublished: true,
      passages: mappedPassages,
    }

    onExamReady(examPayload)
  }, [passages, compiledQuestions, examTitle, examDescription, examDuration, embedded, onExamReady])

  const activePreviewGroups = React.useMemo(
    () => createReadingPreviewGroups(compiledQuestions, activePassage),
    [activePassage, compiledQuestions]
  )

  const draftPreviewGroup = React.useMemo<IQuestionGroup | null>(() => {
    const selectedType = readingQuestionTypes.find((type) => type.code === selectedQuestionType)
    if (!selectedType) return null

    const questionNumber = customQuestionNumber !== '' ? Number(customQuestionNumber) : nextQuestionNumber
    const mcqOptions = [mcqOptA, mcqOptB, mcqOptC, mcqOptD, mcqOptE, mcqOptF, mcqOptG].filter(Boolean)
    const placeholderNumbers = (
      selectedType.type === "TABLE_COMPLETION" ||
      selectedType.type === "SUMMARY_COMPLETION_WITH_OPTIONS" ||
      selectedType.type === "SUMMARY_COMPLETION_WITHOUT_OPTIONS" ||
      selectedType.type === "SUMMARY_COMPLETION" ||
      selectedType.type === "NOTES_COMPLETION"
    )
      ? getPlaceholderNumbers(passageSegment)
      : []
    const previewQuestionCount = selectedType.type === "MULTIPLE_CHOICE_MULTIPLE"
      ? multiMcqAnswerCount
      : Math.max(1, placeholderNumbers.length)
    const lastAddedGroup = activePreviewGroups[activePreviewGroups.length - 1]
    const existingNumbers = lastAddedGroup?.type === selectedType.type
      ? lastAddedGroup.questions.map((q) => q.questionNumber)
      : []
    const rangeNumbers = placeholderNumbers.length > 0
      ? placeholderNumbers
      : [...existingNumbers, ...Array.from({ length: previewQuestionCount }, (_, i) => questionNumber + i)]
    const rangeStart = rangeNumbers.length > 0 ? Math.min(...rangeNumbers) : questionNumber
    const rangeEnd = rangeNumbers.length > 0 ? Math.max(...rangeNumbers) : questionNumber
    const automaticRange = rangeStart === rangeEnd
      ? `Question ${rangeStart}`
      : `Questions ${rangeStart}–${rangeEnd}`

    const parsedInstruction = parseGroupInstruction(questionInstruction)
    const effectiveRange = parsedInstruction.range.trim() || automaticRange
    const listItemsJoined = (parsedInstruction.listItems || []).join("|||")
    const inst3Part = parsedInstruction.inst3?.trim() ? `|||INST3:${parsedInstruction.inst3.trim()}` : ""
    let draftInstruction = `${effectiveRange}|||${parsedInstruction.inst1.trim()}|||${parsedInstruction.inst2.trim()}|||${parsedInstruction.heading.trim()}${inst3Part}${
      listItemsJoined ? "|||" + listItemsJoined : ""
    }`
    if (selectedType.type === "MULTIPLE_CHOICE_MULTIPLE") {
      const optionCount = [mcqOptA, mcqOptB, mcqOptC, mcqOptD, mcqOptE, mcqOptF, mcqOptG].filter(Boolean).length;
      const lastLetter = String.fromCharCode(64 + Math.max(optionCount, multiMcqAnswerCount + 2, 5));
      const countWord = getNumberWord(multiMcqAnswerCount);
      draftInstruction = `${automaticRange}|||Choose ${countWord} letters, A–${lastLetter}.|||Write your answers in boxes ${rangeStart}–${rangeEnd} on your answer sheet.|||`;
    }

    const previewPassageSegment = selectedType.type === "MATCHING_HEADINGS"
      ? JSON.stringify({
          mode: mhdgMode,
          introText: mhdgIntroText,
          exampleParagraph: hasExample ? exampleParagraph : "",
          exampleAnswer: hasExample ? exampleAnswer : "",
        })
      : selectedType.type === "MATCHING_INFORMATION"
        ? passageSegment
      : selectedQuestionType === "R-NMATCH"
        ? JSON.stringify({ variant: "NAME_MATCHING" })
      : ["TABLE_COMPLETION", "NOTES_COMPLETION", "FLOW_CHART_COMPLETION", "SUMMARY_COMPLETION_WITH_OPTIONS", "SUMMARY_COMPLETION_WITHOUT_OPTIONS"].includes(selectedType.type)
        ? passageSegment
        : undefined

    return {
      id: "draft-preview-group",
      passageId: `preview-passage-${activePassage}`,
      type: selectedType.type as QuestionGroupType,
      instruction: draftInstruction,
      passageSegment: previewPassageSegment,
      options: selectedType.type === "MATCHING_HEADINGS"
        ? getListOfHeadingOptions(groupOptions)
        : selectedType.type === "SUMMARY_COMPLETION_WITHOUT_OPTIONS"
        ? undefined
        : groupOptions.split("\n").map((option) => option.trim()).filter(Boolean),
      imageUrl: questionImage || undefined,
      order: 1,
      questions: Array.from({ length: previewQuestionCount }, (_, index) => ({
        id: `draft-preview-question-${index}`,
        groupId: "draft-preview-group",
        questionNumber: placeholderNumbers[index] ?? questionNumber + index,
        questionText,
        options: mcqOptions,
      })),
    }
  }, [
    activePassage,
    activePreviewGroups,
    customQuestionNumber,
    exampleAnswer,
    exampleParagraph,
    groupOptions,
    hasExample,
    mcqOptA,
    mcqOptB,
    mcqOptC,
    mcqOptD,
    mcqOptE,
    mcqOptF,
    mcqOptG,
    mhdgMode,
    mhdgIntroText,
    multiMcqCorrectAnswers.length,
    multiMcqAnswerCount,
    nextQuestionNumber,
    passageSegment,
    questionImage,
    questionInstruction,
    questionText,
    selectedQuestionType,
  ])

  const handleQuestionTypeSelect = (typeCode: string) => {
    if (typeCode === selectedQuestionType) return

    setSelectedQuestionType(typeCode || null)
    setQuestionInstruction(typeCode ? defaultQuestionInstructions[typeCode] || "" : "")
    setQuestionText("")
    setCorrectAnswer("")
    setScompAltAnswer1("")
    setScompAltAnswer2("")
    setQuestionExplanation("")
    setCustomQuestionNumber("")
    setMultiMcqCorrectAnswers([])
    setSummaryAnswers({})
    setTableAnswers({})
    setMcqOptA("")
    setMcqOptB("")
    setMcqOptC("")
    setMcqOptD("")
    setMcqOptE("")
    setMcqOptF("")
    setMcqOptG("")
    setGroupOptions("")
    setPassageSegment("")
    setMhdgIntroText("")
    setQuestionImage(null)
    setQuestionImageName("")

    if (typeCode === "R-MINF") {
      setGroupOptions("A\nB\nC\nD\nE\nF\nG")
      if (!questionInstruction.trim() || questionInstruction === "||||||" || questionInstruction === "|||") {
        setQuestionInstruction("|||Which paragraph contains the following information?|||Write the correct letter, A–G, in the boxes on your answer sheet.||||||NB  You may use any letter more than once.")
      }
    } else if (typeCode === "R-TFN") {
      if (!questionInstruction.trim() || questionInstruction === "||||||" || questionInstruction === "|||") {
        setQuestionInstruction("|||Do the following statements agree with the information given in Reading Passage?|||In boxes on your answer sheet, write:||||||TRUE  if the statement agrees with the information|||FALSE  if the statement contradicts the information|||NOT GIVEN  if there is no information on this")
      }
    } else if (typeCode === "R-YNN") {
      if (!questionInstruction.trim() || questionInstruction === "||||||" || questionInstruction === "|||") {
        setQuestionInstruction("|||Do the following statements agree with the claims of the writer in Reading Passage?|||In boxes on your answer sheet, write:||||||YES  if the statement agrees with the claims|||NO  if the statement contradicts the claims|||NOT GIVEN  if there is no information on this")
      }
    } else if (typeCode === "R-MHDG") {
      if (!questionInstruction.trim() || questionInstruction === "||||||" || questionInstruction === "|||") {
        setQuestionInstruction("|||Choose the correct heading for each paragraph from the list of headings below.|||Write the correct number, i–x, in boxes on your answer sheet.|||")
      }
    } else if (typeCode === "R-SCOMP") {
      if (!questionInstruction.trim() || questionInstruction === "||||||" || questionInstruction === "|||") {
        setQuestionInstruction("|||Complete the sentences below.|||Choose NO MORE THAN TWO WORDS from the passage for each answer.||||||INST3:Write your answers in boxes on your answer sheet.")
      }
    } else if (typeCode === "R-SCWO") {
      setGroupOptions("")
      if (!questionInstruction.trim() || questionInstruction === "||||||" || questionInstruction === "|||") {
        setQuestionInstruction("|||Complete the summary below.|||Choose NO MORE THAN TWO WORDS from the passage for each answer.||||||INST3:Write your answers in boxes on your answer sheet.")
      }
    } else if (typeCode === "R-SCO") {
      if (!questionInstruction.trim() || questionInstruction === "||||||" || questionInstruction === "|||") {
        setQuestionInstruction("|||Complete the summary using the list of words, A–L, below.|||Write the correct letter, A–L, in boxes on your answer sheet.|||")
      }
    }
  }

  if (loadingEdit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
        <IconLoader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-sm font-bold text-gray-500">Loading exam draft for editing...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <FloatingSelectionToolbar allEditableFields syntax="markdown" />
      
      {/* Top Welcome & Header */}
      {!embedded ? (
        <div className="relative flex flex-col items-start justify-between gap-5 overflow-hidden rounded-2xl border border-[#244a82] bg-gradient-to-r from-[#10284c] via-[#173967] to-[#10284c] p-5 text-white shadow-md md:flex-row md:items-center md:p-6">
          {/* Floating gradient glow elements */}
          <div className="absolute -top-12 -right-12 h-44 w-44 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 h-36 w-36 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-2 flex-1 min-w-0 z-10">
            <span className="text-[10px] font-black tracking-widest uppercase bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 px-3 py-1 rounded-full w-max block">
              Academic Reading Creator
            </span>
            <h1 className="mt-1 flex items-center gap-2.5 text-xl font-black tracking-tight text-white md:text-2xl">
              <IconNotebook size={27} className="text-blue-300 stroke-[2.2]" />
              <span>{editId ? "Edit Reading Exam Workspace" : "Create Reading Exam Workspace"}</span>
            </h1>
            <p className="text-slate-300 font-medium text-xs md:text-sm leading-relaxed max-w-2xl">
              Build passages and every existing IELTS Reading question type in one focused workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 z-10">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              </span>
              {lastDraftSavedAt
                ? `Draft auto-saved (${new Date(lastDraftSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                : "Auto-draft active"}
            </span>

            <button
              type="button"
              onClick={saveLocalDraftManual}
              className="cursor-pointer rounded-lg border border-indigo-400/30 bg-white/10 px-3.5 py-2 text-xs font-black text-white transition hover:bg-white/20 active:scale-95"
              title="Save draft immediately to local storage"
            >
              Save Draft
            </button>

            {hasDraftContent && (
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="cursor-pointer rounded-lg border border-rose-400/30 bg-rose-500/10 px-3.5 py-2 text-xs font-black text-rose-200 transition hover:bg-rose-500/20 active:scale-95"
                title="Discard draft and reset all inputs"
              >
                Reset Draft
              </button>
            )}

            <Button 
              onClick={handlePublishPaper}
              disabled={isPublishing}
              className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-blue-400/30 bg-[#24549a] px-5 py-2 text-xs font-black text-white shadow transition hover:bg-[#1b3f74] disabled:bg-slate-800 disabled:text-slate-500"
            >
              {isPublishing ? (
                <IconLoader2 size={16} className="animate-spin" />
              ) : (
                <IconSparkles size={16} className="animate-pulse text-indigo-200" />
              )}
              <span>Publish Mock Exam</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <div>
            <h3 className="text-sm font-extrabold text-[#10284c]">Reading Passages & Question Paper</h3>
            <p className="text-xs text-slate-500 font-medium">Add passage text, configure questions, and organize 3 academic sections.</p>
          </div>
          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            Auto-synced to Full Mock Test
          </span>
        </div>
      )}
        <div className="grid gap-6 lg:grid-cols-3 animate-fadeIn">
          
          {/* Main Workspace Column (8) */}
          <div className={`${embedded ? "lg:col-span-3" : "lg:col-span-2"} space-y-6`}>
            
            {/* Exam metadata specifications */}
            {!embedded && <Card className="rounded-2xl border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="font-bold text-black text-lg">Exam Metadata</CardTitle>
                <CardDescription className="text-gray-500 font-medium">Set the title, instructions description, and duration timer for this complete mock exam.</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">Mock Exam Title <span className="text-rose-500">*</span></label>
                    <textarea 
                      rows={2}
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      placeholder="e.g. Cambridge IELTS Academic Reading Practice Test 1" 
                      className="w-full font-bold text-sm text-black px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-gray-50/50 text-black placeholder:text-gray-400 resize-y"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">Duration (Minutes)</label>
                    <input 
                      type="number" 
                      value={examDuration}
                      onChange={(e) => setExamDuration(Number(e.target.value))}
                      placeholder="60" 
                      className="w-full font-bold text-sm text-black px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-gray-50/50 text-black"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">Description Instruction (Optional)</label>
                  <textarea
                    rows={2}
                    value={examDescription}
                    onChange={(e) => setExamDescription(e.target.value)}
                    placeholder="e.g. Academic reading evaluation. Consists of 3 sections." 
                    className="w-full font-bold text-sm text-black px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-gray-50/50 text-black placeholder:text-gray-400 resize-y"
                  />
                </div>
              </CardContent>
            </Card>}

            {embedded && (
              <Card className="overflow-hidden rounded-2xl border-gray-200 bg-white shadow-sm">
                <CardHeader className="border-b border-gray-100 pb-3">
                  <CardTitle className="flex items-center justify-between gap-3 text-base font-bold text-black">
                    <span>IELTS Exam Overview</span>
                    <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-700">
                      {compiledQuestions.length} / 40 Qs
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs font-medium text-gray-400">
                    Monitoring standard IELTS Academic question counts across the 3 passages.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-500">IELTS Target Limit</span>
                      <span className="font-black text-indigo-600">{Math.round((compiledQuestions.length / 40) * 100)}% Complete</span>
                    </div>
                    <Progress
                      value={Math.min((compiledQuestions.length / 40) * 100, 100)}
                      className="h-2 bg-gray-100 shadow-inner [&>div]:bg-indigo-600"
                    />
                    {compiledQuestions.length !== 40 && (
                      <div className="mt-1 flex items-center gap-1 rounded-lg border border-amber-100 bg-amber-50 p-2 text-[10px] font-bold text-amber-600">
                        <IconInfoCircle size={14} className="shrink-0" />
                        <span>Note: IELTS Academic standard expects exactly 40 questions.</span>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {([1, 2, 3] as const).slice(0, passageCount).map((passIdx) => {
                      const passageQuestions = compiledQuestions.filter((question) => question.passageIndex === passIdx)
                      const passageTitle = passages[passIdx].title || `Passage ${passIdx} Title (Not Drafted)`
                      return (
                        <div key={passIdx} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                          <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2">
                            <div className="min-w-0">
                              <span className="block text-[8px] font-black uppercase tracking-wider text-gray-400">Passage {passIdx}</span>
                              <span className={`block truncate text-xs font-extrabold ${passages[passIdx].title ? "text-black" : "italic text-gray-400"}`}>
                                {passageTitle}
                              </span>
                            </div>
                            <span className="shrink-0 rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-black text-indigo-600">
                              {passageQuestions.length} Qs
                            </span>
                          </div>
                          <p className="py-3 text-center text-[9px] italic text-gray-400">
                            {passageQuestions.length > 0
                              ? `${passageQuestions.length} question${passageQuestions.length === 1 ? "" : "s"} added`
                              : "No questions added yet for this passage."}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Passage Count Selector */}


            {/* Passage Segment Selector */}
            <ReadingSectionTabs
              sectionCount={passageCount}
              activeSection={activePassage}
              onSectionChange={(section) => {
                setActivePassage(section)
                setSelectedQuestionType(null)
              }}
              isSectionComplete={(section) => Boolean(passages[section].title.trim())}
            />

            {/* Passage Form Card */}
            <Card className="relative overflow-hidden rounded-2xl border-gray-200 bg-white shadow-sm">
              <div className="absolute right-0 top-0 h-1.5 w-full bg-gradient-to-r from-[#1B3A6B] to-[#24549a]" />
              
              <CardHeader className="pb-3 border-b border-gray-100 pt-7">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="font-extrabold text-black text-lg flex items-center gap-2">
                      Passage {activePassage} Specifications
                    </CardTitle>
                    <CardDescription className="text-gray-500 font-medium">Input reading text body, upload documents (PDF) or graphs (Images) for Passage {activePassage}.</CardDescription>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">
                    Section {activePassage}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="pt-5 space-y-5">
                
                {/* Spent Time Instruction */}
                <div className="space-y-1">
                  <FormatToolbar
                    inputRef={passageInstructionRef}
                    value={passages[activePassage].instruction || ''}
                    onChange={(val) => updatePassageField('instruction', val)}
                    label={`Passage ${activePassage} Description / Spent Time Instruction`}
                  />
                  <textarea
                    ref={passageInstructionRef}
                    rows={2}
                    value={passages[activePassage].instruction || ''}
                    onChange={(e) => updatePassageField('instruction', e.target.value)}
                    placeholder="e.g. You should spend about 20 minutes on Questions 14-26 which are based on Reading Passage 2 below."
                    className="w-full text-xs font-normal px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-gray-50/50 text-black placeholder:text-gray-400 resize-y"
                  />
                </div>

                {/* Passage Title */}
                <div className="space-y-1">
                  <FormatToolbar 
                    inputRef={passageTitleRef}
                    value={passages[activePassage].title}
                    onChange={(val) => updatePassageField('title', val)}
                    label={`Passage ${activePassage} Title`}
                  />
                  <textarea 
                    ref={passageTitleRef}
                    rows={2}
                    value={passages[activePassage].title}
                    onChange={(e) => updatePassageField('title', e.target.value)}
                    placeholder="e.g. Stepwells"
                    className="w-full font-semibold text-xs text-black px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-gray-50/50 text-black placeholder:text-gray-400 resize-y"
                  />
                </div>

                {/* Centered description below title */}
                <div className="space-y-1">
                  <FormatToolbar
                    inputRef={passageSubtitleRef}
                    value={passages[activePassage].subtitle}
                    onChange={(val) => updatePassageField('subtitle', val)}
                    label="Centered Description Below Title"
                  />
                  <textarea
                    ref={passageSubtitleRef}
                    rows={3}
                    value={passages[activePassage].subtitle}
                    onChange={(e) => updatePassageField('subtitle', e.target.value)}
                    placeholder="e.g. A millennium ago, stepwells were fundamental to life in the driest parts of India..."
                    className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-normal italic text-black placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none"
                  />
                  <p className="text-[10px] font-medium text-gray-400">This text appears centered and italic directly below the passage title.</p>
                </div>

                {/* Image Upload System */}
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Attach Passage Image Diagram</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={imageInputRef}
                    onChange={(e) => handleImageChange(e)}
                    className="hidden" 
                  />
                  
                  {uploadingImage ? (
                    <div className="flex flex-col items-center justify-center p-5 border border-indigo-200 bg-indigo-50/30 rounded-xl h-36">
                      <IconLoader2 size={32} className="text-indigo-600 animate-spin" />
                      <span className="text-xs text-indigo-950 font-bold mt-2">Uploading Image...</span>
                    </div>
                  ) : passages[activePassage].image ? (
                    <div className="relative group rounded-xl overflow-hidden border border-gray-200 h-36 flex items-center justify-center bg-gray-50/50 animate-fadeIn">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={passages[activePassage].image || ''} alt="Passage visual chart reference" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center transition-opacity duration-200 text-white p-2">
                        <span className="font-bold text-xs truncate max-w-[150px]">{passages[activePassage].imageName}</span>
                        <Button 
                          onClick={() => { updatePassageField('image', null); updatePassageField('imageName', ''); }}
                          variant="ghost" 
                          size="sm" 
                          className="text-red-400 hover:text-red-600 font-bold hover:bg-transparent text-[10px] mt-2 h-6 p-0"
                        >
                          Remove Image
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => imageInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-200 hover:border-indigo-300 rounded-xl cursor-pointer hover:bg-gray-50/40 transition-all duration-200 h-36 text-center group"
                    >
                      <IconPhoto size={32} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
                      <span className="font-bold text-xs text-gray-800 mt-2">Upload Visual Diagram</span>
                      <span className="text-[10px] text-gray-400 font-semibold mt-1">For chart, graph, map details</span>
                    </div>
                  )}
                </div>

                {/* Passage Body Text */}
                <div className="space-y-1">
                  <FormatToolbar 
                    inputRef={passageBodyRef}
                    value={passages[activePassage].body}
                    onChange={(val) => updatePassageField('body', val)}
                    label={`Passage ${activePassage} Body Text`}
                  />
                  <textarea 
                    ref={passageBodyRef}
                    rows={8}
                    value={passages[activePassage].body}
                    onChange={(e) => updatePassageField('body', htmlPassageToEditableText(e.target.value))}
                    placeholder="Enter the full Reading Passage paragraphs..." 
                    className="w-full text-xs font-semibold px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-gray-50/50 text-black placeholder:text-gray-400 resize-y"
                  />
                </div>

              </CardContent>
            </Card>

            <div className="overflow-hidden rounded-2xl border border-slate-300 bg-slate-100 p-4 md:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-800">
                    <IconEye size={17} /> Passage {activePassage} Student Preview
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">Formatting and layout update while you edit the passage above.</p>
                </div>
                <span className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600">Live</span>
              </div>
              <ReadingPassagePreview passageNumber={activePassage} passage={passages[activePassage]} />
            </div>

            {/* Questions Configurator */}
            <Card className="rounded-2xl border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="font-bold text-black text-lg">Add Questions to Passage {activePassage}</CardTitle>
                <CardDescription className="text-gray-500 font-medium">Select an official IELTS question type to build and associate questions specifically under Passage {activePassage}.</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-5 space-y-5">
                
                <div className="rounded-xl border border-gray-200 bg-slate-50/60 p-4">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(240px,0.65fr)] md:items-end">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-gray-700">Question Format Type</label>
                      <select
                        value={selectedQuestionType ?? ""}
                        onChange={(event) => handleQuestionTypeSelect(event.target.value)}
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-bold text-gray-800 outline-none focus:border-[#1B3A6B]"
                      >
                        <option value="">Select a Reading question type</option>
                        {readingQuestionTypes.map((type) => (
                          <option key={type.code} value={type.code}>{type.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#1B3A6B]">
                        {selectedQuestionType || "Reading Question"}
                      </span>
                      <p className="mt-1 text-[11px] font-semibold leading-relaxed text-gray-600">
                        {readingQuestionTypes.find((type) => type.code === selectedQuestionType)?.desc || "Choose a format to open its question builder."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Question Building Form */}
                {selectedQuestionType ? (
                  <form onSubmit={handleAddQuestion} className="animate-fadeIn space-y-4 rounded-xl border border-gray-200 border-l-4 border-l-[#1B3A6B] bg-white p-5 shadow-sm">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="text-xs font-black text-[#1B3A6B]">
                        Configuring for Passage {activePassage}: {readingQuestionTypes.find(t => t.code === selectedQuestionType)?.title}
                      </span>
                      <Button 
                        type="button"
                        onClick={() => setSelectedQuestionType(null)} 
                        variant="ghost" 
                        className="text-[10px] text-gray-400 font-bold h-6 hover:bg-transparent"
                      >
                        Cancel
                      </Button>
                    </div>



                    {selectedQuestionType === "R-MHDG" && (
                      <div className="bg-white p-4 rounded-xl border border-indigo-100/55 space-y-4 shadow-sm animate-fadeIn">
                        {(() => {
                          const parsed = parseGroupInstruction(questionInstruction)
                          const updateHeadingInstruction = (field: "range" | "inst1" | "inst2", value: string) => {
                            const next = { ...parsed, [field]: value }
                            setQuestionInstruction(`${next.range.trim()}|||${next.inst1.trim()}|||${next.inst2.trim()}|||${next.heading.trim()}`)
                          }
                          return (
                            <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/30 p-4">
                              <div>
                                <p className="text-xs font-extrabold text-indigo-900">List of Headings text fields</p>
                                <p className="mt-0.5 text-[10px] font-medium text-gray-500">Fill the fields serially. They will appear in this same order in the exam.</p>
                              </div>
                              <label className="block space-y-1">
                                <span className="text-[10px] font-bold uppercase text-gray-600">1. Passage instruction</span>
                                <textarea
                                  rows={2}
                                  value={passages[activePassage].instruction || ""}
                                  onChange={(event) => updatePassageField("instruction", event.target.value)}
                                  placeholder={`You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage ${activePassage} on the following pages.`}
                                  className="w-full rounded-lg border border-indigo-100 bg-white px-3 py-2 text-xs font-medium text-black outline-none focus:border-indigo-400"
                                />
                              </label>
                              <label className="block space-y-1">
                                <span className="text-[10px] font-bold uppercase text-gray-600">2. Question range</span>
                                <input
                                  value={parsed.range}
                                  onChange={(event) => updateHeadingInstruction("range", event.target.value)}
                                  placeholder="Questions 14–21"
                                  className="w-full rounded-lg border border-indigo-100 bg-white px-3 py-2 text-xs font-semibold text-black outline-none focus:border-indigo-400"
                                />
                              </label>
                              <label className="block space-y-1">
                                <span className="text-[10px] font-bold uppercase text-gray-600">3. Passage paragraph information</span>
                                <input
                                  value={mhdgIntroText}
                                  onChange={(event) => setMhdgIntroText(event.target.value)}
                                  placeholder={`Reading Passage ${activePassage} has nine paragraphs, A–I.`}
                                  className="w-full rounded-lg border border-indigo-100 bg-white px-3 py-2 text-xs font-semibold text-black outline-none focus:border-indigo-400"
                                />
                              </label>
                              <label className="block space-y-1">
                                <span className="text-[10px] font-bold uppercase text-gray-600">4. Instruction line 1</span>
                                <textarea
                                  rows={2}
                                  value={parsed.inst1}
                                  onChange={(event) => updateHeadingInstruction("inst1", event.target.value)}
                                  placeholder="Choose the correct heading for paragraphs A–E and G–I from the list of headings below."
                                  className="w-full rounded-lg border border-indigo-100 bg-white px-3 py-2 text-xs font-medium italic text-black outline-none focus:border-indigo-400"
                                />
                              </label>
                              <label className="block space-y-1">
                                <span className="text-[10px] font-bold uppercase text-gray-600">5. Instruction line 2</span>
                                <textarea
                                  rows={2}
                                  value={parsed.inst2}
                                  onChange={(event) => updateHeadingInstruction("inst2", event.target.value)}
                                  placeholder="Write the correct number, i–xi, in boxes 14–21 on your answer sheet."
                                  className="w-full rounded-lg border border-indigo-100 bg-white px-3 py-2 text-xs font-medium italic text-black outline-none focus:border-indigo-400"
                                />
                              </label>
                            </div>
                          )
                        })()}
                        {/* Clue Mode Toggle */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-50/50 pb-3">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-gray-800">Student answer style</span>
                            <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">Use “With Clues” for the easy dropdown answer system shown in the exam.</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setMhdgMode("WITHOUT_CLUES")}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-150 ${
                                mhdgMode === "WITHOUT_CLUES"
                                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                  : "bg-slate-50 border-gray-200 text-gray-700 hover:bg-slate-100"
                              }`}
                            >
                              Without Clues
                            </button>
                            <button
                              type="button"
                              onClick={() => setMhdgMode("WITH_CLUES")}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-150 ${
                                mhdgMode === "WITH_CLUES"
                                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
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
                                <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block">Example Paragraph/Section</label>
                                <input
                                  type="text"
                                  value={exampleParagraph}
                                  onChange={(e) => setExampleParagraph(e.target.value)}
                                  placeholder="e.g. Paragraph A"
                                  className="w-full text-xs font-semibold px-3 py-2 border border-gray-200 rounded-lg bg-white text-black focus:outline-none focus:border-indigo-400"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block">Example Correct Heading Answer</label>
                                {groupOptions.trim() ? (
                                  <select
                                    value={exampleAnswer}
                                    onChange={(e) => setExampleAnswer(e.target.value)}
                                    className="w-full text-xs font-semibold px-2 py-2 border border-gray-200 rounded-lg bg-white text-black focus:outline-none focus:border-indigo-400"
                                  >
                                    <option value="">-- Choose Option --</option>
                                    {getListOfHeadingOptions(groupOptions).map((opt, idx) => (
                                      <option key={idx} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    value={exampleAnswer}
                                    onChange={(e) => setExampleAnswer(e.target.value)}
                                    placeholder="e.g. iii"
                                    className="w-full text-xs font-semibold px-3 py-2 border border-gray-200 rounded-lg bg-white text-black focus:outline-none focus:border-indigo-400"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedQuestionType === "R-MINF" && (() => {
                      const parsed = parseGroupInstruction(questionInstruction)
                      const note = (parsed.listItems[0] || "").replace(/^NB\s*/i, "")
                      const updateMatchingInfoInstruction = (
                        field: "range" | "inst1" | "inst2" | "note",
                        value: string
                      ) => {
                        const next = {
                          ...parsed,
                          ...(field === "note" ? {} : { [field]: value }),
                          listItems: field === "note" ? (value.trim() ? [`NB  ${value}`] : []) : parsed.listItems,
                        }
                        setQuestionInstruction(`${next.range.trim()}|||${next.inst1.trim()}|||${next.inst2.trim()}|||${next.heading.trim()}${
                          next.listItems.length ? `|||${next.listItems.join("|||")}` : ""
                        }`)
                      }

                      return (
                        <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/30 p-4">
                          <div>
                            <p className="text-xs font-extrabold text-indigo-900">Matching Information instruction fields</p>
                            <p className="mt-0.5 text-[10px] font-medium text-gray-500">Complete these five fields in the same order as the IELTS question.</p>
                          </div>
                          <label className="block space-y-1">
                            <span className="text-[10px] font-bold uppercase text-gray-600">1. Question range</span>
                            <IeltsHeaderInput
                              value={parsed.range}
                              onChange={(value) => updateMatchingInfoInstruction("range", value)}
                              placeholder="Questions 14–17"
                            />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-[10px] font-bold uppercase text-gray-600">2. Passage paragraph information</span>
                            <IeltsHeaderInput
                              value={passageSegment}
                              onChange={setPassageSegment}
                              placeholder="Reading Passage 2 has six paragraphs, A–F."
                            />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-[10px] font-bold uppercase text-gray-600">3. Question instruction</span>
                            <IeltsHeaderInput
                              value={parsed.inst1}
                              onChange={(value) => updateMatchingInfoInstruction("inst1", value)}
                              placeholder="Which paragraph contains the following information?"
                            />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-[10px] font-bold uppercase text-gray-600">4. Answer-sheet instruction</span>
                            <IeltsHeaderInput
                              value={parsed.inst2}
                              onChange={(value) => updateMatchingInfoInstruction("inst2", value)}
                              placeholder="Write the correct letter, A–F, in boxes 14–17 on your answer sheet."
                            />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-[10px] font-bold uppercase text-gray-600">5. NB note</span>
                            <IeltsHeaderInput
                              value={note}
                              onChange={(value) => updateMatchingInfoInstruction("note", value)}
                              placeholder="You may use any letter more than once."
                            />
                          </label>
                        </div>
                      )
                    })()}

                    {/* Question Reference Image */}
                    <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={qImageInputRef}
                        onChange={(e) => handleImageChange(e, true)}
                        className="hidden" 
                      />
                      {uploadingQImage ? (
                        <div className="flex items-center gap-2">
                          <IconLoader2 size={16} className="text-indigo-600 animate-spin shrink-0" />
                          <span className="text-xs font-semibold text-gray-500">Uploading visual chart...</span>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => qImageInputRef.current?.click()}
                          size="sm"
                          variant="outline"
                          className="font-bold border-gray-200 text-xs shrink-0 text-gray-700"
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
                              className="text-red-500 p-1 hover:bg-transparent"
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
                        <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block">Q# (Optional)</label>
                        <input 
                          type="number" 
                          value={customQuestionNumber}
                          onChange={(e) => setCustomQuestionNumber(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder={String(nextQuestionNumber)}
                          className="w-full text-xs font-bold px-3 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-none focus:border-indigo-400 text-black"
                        />
                      </div>
                      
                      {selectedQuestionType === "R-SCOMP" && (() => {
                        const parsed = parseGroupInstruction(questionInstruction);
                        const selectedType = readingQuestionTypes.find((type) => type.code === selectedQuestionType)?.type;
                        const lastAddedGroup = activePreviewGroups[activePreviewGroups.length - 1];
                        const existingNumbers = lastAddedGroup?.type === selectedType
                          ? lastAddedGroup.questions.map((question) => question.questionNumber)
                          : [];
                        const draftNumbers = draftPreviewGroup?.questions.map((question) => question.questionNumber) || [];
                        const rangeNumbers = [...existingNumbers, ...draftNumbers];
                        const rangeStart = rangeNumbers.length > 0 ? Math.min(...rangeNumbers) : nextQuestionNumber;
                        const rangeEnd = rangeNumbers.length > 0 ? Math.max(...rangeNumbers) : nextQuestionNumber;
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
                                <IeltsHeaderInput
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
                                <IeltsHeaderInput
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
                                <IeltsHeaderInput
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
                                <IeltsHeaderInput
                                  value={parsed.inst3 || ""}
                                  onChange={(val) => updateScompInstruction("inst3", val)}
                                  placeholder={`Write your answers in ${rangeBoxStr} on your answer sheet.`}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {(selectedQuestionType === "R-SCO" || selectedQuestionType === "R-SCWO") && (() => {
                        const parsed = parseGroupInstruction(questionInstruction);
                        const isWithOptions = selectedQuestionType === "R-SCO";
                        const placeholderNums = getPlaceholderNumbers(passageSegment);
                        const existingNumbers = activePreviewGroups
                          .filter((g) => g.type === (isWithOptions ? "SUMMARY_COMPLETION_WITH_OPTIONS" : "SUMMARY_COMPLETION_WITHOUT_OPTIONS"))
                          .flatMap((g) => g.questions.map((q) => q.questionNumber));
                        const draftNumbers = draftPreviewGroup?.questions.map((q) => q.questionNumber) || [];
                        const allRangeNums = Array.from(new Set([...placeholderNums, ...existingNumbers, ...draftNumbers])).sort((a, b) => a - b);
                        const rangeStart = allRangeNums.length > 0 ? Math.min(...allRangeNums) : nextQuestionNumber;
                        const rangeEnd = allRangeNums.length > 0 ? Math.max(...allRangeNums) : nextQuestionNumber;
                        const autoRangeStr = rangeStart === rangeEnd ? `Question ${rangeStart}` : `Questions ${rangeStart}–${rangeEnd}`;
                        const rangeBoxStr = rangeStart === rangeEnd ? `box ${rangeStart}` : `boxes ${rangeStart}–${rangeEnd}`;

                        const currentOpts = groupOptions.split("\n").map((o) => o.trim()).filter(Boolean);
                        const maxLetter = currentOpts.length > 0 ? String.fromCharCode(64 + Math.min(26, currentOpts.length)) : "L";

                        const updateSummaryField = (field: "range" | "inst1" | "inst2" | "inst3" | "heading", val: string) => {
                          const next = { ...parsed, [field]: val };
                          const inst3Part = next.inst3?.trim() ? `|||INST3:${next.inst3.trim()}` : "";
                          const listItemsJoined = (next.listItems || []).join("|||");
                          const serialized = `${next.range.trim()}|||${next.inst1.trim()}|||${next.inst2.trim()}|||${next.heading.trim()}${inst3Part}${
                            listItemsJoined ? "|||" + listItemsJoined : ""
                          }`;
                          setQuestionInstruction(serialized);
                        };

                        const handleAutoFillRange = () => {
                          updateSummaryField("range", autoRangeStr);
                          toast.success(`Question range set to ${autoRangeStr}`);
                        };

                        return (
                          <div className="sm:col-span-3 space-y-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-indigo-100 shadow-sm">
                            <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
                              <div>
                                <span className="text-xs font-black uppercase text-indigo-900 tracking-wider block font-bold">
                                  Summary Completion Configuration (IELTS Standard)
                                </span>
                                <p className="text-[11px] text-gray-500 font-medium">
                                  Configure instructions, summary title, and options box matching authentic official IELTS tests.
                                </p>
                              </div>
                              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                                {isWithOptions ? "With Options (A–L)" : "Without Options"}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* 1. Range */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-black text-gray-600 uppercase">1. Question Range</label>
                                  <button
                                    type="button"
                                    onClick={handleAutoFillRange}
                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                                  >
                                    Auto-fill ({autoRangeStr})
                                  </button>
                                </div>
                                <IeltsHeaderInput
                                  value={parsed.range || autoRangeStr}
                                  onChange={(val) => updateSummaryField("range", val)}
                                  placeholder="e.g. Questions 27–31"
                                />
                              </div>

                              {/* 2. Title */}
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-600 uppercase">2. Summary Title (Centered Heading)</label>
                                <IeltsHeaderInput
                                  value={parsed.heading}
                                  onChange={(val) => updateSummaryField("heading", val)}
                                  placeholder="e.g. The value attached to original works of art"
                                />
                                <p className="text-[9px] text-gray-400 font-medium">Displays centered in bold font right above the summary text.</p>
                              </div>

                              {/* 3. Main Task */}
                              <div className="space-y-1.5 sm:col-span-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-black text-gray-600 uppercase">3. Main Task Instruction (Line 1)</label>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => updateSummaryField("inst1", `Complete the summary using the list of words, A–${maxLetter}, below.`)}
                                      className="text-[10px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                                    >
                                      Preset: A–{maxLetter}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateSummaryField("inst1", "Complete the summary below.")}
                                      className="text-[10px] font-semibold text-gray-500 hover:underline cursor-pointer"
                                    >
                                      Preset: Standard
                                    </button>
                                  </div>
                                </div>
                                <IeltsHeaderInput
                                  value={parsed.inst1}
                                  onChange={(val) => updateSummaryField("inst1", val)}
                                  placeholder={isWithOptions ? `Complete the summary using the list of words, A–${maxLetter}, below.` : "Complete the summary below."}
                                />
                              </div>

                              {/* 4. Rule / Answer sheet line */}
                              <div className="space-y-1.5 sm:col-span-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-black text-gray-600 uppercase">4. Rule / Answer Sheet Instruction (Line 2)</label>
                                  <div className="flex gap-2 flex-wrap">
                                    {isWithOptions ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => updateSummaryField("inst2", `Write the correct letter, A–${maxLetter}, in ${rangeBoxStr} on your answer sheet.`)}
                                          className="text-[10px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                                        >
                                          Preset: Boxes ({rangeBoxStr})
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => updateSummaryField("inst2", `Choose the correct letter, A–${maxLetter}.`)}
                                          className="text-[10px] font-semibold text-gray-500 hover:underline cursor-pointer"
                                        >
                                          Preset: Short
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => updateSummaryField("inst2", "Choose NO MORE THAN TWO WORDS from the passage for each answer.")}
                                          className="text-[10px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                                        >
                                          Preset: Max 2 Words
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => updateSummaryField("inst2", "Choose ONE WORD ONLY from the passage for each answer.")}
                                          className="text-[10px] font-semibold text-gray-500 hover:underline cursor-pointer"
                                        >
                                          Preset: 1 Word
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => updateSummaryField("inst2", "Choose NO MORE THAN THREE WORDS from the passage for each answer.")}
                                          className="text-[10px] font-semibold text-gray-500 hover:underline cursor-pointer"
                                        >
                                          Preset: Max 3 Words
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <IeltsHeaderInput
                                  value={parsed.inst2}
                                  onChange={(val) => updateSummaryField("inst2", val)}
                                  placeholder={isWithOptions ? `Write the correct letter, A–${maxLetter}, in ${rangeBoxStr} on your answer sheet.` : "Choose NO MORE THAN TWO WORDS from the passage for each answer."}
                                />
                              </div>

                              {/* 5. Answer Sheet Instruction (Line 3 - Standard IELTS Format) */}
                              <div className="space-y-1.5 sm:col-span-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-black text-gray-600 uppercase">5. Answer Sheet Box Instruction (Line 3)</label>
                                  <div className="flex gap-2 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => updateSummaryField("inst3", `Write your answers in ${rangeBoxStr} on your answer sheet.`)}
                                      className="text-[10px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                                    >
                                      Preset: Boxes ({rangeBoxStr})
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateSummaryField("inst3", "Write your answers in boxes on your answer sheet.")}
                                      className="text-[10px] font-semibold text-gray-500 hover:underline cursor-pointer"
                                    >
                                      Preset: Standard
                                    </button>
                                  </div>
                                </div>
                                <IeltsHeaderInput
                                  value={parsed.inst3 || ""}
                                  onChange={(val) => updateSummaryField("inst3", val)}
                                  placeholder={`Write your answers in ${rangeBoxStr} on your answer sheet.`}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {(() => {
                        if (selectedQuestionType === "R-MHDG" || selectedQuestionType === "R-MINF" || selectedQuestionType === "R-SCOMP" || selectedQuestionType === "R-SCO" || selectedQuestionType === "R-SCWO") return null;
                        const parsed = parseGroupInstruction(questionInstruction);
                        const selectedType = readingQuestionTypes.find((type) => type.code === selectedQuestionType)?.type;
                        const lastAddedGroup = activePreviewGroups[activePreviewGroups.length - 1];
                        const existingNumbers = lastAddedGroup?.type === selectedType
                          ? lastAddedGroup.questions.map((question) => question.questionNumber)
                          : [];
                        const draftNumbers = draftPreviewGroup?.questions.map((question) => question.questionNumber) || [];
                        const rangeNumbers = [...existingNumbers, ...draftNumbers];
                        const rangeStart = rangeNumbers.length > 0 ? Math.min(...rangeNumbers) : nextQuestionNumber;
                        const rangeEnd = rangeNumbers.length > 0 ? Math.max(...rangeNumbers) : nextQuestionNumber;
                        const automaticRange = rangeStart === rangeEnd
                          ? `Question ${rangeStart}`
                          : `Questions ${rangeStart}–${rangeEnd}`;
                        
                        const updateField = (field: "range" | "inst1" | "inst2" | "inst3" | "heading", val: string) => {
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
                                <IeltsHeaderInput
                                  value={parsed.range || automaticRange}
                                  onChange={(val) => updateField("range", val)}
                                  placeholder="e.g. Questions 1–5"
                                />
                                <p className="text-[9px] font-medium text-gray-400">Auto-generated from question numbers; you can edit it.</p>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-500 uppercase">2. Question Title/Heading (Centered)</label>
                                <IeltsHeaderInput
                                  value={parsed.heading}
                                  onChange={(val) => updateField("heading", val)}
                                  placeholder="e.g. Clean energy solution"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-500 uppercase">3. Instruction Line 1 (Italic)</label>
                                <IeltsHeaderInput
                                  value={parsed.inst1}
                                  onChange={(val) => updateField("inst1", val)}
                                  placeholder="e.g. Choose the correct letter..."
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-500 uppercase">4. Instruction Line 2 (Italic)</label>
                                <IeltsHeaderInput
                                  value={parsed.inst2}
                                  onChange={(val) => updateField("inst2", val)}
                                  placeholder="e.g. Write the correct letter..."
                                />
                              </div>
                              <div className="space-y-1 sm:col-span-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase">5. Instruction Line 3 (Italic - Optional)</label>
                                <IeltsHeaderInput
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
                                  className="text-[9px] font-extrabold uppercase px-2 py-1 rounded bg-indigo-650 text-white hover:bg-indigo-700 transition"
                                >
                                  + Add Instruction Line
                                </button>
                              </div>

                              <div className="space-y-3">
                                {(parsed.listItems || []).map((item, itemIdx) => (
                                  <div key={itemIdx} className="flex gap-2 items-start bg-white p-2.5 rounded-lg border border-indigo-100">
                                    <div className="flex-1 min-w-0">
                                      <IeltsHeaderInput
                                        value={item}
                                        onChange={(val) => handleUpdateListItem(itemIdx, val)}
                                        placeholder="e.g. TRUE  if the statement agrees with the information"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveListItem(itemIdx)}
                                      className="text-[10px] font-bold text-red-500 hover:text-red-700 px-2 py-2 mt-7 shrink-0"
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
                        <FormatToolbar 
                          inputRef={groupOptionsRef}
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
                        {selectedQuestionType === "R-MINF" && (
                          <div className="flex flex-wrap items-center gap-2 pb-1">
                            <span className="text-[10px] font-semibold text-gray-500">Quick options:</span>
                            {["F", "G", "H", "I"].map((lastLetter) => (
                              <button
                                key={lastLetter}
                                type="button"
                                onClick={() => {
                                  const count = lastLetter.charCodeAt(0) - 64
                                  setGroupOptions(Array.from({ length: count }, (_, index) => String.fromCharCode(65 + index)).join("\n"))
                                }}
                                className="rounded border border-indigo-200 bg-white px-2 py-1 text-[10px] font-bold text-indigo-700 hover:bg-indigo-50"
                              >
                                A–{lastLetter}
                              </button>
                            ))}
                          </div>
                        )}
                        {selectedQuestionType === "R-SCO" && (
                          <div className="flex flex-wrap items-center gap-2 pb-1">
                            <span className="text-[10px] font-semibold text-gray-500">Quick Helpers:</span>
                            <button
                              type="button"
                              onClick={() => {
                                const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"];
                                const currentLines = groupOptions.split("\n").map(l => l.trim().replace(/^[A-Z][\s.:-]+/, "")).filter(Boolean);
                                if (currentLines.length > 0) {
                                  setGroupOptions(currentLines.map((word, i) => `${letters[i] || String.fromCharCode(65 + i)}  ${word}`).join("\n"));
                                } else {
                                  setGroupOptions(letters.slice(0, 12).map(l => `${l}  option text`).join("\n"));
                                }
                              }}
                              className="rounded border border-indigo-200 bg-white px-2 py-1 text-[10px] font-bold text-indigo-700 hover:bg-indigo-50"
                            >
                              Auto-Format Letters (A–L)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setGroupOptions([
                                  "A  institution",
                                  "B  mass production",
                                  "C  mechanical processes",
                                  "D  public",
                                  "E  paints",
                                  "F  artist",
                                  "G  size",
                                  "H  underlying ideas",
                                  "I  basic technology",
                                  "J  readers",
                                  "K  picture frames",
                                  "L  assistants"
                                ].join("\n"));
                              }}
                              className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100"
                            >
                              Load Image Sample Words (A–L)
                            </button>
                          </div>
                        )}
                        {selectedQuestionType === "R-MSE" && (
                          <div className="flex flex-wrap items-center gap-2 pb-1">
                            <span className="text-[10px] font-semibold text-gray-500">Ready template:</span>
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
                          </div>
                        )}
                        <textarea 
                          ref={groupOptionsRef}
                          rows={4}
                          value={groupOptions}
                          onChange={(e) => setGroupOptions(e.target.value)}
                          placeholder={
                            selectedQuestionType === "R-SCO"
                              ? `e.g.\nA  constant conflict\nB  additional evidence\nC  different locations\nD  experimental subjects`
                              : selectedQuestionType === "R-MHDG"
                              ? `A fresh and important long-term goal\nCharging for roads and improving transport\nChanges affecting how goods are transported`
                            : selectedQuestionType === "R-NMATCH"
                              ? `A  Freeman\nB  Shore and Kanevsky\nC  Elshout\nD  Simonton\nE  Boekaerts`
                              : selectedQuestionType === "R-MSE"
                              ? `A  first possible ending.\nB  second possible ending.\nC  third possible ending.`
                              : `e.g.\nA  Option one\nB  Option two\nC  Option three`
                          } 
                          className="w-full text-xs font-semibold px-3.5 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-none focus:border-indigo-400 text-black placeholder:text-gray-400 resize-none font-mono"
                          required
                        />
                        {selectedQuestionType === "R-MHDG" ? (
                          <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
                            <p className="text-[10px] font-semibold text-indigo-700">
                              Write one heading per line. Roman numbers are added automatically.
                            </p>
                            {getListOfHeadingOptions(groupOptions).length > 0 && (
                              <div className="mt-2 space-y-1 rounded-md border border-gray-200 bg-white p-2.5">
                                <p className="mb-1 text-center text-[11px] font-extrabold text-gray-800">List of Headings</p>
                                {getListOfHeadingOptions(groupOptions).map((heading, index) => (
                                  <p key={`${heading}-${index}`} className="text-xs font-medium text-gray-700">{heading}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-400 font-semibold">Enter one option per line for the student dropdown.</p>
                        )}
                      </div>
                    )}

                    {/* Conditional input: Table / Flow-chart / Notes / Summary Template */}
                    {["R-TABLE", "R-FLOW", "R-NCOMP", "R-SCO", "R-SCWO"].includes(selectedQuestionType) && (
                      <div className="space-y-1">
                        {selectedQuestionType === "R-TABLE" ? (
                          <>
                            <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block font-bold mb-1">
                              Table Template Editor <span className="text-rose-500">*</span>
                            </label>
                            <VisualTableBuilder 
                              value={passageSegment} 
                              onChange={(val) => setPassageSegment(val)} 
                            />
                            {getPlaceholderNumbers(passageSegment).length > 0 && (
                              <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
                                <p className="mb-2 text-[11px] font-bold text-indigo-800">
                                  Answers for table blanks
                                </p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  {getPlaceholderNumbers(passageSegment).map((questionNumber) => {
                                    const savedAnswer = compiledQuestions.find(
                                      (question) => question.passageIndex === activePassage && question.questionNumber === questionNumber
                                    )?.correctAnswer ?? "";
                                    return (
                                      <label key={questionNumber} className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-white p-2">
                                        <span className="flex h-6 w-8 shrink-0 items-center justify-center rounded bg-indigo-100 text-[11px] font-black text-indigo-700">
                                          {questionNumber}
                                        </span>
                                        <input
                                          type="text"
                                          value={tableAnswers[questionNumber] ?? savedAnswer}
                                          onChange={(event) => setTableAnswers((current) => ({
                                            ...current,
                                            [questionNumber]: event.target.value,
                                          }))}
                                          placeholder={`Answer for question ${questionNumber}`}
                                          className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-black outline-none"
                                        />
                                      </label>
                                    );
                                  })}
                                </div>
                                <p className="mt-2 text-[10px] font-medium text-gray-500">
                                  Fill these fields, then click Save Table Answers once.
                                </p>
                              </div>
                            )}
                          </>
                        ) : selectedQuestionType === "R-NCOMP" ? (
                          <>
                            <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block font-bold mb-1">
                              Notes Completion Editor <span className="text-rose-500">*</span>
                            </label>
                            <VisualNotesBuilder
                              value={passageSegment}
                              onChange={(val) => setPassageSegment(val)}
                              questions={
                                (() => {
                                  const existing = compiledQuestions
                                    .filter(q => q.passageIndex === activePassage && q.typeCode === "R-NCOMP")
                                    .map(q => q.questionNumber);
                                  const nextQNum = Number(customQuestionNumber) || nextQuestionNumber;
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
                                    const savedAnswer = compiledQuestions.find(
                                      (question) => question.passageIndex === activePassage && question.questionNumber === questionNumber
                                    )?.correctAnswer ?? "";
                                    return (
                                      <label key={questionNumber} className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-white p-2.5 shadow-sm">
                                        <span className="flex h-7 w-9 shrink-0 items-center justify-center rounded-md bg-indigo-700 text-xs font-black text-white">
                                          {questionNumber}
                                        </span>
                                        <input
                                          type="text"
                                          value={summaryAnswers[questionNumber] ?? savedAnswer}
                                          onChange={(event) => setSummaryAnswers((current) => ({ ...current, [questionNumber]: event.target.value }))}
                                          placeholder={`Answer for [${questionNumber}]`}
                                          className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-black outline-none"
                                        />
                                      </label>
                                    );
                                  })}
                                </div>
                                <p className="mt-3 text-[10px] font-medium text-indigo-800">Fill every box, then use the single Save Note Answers button below.</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <FormatToolbar 
                              inputRef={passageSegmentRef}
                              value={passageSegment}
                              onChange={setPassageSegment}
                              label={["R-SCO", "R-SCWO"].includes(selectedQuestionType) ? "Summary Passage Template (with [27], [28] blanks)" : "Paragraph / Outline Template"}
                            />
                            {["R-SCO", "R-SCWO"].includes(selectedQuestionType) && (
                              <div className="flex flex-wrap items-center gap-2 pb-1.5 pt-1">
                                <span className="text-[10px] font-semibold text-gray-500">Quick Actions:</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextNum = Number(customQuestionNumber) || nextQuestionNumber;
                                    const existingPlaceholders = getPlaceholderNumbers(passageSegment);
                                    const targetNum = existingPlaceholders.length > 0 ? Math.max(...existingPlaceholders) + 1 : nextNum;
                                    setPassageSegment((curr) => curr ? `${curr} [${targetNum}]` : `[${targetNum}]`);
                                  }}
                                  className="rounded border border-indigo-200 bg-white px-2.5 py-1 text-[10px] font-bold text-indigo-700 hover:bg-indigo-50"
                                >
                                  + Insert Next Blank [{(() => {
                                    const existing = getPlaceholderNumbers(passageSegment);
                                    const nextNum = Number(customQuestionNumber) || nextQuestionNumber;
                                    return existing.length > 0 ? Math.max(...existing) + 1 : nextNum;
                                  })()}]
                                </button>
                                {selectedQuestionType === "R-SCWO" ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPassageSegment(
                                        "Psychologists have traditionally believed that a personality [14] was impossible and that by a [15] , a person's character tends to be fixed. This is not true according to positive psychologists, who say that our personal qualities can be seen as habitual behaviour. One of the easiest qualities to acquire is [16] . However, regardless of the quality, it is necessary to learn a wide variety of different [17] in order for a new quality to develop; for example, a person must understand and feel some [18] in order to increase their happiness."
                                      );
                                      setGroupOptions("");
                                      setQuestionInstruction("|||Complete the summary below.|||Choose NO MORE THAN TWO WORDS from the passage for each answer.||||||INST3:Write your answers in boxes 14–18 on your answer sheet.");
                                      setSummaryAnswers({
                                        14: "transformation",
                                        15: "young age",
                                        16: "optimism",
                                        17: "skills",
                                        18: "negative emotions",
                                      });
                                      setCustomQuestionNumber(14);
                                      toast.success("Loaded image sample: Positive Psychology (Q14–18)!");
                                    }}
                                    className="rounded border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-900 hover:bg-indigo-100 flex items-center gap-1 cursor-pointer"
                                  >
                                    ✨ Load Sample: Positive Psychology (Q14–18)
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPassageSegment(
                                        "People go to art museums because they accept the value of seeing an original work of art. But they do not go to museums to read original manuscripts of novels, perhaps because the availability of novels has depended on [27] for so long, and also because with novels, the [28] are the most important thing.\n\n" +
                                        "However, in historical times artists such as Leonardo were happy to instruct [29] to produce copies of their work and these days new methods of reproduction allow excellent replication of surface relief features as well as colour and [30].\n\n" +
                                        "It is regrettable that museums still promote the superiority of original works of art, since this may not be in the interests of the [31]."
                                      );
                                      setGroupOptions([
                                        "A  institution",
                                        "B  mass production",
                                        "C  mechanical processes",
                                        "D  public",
                                        "E  paints",
                                        "F  artist",
                                        "G  size",
                                        "H  underlying ideas",
                                        "I  basic technology",
                                        "J  readers",
                                        "K  picture frames",
                                        "L  assistants"
                                      ].join("\n"));
                                      setQuestionInstruction("Questions 27–31|||Complete the summary using the list of words, A–L, below.|||Write the correct letter, A–L, in boxes 27–31 on your answer sheet.|||The value attached to original works of art");
                                      setSummaryAnswers({
                                        27: "B",
                                        28: "H",
                                        29: "L",
                                        30: "G",
                                        31: "D",
                                      });
                                      setCustomQuestionNumber(27);
                                      toast.success("Loaded image sample (The value attached to original works of art)!");
                                    }}
                                    className="rounded border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-900 hover:bg-indigo-100 flex items-center gap-1 cursor-pointer"
                                  >
                                    ✨ Load Sample: Original Works of Art (Q27–31)
                                  </button>
                                )}
                              </div>
                            )}
                            <textarea 
                              ref={passageSegmentRef}
                              rows={["R-SCO", "R-SCWO"].includes(selectedQuestionType) ? 7 : 5}
                              value={passageSegment}
                              onChange={(e) => setPassageSegment(e.target.value)}
                              placeholder={
                                selectedQuestionType === "R-FLOW"
                                  ? "Step 1: Process begins\n↓\nStep 2: Temperature rises to [10]\n↓\nStep 3: Output details [11]"
                                  : selectedQuestionType === "R-SCO"
                                  ? "The value attached to original works of art\n\nPeople go to art museums because they accept the value of seeing an original work of art. But they do not go to museums to read original manuscripts of novels, perhaps because the availability of novels has depended on [27] for so long, and also because with novels, the [28] are the most important thing..."
                                  : "Write summary text or bulleted notes. Place [1], [2], etc., where blanks should appear."
                              }
                              className="w-full text-xs font-semibold px-3.5 py-2.5 border border-indigo-100 rounded-lg bg-white focus:outline-none focus:border-indigo-400 text-black placeholder:text-gray-400 font-mono resize-y"
                              required
                            />
                            {["R-SCO", "R-SCWO", "R-NCOMP"].includes(selectedQuestionType) && getPlaceholderNumbers(passageSegment).length > 0 && (
                              <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider">
                                    Answers for {selectedQuestionType === "R-NCOMP" ? "Note" : "Summary"} Blanks ({getPlaceholderNumbers(passageSegment).length} Questions)
                                  </span>
                                  <span className="text-[10px] font-bold text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded-full shadow-2xs">
                                    IELTS Questions {getPlaceholderNumbers(passageSegment).join(", ")}
                                  </span>
                                </div>
                                <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                                  {getPlaceholderNumbers(passageSegment).map((questionNumber) => {
                                    const savedAnswer = compiledQuestions.find(
                                      (question) => question.passageIndex === activePassage && question.questionNumber === questionNumber
                                    )?.correctAnswer ?? "";
                                    const currentVal = summaryAnswers[questionNumber] ?? savedAnswer;
                                    const parsedOptions = groupOptions.split("\n").map(l => l.trim()).filter(Boolean);
                                    return (
                                      <label key={questionNumber} className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-white p-2 shadow-2xs">
                                        <span className="flex h-6 w-9 shrink-0 items-center justify-center rounded bg-indigo-650 text-[11px] font-black text-white">
                                          {questionNumber}
                                        </span>
                                        {selectedQuestionType === "R-SCO" && parsedOptions.length > 0 ? (
                                          <select
                                            value={currentVal}
                                            onChange={(e) => setSummaryAnswers(curr => ({ ...curr, [questionNumber]: e.target.value }))}
                                            className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-black outline-none cursor-pointer"
                                          >
                                            <option value="">-- Select Answer --</option>
                                            {parsedOptions.map((opt, oIdx) => {
                                              const optMatch = opt.match(/^([A-Z])[\s.:-]+(.*)$/);
                                              const letter = optMatch ? optMatch[1] : String.fromCharCode(65 + oIdx);
                                              const text = optMatch ? optMatch[2].trim() : opt;
                                              return (
                                                <option key={`${questionNumber}-${letter}`} value={letter}>
                                                  {letter} — {text}
                                                </option>
                                              );
                                            })}
                                          </select>
                                        ) : (
                                          <input
                                            type="text"
                                            value={currentVal}
                                            onChange={(e) => setSummaryAnswers(curr => ({ ...curr, [questionNumber]: e.target.value }))}
                                            placeholder={`Answer for [${questionNumber}]`}
                                            className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-black outline-none"
                                          />
                                        )}
                                      </label>
                                    );
                                  })}
                                </div>
                                <p className="text-[10px] text-gray-500 font-medium">
                                  Select or enter the correct letter/word for each blank above. All questions will be saved together automatically.
                                </p>
                              </div>
                            )}
                          </>
                        )}
                        <p className="text-[10px] text-gray-400 font-semibold">Define the text or table content. Put placeholders like <strong className="text-indigo-600">[9]</strong> inside cells or text to render dynamic student input fields.</p>
                      </div>
                    )}

                    {/* Question Text */}
                    <div className="space-y-1">
                      <FormatToolbar 
                        inputRef={questionTextRef}
                        value={questionText}
                        onChange={setQuestionText}
                        label={selectedQuestionType === "R-MHDG" ? "Paragraph/Section Reference" : "Question Text Prompt / Template"}
                      />
                      <textarea 
                        ref={questionTextRef}
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
                        className="w-full text-xs font-semibold px-3.5 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-none focus:border-indigo-400 text-black placeholder:text-gray-400 resize-none"
                      />
                      {["R-SCOMP", "R-SCO", "R-SCWO", "R-NCOMP", "R-FLOW", "R-DIAG"].includes(selectedQuestionType) && (
                        <p className="text-[10px] text-gray-400 font-semibold">Note: Write double underscores (____) to represent blanks inline if not using a template paragraph.</p>
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
                        <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block">Multiple Choice Options</label>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <FormatInput 
                            inputRef={mcqOptARef}
                            value={mcqOptA}
                            onChange={setMcqOptA}
                            placeholder="Option A text"
                            required
                          />
                          <FormatInput 
                            inputRef={mcqOptBRef}
                            value={mcqOptB}
                            onChange={setMcqOptB}
                            placeholder="Option B text"
                            required
                          />
                          <FormatInput 
                            inputRef={mcqOptCRef}
                            value={mcqOptC}
                            onChange={setMcqOptC}
                            placeholder="Option C text"
                            required
                          />
                          <FormatInput 
                            inputRef={mcqOptDRef}
                            value={mcqOptD}
                            onChange={setMcqOptD}
                            placeholder="Option D text"
                            required
                          />
                          <FormatInput 
                            inputRef={mcqOptERef}
                            value={mcqOptE}
                            onChange={setMcqOptE}
                            placeholder="Option E text (Optional)"
                          />
                          <FormatInput 
                            inputRef={mcqOptFRef}
                            value={mcqOptF}
                            onChange={setMcqOptF}
                            placeholder="Option F text (Optional)"
                          />
                          <FormatInput 
                            inputRef={mcqOptGRef}
                            value={mcqOptG}
                            onChange={setMcqOptG}
                            placeholder="Option G text (Optional)"
                          />
                        </div>
                      </div>
                    )}

                    {/* Correct Answer & Explanation */}
                    {selectedQuestionType !== "R-TABLE" && !( ["R-SCO", "R-SCWO", "R-NCOMP"].includes(selectedQuestionType) && getPlaceholderNumbers(passageSegment).length > 0 ) && (
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
                              <FormatInput 
                                inputRef={answerInputRef}
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
                                className={`w-full text-xs font-semibold px-3 py-2 border rounded-lg bg-white focus:outline-none focus:border-indigo-400 text-black placeholder:text-gray-400 transition-colors ${
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
                                className={`w-full text-xs font-semibold px-3 py-2 border rounded-lg bg-white focus:outline-none focus:border-indigo-400 text-black placeholder:text-gray-400 transition-colors ${
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
                            const deduped = getDeduplicatedAnswers(correctAnswer, scompAltAnswer1, scompAltAnswer2);
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
                            <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block">Answer Explanation (Optional)</label>
                            <FormatInput 
                              inputRef={explanationRef}
                              value={questionExplanation}
                              onChange={setQuestionExplanation}
                              placeholder="e.g. Para 3 mentions stepwells provided shade during dry seasons."
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block font-bold">
                              {selectedQuestionType === "R-MHDG" ? "Correct Heading" : "Correct Answer Value"} <span className="text-rose-500">*</span>
                            </label>
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
                                  className="w-full text-xs font-semibold px-2 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-none text-black"
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
                                className="w-full text-xs font-semibold px-2 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-none text-black"
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
                                className="w-full text-xs font-semibold px-2 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-none text-black"
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
                                className="w-full text-xs font-semibold px-2 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-none text-black"
                                required
                              >
                                <option value="">-- Select Option --</option>
                                {(selectedQuestionType === "R-MHDG"
                                  ? getListOfHeadingOptions(groupOptions)
                                  : groupOptions.split("\n").map(o => o.trim()).filter(Boolean)
                                ).map((opt, idx) => (
                                  <option key={idx} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <FormatInput 
                                inputRef={answerInputRef}
                                value={correctAnswer}
                                onChange={setCorrectAnswer}
                                placeholder="e.g. shade / 1990s"
                                required
                              />
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block">Answer Explanation (Optional)</label>
                            <FormatInput 
                              inputRef={explanationRef}
                              value={questionExplanation}
                              onChange={setQuestionExplanation}
                              placeholder="e.g. Para 3 mentions stepwells provided shade during dry seasons."
                            />
                          </div>
                        </div>
                      )
                    )}

                    {["R-SCO", "R-SCWO", "R-NCOMP"].includes(selectedQuestionType) && getPlaceholderNumbers(passageSegment).length > 0 && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-black">✓</span>
                            <span>{getPlaceholderNumbers(passageSegment).length} {selectedQuestionType === "R-NCOMP" ? "Note" : "Summary"} Blanks Ready</span>
                          </p>
                          <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                            Answers for Questions {getPlaceholderNumbers(passageSegment).join(", ")} are mapped above. Click below to save all blanks at once.
                          </p>
                        </div>
                        <span className="text-[10px] font-extrabold px-3 py-1 bg-emerald-600 text-white rounded-lg uppercase tracking-wider">
                          Ready
                        </span>
                      </div>
                    )}

                    <Button 
                      type="submit"
                      formNoValidate
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold transition-all duration-200 shadow-md shadow-violet-100 flex items-center justify-center gap-2 py-2 rounded-lg text-xs"
                    >
                      <IconPlus size={16} /> {selectedQuestionType === "R-TABLE"
                        ? "Save Table Answers"
                        : ["R-SCO", "R-SCWO", "R-NCOMP"].includes(selectedQuestionType) && getPlaceholderNumbers(passageSegment).length > 0
                        ? `Save ${selectedQuestionType === "R-NCOMP" ? "Note" : "Summary"} Answers (${getPlaceholderNumbers(passageSegment).length} Blanks)`
                        : selectedQuestionType === "R-MHDG"
                        ? "Add Paragraph & Correct Answer"
                        : `Append to Passage ${activePassage} Questions`}
                    </Button>

                    {draftPreviewGroup && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 md:p-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-[#1B3A6B]">
                              <IconEye size={15} /> Next Question Live Preview
                            </p>
                            <p className="mt-1 text-[10px] text-gray-500">The current draft updates here before you append it.</p>
                          </div>
                          <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-bold text-gray-600">
                            {readingQuestionTypes.find((type) => type.code === selectedQuestionType)?.title || draftPreviewGroup.type}
                          </span>
                        </div>
                        <div className="min-h-32 overflow-x-auto rounded-xl border border-gray-200 bg-white p-4 md:p-6">
                          <QuestionRenderer
                            group={draftPreviewGroup}
                            answers={{}}
                            onAnswer={() => undefined}
                          />
                        </div>
                      </div>
                    )}

                  </form>
                ) : (
                  <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <p className="text-xs text-gray-500 font-semibold">Select a standardized IELTS question pattern above to add to Passage {activePassage}.</p>
                  </div>
                )}

                {activePreviewGroups.length > 0 && (
                  <div className="mt-8 overflow-hidden rounded-2xl border border-slate-300 bg-slate-100 p-5 md:p-7">
                    <div className="mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-800">
                      <IconEye size={17} /> Passage {activePassage} Final Student Preview
                    </div>
                    <div className="overflow-hidden border border-slate-300 bg-white font-[Arial,sans-serif] text-black">
                      <div className="border-b border-gray-300 bg-slate-50 px-5 py-3 text-sm font-bold uppercase tracking-wide">
                        <span>Complete Reading Student View</span>
                        <span className="ml-5 italic normal-case text-gray-600">
                          Passage {activePassage} · {activePreviewGroups.flatMap((group) => group.questions).length} questions
                        </span>
                      </div>
                      <div>
                        <div>
                          <ReadingPassagePreview passageNumber={activePassage} passage={passages[activePassage]} />
                        </div>
                        <div className="p-5 md:p-7">
                          <div className="space-y-8">
                            {activePreviewGroups.map((group) => (
                              <div key={group.id} className="border-b border-gray-200 pb-8 last:border-b-0 last:pb-0">
                                <QuestionRenderer group={group} answers={{}} onAnswer={() => undefined} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>

          </div>

          {/* Right Columns (4): 40 Questions Tracker & Passages Preview */}
          {!embedded && <div className="space-y-6 lg:col-span-1">

            {/* Real 40 Questions Tracker Card */}
            <Card className="relative overflow-hidden rounded-2xl border-gray-200 bg-white shadow-sm lg:sticky lg:top-4">
              <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-50/40 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
              
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="font-bold text-black text-base flex items-center justify-between">
                  <span>IELTS Exam Overview</span>
                  <span className="text-[10px] font-black tracking-widest uppercase bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                    {compiledQuestions.length} / 40 Qs
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-gray-400 font-medium">Monitoring standard IELTS Academic questions counts across the 3 passages.</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-4">
                
                {/* IELTS Questions Progress Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-gray-500">IELTS Target Limit</span>
                    <span className="text-indigo-600 font-black">{Math.round((compiledQuestions.length / 40) * 100)}% Complete</span>
                  </div>
                  <Progress 
                    value={Math.min((compiledQuestions.length / 40) * 100, 100)} 
                    className="h-2 bg-gray-100 [&>div]:bg-indigo-600 shadow-inner"
                  />
                  {compiledQuestions.length !== 40 && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg border border-amber-100 mt-1 animate-pulse">
                      <IconInfoCircle size={14} className="shrink-0" />
                      <span>Note: IELTS Academic standard expects exactly 40 questions.</span>
                    </div>
                  )}
                </div>

                {/* Collapsible Passages Summary & Questions list */}
                <div className="space-y-4">
                  
                  {([1, 2, 3] as const).slice(0, passageCount).map((passIdx) => {
                    const passQs = compiledQuestions.filter(q => q.passageIndex === passIdx)
                    const title = passages[passIdx].title || `Passage ${passIdx} Title (Not Drafted)`
                    const isDrafted = passages[passIdx].title !== ''
                    
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
                          <span className="text-[10px] font-black bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full shrink-0">
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
                                    <p className="font-extrabold text-[10px] text-gray-900 truncate leading-snug">{q.text || `Table Completion Group`}</p>
                                    <p className="text-[8px] font-bold text-gray-400 mt-0.2">Type: {q.type.split("Questions")[0]} • Ans: {q.correctAnswer}</p>
                                  </div>
                                </div>
                                <Button 
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-500 p-0.5 opacity-0 group-hover:opacity-100 hover:bg-transparent h-5 w-5 transition-opacity"
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
                    )
                  })}

                </div>

                {/* Final Mock Paper Submit */}
                <div className="mt-5 space-y-2">
                  <Button 
                    onClick={handlePublishPaper}
                    disabled={isPublishing}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold transition-all duration-200 shadow-md shadow-indigo-100 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm cursor-pointer"
                  >
                    {isPublishing ? (
                      <IconLoader2 size={16} className="animate-spin" />
                    ) : (
                      <IconSparkles size={16} />
                    )}
                    {embedded ? "Use in Full Mock" : "Publish Complete Mock"}
                  </Button>
                </div>

              </CardContent>
            </Card>

            {/* IELTS Reading Module Rules Panel */}
            <Card className="bg-gradient-to-tr from-indigo-950 to-indigo-900 border-none shadow-md text-white">
              <CardHeader className="pb-2">
                <CardTitle className="font-bold text-sm tracking-wider uppercase text-indigo-300 flex items-center gap-1.5">
                  Reading Exam Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-3 leading-relaxed">
                <div className="border-l-2 border-indigo-500 pl-3">
                  <span className="font-bold text-indigo-200">Standard Sections:</span> An official Reading paper has precisely 3 sections corresponding to Passage 1, Passage 2, and Passage 3.
                </div>
                <div className="border-l-2 border-indigo-500 pl-3">
                  <span className="font-bold text-indigo-200">Question Limits:</span> Passages typically divide the 40 questions as: Passage 1 (13), Passage 2 (13), Passage 3 (14).
                </div>
                <div className="border-l-2 border-indigo-500 pl-3">
                  <span className="font-bold text-indigo-200">Authentic Uploads:</span> Attaching graphs or process diagrams is essential for academic information-matching and diagram-labeling questions.
                </div>
              </CardContent>
            </Card>

          </div>}

        </div>
      </div>
  )
}

export function ReadingCreatorWorkspace(props: ReadingCreatorWorkspaceProps = {}) {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
        <IconLoader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-sm font-semibold text-gray-500">Loading Exam Workspace...</p>
      </div>
    }>
      <TeacherDashboardContent {...props} />
    </Suspense>
  )
}

export default function TeacherDashboard() {
  return <ReadingCreatorWorkspace />
}
