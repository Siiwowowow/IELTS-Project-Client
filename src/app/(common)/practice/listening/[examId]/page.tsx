/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useState, useRef, useCallback, useEffect, Key } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { listeningService } from "@/services/listening.services";
import { mockTestService } from "@/services/mocktest.services";
import { toast } from "sonner";
import { IconAlertCircle, IconCheck, IconLoader2, IconArrowLeft } from "@tabler/icons-react";
import { useAuth } from "@/providers/AuthProvider";
import { useTextHighlighter } from "@/hooks/useTextHighlighter";
import Link from "next/link";

// Import modular components
import { CandidateHeader } from "@/components/Listening/CandidateHeader";
import { IELTSAudioPlayer } from "@/components/Listening/IELTSAudioPlayer";
import { QuestionGroupCard } from "@/components/Listening/QuestionGroupCard";
import { NavigationFooter } from "@/components/Listening/NavigationFooter";
import { ReviewModal } from "@/components/Listening/ReviewModal";

interface Props {
  params: Promise<{ examId: string }>;
}

export default function ListeningExamPage({ params }: Props) {
  const { examId } = use(params);
  const router = useRouter();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const mockAttemptId = searchParams.get("mockAttemptId");
  const mockTestId = searchParams.get("mockTestId");

  // Core Exam States
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answersRef = useRef<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  // Audio Playback States
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Countdown Timer States
  const [testTimeRemaining, setTestTimeRemaining] = useState(1800); // 30 minutes
  const [isCheckPeriod, setIsCheckPeriod] = useState(false);
  const [checkTimeRemaining, setCheckTimeRemaining] = useState(120); // 2 minutes check countdown

  // Fullscreen & Clock States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clockText, setClockText] = useState("");

  const submittedRef = useRef(false);

  // Fetch Exam Query (Strictly loads from database)
  const { data, isLoading, isError } = useQuery({
    queryKey: ["listening-exam", examId],
    queryFn: () => listeningService.getExamById(examId),
    retry: 1,
  });

  const exam = data?.data;
  useTextHighlighter(workspaceRef, [exam]);

  // Dynamically calculate sequential question numbers (1 to 40) across all sections
  let questionCounter = 1;
  const sections = ((exam?.sections as any[]) ?? []).map((sec) => ({
    ...sec,
    questionGroups: (sec.questionGroups ?? []).map((group: any) => ({
      ...group,
      questions: (group.questions ?? []).map((q: any) => ({
        ...q,
        questionNumber: questionCounter++,
      })),
    })),
  }));

  // Find first available audio URL across all sections (since listening test has one global audio)
  const examAudioUrl = sections.find((s) => s.audioUrl)?.audioUrl || "";

  // Flattened questions lists
  const allQuestions = sections.flatMap((s) =>
    s.questionGroups.flatMap((g: { questions: any; }) => g.questions)
  );

  const activeSection = sections[activeSectionIdx];
  const currentSectionQuestions = activeSection?.questionGroups.flatMap((g: { questions: any; }) => g.questions) ?? [];

  // Tanstack submission mutation
  const mutation = useMutation({
    mutationFn: (snap: Record<string, string>) => {
      const answersArray = Object.entries(snap)
        .filter(([, value]) => value?.trim() !== "")
        .map(([questionId, submittedAnswer]) => ({
          questionId,
          submittedAnswer,
        }));

      return listeningService.submitAttempt(examId, {
        answers: answersArray,
      } as const);
    },
    onSuccess: async (res) => {
      toast.success("Answers submitted successfully!");
      if (mockAttemptId && mockTestId) {
        try {
          await mockTestService.updateAttempt(mockAttemptId, {
            listeningAttemptId: res.data.id,
          });
          router.push(`/student/mock-tests/run/${mockAttemptId}/transition?mockTestId=${mockTestId}&completedModule=listening`);
        } catch (err) {
          toast.error("Failed to link attempt to mock test session.");
          router.push(`/practice/listening/${examId}/review/${res.data.id}`);
        }
      } else {
        router.push(`/practice/listening/${examId}/review/${res.data.id}`);
      }
    },
    onError: (err: any) => {
      submittedRef.current = false;
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Submission failed. Please try again.";
      toast.error(msg);
    },
  });

  const doSubmit = useCallback(
    (snap: Record<string, string>) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setShowSubmitModal(false);
      setShowReviewModal(false);

      // Auto turn off audio on submit
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }

      mutation.mutate(snap);
    },
    [mutation]
  );

  const handleSubmitClick = () => {
    setShowSubmitModal(true);
  };

  // Clock ticks
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockText(
        now.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }) +
          ", " +
          now.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Lock-down exam listeners
  useEffect(() => {
    const preventReloads = (e: KeyboardEvent) => {
      if (e.key === "F5") {
        e.preventDefault();
        toast.error("Page refresh is disabled during the assessment.");
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
        e.preventDefault();
        toast.error("Page reload is disabled during the assessment.");
      }
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase()))) {
        e.preventDefault();
        toast.error("Developer inspection tools are disabled.");
      }
    };

    window.addEventListener("keydown", preventReloads);

    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      window.removeEventListener("keydown", preventReloads);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  const toggleKioskFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        toast.error(`Kiosk Mode expansion failed: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Dynamic Exam Duration Synchronization
  useEffect(() => {
    if (exam?.duration) {
      setTestTimeRemaining(exam.duration * 60);
    }
  }, [exam?.duration]);

  // Audio Playback triggers
  useEffect(() => {
    if (isCheckPeriod) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    const url = examAudioUrl;
    if (!url) return;

    // If the audio instance has already been created for this url, keep it playing.
    if (audioRef.current && currentAudioUrlRef.current === url) {
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    currentAudioUrlRef.current = url;
    audio.volume = isMuted ? 0 : volume;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    audio.playbackRate = playbackRate;

    const onLoadedMetadata = () => {
      setAudioDuration(audio.duration || 0);
    };

    const onTimeUpdate = () => {
      setAudioCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setIsCheckPeriod(true);
      setCheckTimeRemaining(120);
      toast.info("Audio playback complete. The test is now locked. You have 2 minutes to review your answers.");
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [examAudioUrl, isCheckPeriod]);

  // Synchronize audio volume and mute status dynamically
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Synchronize playback speed dynamically
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Audio actions
  const handlePlayToggle = () => {
    if (isCheckPeriod) {
      toast.error("Audio is locked during the answer check phase.");
      return;
    }
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => {
        console.error("Audio playback error:", err);
      });
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    if (isMuted && val > 0) setIsMuted(false);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleSpeedChange = (val: number) => {
    setPlaybackRate(val);
  };

  const handleScrub = (val: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setAudioCurrentTime(val);
    }
  };

  // Timing handlers
  useEffect(() => {
    if (isCheckPeriod) return;

    const interval = setInterval(() => {
      setTestTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCheckPeriod(true);
          setCheckTimeRemaining(120);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCheckPeriod]);

  useEffect(() => {
    if (!isCheckPeriod) return;

    const interval = setInterval(() => {
      setCheckTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          toast.warning("Checking time completed. Submitting answers automatically.");
          doSubmit(answersRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCheckPeriod, doSubmit]);

  // State modification events
  const handleAnswer = (questionId: string, val: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: val };
      answersRef.current = next;
      return next;
    });
    setActiveQuestionId(questionId);
  };

  const handleToggleFlag = (qId: string) => {
    setFlagged((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleQuestionSelect = (qId: string) => {
    setActiveQuestionId(qId);
    setTimeout(() => {
      const inputField = document.getElementById(`q-input-${qId}`) as HTMLInputElement | null;
      if (inputField) {
        inputField.scrollIntoView({ behavior: "smooth", block: "center" });
        inputField.focus();
      }
    }, 100);
  };

  const handleJumpToQuestion = (qId: string, sIdx: number) => {
    setActiveSectionIdx(sIdx);
    setActiveQuestionId(qId);
    setShowReviewModal(false);
    setTimeout(() => {
      const inputField = document.getElementById(`q-input-${qId}`) as HTMLInputElement | null;
      if (inputField) {
        inputField.scrollIntoView({ behavior: "smooth", block: "center" });
        inputField.focus();
      }
    }, 200);
  };

  const formatMMSS = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getSectionTitle = (idx: number) => {
    const secQuestions = sections[idx]?.questionGroups.flatMap((g: any) => g.questions) ?? [];
    if (secQuestions.length === 0) {
      return `SECTION ${idx + 1}`;
    }
    const startNum = secQuestions[0].questionNumber;
    const endNum = secQuestions[secQuestions.length - 1].questionNumber;
    return `SECTION ${idx + 1} – QUESTIONS ${startNum}–${endNum}`;
  };

  // LOADING STATE
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white gap-4 z-50">
        <IconLoader2 size={40} className="animate-spin text-[#1B3A6B]" />
        <p className="text-gray-600 font-semibold text-sm tracking-wide">
          Loading IELTS Assessment Environment...
        </p>
      </div>
    );
  }

  // ERROR STATE
  if (isError || !exam) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white p-4">
        <div className="bg-white border border-red-200 rounded-xl p-8 max-w-sm text-center shadow-lg">
          <IconAlertCircle size={40} className="text-red-500 mx-auto mb-3" />
          <h2 className="font-bold text-gray-900 text-lg mb-1">Failed to Load Exam</h2>
          <p className="text-gray-500 text-sm mb-4">Please make sure the listening exam exists in the database.</p>
          <Link
            href="/practice/listening"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B3A6B] text-white rounded text-sm font-bold hover:bg-[#152e54] transition"
          >
            <IconArrowLeft size={15} />
            Back to Practice
          </Link>
        </div>
      </div>
    );
  }

  // Stats calculation
  const currentSectionAnsweredCount = currentSectionQuestions.filter((q: { id: string | number; }) => answers[q.id]?.trim()).length;

  return (
    <>
      <style>{`
        /* Lockdown environment body overrides */
        html, body {
          height: 100%;
          overflow: hidden;
          background-color: #FFFFFF !important;
          font-family: Arial, Helvetica, sans-serif !important;
        }

        .highlighted {
          background-color: #fdff32 !important;
          color: #000000 !important;
          cursor: pointer;
        }
      `}</style>

      <div className="flex flex-col h-screen bg-white text-gray-800 relative font-sans">
        
        {/* 1. CANDIDATE TOP HEADER */}
        <CandidateHeader
          candidateName={user?.name || "John Doe"}
          candidateId={`BRIT${user?.id?.slice(-4).toUpperCase() || "1234"}`}
          dateText={new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          timeRemainingText={isCheckPeriod ? formatMMSS(checkTimeRemaining) : formatMMSS(testTimeRemaining)}
          isCheckPeriod={isCheckPeriod}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleKioskFullscreen}
        />

        {/* WORKSPACE AREA */}
        <div ref={workspaceRef} className="mt-14 flex-1 flex flex-col min-h-0 overflow-hidden relative pb-16 bg-[#F8FAFC]">
          
          {/* 2. FIXED AUDIO PLAYER BAR */}
          <IELTSAudioPlayer
            isPlaying={isPlaying}
            isMuted={isMuted}
            volume={volume}
            audioDuration={audioDuration}
            audioCurrentTime={audioCurrentTime}
            activeSectionIdx={activeSectionIdx}
            isCheckPeriod={isCheckPeriod}
            playbackRate={playbackRate}
            onPlayToggle={handlePlayToggle}
            onVolumeChange={handleVolumeChange}
            onMuteToggle={handleMuteToggle}
            onScrub={handleScrub}
            onSpeedChange={handleSpeedChange}
          />

          {/* CHECK ANSWERS TIMER WARNING ON AUDIO COMPLETED */}
          {isCheckPeriod && (
            <div className="bg-[#FEF9C3] border-b border-[#FEF08A] py-2 px-4 shrink-0 text-center text-xs md:text-sm font-bold text-[#854D0E] z-30 select-none animate-fadeIn flex items-center justify-center gap-2">
              <span>
                Audio finished. {formatMMSS(checkTimeRemaining)} remaining to check your answers. Audio player is locked.
              </span>
            </div>
          )}

          {/* 3. SCROLLABLE TEST QUESTIONS CONTAINER */}
          <main className="flex-grow overflow-y-auto bg-[#F8FAFC] py-6 px-4 md:px-6">
            <div className="max-w-[1000px] mx-auto space-y-6">
              
              {/* SECTION TITLE & DIRECTIONS */}
              <div className="border-b border-gray-200 pb-3">
                <h2 className="text-lg md:text-xl font-black text-[#1B3A6B] tracking-tight uppercase">
                  {getSectionTitle(activeSectionIdx)}
                </h2>
                {activeSection?.instruction && (
                  <p className="text-xs md:text-sm text-gray-500 font-semibold mt-1">
                    {activeSection.instruction}
                  </p>
                )}
              </div>

              {/* CARD GROUPS */}
              {currentSectionQuestions.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-gray-400 font-semibold shadow-sm">
                  No questions found in this section.
                </div>
              ) : (
                <div className="space-y-6 select-text">
                  {activeSection?.questionGroups.map((group: { id: Key | null | undefined; }) => (
                    <QuestionGroupCard
                      key={group.id}
                      group={group as any}
                      answers={answers}
                      flagged={flagged}
                      activeQuestionId={activeQuestionId}
                      onAnswer={handleAnswer}
                      onToggleFlag={handleToggleFlag}
                    />
                  ))}
                </div>
              )}

              {/* QUESTIONS ATTEMPTED PILL COUNTER */}
              {currentSectionQuestions.length > 0 && (
                <div className="pt-4 flex justify-end items-center select-none">
                  <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-gray-500">
                    <span>Questions attempted:</span>
                    <span className="bg-[#1B3A6B] text-white font-bold py-1.5 px-3 rounded shadow-sm">
                      Answered: {currentSectionAnsweredCount}/{currentSectionQuestions.length}
                    </span>
                  </div>
                </div>
              )}

            </div>
          </main>

          {/* 4. PERSISTENT NAVIGATION BAR */}
          <NavigationFooter
            activeSectionIdx={activeSectionIdx}
            questions={currentSectionQuestions}
            answers={answers}
            flagged={flagged}
            activeQuestionId={activeQuestionId}
            submitEnabled={true}
            isPending={mutation.isPending}
            onBack={() => activeSectionIdx > 0 && setActiveSectionIdx(activeSectionIdx - 1)}
            onNext={() => activeSectionIdx < 3 && setActiveSectionIdx(activeSectionIdx + 1)}
            onQuestionClick={handleQuestionSelect}
            onReviewAllClick={() => setShowReviewModal(true)}
            onSubmitClick={handleSubmitClick}
          />
        </div>

        {/* 5. OVERLAY REVIEW MODAL */}
        {showReviewModal && (
          <ReviewModal
            sections={sections as any}
            answers={answers}
            flagged={flagged}
            onClose={() => setShowReviewModal(false)}
            onJumpToQuestion={handleJumpToQuestion}
          />
        )}

        {/* SUBMIT CONFIRMATION MODAL */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 select-none">
            <div className="bg-white rounded border border-gray-300 shadow-2xl p-6 w-full max-w-[420px] text-center space-y-5 animate-fadeIn">
              <div className="space-y-2">
                <h3 className="font-extrabold text-lg text-gray-800">Submit Exam</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-semibold">
                  Are you sure you want to submit your test? You cannot change your answers after submission.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-2 text-sm font-bold border border-gray-300 hover:bg-gray-50 transition rounded text-gray-600 active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => doSubmit(answers)}
                  className="flex-grow py-2 text-sm font-extrabold bg-[#1B3A6B] hover:bg-[#152e54] text-white transition rounded shadow active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <IconCheck size={16} />
                  <span>Submit</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
