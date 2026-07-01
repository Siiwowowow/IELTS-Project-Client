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
import { useState } from "react";
import {
  IconArrowLeft,
  IconTrophy,
  IconBook2,
  IconHeadset,
  IconPencil,
  IconMicrophone,
  IconLoader2,
  IconSparkles,
} from "@tabler/icons-react";
import Link from "next/link";

export default function CreateMockTestPage() {
  const router = useRouter();

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [selectedListening, setSelectedListening] = useState("");
  const [selectedReading, setSelectedReading] = useState("");
  const [selectedWriting, setSelectedWriting] = useState("");
  const [selectedSpeaking, setSelectedSpeaking] = useState("");

  // Fetch Listening Exams
  const listeningQuery = useQuery({
    queryKey: ["listening-exams-list"],
    queryFn: () => listeningService.getAllExams(),
  });

  // Fetch Reading Exams
  const readingQuery = useQuery({
    queryKey: ["reading-exams-list"],
    queryFn: () => readingService.getAllExams(),
  });

  // Fetch Writing Exams
  const writingQuery = useQuery({
    queryKey: ["writing-exams-list"],
    queryFn: () => writingService.getAllExams(),
  });

  // Fetch Speaking Exams
  const speakingQuery = useQuery({
    queryKey: ["speaking-exams-list"],
    queryFn: () => speakingService.getAllExams(),
  });

  const isDataLoading =
    listeningQuery.isLoading ||
    readingQuery.isLoading ||
    writingQuery.isLoading ||
    speakingQuery.isLoading;

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => mockTestService.createMockTest(payload),
    onSuccess: () => {
      toast.success("Full Mock Test assembled and saved!");
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

    if (!title.trim()) {
      toast.error("Please enter a mock test title.");
      return;
    }

    if (!selectedListening && !selectedReading && !selectedWriting && !selectedSpeaking) {
      toast.error("Please select at least one module exam to include.");
      return;
    }

    const payload = {
      title,
      description,
      isPublished,
      listeningExamId: selectedListening || null,
      readingExamId: selectedReading || null,
      writingExamId: selectedWriting || null,
      speakingExamId: selectedSpeaking || null,
    };

    createMutation.mutate(payload);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 py-6">
      {/* Back navigation */}
      <div>
        <Link
          href="/teacher/mock-tests"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-slate-900 transition-colors"
        >
          <IconArrowLeft size={16} />
          <span>Back to Mock Tests</span>
        </Link>
      </div>

      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900 via-purple-800 to-indigo-900 p-6 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20">
            <IconTrophy size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Assemble New Full Mock Test</h1>
            <p className="text-purple-200/80 text-xs font-semibold uppercase tracking-wider mt-1 flex items-center gap-1.5">
              <IconSparkles size={12} className="text-amber-400" />
              <span>Combine Modules Into One Full Exam</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main form */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
        
        {/* Basic Meta Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
            1. Mock Test Details
          </h3>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase" htmlFor="title">
              Test Title *
            </label>
            <input
              id="title"
              type="text"
              required
              placeholder="e.g. IELTS Academic Full Practice Exam Vol 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-purple-600 focus:outline-hidden transition duration-200"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase" htmlFor="description">
              Description / Guidelines
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Describe this mock test, e.g. time limits, instructions, scoring info..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-purple-600 focus:outline-hidden transition duration-200 resize-none"
            />
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Module Selection */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
            2. Choose Exam Modules (Listening, Reading, Writing, Speaking)
          </h3>

          {isDataLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <IconLoader2 className="animate-spin text-purple-600" size={32} />
              <p className="text-xs font-semibold text-gray-500">Fetching available module exams...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Listening Select */}
              <div className="space-y-1.5 p-4.5 bg-slate-50/50 rounded-2xl border border-slate-200/50">
                <label className="text-xs font-black text-gray-700 uppercase flex items-center gap-1.5" htmlFor="listening">
                  <IconHeadset size={16} className="text-blue-500" />
                  <span>Listening Exam</span>
                </label>
                <select
                  id="listening"
                  value={selectedListening}
                  onChange={(e) => setSelectedListening(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:border-purple-600 focus:outline-hidden transition duration-200"
                >
                  <option value="">-- Leave Blank / Not Included --</option>
                  {(listeningQuery.data?.data ?? []).map((exam: any) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title} ({exam.duration}m)
                    </option>
                  ))}
                </select>
              </div>

              {/* Reading Select */}
              <div className="space-y-1.5 p-4.5 bg-slate-50/50 rounded-2xl border border-slate-200/50">
                <label className="text-xs font-black text-gray-700 uppercase flex items-center gap-1.5" htmlFor="reading">
                  <IconBook2 size={16} className="text-emerald-500" />
                  <span>Reading Exam</span>
                </label>
                <select
                  id="reading"
                  value={selectedReading}
                  onChange={(e) => setSelectedReading(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:border-purple-600 focus:outline-hidden transition duration-200"
                >
                  <option value="">-- Leave Blank / Not Included --</option>
                  {(readingQuery.data?.data ?? []).map((exam: any) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title} ({exam.duration}m)
                    </option>
                  ))}
                </select>
              </div>

              {/* Writing Select */}
              <div className="space-y-1.5 p-4.5 bg-slate-50/50 rounded-2xl border border-slate-200/50">
                <label className="text-xs font-black text-gray-700 uppercase flex items-center gap-1.5" htmlFor="writing">
                  <IconPencil size={16} className="text-amber-500" />
                  <span>Writing Exam</span>
                </label>
                <select
                  id="writing"
                  value={selectedWriting}
                  onChange={(e) => setSelectedWriting(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:border-purple-600 focus:outline-hidden transition duration-200"
                >
                  <option value="">-- Leave Blank / Not Included --</option>
                  {(writingQuery.data?.data ?? []).map((exam: any) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title} ({exam.duration}m)
                    </option>
                  ))}
                </select>
              </div>

              {/* Speaking Select */}
              <div className="space-y-1.5 p-4.5 bg-slate-50/50 rounded-2xl border border-slate-200/50">
                <label className="text-xs font-black text-gray-700 uppercase flex items-center gap-1.5" htmlFor="speaking">
                  <IconMicrophone size={16} className="text-rose-500" />
                  <span>Speaking Exam</span>
                </label>
                <select
                  id="speaking"
                  value={selectedSpeaking}
                  onChange={(e) => setSelectedSpeaking(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:border-purple-600 focus:outline-hidden transition duration-200"
                >
                  <option value="">-- Leave Blank / Not Included --</option>
                  {(speakingQuery.data?.data ?? []).map((exam: any) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title} ({exam.duration}m)
                    </option>
                  ))}
                </select>
              </div>

            </div>
          )}
        </div>

        <hr className="border-gray-100" />

        {/* Publish status toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="space-y-0.5">
            <span className="text-sm font-black text-gray-800 block">
              Publish Status
            </span>
            <span className="text-xs font-medium text-gray-400 block">
              If published, students can immediately take this full mock test.
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link
            href="/teacher/mock-tests"
            className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-extrabold text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-98 transition duration-150"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending || isDataLoading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-extrabold text-sm shadow-lg shadow-purple-600/25 active:scale-98 transition-all duration-150"
          >
            {createMutation.isPending && <IconLoader2 className="animate-spin" size={18} />}
            <span>Save Mock Test</span>
          </button>
        </div>

      </form>
    </div>
  );
}
