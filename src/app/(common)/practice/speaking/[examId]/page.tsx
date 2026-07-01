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
  IconChevronRight,
  IconDeviceFloppy,
  IconNotebook,
  IconClock,
  IconCheck,
} from "@tabler/icons-react";
import { useAuth } from "@/providers/AuthProvider";
import { useTextHighlighter } from "@/hooks/useTextHighlighter";
import Link from "next/link";

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

  // Screen state: 'MIC_CHECK' | 'TEST' | 'COMPLETED'
  const [screen, setScreen] = useState<"MIC_CHECK" | "TEST" | "COMPLETED">("MIC_CHECK");

  // Mic test states
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [micRecorder, setMicRecorder] = useState<MediaRecorder | null>(null);
  const [micChunks, setMicChunks] = useState<Blob[]>([]);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [testAudioUrl, setTestAudioUrl] = useState<string | null>(null);
  const [micVolumeLevel, setMicVolumeLevel] = useState(0);

  // Test progression states
  const [currentPartIdx, setCurrentPartIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // Cue card notepad (Part 2)
  const [notes, setNotes] = useState("");

  // Timers (Part 2)
  const [prepTime, setPrepTime] = useState<number | null>(null);
  const [speakTime, setSpeakTime] = useState<number | null>(null);
  const [timerMode, setTimerMode] = useState<"prep" | "speak" | "none">("none");

  // Official MediaRecorder states
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "uploading" | "ready">("idle");
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  
  // Answers upload states: questionId -> cloudinaryUrl
  const [uploadedUrls, setUploadedUrls] = useState<Record<string, string>>({});
  const [localAudioUrls, setLocalAudioUrls] = useState<Record<string, string>>({});
  const [uploadsInProgress, setUploadsInProgress] = useState<Record<string, boolean>>({});

  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const testTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Submission mutation
  const submitMutation = useMutation({
    mutationFn: (answersPayload: { answers: { questionId: string; audioUrl: string | null }[] }) => {
      return speakingService.submitAttempt(examId, answersPayload);
    },
    onSuccess: async (res) => {
      toast.success("Speaking exam submitted successfully!");
      setScreen("COMPLETED");
      if (mockAttemptId && mockTestId) {
        try {
          await mockTestService.updateAttempt(mockAttemptId, {
            speakingAttemptId: res.data.id,
          });
          router.push(`/student/mock-tests/run/${mockAttemptId}/transition?mockTestId=${mockTestId}&completedModule=speaking`);
        } catch (err) {
          toast.error("Failed to link attempt to mock test session.");
          router.push(`/practice/speaking/${examId}/review/${res.data.id}`);
        }
      } else {
        router.push(`/practice/speaking/${examId}/review/${res.data.id}`);
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Submission failed. Please try again.";
      toast.error(msg);
    },
  });

  // Check and setup microphone for check screen
  const requestMicAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);

      // Volume visualizer setup
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
      toast.success("Microphone connected successfully!");
    } catch (err: any) {
      toast.error("Microphone access denied. Please enable mic permissions in your browser.");
    }
  };

  useEffect(() => {
    requestMicAccess();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (micStream) micStream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Mic test record controls
  const startMicTest = () => {
    if (!micStream) {
      toast.error("Microphone stream not initialized.");
      return;
    }
    const rec = new MediaRecorder(micStream);
    setMicRecorder(rec);
    setMicChunks([]);
    setTestAudioUrl(null);
    setIsTestingMic(true);

    rec.ondataavailable = (e) => {
      if (e.data.size > 0) {
        setMicChunks((prev) => [...prev, e.data]);
      }
    };

    rec.onstop = () => {
      setIsTestingMic(false);
    };

    rec.start();
  };

  const stopMicTest = () => {
    if (micRecorder && micRecorder.state !== "inactive") {
      micRecorder.stop();
    }
  };

  useEffect(() => {
    if (micChunks.length > 0 && !isTestingMic) {
      const blob = new Blob(micChunks, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setTestAudioUrl(url);
    }
  }, [micChunks, isTestingMic]);

  // Start the actual test
  const startTest = () => {
    // Release mic check stream first
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (micStream) micStream.getTracks().forEach((track) => track.stop());

    setScreen("TEST");
  };

  // Get stream for the active test
  const getTestStream = async (): Promise<MediaStream | null> => {
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      toast.error("Could not capture microphone stream. Check browser settings.");
      return null;
    }
  };

  // Audio recording handlers for current question
  const startRecording = async () => {
    const stream = await getTestStream();
    if (!stream) return;

    const mediaRecorder = new MediaRecorder(stream);
    setRecorder(mediaRecorder);
    setRecordedChunks([]);
    setRecordingStatus("recording");

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        setRecordedChunks((prev) => [...prev, e.data]);
      }
    };

    mediaRecorder.onstop = async () => {
      // stop tracks to release hardware
      stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorder.start();
  };

  const stopRecording = () => {
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      setRecordingStatus("uploading");
    }
  };

  // Upload finished audio for specific question
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
      } catch (err: any) {
        toast.error("Background audio upload failed. We will retry on submit.");
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

    // Trigger timers if Part 2 is loaded
    if (currentPart.partNumber === 2) {
      if (prepTime === null && speakTime === null && timerMode === "none") {
        setPrepTime(currentPart.preparationTime || 60);
        setTimerMode("prep");
      }
    } else {
      // Clear timers for non Part 2
      setPrepTime(null);
      setSpeakTime(null);
      setTimerMode("none");
      if (testTimerRef.current) clearInterval(testTimerRef.current);
    }
  }, [currentPartIdx]);

  // Tick the Part 2 timers
  useEffect(() => {
    if (timerMode === "none") return;

    testTimerRef.current = setInterval(() => {
      if (timerMode === "prep" && prepTime !== null) {
        if (prepTime <= 1) {
          clearInterval(testTimerRef.current!);
          setPrepTime(0);
          setSpeakTime(currentPart.speakingTime || 120);
          setTimerMode("speak");
          // Automatically start recording speaking response for Part 2 cue card
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
      setSpeakTime(currentPart.speakingTime || 120);
      setTimerMode("speak");
      startRecording();
    }
  };

  // Progression navigation
  const handleNext = () => {
    if (recordingStatus === "recording") {
      stopRecording();
    }

    if (currentQuestionIdx < questions.length - 1) {
      // Progress to next question inside current part
      setCurrentQuestionIdx((prev) => prev + 1);
      setRecordingStatus("idle");
      setRecordedChunks([]);
    } else if (currentPartIdx < parts.length - 1) {
      // Progress to next part
      setCurrentPartIdx((prev) => prev + 1);
      setCurrentQuestionIdx(0);
      setRecordingStatus("idle");
      setRecordedChunks([]);
    }
  };

  // Submit flow
  const handleSubmit = () => {
    // Check if any uploads are still in progress
    const activeUploadsCount = Object.values(uploadsInProgress).filter(Boolean).length;
    if (activeUploadsCount > 0) {
      toast.warning("Background uploads are still active. Please wait a few seconds...");
      return;
    }

    // Check if all questions have an audio uploaded
    const allExamQuestionIds: string[] = [];
    parts.forEach((p) => {
      p.questions.forEach((q) => {
        allExamQuestionIds.push(q.id);
      });
    });

    const answersPayload = allExamQuestionIds.map((qid) => ({
      questionId: qid,
      audioUrl: uploadedUrls[qid] || null,
    }));

    const missingAnswersCount = answersPayload.filter((a) => !a.audioUrl).length;
    if (missingAnswersCount > 0) {
      toast.warning(`You have ${missingAnswersCount} unanswered questions. We will submit remaining ones.`);
    }

    submitMutation.mutate({ answers: answersPayload });
  };

  // Visual timers formatting
  const formatSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Pre-loader
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <IconLoader2 size={40} className="animate-spin text-rose-500" />
        <p className="text-sm font-bold text-gray-500">Preparing Speaking Exam Workspace...</p>
      </div>
    );
  }

  if (isError || !exam || parts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 max-w-md mx-auto text-center px-4">
        <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
          <IconAlertCircle size={28} />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-black text-gray-900 text-lg">Exam Workspace Failed</h2>
          <p className="text-sm text-gray-500 font-medium leading-relaxed">
            We couldn't initialize your assessment. The exam may have been deleted or unpublished.
          </p>
        </div>
        <Link
          href="/practice/speaking"
          className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-sm transition"
        >
          Return to Practice Zone
        </Link>
      </div>
    );
  }

  // SCREEN 1: MIC CHECK
  if (screen === "MIC_CHECK") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-gray-150 p-6 md:p-8 shadow-xl space-y-6">
          <div className="text-center space-y-3">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-100">
              <IconMicrophone size={32} />
            </span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Setup and Test Microphone</h1>
            <p className="text-sm font-medium text-gray-500 max-w-sm mx-auto leading-relaxed">
              Before beginning the mock exam, test your voice quality to ensure clear review playbacks for grading.
            </p>
          </div>

          {/* Volume bars visualizer */}
          <div className="bg-slate-50 border border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <IconVolume size={16} className="text-rose-500" />
              <span>Mic Level Monitor</span>
            </div>
            
            <div className="w-full h-8 flex gap-1 items-center justify-center">
              {Array.from({ length: 15 }).map((_, i) => {
                const active = micVolumeLevel > i * 6.6;
                return (
                  <div
                    key={i}
                    className={`w-2 rounded-full transition-all duration-100 ${
                      active
                        ? i < 9
                          ? "bg-rose-500 h-6"
                          : i < 12
                          ? "bg-amber-400 h-7"
                          : "bg-emerald-500 h-8"
                        : "bg-gray-200 h-3"
                    }`}
                  />
                );
              })}
            </div>
            
            <span className="text-[10px] text-gray-400 font-bold">Speak into your mic to verify movement.</span>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              {isTestingMic ? (
                <button
                  onClick={stopMicTest}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm shadow-sm transition active:scale-95"
                >
                  <IconPlayerStop size={18} /> Stop Test Recording
                </button>
              ) : (
                <button
                  onClick={startMicTest}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-extrabold text-sm shadow-sm transition active:scale-95"
                >
                  <IconMicrophone size={18} /> Test Record Audio
                </button>
              )}

              {testAudioUrl && (
                <a
                  href={testAudioUrl}
                  target="_blank"
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-extrabold text-sm transition"
                >
                  <IconPlayerPlay size={18} /> Playback Test Audio
                </a>
              )}
            </div>

            {testAudioUrl && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold max-w-md mx-auto">
                <IconCircleCheck size={18} className="shrink-0 text-emerald-600 mt-0.5" />
                <p>If you can hear your recorded playback clearly, click below to proceed to the mock exam.</p>
              </div>
            )}

            <button
              onClick={startTest}
              disabled={!testAudioUrl}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black text-sm tracking-wide uppercase transition active:scale-98 disabled:pointer-events-none shadow-md shadow-rose-500/10"
            >
              Start Official Mock Test <IconChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 2: EXAM WORKSPACE
  const progressPercent = Math.round(
    ((currentPartIdx * 10 + currentQuestionIdx + 1) / (parts.length * 10)) * 100
  );

  const totalQuestionsInExam = parts.reduce((acc, p) => acc + p.questions.length, 0);
  const currentGlobalQNum = parts.slice(0, currentPartIdx).reduce((acc, p) => acc + p.questions.length, 0) + currentQuestionIdx + 1;

  const activeUploads = Object.values(uploadsInProgress).filter(Boolean).length;

  return (
    <>
      <style>{`
        .highlighted {
          background-color: #fdff32 !important;
          color: #000000 !important;
          cursor: pointer;
        }
      `}</style>
      <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
        {/* Candiate Test Header */}
        <header className="h-16 shrink-0 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500 border border-rose-100">
              <IconMicrophone size={22} />
            </div>
            <div>
              <h2 className="font-black text-gray-900 text-sm">{exam.title}</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">IELTS Speaking Assessment</p>
            </div>
          </div>

          {/* Global Progress Bar */}
          <div className="hidden md:flex items-center gap-3 w-64">
            <div className="w-full bg-gray-150 h-2 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full transition-all duration-300" style={{ width: `${(currentGlobalQNum / totalQuestionsInExam) * 100}%` }} />
            </div>
            <span className="text-[10px] font-black text-gray-400 shrink-0 uppercase tracking-wide">
              Q: {currentGlobalQNum}/{totalQuestionsInExam}
            </span>
          </div>

          {/* Action / submission indicator */}
          <div className="flex items-center gap-3">
            {activeUploads > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold animate-pulse">
                <IconLoader2 size={12} className="animate-spin text-amber-600" />
                <span>Uploading {activeUploads} Audio{activeUploads !== 1 ? "s" : ""}...</span>
              </span>
            )}

            <button
              onClick={handleSubmit}
              className="px-4.5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95"
            >
              Submit Assessment
            </button>
          </div>
        </header>

        {/* Main workspace container */}
        <main ref={workspaceRef} className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl mx-auto w-full p-4 md:p-6 gap-6 min-h-[calc(100vh-4rem)]">
        {/* Left container: Task cue card or interview questions */}
        <section className="flex-1 bg-white rounded-3xl border border-gray-150 p-6 md:p-8 flex flex-col justify-between shadow-sm space-y-6 min-h-[400px]">
          
          {/* Header Part details */}
          <div className="border-b border-gray-100 pb-4">
            <div className="inline-flex px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-[10px] font-black uppercase tracking-widest text-rose-600 mb-2">
              Speaking Part {currentPart?.partNumber || 1}
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">{currentPart?.title}</h1>
          </div>

          {/* Cue card display for Part 2 */}
          {currentPart?.partNumber === 2 ? (
            <div className="flex-1 flex flex-col justify-center space-y-4">
              <div className="bg-amber-50/50 border border-amber-100/80 rounded-2xl p-6 text-gray-800 leading-relaxed font-semibold relative shadow-xs">
                <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs text-amber-700 font-bold bg-amber-100/50 px-2.5 py-1 rounded-full">
                  <IconClock size={14} /> Cue Card topic
                </div>
                
                <h3 className="text-lg font-black text-black mb-3">Cue Card Cue Prompt:</h3>
                <div
                  className="whitespace-pre-wrap select-text text-sm md:text-base leading-relaxed text-black"
                  dangerouslySetInnerHTML={{ __html: currentPart.instruction || "" }}
                />
              </div>

              {/* notepad for Part 2 */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <IconNotebook size={16} /> Optional notes pad (1 minute preparation notes):
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Draft your bullet point answers or keywords here to keep them visible while speaking..."
                  className="w-full h-32 text-xs font-semibold px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 bg-slate-50/50 placeholder:text-gray-400 text-black resize-none"
                />
              </div>
            </div>
          ) : (
            // Part 1 & Part 3 Interview Q display
            <div className="flex-1 flex flex-col justify-center space-y-6">
              {currentPart?.instruction && (
                <p
                  className="text-xs text-gray-400 font-bold uppercase tracking-wider bg-slate-50 p-3 rounded-lg border border-gray-100 select-text"
                  dangerouslySetInnerHTML={{ __html: `Instruction: ${currentPart.instruction}` }}
                />
              )}

              <div className="bg-slate-50/80 border border-gray-150 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center text-center space-y-4 select-text">
                <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 rounded-full px-3 py-0.5 tracking-widest uppercase">
                  Question {currentQuestionIdx + 1} of {questions.length}
                </span>
                <h2
                  className="text-lg md:text-2xl font-black text-gray-900 leading-snug"
                  dangerouslySetInnerHTML={{ __html: `"${currentQuestion?.questionText}"` }}
                />
              </div>
            </div>
          )}

          {/* Prompt controls footer */}
          <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">
              Exam: Part {currentPartIdx + 1}/{parts.length}
            </span>

            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-extrabold text-sm shadow-sm transition duration-200 active:scale-95"
            >
              <span>Next Question</span>
              <IconChevronRight size={16} />
            </button>
          </div>
        </section>

        {/* Right container: Recording panel and timers */}
        <section className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
          {/* Part 2 prep & speak visual timers */}
          {currentPart?.partNumber === 2 && timerMode !== "none" && (
            <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm space-y-4 text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <IconClock size={16} className="text-rose-500 animate-pulse" />
                <span>{timerMode === "prep" ? "Preparation Period" : "Speaking Response Time"}</span>
              </div>
              
              <div className={`text-4xl font-black tabular-nums tracking-tight ${timerMode === "prep" ? "text-amber-500" : "text-rose-600"}`}>
                {timerMode === "prep" ? formatSeconds(prepTime || 0) : formatSeconds(speakTime || 0)}
              </div>

              {timerMode === "prep" && (
                <button
                  onClick={handleSkipPrep}
                  className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition"
                >
                  Start Speaking Now
                </button>
              )}
            </div>
          )}

          {/* Recording monitor panel */}
          <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-6 flex-1">
            <div className="space-y-1.5">
              <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider">Recording Control</h3>
              <p className="text-[11px] font-medium text-gray-400 max-w-[200px] leading-relaxed">
                {currentPart?.partNumber === 2
                  ? "In Part 2, the recording starts automatically once prep timer expires."
                  : "Click record, speak clearly, and stop when finished."}
              </p>
            </div>

            {/* Recording visual button */}
            <div className="relative">
              {recordingStatus === "recording" && (
                <span className="absolute -inset-2.5 bg-rose-500/10 rounded-full animate-ping pointer-events-none" />
              )}
              
              <button
                disabled={timerMode === "prep" || recordingStatus === "uploading"}
                onClick={recordingStatus === "recording" ? stopRecording : startRecording}
                className={`h-24 w-24 rounded-full flex flex-col items-center justify-center shadow-lg transition active:scale-95 border-4 border-slate-50 select-none ${
                  recordingStatus === "recording"
                    ? "bg-rose-500 text-white hover:bg-rose-600 hover:shadow-rose-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:pointer-events-none"
                }`}
              >
                {recordingStatus === "recording" ? (
                  <>
                    <IconPlayerStop size={32} className="stroke-[2.5]" />
                    <span className="text-[9px] font-black uppercase mt-1">Recording</span>
                  </>
                ) : (
                  <>
                    <IconMicrophone size={32} className="stroke-[2.5]" />
                    <span className="text-[9px] font-black uppercase mt-1">Record response</span>
                  </>
                )}
              </button>
            </div>

            {/* Upload status tracker */}
            {currentQuestion && (
              <div className="w-full border-t border-gray-100 pt-4 flex items-center justify-between text-xs font-semibold text-gray-500 px-1">
                <span>Response Upload:</span>
                {uploadsInProgress[currentQuestion.id] ? (
                  <span className="flex items-center gap-1 text-amber-600 font-bold animate-pulse">
                    <IconLoader2 size={14} className="animate-spin" /> Uploading...
                  </span>
                ) : uploadedUrls[currentQuestion.id] ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-extrabold">
                    <IconCheck size={14} /> Synced to Server
                  </span>
                ) : localAudioUrls[currentQuestion.id] ? (
                  <span className="text-gray-400 font-medium">Ready</span>
                ) : (
                  <span className="text-rose-500 font-bold">Unrecorded</span>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
    </>
  );
}
