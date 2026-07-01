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
  IconTable,
  IconPhoto,
} from "@tabler/icons-react";
import VisualNotesBuilder from "@/components/shared/VisualNotesBuilder";

// List of all IELTS question types supported
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

interface VisualTableBuilderProps {
  value: string;
  onChange: (val: string) => void;
}

function VisualTableBuilder({ value, onChange }: VisualTableBuilderProps) {
  const initialGrid = React.useMemo(() => {
    if (!value.trim()) {
      return [
        ["Header 1", "Header 2", "Header 3"],
        ["Text Details", "Restored in [1]", "Steps [2]"],
        ["Row 2 Col 1", "Row 2 Col 2", "Row 2 Col 3"]
      ];
    }
    const lines = value.trim().split("\n");
    const grid: string[][] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        const cells = trimmed
          .split("|")
          .slice(1, -1)
          .map((cell) => cell.trim());
        const isSeparator = cells.every((cell) => /^[-:\s]+$/.test(cell));
        if (!isSeparator) {
          grid.push(cells);
        }
      }
    }
    if (grid.length === 0) {
      return [["Header 1"], [""]];
    }
    return grid;
  }, [value]);

  const [grid, setGrid] = useState<string[][]>(initialGrid);
  const [isRaw, setIsRaw] = useState(false);

  useEffect(() => {
    setGrid(initialGrid);
  }, [initialGrid]);

  const updateMarkdown = (newGrid: string[][]) => {
    if (newGrid.length === 0) {
      onChange("");
      return;
    }
    const headers = newGrid[0];
    const separator = headers.map(() => "---");
    const rows = newGrid.slice(1);

    const mdLines = [
      `| ${headers.join(" | ")} |`,
      `| ${separator.join(" | ")} |`,
      ...rows.map((row) => `| ${row.join(" | ")} |`)
    ];
    onChange(mdLines.join("\n"));
  };

  const handleCellChange = (rIdx: number, cIdx: number, val: string) => {
    const next = grid.map((row, r) =>
      row.map((cell, c) => (r === rIdx && c === cIdx ? val : cell))
    );
    setGrid(next);
    updateMarkdown(next);
  };

  const addColumn = () => {
    const next = grid.map((row, rIdx) => [...row, rIdx === 0 ? `Header ${row.length + 1}` : ""]);
    setGrid(next);
    updateMarkdown(next);
  };

  const removeColumn = (cIdx: number) => {
    if (grid[0].length <= 1) return;
    const next = grid.map((row) => row.filter((_, c) => c !== cIdx));
    setGrid(next);
    updateMarkdown(next);
  };

  const addRow = () => {
    const numCols = grid[0].length;
    const next = [...grid, Array(numCols).fill("")];
    setGrid(next);
    updateMarkdown(next);
  };

  const removeRow = (rIdx: number) => {
    if (grid.length <= 2) return;
    const next = grid.filter((_, r) => r !== rIdx);
    setGrid(next);
    updateMarkdown(next);
  };

  const resetTable = () => {
    const defaultGrid = [
      ["Header 1", "Header 2", "Header 3"],
      ["", "", ""],
      ["", "", ""]
    ];
    setGrid(defaultGrid);
    updateMarkdown(defaultGrid);
  };

  return (
    <div className="space-y-3 p-4 bg-slate-50 border border-blue-100 rounded-xl w-full">
      <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-150">
        <div className="flex items-center gap-2">
          <IconTable className="text-blue-600 shrink-0" size={18} />
          <span className="text-xs font-bold text-gray-800">Visual Table Editor</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsRaw(!isRaw)}
            className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-200 transition"
          >
            {isRaw ? "Visual Mode" : "Markdown Mode"}
          </button>
          {!isRaw && (
            <>
              <button
                type="button"
                onClick={addColumn}
                className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-[#1B3A6B] rounded-lg border border-blue-100 hover:bg-blue-100/70 transition"
              >
                + Col
              </button>
              <button
                type="button"
                onClick={addRow}
                className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-[#1B3A6B] rounded-lg border border-blue-100 hover:bg-blue-100/70 transition"
              >
                + Row
              </button>
              <button
                type="button"
                onClick={resetTable}
                className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-600 rounded-lg border border-rose-100 hover:bg-rose-100/70 transition"
              >
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      {isRaw ? (
        <textarea
          rows={5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="| Column 1 | Column 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |"
          className="w-full text-xs font-semibold px-3.5 py-2 border border-blue-100 rounded-lg bg-white focus:outline-none focus:border-blue-400 text-black font-mono resize-y"
        />
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm w-full">
          <table className="min-w-full divide-y divide-gray-200 text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70">
                {grid[0].map((headerVal, cIdx) => (
                  <th key={cIdx} className="p-2 border-r border-gray-200 last:border-r-0 min-w-[120px]">
                    <div className="flex items-center gap-1 bg-white border border-gray-250 rounded px-1.5 py-0.5">
                      <input
                        type="text"
                        value={headerVal}
                        onChange={(e) => handleCellChange(0, cIdx, e.target.value)}
                        className="w-full text-xs font-bold text-gray-800 bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeColumn(cIdx)}
                        disabled={grid[0].length <= 1}
                        className="text-gray-400 hover:text-red-500 disabled:opacity-35 font-bold text-xs shrink-0"
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
                    {row.map((cellVal, cIdx) => (
                      <td key={cIdx} className="p-2 border-r border-gray-200 last:border-r-0">
                        <input
                          type="text"
                          value={cellVal}
                          onChange={(e) => handleCellChange(actualRowIdx, cIdx, e.target.value)}
                          placeholder="e.g. text [1]"
                          className="w-full text-xs bg-transparent focus:outline-none focus:bg-white px-2 py-1 border border-transparent focus:border-blue-300 rounded text-black font-semibold placeholder:text-gray-300 placeholder:font-normal"
                        />
                      </td>
                    ))}
                    <td className="p-2 text-center w-8">
                      <button
                        type="button"
                        onClick={() => removeRow(actualRowIdx)}
                        disabled={grid.length <= 2}
                        className="text-gray-400 hover:text-red-500 disabled:opacity-35 text-xs"
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

      <p className="text-[10px] text-gray-500 bg-white p-2 rounded-lg border border-gray-150 flex items-center gap-1 font-medium leading-relaxed">
        <IconInfoCircle size={14} className="text-blue-500 shrink-0" />
        <span>Type text into any cell. Write <strong>[1]</strong>, <strong>[2]</strong>, etc., to insert blank input boxes matching the question numbers.</span>
      </p>
    </div>
  );
}

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

export default function CreateListeningExamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const editExamId = searchParams.get("edit");

  // Form State
  const [formState, setFormState] = useState<ExamForm>({
    title: "",
    description: "",
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

  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingGroupImage, setUploadingGroupImage] = useState<{ sectionIdx: number; groupIdx: number } | null>(null);

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
    if (editExamResponse?.data) {
      const exam = editExamResponse.data;
      
      // Ensure all 4 sections are represented correctly
      const mappedSections = [1, 2, 3, 4].map((order) => {
        const existingSec = exam.sections?.find((s: any) => s.order === order);
        if (existingSec) {
          return {
            title: existingSec.title || `Section ${order}`,
            audioUrl: existingSec.audioUrl || "",
            youtubeUrl: existingSec.youtubeUrl || "",
            script: existingSec.script || "",
            instruction: existingSec.instruction || "",
            order: existingSec.order || order,
            questionGroups: (existingSec.questionGroups ?? []).map((g: any) => ({
              type: g.type || "SENTENCE_COMPLETION",
              instruction: g.instruction || "",
              passageSegment: g.passageSegment || "",
              options: g.options || [],
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
        return getBlankSectionState(order, `Section ${order}`);
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

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => listeningService.createExam(payload),
    onSuccess: () => {
      toast.success("Listening Exam created successfully!");
      queryClient.invalidateQueries({ queryKey: ["teacher-listening-exams"] });
      router.push("/teacher/listening/exams");
    },
    onError: (err: any) => {
      toast.error("Failed to create exam: " + (err?.response?.data?.message || err.message));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => listeningService.updateExam(editExamId!, payload),
    onSuccess: () => {
      toast.success("Listening Exam updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["teacher-listening-exams"] });
      router.push("/teacher/listening/exams");
    },
    onError: (err: any) => {
      toast.error("Failed to update exam: " + (err?.response?.data?.message || err.message));
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

  const handleSectionChange = (sectionIdx: number, field: keyof Section, val: any) => {
    setFormState((prev) => {
      const nextSecs = [...prev.sections];
      nextSecs[sectionIdx] = { ...nextSecs[sectionIdx], [field]: val };
      return { ...prev, sections: nextSecs };
    });
  };

  const addQuestionGroup = (sectionIdx: number) => {
    setFormState((prev) => {
      const nextSecs = [...prev.sections];
      const section = nextSecs[sectionIdx];
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
      
      section.questionGroups = [...section.questionGroups, newGroup];
      return { ...prev, sections: nextSecs };
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
      return { ...prev, sections: nextSecs };
    });
  };

  // Add / Remove Questions inside group
  const addQuestionToGroup = (sectionIdx: number, groupIdx: number) => {
    setFormState((prev) => {
      const nextSecs = [...prev.sections];
      const group = nextSecs[sectionIdx].questionGroups[groupIdx];

      // Auto suggest next sequential question number
      let nextNum = 1;
      const allExQuestions = nextSecs.flatMap((s) => s.questionGroups.flatMap((g) => g.questions));
      if (allExQuestions.length > 0) {
        nextNum = Math.max(...allExQuestions.map((q) => q.questionNumber)) + 1;
      }

      const firstQOptions = group.questions[0]?.options ?? [];

      const newQ: Question = {
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.title) {
      toast.error("Please provide an exam title.");
      return;
    }

    if (!formState.audioUrl) {
      toast.error("Please upload an audio file for the listening exam.");
      return;
    }

    // Client-side validations for IELTS structure (total 40 questions validation warning)
    const totalQuestions = formState.sections.flatMap((s) => s.questionGroups.flatMap((g) => g.questions)).length;
    if (totalQuestions !== 40) {
      toast.warning(`Note: This listening exam currently has ${totalQuestions} questions. Standard IELTS tests have exactly 40 questions.`);
    }

    const payload = {
      title: formState.title,
      description: formState.description,
      duration: Number(formState.duration),
      isPublished: formState.isPublished,
      sections: formState.sections.map((s) => ({
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
        })),
      })),
    };

    if (editExamId) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

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
    <div className="max-w-6xl mx-auto w-full p-4 md:p-6 font-sans space-y-6">
      
      {/* HEADER BANNER */}
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
          <button
            type="button"
            onClick={() => handleInputChange("isPublished", !formState.isPublished)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
              formState.isPublished
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-250 hover:bg-amber-100"
            }`}
          >
            {formState.isPublished ? "Published" : "Draft Status"}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="px-4.5 py-2.5 bg-[#1B3A6B] hover:bg-[#152e54] text-white rounded-lg text-xs font-black shadow transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {isPending ? (
              <IconLoader2 size={14} className="animate-spin" />
            ) : (
              <IconCheck size={14} />
            )}
            <span>Save Exam</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
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
        </div>

        {/* RIGHT COLUMN: ACTIVE SECTION & QUESTIONS WORKSPACE */}
        <div className="lg:col-span-2 space-y-6">
          
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
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Question Format Type</label>
                          <select
                            value={group.type}
                            onChange={(e) => handleGroupChange(activeSectionIdx, groupIdx, "type", e.target.value)}
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
                            handleGroupChange(activeSectionIdx, groupIdx, "instruction", serialized);
                          };

                          return (
                            <div className="space-y-3 md:col-span-2 bg-slate-50 p-4 rounded-xl border border-gray-200">
                              <span className="text-[10px] font-extrabold uppercase text-[#1B3A6B] tracking-wider block mb-1">
                                IELTS Block Header Configuration (4 Header Fields)
                              </span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-gray-500 uppercase">1. Question Range (e.g. Questions 11–15)</label>
                                  <FormatInput
                                    value={parsed.range}
                                    onChange={(val) => updateField("range", val)}
                                    placeholder="e.g. Questions 11–15"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-gray-500 uppercase">2. Question Title/Heading (Centered)</label>
                                  <FormatInput
                                    value={parsed.heading}
                                    onChange={(val) => updateField("heading", val)}
                                    placeholder="e.g. Stanthorpe Twinning Association"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-gray-500 uppercase">3. Instruction Line 1 (Italic)</label>
                                  <FormatInput
                                    value={parsed.inst1}
                                    onChange={(val) => updateField("inst1", val)}
                                    placeholder="e.g. Choose the correct letter, A, B or C."
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-gray-500 uppercase">4. Instruction Line 2 (Italic)</label>
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
                        {(group.type === "MATCHING_FEATURES" || group.type === "SUMMARY_COMPLETION") && (
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">
                              Block Options List (one option per line)
                            </label>
                            <FormatTextarea
                              value={group.options?.join("\n") || ""}
                              onChange={(val) => handleGroupChange(activeSectionIdx, groupIdx, "options", val.split("\n"))}
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
                          <span className="text-xs font-extrabold uppercase text-gray-500">
                            Questions ({group.questions.length})
                          </span>
                          
                          <button
                            type="button"
                            onClick={() => addQuestionToGroup(activeSectionIdx, groupIdx)}
                            className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 bg-white text-gray-600 hover:text-black rounded hover:bg-gray-50 text-[10px] font-bold transition shadow-sm select-none active:scale-[0.98]"
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
                                {!["TABLE_COMPLETION", "NOTES_COMPLETION", "FLOW_CHART_COMPLETION", "SUMMARY_COMPLETION"].includes(group.type) ? (
                                  <>
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-gray-500 uppercase">Question Prompt / Text</label>
                                      <FormatInput
                                        value={q.questionText}
                                        onChange={(val) => handleQuestionChange(activeSectionIdx, groupIdx, qIdx, "questionText", val)}
                                        placeholder="e.g. Farm shop / Given name: John..."
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-gray-500 uppercase">Correct Answer</label>
                                      <FormatInput
                                        value={q.correctAnswer}
                                        onChange={(val) => handleQuestionChange(activeSectionIdx, groupIdx, qIdx, "correctAnswer", val)}
                                        placeholder="Enter exact correct answer..."
                                      />
                                    </div>
                                  </>
                                ) : (
                                  <div className="md:col-span-2 space-y-1">
                                    <label className="text-[9px] font-bold text-gray-500 uppercase">Correct Answer</label>
                                    <FormatInput
                                      value={q.correctAnswer}
                                      onChange={(val) => handleQuestionChange(activeSectionIdx, groupIdx, qIdx, "correctAnswer", val)}
                                      placeholder="Enter exact correct answer..."
                                    />
                                  </div>
                                )}

                                <div className="md:col-span-2 space-y-1">
                                  <label className="text-[9px] font-bold text-gray-500 uppercase">Explanation / Notes</label>
                                  <FormatInput
                                    value={q.explanation}
                                    onChange={(val) => handleQuestionChange(activeSectionIdx, groupIdx, qIdx, "explanation", val)}
                                    placeholder="Provide correct answer explanations..."
                                  />
                                </div>
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
      </form>
    </div>
  );
}
