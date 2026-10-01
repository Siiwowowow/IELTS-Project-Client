/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  IconX,
  IconMicrophone,
  IconClock,
  IconVolume,
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconChevronRight,
  IconChevronLeft,
  IconNotebook,
  IconEye,
  IconRotate,
  IconCheck,
  IconWaveSquare,
} from "@tabler/icons-react";

export interface SpeakingPreviewQuestion {
  id?: string;
  questionText: string;
  audioUrl?: string | null;
  order: number;
}

export interface SpeakingPreviewPart {
  partNumber: number;
  title: string;
  instruction?: string | null;
  preparationTime: number;
  speakingTime: number;
  order: number;
  questions: SpeakingPreviewQuestion[];
}

export interface SpeakingExamPreviewData {
  title: string;
  description?: string;
  duration: number;
  parts: SpeakingPreviewPart[];
}

interface SpeakingExamPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: SpeakingExamPreviewData;
}

function formatSeconds(totalSeconds: number): string {
  if (totalSeconds <= 0) return "00:00";
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function SpeakingExamPreviewModal({
  isOpen,
  onClose,
  exam,
}: SpeakingExamPreviewModalProps) {
  // Screens: 'MIC_CHECK' | 'TEST'
  const [screen, setScreen] = useState<"MIC_CHECK" | "TEST">("TEST");
  const [activePartIdx, setActivePartIdx] = useState(0);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  // Cue card notepad
  const [notes, setNotes] = useState("");

  // Part 2 Timers
  const [prepTimeRemaining, setPrepTimeRemaining] = useState(60);
  const [isPrepRunning, setIsPrepRunning] = useState(false);
  const [speakTimeRemaining, setSpeakTimeRemaining] = useState(120);
  const [isSpeakRunning, setIsSpeakRunning] = useState(false);

  // Audio preview states for question audios
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Simulated recording state
  const [isSimulatedRecording, setIsSimulatedRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Mic check test simulation
  const [micVolumeLevel, setMicVolumeLevel] = useState(45);
  const [isMicTesting, setIsMicTesting] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset indices & timers on open
  useEffect(() => {
    if (isOpen) {
      setActivePartIdx(0);
      setActiveQuestionIdx(0);
      setPrepTimeRemaining(60);
      setIsPrepRunning(false);
      setSpeakTimeRemaining(120);
      setIsSpeakRunning(false);
      setIsSimulatedRecording(false);
      setRecordingSeconds(0);
    }
  }, [isOpen]);

  // Preparation Timer countdown
  useEffect(() => {
    if (!isPrepRunning) return;
    const interval = setInterval(() => {
      setPrepTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsPrepRunning(false);
          setIsSpeakRunning(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPrepRunning]);

  // Speaking Timer countdown
  useEffect(() => {
    if (!isSpeakRunning) return;
    const interval = setInterval(() => {
      setSpeakTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsSpeakRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSpeakRunning]);

  // Simulated recording timer
  useEffect(() => {
    if (!isSimulatedRecording) return;
    const interval = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSimulatedRecording]);

  // Mic testing animation
  useEffect(() => {
    if (!isMicTesting) return;
    const interval = setInterval(() => {
      setMicVolumeLevel(Math.floor(20 + Math.random() * 70));
    }, 120);
    return () => clearInterval(interval);
  }, [isMicTesting]);

  if (!isOpen) return null;

  const parts = exam.parts && exam.parts.length > 0 ? exam.parts : [];
  const currentPart = parts[activePartIdx] || {
    partNumber: activePartIdx + 1,
    title: `Part ${activePartIdx + 1}`,
    instruction: "",
    preparationTime: activePartIdx === 1 ? 60 : 0,
    speakingTime: activePartIdx === 1 ? 120 : 60,
    order: activePartIdx + 1,
    questions: [],
  };

  const questions = currentPart.questions || [];
  const currentQuestion = questions[activeQuestionIdx];
  const totalQuestionsAllParts = parts.reduce(
    (acc, p) => acc + (p.questions?.length || 0),
    0
  );

  const handleNextQuestion = () => {
    setIsPlayingAudio(false);
    setIsSimulatedRecording(false);
    setRecordingSeconds(0);
    if (activeQuestionIdx < questions.length - 1) {
      setActiveQuestionIdx((prev) => prev + 1);
    } else if (activePartIdx < parts.length - 1) {
      setActivePartIdx((prev) => prev + 1);
      setActiveQuestionIdx(0);
    }
  };

  const handlePrevQuestion = () => {
    setIsPlayingAudio(false);
    setIsSimulatedRecording(false);
    setRecordingSeconds(0);
    if (activeQuestionIdx > 0) {
      setActiveQuestionIdx((prev) => prev - 1);
    } else if (activePartIdx > 0) {
      setActivePartIdx((prev) => prev - 1);
      const prevPartQs = parts[activePartIdx - 1]?.questions || [];
      setActiveQuestionIdx(Math.max(0, prevPartQs.length - 1));
    }
  };

  const toggleAudioPlay = (url: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setIsPlayingAudio(false);
    }

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.src = url;
      audioRef.current.play().catch(() => {});
      setIsPlayingAudio(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col antialiased animate-fadeIn">
      {/* ── TOP TEACHER PREVIEW CONTROL BAR ── */}
      <header className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-white shrink-0 z-30 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-xs font-bold text-rose-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <IconEye size={14} />
            <span>Speaking Exam Preview</span>
          </div>
          <span className="hidden sm:inline-block text-xs font-semibold text-slate-400 truncate max-w-sm">
            {exam.title || "Untitled Speaking Exam"}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {exam.duration || 15} Mins
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="hidden sm:flex border border-slate-700 rounded-lg p-0.5 bg-slate-800/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => setScreen("MIC_CHECK")}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                screen === "MIC_CHECK"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Mic Check View
            </button>
            <button
              type="button"
              onClick={() => setScreen("TEST")}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                screen === "TEST"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Exam Test View
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer ml-2 shadow-sm"
          >
            <IconX size={14} />
            <span>Exit Preview</span>
          </button>
        </div>
      </header>

      {/* ── SCREEN 1: MIC CHECK SIMULATION ── */}
      {screen === "MIC_CHECK" && (
        <div className="flex-1 bg-slate-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="max-w-xl w-full bg-white rounded-3xl border border-gray-200 p-8 shadow-xl space-y-6 animate-scaleIn">
            <div className="text-center space-y-3">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 shadow-sm">
                <IconMicrophone size={36} />
              </span>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Simulated Microphone & Audio Check
              </h1>
              <p className="text-sm font-medium text-gray-500 max-w-sm mx-auto leading-relaxed">
                Before candidate testing starts, students test their microphone to ensure voice recordings are clear for grading.
              </p>
            </div>

            {/* Volume bars visualizer */}
            <div className="bg-slate-50 border border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <IconVolume size={16} className="text-rose-500" />
                <span>Microphone Level Monitor</span>
              </div>

              <div className="w-full h-10 flex gap-1.5 items-center justify-center">
                {Array.from({ length: 18 }).map((_, i) => {
                  const active = isMicTesting
                    ? micVolumeLevel > i * 5.5
                    : i < 6;
                  return (
                    <div
                      key={i}
                      className={`w-2.5 rounded-full transition-all duration-100 ${
                        active
                          ? i < 11
                            ? "bg-rose-500 h-8"
                            : i < 15
                            ? "bg-amber-400 h-9"
                            : "bg-emerald-500 h-10"
                          : "bg-gray-200 h-3"
                      }`}
                    />
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setIsMicTesting(!isMicTesting)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isMicTesting
                    ? "bg-rose-100 text-rose-700 border border-rose-200"
                    : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                }`}
              >
                <IconWaveSquare size={14} />
                <span>{isMicTesting ? "Simulating Voice Input..." : "Test Mic Sensitivity"}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setScreen("TEST")}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-sm tracking-wide uppercase transition shadow-md shadow-rose-500/20 cursor-pointer"
            >
              <span>Enter Speaking Test Workspace</span>
              <IconChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── SCREEN 2: EXAM WORKSPACE ── */}
      {screen === "TEST" && (
        <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
          {/* Candidate Test Header */}
          <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 select-none shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500 border border-rose-100">
                <IconMicrophone size={22} />
              </div>
              <div>
                <h2 className="font-black text-gray-900 text-sm">
                  {exam.title || "IELTS Speaking Assessment"}
                </h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                  IELTS Speaking CBT Assessment
                </p>
              </div>
            </div>

            {/* Part Selector Pills for Quick Teacher Navigation */}
            <div className="flex border border-gray-200 bg-gray-50 p-1 rounded-xl">
              {[0, 1, 2].map((idx) => {
                const part = parts[idx];
                const active = activePartIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActivePartIdx(idx);
                      setActiveQuestionIdx(0);
                      setIsPlayingAudio(false);
                      setIsSimulatedRecording(false);
                      setRecordingSeconds(0);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                      active
                        ? "bg-rose-500 text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <span>Part {idx + 1}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                        active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {part?.questions?.length || (idx === 1 ? 1 : 0)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 hidden md:inline">
                Total Exam Qs: {totalQuestionsAllParts}
              </span>
              <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold">
                Time: ~{exam.duration || 15} mins
              </span>
            </div>
          </div>

          {/* Main workspace container */}
          <main className="flex-1 max-w-6xl mx-auto w-full p-6 flex flex-col justify-center overflow-y-auto">
            <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 flex flex-col shadow-sm space-y-6 min-h-[460px]">
              {/* Header Part details */}
              <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
                <div>
                  <div className="inline-flex px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1.5">
                    Speaking Part {currentPart.partNumber}
                  </div>
                  <h1 className="text-xl font-black text-gray-900 tracking-tight">
                    {currentPart.title}
                  </h1>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    Speaking Time Limit
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    {currentPart.speakingTime || (activePartIdx === 1 ? 120 : 60)} Seconds
                  </span>
                </div>
              </div>

              {/* ── PART 2: CUE CARD SPECIAL LAYOUT ── */}
              {currentPart.partNumber === 2 ? (
                <div className="space-y-6">
                  {/* Official IELTS Yellow/Amber Cue Card Box */}
                  <div className="bg-amber-50/70 border-2 border-amber-200/90 rounded-2xl p-6 text-gray-800 leading-relaxed font-semibold relative shadow-xs">
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs text-amber-800 font-bold bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                      <IconClock size={14} />
                      <span>Candidate Cue Card</span>
                    </div>

                    <h3 className="text-base font-black text-gray-900 mb-3">
                      Candidate Topic Prompt:
                    </h3>
                    {currentPart.instruction ? (
                      <div
                        className="whitespace-pre-wrap select-text text-sm md:text-base leading-relaxed text-gray-900"
                        dangerouslySetInnerHTML={{ __html: currentPart.instruction }}
                      />
                    ) : (
                      <p className="text-gray-400 italic text-sm">
                        No Cue Card prompt entered yet in the builder.
                      </p>
                    )}
                  </div>

                  {/* Part 2 Timers Interactive Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 1 Min Prep Timer */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          1-Minute Preparation
                        </span>
                        <span className="text-lg font-black font-mono text-slate-900">
                          {formatSeconds(prepTimeRemaining)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsPrepRunning(!isPrepRunning)}
                          className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          {isPrepRunning ? "Pause" : "Test Prep Timer"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsPrepRunning(false);
                            setPrepTimeRemaining(60);
                          }}
                          className="p-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                          title="Reset"
                        >
                          <IconRotate size={14} />
                        </button>
                      </div>
                    </div>

                    {/* 2 Min Speaking Timer */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          2-Minute Long Turn Speaking
                        </span>
                        <span className="text-lg font-black font-mono text-slate-900">
                          {formatSeconds(speakTimeRemaining)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsSpeakRunning(!isSpeakRunning)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          {isSpeakRunning ? "Pause" : "Test Speak Timer"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSpeakRunning(false);
                            setSpeakTimeRemaining(120);
                          }}
                          className="p-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                          title="Reset"
                        >
                          <IconRotate size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Candidate Notepad */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                      <IconNotebook size={16} className="text-amber-600" />
                      <span>Optional Candidate Notepad (Preparation Notes Test):</span>
                    </span>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Candidates use this notepad during the 1-minute prep time to jot down keywords..."
                      rows={3}
                      className="w-full text-xs font-medium p-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 bg-slate-50/70 placeholder:text-gray-400 text-black resize-y"
                    />
                  </div>
                </div>
              ) : (
                /* ── PART 1 & PART 3: INTERVIEW & DISCUSSION ── */
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  {currentPart.instruction && (
                    <div
                      className="text-xs text-gray-600 font-semibold bg-slate-50 p-3.5 rounded-xl border border-gray-100"
                      dangerouslySetInnerHTML={{
                        __html: `<strong>Instruction:</strong> ${currentPart.instruction}`,
                      }}
                    />
                  )}

                  {questions.length > 0 && currentQuestion ? (
                    <div className="space-y-6 my-auto">
                      {/* Question card */}
                      <div className="bg-gradient-to-b from-slate-50/90 to-white border border-gray-200 rounded-3xl p-8 md:p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-xs">
                        <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 rounded-full px-3 py-1 tracking-widest uppercase">
                          Question {activeQuestionIdx + 1} of {questions.length}
                        </span>

                        <h2
                          className="text-xl md:text-2xl font-black text-gray-900 leading-snug max-w-2xl"
                          dangerouslySetInnerHTML={{
                            __html: `"${currentQuestion.questionText || "Untitled Question"}"`,
                          }}
                        />

                        {/* Audio Clip Preview if attached */}
                        {currentQuestion.audioUrl ? (
                          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs mt-2">
                            <button
                              type="button"
                              onClick={() => toggleAudioPlay(currentQuestion.audioUrl!)}
                              className="w-10 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer shadow-sm"
                            >
                              {isPlayingAudio ? (
                                <IconPlayerPause size={20} />
                              ) : (
                                <IconPlayerPlay size={20} className="ml-0.5" />
                              )}
                            </button>
                            <div className="text-left pr-3">
                              <span className="text-xs font-bold text-gray-800 block">
                                {isPlayingAudio ? "Playing Audio Prompt..." : "Listen to Examiner Audio"}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium">
                                Audio file attached to this question
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-semibold italic">
                            (No audio attached — candidate reads prompt on screen)
                          </span>
                        )}
                      </div>

                      {/* Mock Recorder Simulator */}
                      <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                              isSimulatedRecording
                                ? "bg-rose-500 text-white animate-pulse"
                                : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            <IconMicrophone size={20} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-800 block">
                              {isSimulatedRecording
                                ? `Recording in progress (${formatSeconds(recordingSeconds)})`
                                : "Candidate Audio Recording"}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                              Simulates student mic capture during exam
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setIsSimulatedRecording(!isSimulatedRecording);
                            if (isSimulatedRecording) setRecordingSeconds(0);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            isSimulatedRecording
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : "bg-rose-500 hover:bg-rose-600 text-white shadow-xs"
                          }`}
                        >
                          {isSimulatedRecording ? (
                            <>
                              <IconPlayerStop size={15} />
                              <span>Stop Recording</span>
                            </>
                          ) : (
                            <>
                              <IconMicrophone size={15} />
                              <span>Test Recording</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-400 italic">
                      No questions configured for this part yet.
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Step Controls */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={handlePrevQuestion}
                  disabled={activePartIdx === 0 && activeQuestionIdx === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 hover:border-gray-300 text-xs font-bold text-gray-700 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                >
                  <IconChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {questions.map((_, qIdx) => (
                    <span
                      key={qIdx}
                      onClick={() => setActiveQuestionIdx(qIdx)}
                      className={`h-2.5 rounded-full transition-all cursor-pointer ${
                        activeQuestionIdx === qIdx
                          ? "w-7 bg-rose-500"
                          : "w-2.5 bg-gray-200 hover:bg-gray-300"
                      }`}
                      title={`Go to Question ${qIdx + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleNextQuestion}
                  disabled={
                    activePartIdx === parts.length - 1 &&
                    activeQuestionIdx >= questions.length - 1
                  }
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
                >
                  <span>Next Question</span>
                  <IconChevronRight size={16} />
                </button>
              </div>
            </section>
          </main>
        </div>
      )}
    </div>
  );
}

export default SpeakingExamPreviewModal;
