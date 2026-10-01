/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { speakingService } from "@/services/speaking.services";
import { mockTestService } from "@/services/mocktest.services";
import { toast } from "sonner";
import {
  IconLoader2,
  IconAlertCircle,
  IconMicrophone,
  IconPlayerStop,
  IconPlayerPlay,
  IconCircleCheck,
  IconVolume,
  IconClock,
  IconCheck,
  IconFileText,
  IconNotebook,
  IconArrowLeft,
  IconArrowRight,
  IconMaximize,
  IconMinimize,
  IconInfoCircle,
  IconUserCircle,
  IconUpload,
  IconSparkles,
} from "@tabler/icons-react";
import { useAuth } from "@/providers/AuthProvider";
import { useTextHighlighter } from "@/hooks/useTextHighlighter";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Link from "next/link";
import { ExamTimer } from "@/components/Reading/ExamTimer";
import { ExamSubmissionOverlay } from "@/components/shared/ExamSubmissionOverlay";

interface Props {
  params: Promise<{ examId: string }>;
}

export default function SpeakingExamPage({ params }: Props) {
  const { examId } = use(params);
  const router = useRouter();
  const workspaceRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const searchParams = useSearchParams();
  const mockAttemptId = searchParams.get("mockAttemptId");
  const mockTestId = searchParams.get("mockTestId");

  // Core Exam States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [mobileTab, setMobileTab] = useState<"prompt" | "recording">("prompt");

  // Test progression states
  const [currentPartIdx, setCurrentPartIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // Cue card notepad (Part 2)
  const [notes, setNotes] = useState("");

  // Timers (Part 2)
  const [prepTime, setPrepTime] = useState<number | null>(null);
  const [speakTime, setSpeakTime] = useState<number | null>(null);
  const [timerMode, setTimerMode] = useState<"prep" | "speak" | "none">("none");

  // MediaRecorder & Audio states
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "uploading" | "ready">("idle");
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Audio mic volume level monitor
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [micVolumeLevel, setMicVolumeLevel] = useState(0);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Answers upload states: questionId -> cloudinaryUrl / localUrl
  const [uploadedUrls, setUploadedUrls] = useState<Record<string, string>>({});
  const [localAudioUrls, setLocalAudioUrls] = useState<Record<string, string>>({});
  const [uploadsInProgress, setUploadsInProgress] = useState<Record<string, boolean>>({});

  const testTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const submittedRef = useRef(false);

  // Responsive breakpoint listener
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch Exam Query
  const { data, isLoading, isError } = useQuery({
    queryKey: ["speaking-exam-practice", examId],
    queryFn: () => speakingService.getExamById(examId),
    retry: 1,
  });

  const exam = data?.data;
  useTextHighlighter(workspaceRef, [exam]);
  const parts = exam?.parts ? [...exam.parts].sort((a, b) => a.order - b.order) : [];
  const currentPart = parts[currentPartIdx];
  const questions = currentPart?.questions ? [...currentPart.questions].sort((a, b) => a.order - b.order) : [];
  const currentQuestion = questions[currentQuestionIdx];

  const totalQuestionsInExam = parts.reduce((acc, p) => acc + (p.questions?.length || 0), 0);
  const currentGlobalQNum =
    parts.slice(0, currentPartIdx).reduce((acc, p) => acc + (p.questions?.length || 0), 0) +
    currentQuestionIdx +
    1;

  // Initialize and monitor microphone volume
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let streamRef: MediaStream | null = null;

    const setupMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef = stream;
        setMicStream(stream);

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioContextClass();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        micAnalyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkVolume = () => {
          if (!micAnalyserRef.current) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const avg = sum / bufferLength;
          setMicVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animationFrameRef.current = requestAnimationFrame(checkVolume);
        };
        checkVolume();
      } catch {
        // Fallback gracefully if permissions aren't granted right away
      }
    };

    setupMic();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef) streamRef.getTracks().forEach((track) => track.stop());
      if (audioCtx && audioCtx.state !== "closed") audioCtx.close();
    };
  }, []);

  // Submission mutation
  const submitMutation = useMutation({
    mutationFn: (answersPayload: { answers: { questionId: string; audioUrl: string | null }[] }) => {
      return speakingService.submitAttempt(examId, answersPayload);
    },
    onSuccess: async (res) => {
      toast.success("Speaking exam submitted successfully!");
      if (mockAttemptId && mockTestId) {
        try {
          await mockTestService.updateAttempt(mockAttemptId, {
            speakingAttemptId: res.data.id,
          });
          router.push(
            `/student/mock-tests/run/${mockAttemptId}/transition?mockTestId=${mockTestId}&completedModule=speaking`
          );
        } catch {
          toast.error("Failed to link attempt to mock test session.");
          router.push(`/practice/speaking/${examId}/review/${res.data.id}`);
        }
      } else {
        router.push(`/practice/speaking/${examId}/review/${res.data.id}?assessing=1`);
      }
    },
    onError: (err: any) => {
      submittedRef.current = false;
      const msg = err?.response?.data?.message || err?.message || "Submission failed. Please try again.";
      toast.error(msg);
    },
  });

  // Recording controls
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      setRecorder(mediaRecorder);
      setRecordedChunks([]);
      setRecordingStatus("recording");
      setRecordingDuration(0);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setRecordedChunks((prev) => [...prev, e.data]);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error("Could not access microphone. Please grant permission in browser settings.");
    }
  };

  const stopRecording = () => {
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      setRecordingStatus("uploading");
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  // Upload response audio to Cloudinary
  const uploadResponse = useCallback(
    async (questionId: string, chunks: Blob[]) => {
      if (chunks.length === 0) return;
      setUploadsInProgress((prev) => ({ ...prev, [questionId]: true }));
      try {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const localUrl = URL.createObjectURL(audioBlob);
        setLocalAudioUrls((prev) => ({ ...prev, [questionId]: localUrl }));

        const file = new File([audioBlob], `speaking_${questionId}.webm`, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", file);

        const res = await speakingService.uploadAudio(formData);
        setUploadedUrls((prev) => ({ ...prev, [questionId]: res.data.url }));
        setRecordingStatus("ready");
        toast.success("Recording synced to server!");
      } catch {
        toast.error("Background audio upload failed. Will retry on submission.");
      } finally {
        setUploadsInProgress((prev) => ({ ...prev, [questionId]: false }));
      }
    },
    []
  );

  useEffect(() => {
    if (recordedChunks.length > 0 && recordingStatus === "uploading" && currentQuestion) {
      uploadResponse(currentQuestion.id, recordedChunks);
    }
  }, [recordedChunks, recordingStatus, currentQuestion, uploadResponse]);

  // Timers handler for Part 2
  useEffect(() => {
    if (!currentPart) return;

    if (currentPart.partNumber === 2) {
      if (prepTime === null && speakTime === null && timerMode === "none") {
        setPrepTime(currentPart.preparationTime || 60);
        setTimerMode("prep");
      }
    } else {
      setPrepTime(null);
      setSpeakTime(null);
      setTimerMode("none");
      if (testTimerRef.current) clearInterval(testTimerRef.current);
    }
  }, [currentPartIdx]);

  useEffect(() => {
    if (timerMode === "none") return;

    testTimerRef.current = setInterval(() => {
      if (timerMode === "prep" && prepTime !== null) {
        if (prepTime <= 1) {
          clearInterval(testTimerRef.current!);
          setPrepTime(0);
          setSpeakTime(currentPart?.speakingTime || 120);
          setTimerMode("speak");
          startRecording();
        } else {
          setPrepTime((prev) => (prev !== null ? prev - 1 : null));
        }
      } else if (timerMode === "speak" && speakTime !== null) {
        if (speakTime <= 1) {
          clearInterval(testTimerRef.current!);
          setSpeakTime(0);
          stopRecording();
          setTimerMode("none");
        } else {
          setSpeakTime((prev) => (prev !== null ? prev - 1 : null));
        }
      }
    }, 1000);

    return () => {
      if (testTimerRef.current) clearInterval(testTimerRef.current);
    };
  }, [timerMode, prepTime, speakTime, currentPart]);

  const handleSkipPrep = () => {
    if (timerMode === "prep") {
      if (testTimerRef.current) clearInterval(testTimerRef.current);
      setPrepTime(0);
      setSpeakTime(currentPart?.speakingTime || 120);
      setTimerMode("speak");
      startRecording();
    }
  };

  // Progression controls
  const handleNext = () => {
    if (recordingStatus === "recording") {
      stopRecording();
    }
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setRecordingStatus("idle");
      setRecordedChunks([]);
    } else if (currentPartIdx < parts.length - 1) {
      setCurrentPartIdx((prev) => prev + 1);
      setCurrentQuestionIdx(0);
      setRecordingStatus("idle");
      setRecordedChunks([]);
    }
  };

  const handlePrev = () => {
    if (recordingStatus === "recording") {
      stopRecording();
    }
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
      setRecordingStatus("idle");
      setRecordedChunks([]);
    } else if (currentPartIdx > 0) {
      const prevIdx = currentPartIdx - 1;
      const prevQuestions = parts[prevIdx]?.questions || [];
      setCurrentPartIdx(prevIdx);
      setCurrentQuestionIdx(Math.max(0, prevQuestions.length - 1));
      setRecordingStatus("idle");
      setRecordedChunks([]);
    }
  };

  const handleSelectPart = (idx: number) => {
    if (recordingStatus === "recording") {
      stopRecording();
    }
    setCurrentPartIdx(idx);
    setCurrentQuestionIdx(0);
    setRecordingStatus("idle");
    setRecordedChunks([]);
  };

  const handleSubmit = (force = false) => {
    if (submittedRef.current || submitMutation.isPending) return;
    if (recordingStatus === "recording") {
      stopRecording();
    }
    const activeUploadsCount = Object.values(uploadsInProgress).filter(Boolean).length;
    if (activeUploadsCount > 0 && !force) {
      toast.warning("Background uploads are still active. Please wait a few seconds...");
      return;
    }

    const allExamQuestionIds: string[] = [];
    parts.forEach((p) => {
      p.questions?.forEach((q) => {
        allExamQuestionIds.push(q.id);
      });
    });

    const answersPayload = allExamQuestionIds.map((qid) => ({
      questionId: qid,
      audioUrl: uploadedUrls[qid] || null,
    }));

    submittedRef.current = true;
    setShowSubmitModal(false);
    submitMutation.mutate({ answers: answersPayload });
  };

  const toggleKioskFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        toast.error(`Kiosk Mode expansion failed: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const formatSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white gap-4">
        <IconLoader2 size={40} className="animate-spin text-black" />
        <p className="text-sm font-bold text-gray-500">Preparing Speaking Exam Workspace...</p>
      </div>
    );
  }

  if (isError || !exam || parts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 font-sans">
        <div className="bg-white border border-gray-300 p-8 max-w-md w-full text-center shadow-sm">
          <IconAlertCircle className="mx-auto text-red-600 mb-3" size={40} />
          <h2 className="font-bold text-gray-900 text-lg mb-1">Exam Workspace Failed</h2>
          <p className="text-gray-500 text-sm mb-4">
            We couldn't initialize your assessment. The exam may have been deleted or unpublished.
          </p>
          <Link
            href="/practice/speaking"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium"
          >
            <IconArrowLeft size={15} />
            Back to Practice
          </Link>
        </div>
      </div>
    );
  }

  // Active question recorded audio URL
  const currentAudioUrl =
    currentQuestion && (localAudioUrls[currentQuestion.id] || uploadedUrls[currentQuestion.id]);

  // ── Left Panel (Task Prompt / Interview / Cue Card) ──────────────────────
  const promptPanel = (
    <div
      className={`
        ${mobileTab === "recording" ? "hidden lg:flex" : "flex"}
        flex-col
        h-full
        min-h-0
        overflow-hidden
        bg-white
        lg:border-r
        lg:border-gray-200
      `}
    >
      {/* Sticky Panel Header */}
      <div
        className="sticky top-0 z-20 px-4 py-2.5 flex items-center justify-between shrink-0"
        style={{
          background: "#F8FAFC",
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <IconFileText size={16} className="text-black shrink-0" />
          <span className="font-bold text-black text-sm truncate">
            Speaking Part {currentPart?.partNumber || 1}: {currentPart?.title}
          </span>
          <span className="text-xs text-gray-500 font-medium hidden sm:inline">
            (Question {currentQuestionIdx + 1} of {questions.length})
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMobileTab("recording")}
          className="lg:hidden bg-black text-white px-3 py-1 text-xs font-semibold cursor-pointer"
        >
          Audio Studio
        </button>
      </div>

      {/* Scrollable Content Area - Mouse Wheel Scroll Enabled */}
      <div className="flex-1 min-h-0 overflow-y-auto panel-scroll p-4 md:p-6 space-y-6">
        {/* PART 2: CUE CARD SPECIAL LAYOUT */}
        {currentPart?.partNumber === 2 ? (
          <div className="space-y-5 select-text">
            {/* Cue Card Prompt Box */}
            <div className="border-2 border-slate-900 bg-white p-5 md:p-6 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <IconClock size={15} /> Candidate Cue Card
                </span>
                <span className="text-xs font-bold text-gray-500">Speaking limit: 2 Minutes</span>
              </div>

              <div
                className="font-normal text-slate-900 leading-relaxed text-sm md:text-base space-y-2 [&_p]:mb-2 [&_p:last-child]:mb-0"
                dangerouslySetInnerHTML={{
                  __html:
                    currentPart.instruction ||
                    `Describe a topic of interest.<br/>You should say:<br/>- what it is<br/>- when you first learned about it<br/>- why it is important to you`,
                }}
              />
            </div>

            {/* Preparation & Speaking Timers */}
            {timerMode !== "none" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1 Min Prep Timer */}
                <div
                  className={`p-4 border rounded-none transition-colors ${
                    timerMode === "prep" ? "bg-amber-50 border-amber-300" : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">
                    1-Minute Preparation
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-2xl font-mono font-bold text-slate-900">
                      {formatSeconds(prepTime ?? 60)}
                    </span>
                    {timerMode === "prep" && (
                      <button
                        type="button"
                        onClick={handleSkipPrep}
                        className="px-3 py-1 bg-black hover:bg-gray-800 text-white text-xs font-bold transition cursor-pointer"
                      >
                        Start Speaking Now
                      </button>
                    )}
                  </div>
                </div>

                {/* 2 Min Speaking Timer */}
                <div
                  className={`p-4 border rounded-none transition-colors ${
                    timerMode === "speak" ? "bg-red-50 border-red-300" : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">
                    2-Minute Response Time
                  </span>
                  <span className="text-2xl font-mono font-bold text-slate-900 mt-1 block">
                    {formatSeconds(speakTime ?? 120)}
                  </span>
                </div>
              </div>
            )}

            {/* Preparation Notes Pad */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <IconNotebook size={16} /> Preparation Notes Pad (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type your notes or bullet points here to keep them visible while speaking..."
                rows={4}
                className="w-full border border-gray-300 p-3.5 text-sm font-sans text-gray-900 bg-white outline-none focus:border-black focus:ring-1 focus:ring-black resize-y panel-scroll"
              />
              <p className="text-[11px] text-gray-400">
                Notes are for your reference during the assessment and are not assessed by examiners.
              </p>
            </div>
          </div>
        ) : (
          /* PART 1 & PART 3: INTERVIEW QUESTIONS LAYOUT */
          <div className="space-y-5 select-text">
            {/* Instruction banner if present */}
            {currentPart?.instruction && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-normal">
                <span className="font-bold text-slate-900 block mb-0.5">Examiner Instructions:</span>
                <div dangerouslySetInnerHTML={{ __html: currentPart.instruction }} />
              </div>
            )}

            {/* Question Text in Official IELTS Box */}
            <div className="border-2 border-slate-900 bg-white p-6 md:p-8 space-y-4 text-center">
              <span className="inline-block text-[11px] font-bold text-black border border-black px-2.5 py-0.5 uppercase tracking-widest">
                Question {currentQuestionIdx + 1} of {questions.length}
              </span>

              <h2
                className="text-lg md:text-xl font-bold text-slate-900 leading-relaxed max-w-xl mx-auto"
                dangerouslySetInnerHTML={{
                  __html: currentQuestion?.questionText
                    ? `"${currentQuestion.questionText}"`
                    : "Please wait for the examiner's next question prompt.",
                }}
              />

              {/* Examiner Audio if attached */}
              {currentQuestion?.audioUrl && (
                <div className="pt-3 border-t border-gray-150 flex flex-col items-center gap-1.5 max-w-sm mx-auto">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    Listen to Examiner Prompt
                  </span>
                  <audio controls src={currentQuestion.audioUrl} className="w-full h-8" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recorded Audio Playback (If candidate has recorded for this question) */}
        {currentAudioUrl && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-none space-y-2 select-none">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
              <span className="flex items-center gap-1.5">
                <IconCheck size={16} className="text-emerald-600 stroke-[3]" />
                Your Recorded Response
              </span>
              <span className="text-[11px] font-semibold text-emerald-700">Ready for Submission</span>
            </div>
            <audio controls src={currentAudioUrl} className="w-full h-9" />
          </div>
        )}
      </div>
    </div>
  );

  // ── Right Panel (Audio Studio & Recording Controls) ──────────────────────
  const recordingPanel = (
    <div
      className={`
        ${mobileTab === "prompt" ? "hidden lg:flex" : "flex"}
        flex-col
        h-full
        min-h-0
        overflow-hidden
        bg-white
      `}
    >
      {/* Sticky Panel Header */}
      <div
        className="sticky top-0 z-20 px-4 py-2.5 flex items-center justify-between shrink-0"
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <div className="flex items-center gap-2">
          <IconMicrophone size={16} className="text-black" />
          <span className="font-bold text-black text-sm">Audio Studio & Progress</span>
        </div>

        <button
          type="button"
          onClick={() => setMobileTab("prompt")}
          className="lg:hidden bg-black text-white px-3 py-1 text-xs font-semibold cursor-pointer"
        >
          Question View
        </button>
      </div>

      {/* Scrollable Recording Studio Area - Mouse Wheel Scroll Enabled */}
      <div className="flex-1 min-h-0 overflow-y-auto panel-scroll p-4 md:p-6 space-y-6 flex flex-col justify-between select-none">
        {/* Status Tracker */}
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Recording Status
              </span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                {recordingStatus === "recording"
                  ? "🔴 Recording in progress..."
                  : recordingStatus === "uploading"
                  ? "⏳ Uploading audio to server..."
                  : currentAudioUrl
                  ? "✅ Response recorded & saved"
                  : "⚪ Waiting to record response"}
              </span>
            </div>

            {/* Recording timer duration */}
            {recordingStatus === "recording" && (
              <span className="text-lg font-mono font-bold text-red-600 animate-pulse">
                {formatSeconds(recordingDuration)}
              </span>
            )}
          </div>

          {/* Volume Monitor Bar */}
          <div className="bg-slate-50 border border-slate-200 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
              <span className="flex items-center gap-1">
                <IconVolume size={14} className="text-black" />
                Mic Audio Level
              </span>
              <span className="tabular-nums">{micVolumeLevel}%</span>
            </div>
            <div className="w-full bg-gray-200 h-2 overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-100"
                style={{ width: `${micVolumeLevel}%` }}
              />
            </div>
          </div>
        </div>

        {/* Big Tactile Microphone Button */}
        <div className="flex flex-col items-center justify-center my-6 space-y-3">
          <div className="relative">
            {recordingStatus === "recording" && (
              <span className="absolute -inset-3 bg-red-500/20 rounded-full animate-ping pointer-events-none" />
            )}

            <button
              type="button"
              disabled={timerMode === "prep" || recordingStatus === "uploading"}
              onClick={recordingStatus === "recording" ? stopRecording : startRecording}
              className={`h-28 w-28 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer select-none border-4 shadow-sm active:scale-95 ${
                recordingStatus === "recording"
                  ? "bg-red-600 hover:bg-red-700 text-white border-red-200"
                  : "bg-black hover:bg-gray-800 text-white border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
            >
              {recordingStatus === "recording" ? (
                <>
                  <IconPlayerStop size={36} className="stroke-[2.5]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-1">STOP</span>
                </>
              ) : (
                <>
                  <IconMicrophone size={36} className="stroke-[2.5]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-1">
                    {currentAudioUrl ? "RE-RECORD" : "RECORD"}
                  </span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 font-medium text-center max-w-xs">
            {recordingStatus === "recording"
              ? "Speaking now... click the button above when you finish your answer."
              : "Click the microphone button to start recording your response."}
          </p>
        </div>

        {/* Questions Grid Navigator for Current Part */}
        <div className="w-full border-t border-gray-200 pt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-600">
            <span>Part {currentPart?.partNumber} Questions</span>
            <span>
              {questions.filter((q) => uploadedUrls[q.id] || localAudioUrls[q.id]).length} /{" "}
              {questions.length} Recorded
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {questions.map((q, idx) => {
              const isRecorded = !!(uploadedUrls[q.id] || localAudioUrls[q.id]);
              const isCurrent = currentQuestionIdx === idx;

              return (
                <button
                  key={q.id || idx}
                  type="button"
                  onClick={() => {
                    if (recordingStatus === "recording") stopRecording();
                    setCurrentQuestionIdx(idx);
                  }}
                  className={`py-2 px-1 text-xs font-bold border transition-colors cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    isCurrent
                      ? "bg-black text-white border-black"
                      : isRecorded
                      ? "bg-gray-100 text-black border-black"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span>Q{idx + 1}</span>
                  {isRecorded && (
                    <IconCheck
                      size={12}
                      className={isCurrent ? "text-white" : "text-green-600 font-bold"}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <ExamSubmissionOverlay visible={submitMutation.isPending} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

        html,
        body {
          overflow: hidden;
        }

        .panel-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .panel-scroll::-webkit-scrollbar-track {
          background: #F3F4F6;
        }

        .panel-scroll::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 999px;
        }

        .panel-scroll::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }
      `}</style>

      <div className="flex flex-col h-screen bg-white text-gray-800 relative font-sans overflow-hidden">
        {/* 1. CANDIDATE TOP HEADER (Identical British Council CBT Header) */}
        <header className="fixed top-0 left-0 right-0 h-12 bg-white border-b-2 border-black flex items-center justify-between px-4 z-40 select-none font-sans">
          {/* LEFT: Badge & Candidate Details */}
          <div className="flex items-center">
            <span className="font-bold text-sm md:text-base text-black tracking-tight border border-black px-3 py-1">
              Speaking Exam
            </span>

            <div className="hidden sm:flex items-center gap-4 border-l border-gray-300 pl-4 ml-4 text-xs font-medium text-gray-600">
              <span>
                Candidate: <strong className="text-gray-800">{user?.name || "Student"}</strong>
              </span>
              <span>
                ID:{" "}
                <strong className="text-gray-800">
                  {`BRIT${user?.id?.slice(-4).toUpperCase() || "1234"}`}
                </strong>
              </span>
              <span>
                Date:{" "}
                <strong className="text-gray-800">
                  {new Date().toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </strong>
              </span>
            </div>
          </div>

          {/* RIGHT: Test Duration & Utilities */}
          <div className="flex items-center gap-4">
            <ExamTimer
              durationMinutes={exam.duration || 15}
              onTimeUp={() => {
                toast.warning("Time is up. Your speaking responses are being submitted.");
                handleSubmit(true);
              }}
              className="rounded-none border border-black bg-white text-black"
            />

            <div className="flex items-center gap-2.5 text-gray-400">
              <button
                type="button"
                onClick={toggleKioskFullscreen}
                className="hover:text-black transition-colors p-1 cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Simulate Kiosk Fullscreen"}
              >
                {isFullscreen ? <IconMinimize size={20} /> : <IconMaximize size={20} />}
              </button>
              <button
                type="button"
                className="hover:text-black transition-colors p-1 cursor-pointer"
                title="Assessment Information"
              >
                <IconInfoCircle size={20} />
              </button>
              <button
                type="button"
                className="hover:text-black transition-colors p-1 cursor-pointer"
                title="Candidate Profile"
              >
                <IconUserCircle size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* 2. WORKSPACE AREA (mt-12 perfectly balances h-12 header with zero extra gap) */}
        <div
          ref={workspaceRef}
          className="mt-12 flex-1 flex flex-col min-h-0 overflow-hidden relative pb-14 bg-white"
        >
          {/* PROGRESS LINE */}
          <div className="h-0.5 bg-gray-200 shrink-0">
            <div
              className="h-full transition-all duration-500 bg-black"
              style={{
                width: `${
                  totalQuestionsInExam > 0
                    ? (Object.keys(uploadedUrls).length / totalQuestionsInExam) * 100
                    : 0
                }%`,
              }}
            />
          </div>

          {/* MOBILE TAB BAR */}
          <div className="lg:hidden flex shrink-0 border-b border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setMobileTab("prompt")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                mobileTab === "prompt"
                  ? "bg-black text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              Part {currentPart?.partNumber || 1} Question
            </button>

            <button
              type="button"
              onClick={() => setMobileTab("recording")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                mobileTab === "recording"
                  ? "bg-black text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              Audio Studio
            </button>
          </div>

          {/* MAIN SPLITSCREEN WORKSPACE (Resizable & Mouse-Wheel Scroll Enabled) */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {isDesktop ? (
              <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={55} minSize={35}>
                  {promptPanel}
                </ResizablePanel>

                <ResizableHandle
                  withHandle
                  className="w-1.5 bg-gray-200 hover:bg-black transition-all cursor-col-resize shrink-0 h-full"
                />

                <ResizablePanel defaultSize={45} minSize={30}>
                  {recordingPanel}
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <div className="h-full flex flex-col overflow-hidden">
                <div
                  className={`${
                    mobileTab === "recording" ? "hidden" : "flex"
                  } flex-col h-full overflow-hidden`}
                >
                  {promptPanel}
                </div>
                <div
                  className={`${
                    mobileTab === "prompt" ? "hidden" : "flex"
                  } flex-col h-full overflow-hidden`}
                >
                  {recordingPanel}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. PERSISTENT NAVIGATION BAR (British Council CBT Bottom Bar) */}
        <footer className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t-2 border-black flex items-center justify-between px-4 z-40 select-none font-sans">
          {/* LEFT: PART SELECTORS */}
          <div className="flex items-center gap-2">
            {parts.map((p, idx) => {
              const isSelected = currentPartIdx === idx;
              const isPartComplete =
                p.questions?.length > 0 &&
                p.questions.every((q) => uploadedUrls[q.id] || localAudioUrls[q.id]);

              return (
                <button
                  key={p.id || idx}
                  type="button"
                  onClick={() => handleSelectPart(idx)}
                  className={`flex items-center gap-1.5 px-3 md:px-4 py-2 text-xs md:text-sm font-bold border transition-colors select-none cursor-pointer ${
                    isSelected
                      ? "bg-black border-black text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>Part {p.partNumber}</span>
                  {isPartComplete && (
                    <IconCheck
                      size={14}
                      className={isSelected ? "text-white" : "text-green-600 font-bold"}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* CENTER: PREV / NEXT QUESTION NAVIGATION */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentPartIdx === 0 && currentQuestionIdx === 0}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold border select-none transition-colors ${
                currentPartIdx === 0 && currentQuestionIdx === 0
                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
              }`}
            >
              <IconArrowLeft size={15} />
              <span>PREV</span>
            </button>

            <span className="hidden sm:inline text-xs font-bold text-gray-500 tabular-nums">
              Question {currentGlobalQNum} / {totalQuestionsInExam}
            </span>

            <button
              type="button"
              onClick={handleNext}
              disabled={
                currentPartIdx === parts.length - 1 && currentQuestionIdx === questions.length - 1
              }
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold border select-none transition-colors ${
                currentPartIdx === parts.length - 1 && currentQuestionIdx === questions.length - 1
                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-black border-black text-white hover:bg-gray-800 cursor-pointer"
              }`}
            >
              <span>NEXT</span>
              <IconArrowRight size={15} />
            </button>
          </div>

          {/* RIGHT: SUBMIT TEST */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              disabled={submitMutation.isPending}
              className={`flex items-center gap-1.5 px-4 md:px-5 py-2 text-xs md:text-sm font-black border transition-all select-none shadow-sm cursor-pointer ${
                !submitMutation.isPending
                  ? "bg-black border-black hover:bg-gray-800 text-white"
                  : "bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <IconUpload size={16} />
              <span>{submitMutation.isPending ? "SUBMITTING..." : "SUBMIT TEST"}</span>
            </button>
          </div>
        </footer>

        {/* 4. CONFIRMATION SUBMISSION MODAL */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 select-none">
            <div className="bg-white rounded-none border-2 border-black shadow-2xl p-6 w-full max-w-[480px] flex flex-col font-sans animate-fadeIn">
              <h3 className="font-bold text-lg text-black mb-2 flex items-center gap-2">
                <IconAlertCircle size={20} className="text-black shrink-0" />
                Submit Speaking Assessment
              </h3>

              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Are you sure you want to finish and submit your recorded responses? You will not be
                able to re-record once submitted.
              </p>

              <div className="border border-gray-200 p-3 mb-5 space-y-2 bg-gray-50 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Total Questions:</span>
                  <span className="font-bold text-gray-900">{totalQuestionsInExam}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Recorded Answers:</span>
                  <span className="font-bold text-emerald-600">
                    {Object.keys(uploadedUrls).length} completed
                  </span>
                </div>
                {totalQuestionsInExam - Object.keys(uploadedUrls).length > 0 && (
                  <div className="flex justify-between items-center text-amber-700 font-medium">
                    <span>Unanswered Questions:</span>
                    <span>{totalQuestionsInExam - Object.keys(uploadedUrls).length}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                >
                  RETURN TO EXAM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmitModal(false);
                    handleSubmit();
                  }}
                  className="px-5 py-2 bg-black hover:bg-gray-800 text-white text-xs font-black transition cursor-pointer"
                >
                  YES, SUBMIT TEST
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
