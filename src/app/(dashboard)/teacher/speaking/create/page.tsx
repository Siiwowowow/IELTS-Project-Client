/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { speakingService } from "@/services/speaking.services";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconPlus,
  IconTrash,
  IconUpload,
  IconLoader2,
  IconCheck,
  IconInfoCircle,
  IconMicrophone,
  IconFolderPlus,
} from "@tabler/icons-react";

interface Question {
  id?: string;
  questionText: string;
  audioUrl?: string | null;
  order: number;
}

interface SpeakingPart {
  id?: string;
  partNumber: number;
  title: string;
  instruction?: string | null;
  preparationTime: number;
  speakingTime: number;
  order: number;
  questions: Question[];
}

interface ExamForm {
  title: string;
  description: string;
  duration: number;
  isPublished: boolean;
  parts: SpeakingPart[];
}

function SpeakingBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const queryClient = useQueryClient();

  const [isLoadingExam, setIsLoadingExam] = useState(false);
  const [activeTab, setActiveTab] = useState(1);

  // Core form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(15);
  const [isPublished, setIsPublished] = useState(false);

  // Parts list (IELTS has exactly 3 parts)
  const [parts, setParts] = useState<SpeakingPart[]>([
    {
      partNumber: 1,
      title: "Part 1: Introduction and Interview",
      instruction: "The examiner will ask you general questions about yourself, your home, family, studies, or interests.",
      preparationTime: 0,
      speakingTime: 60,
      order: 1,
      questions: [
        { questionText: "Can you tell me about your hometown?", order: 1 },
        { questionText: "What do you like most about your studies or job?", order: 2 },
      ],
    },
    {
      partNumber: 2,
      title: "Part 2: Individual Long Turn (Cue Card)",
      instruction: "Describe a book you read recently that made a strong impression on you.\n\nYou should say:\n- What the book was about\n- When you read it\n- Why you chose to read it\n- And explain why it impressed you so much.",
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
      instruction: "The examiner will ask you further questions related to the topic in Part 2.",
      preparationTime: 0,
      speakingTime: 60,
      order: 3,
      questions: [
        { questionText: "Do you think children should be encouraged to read more books?", order: 1 },
        { questionText: "How has the internet changed the reading habits of people?", order: 2 },
      ],
    },
  ]);

  // Load speaking exam details if editing
  useEffect(() => {
    if (!editId) return;

    const fetchExamDetails = async () => {
      setIsLoadingExam(true);
      try {
        const res = await speakingService.getExamById(editId);
        const examData = res.data;

        setTitle(examData.title);
        setDescription(examData.description || "");
        setDuration(Number(examData.duration) || 15);
        setIsPublished(examData.isPublished);

        if (examData.parts && examData.parts.length > 0) {
          const examParts = examData.parts;
          // Normalize to exactly 3 parts: Part 1, Part 2, Part 3
          const normalizedParts = [1, 2, 3].map((num) => {
            const found = examParts.find((p: any) => p.partNumber === num || p.order === num);
            if (found) {
              return {
                id: found.id,
                partNumber: num,
                title: found.title || (num === 1 ? "Part 1: Introduction and Interview" : num === 2 ? "Part 2: Individual Long Turn (Cue Card)" : "Part 3: Two-way Discussion"),
                instruction: found.instruction || "",
                preparationTime: Number(found.preparationTime) || (num === 2 ? 60 : 0),
                speakingTime: Number(found.speakingTime) || (num === 2 ? 120 : 60),
                order: num,
                questions: found.questions && found.questions.length > 0
                  ? found.questions.map((q: any) => ({
                      id: q.id,
                      questionText: q.questionText,
                      audioUrl: q.audioUrl,
                      order: q.order,
                    }))
                  : (num === 2 ? [{ questionText: "Cue Card Long Turn Response", order: 1 }] : []),
              };
            } else {
              return {
                partNumber: num,
                title: num === 1 ? "Part 1: Introduction and Interview" : num === 2 ? "Part 2: Individual Long Turn (Cue Card)" : "Part 3: Two-way Discussion",
                instruction: num === 1 ? "The examiner will ask you general questions about yourself..." : num === 2 ? "" : "",
                preparationTime: num === 2 ? 60 : 0,
                speakingTime: num === 2 ? 120 : 60,
                order: num,
                questions: num === 2 ? [{ questionText: "Cue Card Long Turn Response", order: 1 }] : [],
              };
            }
          });
          setParts(normalizedParts);
        }
      } catch (err: any) {
        toast.error("Failed to load exam data: " + (err?.response?.data?.message || err.message));
      } finally {
        setIsLoadingExam(false);
      }
    };

    fetchExamDetails();
  }, [editId]);

  // Mutation to create/update exam
  const saveMutation = useMutation({
    mutationFn: (payload: any) => {
      if (editId) {
        return speakingService.updateExam(editId, payload);
      }
      return speakingService.createExam(payload);
    },
    onSuccess: () => {
      toast.success(editId ? "Speaking mock exam updated!" : "Speaking mock exam created!");
      queryClient.invalidateQueries({ queryKey: ["teacher-speaking-exams"] });
      router.push("/teacher/speaking/exams");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to save speaking exam.";
      toast.error(msg);
    },
  });

  // Adding/removing questions within parts
  const handleAddQuestion = (partIdx: number) => {
    setParts((prev) => {
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

  const handleRemoveQuestion = (partIdx: number, qIdx: number) => {
    setParts((prev) => {
      const updated = [...prev];
      const part = updated[partIdx];
      if (!part) return prev;
      part.questions = part.questions.filter((_, idx) => idx !== qIdx);
      // Re-sort orders
      part.questions.forEach((q, idx) => {
        q.order = idx + 1;
      });
      return updated;
    });
  };

  const handleQuestionTextChange = (partIdx: number, qIdx: number, text: string) => {
    setParts((prev) => {
      const updated = [...prev];
      if (updated[partIdx]) {
        updated[partIdx].questions[qIdx].questionText = text;
      }
      return updated;
    });
  };

  const handlePartFieldChange = (partIdx: number, field: keyof SpeakingPart, val: any) => {
    setParts((prev) => {
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter an exam title.");
      return;
    }

    // Force Part 2 to have a dummy question so it passes backend checks if empty
    const validatedParts = parts.map((p) => {
      if (p.partNumber === 2) {
        return {
          ...p,
          questions: [{ questionText: "Cue Card Long Turn Response", order: 1 }],
        };
      }
      return p;
    });

    // Verify Part 1 and Part 3 have questions and none are empty
    for (const p of validatedParts) {
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

    const payload = {
      title,
      description,
      duration: Number(duration),
      isPublished,
      parts: validatedParts.map((p) => ({
        partNumber: p.partNumber,
        title: p.title,
        instruction: p.instruction,
        preparationTime: Number(p.preparationTime),
        speakingTime: Number(p.speakingTime),
        order: p.order,
        questions: p.questions.map((q) => ({
          questionText: q.questionText,
          audioUrl: q.audioUrl,
          order: q.order,
        })),
      })),
    };

    saveMutation.mutate(payload);
  };

  if (isLoadingExam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] bg-slate-50 gap-4">
        <IconLoader2 size={40} className="animate-spin text-rose-500" />
        <p className="text-sm font-bold text-gray-500">Loading speaking exam details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full pb-20 select-text">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/teacher/speaking/exams"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-rose-500 transition"
        >
          <IconArrowLeft size={16} /> Back to My Speaking Exams
        </Link>
        <span className="text-xs font-black text-rose-500 bg-rose-50 border border-rose-100 rounded-full px-3 py-1 uppercase tracking-widest">
          {editId ? "Edit Mode" : "Creation Mode"}
        </span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500 text-white shadow-sm">
              <IconMicrophone size={20} />
            </span>
            {editId ? "Edit Speaking Exam" : "Create Speaking Mock Exam"}
          </h1>
          <p className="text-sm font-bold text-gray-500 mt-1">
            Build structured IELTS Speaking simulation modules with customizable timers and questions.
          </p>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-8">
        {/* Basic metadata */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-rose-600 border-b border-gray-100 pb-2">
            Exam General Metadata
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Exam Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. IELTS Academic Speaking Practice Test 1"
                required
                className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Duration (Minutes)</label>
              <input
                type="number"
                min="1"
                value={isNaN(duration) ? "" : duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                placeholder="15"
                required
                className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black placeholder:text-gray-400"
              />
            </div>

            <div className="md:col-span-3 space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Description / Instructions</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write specific briefing guidelines or target information for student practice..."
                className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black placeholder:text-gray-400 resize-y"
              />
              <span className="text-[10px] text-gray-400 font-bold mt-1 block">Tip: You can use HTML tags like &lt;b&gt;bold text&lt;/b&gt; or &lt;strong&gt;bold text&lt;/strong&gt; to style specific words or lines.</span>
            </div>

            <div className="md:col-span-3 flex items-center gap-3">
              <input
                type="checkbox"
                id="isPublished"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4.5 w-4.5 accent-rose-500 cursor-pointer rounded border-gray-300"
              />
              <label htmlFor="isPublished" className="text-xs font-extrabold text-gray-700 cursor-pointer">
                Publish immediately (Draft mode is hidden from candidate lists)
              </label>
            </div>
          </div>
        </div>

        {/* Dynamic Speaking Parts Sections */}
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h3 className="text-base font-black text-slate-800">Exam Parts (IELTS Speaking Setup)</h3>
          </div>

          {/* 3-Part Tabs Selector */}
          <div className="flex border-2 border-slate-200 bg-slate-100/50 p-1.5 rounded-2xl max-w-3xl mx-auto shadow-xs">
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setActiveTab(num)}
                className={`flex-1 py-3 px-4 text-xs font-black uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === num
                    ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                  activeTab === num ? "bg-white text-rose-600" : "bg-slate-200 text-slate-600"
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
            {activeTab === 1 && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight">
                      {parts[0]?.title || "Part 1: Introduction and Interview"}
                    </h3>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
                      General questions about yourself, home, studies, or interests
                    </p>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-black">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Speaking Limit</span>
                      <span className="text-slate-800 font-extrabold">{parts[0]?.speakingTime || 60} Seconds</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Part 1 Title</label>
                    <input
                      type="text"
                      value={parts[0]?.title || ""}
                      onChange={(e) => handlePartFieldChange(0, "title", e.target.value)}
                      className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Response Recording Limit (Seconds)</label>
                    <input
                      type="number"
                      min="1"
                      value={isNaN(parts[0]?.speakingTime) ? "" : parts[0]?.speakingTime}
                      onChange={(e) => handlePartFieldChange(0, "speakingTime", parseInt(e.target.value) || 0)}
                      className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Part Instructions / Directions</label>
                    <textarea
                      rows={2}
                      value={parts[0]?.instruction || ""}
                      onChange={(e) => handlePartFieldChange(0, "instruction", e.target.value)}
                      placeholder="Provide guidance context for Part 1 questions..."
                      className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black resize-y"
                    />
                    <span className="text-[10px] text-gray-400 font-bold mt-1 block">Tip: You can use HTML tags like &lt;b&gt;bold text&lt;/b&gt; or &lt;strong&gt;bold text&lt;/strong&gt; to style specific words or lines.</span>
                  </div>
                </div>

                {/* Questions Listing */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Interview Questions ({parts[0]?.questions.length || 0})</h4>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion(0)}
                      className="inline-flex items-center gap-1 text-xs font-black text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 transition active:scale-95 cursor-pointer shadow-xs"
                    >
                      <IconPlus size={14} /> Add Question
                    </button>
                  </div>

                  {(!parts[0] || parts[0].questions.length === 0) && (
                    <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-xs font-black text-slate-400 flex items-center justify-center gap-2">
                      <IconInfoCircle size={16} /> No questions added to Part 1 yet. Click "Add Question" above.
                    </div>
                  )}

                  <div className="space-y-3">
                    {parts[0]?.questions.map((q, qIdx) => (
                      <div key={qIdx} className="flex gap-4 items-center animate-fadeIn">
                        <span className="text-xs font-black text-slate-500 shrink-0 w-10">
                          Q{q.order}:
                        </span>
                        <input
                          type="text"
                          value={q.questionText}
                          onChange={(e) => handleQuestionTextChange(0, qIdx, e.target.value)}
                          placeholder="Enter the Part 1 question prompt..."
                          required
                          className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(0, qIdx)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition border border-transparent hover:border-red-100"
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
            {activeTab === 2 && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight">
                      {parts[1]?.title || "Part 2: Individual Long Turn (Cue Card)"}
                    </h3>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
                      1 minute preparation time, 2 minutes speaking response
                    </p>
                  </div>
                  <div className="flex items-center gap-6 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-black">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prep Time</span>
                      <span className="text-slate-800 font-extrabold">{parts[1]?.preparationTime || 60} Seconds</span>
                    </div>
                    <div className="flex flex-col border-l border-slate-200 pl-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Speaking Limit</span>
                      <span className="text-slate-800 font-extrabold">{parts[1]?.speakingTime || 120} Seconds</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Part 2 Title</label>
                    <input
                      type="text"
                      value={parts[1]?.title || ""}
                      onChange={(e) => handlePartFieldChange(1, "title", e.target.value)}
                      className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Preparation Time (Seconds)</label>
                    <input
                      type="number"
                      min="0"
                      value={isNaN(parts[1]?.preparationTime) ? "" : parts[1]?.preparationTime}
                      onChange={(e) => handlePartFieldChange(1, "preparationTime", parseInt(e.target.value) || 0)}
                      className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Speaking limit (Seconds)</label>
                    <input
                      type="number"
                      min="1"
                      value={isNaN(parts[1]?.speakingTime) ? "" : parts[1]?.speakingTime}
                      onChange={(e) => handlePartFieldChange(1, "speakingTime", parseInt(e.target.value) || 0)}
                      className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Cue Card Instructions & Topics (Task Prompt)</label>
                    <textarea
                      rows={8}
                      value={parts[1]?.instruction || ""}
                      onChange={(e) => handlePartFieldChange(1, "instruction", e.target.value)}
                      placeholder="Describe a journey you made that took longer than expected...&#10;&#10;You should say:&#10;- Where you went...&#10;- Who you went with...&#10;- Why it took so long..."
                      required
                      className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black resize-y leading-relaxed"
                    />
                    <span className="text-[10px] text-gray-400 font-bold mt-1 block">Tip: You can use HTML tags like &lt;b&gt;bold text&lt;/b&gt; or &lt;strong&gt;bold text&lt;/strong&gt; to style specific words or lines.</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex gap-3 items-center">
                  <IconInfoCircle className="text-rose-500 shrink-0" size={20} />
                  <div className="text-[11px] font-black text-slate-500 leading-normal">
                    IELTS Part 2 (Cue Card) requires a single voice recording response. The candidate gets 1 minute to plan using the prompt instructions, and then records their speech for up to 2 minutes. The response question is automatically generated.
                  </div>
                </div>
              </div>
            )}

            {/* Part 3 Editor View */}
            {activeTab === 3 && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight">
                      {parts[2]?.title || "Part 3: Two-way Discussion"}
                    </h3>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
                      Questions related to the Cue Card topic discussed in Part 2
                    </p>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-black">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Speaking Limit</span>
                      <span className="text-slate-800 font-extrabold">{parts[2]?.speakingTime || 60} Seconds</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Part 3 Title</label>
                    <input
                      type="text"
                      value={parts[2]?.title || ""}
                      onChange={(e) => handlePartFieldChange(2, "title", e.target.value)}
                      className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Response Recording Limit (Seconds)</label>
                    <input
                      type="number"
                      min="1"
                      value={isNaN(parts[2]?.speakingTime) ? "" : parts[2]?.speakingTime}
                      onChange={(e) => handlePartFieldChange(2, "speakingTime", parseInt(e.target.value) || 0)}
                      className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Part Instructions / Directions</label>
                    <textarea
                      rows={2}
                      value={parts[2]?.instruction || ""}
                      onChange={(e) => handlePartFieldChange(2, "instruction", e.target.value)}
                      placeholder="Provide guidance context for Part 3 discussion questions..."
                      className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black resize-y"
                    />
                    <span className="text-[10px] text-gray-400 font-bold mt-1 block">Tip: You can use HTML tags like &lt;b&gt;bold text&lt;/b&gt; or &lt;strong&gt;bold text&lt;/strong&gt; to style specific words or lines.</span>
                  </div>
                </div>

                {/* Questions Listing */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Discussion Questions ({parts[2]?.questions.length || 0})</h4>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion(2)}
                      className="inline-flex items-center gap-1 text-xs font-black text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 transition active:scale-95 cursor-pointer shadow-xs"
                    >
                      <IconPlus size={14} /> Add Question
                    </button>
                  </div>

                  {(!parts[2] || parts[2].questions.length === 0) && (
                    <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-xs font-black text-slate-400 flex items-center justify-center gap-2">
                      <IconInfoCircle size={16} /> No questions added to Part 3 yet. Click "Add Question" above.
                    </div>
                  )}

                  <div className="space-y-3">
                    {parts[2]?.questions.map((q, qIdx) => (
                      <div key={qIdx} className="flex gap-4 items-center animate-fadeIn">
                        <span className="text-xs font-black text-slate-500 shrink-0 w-10">
                          Q{q.order}:
                        </span>
                        <input
                          type="text"
                          value={q.questionText}
                          onChange={(e) => handleQuestionTextChange(2, qIdx, e.target.value)}
                          placeholder="Enter the Part 3 discussion question..."
                          required
                          className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50 text-black"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(2, qIdx)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition border border-transparent hover:border-red-100"
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

        {/* Submit Save */}
        <div className="bg-white border-t border-slate-200 p-4 fixed bottom-0 left-0 w-full z-10 shadow-lg flex justify-center items-center gap-4">
          <p className="text-xs font-black text-slate-500 hidden md:block">
            Commit changes immediately. Students will receive this exam update inside their prep lists.
          </p>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-6 py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-200 text-white rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 shadow-md shadow-rose-500/10 flex items-center gap-2 cursor-pointer animate-pulse-subtle"
          >
            {saveMutation.isPending ? (
              <IconLoader2 size={16} className="animate-spin" />
            ) : (
              <IconCheck size={16} />
            )}
            <span>Save speaking mock exam</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SpeakingBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] bg-slate-50 gap-4">
          <IconLoader2 size={40} className="animate-spin text-rose-500" />
          <p className="text-sm font-bold text-gray-500">Preparing speaking workspace...</p>
        </div>
      }
    >
      <SpeakingBuilderContent />
    </Suspense>
  );
}
