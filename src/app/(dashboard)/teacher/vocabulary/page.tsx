"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { vocabularyService, type CreateVocabularyInput } from "@/services/vocabulary.services";
import { cn } from "@/lib/utils";

const emptyForm: CreateVocabularyInput = {
  word: "",
  bangla: "",
  pronunciation: "",
  partOfSpeech: "noun",
  definition: "",
  example: "",
  exampleBangla: "",
  collocations: [],
  topic: "Education",
  level: "Intermediate",
  simpleExample: "",
  compoundExample: "",
  complexExample: "",
};

const TOPICS = [
  "Education",
  "Environment",
  "Technology",
  "Society",
  "Health",
  "Work & Career",
  "Travel & Culture",
  "Science",
  "Custom",
];

const PARTS_OF_SPEECH = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "phrase",
  "idiom",
  "collocation",
];

export default function TeacherVocabularyPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [collocationsInput, setCollocationsInput] = useState("");
  const [showAdvancedExamples, setShowAdvancedExamples] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [deletingWordId, setDeletingWordId] = useState<string | null>(null);

  const wordsQuery = useQuery({
    queryKey: ["teacher-vocabulary"],
    queryFn: vocabularyService.getWords,
  });

  const create = useMutation({
    mutationFn: (payload: CreateVocabularyInput) => vocabularyService.createWord(payload),
    onSuccess: () => {
      toast.success(`"${form.word}" added to vocabulary library!`);
      setForm(emptyForm);
      setCollocationsInput("");
      setShowAdvancedExamples(false);
      void queryClient.invalidateQueries({ queryKey: ["teacher-vocabulary"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to save vocabulary. It may already exist.";
      toast.error(msg);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => {
      setDeletingWordId(id);
      return vocabularyService.deleteWord(id);
    },
    onSuccess: () => {
      toast.success("Vocabulary word removed");
      void queryClient.invalidateQueries({ queryKey: ["teacher-vocabulary"] });
    },
    onError: () => {
      toast.error("Failed to delete vocabulary word");
    },
    onSettled: () => {
      setDeletingWordId(null);
    },
  });

  const updateField = (key: keyof CreateVocabularyInput, value: string | null) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCollocationsChange = (val: string) => {
    setCollocationsInput(val);
    const parsed = val
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    setForm((prev) => ({ ...prev, collocations: parsed }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (!form.word.trim() || !form.bangla.trim() || !form.definition.trim() || !form.example.trim()) {
      toast.error("Please fill in all required fields (Word, Bangla, Definition, Example).");
      return;
    }

    const payload: CreateVocabularyInput = {
      ...form,
      word: form.word.trim(),
      bangla: form.bangla.trim(),
      pronunciation: form.pronunciation?.trim() || null,
      partOfSpeech: form.partOfSpeech.trim() || "noun",
      definition: form.definition.trim(),
      example: form.example.trim(),
      exampleBangla: form.exampleBangla?.trim() || null,
      topic: form.topic.trim() || "Education",
      level: form.level || "Intermediate",
      simpleExample: form.simpleExample?.trim() || null,
      compoundExample: form.compoundExample?.trim() || null,
      complexExample: form.complexExample?.trim() || null,
    };

    create.mutate(payload);
  };

  const allWords = useMemo(() => wordsQuery.data?.data ?? [], [wordsQuery.data?.data]);

  const filteredWords = useMemo(() => {
    return allWords.filter((w) => {
      const matchesSearch =
        !searchQuery.trim() ||
        w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.bangla.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.definition.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTopic = selectedTopic === "All" || w.topic === selectedTopic;
      const matchesLevel = selectedLevel === "All" || w.level === selectedLevel;

      return matchesSearch && matchesTopic && matchesLevel;
    });
  }, [allWords, searchQuery, selectedTopic, selectedLevel]);

  return (
    <main className="mx-auto w-full max-w-7xl min-w-0 space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
              <GraduationCap className="size-3.5" /> Teaching tools
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Vocabulary library
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Add high-band IELTS vocabulary with definitions, Bangla meanings, and sentence examples.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {wordsQuery.isFetching && !wordsQuery.isLoading && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-indigo-100 bg-indigo-50 text-xs font-semibold text-indigo-700 shadow-2xs">
              <RefreshCw className="size-3 animate-spin text-indigo-600" />
              <span>Updating...</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{allWords.length} published {allWords.length === 1 ? "word" : "words"}</span>
          </div>
        </div>
      </header>

      {/* Responsive Grid: 50/50 Equal Columns & Matching Height */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch min-w-0 w-full">
        {/* Left Column: Add Vocabulary Form */}
        <section className="min-w-0 w-full h-full flex flex-col">
          <form
            onSubmit={submit}
            className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs min-w-0 w-full h-full flex flex-col justify-between space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <span className="grid size-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Plus size={16} />
                </span>
                Add new vocabulary
              </h2>
              <span className="text-xs text-slate-400 font-medium">* Required</span>
            </div>

            <div className="space-y-4 min-w-0">
              {/* Word & Bangla */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                <label className="min-w-0 block">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">
                    English word *
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Conscientious"
                    value={form.word}
                    onChange={(e) => updateField("word", e.target.value)}
                    className="h-10 w-full min-w-0 rounded-lg border border-slate-300 px-3 text-sm outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all"
                  />
                </label>

                <label className="min-w-0 block">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">
                    বাংলা অর্থ *
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. বিবেকবান, কর্তব্যপরায়ণ"
                    value={form.bangla}
                    onChange={(e) => updateField("bangla", e.target.value)}
                    className="h-10 w-full min-w-0 rounded-lg border border-slate-300 px-3 text-sm outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all"
                  />
                </label>
              </div>

              {/* Pronunciation & Part of speech */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                <label className="min-w-0 block">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">
                    Pronunciation (IPA)
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. kɒn.ʃiˈen.ʃəs"
                    value={form.pronunciation ?? ""}
                    onChange={(e) => updateField("pronunciation", e.target.value || null)}
                    className="h-10 w-full min-w-0 rounded-lg border border-slate-300 px-3 text-xs outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all font-mono"
                  />
                </label>

                <label className="min-w-0 block">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">
                    Part of speech *
                  </span>
                  <select
                    value={form.partOfSpeech}
                    onChange={(e) => updateField("partOfSpeech", e.target.value)}
                    className="h-10 w-full min-w-0 rounded-lg border border-slate-300 px-2.5 text-sm outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all bg-white"
                  >
                    {PARTS_OF_SPEECH.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos.charAt(0).toUpperCase() + pos.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Topic & Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                <label className="min-w-0 block">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">
                    Topic / Domain
                  </span>
                  <select
                    value={form.topic}
                    onChange={(e) => updateField("topic", e.target.value)}
                    className="h-10 w-full min-w-0 rounded-lg border border-slate-300 px-2.5 text-sm outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all bg-white"
                  >
                    {TOPICS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="min-w-0 block">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">
                    Difficulty level
                  </span>
                  <select
                    value={form.level}
                    onChange={(e) => updateField("level", e.target.value as "Intermediate" | "Advanced")}
                    className="h-10 w-full min-w-0 rounded-lg border border-slate-300 px-2.5 text-sm outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all bg-white"
                  >
                    <option value="Intermediate">Intermediate (Band 6 - 7)</option>
                    <option value="Advanced">Advanced (Band 7.5 - 9)</option>
                  </select>
                </label>
              </div>

              {/* Definition */}
              <label className="min-w-0 block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">
                  Definition (English) *
                </span>
                <textarea
                  required
                  rows={2}
                  placeholder="Clear English meaning suitable for IELTS..."
                  value={form.definition}
                  onChange={(e) => updateField("definition", e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-slate-300 p-2.5 text-sm outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all resize-y"
                />
              </label>

              {/* Example sentence */}
              <label className="min-w-0 block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">
                  Example sentence (English) *
                </span>
                <textarea
                  required
                  rows={2}
                  placeholder="A contextual sentence showing how to use the word..."
                  value={form.example}
                  onChange={(e) => updateField("example", e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-slate-300 p-2.5 text-sm outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all resize-y"
                />
              </label>

              {/* Example sentence বাংলা */}
              <label className="min-w-0 block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">
                  Example sentence বাংলা অর্থ (Optional)
                </span>
                <input
                  type="text"
                  placeholder="বাক্যটির বাংলা অনুবাদ..."
                  value={form.exampleBangla ?? ""}
                  onChange={(e) => updateField("exampleBangla", e.target.value || null)}
                  className="h-10 w-full min-w-0 rounded-lg border border-slate-300 px-3 text-sm outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all"
                />
              </label>

              {/* Collocations */}
              <label className="min-w-0 block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">
                  Collocations (Comma separated)
                </span>
                <input
                  type="text"
                  placeholder="e.g. conscientious effort, conscientious worker"
                  value={collocationsInput}
                  onChange={(e) => handleCollocationsChange(e.target.value)}
                  className="h-10 w-full min-w-0 rounded-lg border border-slate-300 px-3 text-sm outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all"
                />
              </label>

              {/* Advanced sentence structures (collapsible) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden min-w-0">
                <button
                  type="button"
                  onClick={() => setShowAdvancedExamples(!showAdvancedExamples)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-indigo-600" />
                    Advanced Sentence Structures (Optional)
                  </span>
                  {showAdvancedExamples ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showAdvancedExamples && (
                  <div className="p-3.5 space-y-3 bg-white border-t border-slate-100 min-w-0">
                    <label className="min-w-0 block">
                      <span className="mb-1 block text-xs font-medium text-slate-600">
                        Simple Sentence
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. The student made a conscientious effort."
                        value={form.simpleExample ?? ""}
                        onChange={(e) => updateField("simpleExample", e.target.value || null)}
                        className="h-9 w-full min-w-0 rounded-md border border-slate-200 px-3 text-xs outline-hidden focus:border-indigo-500"
                      />
                    </label>

                    <label className="min-w-0 block">
                      <span className="mb-1 block text-xs font-medium text-slate-600">
                        Compound Sentence
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. She was conscientious, and she checked all details."
                        value={form.compoundExample ?? ""}
                        onChange={(e) => updateField("compoundExample", e.target.value || null)}
                        className="h-9 w-full min-w-0 rounded-md border border-slate-200 px-3 text-xs outline-hidden focus:border-indigo-500"
                      />
                    </label>

                    <label className="min-w-0 block">
                      <span className="mb-1 block text-xs font-medium text-slate-600">
                        Complex Sentence
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Because she was conscientious, the exam went smoothly."
                        value={form.complexExample ?? ""}
                        onChange={(e) => updateField("complexExample", e.target.value || null)}
                        className="h-9 w-full min-w-0 rounded-md border border-slate-200 px-3 text-xs outline-hidden focus:border-indigo-500"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={create.isPending}
              className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-sm font-semibold text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {create.isPending ? (
                <>
                  <Loader2 className="animate-spin size-4" />
                  Saving vocabulary...
                </>
              ) : (
                <>
                  <Plus size={16} /> Save to Vocabulary Library
                </>
              )}
            </button>
          </form>
        </section>

        {/* Right Column: Published Vocabulary */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-xs min-w-0 w-full flex flex-col h-full overflow-hidden">
          {/* Card Header & Filters */}
          <div className="border-b border-slate-200 p-4 sm:p-5 space-y-3.5 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="font-bold text-slate-900 text-base">
                  Published vocabulary
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {filteredWords.length} of {allWords.length} available words
                </p>
              </div>

              {/* Difficulty filter tabs */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                {(["All", "Intermediate", "Advanced"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedLevel(lvl)}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                      selectedLevel === lvl
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Search and Topic Filters */}
            <div className="flex flex-col sm:flex-row gap-2.5 min-w-0">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by word, meaning, or definition..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full min-w-0 rounded-lg border border-slate-300 bg-white pl-9 pr-8 text-xs outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 outline-hidden focus:border-indigo-600 font-medium shrink-0"
              >
                <option value="All">All Topics</option>
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optimistic Card when Adding */}
          {create.isPending && (
            <div className="p-4 sm:p-5 bg-indigo-50/60 border-b border-indigo-100 animate-pulse">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-100 text-indigo-600">
                  <Loader2 className="size-4.5 animate-spin" />
                </span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-900 text-base">
                      {form.word || "New vocabulary word"}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-200 text-indigo-800">
                      Adding to library...
                    </span>
                  </div>
                  <p className="text-xs text-indigo-700">
                    Syncing word, definition, and sentences with backend...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Words List with High-Fidelity Skeletons */}
          {wordsQuery.isLoading ? (
            <div className="flex-1 min-h-105 lg:min-h-0 overflow-y-auto divide-y divide-slate-100 min-w-0 p-4 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="pt-4 first:pt-0 animate-pulse space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="size-9 rounded-lg bg-slate-200 shrink-0" />
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="h-5 w-32 rounded bg-slate-200" />
                          <div className="h-4 w-16 rounded bg-slate-100" />
                          <div className="h-4 w-20 rounded bg-slate-100" />
                          <div className="h-4 w-24 rounded bg-slate-100" />
                        </div>
                        <div className="h-4 w-44 rounded bg-indigo-100" />
                        <div className="h-3 w-5/6 rounded bg-slate-200" />
                        <div className="h-14 w-full rounded-lg bg-slate-100 border border-slate-200/60" />
                      </div>
                    </div>
                    <div className="size-8 rounded-lg bg-slate-100 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredWords.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-2">
              <div className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                <BookOpen size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-700">No vocabulary found</p>
              <p className="text-xs text-slate-500 max-w-xs">
                {searchQuery || selectedTopic !== "All" || selectedLevel !== "All"
                  ? "No words match your filters. Try clearing your search."
                  : "Start adding vocabulary using the form on the left."}
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-105 lg:min-h-0 overflow-y-auto divide-y divide-slate-100 min-w-0">
              {filteredWords.map((word) => {
                const isDeletingThis = deletingWordId === word.id;
                return (
                  <div
                    key={word.id}
                    className={cn(
                      "p-4 sm:p-5 hover:bg-slate-50/70 transition-all min-w-0",
                      isDeletingThis && "opacity-50 pointer-events-none bg-red-50/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      {/* Left: Icon + Content */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600 mt-0.5">
                          <BookOpen size={16} />
                        </span>

                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                            <h3 className="font-bold text-slate-900 text-base sm:text-lg wrap-break-word">
                              {word.word}
                            </h3>

                            {word.pronunciation && (
                              <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded break-all">
                                /{word.pronunciation}/
                              </span>
                            )}

                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                              {word.partOfSpeech}
                            </span>

                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                              {word.topic}
                            </span>

                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium",
                                word.level === "Advanced"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200/50"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                              )}
                            >
                              {word.level}
                            </span>
                          </div>

                          {/* Bengali Meaning */}
                          <p className="text-sm font-semibold text-indigo-950 wrap-break-word">
                            {word.bangla}
                          </p>

                          {/* Definition */}
                          <p className="text-xs text-slate-600 leading-relaxed wrap-break-word">
                            <strong className="text-slate-800 font-medium">Definition:</strong>{" "}
                            {word.definition}
                          </p>

                          {/* Example sentence */}
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1 min-w-0">
                            <p className="text-slate-700 italic leading-relaxed wrap-break-word">
                              &ldquo;{word.example}&rdquo;
                            </p>
                            {word.exampleBangla && (
                              <p className="text-slate-500 not-italic wrap-break-word">
                                {word.exampleBangla}
                              </p>
                            )}
                          </div>

                          {/* Collocations */}
                          {word.collocations && word.collocations.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1 min-w-0">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Collocations:
                              </span>
                              {word.collocations.map((col, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 wrap-break-word"
                                >
                                  {col}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Extra Sentences if provided */}
                          {(word.simpleExample || word.compoundExample || word.complexExample) && (
                            <details className="text-xs text-slate-500 pt-1 group cursor-pointer">
                              <summary className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors list-none flex items-center gap-1">
                                <span>Sentence Variations</span>
                                <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
                              </summary>
                              <div className="mt-2 space-y-1.5 pl-3 border-l-2 border-indigo-200">
                                {word.simpleExample && (
                                  <p className="wrap-break-word">
                                    <strong className="text-slate-700">Simple:</strong>{" "}
                                    {word.simpleExample}
                                  </p>
                                )}
                                {word.compoundExample && (
                                  <p className="wrap-break-word">
                                    <strong className="text-slate-700">Compound:</strong>{" "}
                                    {word.compoundExample}
                                  </p>
                                )}
                                {word.complexExample && (
                                  <p className="wrap-break-word">
                                    <strong className="text-slate-700">Complex:</strong>{" "}
                                    {word.complexExample}
                                  </p>
                                )}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>

                      {/* Right: Delete Action Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to remove "${word.word}"?`)) {
                            remove.mutate(word.id);
                          }
                        }}
                        disabled={remove.isPending}
                        className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        title={`Delete ${word.word}`}
                        aria-label={`Delete ${word.word}`}
                      >
                        {isDeletingThis ? (
                          <Loader2 size={16} className="animate-spin text-red-500" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
