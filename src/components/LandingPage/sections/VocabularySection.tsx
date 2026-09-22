"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, Check, Volume2 } from "lucide-react";

interface DemoWord {
  word: string;
  phonetic: string;
  pos: string;
  band: string;
  meaning: string;
  collocation: string;
  example: string;
  synonyms: string[];
}

const SAMPLE_WORDS: DemoWord[] = [
  {
    word: "Serendipity",
    phonetic: "/ˌser.ənˈdɪp.ə.ti/",
    pos: "noun",
    band: "Band 8.5",
    meaning:
      "Finding something valuable or interesting by chance, when you were not looking for it.",
    collocation: "sheer serendipity",
    example: "Scientific breakthroughs often owe much to sheer serendipity.",
    synonyms: ["Fortunate discovery", "Happy chance", "Providence"],
  },
  {
    word: "Ubiquitous",
    phonetic: "/juːˈbɪk.wɪ.təs/",
    pos: "adjective",
    band: "Band 8.0",
    meaning: "Present, appearing, or found everywhere in modern daily life.",
    collocation: "virtually ubiquitous",
    example: "Smartphones have become virtually ubiquitous among university students.",
    synonyms: ["Omnipresent", "Pervasive", "Widespread"],
  },
];

const BENEFITS = [
  "Curated academic vocabulary",
  "Natural collocations in context",
  "Personal revision word bank",
];

export function VocabularySection() {
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [savedCount, setSavedCount] = useState(24);

  const currentWord = SAMPLE_WORDS[activeWordIndex];

  const handleSpeak = () => {
    setPlaying(true);

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.rate = 0.85;
      utterance.onend = () => setPlaying(false);
      utterance.onerror = () => setPlaying(false);
      window.speechSynthesis.speak(utterance);
      return;
    }

    globalThis.setTimeout(() => setPlaying(false), 700);
  };

  const handleToggleSave = () => {
    setSaved((isSaved) => {
      setSavedCount((count) => Math.max(0, count + (isSaved ? -1 : 1)));
      return !isSaved;
    });
  };

  const handleWordChange = (index: number) => {
    setActiveWordIndex(index);
    setSaved(false);
  };

  return (
    <section
      id="vocabulary"
      className="bg-[#f8f3e9] py-16 text-[#17201d] sm:py-20 lg:py-24"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:gap-20">
        <div>
          <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#d83a31]">
            <span className="h-px w-8 bg-[#d83a31]" aria-hidden="true" />
            Vocabulary practice
          </p>

          <h2 className="mt-6 max-w-xl text-4xl font-black leading-[1.02] tracking-[-0.045em] sm:text-5xl lg:text-[3.5rem]">
            Learn fewer words.
            <span className="block text-[#d83a31]">Use them better.</span>
          </h2>

          <p className="mt-6 max-w-lg text-sm leading-7 text-[#5c635f] sm:text-base">
            Build a practical IELTS vocabulary with pronunciation, real examples,
            and the word combinations strong answers need.
          </p>

          <ul className="mt-8 divide-y divide-[#17201d]/10 border-y border-[#17201d]/10">
            {BENEFITS.map((benefit, index) => (
              <li
                key={benefit}
                className="flex items-center gap-4 py-3.5 text-sm font-semibold text-[#303936]"
              >
                <span className="text-xs font-bold text-[#d83a31]">0{index + 1}</span>
                {benefit}
              </li>
            ))}
          </ul>

          <Link
            href="/practice/reading"
            className="group mt-8 inline-flex items-center gap-3 border-b border-[#17201d] pb-1.5 text-sm font-bold transition-colors hover:border-[#d83a31] hover:text-[#d83a31]"
          >
            Start vocabulary practice
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="border border-[#17201d]/10 bg-[#fffdf8] p-5 shadow-[0_24px_70px_rgba(48,40,28,0.08)] sm:p-8 lg:p-10">
          <div className="flex flex-col gap-5 border-b border-[#17201d]/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-6" role="tablist" aria-label="Example words">
              {SAMPLE_WORDS.map((word, index) => (
                <button
                  key={word.word}
                  type="button"
                  role="tab"
                  aria-selected={index === activeWordIndex}
                  onClick={() => handleWordChange(index)}
                  className={`border-b pb-1 text-sm font-semibold transition-colors ${
                    index === activeWordIndex
                      ? "border-[#d83a31] text-[#17201d]"
                      : "border-transparent text-[#8a8f8c] hover:text-[#17201d]"
                  }`}
                >
                  {word.word}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-[#6e7470]">
              <Bookmark className="size-3.5" />
              {savedCount} saved words
            </div>
          </div>

          <div className="pt-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                    {currentWord.word}
                  </h3>
                  <button
                    type="button"
                    onClick={handleSpeak}
                    className={`grid size-9 place-items-center border border-[#17201d]/15 transition-colors hover:border-[#d83a31] hover:text-[#d83a31] ${
                      playing ? "text-[#d83a31]" : "text-[#606763]"
                    }`}
                    aria-label={`Listen to ${currentWord.word}`}
                  >
                    <Volume2 className={`size-4 ${playing ? "animate-pulse" : ""}`} />
                  </button>
                </div>

                <p className="mt-2 text-xs text-[#747a76]">
                  <span className="font-mono">{currentWord.phonetic}</span>
                  <span className="mx-2" aria-hidden="true">·</span>
                  <span className="italic">{currentWord.pos}</span>
                  <span className="mx-2" aria-hidden="true">·</span>
                  <span className="font-semibold text-[#d83a31]">{currentWord.band}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleSave}
                aria-pressed={saved}
                className={`inline-flex size-10 shrink-0 items-center justify-center border transition-colors sm:size-auto sm:gap-2 sm:px-4 sm:py-2.5 sm:text-xs sm:font-bold ${
                  saved
                    ? "border-[#17201d] bg-[#17201d] text-white"
                    : "border-[#17201d]/20 text-[#17201d] hover:border-[#17201d]"
                }`}
              >
                {saved ? <Check className="size-4" /> : <Bookmark className="size-4" />}
                <span className="hidden sm:inline">{saved ? "Saved" : "Save word"}</span>
              </button>
            </div>

            <p className="mt-7 max-w-xl text-sm leading-7 text-[#4f5854] sm:text-base">
              {currentWord.meaning}
            </p>

            <div className="mt-8 grid gap-6 border-y border-[#17201d]/10 py-6 sm:grid-cols-2 sm:gap-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#969b98]">
                  Natural collocation
                </p>
                <p className="mt-2 text-sm font-bold">{currentWord.collocation}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#969b98]">
                  IELTS example
                </p>
                <p className="mt-2 text-sm leading-6 text-[#4f5854]">
                  “{currentWord.example}”
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
              <span className="font-bold uppercase tracking-[0.12em] text-[#969b98]">
                Similar
              </span>
              {currentWord.synonyms.map((synonym) => (
                <span key={synonym} className="text-[#4f5854]">
                  {synonym}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
