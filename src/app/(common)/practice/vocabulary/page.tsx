/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Bookmark,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  Languages,
  Loader2,
  RotateCcw,
  Sparkles,
  SpellCheck,
  Volume2,
  X,
} from "lucide-react";
import { ieltsVocabulary, vocabularyTopics, type VocabularyWord } from "@/data/ieltsVocabulary";
import { vocabularyService, type VocabularyLibrary } from "@/services/vocabulary.services";
import SlidingCards from "@/components/lightswind/sliding-cards";
import ThreeDImagePageflip, { type PageFlipLeaf, type ThreeDImagePageflipHandle } from "@/components/lightswind/3d-image-pageflip";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import Image from "next/image";
import ieltsPrepLogo from "../../../../../public/logo/logo.png";

type Mode = "learn" | "flashcards" | "translate" | "quiz" | "sentence" | "bookmarks";
type Direction = "en-bn" | "bn-en";
type SentenceResult = {
  isCorrect: boolean;
  correctedSentence: string;
  explanationBn: string;
  usageFeedbackBn: string;
  mistakes: { original: string; correction: string; type: string; explanationBn: string }[];
};

const sentenceExamples: Record<string, { simple: string; compound: string; complex: string }> = {
  allocate: { simple: "The council allocated more funding to schools.", compound: "The council allocated more funding, and the schools improved their libraries.", complex: "Because rural schools lack resources, the council should allocate more funding to them." },
  curriculum: { simple: "The curriculum includes digital literacy.", compound: "The curriculum covers science, but it also develops creative skills.", complex: "Although the curriculum is demanding, it prepares students for university." },
  detrimental: { simple: "Air pollution is detrimental to public health.", compound: "Cars are convenient, but their emissions are detrimental to the environment.", complex: "When children spend too much time online, it can be detrimental to their wellbeing." },
  mitigate: { simple: "Trees help mitigate air pollution.", compound: "The risk is serious, but careful planning can mitigate it.", complex: "Governments should invest in clean energy so that they can mitigate climate change." },
  sustainable: { simple: "The city needs sustainable transport.", compound: "Solar power is sustainable, and it reduces household emissions.", complex: "If cities adopt sustainable policies, residents will enjoy a healthier environment." },
  inevitable: { simple: "Technological change is inevitable.", compound: "Automation is inevitable, but workers can learn new skills.", complex: "Although some job losses are inevitable, new industries may create opportunities." },
  disparity: { simple: "The report reveals a regional disparity.", compound: "Urban incomes increased, but the rural disparity remained.", complex: "Unless access to education improves, the disparity will continue to grow." },
  prevalent: { simple: "Smartphones are prevalent among teenagers.", compound: "Online learning is prevalent, and many universities now offer digital courses.", complex: "Because remote work is increasingly prevalent, companies need clearer digital policies." },
  facilitate: { simple: "Technology can facilitate learning.", compound: "The app facilitates communication, and it helps teams share documents.", complex: "Teachers use visual aids because they facilitate a clearer understanding of difficult ideas." },
  conventional: { simple: "Many schools use conventional teaching methods.", compound: "The approach is conventional, but it remains effective.", complex: "While conventional classrooms offer direct interaction, online courses provide greater flexibility." },
  depletion: { simple: "Deforestation causes resource depletion.", compound: "Demand continues to rise, and resource depletion is accelerating.", complex: "If consumption remains unchecked, the depletion of natural resources will intensify." },
  empirical: { simple: "The claim requires empirical evidence.", compound: "The theory is persuasive, but it lacks empirical support.", complex: "Although the proposal sounds effective, it should be tested through empirical research." },
};

const modes: { id: Mode; label: string; icon: typeof BookOpen }[] = [
  { id: "learn", label: "Learn", icon: BookOpen },
  { id: "flashcards", label: "Flashcards", icon: RotateCcw },
  { id: "translate", label: "Translation", icon: Languages },
  { id: "quiz", label: "Quiz", icon: Brain },
  { id: "sentence", label: "Sentence Lab", icon: SpellCheck },
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
];

export default function VocabularyPracticePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const libraryQuery = useQuery({
    queryKey: ["vocabulary-library"],
    queryFn: async () => {
      try {
        return await vocabularyService.getMine();
      } catch (err) {
        console.warn("Vocabulary library fetch failed, using fallback:", err);
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
  const library = libraryQuery.data?.data;
  const [mode, setMode] = useState<Mode>("learn");
  const [topic, setTopic] = useState<string>("All");
  const [index, setIndex] = useState(0);
  const [known, setKnown] = useState<string[]>([]);
  const [direction, setDirection] = useState<Direction>("en-bn");
  const [answer, setAnswer] = useState("");
  const [answerState, setAnswerState] = useState<"idle" | "correct" | "wrong">("idle");
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [sentence, setSentence] = useState("");
  const [sentenceResult, setSentenceResult] = useState<SentenceResult | null>(null);
  const [checkingSentence, setCheckingSentence] = useState(false);
  const [sentenceError, setSentenceError] = useState("");

  const customWords = useMemo<VocabularyWord[]>(() => (library?.words ?? []).map((word) => ({
    id: `custom:${word.id}`,
    word: word.word,
    bangla: word.bangla,
    pronunciation: word.pronunciation || "",
    partOfSpeech: word.partOfSpeech,
    definition: word.definition,
    example: word.example,
    exampleBangla: word.exampleBangla || "",
    collocations: word.collocations,
    topic: word.topic,
    level: word.level,
    simpleExample: word.simpleExample || word.example,
    compoundExample: word.compoundExample || word.example,
    complexExample: word.complexExample || word.example,
  })), [library?.words]);
  const allWords = useMemo(() => [...ieltsVocabulary, ...customWords], [customWords]);

  const bookmarkedIds = useMemo(() => library?.bookmarks.map((item) => item.wordId) ?? [], [library?.bookmarks]);
  const bookmarkedWords = useMemo(() => allWords.filter((word) => bookmarkedIds.includes(word.id)), [allWords, bookmarkedIds]);
  const words = useMemo(() => topic === "All" ? allWords : topic === "Bookmarked" ? bookmarkedWords : allWords.filter((word) => word.topic === topic), [allWords, bookmarkedWords, topic]);
  const current = words[index % (words.length || 1)] ?? allWords[0];

  useEffect(() => {
    const saved = window.localStorage.getItem("ielts-vocabulary-known");
    if (saved) setKnown(JSON.parse(saved));
  }, []);


  useEffect(() => {
    setIndex(0);
    setAnswer("");
    setAnswerState("idle");
  }, [topic, mode, direction]);

  const move = useCallback((step: number) => {
    if (!words.length) return;
    setIndex((value) => (value + step + words.length) % words.length);
    setAnswer("");
    setAnswerState("idle");
    setSentence("");
    setSentenceResult(null);
    setSentenceError("");
  }, [words.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
      if (mode === "bookmarks" || mode === "learn") return;
      if (e.key === "ArrowRight") {
        move(1);
      } else if (e.key === "ArrowLeft") {
        move(-1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [words.length, mode, move]);

  useEffect(() => {
    if (mode !== "quiz" || !current) return;
    const correct = direction === "en-bn" ? current.bangla : current.word;
    const pool = allWords.filter((word) => word.id !== current.id).map((word) => direction === "en-bn" ? word.bangla : word.word);
    const distractors = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
    setQuizOptions([correct, ...distractors].sort(() => Math.random() - 0.5));
  }, [allWords, current, direction, mode]);

  const bookmarkMutation = useMutation({
    mutationFn: ({ id, word, meaning }: { id: string; word: string; meaning: string }) => vocabularyService.toggleBookmark(id, word, meaning),
    onMutate: async ({ id, word, meaning }) => {
      await queryClient.cancelQueries({ queryKey: ["vocabulary-library"] });
      const previous = queryClient.getQueryData<{ data: VocabularyLibrary }>(["vocabulary-library"]);
      queryClient.setQueryData<{ data: VocabularyLibrary }>(["vocabulary-library"], (current) => {
        if (!current) return current;
        const exists = current.data.bookmarks.some((item) => item.wordId === id);
        return { ...current, data: { ...current.data, bookmarks: exists ? current.data.bookmarks.filter((item) => item.wordId !== id) : [...current.data.bookmarks, { id: `optimistic:${id}`, wordId: id, word, meaning }] } };
      });
      return { previous };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(["vocabulary-library"], context.previous);
      toast.error(error?.response?.data?.message || "Failed to update bookmark");
    },
    onSuccess: (res) => {
      const isBookmarked = res.data?.bookmarked;
      toast.success(isBookmarked ? "Word added to bookmarks" : "Word removed from bookmarks");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["vocabulary-library"] }),
  });

  const handleToggleBookmark = (word: VocabularyWord) => {
    if (!user) {
      toast.error("Please login to save bookmarks", {
        description: "Login to keep your saved words synced across devices.",
      });
      return;
    }
    bookmarkMutation.mutate({ id: word.id, word: word.word, meaning: word.bangla });
  };

  const handleStudyWord = (selectedWord: VocabularyWord) => {
    setTopic("Bookmarked");
    const targetIndex = bookmarkedWords.findIndex((w) => w.id === selectedWord.id);
    setIndex(targetIndex >= 0 ? targetIndex : 0);
    setMode("learn");
  };

  const handleOpenSentenceLab = (selectedWord: VocabularyWord) => {
    setTopic("Bookmarked");
    const targetIndex = bookmarkedWords.findIndex((w) => w.id === selectedWord.id);
    setIndex(targetIndex >= 0 ? targetIndex : 0);
    setSentence("");
    setSentenceResult(null);
    setSentenceError("");
    setMode("sentence");
  };

  const speak = useCallback((word: string) => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      toast.error("Pronunciation is not supported by this browser.");
      return;
    }
    const synthesizer = window.speechSynthesis;
    synthesizer.cancel();
    synthesizer.resume();
    const play = () => {
      const utterance = new SpeechSynthesisUtterance(word);
      const voices = synthesizer.getVoices();
      utterance.voice = voices.find((voice) => voice.lang.toLowerCase() === "en-gb")
        ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("en"))
        ?? null;
      utterance.lang = utterance.voice?.lang || "en-GB";
      utterance.rate = 0.82;
      utterance.pitch = 1;
      synthesizer.speak(utterance);
    };
    if (synthesizer.getVoices().length === 0) window.setTimeout(play, 60);
    else play();
  }, []);

  const checkTranslation = () => {
    const expected = direction === "en-bn" ? current.bangla : current.word;
    const normalized = (value: string) => value.trim().toLocaleLowerCase().replace(/[.,!?।]/g, "");
    setAnswerState(normalized(answer) === normalized(expected) ? "correct" : "wrong");
  };

  const chooseQuiz = (option: string) => {
    if (answerState !== "idle") return;
    const expected = direction === "en-bn" ? current.bangla : current.word;
    const correct = option === expected;
    setAnswer(option);
    setAnswerState(correct ? "correct" : "wrong");
    setQuizScore((score) => ({ correct: score.correct + (correct ? 1 : 0), total: score.total + 1 }));
  };

  const checkSentence = async () => {
    if (sentence.trim().length < 4) return;
    setCheckingSentence(true);
    setSentenceResult(null);
    setSentenceError("");
    try {
      const response = await fetch("/api/vocabulary-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: current.word, meaning: current.bangla, sentence }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Sentence could not be checked.");
      setSentenceResult(payload.result);
    } catch (error) {
      setSentenceError(error instanceof Error ? error.message : "Sentence could not be checked.");
    } finally {
      setCheckingSentence(false);
    }
  };

  return (
    <main className="relative z-0 isolate min-h-screen bg-neutral-50 pb-16 text-neutral-950">
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-red-600">IELTS Vocabulary Practice</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Learn words you can actually use.</h1>
              <p className="mt-3 text-sm leading-6 text-neutral-500 sm:text-base">Meaning, pronunciation, collocations, translation, recall and sentence-level feedback—all in one focused practice flow.</p>
            </div>
            <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:gap-3">
              <Stat label="Words" value={allWords.length} />
              <Stat label="Mastered" value={known.length} />
              <Stat label="Quiz score" value={`${quizScore.correct}/${quizScore.total}`} />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl overflow-hidden px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <nav className="grid w-full grid-cols-3 gap-2 pb-2 sm:flex sm:max-w-full sm:gap-2 sm:overflow-x-auto" aria-label="Vocabulary practice modes">
          {modes.map((item) => (
            <button
              key={item.id}
              onClick={() => setMode(item.id)}
              className={`inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-lg px-1.5 text-[10px] font-semibold transition-colors sm:h-10 sm:shrink-0 sm:gap-2 sm:px-4 sm:text-sm ${
                mode === item.id ? "bg-neutral-900 text-white" : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <item.icon className="size-3.5 shrink-0 sm:size-[17px]" />
              <span className="min-w-0 truncate">{item.label}</span>
              {item.id === "bookmarks" && bookmarkedIds.length > 0 && (
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold leading-none ${
                    mode === "bookmarks" ? "bg-white text-neutral-900" : "bg-red-100 text-red-700"
                  }`}
                >
                  {bookmarkedIds.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {mode !== "bookmarks" && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex max-w-full gap-1.5 overflow-x-auto pb-1 sm:gap-2">
              {[...vocabularyTopics, "Bookmarked", ...(customWords.length ? ["Custom"] : [])].map((item) => (
                <button
                  key={item}
                  onClick={() => setTopic(item)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    topic === item ? "bg-red-50 text-red-700" : "text-neutral-500 hover:bg-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            {(mode === "translate" || mode === "quiz") && <DirectionSwitch value={direction} onChange={setDirection} />}
          </div>
        )}

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="flex min-h-105 min-w-0 flex-col justify-between overflow-x-hidden overflow-y-visible rounded-2xl border border-neutral-200 bg-white p-2 sm:min-h-120 sm:p-5 md:p-6 lg:overflow-visible lg:p-7">
            {mode === "bookmarks" ? (
              <BookmarksPanel
                isLoading={libraryQuery.isLoading}
                bookmarkedWords={bookmarkedWords}
                knownIds={known}
                bookmarkLoading={bookmarkMutation.isPending}
                onBookmark={handleToggleBookmark}
                onSpeak={speak}
                onStudyWord={handleStudyWord}
                onOpenSentenceLab={handleOpenSentenceLab}
                onStartLearn={() => {
                  setTopic("Bookmarked");
                  setIndex(0);
                  setMode("learn");
                }}
                onStartFlashcards={() => {
                  setTopic("Bookmarked");
                  setIndex(0);
                  setMode("flashcards");
                }}
                onStartQuiz={() => {
                  setTopic("Bookmarked");
                  setIndex(0);
                  setMode("quiz");
                }}
              />
            ) : !words.length ? (
              <div className="flex min-h-100 flex-col items-center justify-center text-center">
                <Bookmark className="text-neutral-300" size={32} />
                <h2 className="mt-4 text-lg font-semibold">No saved words yet</h2>
                <p className="mt-2 text-sm text-neutral-500">Bookmark a word or add your own vocabulary to practise it here.</p>
              </div>
            ) : (
              <>
                {mode === "learn" && (
                  <LearnPanel
                    words={words}
                    currentIndex={index}
                    onWordChange={(newIndex) => {
                      setIndex(newIndex);
                      setAnswer("");
                      setAnswerState("idle");
                      setSentence("");
                      setSentenceResult(null);
                      setSentenceError("");
                    }}
                    knownIds={known}
                    bookmarkedIds={bookmarkedIds}
                    bookmarkLoading={bookmarkMutation.isPending}
                    onBookmark={handleToggleBookmark}
                    onSpeak={speak}
                    topic={topic}
                    onSwitchMode={setMode}
                  />
                )}
                {mode === "flashcards" && (
                  <Flashcard
                    words={words}
                    position={index}
                    onSpeak={speak}
                    onNext={() => move(1)}
                    onPrevious={() => move(-1)}
                  />
                )}
                {mode === "translate" && (
                  <TranslationPanel
                    word={current}
                    direction={direction}
                    answer={answer}
                    onAnswer={setAnswer}
                    state={answerState}
                    onCheck={checkTranslation}
                  />
                )}
                {mode === "quiz" && (
                  <QuizPanel
                    word={current}
                    direction={direction}
                    options={quizOptions}
                    selected={answer}
                    state={answerState}
                    onChoose={chooseQuiz}
                  />
                )}
                {mode === "sentence" && (
                  <SentencePanel
                    word={current}
                    sentence={sentence}
                    onSentence={setSentence}
                    onCheck={checkSentence}
                    loading={checkingSentence}
                    result={sentenceResult}
                    error={sentenceError}
                    onSpeak={() => speak(current.word)}
                    bookmarked={bookmarkedIds.includes(current.id)}
                    bookmarkLoading={bookmarkMutation.isPending}
                    onBookmark={() => bookmarkMutation.mutate({ id: current.id, word: current.word, meaning: current.bangla })}
                  />
                )}

                {mode !== "learn" && mode !== "flashcards" && (
                  <div className="mt-8 flex items-center justify-between border-t border-neutral-100 pt-5">
                    <button
                      type="button"
                      onClick={() => move(-1)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900"
                    >
                      <ChevronLeft size={18} /> Previous
                    </button>
                    <span className="text-xs font-medium text-neutral-400">
                      {index + 1} of {words.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => move(1)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                    >
                      Next <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Current word</p>
              <p className="mt-3 text-2xl font-bold">{current.word}</p>
              <p className="mt-1 text-sm text-neutral-500">{current.bangla}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge>{current.topic}</Badge>
                <Badge>{current.level}</Badge>
                <Badge>{current.partOfSpeech}</Badge>
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Session progress</p>
                <span className="text-xs text-neutral-400">
                  {known.filter((id) => words.some((word) => word.id === id)).length}/{words.length || 1}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-red-600"
                  style={{
                    width: `${((known.filter((id) => words.some((word) => word.id === id)).length / (words.length || 1)) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-neutral-500">
                Mark words as mastered from Learn mode. Your progress is saved on this device.
              </p>
            </div>
            <div className="rounded-2xl bg-neutral-900 p-5 text-white">
              <Sparkles size={20} />
              <p className="mt-4 text-sm font-semibold">IELTS usage tip</p>
              <p className="mt-2 text-xs leading-5 text-white/65">
                Learn a word with its collocations and one natural sentence. Avoid forcing advanced words where a simple word is more accurate.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function LearnPanel({
  words,
  currentIndex,
  onWordChange,
  knownIds,
  bookmarkedIds,
  bookmarkLoading,
  onBookmark,
  onSpeak,
  topic,
  onSwitchMode,
}: {
  words: VocabularyWord[];
  currentIndex: number;
  onWordChange: (newIndex: number) => void;
  knownIds: string[];
  bookmarkedIds: string[];
  bookmarkLoading: boolean;
  onBookmark: (word: VocabularyWord) => void;
  onSpeak: (word: string) => void;
  topic: string;
  onSwitchMode?: (mode: Mode) => void;
}) {
  const bookRef = useRef<ThreeDImagePageflipHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageDims, setPageDims] = useState<{ width: number; height: number } | null>(null);

  // Responsive page sizing using container measurements to guarantee generous side padding and 100% visibility
  useEffect(() => {
    if (!containerRef.current) return;

    const calculateDims = (containerWidth: number) => {
      // Book spread = 2 * pageWidth
      // Ensuring generous side padding around the book inside the card
      if (containerWidth >= 850) {
        return { width: 300, height: 480 };
      } else if (containerWidth >= 720) {
        return { width: 280, height: 450 };
      } else if (containerWidth >= 600) {
        return { width: 250, height: 410 };
      } else if (containerWidth >= 480) {
        return { width: 205, height: 350 };
      } else {
        // Keep both leaves visible instead of making the open book horizontally scroll.
        const safeWidth = Math.max(108, Math.floor((containerWidth - 44) / 2));
        return { width: safeWidth, height: Math.round(safeWidth * 1.48) };
      }
    };

    const updateFromContainer = () => {
      if (containerRef.current) {
        const cw = containerRef.current.clientWidth;
        if (cw > 0) {
          const next = calculateDims(cw);
          setPageDims((current) =>
            current?.width === next.width && current.height === next.height ? current : next
          );
        }
      }
    };

    updateFromContainer();

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cw = entry.contentRect.width;
        if (cw > 0) {
          const next = calculateDims(cw);
          setPageDims((current) =>
            current?.width === next.width && current.height === next.height ? current : next
          );
        }
      }
    });

    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Sync external index jumps (topic change or bookmarked word selection)
  useEffect(() => {
    if (bookRef.current) {
      const currentTurned = bookRef.current.getTurnedCount();
      const targetTurned = currentIndex + 1;
      if (currentTurned !== targetTurned && targetTurned >= 1 && targetTurned <= words.length) {
        bookRef.current.goTo(targetTurned);
      }
    }
  }, [currentIndex, words.length]);

  const handlePageChange = (turnedCount: number) => {
    if (turnedCount >= 1 && turnedCount <= words.length) {
      onWordChange(turnedCount - 1);
    }
  };

  // Build textbook pages (Leaf 0: Cover / Word 0 Left, Leaf i: Word i-1 Right / Word i Left, Leaf M: Word M-1 Right / Back Cover)
  const pages = useMemo<PageFlipLeaf[]>(() => {
    if (!words.length) return [];
    const list: PageFlipLeaf[] = [];

    // Leaf 0: Cover (Front) & Word 0 Left (Back)
    list.push({
      id: "leaf-cover-0",
      frontContent: (
        <BookCover
          topic={topic}
          wordCount={words.length}
          onOpen={() => bookRef.current?.goTo(1)}
        />
      ),
      backContent: (
        <WordLeftPage
          word={words[0]}
          isKnown={knownIds.includes(words[0].id)}
          isBookmarked={bookmarkedIds.includes(words[0].id)}
          bookmarkLoading={bookmarkLoading}
          onBookmark={() => onBookmark(words[0])}
          onSpeak={() => onSpeak(words[0].word)}
          wordIndex={0}
          totalWords={words.length}
        />
      ),
    });

    // Intermediate leaves: Word i-1 Right (Front) & Word i Left (Back)
    for (let i = 1; i < words.length; i++) {
      const prevWord = words[i - 1];
      const currWord = words[i];
      list.push({
        id: `leaf-word-${i}`,
        frontContent: (
          <WordRightPage
            word={prevWord}
            wordIndex={i - 1}
            totalWords={words.length}
          />
        ),
        backContent: (
          <WordLeftPage
            word={currWord}
            isKnown={knownIds.includes(currWord.id)}
            isBookmarked={bookmarkedIds.includes(currWord.id)}
            bookmarkLoading={bookmarkLoading}
            onBookmark={() => onBookmark(currWord)}
            onSpeak={() => onSpeak(currWord.word)}
            wordIndex={i}
            totalWords={words.length}
          />
        ),
      });
    }

    // Final leaf: Last Word Right (Front) & Back Cover (Back)
    const lastIdx = words.length - 1;
    list.push({
      id: `leaf-back-${words.length}`,
      frontContent: (
        <WordRightPage
          word={words[lastIdx]}
          wordIndex={lastIdx}
          totalWords={words.length}
        />
      ),
      backContent: (
        <BookBackCover
          topic={topic}
          wordCount={words.length}
          masteredCount={words.filter((w) => knownIds.includes(w.id)).length}
          onRestart={() => bookRef.current?.goTo(1)}
          onStartQuiz={() => onSwitchMode?.("quiz")}
          onStartSentenceLab={() => onSwitchMode?.("sentence")}
        />
      ),
    });

    return list;
  }, [words, topic, knownIds, bookmarkedIds, bookmarkLoading, onBookmark, onSpeak, onSwitchMode]);

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center">
      {/* 3D Book Pageflip Container with generous side padding */}
      <div className="flex min-h-52 w-full items-center justify-center overflow-hidden px-0 pb-5 pt-3 sm:min-h-105 sm:px-4 sm:py-5 md:px-8 lg:overflow-visible">
        {pageDims ? <ThreeDImagePageflip
          ref={bookRef}
          pages={pages}
          pageWidth={pageDims.width}
          pageHeight={pageDims.height}
          perspective={1300}
          duration={0.65}
          peekAngle={14}
          shadowIntensity={0.08}
          spineShift={true}
          showPageNumbers={false}
          showControls={false}
          defaultTurnedIndex={Math.min(Math.max(1, currentIndex + 1), words.length)}
          onPageChange={handlePageChange}
          style={{ marginInline: "auto" }}
        /> : <div className="h-64 w-full max-w-md rounded-xl bg-neutral-100 sm:h-96" aria-label="Preparing vocabulary book" role="status" />}
      </div>

      {/* Book Bottom Controls & Word Indicator */}
      <div className="mt-3 grid w-full max-w-3xl grid-cols-[auto_1fr_auto] items-center gap-1.5 border-t border-neutral-200/80 pt-3 sm:mt-6 sm:gap-3 sm:pt-5">
        <button
          type="button"
          onClick={() => bookRef.current?.prev()}
          className="inline-flex h-9 items-center gap-1 rounded-xl border border-neutral-200 bg-white px-2 text-[10px] font-semibold text-neutral-700 shadow-2xs transition-all cursor-pointer hover:bg-neutral-50 hover:text-neutral-900 sm:h-9.5 sm:gap-1.5 sm:px-4 sm:text-xs"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Previous </span>Page
        </button>

        <div className="flex min-w-0 items-center justify-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => bookRef.current?.reset()}
            className="hidden h-8.5 items-center gap-1.5 rounded-lg bg-neutral-100 px-3 text-xs font-medium text-neutral-600 transition-colors cursor-pointer hover:bg-neutral-200 sm:inline-flex"
            title="Close book to Cover"
          >
            <BookOpen size={14} />
            Cover
          </button>

          <div className="min-w-0 truncate rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-center text-[10px] font-semibold text-neutral-700 shadow-2xs sm:px-3.5 sm:text-xs">
            <span className="hidden sm:inline">Word </span><span className="font-bold text-red-600">{currentIndex + 1}</span>/{words.length}
          </div>
        </div>

        <button
          type="button"
          onClick={() => bookRef.current?.next()}
          className="inline-flex h-9 items-center gap-1 rounded-xl bg-neutral-900 px-2 text-[10px] font-semibold text-white shadow-2xs transition-all cursor-pointer hover:bg-red-600 sm:h-9.5 sm:gap-1.5 sm:px-4.5 sm:text-xs"
        >
          Next <span className="hidden sm:inline">Page</span>
          <ChevronRight size={16} />
        </button>
      </div>

      <p className="mt-2.5 text-center text-[11px] text-neutral-400">
        💡 Hover near edges to peek · Click pages directly to flip with realistic 3D paper feel
      </p>
    </div>
  );
}

function WordLeftPage({
  word,
  isKnown,
  isBookmarked,
  bookmarkLoading,
  onBookmark,
  onSpeak,
  wordIndex,
  totalWords,
}: {
  word: VocabularyWord;
  isKnown: boolean;
  isBookmarked: boolean;
  bookmarkLoading: boolean;
  onBookmark: () => void;
  onSpeak: () => void;
  wordIndex: number;
  totalWords: number;
}) {
  return (
    <div className="relative flex h-full w-full min-h-0 touch-pan-y flex-col justify-between overflow-x-hidden overflow-y-auto overscroll-contain bg-[linear-gradient(90deg,#f1eee5_0%,#fbfaf5_8%,#fffef9_88%,#ece8dc_100%)] p-3 pr-3.5 text-neutral-900 shadow-[inset_-10px_0_18px_-18px_rgba(0,0,0,.5)] select-text [scrollbar-width:thin] sm:overflow-hidden sm:p-4 sm:pr-5">
      <div>
        {/* Top Bar: Topic, Band, and Actions */}
        <div className="flex items-center justify-between gap-1.5 border-b border-neutral-200/80 pb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="rounded-md bg-neutral-900 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white">
              {word.topic}
            </span>
            <span className="rounded-md bg-amber-100 text-amber-900 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold border border-amber-300/50">
              Band 7.5+ · {word.level}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSpeak();
              }}
              title="Listen to British pronunciation"
              aria-label={`Pronounce ${word.word}`}
              className="grid size-7 sm:size-7.5 place-items-center rounded-full bg-white text-neutral-700 shadow-2xs border border-neutral-200/80 transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer"
            >
              <Volume2 size={13} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBookmark();
              }}
              disabled={bookmarkLoading}
              title={isBookmarked ? "Remove Bookmark" : "Bookmark this word"}
              aria-label={isBookmarked ? "Remove Bookmark" : "Bookmark this word"}
              className={`grid size-7 sm:size-7.5 place-items-center rounded-full shadow-2xs border transition-all cursor-pointer ${
                isBookmarked
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-white text-neutral-500 border-neutral-200/80 hover:bg-neutral-50 hover:text-neutral-900"
              }`}
            >
              <Bookmark size={12} fill={isBookmarked ? "currentColor" : "none"} />
            </button>

            {isKnown && (
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-neutral-500">
                <Check size={11} /> Learned
              </span>
            )}
          </div>
        </div>

        {/* Word Title & Phonetics */}
        <div className="mt-2.5 sm:mt-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-neutral-950 font-serif">
              {word.word}
            </h2>
            <span className="text-[11px] sm:text-xs font-mono text-neutral-500">
              {word.pronunciation}
            </span>
            <span className="rounded-full bg-neutral-200/70 px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold uppercase text-neutral-700">
              {word.partOfSpeech}
            </span>
          </div>
        </div>

        {/* Bengali Meaning */}
        <div className="mt-2.5 sm:mt-3 rounded-xl bg-white p-2 sm:p-2.5 border border-neutral-200/70 shadow-2xs">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-red-600">বাংলা অর্থ</p>
          <p className="mt-0.5 text-sm sm:text-base font-bold text-neutral-900">
            {word.bangla}
          </p>
        </div>

        {/* English Definition */}
        <div className="mt-2 rounded-xl bg-white p-2 sm:p-2.5 border border-neutral-200/70 shadow-2xs">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-400">Definition</p>
          <p className="mt-0.5 text-[11px] sm:text-xs leading-relaxed text-neutral-700">
            {word.definition}
          </p>
        </div>

        {/* IELTS Example Usage */}
        <div className="mt-2 rounded-xl bg-amber-50/60 p-2 sm:p-2.5 border border-amber-200/60">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-800">IELTS Contextual Usage</p>
          <p className="mt-0.5 text-[11px] sm:text-xs font-medium italic text-neutral-800 leading-snug">
            "{word.example}"
          </p>
          <p className="mt-0.5 text-[10px] sm:text-[11px] text-neutral-600 leading-tight">
            {word.exampleBangla}
          </p>
        </div>
      </div>

      {/* Page Footer */}
      <div className="mt-2 flex items-center justify-between border-t border-neutral-200/80 pt-1.5 text-[9px] sm:text-[10px] font-mono text-neutral-400">
        <span>IELTS Academic Wordbook</span>
        <span>Word {wordIndex + 1} of {totalWords}</span>
      </div>
    </div>
  );
}

function WordRightPage({
  word,
  wordIndex,
  totalWords,
}: {
  word: VocabularyWord;
  wordIndex: number;
  totalWords: number;
}) {
  const examples = getSentenceExamples(word);

  return (
    <div className="relative flex h-full w-full min-h-0 touch-pan-y flex-col justify-between overflow-x-hidden overflow-y-auto overscroll-contain bg-[linear-gradient(90deg,#ece8dc_0%,#fffef9_12%,#fbfaf5_92%,#f1eee5_100%)] p-3 pl-3.5 text-neutral-900 shadow-[inset_10px_0_18px_-18px_rgba(0,0,0,.5)] select-text [scrollbar-width:thin] sm:overflow-hidden sm:p-4 sm:pl-5">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-600" />
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-800">
              Sentence & Collocation Lab
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-mono text-neutral-400">
            Applied Writing
          </span>
        </div>

        {/* Sentence Patterns */}
        <div className="mt-2.5">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Sentence Structures (Task 2 Band 8+)
          </p>
          <div className="mt-1 space-y-1 sm:space-y-1.5">
            <div className="rounded-lg bg-white p-1.5 sm:p-2 border border-neutral-200/70 shadow-2xs">
              <span className="inline-block rounded bg-sky-100 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase text-sky-800">
                Simple
              </span>
              <p className="mt-0.5 text-[11px] sm:text-xs text-neutral-800 leading-snug">
                {examples.simple}
              </p>
            </div>

            <div className="rounded-lg bg-white p-1.5 sm:p-2 border border-neutral-200/70 shadow-2xs">
              <span className="inline-block rounded bg-indigo-100 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase text-indigo-800">
                Compound
              </span>
              <p className="mt-0.5 text-[11px] sm:text-xs text-neutral-800 leading-snug">
                {examples.compound}
              </p>
            </div>

            <div className="rounded-lg bg-white p-1.5 sm:p-2 border border-neutral-200/70 shadow-2xs">
              <span className="inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase text-emerald-800">
                Complex
              </span>
              <p className="mt-0.5 text-[11px] sm:text-xs text-neutral-800 leading-snug">
                {examples.complex}
              </p>
            </div>
          </div>
        </div>

        {/* Collocations */}
        <div className="mt-2.5">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            High-Yield Collocations
          </p>
          <div className="mt-1 flex flex-wrap gap-1 sm:gap-1.5">
            {word.collocations.map((item) => (
              <span
                key={item}
                className="rounded-md bg-white px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold text-neutral-700 border border-neutral-200 shadow-2xs"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Examiner Band 8+ Advice */}
        <div className="mt-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 p-2 sm:p-2.5 text-neutral-900 shadow-2xs">
          <div className="flex items-center gap-1.5 text-amber-800">
            <Brain size={13} />
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Examiner Insight</p>
          </div>
          <p className="mt-0.5 text-[10px] sm:text-[11px] leading-relaxed text-neutral-700">
            Use <strong className="text-neutral-950 font-semibold">"{word.word}"</strong> with natural collocations in Speaking Part 3 and Writing Task 2 for top lexical score.
          </p>
        </div>
      </div>

      {/* Page Footer */}
      <div className="mt-2 flex items-center justify-between border-t border-neutral-200/80 pt-1.5 text-[9px] sm:text-[10px] font-mono text-neutral-400">
        <span>{word.topic} Practice Guide</span>
        <span>Page {(wordIndex + 1) * 2} of {totalWords * 2}</span>
      </div>
    </div>
  );
}

function BookCover({
  topic,
  wordCount,
  onOpen,
}: {
  topic: string;
  wordCount: number;
  onOpen: () => void;
}) {
  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[10px] border border-slate-300 bg-[#f7f4ec] p-3 text-slate-950 shadow-sm select-none sm:p-5">
      <Image
        src="/vocabulary/ielts-vocabulary-cover.png"
        alt="IELTSPrep IELTS Vocabulary Academic Practice Book"
        fill
        sizes="(max-width: 639px) 170px, 300px"
        className="pointer-events-none z-40 bg-white object-cover object-center"
        priority
      />
      <div>
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
          <Image src={ieltsPrepLogo} alt="IELTSPrep" className="h-auto w-16 object-contain sm:w-24" sizes="96px" />
          <span className="rounded-sm bg-red-600 px-1.5 py-1 text-[7px] font-black uppercase tracking-wider text-white sm:px-2 sm:text-[9px]">
            Academic
          </span>
        </div>

        <div className="mt-3 text-center sm:mt-5">
          <div className="mx-auto grid size-9 place-items-center rounded-full border-2 border-red-600 text-red-600 sm:size-11">
            <BookOpen size={20} />
          </div>

          <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.16em] text-red-600 sm:text-[10px]">Complete IELTS Preparation</p>
          <h2 className="mt-1 font-serif text-lg font-black leading-none tracking-tight text-[#14213d] sm:text-3xl">
            VOCABULARY
          </h2>
          <p className="mt-1 font-serif text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600 sm:text-xs">
            Practice Book
          </p>

          <div className="mt-2 border-y border-slate-300 py-1.5 sm:mt-3 sm:py-2">
            <p className="text-[9px] font-black uppercase text-[#14213d] sm:text-xs">{topic} Edition</p>
            <p className="text-[7px] text-slate-500 sm:text-[10px]">{wordCount} high-scoring words · Band 7.5–9.0</p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="w-full rounded-md bg-[#14213d] px-3 py-1.5 text-[9px] font-bold text-white shadow-sm transition-colors cursor-pointer hover:bg-red-600 sm:py-2 sm:text-xs"
        >
          Open Vocabulary Book 📖
        </button>
        <p className="mt-1.5 text-[9px] sm:text-[10px] text-neutral-400">
          Click cover or button to flip inside
        </p>
      </div>
    </div>
  );
}

function BookBackCover({
  topic,
  wordCount,
  masteredCount,
  onRestart,
  onStartQuiz,
  onStartSentenceLab,
}: {
  topic: string;
  wordCount: number;
  masteredCount: number;
  onRestart: () => void;
  onStartQuiz: () => void;
  onStartSentenceLab: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col justify-between bg-linear-to-br from-slate-900 via-neutral-900 to-stone-900 p-5 sm:p-7 text-white select-none border border-amber-400/30 rounded-[10px] shadow-sm">
      <div>
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-400">
            TOPIC COMPLETED
          </span>
          <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[8px] sm:text-[9px] font-bold text-emerald-400 border border-emerald-400/30">
            {masteredCount}/{wordCount} Mastered
          </span>
        </div>

        <div className="mt-4 sm:mt-5 text-center">
          <div className="mx-auto grid size-10 sm:size-12 place-items-center rounded-2xl bg-emerald-400/10 border border-emerald-400/30 text-emerald-400">
            <Check size={22} />
          </div>

          <h3 className="mt-2 text-base sm:text-lg font-extrabold text-white">
            Splendid Work!
          </h3>
          <p className="mt-0.5 text-[11px] sm:text-xs text-neutral-300">
            You completed all {wordCount} words in the <strong>{topic}</strong> collection.
          </p>

          <div className="mt-3 rounded-xl bg-white/5 p-2.5 text-left border border-white/10">
            <p className="text-[11px] font-semibold text-amber-300">Next Recommended Steps:</p>
            <ul className="mt-1 space-y-0.5 text-[10px] text-neutral-300">
              <li>• Test recall with the <strong>Quiz</strong> mode</li>
              <li>• Write sentences in <strong>Sentence Lab</strong></li>
              <li>• Review bookmarked words anytime</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onStartQuiz();
          }}
          className="w-full rounded-xl bg-red-600 px-3 py-1.5 sm:py-2 text-xs font-bold text-white shadow-md hover:bg-red-500 transition-all cursor-pointer"
        >
          Take Vocabulary Quiz →
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartSentenceLab();
            }}
            className="flex-1 rounded-xl bg-white/10 px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold text-neutral-200 hover:bg-white/15 transition-all cursor-pointer"
          >
            Sentence Lab
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRestart();
            }}
            className="flex-1 rounded-xl bg-white/10 px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold text-neutral-200 hover:bg-white/15 transition-all cursor-pointer"
          >
            Review ↺
          </button>
        </div>
      </div>
    </div>
  );
}

function Flashcard({ words, position, onSpeak, onNext, onPrevious }: { words: VocabularyWord[]; position: number; onSpeak: (word: string) => void; onNext: () => void; onPrevious: () => void }) {
  const visibleCards = Array.from({ length: Math.min(5, words.length) }, (_, offset) => words[(position + offset) % words.length]);
  const gradients = [
    "bg-[#ff5e5b]",
    "bg-[#d00000]",
    "bg-[#ffff3f]",
    "bg-[#fe6a86]",
    "bg-[#c86bfa]",
    "bg-[#80ffdb]",
    "bg-[#b8c0ff]",
    "bg-[#ef476f]",
    "bg-[#fae0e4]",
  ];
  const cards = visibleCards.map((word, cardIndex) => ({
    id: word.id,
    bgClass: gradients[(position + cardIndex) % gradients.length],
    theme: "dark" as const,
    icon: <div className="flex h-full w-full flex-col p-6 text-left sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">{word.topic} · {word.level}</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">{word.word}</h2><p className="mt-1 text-sm text-neutral-500">{word.pronunciation} · {word.partOfSpeech}</p></div><button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onSpeak(word.word); }} className="grid size-10 shrink-0 place-items-center rounded-full bg-white/75 text-neutral-600 shadow-sm hover:text-red-600" aria-label={`Pronounce ${word.word}`}><Volume2 size={19} /></button></div><div className="mt-6 border-t border-black/10 pt-5"><p className="text-xl font-bold text-neutral-900">{word.bangla}</p><p className="mt-2 text-sm leading-6 text-neutral-600">{word.definition}</p></div><div className="mt-auto rounded-xl bg-white/65 p-4"><p className="text-sm font-medium leading-6 text-neutral-700">{word.example}</p><p className="mt-1 text-xs leading-5 text-neutral-500">{word.exampleBangla}</p></div><div className="mt-4 flex flex-wrap gap-1.5">{word.collocations.slice(0, 3).map((item) => <span key={item} className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium text-neutral-600">{item}</span>)}</div></div>,
  }));
  return <div className="mx-auto w-full max-w-3xl py-2"><div className="flex w-full justify-center overflow-hidden px-1 py-4 sm:px-4"><SlidingCards key={visibleCards[0]?.id} cards={cards} cardSize="h-full w-full" className="h-112.5 w-full max-w-xl" onCardClick={() => onNext()} onSwipe={(direction) => direction === "left" ? onNext() : onPrevious()} /></div><p className="mt-1 text-center text-xs text-neutral-400">Swipe a card or use the controls below</p><div className="mt-5 flex items-center justify-between"><button onClick={onPrevious} className="inline-flex h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"><ChevronLeft size={17} /> Previous</button><span className="text-xs font-medium text-neutral-400">{position + 1} of {words.length}</span><button onClick={onNext} className="inline-flex h-10 items-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white hover:bg-red-600">Next <ChevronRight size={17} /></button></div></div>;
}

function TranslationPanel({ word, direction, answer, onAnswer, state, onCheck }: { word: VocabularyWord; direction: Direction; answer: string; onAnswer: (value: string) => void; state: "idle" | "correct" | "wrong"; onCheck: () => void }) {
  const prompt = direction === "en-bn" ? word.word : word.bangla; const expected = direction === "en-bn" ? word.bangla : word.word;
  return <div className="mx-auto max-w-2xl py-8"><p className="text-center text-xs font-semibold uppercase tracking-wider text-neutral-400">Translate into {direction === "en-bn" ? "Bangla" : "English"}</p><h2 className="mt-5 text-center text-3xl font-bold">{prompt}</h2><input value={answer} onChange={(event) => { onAnswer(event.target.value); }} onKeyDown={(event) => event.key === "Enter" && onCheck()} placeholder="Type your answer" className="mt-10 h-12 w-full rounded-lg border border-neutral-300 px-4 text-center text-base outline-none focus:border-neutral-900" /><button onClick={onCheck} disabled={!answer.trim()} className="mt-3 h-11 w-full rounded-lg bg-neutral-900 text-sm font-semibold text-white disabled:opacity-40">Check answer</button>{state !== "idle" && <Feedback correct={state === "correct"} expected={expected} />}</div>;
}

function QuizPanel({ word, direction, options, selected, state, onChoose }: { word: VocabularyWord; direction: Direction; options: string[]; selected: string; state: "idle" | "correct" | "wrong"; onChoose: (value: string) => void }) {
  const prompt = direction === "en-bn" ? word.word : word.bangla; const expected = direction === "en-bn" ? word.bangla : word.word;
  return <div className="mx-auto max-w-2xl py-6"><p className="text-center text-xs font-semibold uppercase tracking-wider text-neutral-400">Choose the correct meaning</p><h2 className="mt-5 text-center text-3xl font-bold">{prompt}</h2><div className="mt-8 grid gap-3 sm:grid-cols-2">{options.map((option) => { const showCorrect = state !== "idle" && option === expected; const showWrong = state === "wrong" && option === selected; return <button key={option} onClick={() => onChoose(option)} className={`min-h-14 rounded-lg border px-4 text-left text-sm font-semibold transition-colors ${showCorrect ? "border-emerald-300 bg-emerald-50 text-emerald-800" : showWrong ? "border-red-300 bg-red-50 text-red-700" : "border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50"}`}>{option}</button>; })}</div>{state !== "idle" && <Feedback correct={state === "correct"} expected={expected} />}</div>;
}

function SentencePanel({
  word,
  sentence,
  onSentence,
  onCheck,
  loading,
  result,
  error,
  onSpeak,
  bookmarked,
  bookmarkLoading,
  onBookmark,
}: {
  word: VocabularyWord;
  sentence: string;
  onSentence: (value: string) => void;
  onCheck: () => void;
  loading: boolean;
  result: SentenceResult | null;
  error: string;
  onSpeak: () => void;
  bookmarked?: boolean;
  bookmarkLoading?: boolean;
  onBookmark?: () => void;
}) {
  const examples = getSentenceExamples(word);
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-4 rounded-xl bg-neutral-50 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Use this word</p>
          <h2 className="mt-2 text-2xl font-bold">{word.word}</h2>
          <p className="mt-1 text-sm text-neutral-500">
            {word.bangla} · {word.pronunciation}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onBookmark && (
            <button
              type="button"
              onClick={onBookmark}
              disabled={bookmarkLoading}
              className={`grid size-9 place-items-center rounded-lg border transition-colors ${
                bookmarked
                  ? "border-red-200 bg-red-50 text-red-600"
                  : "border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-100"
              }`}
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark word"}
              title={bookmarked ? "Remove bookmark" : "Bookmark word"}
            >
              <Bookmark size={17} fill={bookmarked ? "currentColor" : "none"} />
            </button>
          )}
          <button
            type="button"
            onClick={onSpeak}
            className="grid size-9 place-items-center rounded-full bg-white text-neutral-600 transition-colors hover:bg-neutral-100"
            aria-label={`Pronounce ${word.word}`}
            title="Pronounce word"
          >
            <Volume2 size={18} />
          </button>
        </div>
      </div>
      <label className="mt-6 block text-sm font-semibold">Write your own English sentence</label>
      <textarea
        value={sentence}
        onChange={(event) => onSentence(event.target.value)}
        rows={5}
        placeholder={`Write a sentence using “${word.word}”...`}
        className="mt-2 w-full resize-none rounded-xl border border-neutral-300 p-4 text-sm leading-6 outline-none focus:border-neutral-900"
      />
      <button
        onClick={onCheck}
        disabled={loading || sentence.trim().length < 4}
        className="mt-3 inline-flex h-11 items-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
      >
        {loading ? <Loader2 className="animate-spin" size={17} /> : <Sparkles size={17} />} Check my sentence
      </button>
      {error && <p className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {result && (
        <div
          className={`mt-6 rounded-xl border p-5 ${
            result.isCorrect ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {result.isCorrect ? <Check className="text-emerald-600" size={20} /> : <X className="text-amber-600" size={20} />}
            {result.isCorrect ? "সঠিক ব্যবহার" : "ভুলগুলো চিহ্নিত করা হয়েছে"}
          </div>
          {result.mistakes.length > 0 && (
            <div className="mt-4 space-y-3">
              {result.mistakes.map((mistake, index) => (
                <div key={`${mistake.original}-${index}`} className="rounded-lg border border-amber-200 bg-white/70 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <mark className="rounded bg-red-100 px-1.5 py-0.5 font-semibold text-red-700 line-through">
                      {mistake.original}
                    </mark>
                    <span>→</span>
                    <mark className="rounded bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-700">
                      {mistake.correction}
                    </mark>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-neutral-500">
                      {mistake.type}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-neutral-600">{mistake.explanationBn}</p>
                </div>
              ))}
            </div>
          )}
          {!result.isCorrect && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Correct sentence</p>
              <p className="mt-1 rounded-lg bg-white/70 p-3 text-sm font-semibold leading-6">{result.correctedSentence}</p>
            </div>
          )}
          <p className="mt-4 text-sm leading-6 text-neutral-700">{result.explanationBn}</p>
          <p className="mt-2 text-sm leading-6 text-neutral-600">{result.usageFeedbackBn}</p>
        </div>
      )}
      <div className="mt-8 border-t border-neutral-100 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Examples to guide you</p>
        <div className="mt-3 grid gap-3">
          <SentenceExample label="Simple" text={examples.simple} />
          <SentenceExample label="Compound" text={examples.compound} />
          <SentenceExample label="Complex" text={examples.complex} />
        </div>
      </div>
    </div>
  );
}

function BookmarksPanel({
  isLoading,
  bookmarkedWords,
  knownIds,
  bookmarkLoading,
  onBookmark,
  onSpeak,
  onStudyWord,
  onOpenSentenceLab,
  onStartLearn,
  onStartFlashcards,
  onStartQuiz,
}: {
  isLoading?: boolean;
  bookmarkedWords: VocabularyWord[];
  knownIds: string[];
  bookmarkLoading: boolean;
  onBookmark: (word: VocabularyWord) => void;
  onSpeak: (word: string) => void;
  onStudyWord: (word: VocabularyWord) => void;
  onOpenSentenceLab: (word: VocabularyWord) => void;
  onStartLearn: () => void;
  onStartFlashcards: () => void;
  onStartQuiz: () => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col gap-4 border-b border-neutral-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 rounded-md bg-neutral-200" />
            <div className="h-4 w-72 rounded-md bg-neutral-100" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-5 w-28 rounded bg-neutral-200" />
                <div className="size-7 rounded-full bg-neutral-100" />
              </div>
              <div className="h-4 w-36 rounded bg-neutral-200" />
              <div className="h-8 rounded bg-neutral-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!bookmarkedWords.length) {
    return (
      <div className="flex min-h-105 flex-col items-center justify-center p-6 text-center">
        <div className="grid size-16 place-items-center rounded-2xl bg-red-50 text-red-600">
          <Bookmark size={30} />
        </div>
        <h2 className="mt-4 text-xl font-bold text-neutral-900">No bookmarked words yet</h2>
        <p className="mt-2 max-w-md text-sm text-neutral-500">
          Save words you want to revise by clicking the bookmark icon in <strong>Learn</strong> or <strong>Sentence Lab</strong>. They will appear here for targeted practice.
        </p>
        <button
          type="button"
          onClick={onStartLearn}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
        >
          <BookOpen size={16} /> Start Learning Words
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-neutral-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <Bookmark className="text-red-600" size={22} fill="currentColor" />
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Bookmarked Words</h2>
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600">
              {bookmarkedWords.length} {bookmarkedWords.length === 1 ? "word" : "words"}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Targeted collection of your saved words for quick revision and mastery.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onStartLearn}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:text-neutral-900"
          >
            <BookOpen size={14} /> Learn
          </button>
          <button
            type="button"
            onClick={onStartFlashcards}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:text-neutral-900"
          >
            <RotateCcw size={14} /> Flashcards
          </button>
          <button
            type="button"
            onClick={onStartQuiz}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:text-neutral-900"
          >
            <Brain size={14} /> Quiz
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {bookmarkedWords.map((word) => {
          const isMastered = knownIds.includes(word.id);
          return (
            <div
              key={word.id}
              className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-300 hover:shadow"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-neutral-900">{word.word}</h3>
                      <button
                        type="button"
                        onClick={() => onSpeak(word.word)}
                        aria-label={`Pronounce ${word.word}`}
                        className="grid size-7 place-items-center rounded-full bg-neutral-100 text-neutral-600 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Volume2 size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-neutral-400">
                      {word.pronunciation} · {word.partOfSpeech}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onBookmark(word)}
                    disabled={bookmarkLoading}
                    className="grid size-8 place-items-center rounded-lg text-red-600 transition hover:bg-red-50"
                    title="Remove bookmark"
                    aria-label="Remove bookmark"
                  >
                    <Bookmark size={16} fill="currentColor" />
                  </button>
                </div>

                <div className="mt-3">
                  <p className="text-sm font-semibold text-neutral-800">{word.bangla}</p>
                  <p className="mt-1 text-xs leading-5 text-neutral-500 line-clamp-2">{word.definition}</p>
                </div>

                {word.example && (
                  <div className="mt-2.5 rounded-lg bg-neutral-50 p-2.5 text-xs text-neutral-700">
                    <span className="font-semibold text-neutral-900">Ex: </span>
                    {word.example}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge>{word.topic}</Badge>
                  <Badge>{word.level}</Badge>
                  {isMastered && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <Check size={11} /> Mastered
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                <button
                  type="button"
                  onClick={() => onStudyWord(word)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-700 transition hover:text-red-600"
                >
                  <BookOpen size={13} /> Study details
                </button>
                <button
                  type="button"
                  onClick={() => onOpenSentenceLab(word)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-700 transition hover:text-red-600"
                >
                  <SpellCheck size={13} /> Sentence Lab
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getSentenceExamples(word: VocabularyWord) {
  return sentenceExamples[word.id] ?? {
    simple: word.simpleExample || word.example,
    compound: word.compoundExample || word.example,
    complex: word.complexExample || word.example,
  };
}

function DirectionSwitch({ value, onChange }: { value: Direction; onChange: (value: Direction) => void }) { return <div className="flex rounded-lg border border-neutral-200 bg-white p-1 text-xs font-semibold"><button onClick={() => onChange("en-bn")} className={`rounded-md px-3 py-1.5 ${value === "en-bn" ? "bg-neutral-900 text-white" : "text-neutral-500"}`}>English → বাংলা</button><button onClick={() => onChange("bn-en")} className={`rounded-md px-3 py-1.5 ${value === "bn-en" ? "bg-neutral-900 text-white" : "text-neutral-500"}`}>বাংলা → English</button></div>; }
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="min-w-0 rounded-xl border border-neutral-200 bg-neutral-50 px-2 py-2.5 sm:min-w-24 sm:px-4 sm:py-3"><p className="truncate text-[10px] text-neutral-400 sm:text-xs">{label}</p><p className="mt-1 text-base font-bold sm:text-lg">{value}</p></div>; }
function Badge({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">{children}</span>; }
function SentenceExample({ label, text }: { label: string; text: string }) { return <div className="grid gap-2 rounded-lg border border-neutral-200 p-3 sm:grid-cols-[84px_1fr] sm:items-start"><span className="text-xs font-semibold text-red-600">{label}</span><p className="text-sm leading-6 text-neutral-700">{text}</p></div>; }
function Feedback({ correct, expected }: { correct: boolean; expected: string }) { return <div className={`mt-5 flex gap-3 rounded-lg p-4 text-sm ${correct ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{correct ? <Check className="shrink-0" size={19} /> : <X className="shrink-0" size={19} />}<div><p className="font-semibold">{correct ? "Correct!" : "Not quite"}</p>{!correct && <p className="mt-1">Correct answer: <strong>{expected}</strong></p>}</div></div>; }
