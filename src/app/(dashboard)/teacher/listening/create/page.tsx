/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { listeningService } from "@/services/listening.services";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconPlus,
  IconTrash,
  IconUpload,
  IconLoader2,
  IconFileMusic,
  IconBrandYoutube,
  IconArticle,
  IconCheck,
  IconInfoCircle,
  IconBold,
  IconItalic,
  IconUnderline,
  IconPalette,
  IconTable,
  IconPhoto,
  IconEye,
} from "@tabler/icons-react";
import VisualNotesBuilder from "@/components/shared/VisualNotesBuilder";
import VisualTableBuilder from "@/components/shared/VisualTableBuilder";
import { parseBoldText } from "@/lib/utils";
import { ListeningQuestionRenderer } from "@/components/Listening/ListeningQuestionRenderer";
import type { IListeningQuestionGroup } from "@/types/listening.types";
import { FloatingSelectionToolbar } from "@/components/shared/FloatingSelectionToolbar";

// List of all IELTS question types supported
const QUESTION_GROUP_TYPES = [
  { value: "SENTENCE_COMPLETION", label: "Sentence Completion" },
  { value: "MULTIPLE_CHOICE", label: "Single MCQ (One Correct Answer)" },
  { value: "MULTIPLE_CHOICE_MULTIPLE", label: "Double MCQ (Choose Two Answers)" },
  { value: "MATCHING_FEATURES", label: "Matching Features (A–G List)" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "TABLE_COMPLETION", label: "Table Completion" },
  { value: "FLOW_CHART_COMPLETION", label: "Flow Chart Completion" },
  { value: "DIAGRAM_LABELLING", label: "Diagram / Map Labelling" },
  { value: "SUMMARY_COMPLETION", label: "Summary Completion" },
  { value: "NOTES_COMPLETION", label: "Notes Completion" },
];

const LISTENING_CREATOR_DRAFT_KEY = "ielts-listening-creator-draft-v1";
const DIAGRAM_LABEL_OPTIONS = ["A", "B", "C", "D", "E", "F", "G"];

const getQuestionTypeTheme = (type: string) => {
  if (type === "NOTES_COMPLETION") return { accent: "border-l-emerald-500", surface: "bg-emerald-50/40", badge: "border-emerald-200 bg-emerald-100 text-emerald-800", select: "border-emerald-300 focus:border-emerald-600" };
  if (type === "TABLE_COMPLETION") return { accent: "border-l-violet-500", surface: "bg-violet-50/40", badge: "border-violet-200 bg-violet-100 text-violet-800", select: "border-violet-300 focus:border-violet-600" };
  if (type === "MULTIPLE_CHOICE") return { accent: "border-l-blue-500", surface: "bg-blue-50/40", badge: "border-blue-200 bg-blue-100 text-blue-800", select: "border-blue-300 focus:border-blue-600" };
  if (type === "MULTIPLE_CHOICE_MULTIPLE") return { accent: "border-l-amber-500", surface: "bg-amber-50/40", badge: "border-amber-200 bg-amber-100 text-amber-800", select: "border-amber-300 focus:border-amber-600" };
  if (type === "MATCHING_FEATURES") return { accent: "border-l-cyan-500", surface: "bg-cyan-50/40", badge: "border-cyan-200 bg-cyan-100 text-cyan-800", select: "border-cyan-300 focus:border-cyan-600" };
  if (type === "FLOW_CHART_COMPLETION" || type === "DIAGRAM_LABELLING") return { accent: "border-l-rose-500", surface: "bg-rose-50/40", badge: "border-rose-200 bg-rose-100 text-rose-800", select: "border-rose-300 focus:border-rose-600" };
  return { accent: "border-l-slate-500", surface: "bg-slate-50/50", badge: "border-slate-200 bg-slate-100 text-slate-800", select: "border-slate-300 focus:border-slate-600" };
};

interface Question {
  questionNumber: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface QuestionGroup {
  type: string;
  instruction: string;
  passageSegment: string;
  options: string[];
  imageUrl: string;
  order: number;
  questions: Question[];
}

interface Section {
  title: string;
  audioUrl: string;
  youtubeUrl: string;
  script: string;
  instruction: string;
  order: number;
  questionGroups: QuestionGroup[];
}

interface ExamForm {
  title: string;
  description: string;
  duration: number;
  isPublished: boolean;
  audioUrl: string;
  youtubeUrl: string;
  sections: Section[];
}

function createPreviewGroup(
  group: QuestionGroup,
  sectionIndex: number,
  groupIndex: number,
): IListeningQuestionGroup {
  const previewGroupId = `preview-group-${sectionIndex}-${groupIndex}`;
  const referencedQuestionNumbers = Array.from(new Set(
    Array.from(group.passageSegment.matchAll(/\[(\d+)\]/g), (match) => Number(match[1])),
  )).sort((a, b) => a - b);
  const previewQuestions = group.questions.map((question, questionIndex) => ({
    id: `preview-question-${sectionIndex}-${groupIndex}-${questionIndex}`,
    groupId: previewGroupId,
    questionNumber: question.questionNumber,
    questionText: question.questionText,
    options: question.options,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
  }));

  referencedQuestionNumbers.forEach((questionNumber) => {
    if (!previewQuestions.some((question) => question.questionNumber === questionNumber)) {
      previewQuestions.push({
        id: `preview-question-${sectionIndex}-${groupIndex}-${questionNumber}`,
        groupId: previewGroupId,
        questionNumber,
        questionText: "",
        options: [],
        correctAnswer: "",
        explanation: "",
      });
    }
  });

  return {
    id: previewGroupId,
    sectionId: `preview-section-${sectionIndex}`,
    type: group.type as IListeningQuestionGroup["type"],
    instruction: group.instruction,
    passageSegment: group.passageSegment,
    options: group.options,
    imageUrl: group.imageUrl,
    order: group.order,
    questions: previewQuestions.sort((a, b) => a.questionNumber - b.questionNumber),
  };
}

const getBlankSectionState = (order: number, title: string, prePopulate = false): Section => {
  const startQNum = (order - 1) * 10 + 1;
  return {
    title,
    audioUrl: "",
    youtubeUrl: "",
    script: "",
    instruction: "",
    order,
    questionGroups: prePopulate
      ? [
          {
            type: "SENTENCE_COMPLETION",
            instruction: "Write NO MORE THAN TWO WORDS for each answer.",
            passageSegment: "",
            options: [],
            imageUrl: "",
            order: 1,
            questions: Array.from({ length: 10 }, (_, idx) => ({
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

const getSectionQuestionRange = (sectionIndex: number) => ({
  start: sectionIndex * 10 + 1,
  end: sectionIndex * 10 + 10,
});

const getDefaultPartLabel = (sectionIndex: number) => {
  const range = getSectionQuestionRange(sectionIndex);
  return `Part ${sectionIndex + 1}: Q${range.start}–Q${range.end}`;
};

const getEmptyExamForm = (): ExamForm => ({
  title: "Cambridge IELTS Academic Listening Practice Test 1",
  description: "A Cambridge IELTS-style Listening test with four sections and realistic question types for computer-based practice.",
  duration: 30,
  isPublished: false,
  audioUrl: "",
  youtubeUrl: "",
  sections: [
    getBlankSectionState(1, getDefaultPartLabel(0), true),
    getBlankSectionState(2, getDefaultPartLabel(1), true),
    getBlankSectionState(3, getDefaultPartLabel(2), true),
    getBlankSectionState(4, getDefaultPartLabel(3), true),
  ],
});

const getQuestionRangeLabel = (questions: Question[], sectionIndex: number) => {
  const numbers = questions.map((question) => question.questionNumber).filter(Number.isFinite).sort((a, b) => a - b);
  const fallback = getSectionQuestionRange(sectionIndex);
  if (numbers.length === 0) return `Questions ${fallback.start}–${fallback.end}`;
  return numbers[0] === numbers[numbers.length - 1]
    ? `Question ${numbers[0]}`
    : `Questions ${numbers[0]}–${numbers[numbers.length - 1]}`;
};

const getDefaultGroupInstructions = (type: string) => {
  if (type === "NOTES_COMPLETION") {
    return ["Complete the notes below.", "Write **NO MORE THAN TWO WORDS** for each answer."];
  }
  if (type === "TABLE_COMPLETION") {
    return ["Complete the table below.", "Write **ONE WORD AND/OR A NUMBER** for each answer."];
  }
  if (type === "FLOW_CHART_COMPLETION") {
    return ["Complete the flow-chart below.", "Choose the correct answer for each gap."];
  }
  if (type === "MULTIPLE_CHOICE_MULTIPLE") {
    return ["Choose **TWO** letters A–E.", ""];
  }
  if (type === "MULTIPLE_CHOICE") {
    return ["Choose the correct letter, A, B or C.", ""];
  }
  if (type === "MATCHING_FEATURES") {
    return ["Choose the correct letter, A–G, for each question.", ""];
  }
  if (type === "DIAGRAM_LABELLING") {
    return ["Label the plan below.", "Write the correct letter, A–G, next to each question."];
  }
  return ["", ""];
};



interface FormatInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

function MultipleChoiceCorrectAnswerSelect({
  value,
  options,
  usedOptions,
  onChange,
  valueMode = "option",
}: {
  value: string;
  options: string[];
  usedOptions: string[];
  onChange: (value: string) => void;
  valueMode?: "option" | "letter";
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={options.length === 0}
      className="h-10 w-full rounded border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-800 outline-none focus:border-[#1B3A6B] disabled:cursor-not-allowed disabled:bg-gray-100"
    >
      <option value="">{options.length === 0 ? "Add A–E choices below first" : "Select correct option"}</option>
      {options.map((option, index) => {
        const optionValue = valueMode === "letter" ? String.fromCharCode(65 + index) : option;
        return (
        <option key={`${index}-${option}`} value={optionValue} disabled={optionValue !== value && usedOptions.includes(optionValue)}>
          {String.fromCharCode(65 + index)} — {option}
        </option>
        );
      })}
    </select>
  );
}

type FormatMarker = "bold" | "italic" | "underline" | "color";

function FormattingToolbar({
  onFormat,
}: {
  onFormat: (format: FormatMarker, color?: string) => void;
}) {
  return (
    <div className="mb-1 flex flex-wrap items-center gap-1 rounded-md border border-gray-200 bg-slate-50 p-1">
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onFormat("bold")} className="rounded p-1.5 text-gray-600 hover:bg-white hover:text-black" title="Bold selected text"><IconBold size={14} /></button>
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onFormat("italic")} className="rounded p-1.5 text-gray-600 hover:bg-white hover:text-black" title="Italic selected text"><IconItalic size={14} /></button>
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onFormat("underline")} className="rounded p-1.5 text-gray-600 hover:bg-white hover:text-black" title="Underline selected text"><IconUnderline size={14} /></button>
      <label className="flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 text-[10px] font-bold text-gray-600 hover:bg-white" title="Change selected text color">
        <IconPalette size={14} /> Color
        <input
          type="color"
          defaultValue="#000000"
          onChange={(event) => onFormat("color", event.target.value)}
          className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
        />
      </label>
      <span className="ml-auto pr-1 text-[9px] text-gray-400">Select text first</span>
    </div>
  );
}

function applyTextFormat(
  element: HTMLInputElement | HTMLTextAreaElement | null,
  value: string,
  onChange: (value: string) => void,
  format: FormatMarker,
  color?: string,
) {
  if (!element) return;
  const start = element.selectionStart ?? 0;
  const end = element.selectionEnd ?? start;
  if (start === end) return;

  const selectedText = value.slice(start, end);
  const [prefix, suffix] = format === "bold"
    ? ["**", "**"]
    : format === "italic"
      ? ["*", "*"]
      : format === "underline"
        ? ["__", "__"]
        : [`{color:${color || "#000000"}}`, "{/color}"];
  onChange(`${value.slice(0, start)}${prefix}${selectedText}${suffix}${value.slice(end)}`);

  requestAnimationFrame(() => {
    element.focus();
    element.setSelectionRange(start + prefix.length, end + prefix.length);
  });
}

function FormatInput({ value, onChange, placeholder, className }: FormatInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="w-full">
      <FormattingToolbar onFormat={(format, color) => applyTextFormat(ref.current, value, onChange, format, color)} />
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${className || "w-full min-h-9 px-3 py-2 border border-gray-300 rounded focus:border-[#1B3A6B] text-xs bg-white font-semibold text-gray-800"} resize-y`}
      />
    </div>
  );
}

interface FormatTextareaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

function FormatTextarea({ value, onChange, placeholder, rows = 3, className }: FormatTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="relative flex flex-col w-full font-sans">
      <FormattingToolbar onFormat={(format, color) => applyTextFormat(ref.current, value, onChange, format, color)} />
      <textarea
        ref={ref}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${className || "w-full p-2 border border-gray-300 rounded focus:border-[#1B3A6B] text-xs bg-white font-semibold text-gray-800 leading-relaxed"} resize-y`}
      />
    </div>
  );
}

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

function getApiErrorMessage(error: any) {
  const responseData = error?.response?.data;
  const sourceMessages = Array.isArray(responseData?.errorSources)
    ? responseData.errorSources.map((source: any) => source?.message).filter(Boolean)
    : [];

  if (sourceMessages.length > 0) return sourceMessages.join("; ");
  if (typeof responseData?.message === "string" && responseData.message !== "Something went wrong") {
    return responseData.message;
  }
  return error?.message || "Unknown server error";
}

function isListeningDraftEmpty(form: Partial<ExamForm>): boolean {
  if (!form) return true;
  const hasMetadata = Boolean(form.title?.trim() || form.description?.trim() || form.audioUrl?.trim() || form.youtubeUrl?.trim());
  if (hasMetadata) return false;

  const hasSectionsContent = Boolean(
    form.sections &&
      form.sections.some((sec) => {
        const hasSecAudio = Boolean(sec.audioUrl?.trim() || sec.youtubeUrl?.trim() || sec.script?.trim());
        if (hasSecAudio) return true;
        const hasGroups = Boolean(
          sec.questionGroups &&
            sec.questionGroups.some((grp) => {
              const hasSegment = Boolean(grp.passageSegment?.trim());
              const hasOptions = Boolean(grp.options && grp.options.some((o) => o?.trim()));
              const hasQuestions = Boolean(
                grp.questions &&
                  grp.questions.some(
                    (q) =>
                      Boolean(q.questionText?.trim()) ||
                      Boolean(q.correctAnswer?.trim()) ||
                      Boolean(q.options && q.options.some((opt) => opt?.trim()))
                  )
              );
              return hasSegment || hasOptions || hasQuestions;
            })
        );
        return hasGroups;
      })
  );

  return !hasSectionsContent;
}

type ListeningCreatorWorkspaceProps = {
  embedded?: boolean;
  onExamReady?: (exam: any) => void;
};

export function ListeningCreatorWorkspace({ embedded = false, onExamReady }: ListeningCreatorWorkspaceProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const editExamId = searchParams.get("edit");
  const localDraftKey = `${LISTENING_CREATOR_DRAFT_KEY}:${editExamId ?? "new"}`;

  // Form State
  const [formState, setFormState] = useState<ExamForm>(getEmptyExamForm);

  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingGroupImage, setUploadingGroupImage] = useState<{ sectionIdx: number; groupIdx: number } | null>(null);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const [isDraftHydrated, setIsDraftHydrated] = useState(false);
  const restoredLocalDraft = useRef(false);
  const latestFormState = useRef(formState);

  useEffect(() => {
    latestFormState.current = formState;
  }, [formState]);

  const handleGroupImageUpload = async (sectionIdx: number, groupIdx: number, file: File) => {
    if (!file) return;

    setUploadingGroupImage({ sectionIdx, groupIdx });
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await listeningService.uploadAudio(formData);
      setFormState((prev) => {
        const nextSecs = [...prev.sections];
        nextSecs[sectionIdx].questionGroups[groupIdx].imageUrl = res.data.url;
        return { ...prev, sections: nextSecs };
      });
      toast.success("Diagram image uploaded successfully!");
    } catch (err: any) {
      toast.error("Failed to upload image file: " + (err?.response?.data?.message || err.message));
    } finally {
      setUploadingGroupImage(null);
    }
  };

  // Fetch Exam details if editing
  const { data: editExamResponse, isLoading: editLoading } = useQuery({
    queryKey: ["listening-exam-edit", editExamId],
    queryFn: () => listeningService.getExamById(editExamId!),
    enabled: !!editExamId,
  });

  // Populate state on successful fetch
  useEffect(() => {
    if (editExamResponse?.data && !restoredLocalDraft.current) {
      const exam = editExamResponse.data;
      
      // Ensure all 4 sections are represented correctly
      const mappedSections = [1, 2, 3, 4].map((order) => {
        const existingSec = exam.sections?.find((s: any) => s.order === order);
        if (existingSec) {
          return {
            title: existingSec.title || getDefaultPartLabel(order - 1),
            audioUrl: existingSec.audioUrl || "",
            youtubeUrl: existingSec.youtubeUrl || "",
            script: existingSec.script || "",
            instruction: existingSec.instruction || "",
            order: existingSec.order || order,
            questionGroups: (existingSec.questionGroups ?? []).map((g: any) => ({
              type: g.type || "SENTENCE_COMPLETION",
              instruction: g.instruction || "",
              passageSegment: g.passageSegment || "",
              options: g.options?.length ? g.options : g.type === "DIAGRAM_LABELLING" ? [...DIAGRAM_LABEL_OPTIONS] : [],
              imageUrl: g.imageUrl || "",
              order: g.order || 1,
              questions: (g.questions ?? []).map((q: any) => ({
                questionNumber: q.questionNumber || 1,
                questionText: q.questionText || "",
                options: q.options || [],
                correctAnswer: q.correctAnswer || "",
                explanation: q.explanation || "",
              })),
            })),
          };
        }
        return getBlankSectionState(order, getDefaultPartLabel(order - 1));
      });

      const firstSectionWithAudio = mappedSections.find((s) => s.audioUrl) || mappedSections[0];
      const audioUrl = firstSectionWithAudio?.audioUrl || "";
      const youtubeUrl = mappedSections.find((s) => s.youtubeUrl)?.youtubeUrl || firstSectionWithAudio?.youtubeUrl || "";

      setFormState({
        title: exam.title || "",
        description: exam.description || "",
        duration: exam.duration || 30,
        isPublished: exam.isPublished || false,
        audioUrl,
        youtubeUrl,
        sections: mappedSections,
      });
    }
  }, [editExamResponse]);

  useEffect(() => {
    if (embedded) {
      setIsDraftHydrated(true);
      return;
    }

    const savedDraft = window.localStorage.getItem(localDraftKey)
      ?? (!editExamId ? window.localStorage.getItem(LISTENING_CREATOR_DRAFT_KEY) : null);
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft) as { formState?: ExamForm; savedAt?: string };
        if (parsedDraft.formState && !isListeningDraftEmpty(parsedDraft.formState)) {
          setFormState(parsedDraft.formState);
          setLastDraftSavedAt(parsedDraft.savedAt || null);
          restoredLocalDraft.current = true;
          window.localStorage.setItem(localDraftKey, savedDraft);
          if (!editExamId) window.localStorage.removeItem(LISTENING_CREATOR_DRAFT_KEY);
          toast.info("Your unfinished listening draft has been restored.");
        } else {
          window.localStorage.removeItem(localDraftKey);
          if (!editExamId) window.localStorage.removeItem(LISTENING_CREATOR_DRAFT_KEY);
        }
      } catch {
        window.localStorage.removeItem(localDraftKey);
      }
    }
    setIsDraftHydrated(true);
  }, [embedded, localDraftKey, editExamId]);

  useEffect(() => {
    if (embedded || !isDraftHydrated) return;
    const timeoutId = window.setTimeout(() => {
      if (isListeningDraftEmpty(formState)) {
        try {
          window.localStorage.removeItem(localDraftKey);
          setLastDraftSavedAt(null);
        } catch {}
        return;
      }
      const savedAt = new Date().toISOString();
      try {
        window.localStorage.setItem(localDraftKey, JSON.stringify({ formState, savedAt }));
        setLastDraftSavedAt(savedAt);
      } catch {
        toast.error("Draft could not be saved in this browser.");
      }
    }, 700);
    return () => window.clearTimeout(timeoutId);
  }, [embedded, formState, isDraftHydrated, localDraftKey]);

  useEffect(() => {
    if (embedded || !isDraftHydrated) return;
    const persistBeforeExit = () => {
      if (isListeningDraftEmpty(latestFormState.current)) return;
      try {
        window.localStorage.setItem(localDraftKey, JSON.stringify({
          formState: latestFormState.current,
          savedAt: new Date().toISOString(),
        }));
      } catch {}
    };
    window.addEventListener("pagehide", persistBeforeExit);
    return () => window.removeEventListener("pagehide", persistBeforeExit);
  }, [embedded, isDraftHydrated, localDraftKey]);

  const clearPublishedForm = () => {
    window.localStorage.removeItem(localDraftKey);
    window.localStorage.removeItem(LISTENING_CREATOR_DRAFT_KEY);
    restoredLocalDraft.current = false;
    setFormState(getEmptyExamForm());
    setActiveSectionIdx(0);
    setLastDraftSavedAt(null);
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => listeningService.createExam(payload),
    onSuccess: () => {
      clearPublishedForm();
      toast.success("Listening Exam created successfully!");
      queryClient.invalidateQueries({ queryKey: ["teacher-listening-exams"] });
      router.push("/teacher/listening/exams");
    },
    onError: (err: any) => {
      toast.error("Failed to create exam: " + getApiErrorMessage(err));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => listeningService.updateExam(editExamId!, payload),
    onSuccess: () => {
      clearPublishedForm();
      toast.success("Listening Exam updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["teacher-listening-exams"] });
      router.push("/teacher/listening/exams");
    },
    onError: (err: any) => {
      toast.error("Failed to update exam: " + getApiErrorMessage(err));
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  // File Upload logic
  const handleGlobalAudioUpload = async (file: File) => {
    if (!file) return;

    setUploadingAudio(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await listeningService.uploadAudio(formData);
      setFormState((prev) => ({ ...prev, audioUrl: res.data.url }));
      toast.success("Audio file uploaded successfully!");
    } catch (err: any) {
      toast.error("Failed to upload audio file: " + (err?.response?.data?.message || err.message));
    } finally {
      setUploadingAudio(false);
    }
  };

  // State modifiers
  const handleInputChange = (field: keyof ExamForm, val: any) => {
    setFormState((prev) => ({ ...prev, [field]: val }));
  };

  const saveLocalDraft = () => {
    const savedAt = new Date().toISOString();
    try {
      window.localStorage.setItem(localDraftKey, JSON.stringify({ formState, savedAt }));
      setLastDraftSavedAt(savedAt);
      toast.success("Draft saved on this device.");
    } catch {
      toast.error("Draft could not be saved in this browser.");
    }
  };

  const handleSectionChange = (sectionIdx: number, field: keyof Section, val: any) => {
    setFormState((prev) => {
      const nextSecs = [...prev.sections];
      nextSecs[sectionIdx] = { ...nextSecs[sectionIdx], [field]: val };
      return { ...prev, sections: nextSecs };
    });
  };

  const addQuestionGroup = (sectionIdx: number) => {
    setFormState((prev) => {
      const section = prev.sections[sectionIdx];
      const order = section.questionGroups.length + 1;
      
      const newGroup: QuestionGroup = {
        type: "SENTENCE_COMPLETION",
        instruction: "Write NO MORE THAN TWO WORDS for each answer.",
        passageSegment: "",
        options: [],
        imageUrl: "",
        order,
        questions: [],
      };
      
      const nextSections = prev.sections.map((item, index) => index === sectionIdx
        ? { ...item, questionGroups: [...item.questionGroups, newGroup] }
        : item,
      );
      return { ...prev, sections: nextSections };
    });
  };

  const removeQuestionGroup = (sectionIdx: number, groupIdx: number) => {
    setFormState((prev) => {
      const nextSecs = [...prev.sections];
      const section = nextSecs[sectionIdx];
      
      section.questionGroups = section.questionGroups.filter((_, idx) => idx !== groupIdx);
      // Re-order remaining groups
      section.questionGroups = section.questionGroups.map((g, idx) => ({ ...g, order: idx + 1 }));
      
      return { ...prev, sections: nextSecs };
    });
  };

  const handleGroupChange = (sectionIdx: number, groupIdx: number, field: keyof QuestionGroup, val: any) => {
    setFormState((prev) => {
      const nextSecs = [...prev.sections];
      const group = nextSecs[sectionIdx].questionGroups[groupIdx];
      
      (group as any)[field] = val;

      if (field === "passageSegment" && typeof val === "string") {
        const placeholderNumbers = Array.from(new Set(
          Array.from(val.matchAll(/\[(\d+)\]/g), (match) => Number(match[1])),
        )).sort((a, b) => a - b);

        if (placeholderNumbers.length > 0) {
          group.questions = placeholderNumbers.map((questionNumber, questionIndex) => {
            const matchingQuestion = group.questions.find((question) => question.questionNumber === questionNumber);
            const fallbackQuestion = group.questions[questionIndex];
            return {
              questionNumber,
              questionText: matchingQuestion?.questionText ?? fallbackQuestion?.questionText ?? "",
              options: matchingQuestion?.options ?? fallbackQuestion?.options ?? [],
              correctAnswer: matchingQuestion?.correctAnswer ?? fallbackQuestion?.correctAnswer ?? "",
              explanation: matchingQuestion?.explanation ?? fallbackQuestion?.explanation ?? "",
            };
          });
        }
      }

      return { ...prev, sections: nextSecs };
    });
  };

  const handleQuestionTypeChange = (sectionIdx: number, groupIdx: number, type: string) => {
    setFormState((prev) => {
      const nextSections = [...prev.sections];
      const group = nextSections[sectionIdx].questionGroups[groupIdx];
      group.type = type;

      if (type === "MULTIPLE_CHOICE_MULTIPLE") {
        const range = getSectionQuestionRange(sectionIdx);
        const existingQuestions = group.questions.length > 0 ? group.questions : [];
        const configuredQuestions = existingQuestions.filter((question) =>
          question.questionText.trim() || question.correctAnswer.trim() || question.options.some(Boolean),
        );
        const sourceQuestions = configuredQuestions.length > 0 ? existingQuestions : [];
        const sharedOptions = sourceQuestions[0]?.options?.filter(Boolean) ?? [];
        const requestedFirstNumber = sourceQuestions[0]?.questionNumber ?? range.start;
        const firstQuestionNumber = requestedFirstNumber >= range.start && requestedFirstNumber < range.end
          ? requestedFirstNumber
          : range.start;
        group.questions = [0, 1].map((index) => ({
          questionNumber: firstQuestionNumber + index,
          questionText: index === 0 ? sourceQuestions[0]?.questionText ?? "" : "",
          options: [...sharedOptions],
          correctAnswer: sourceQuestions[index]?.correctAnswer ?? "",
          explanation: sourceQuestions[index]?.explanation ?? "",
        }));
      }

      if (type === "DIAGRAM_LABELLING" && !group.options.some((option) => option.trim())) {
        group.options = [...DIAGRAM_LABEL_OPTIONS];
      }

      const [instructionOne, instructionTwo] = getDefaultGroupInstructions(type);
      group.instruction = `${getQuestionRangeLabel(group.questions, sectionIdx)}|||${instructionOne}|||${instructionTwo}|||`;

      return { ...prev, sections: nextSections };
    });
  };

  // Add / Remove Questions inside group
  const addQuestionToGroup = (sectionIdx: number, groupIdx: number) => {
    setFormState((prev) => {
      const section = prev.sections[sectionIdx];
      const group = section.questionGroups[groupIdx];
      const usedNumbers = new Set(
        section.questionGroups.flatMap((item) => item.questions.map((question) => question.questionNumber)),
      );
      let nextNum = getSectionQuestionRange(sectionIdx).start;
      while (usedNumbers.has(nextNum)) nextNum += 1;

      const firstQOptions = group.questions[0]?.options ?? [];

      const newQ: Question = {
        questionNumber: nextNum,
        questionText: "",
        options: group.type === "MULTIPLE_CHOICE_MULTIPLE" ? [...firstQOptions] : [],
        correctAnswer: "",
        explanation: "",
      };

      const nextGroup = { ...group, questions: [...group.questions, newQ] };
      const nextSection = {
        ...section,
        questionGroups: section.questionGroups.map((item, index) => index === groupIdx ? nextGroup : item),
      };
      return {
        ...prev,
        sections: prev.sections.map((item, index) => index === sectionIdx ? nextSection : item),
      };
    });
  };

  const removeQuestionFromGroup = (sectionIdx: number, groupIdx: number, qIdx: number) => {
    setFormState((prev) => {
      const nextSecs = [...prev.sections];
      const group = nextSecs[sectionIdx].questionGroups[groupIdx];
      
      group.questions = group.questions.filter((_, idx) => idx !== qIdx);
      return { ...prev, sections: nextSecs };
    });
  };

  const handleQuestionChange = (
    sectionIdx: number,
    groupIdx: number,
    qIdx: number,
    field: keyof Question,
    val: any
  ) => {
    if (field === "questionNumber") {
      const duplicate = formState.sections[sectionIdx].questionGroups.some((group, currentGroupIdx) =>
        group.questions.some((question, currentQuestionIdx) =>
          question.questionNumber === Number(val) && (currentGroupIdx !== groupIdx || currentQuestionIdx !== qIdx),
        ),
      );
      if (duplicate) {
        toast.error(`Question ${val} already exists in this part. Choose the next sequence number.`);
        return;
      }
    }

    setFormState((prev) => {
      const nextSecs = [...prev.sections];
      const group = nextSecs[sectionIdx].questionGroups[groupIdx];
      
      (group.questions[qIdx] as any)[field] = val;
      return { ...prev, sections: nextSecs };
    });
  };

  // MCQ choices handlers
  const handleAddMCQOption = (sectionIdx: number, groupIdx: number, qIdx: number) => {
    setFormState((prev) => {
      const section = prev.sections[sectionIdx];
      const group = section.questionGroups[groupIdx];
      const q = group.questions[qIdx];
      const newOptions = [...(q.options ?? []), `Option ${(q.options ?? []).length + 1}`];
      const nextGroup = {
        ...group,
        questions: group.questions.map((question, index) => {
          if (group.type === "MULTIPLE_CHOICE_MULTIPLE" || index === qIdx) {
            return { ...question, options: newOptions };
          }
          return question;
        }),
      };
      const nextSection = {
        ...section,
        questionGroups: section.questionGroups.map((item, index) => index === groupIdx ? nextGroup : item),
      };
      return {
        ...prev,
        sections: prev.sections.map((item, index) => index === sectionIdx ? nextSection : item),
      };
    });
  };

  const handleRemoveMCQOption = (sectionIdx: number, groupIdx: number, qIdx: number, optionIdx: number) => {
    setFormState((prev) => {
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

  const handleMCQOptionChange = (
    sectionIdx: number,
    groupIdx: number,
    qIdx: number,
    optionIdx: number,
    val: string
  ) => {
    setFormState((prev) => {
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

  // Submit Form Handler
  const handleSubmit = (e?: React.SyntheticEvent, publishOverride?: boolean) => {
    e?.preventDefault();
    const isPublishing = publishOverride ?? formState.isPublished;
    const isConfiguredQuestion = (question: Question, group: QuestionGroup) => {
      const referencedNumbers = Array.from(group.passageSegment.matchAll(/\[(\d+)\]/g), (match) => Number(match[1]));
      return referencedNumbers.includes(Number(question.questionNumber))
        || Boolean(question.questionText.trim())
        || Boolean(question.correctAnswer.trim())
        || question.options.some((option) => option.trim());
    };

    if (!formState.title) {
      toast.error("Please provide an exam title.");
      return;
    }

    if (isPublishing && !formState.audioUrl) {
      toast.error("Please upload an audio file for the listening exam.");
      return;
    }

    if (isPublishing) for (const [sectionIndex, section] of formState.sections.entries()) {
      const sectionQuestions = section.questionGroups.flatMap((group) =>
        group.questions.filter((question) => isConfiguredQuestion(question, group)),
      );

      const unansweredQuestion = sectionQuestions.find((question) => !question.correctAnswer.trim());
      if (unansweredQuestion) {
        toast.error(`Question ${unansweredQuestion.questionNumber} has no correct answer. Complete it before publishing.`);
        setActiveSectionIdx(sectionIndex);
        return;
      }

      for (const group of section.questionGroups) {
        if (group.type === "DIAGRAM_LABELLING" && !group.imageUrl.trim()) {
          toast.error(`Section ${sectionIndex + 1} has a diagram question without an image.`);
          setActiveSectionIdx(sectionIndex);
          return;
        }

        const referencedNumbers = Array.from(group.passageSegment.matchAll(/\[(\d+)\]/g), (match) => Number(match[1]));
        const unansweredReference = referencedNumbers.find((questionNumber) => {
          const question = group.questions.find((item) => Number(item.questionNumber) === questionNumber);
          return !question?.correctAnswer.trim();
        });
        if (unansweredReference) {
          toast.error(`Question ${unansweredReference} is used in the preview but has no correct answer.`);
          return;
        }
      }
    }

    const sectionsForSubmission = formState.sections
      .map((section) => ({
        ...section,
        questionGroups: section.questionGroups
          .map((group) => ({
            ...group,
            questions: group.questions.filter((question) => isConfiguredQuestion(question, group)),
          }))
          .filter((group) => group.questions.length > 0),
      }))
      .filter((section) => section.questionGroups.length > 0);

    const submittedQuestions = sectionsForSubmission.flatMap((section) =>
      section.questionGroups.flatMap((group) => group.questions),
    );
    const totalQuestions = submittedQuestions.length;

    if (isPublishing && totalQuestions === 0) {
      toast.error("Add at least one question and enter its correct answer before saving.");
      return;
    }

    const invalidQuestion = submittedQuestions.find((question) =>
      !Number.isInteger(Number(question.questionNumber)) || question.questionNumber < 1,
    );
    if (isPublishing && invalidQuestion) {
      toast.error("Every question number must be a positive whole number.");
      return;
    }

    const questionNumbers = submittedQuestions.map((question) => Number(question.questionNumber));
    const duplicateQuestionNumber = questionNumbers.find((number, index) => questionNumbers.indexOf(number) !== index);
    if (isPublishing && duplicateQuestionNumber) {
      toast.error(`Question number ${duplicateQuestionNumber} is used more than once.`);
      return;
    }

    const payload = {
      title: formState.title,
      description: formState.description,
      duration: Number(formState.duration),
      isPublished: isPublishing,
      sections: sectionsForSubmission.map((s) => ({
        title: s.title,
        audioUrl: formState.audioUrl,
        youtubeUrl: formState.youtubeUrl || "",
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
        })).filter((group) => group.questions.length > 0),
      })),
    };

    if (embedded && onExamReady) {
      onExamReady(payload);
      return;
    }

    if (editExamId) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  // Auto-sync listening payload to Full Mock parent when embedded
  useEffect(() => {
    if (!embedded || !onExamReady) return;
    const payload = {
      title: formState.title,
      description: formState.description,
      duration: Number(formState.duration),
      isPublished: formState.isPublished,
      audioUrl: formState.audioUrl,
      youtubeUrl: formState.youtubeUrl,
      sections: formState.sections.map((s) => ({
        title: s.title,
        audioUrl: s.audioUrl || formState.audioUrl,
        youtubeUrl: s.youtubeUrl || formState.youtubeUrl,
        script: s.script,
        instruction: s.instruction,
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
        })).filter((group) => group.questions.length > 0),
      })),
    };
    onExamReady(payload);
  }, [formState, embedded, onExamReady]);

  if (editLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 font-sans">
        <IconLoader2 size={40} className="animate-spin text-[#1B3A6B]" />
        <p className="text-gray-500 font-semibold">Loading exam data from database...</p>
      </div>
    );
  }

  const activeSection = formState.sections[activeSectionIdx];

  return (
    <div className={`mx-auto w-full max-w-none font-sans ${embedded ? "p-0 space-y-4" : "p-4 md:p-6 xl:p-8 space-y-6"}`}>
      <FloatingSelectionToolbar allEditableFields syntax="markdown" />
      
      {/* HEADER BANNER */}
      {!embedded ? (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-2xl shadow-md border border-indigo-900/40 relative overflow-hidden text-white">
          <div className="absolute -top-12 -right-12 h-44 w-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 h-36 w-36 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-4 z-10">
            <button
              type="button"
              onClick={() => router.push("/teacher/listening/exams")}
              className="p-3 border border-indigo-900/60 bg-indigo-950/40 text-indigo-205 hover:text-white rounded-xl hover:bg-indigo-900/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <IconArrowLeft size={18} />
            </button>
            <div>
              <span className="text-[9px] font-black tracking-widest uppercase bg-indigo-500/20 border border-indigo-400/20 text-indigo-300 px-2.5 py-0.5 rounded-full w-max block">
                Listening Creator
              </span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight mt-1">
                {editExamId ? "Edit Listening Exam Workspace" : "Create New Listening Exam Workspace"}
              </h1>
              <p className="text-xs text-indigo-200/70 mt-1 max-w-xl">Craft dynamic listening parts, upload examiner audios, script transcripts, and build responsive question grids.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 md:inline-flex">
              {lastDraftSavedAt ? "Draft saved" : "Auto-draft on"}
            </span>

            <button
              type="button"
              onClick={saveLocalDraft}
              className="rounded-lg border border-indigo-300 bg-white/10 px-3.5 py-2.5 text-xs font-black text-white transition hover:bg-white/20"
            >
              Save Draft
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(undefined, true)}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg bg-[#24549a] px-4.5 py-2.5 text-xs font-black text-white shadow transition hover:bg-[#1b3f74] disabled:opacity-50"
            >
              {isPending ? <IconLoader2 size={14} className="animate-spin" /> : <IconCheck size={14} />}
              <span>{editExamId ? "Update Exam" : "Publish Exam"}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <div>
            <h3 className="text-sm font-extrabold text-[#1B3A6B]">Listening Sections & Audio Questions</h3>
            <p className="text-xs text-slate-500 font-medium">Add Section 1–4 audio tracks, questions, and transcript passages.</p>
          </div>
          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            Auto-synced to Full Mock Test
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: EXAM CORE METADATA */}
        {!embedded && <div className="lg:col-span-1 space-y-6">
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
                value={formState.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] text-sm text-gray-800 bg-white"
                placeholder="e.g. Cambridge IELTS 19 Test 1"
              />
            </div>

            {/* Exam Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">Description</label>
              <textarea
                value={formState.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
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
                value={formState.duration}
                onChange={(e) => handleInputChange("duration", Number(e.target.value))}
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
                  value={formState.audioUrl}
                  onChange={(e) => handleInputChange("audioUrl", e.target.value)}
                  className="flex-grow h-10 px-3 border border-gray-300 rounded-lg focus:border-[#1B3A6B] text-xs font-medium bg-white truncate"
                  placeholder="Audio File URL (or choose upload)"
                />
                
                <label className="h-10 px-3.5 border border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer bg-gray-50 flex items-center justify-center shrink-0">
                  {uploadingAudio ? (
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
                      if (file) handleGlobalAudioUpload(file);
                    }}
                    disabled={uploadingAudio}
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
                value={formState.youtubeUrl}
                onChange={(e) => handleInputChange("youtubeUrl", e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] text-xs font-medium bg-white"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            {/* Summary details */}
            <div className="bg-slate-50 rounded-xl p-4 text-xs font-medium text-gray-500 border border-slate-100 space-y-1">
              <div className="flex justify-between">
                <span>Total Sections:</span>
                <span className="font-bold text-gray-800">{formState.sections.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <span className="font-bold text-gray-800">
                  {formState.sections.reduce((acc, s) => acc + s.questionGroups.reduce((gAcc, g) => gAcc + g.questions.length, 0), 0)}
                </span>
              </div>
            </div>
          </div>
        </div>}

        {/* RIGHT COLUMN: ACTIVE SECTION & QUESTIONS WORKSPACE */}
        <div className={`${embedded ? "lg:col-span-3" : "lg:col-span-2"} space-y-6`}>
          {embedded && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[150px_minmax(260px,1fr)_minmax(260px,1fr)_170px] xl:items-end">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-600">Duration (Minutes)</label>
                  <input
                    type="number"
                    required
                    value={formState.duration}
                    onChange={(event) => handleInputChange("duration", Number(event.target.value))}
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-900 outline-none focus:border-[#1B3A6B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-gray-600">
                    <IconFileMusic size={14} /> Audio Recording File
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formState.audioUrl}
                      onChange={(event) => handleInputChange("audioUrl", event.target.value)}
                      className="h-10 min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-xs font-medium outline-none focus:border-[#1B3A6B]"
                      placeholder="Audio File URL (or choose upload)"
                    />
                    <label className="flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-gray-50 px-3.5 hover:border-gray-400">
                      {uploadingAudio ? <IconLoader2 size={16} className="animate-spin text-gray-500" /> : <IconUpload size={16} className="text-gray-500" />}
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        disabled={uploadingAudio}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) handleGlobalAudioUpload(file);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-gray-600">
                    <IconBrandYoutube size={14} className="text-red-500" /> YouTube Video Link (Optional)
                  </label>
                  <input
                    type="text"
                    value={formState.youtubeUrl}
                    onChange={(event) => handleInputChange("youtubeUrl", event.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-xs font-medium outline-none focus:border-[#1B3A6B]"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-slate-50 p-2.5">
                  <div className="rounded-lg bg-white px-2 py-1.5 text-center">
                    <p className="text-[9px] font-black uppercase tracking-wide text-gray-500">Total Sections</p>
                    <p className="text-lg font-black text-black">{formState.sections.length}</p>
                  </div>
                  <div className="rounded-lg bg-white px-2 py-1.5 text-center">
                    <p className="text-[9px] font-black uppercase tracking-wide text-gray-500">Total Questions</p>
                    <p className="text-lg font-black text-black">
                      {formState.sections.reduce((sectionTotal, section) => sectionTotal + section.questionGroups.reduce((groupTotal, group) => groupTotal + group.questions.length, 0), 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* SECTION selector tabs */}
          <div className="flex bg-gray-150 p-1 rounded-xl border border-gray-200 overflow-x-auto gap-1">
            {formState.sections.map((s, idx) => {
              const active = activeSectionIdx === idx;
              const hasContent = s.script || s.instruction || s.questionGroups.length > 0;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSectionIdx(idx)}
                  className={`flex-1 py-2 text-center rounded-lg text-xs font-bold uppercase transition select-none tracking-wider whitespace-nowrap px-3 ${
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
          {activeSection && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* SECTION MEDIA FIELDS (Script Transcription, Instructions) */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-[#1B3A6B] border-b border-gray-100 pb-2 uppercase tracking-wide">
                   Section Info & Script (Part {activeSectionIdx + 1})
                </h3>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase">Part Label (Manual)</label>
                  <FormatInput
                    value={activeSection.title}
                    onChange={(value) => handleSectionChange(activeSectionIdx, "title", value)}
                    placeholder={getDefaultPartLabel(activeSectionIdx)}
                  />
                  <p className="text-[10px] text-gray-400">Example: Part 2: Q11–Q20. This label does not change question text or numbering.</p>
                </div>
                {/* Script Transcription Textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1.5">
                    <IconArticle size={15} />
                    <span>Listening Transcript / Script</span>
                  </label>
                  <textarea
                    value={activeSection.script}
                    onChange={(e) => handleSectionChange(activeSectionIdx, "script", e.target.value)}
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
                    Question Blocks ({activeSection.questionGroups.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => addQuestionGroup(activeSectionIdx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B3A6B] hover:bg-[#152e54] text-white text-xs font-bold rounded shadow transition active:scale-95"
                  >
                    <IconPlus size={14} />
                    <span>Add Question Block</span>
                  </button>
                </div>

                {activeSection.questionGroups.length === 0 && (
                  <div className="bg-white border border-gray-200 rounded-2xl py-12 px-6 text-center text-gray-400 font-semibold shadow-sm">
                    No question blocks have been added to this section yet.
                  </div>
                )}

                {activeSection.questionGroups.map((group, groupIdx) => {
                  const typeTheme = getQuestionTypeTheme(group.type);
                  const typeLabel = QUESTION_GROUP_TYPES.find((type) => type.value === group.type)?.label || group.type;
                  return (
                    <div
                      key={groupIdx}
                      className={`border border-gray-200 border-l-4 ${typeTheme.accent} ${typeTheme.surface} rounded-xl p-5 md:p-6 shadow-sm space-y-4 transition relative`}
                    >
                      {/* Block Title and deletion */}
                      <div className="flex items-center justify-between border-b border-gray-150 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-gray-900">
                            Block {groupIdx + 1}
                          </span>
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${typeTheme.badge}`}>
                            {typeLabel}
                          </span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeQuestionGroup(activeSectionIdx, groupIdx)}
                          className="text-gray-400 hover:text-rose-600 transition p-1"
                          title="Remove block"
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>

                      {/* Config Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Question type selector */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-gray-700 uppercase">Question Format Type</label>
                          <select
                            value={group.type}
                            onChange={(e) => handleQuestionTypeChange(activeSectionIdx, groupIdx, e.target.value)}
                            className={`w-full h-10 px-3 border rounded-lg text-sm font-bold bg-white cursor-pointer ${typeTheme.select}`}
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
                            handleGroupChange(activeSectionIdx, groupIdx, "instruction", serialized);
                          };

                          return (
                            <div className="space-y-3 md:col-span-2 bg-slate-50 p-4 rounded-xl border border-gray-200">
                              <span className="text-[10px] font-extrabold uppercase text-[#1B3A6B] tracking-wider block mb-1">
                                IELTS Block Header Configuration
                              </span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-gray-500 uppercase">1. Question Range (Manual)</label>
                                  <FormatInput
                                    value={parsed.range}
                                    onChange={(val) => updateField("range", val)}
                                    placeholder="e.g. Questions 1–10"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-gray-500 uppercase">2. Instruction Line 1 (Italic)</label>
                                  <FormatInput
                                    value={parsed.inst1}
                                    onChange={(val) => updateField("inst1", val)}
                                    placeholder="e.g. Choose the correct letter, A, B or C."
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-gray-500 uppercase">3. Instruction Line 2 (Italic)</label>
                                  <FormatInput
                                    value={parsed.inst2}
                                    onChange={(val) => updateField("inst2", val)}
                                    placeholder="e.g. Write the correct letter, A–H, next to Questions..."
                                  />
                                </div>
                                {group.type === "MATCHING_FEATURES" && (
                                  <div className="space-y-1 md:col-span-2">
                                    <label className="text-[9px] font-black text-cyan-700 uppercase">Sources / Options Box Title (Manual)</label>
                                    <FormatInput
                                      value={group.passageSegment || ""}
                                      onChange={(val) => handleGroupChange(activeSectionIdx, groupIdx, "passageSegment", val)}
                                      placeholder="e.g. Sources of information"
                                    />
                                  </div>
                                )}
                                <div className="space-y-1 md:col-span-2">
                                  <label className="text-[9px] font-black text-gray-500 uppercase">
                                    {group.type === "FLOW_CHART_COMPLETION" ? "4. Flow Chart Title" : group.type === "DIAGRAM_LABELLING" ? "4. Diagram / Plan Title" : "4. Question Title / Heading (Centered)"}
                                  </label>
                                  <FormatInput
                                    value={parsed.heading}
                                    onChange={(val) => updateField("heading", val)}
                                    placeholder={group.type === "FLOW_CHART_COMPLETION" ? "e.g. Procedure for detecting life on another planet" : group.type === "DIAGRAM_LABELLING" ? "e.g. Ground floor plan of theatre" : "e.g. Clean energy solution / Notes title"}
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
                              onChange={(e) => handleGroupChange(activeSectionIdx, groupIdx, "imageUrl", e.target.value)}
                              className="flex-grow h-9 px-3 border border-gray-300 rounded focus:border-[#1B3A6B] text-xs bg-white truncate"
                              placeholder="Image URL (or choose upload)"
                            />
                            <label className="h-9 px-3.5 border border-gray-300 rounded hover:border-gray-400 cursor-pointer bg-gray-50 flex items-center justify-center shrink-0">
                              {uploadingGroupImage?.sectionIdx === activeSectionIdx && uploadingGroupImage?.groupIdx === groupIdx ? (
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
                                  if (file) handleGroupImageUpload(activeSectionIdx, groupIdx, file);
                                }}
                                disabled={uploadingGroupImage !== null}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Block Options List (one per line) */}
                        {(group.type === "MATCHING_FEATURES" || group.type === "SUMMARY_COMPLETION" || group.type === "DIAGRAM_LABELLING" || group.type === "FLOW_CHART_COMPLETION") && (
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">
                              {group.type === "FLOW_CHART_COMPLETION" ? "Dropdown Answer Options (one per line)" : group.type === "DIAGRAM_LABELLING" ? "Available Diagram Letters (one per line)" : group.type === "MATCHING_FEATURES" ? "A–G Options List (one option per line)" : "Block Options List (one option per line)"}
                            </label>
                            <FormatTextarea
                              value={group.options?.join("\n") || ""}
                              onChange={(val) => handleGroupChange(activeSectionIdx, groupIdx, "options", val.split("\n"))}
                              rows={3}
                              className="w-full p-2 border border-gray-300 rounded focus:border-[#1B3A6B] text-xs bg-white font-semibold"
                              placeholder={group.type === "FLOW_CHART_COMPLETION" ? "contamination&#10;vehicle&#10;heat&#10;results&#10;radiation" : group.type === "DIAGRAM_LABELLING" ? "A&#10;B&#10;C&#10;D&#10;E&#10;F&#10;G" : "Option A&#10;Option B&#10;Option C"}
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
                                onChange={(val) => handleGroupChange(activeSectionIdx, groupIdx, "passageSegment", val)}
                              />
                            ) : group.type === "NOTES_COMPLETION" ? (
                              <VisualNotesBuilder
                                value={group.passageSegment || ""}
                                onChange={(val) => handleGroupChange(activeSectionIdx, groupIdx, "passageSegment", val)}
                                questions={group.questions}
                              />
                            ) : (
                              <FormatTextarea
                                value={group.passageSegment || ""}
                                onChange={(val) => handleGroupChange(activeSectionIdx, groupIdx, "passageSegment", val)}
                                rows={group.type === "FLOW_CHART_COMPLETION" ? 8 : 3}
                                className="w-full p-2 border border-gray-300 rounded focus:border-[#1B3A6B] text-xs bg-white font-mono"
                                placeholder={group.type === "FLOW_CHART_COMPLETION" ? "Write one step per line. Use [26], [27], etc. for dropdown gaps.\n\nA spacecraft lands on a planet.\nThe rover is directed to a [26] which has organic material.\nIt collects a sample to avoid [27]." : "Use [1], [2], etc. to place blank input boxes matching the Question Numbers."}
                              />
                            )}
                          </div>
                        )}

                        {(group.type === "MULTIPLE_CHOICE" || group.type === "MULTIPLE_CHOICE_MULTIPLE") && (
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">
                              Question Set Title (Centered)
                            </label>
                            <FormatInput
                              value={group.passageSegment || ""}
                              onChange={(val) => handleGroupChange(activeSectionIdx, groupIdx, "passageSegment", val)}
                              placeholder="e.g. Global Design Competition"
                            />
                            <p className="text-[10px] text-gray-400">
                              This title appears centered above the multiple-choice questions in the student preview.
                            </p>
                          </div>
                        )}

                        {group.type === "MATCHING_FEATURES" && (
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Options Box Title</label>
                            <FormatInput
                              value={group.passageSegment || ""}
                              onChange={(val) => handleGroupChange(activeSectionIdx, groupIdx, "passageSegment", val)}
                              placeholder="e.g. Sources of information"
                            />
                            <p className="text-[10px] text-gray-400">This appears above the A–G source/options box in the student preview.</p>
                          </div>
                        )}
                      </div>

                      {/* QUESTIONS TABLE LIST */}
                      <div className="space-y-3 mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase text-gray-500">
                            Questions ({group.questions.length})
                          </span>
                          <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-bold text-[#1B3A6B]">
                            {activeSection.title || getDefaultPartLabel(activeSectionIdx)}
                          </span>
                          
                          <button
                            type="button"
                            onClick={() => addQuestionToGroup(activeSectionIdx, groupIdx)}
                            className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 bg-white text-gray-600 hover:text-black rounded hover:bg-gray-50 text-[10px] font-bold transition shadow-sm select-none active:scale-[0.98]"
                          >
                            <IconPlus size={12} />
                            <span>Add Question &amp; Answer</span>
                          </button>
                        </div>

                        {group.questions.length === 0 && (
                          <div className="bg-slate-50 border border-dashed border-gray-200 rounded-lg p-6 text-center text-xs text-gray-400 font-semibold select-none">
                            No questions added yet. Click “Add Question &amp; Answer” to create a question number, correct answer and explanation field.
                          </div>
                        )}

                        {group.questions.map((q, qIdx) => {
                          const isMCQ = group.type === "MULTIPLE_CHOICE" || group.type === "MULTIPLE_CHOICE_MULTIPLE";
                          const isCheckbox = group.type === "MATCHING_HEADINGS" || group.type === "MATCHING_SENTENCE_ENDINGS";
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
                                      min={getSectionQuestionRange(activeSectionIdx).start}
                                      value={q.questionNumber}
                                      onChange={(e) => handleQuestionChange(activeSectionIdx, groupIdx, qIdx, "questionNumber", Number(e.target.value))}
                                      className="w-12 h-6 border border-gray-300 rounded text-center text-xs font-bold text-gray-800 bg-white"
                                    />
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeQuestionFromGroup(activeSectionIdx, groupIdx, qIdx)}
                                  className="text-gray-400 hover:text-rose-500 transition p-1"
                                  title="Delete question"
                                >
                                  <IconTrash size={14} />
                                </button>
                              </div>

                              {/* Question Details Form */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {!["TABLE_COMPLETION", "NOTES_COMPLETION", "FLOW_CHART_COMPLETION", "SUMMARY_COMPLETION"].includes(group.type) && !(group.type === "MULTIPLE_CHOICE_MULTIPLE" && qIdx > 0) ? (
                                  <>
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-gray-500 uppercase">{group.type === "MULTIPLE_CHOICE_MULTIPLE" ? "Shared Question Prompt" : "Question Prompt / Text"}</label>
                                      <FormatTextarea
                                        value={q.questionText}
                                        onChange={(val) => handleQuestionChange(activeSectionIdx, groupIdx, qIdx, "questionText", val)}
                                        rows={2}
                                        placeholder="e.g. Farm shop / Given name: John..."
                                      />
                                    </div>

                                    {!['MULTIPLE_CHOICE', 'MULTIPLE_CHOICE_MULTIPLE'].includes(group.type) && (
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-gray-500 uppercase">{group.type === "MULTIPLE_CHOICE_MULTIPLE" ? `Correct Choice for Question ${q.questionNumber}` : group.type === "MATCHING_FEATURES" ? "Correct Letter" : "Correct Answer"}</label>
                                        {isMCQ || group.type === "MATCHING_FEATURES" || group.type === "DIAGRAM_LABELLING" ? (
                                          <MultipleChoiceCorrectAnswerSelect
                                            value={q.correctAnswer}
                                            options={group.type === "MULTIPLE_CHOICE_MULTIPLE" ? group.questions[0]?.options ?? [] : group.type === "MATCHING_FEATURES" || group.type === "DIAGRAM_LABELLING" ? group.options ?? [] : q.options ?? []}
                                            usedOptions={group.type === "MULTIPLE_CHOICE_MULTIPLE" ? group.questions.filter((_, index) => index !== qIdx).map((question) => question.correctAnswer) : []}
                                            valueMode={group.type === "MATCHING_FEATURES" ? "letter" : "option"}
                                            onChange={(value) => handleQuestionChange(activeSectionIdx, groupIdx, qIdx, "correctAnswer", value)}
                                          />
                                        ) : (
                                          <FormatInput
                                            value={q.correctAnswer}
                                            onChange={(val) => handleQuestionChange(activeSectionIdx, groupIdx, qIdx, "correctAnswer", val)}
                                            placeholder="Enter exact correct answer..."
                                          />
                                        )}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="md:col-span-2 space-y-1">
                                    {group.type !== "MULTIPLE_CHOICE_MULTIPLE" && (
                                    <>
                                    <label className="text-[9px] font-bold text-gray-500 uppercase">{group.type === "MULTIPLE_CHOICE_MULTIPLE" ? `Correct Choice for Question ${q.questionNumber}` : "Correct Answer"}</label>
                                    {isMCQ || group.type === "FLOW_CHART_COMPLETION" ? (
                                      <MultipleChoiceCorrectAnswerSelect
                                        value={q.correctAnswer}
                                        options={group.type === "FLOW_CHART_COMPLETION" ? group.options ?? [] : group.type === "MULTIPLE_CHOICE_MULTIPLE" ? group.questions[0]?.options ?? [] : q.options ?? []}
                                        usedOptions={group.type === "MULTIPLE_CHOICE_MULTIPLE" ? group.questions.filter((_, index) => index !== qIdx).map((question) => question.correctAnswer) : []}
                                        onChange={(value) => handleQuestionChange(activeSectionIdx, groupIdx, qIdx, "correctAnswer", value)}
                                      />
                                    ) : (
                                      <FormatInput
                                        value={q.correctAnswer}
                                        onChange={(val) => handleQuestionChange(activeSectionIdx, groupIdx, qIdx, "correctAnswer", val)}
                                        placeholder="Enter exact correct answer..."
                                      />
                                      )}
                                    </>
                                    )}
                                  </div>
                                )}

                                {!['MULTIPLE_CHOICE', 'MULTIPLE_CHOICE_MULTIPLE'].includes(group.type) && (
                                  <div className="md:col-span-2 space-y-1">
                                    <label className="text-[9px] font-bold text-gray-500 uppercase">Explanation / Notes</label>
                                    <FormatTextarea
                                      value={q.explanation}
                                      onChange={(val) => handleQuestionChange(activeSectionIdx, groupIdx, qIdx, "explanation", val)}
                                      rows={2}
                                      placeholder="Provide correct answer explanations..."
                                    />
                                  </div>
                                )}
                              </div>

                              {/* MCQ / CHECKBOX OPTIONS LIST */}
                              {(isMCQ || isCheckbox) && (
                                group.type === "MULTIPLE_CHOICE_MULTIPLE" && qIdx > 0 ? (
                                  <div className="mt-3 bg-slate-50 border border-gray-250 rounded-lg p-3 text-[10px] text-gray-505 font-semibold italic">
                                    Option choices are shared with Question 1. Edit options in the first question card above.
                                  </div>
                                ) : (
                                  <div className="mt-3 bg-white border border-gray-150 rounded-lg p-3 space-y-2.5">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                                      <span className="text-[9px] font-bold text-gray-500 uppercase">Options (Choices) List</span>
                                      <button
                                        type="button"
                                        onClick={() => handleAddMCQOption(activeSectionIdx, groupIdx, qIdx)}
                                        className="px-2 py-0.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-[9px] font-bold text-gray-600 transition select-none"
                                      >
                                        + Add Choice
                                      </button>
                                    </div>

                                    {q.options?.length === 0 && (
                                      <div className="text-[10px] text-gray-400 font-semibold py-1">No choices configured yet. Click Add Choice.</div>
                                    )}

                                    <div className="space-y-1.5">
                                      {q.options?.map((opt, optionIdx) => {
                                        const labelChar = String.fromCharCode(65 + optionIdx);
                                        return (
                                          <div key={optionIdx} className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-slate-100 text-[10px] font-black text-gray-500 flex items-center justify-center shrink-0">
                                              {labelChar}
                                            </span>
                                            <FormatInput
                                              value={opt}
                                              onChange={(val) => handleMCQOptionChange(activeSectionIdx, groupIdx, qIdx, optionIdx, val)}
                                              className="flex-grow h-7 px-2 border border-gray-300 rounded text-xs text-gray-700 bg-white font-medium pr-8"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveMCQOption(activeSectionIdx, groupIdx, qIdx, optionIdx)}
                                              className="text-gray-400 hover:text-rose-500 transition p-1 shrink-0"
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

                              {group.type === "MULTIPLE_CHOICE" && (
                                <div className="mt-3 grid grid-cols-1 gap-4 rounded-lg border border-blue-100 bg-blue-50/40 p-3 md:grid-cols-2">
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-[#1B3A6B]">Correct Answer</label>
                                    <MultipleChoiceCorrectAnswerSelect
                                      value={q.correctAnswer}
                                      options={q.options ?? []}
                                      usedOptions={[]}
                                      onChange={(value) => handleQuestionChange(activeSectionIdx, groupIdx, qIdx, "correctAnswer", value)}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-[#1B3A6B]">Explanation / Notes</label>
                                    <FormatTextarea
                                      value={q.explanation}
                                      onChange={(val) => handleQuestionChange(activeSectionIdx, groupIdx, qIdx, "explanation", val)}
                                      rows={2}
                                      placeholder="Explain why this option is correct..."
                                    />
                                  </div>
                                </div>
                              )}

                              {group.type === "MULTIPLE_CHOICE_MULTIPLE" && qIdx === 0 && (
                                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-xs font-extrabold text-[#173967]">Correct Answers</p>
                                      <p className="mt-0.5 text-[10px] text-[#173967]/75">Select two different correct choices after adding the A–E options above.</p>
                                    </div>
                                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-[#173967]">2 required</span>
                                  </div>
                                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {group.questions.slice(0, 2).map((question, questionIndex) => (
                                      <div key={`two-answer-${questionIndex}`} className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-[#173967]">Answer {questionIndex + 1} — Q{question.questionNumber}</label>
                                        <MultipleChoiceCorrectAnswerSelect
                                          value={question.correctAnswer}
                                          options={group.questions[0]?.options ?? []}
                                          usedOptions={group.questions.filter((_, index) => index !== questionIndex).map((item) => item.correctAnswer)}
                                          onChange={(value) => handleQuestionChange(activeSectionIdx, groupIdx, questionIndex, "correctAnswer", value)}
                                        />
                                        <label className="block pt-1 text-[10px] font-black uppercase text-[#173967]">Explanation / Notes</label>
                                        <FormatTextarea
                                          value={question.explanation}
                                          onChange={(value) => handleQuestionChange(activeSectionIdx, groupIdx, questionIndex, "explanation", value)}
                                          rows={2}
                                          placeholder="Explain why this option is correct..."
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {group.type !== "MULTIPLE_CHOICE_MULTIPLE" && <div className="border-t border-gray-200 pt-3">
                                <button
                                  type="button"
                                  onClick={() => addQuestionToGroup(activeSectionIdx, groupIdx)}
                                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-blue-300 bg-white px-3 py-2 text-[11px] font-bold text-[#1B3A6B] transition hover:border-[#1B3A6B] hover:bg-blue-50"
                                >
                                  <IconPlus size={14} /> Add Question &amp; Answer Below
                                </button>
                              </div>}
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-5 border-t border-gray-200 pt-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-[#1B3A6B]">
                              <IconEye size={15} /> Live Student Preview
                            </p>
                            <p className="mt-1 text-[10px] text-gray-500">This is how the selected question type appears in the exam.</p>
                          </div>
                          <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-bold text-gray-600">
                            {QUESTION_GROUP_TYPES.find((type) => type.value === group.type)?.label || group.type}
                          </span>
                        </div>
                        <div className="min-h-32 overflow-x-auto rounded-xl border border-gray-200 bg-white p-4 md:p-6">
                          <ListeningQuestionRenderer
                            group={createPreviewGroup(group, activeSectionIdx, groupIdx)}
                            answers={{}}
                            onAnswer={() => undefined}
                            sectionIndex={activeSectionIdx}
                            showSectionHeader
                          />
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {activeSection.questionGroups.length > 1 && (
                <div className="mt-8 overflow-hidden rounded-2xl border border-slate-300 bg-slate-100 p-5 md:p-7">
                  <div className="mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-800">
                    <IconEye size={17} /> Part {activeSectionIdx + 1} Combined Student Preview
                  </div>
                  <div className="bg-white p-5 font-[Arial,sans-serif] text-black md:p-7">
                    <div className="mb-5 border-b border-gray-300 pb-3 text-sm font-bold uppercase tracking-wide">
                      <span>Section {activeSectionIdx + 1}</span>
                      <span className="ml-5 italic normal-case">
                        Questions {getSectionQuestionRange(activeSectionIdx).start}–{getSectionQuestionRange(activeSectionIdx).end}
                      </span>
                    </div>
                    <div className="space-y-7">
                      {activeSection.questionGroups.map((group, groupIdx) => (
                        <div key={`combined-preview-${groupIdx}`} className="border-b border-gray-200 pb-7 last:border-b-0 last:pb-0">
                          <ListeningQuestionRenderer
                            group={createPreviewGroup(group, activeSectionIdx, groupIdx)}
                            answers={{}}
                            onAnswer={() => undefined}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </form>
    </div>
  );
}

export default function CreateListeningExamPage() {
  return <ListeningCreatorWorkspace />;
}
