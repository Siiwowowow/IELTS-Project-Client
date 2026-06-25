/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { writingService } from "@/services/writing.services";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconUpload,
  IconLoader2,
  IconPhoto,
  IconFileText,
  IconCheck,
  IconInfoCircle,
  IconPencil,
  IconTrash,
  IconSparkles,
  IconChartBar,
  IconWriting,
  IconBold,
} from "@tabler/icons-react";

// ─── Types ───────────────────────────────────────────────────────
type WritingExamType = "ACADEMIC" | "GENERAL_TRAINING";

interface TaskForm {
  taskType: "TASK_1" | "TASK_2";
  instruction: string;
  imageUrl: string;
  pdfUrl: string;
  minWords: number;
  modelAnswer: string;
  order: number;
}

interface ExamForm {
  title: string;
  description: string;
  examType: WritingExamType;
  duration: number;
  isPublished: boolean;
  tasks: TaskForm[];
}

// ─── Defaults ────────────────────────────────────────────────────
const getDefaultTask1 = (): TaskForm => ({
  taskType: "TASK_1",
  instruction: "",
  imageUrl: "",
  pdfUrl: "",
  minWords: 150,
  modelAnswer: "",
  order: 1,
});

const getDefaultTask2 = (): TaskForm => ({
  taskType: "TASK_2",
  instruction: "",
  imageUrl: "",
  pdfUrl: "",
  minWords: 250,
  modelAnswer: "",
  order: 2,
});

const getDefaultForm = (): ExamForm => ({
  title: "",
  description: "",
  examType: "ACADEMIC",
  duration: 60,
  isPublished: false,
  tasks: [getDefaultTask1(), getDefaultTask2()],
});

// ─── Word Count Helper ──────────────────────────────────────────
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

// ─── Main Page Component ────────────────────────────────────────
export default function CreateWritingExamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const editExamId = searchParams.get("edit");

  const [formState, setFormState] = useState<ExamForm>(getDefaultForm());
  const [activeTask, setActiveTask] = useState<0 | 1>(0); // 0 = Task 1, 1 = Task 2
  const [uploadingImage, setUploadingImage] = useState<number | null>(null); // task index
  const [uploadingPdf, setUploadingPdf] = useState<number | null>(null);

  // ── Fetch exam for edit mode ──
  const { data: editExamResponse, isLoading: editLoading } = useQuery({
    queryKey: ["writing-exam-edit", editExamId],
    queryFn: () => writingService.getExamById(editExamId!),
    enabled: !!editExamId,
  });

  useEffect(() => {
    if (editExamResponse?.data) {
      const exam = editExamResponse.data;
      const task1 =
        exam.tasks?.find((t: any) => t.taskType === "TASK_1") || null;
      const task2 =
        exam.tasks?.find((t: any) => t.taskType === "TASK_2") || null;

      setFormState({
        title: exam.title || "",
        description: exam.description || "",
        examType: exam.examType || "ACADEMIC",
        duration: exam.duration || 60,
        isPublished: exam.isPublished || false,
        tasks: [
          {
            taskType: "TASK_1",
            instruction: task1?.instruction || "",
            imageUrl: task1?.imageUrl || "",
            pdfUrl: task1?.pdfUrl || "",
            minWords: task1?.minWords ?? 150,
            modelAnswer: task1?.modelAnswer || "",
            order: 1,
          },
          {
            taskType: "TASK_2",
            instruction: task2?.instruction || "",
            imageUrl: task2?.imageUrl || "",
            pdfUrl: task2?.pdfUrl || "",
            minWords: task2?.minWords ?? 250,
            modelAnswer: task2?.modelAnswer || "",
            order: 2,
          },
        ],
      });
    }
  }, [editExamResponse]);

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (payload: any) => writingService.createExam(payload),
    onSuccess: () => {
      toast.success("Writing Exam created successfully!");
      queryClient.invalidateQueries({ queryKey: ["teacher-writing-exams"] });
      router.push("/teacher/writing/exams");
    },
    onError: (err: any) => {
      toast.error(
        "Failed to create exam: " +
          (err?.response?.data?.message || err.message)
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) =>
      writingService.updateExam(editExamId!, payload),
    onSuccess: () => {
      toast.success("Writing Exam updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["teacher-writing-exams"] });
      router.push("/teacher/writing/exams");
    },
    onError: (err: any) => {
      toast.error(
        "Failed to update exam: " +
          (err?.response?.data?.message || err.message)
      );
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  // ── File Upload ──
  const handleImageUpload = async (taskIdx: number, file: File) => {
    if (!file) return;
    setUploadingImage(taskIdx);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await writingService.uploadFile(formData);
      setFormState((prev) => {
        const nextTasks = [...prev.tasks];
        nextTasks[taskIdx] = { ...nextTasks[taskIdx], imageUrl: res.data.url };
        return { ...prev, tasks: nextTasks };
      });
      toast.success("Image uploaded successfully!");
    } catch (err: any) {
      toast.error(
        "Failed to upload image: " +
          (err?.response?.data?.message || err.message)
      );
    } finally {
      setUploadingImage(null);
    }
  };

  const handlePdfUpload = async (taskIdx: number, file: File) => {
    if (!file) return;
    setUploadingPdf(taskIdx);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await writingService.uploadFile(formData);
      setFormState((prev) => {
        const nextTasks = [...prev.tasks];
        nextTasks[taskIdx] = { ...nextTasks[taskIdx], pdfUrl: res.data.url };
        return { ...prev, tasks: nextTasks };
      });
      toast.success("PDF uploaded successfully!");
    } catch (err: any) {
      toast.error(
        "Failed to upload PDF: " +
          (err?.response?.data?.message || err.message)
      );
    } finally {
      setUploadingPdf(null);
    }
  };

  // ── State Modifiers ──
  const handleExamChange = (field: keyof ExamForm, val: any) => {
    setFormState((prev) => ({ ...prev, [field]: val }));
  };

  const handleTaskChange = (
    taskIdx: number,
    field: keyof TaskForm,
    val: any
  ) => {
    setFormState((prev) => {
      const nextTasks = [...prev.tasks];
      nextTasks[taskIdx] = { ...nextTasks[taskIdx], [field]: val };
      return { ...prev, tasks: nextTasks };
    });
  };

  // ── Submit ──
  const handleSubmit = () => {
    // Validation
    if (!formState.title.trim()) {
      toast.error("Please enter an exam title.");
      return;
    }
    if (!formState.tasks[0].instruction.trim()) {
      toast.error("Please enter Task 1 instruction/prompt.");
      return;
    }
    if (!formState.tasks[1].instruction.trim()) {
      toast.error("Please enter Task 2 instruction/prompt.");
      return;
    }

    const payload = {
      title: formState.title.trim(),
      description: formState.description.trim() || undefined,
      examType: formState.examType,
      duration: formState.duration,
      isPublished: formState.isPublished,
      tasks: formState.tasks.map((t) => ({
        taskType: t.taskType,
        instruction: t.instruction.trim(),
        imageUrl: t.imageUrl || undefined,
        pdfUrl: t.pdfUrl || undefined,
        minWords: t.minWords,
        modelAnswer: t.modelAnswer.trim() || undefined,
        order: t.order,
      })),
    };

    if (editExamId) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  // ── Loading state for edit mode ──
  if (editExamId && editLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <IconLoader2 size={40} className="animate-spin text-indigo-600" />
        <p className="text-sm font-bold text-gray-500">
          Loading exam data for editing...
        </p>
      </div>
    );
  }

  const task1 = formState.tasks[0];
  const task2 = formState.tasks[1];

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full pb-12">
      {/* ── Header Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900 via-indigo-800 to-slate-900 p-6 md:p-8 text-white shadow-xl shadow-indigo-950/20">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl"></div>
        <div className="absolute left-1/3 bottom-0 -mb-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-xs font-bold text-violet-200 uppercase tracking-widest">
              <IconSparkles size={12} className="text-amber-400" />
              <span>Writing Module</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              {editExamId
                ? "Edit Writing Exam"
                : "Create IELTS Writing Exam"}
            </h1>
            <p className="text-indigo-200/80 text-sm max-w-xl font-medium">
              Academic Writing — Task 1 (chart/graph/diagram, 150+ words) &
              Task 2 (essay, 250+ words). Total duration: 60 minutes.
            </p>
          </div>

          <button
            onClick={() => router.push("/teacher/writing/exams")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/10 transition-all duration-200 self-start md:self-auto shrink-0"
          >
            <IconArrowLeft size={16} />
            <span>My Exams</span>
          </button>
        </div>
      </div>

      {/* ── Exam Metadata Card ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <h2 className="font-black text-gray-900 text-base flex items-center gap-2">
            <IconFileText size={18} className="text-indigo-600" />
            Exam Details
          </h2>
        </div>
        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Exam Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formState.title}
              onChange={(e) => handleExamChange("title", e.target.value)}
              placeholder="e.g. Cambridge IELTS 18 — Academic Writing Test 1"
              className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-white font-semibold text-gray-800 placeholder:text-gray-400 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              value={formState.description}
              onChange={(e) =>
                handleExamChange("description", e.target.value)
              }
              placeholder="Briefly describe this writing test..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-white font-medium text-gray-800 placeholder:text-gray-400 resize-none transition-all"
            />
          </div>

          {/* Row: Type / Duration / Published */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Exam Type */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Exam Type
              </label>
              <select
                value={formState.examType}
                onChange={(e) =>
                  handleExamChange(
                    "examType",
                    e.target.value as WritingExamType
                  )
                }
                className="w-full h-11 px-3 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-white font-semibold text-gray-800 cursor-pointer transition-all"
              >
                <option value="ACADEMIC">Academic</option>
                <option value="GENERAL_TRAINING">General Training</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={formState.duration}
                onChange={(e) =>
                  handleExamChange("duration", parseInt(e.target.value) || 60)
                }
                min={1}
                className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-white font-semibold text-gray-800 transition-all"
              />
            </div>

            {/* Published Toggle */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Status
              </label>
              <button
                type="button"
                onClick={() =>
                  handleExamChange("isPublished", !formState.isPublished)
                }
                className={`w-full h-11 px-4 rounded-xl text-sm font-bold border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                  formState.isPublished
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                    : "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                }`}
              >
                {formState.isPublished ? (
                  <>
                    <IconCheck size={16} className="stroke-[3]" />
                    Published
                  </>
                ) : (
                  <>
                    <IconPencil size={16} />
                    Draft
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Task Tabs ── */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTask(0)}
          className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-black border-2 transition-all duration-200 ${
            activeTask === 0
              ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm shadow-indigo-100"
              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
          }`}
        >
          <IconChartBar
            size={18}
            className={activeTask === 0 ? "text-indigo-500" : "text-gray-400"}
          />
          <span>Task 1</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTask === 0
                ? "bg-indigo-100 text-indigo-600"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {formState.examType === "ACADEMIC"
              ? "Chart / Graph"
              : "Letter"}
          </span>
          {task1.instruction.trim() && (
            <IconCheck
              size={14}
              className="text-emerald-500 stroke-[3] ml-1"
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTask(1)}
          className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-black border-2 transition-all duration-200 ${
            activeTask === 1
              ? "bg-violet-50 border-violet-300 text-violet-700 shadow-sm shadow-violet-100"
              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
          }`}
        >
          <IconWriting
            size={18}
            className={activeTask === 1 ? "text-violet-500" : "text-gray-400"}
          />
          <span>Task 2</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTask === 1
                ? "bg-violet-100 text-violet-600"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            Essay
          </span>
          {task2.instruction.trim() && (
            <IconCheck
              size={14}
              className="text-emerald-500 stroke-[3] ml-1"
            />
          )}
        </button>
      </div>

      {/* ── Task 1 Panel ── */}
      {activeTask === 0 && (
        <TaskPanel
          task={task1}
          taskIdx={0}
          examType={formState.examType}
          onTaskChange={handleTaskChange}
          onImageUpload={handleImageUpload}
          onPdfUpload={handlePdfUpload}
          uploadingImage={uploadingImage}
          uploadingPdf={uploadingPdf}
        />
      )}

      {/* ── Task 2 Panel ── */}
      {activeTask === 1 && (
        <TaskPanel
          task={task2}
          taskIdx={1}
          examType={formState.examType}
          onTaskChange={handleTaskChange}
          onImageUpload={handleImageUpload}
          onPdfUpload={handlePdfUpload}
          uploadingImage={uploadingImage}
          uploadingPdf={uploadingPdf}
        />
      )}

      {/* ── Submit Button ── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/teacher/writing/exams")}
          className="px-6 py-3 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="px-8 py-3 rounded-xl text-sm font-black text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
        >
          {isPending ? (
            <>
              <IconLoader2 size={16} className="animate-spin" />
              <span>{editExamId ? "Updating..." : "Creating..."}</span>
            </>
          ) : (
            <>
              <IconCheck size={16} className="stroke-[3]" />
              <span>
                {editExamId ? "Update Exam" : "Create Writing Exam"}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Task Panel Component ────────────────────────────────────────
interface TaskPanelProps {
  task: TaskForm;
  taskIdx: number;
  examType: WritingExamType;
  onTaskChange: (taskIdx: number, field: keyof TaskForm, val: any) => void;
  onImageUpload: (taskIdx: number, file: File) => void;
  onPdfUpload: (taskIdx: number, file: File) => void;
  uploadingImage: number | null;
  uploadingPdf: number | null;
}

function TaskPanel({
  task,
  taskIdx,
  examType,
  onTaskChange,
  onImageUpload,
  onPdfUpload,
  uploadingImage,
  uploadingPdf,
}: TaskPanelProps) {
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
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Task Header */}
      <div
        className={`px-6 py-4 border-b border-gray-100 ${
          isTask1
            ? "bg-gradient-to-r from-indigo-50 to-white"
            : "bg-gradient-to-r from-violet-50 to-white"
        }`}
      >
        <h2 className="font-black text-gray-900 text-base flex items-center gap-2">
          {isTask1 ? (
            <IconChartBar size={18} className="text-indigo-600" />
          ) : (
            <IconWriting size={18} className="text-violet-600" />
          )}
          {taskLabel}
        </h2>
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

        {/* Image Upload (Task 1 Academic primarily, but available for all) */}
        {isTask1 && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Visual Stimulus (Chart / Graph / Diagram / Map)
            </label>

            {task.imageUrl ? (
              <div className="relative group rounded-xl overflow-hidden border-2 border-indigo-100 bg-gray-50">
                <img
                  src={task.imageUrl}
                  alt="Task 1 Visual Stimulus"
                  className="w-full max-h-72 object-contain bg-white p-2"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onTaskChange(taskIdx, "imageUrl", "")}
                    className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-1.5 hover:bg-rose-700 transition"
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
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">
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
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
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
