/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vocabularyService } from "@/services/vocabulary.services";
import { toast } from "sonner";
import {
  IconSearch,
  IconTrash,
  IconRotate,
  IconShieldLock,
  IconLoader2,
  IconX,
  IconAlertCircle,
} from "@tabler/icons-react";

export default function AdminVocabularyPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("ALL");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-vocabulary-words"],
    queryFn: vocabularyService.getWords,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vocabularyService.deleteWord(id),
    onSuccess: () => {
      toast.success("Vocabulary item removed.");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-vocabulary-words"] });
    },
    onError: (err: any) => {
      toast.error("Failed to delete word: " + (err?.response?.data?.message || err.message));
      setDeletingId(null);
    },
  });

  const words = data?.data ?? [];

  // Topics and Levels
  const topics = useMemo(() => {
    const set = new Set<string>();
    words.forEach((w: any) => {
      if (w.topic) set.add(w.topic);
    });
    return Array.from(set);
  }, [words]);

  const filteredWords = useMemo(() => {
    return words.filter((w: any) => {
      if (selectedTopic !== "ALL" && w.topic !== selectedTopic) return false;
      if (selectedLevel !== "ALL" && w.level !== selectedLevel) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchWord = w.word?.toLowerCase().includes(q);
        const matchBangla = w.bangla?.toLowerCase().includes(q);
        const matchDef = w.definition?.toLowerCase().includes(q);
        return matchWord || matchBangla || matchDef;
      }
      return true;
    });
  }, [words, selectedTopic, selectedLevel, searchQuery]);

  const handleDelete = (id: string, word: string) => {
    if (window.confirm(`Permanently remove vocabulary word "${word}"?`)) {
      setDeletingId(id);
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-[1500px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-950 via-slate-900 to-cyan-950 border border-slate-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[11px] font-black uppercase tracking-widest text-cyan-200">
              <IconShieldLock size={13} />
              <span>Vocabulary Management</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              IELTS Vocabulary Bank
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-2xl">
              Monitor, search, inspect, and moderate all IELTS high-yield vocabulary entries, Bengali translations, collocations, and contextual sentences.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs transition active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <IconRotate size={15} className={isFetching ? "animate-spin" : ""} />
            <span>Refresh Bank</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Words</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{words.length}</span>
            <span className="text-xs font-semibold text-slate-400">Entries</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 block">Topics Covered</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-600">{topics.length}</span>
            <span className="text-xs font-semibold text-cyan-700/60">Categories</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 block">Active Search</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-600">{filteredWords.length}</span>
            <span className="text-xs font-semibold text-purple-700/60">Matching</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">Status</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-sm font-black text-emerald-600">🟢 Database Synced</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-cyan-600 focus:outline-hidden"
          >
            <option value="ALL">All Topics ({words.length})</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-cyan-600 focus:outline-hidden"
          >
            <option value="ALL">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div className="relative sm:w-80">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search word, meaning, or definition..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:border-cyan-600 focus:outline-hidden bg-slate-50/50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <IconX size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Words Grid */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
          <IconLoader2 size={32} className="animate-spin text-cyan-600" />
          <p className="text-xs font-bold">Loading vocabulary entries...</p>
        </div>
      )}

      {isError && (
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 font-semibold text-sm flex items-center gap-3">
          <IconAlertCircle size={20} />
          <p>Failed to load vocabulary data.</p>
        </div>
      )}

      {!isLoading && !isError && filteredWords.length === 0 && (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl p-6">
          <p className="font-extrabold text-sm text-slate-800">No words found</p>
          <p className="text-xs text-slate-500 mt-1">No vocabulary entries match your current search.</p>
        </div>
      )}

      {!isLoading && !isError && filteredWords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWords.map((word: any) => {
            const isDeleting = deletingId === word.id;

            return (
              <div
                key={word.id}
                className="group rounded-2xl bg-white border border-slate-200 hover:border-slate-300 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 text-lg group-hover:text-cyan-600 transition-colors">
                          {word.word}
                        </h3>
                        {word.partOfSpeech && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold italic">
                            {word.partOfSpeech}
                          </span>
                        )}
                      </div>
                      {word.pronunciation && (
                        <span className="text-xs text-slate-400 font-mono block">/{word.pronunciation}/</span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDelete(word.id, word.word)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete word"
                    >
                      {isDeleting ? <IconLoader2 size={16} className="animate-spin text-rose-600" /> : <IconTrash size={16} />}
                    </button>
                  </div>

                  {/* Bengali meaning */}
                  {word.bangla && (
                    <div className="text-sm font-bold text-cyan-800 bg-cyan-50/60 px-3 py-1.5 rounded-xl border border-cyan-100">
                      {word.bangla}
                    </div>
                  )}

                  {/* Definition */}
                  {word.definition && (
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {word.definition}
                    </p>
                  )}

                  {/* Example */}
                  {word.example && (
                    <div className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      &quot;{word.example}&quot;
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                    {word.topic || "General"}
                  </span>
                  <span>{word.level || "Intermediate"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
