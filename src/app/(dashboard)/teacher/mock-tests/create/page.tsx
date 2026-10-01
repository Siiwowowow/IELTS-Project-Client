/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { mockTestService } from "@/services/mocktest.services";
import { readingService } from "@/services/reading.services";
import { listeningService } from "@/services/listening.services";
import { writingService } from "@/services/writing.services";
import { speakingService } from "@/services/speaking.services";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { getNextMockTestTitle } from "@/lib/mockTestNaming";
import {
  IconArrowLeft,
  IconTrophy,
  IconBook2,
  IconHeadset,
  IconPencil,
  IconMicrophone,
  IconLoader2,
  IconSparkles,
  IconCheck,
  IconLayersLinked,
  IconCircleCheck,
  IconClock,
  IconFileText,
  IconBolt,
  IconAlertCircle,
  IconFilter,
  IconCrown,
} from "@tabler/icons-react";
import Link from "next/link";

export default function CreateMockTestPage() {
  const router = useRouter();

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(
    "A complete Cambridge IELTS-style Academic mock test combining Listening, Reading, Writing, and Speaking modules under realistic exam conditions."
  );
  const [isPublished, setIsPublished] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [selectedListening, setSelectedListening] = useState("");
  const [selectedReading, setSelectedReading] = useState("");
  const [selectedWriting, setSelectedWriting] = useState("");
  const [selectedSpeaking, setSelectedSpeaking] = useState("");

  // Module filter state: ALL (published + drafts), PUBLISHED, DRAFT
  const [moduleFilter, setModuleFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");

  const mockTestsQuery = useQuery({
    queryKey: ["mock-tests-for-next-title"],
    queryFn: () => mockTestService.getAllMockTests({ myExams: true }),
  });

  const resolvedTitle = title || getNextMockTestTitle(mockTestsQuery.data?.data ?? []);

  // Fetch Listening Exams (including drafts)
  const listeningQuery = useQuery({
    queryKey: ["listening-exams-list-assemble"],
    queryFn: () => listeningService.getAllExams({ myExams: true }),
  });

  // Fetch Reading Exams (including drafts)
  const readingQuery = useQuery({
    queryKey: ["reading-exams-list-assemble"],
    queryFn: () => readingService.getAllExams({ myExams: true }),
  });

  // Fetch Writing Exams (including drafts)
  const writingQuery = useQuery({
    queryKey: ["writing-exams-list-assemble"],
    queryFn: () => writingService.getAllExams({ myExams: true }),
  });

  // Fetch Speaking Exams (including drafts)
  const speakingQuery = useQuery({
    queryKey: ["speaking-exams-list-assemble"],
    queryFn: () => speakingService.getAllExams({ myExams: true }),
  });

  const isDataLoading =
    listeningQuery.isLoading ||
    readingQuery.isLoading ||
    writingQuery.isLoading ||
    speakingQuery.isLoading;

  // Filter helper
  const filterExams = (exams: any[]) => {
    if (!exams) return [];
    if (moduleFilter === "PUBLISHED") return exams.filter((e) => e.isPublished);
    if (moduleFilter === "DRAFT") return exams.filter((e) => !e.isPublished);
    return exams;
  };

  const listeningExams = useMemo(
    () => filterExams(listeningQuery.data?.data ?? []),
    [listeningQuery.data?.data, moduleFilter]
  );
  const readingExams = useMemo(
    () => filterExams(readingQuery.data?.data ?? []),
    [readingQuery.data?.data, moduleFilter]
  );
  const writingExams = useMemo(
    () => filterExams(writingQuery.data?.data ?? []),
    [writingQuery.data?.data, moduleFilter]
  );
  const speakingExams = useMemo(
    () => filterExams(speakingQuery.data?.data ?? []),
    [speakingQuery.data?.data, moduleFilter]
  );

  // Selected exam objects for preview pills
  const activeListeningObj = (listeningQuery.data?.data ?? []).find(
    (e: any) => e.id === selectedListening
  );
  const activeReadingObj = (readingQuery.data?.data ?? []).find(
    (e: any) => e.id === selectedReading
  );
  const activeWritingObj = (writingQuery.data?.data ?? []).find(
    (e: any) => e.id === selectedWriting
  );
  const activeSpeakingObj = (speakingQuery.data?.data ?? []).find(
    (e: any) => e.id === selectedSpeaking
  );

  // Check if any draft modules are bundled
  const hasDraftModules =
    (activeListeningObj && !activeListeningObj.isPublished) ||
    (activeReadingObj && !activeReadingObj.isPublished) ||
    (activeWritingObj && !activeWritingObj.isPublished) ||
    (activeSpeakingObj && !activeSpeakingObj.isPublished);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => mockTestService.createMockTest(payload),
    onSuccess: () => {
      toast.success(
        isPublished
          ? "Full Mock Test assembled and published live!"
          : "Full Mock Test assembled and saved as draft!"
      );
      router.push("/teacher/mock-tests");
    },
    onError: (err: any) => {
      toast.error(
        "Failed to create Mock Test: " + (err?.response?.data?.message || err.message)
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!resolvedTitle.trim()) {
      toast.error("Please enter a mock test title.");
      return;
    }

    if (!selectedListening || !selectedReading || !selectedWriting || !selectedSpeaking) {
      toast.error("A full mock test requires Listening, Reading, Writing, and Speaking exams.");
      return;
    }

    const payload = {
      title: resolvedTitle,
      description,
      isPublished,
      isPremium,
      listeningExamId: selectedListening || null,
      readingExamId: selectedReading || null,
      writingExamId: selectedWriting || null,
      speakingExamId: selectedSpeaking || null,
    };

    createMutation.mutate(payload);
  };

  const selectedCount = [
    selectedListening,
    selectedReading,
    selectedWriting,
    selectedSpeaking,
  ].filter(Boolean).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-3 sm:px-5 py-4 sm:py-6 font-sans">
      {/* Back navigation */}
      <div>
        <Link
          href="/teacher/mock-tests"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <IconArrowLeft size={16} />
          <span>Back to Mock Tests</span>
        </Link>
      </div>

      {/* Header banner - Maximalist style */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-950 via-purple-950 to-indigo-950 border border-purple-800/40 p-5 sm:p-7 md:p-8 text-white shadow-2xl shadow-purple-950/40">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
        <div className="absolute left-1/3 bottom-0 -mb-16 w-56 h-56 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-[11px] font-black uppercase tracking-widest text-purple-200">
              <IconLayersLinked size={13} className="text-purple-300" />
              <span>Module Pool Assembly</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Assemble Full Mock Test
            </h1>
            <p className="text-purple-200/80 text-xs sm:text-sm font-medium max-w-xl leading-relaxed">
              Combine your existing Listening, Reading, Writing, and Speaking modules into a single synchronized IELTS CBT exam paper.
            </p>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-purple-500 to-indigo-600 text-white shadow-xl shadow-purple-600/30 shrink-0 self-start sm:self-auto animate-float-gentle">
            <IconTrophy size={30} />
          </div>
        </div>
      </div>

      {/* Main form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Basic Meta Info */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-xs font-black">
              1
            </span>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
              Mock Test Details
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase" htmlFor="title">
                Test Title *
              </label>
              <input
                id="title"
                type="text"
                required
                placeholder="e.g. IELTS Academic Full Practice Exam Vol 1"
                value={resolvedTitle}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold focus:border-purple-600 focus:outline-hidden bg-slate-50/40 transition duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase" htmlFor="description">
                Description / Guidelines
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Describe this mock test, e.g. time limits, instructions, scoring info..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:border-purple-600 focus:outline-hidden bg-slate-50/40 transition duration-200 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Module Selection with Draft/Published Support */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-xs font-black">
                2
              </span>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                  Select 4 IELTS Modules
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Drafts and published modules are available for selection.
                </p>
              </div>
            </div>

            {/* Filter Pill Segment */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setModuleFilter("ALL")}
                className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                  moduleFilter === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All Modules
              </button>
              <button
                type="button"
                onClick={() => setModuleFilter("PUBLISHED")}
                className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                  moduleFilter === "PUBLISHED"
                    ? "bg-white text-emerald-700 shadow-2xs"
                    : "text-slate-500 hover:text-emerald-700"
                }`}
              >
                Published Only
              </button>
              <button
                type="button"
                onClick={() => setModuleFilter("DRAFT")}
                className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                  moduleFilter === "DRAFT"
                    ? "bg-white text-amber-700 shadow-2xs"
                    : "text-slate-500 hover:text-amber-700"
                }`}
              >
                Drafts Only
              </button>
            </div>
          </div>

          {isDataLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <IconLoader2 className="animate-spin text-purple-600" size={32} />
              <p className="text-xs font-bold text-slate-500">
                Fetching all saved module exams (published & drafts)...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Listening Select */}
              <div
                className={`space-y-2 rounded-2xl border p-4 sm:p-5 transition-all ${
                  selectedListening
                    ? "border-blue-300 bg-blue-50/30 shadow-xs"
                    : "border-slate-200 bg-slate-50/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <label
                    className="text-xs font-black text-slate-700 uppercase flex items-center gap-1.5"
                    htmlFor="listening"
                  >
                    <IconHeadset size={16} className="text-blue-600" />
                    <span>Listening Module</span>
                  </label>
                  {selectedListening && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700">
                      <IconCheck size={14} className="stroke-[3]" /> Selected
                    </span>
                  )}
                </div>

                <select
                  id="listening"
                  value={selectedListening}
                  onChange={(e) => setSelectedListening(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:border-purple-600 focus:outline-hidden transition duration-200"
                >
                  <option value="">Select Listening exam ({listeningExams.length} available)</option>
                  {listeningExams.map((exam: any) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.isPublished ? "🟢 [LIVE]" : "📝 [DRAFT]"} {exam.title} ({exam.duration}m)
                    </option>
                  ))}
                </select>

                {/* Selected Pill */}
                {activeListeningObj && (
                  <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        activeListeningObj.isPublished
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {activeListeningObj.isPublished ? "Published Exam" : "Draft Exam"}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {activeListeningObj.duration} Minutes
                    </span>
                  </div>
                )}
              </div>

              {/* Reading Select */}
              <div
                className={`space-y-2 rounded-2xl border p-4 sm:p-5 transition-all ${
                  selectedReading
                    ? "border-emerald-300 bg-emerald-50/30 shadow-xs"
                    : "border-slate-200 bg-slate-50/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <label
                    className="text-xs font-black text-slate-700 uppercase flex items-center gap-1.5"
                    htmlFor="reading"
                  >
                    <IconBook2 size={16} className="text-emerald-600" />
                    <span>Reading Module</span>
                  </label>
                  {selectedReading && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <IconCheck size={14} className="stroke-[3]" /> Selected
                    </span>
                  )}
                </div>

                <select
                  id="reading"
                  value={selectedReading}
                  onChange={(e) => setSelectedReading(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:border-purple-600 focus:outline-hidden transition duration-200"
                >
                  <option value="">Select Reading exam ({readingExams.length} available)</option>
                  {readingExams.map((exam: any) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.isPublished ? "🟢 [LIVE]" : "📝 [DRAFT]"} {exam.title} ({exam.duration}m)
                    </option>
                  ))}
                </select>

                {/* Selected Pill */}
                {activeReadingObj && (
                  <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        activeReadingObj.isPublished
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {activeReadingObj.isPublished ? "Published Exam" : "Draft Exam"}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {activeReadingObj.duration} Minutes
                    </span>
                  </div>
                )}
              </div>

              {/* Writing Select */}
              <div
                className={`space-y-2 rounded-2xl border p-4 sm:p-5 transition-all ${
                  selectedWriting
                    ? "border-amber-300 bg-amber-50/30 shadow-xs"
                    : "border-slate-200 bg-slate-50/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <label
                    className="text-xs font-black text-slate-700 uppercase flex items-center gap-1.5"
                    htmlFor="writing"
                  >
                    <IconPencil size={16} className="text-amber-600" />
                    <span>Writing Module</span>
                  </label>
                  {selectedWriting && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                      <IconCheck size={14} className="stroke-[3]" /> Selected
                    </span>
                  )}
                </div>

                <select
                  id="writing"
                  value={selectedWriting}
                  onChange={(e) => setSelectedWriting(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:border-purple-600 focus:outline-hidden transition duration-200"
                >
                  <option value="">Select Writing exam ({writingExams.length} available)</option>
                  {writingExams.map((exam: any) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.isPublished ? "🟢 [LIVE]" : "📝 [DRAFT]"} {exam.title} ({exam.duration}m)
                    </option>
                  ))}
                </select>

                {/* Selected Pill */}
                {activeWritingObj && (
                  <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        activeWritingObj.isPublished
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {activeWritingObj.isPublished ? "Published Exam" : "Draft Exam"}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {activeWritingObj.duration} Minutes
                    </span>
                  </div>
                )}
              </div>

              {/* Speaking Select */}
              <div
                className={`space-y-2 rounded-2xl border p-4 sm:p-5 transition-all ${
                  selectedSpeaking
                    ? "border-rose-300 bg-rose-50/30 shadow-xs"
                    : "border-slate-200 bg-slate-50/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <label
                    className="text-xs font-black text-slate-700 uppercase flex items-center gap-1.5"
                    htmlFor="speaking"
                  >
                    <IconMicrophone size={16} className="text-rose-600" />
                    <span>Speaking Module</span>
                  </label>
                  {selectedSpeaking && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                      <IconCheck size={14} className="stroke-[3]" /> Selected
                    </span>
                  )}
                </div>

                <select
                  id="speaking"
                  value={selectedSpeaking}
                  onChange={(e) => setSelectedSpeaking(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:border-purple-600 focus:outline-hidden transition duration-200"
                >
                  <option value="">Select Speaking exam ({speakingExams.length} available)</option>
                  {speakingExams.map((exam: any) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.isPublished ? "🟢 [LIVE]" : "📝 [DRAFT]"} {exam.title} ({exam.duration}m)
                    </option>
                  ))}
                </select>

                {/* Selected Pill */}
                {activeSpeakingObj && (
                  <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        activeSpeakingObj.isPublished
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {activeSpeakingObj.isPublished ? "Published Exam" : "Draft Exam"}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {activeSpeakingObj.duration} Minutes
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Readiness Tracker Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <div className="space-y-0.5">
              <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <IconCircleCheck
                  size={15}
                  className={selectedCount === 4 ? "text-emerald-500" : "text-slate-400"}
                />
                <span>Assembly Readiness: {selectedCount}/4 Modules Selected</span>
              </p>
              {hasDraftModules && (
                <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                  <IconAlertCircle size={13} />
                  <span>Includes draft modules — they will be bundled directly into this full test.</span>
                </p>
              )}
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider self-start sm:self-auto ${
                selectedCount === 4
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {selectedCount === 4 ? "Ready to Assemble" : `${4 - selectedCount} Missing`}
            </span>
          </div>
        </div>

        {/* Step 3: Publish Status Settings */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-xs font-black">
              3
            </span>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
              Mock Test Publish Status
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Draft Option */}
            <label
              className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                !isPublished
                  ? "border-amber-400 bg-amber-50/40 shadow-xs"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <input
                type="radio"
                name="publishStatus"
                checked={!isPublished}
                onChange={() => setIsPublished(false)}
                className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-black text-slate-900 block">
                  Save as Draft (Private)
                </span>
                <span className="text-xs text-slate-500 font-medium block leading-relaxed">
                  Only you and other teachers can see and edit this mock test. Students will not see it.
                </span>
              </div>
            </label>

            {/* Published Option */}
            <label
              className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                isPublished
                  ? "border-emerald-500 bg-emerald-50/40 shadow-xs"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <input
                type="radio"
                name="publishStatus"
                checked={isPublished}
                onChange={() => setIsPublished(true)}
                className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-black text-slate-900 block flex items-center gap-1.5">
                  <span>Publish Live (Active)</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </span>
                <span className="text-xs text-slate-500 font-medium block leading-relaxed">
                  Students can immediately attempt and practice this complete IELTS full mock test.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Step 4: Access Tier (Free vs Premium) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-amber-600 text-xs font-black">
              4
            </span>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>Access Tier (Free vs Premium)</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Free Option */}
            <label
              className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                !isPremium
                  ? "border-emerald-500 bg-emerald-50/40 shadow-xs"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <input
                type="radio"
                name="accessTier"
                checked={!isPremium}
                onChange={() => setIsPremium(false)}
                className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-black text-slate-900 block">
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                    Free Mock Test
                  </span>
                </span>
                <span className="text-xs text-slate-500 font-medium block leading-relaxed mt-1">
                  Open to all registered candidates for free practice without any payment or pass required.
                </span>
              </div>
            </label>

            {/* Premium Option */}
            <label
              className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                isPremium
                  ? "border-amber-500 bg-amber-50/40 shadow-xs"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <input
                type="radio"
                name="accessTier"
                checked={isPremium}
                onChange={() => setIsPremium(true)}
                className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-black text-slate-900 block">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                    <IconCrown size={12} className="fill-amber-500 text-amber-600" />
                    <span>Premium Mock Test</span>
                  </span>
                </span>
                <span className="text-xs text-slate-500 font-medium block leading-relaxed mt-1">
                  Exclusive to students with a Premium Pass. Students will be prompted with the payment form to unlock.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/teacher/mock-tests"
            className="px-5 py-2.5 rounded-2xl border border-slate-200 text-xs font-black text-slate-600 hover:text-slate-900 hover:bg-slate-50 active:scale-95 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending || isDataLoading || selectedCount < 4}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs text-white shadow-xl transition-all duration-200 cursor-pointer active:scale-95 ${
              selectedCount < 4
                ? "bg-slate-300 cursor-not-allowed shadow-none"
                : isPublished
                ? "bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30"
                : "bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/30"
            }`}
          >
            {createMutation.isPending ? (
              <>
                <IconLoader2 className="animate-spin" size={16} />
                <span>Assembling Mock Test...</span>
              </>
            ) : (
              <>
                <IconSparkles size={16} className="text-amber-300" />
                <span>
                  {isPublished ? "Assemble & Publish Live" : "Save Assembly as Draft"}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
