"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { IconBook2, IconHeadset, IconMicrophone, IconPencil, IconX } from "@tabler/icons-react";
import { SpeakingQuestionPaper } from "@/components/Speaking/SpeakingQuestionPaper";
import { ExamImageViewer } from "@/components/Writing/ExamImageViewer";
import { parseBoldText } from "@/lib/utils";
import { QuestionRenderer } from "@/components/Reading/QuestionRenderer";
import { ListeningQuestionRenderer } from "@/components/Listening/ListeningQuestionRenderer";

export type MockPreviewMode = "full" | "listening" | "reading" | "writing" | "speaking";

interface FullMockTestPreviewProps {
  isOpen: boolean;
  mode: MockPreviewMode;
  onClose: () => void;
  title: string;
  listening: any;
  reading: { title: string; passages: any[]; questions: any[] };
  writing: { title: string; tasks: any[] };
  speaking: { title: string; parts: any[] };
}

export function FullMockTestPreview({ isOpen, mode, onClose, title, listening, reading, writing, speaking }: FullMockTestPreviewProps) {
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, string>>({});
  if (!isOpen) return null;
  const visible = (section: Exclude<MockPreviewMode, "full">) => mode === "full" || mode === section;
  const answerPreviewQuestion = (questionId: string, value: string) => {
    setPreviewAnswers((current) => ({ ...current, [questionId]: value }));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 p-2 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-label="Full mock test preview">
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-xl bg-slate-100 shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-300 bg-white px-4 py-3 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">{mode === "full" ? "Complete four-module preview" : `${mode} module preview`}</p>
            <h2 className="text-base font-bold text-slate-900">{title || "Mock Test Preview"}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-100" aria-label="Close preview"><IconX size={20} /></button>
        </header>

        <div className="panel-scroll flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6">
          <div className="mx-auto max-w-5xl space-y-6">
            {visible("listening") && (
              <PreviewSection number={1} title="Listening" icon={IconHeadset}>
                <div className="space-y-6">
                  {(listening.sections || []).map((section: any, sectionIndex: number) => (
                    <section key={sectionIndex} className="space-y-3">
                      <div className="border-b border-slate-300 pb-2"><h3 className="font-bold">Section {sectionIndex + 1}: {section.title}</h3>{section.instruction && <p className="mt-1 text-sm text-slate-600">{section.instruction}</p>}</div>
                      {(section.questionGroups || []).map((group: any, groupIndex: number) => (
                        <ListeningQuestionRenderer
                          key={group.id || groupIndex}
                          group={group}
                          answers={previewAnswers}
                          onAnswer={answerPreviewQuestion}
                          sectionIndex={sectionIndex}
                        />
                      ))}
                    </section>
                  ))}
                </div>
              </PreviewSection>
            )}

            {visible("reading") && (
              <PreviewSection number={2} title="Reading" icon={IconBook2}>
                <div className="space-y-8">
                  {reading.passages.map((passage, index) => (
                    <section key={index} className="grid gap-5 lg:grid-cols-2">
                      <div className="border-r-0 border-slate-300 lg:border-r lg:pr-5">
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Reading Passage {index + 1}</p>
                        <h3 className="my-2 text-lg font-bold">{parseBoldText(passage.title || `Passage ${index + 1}`)}</h3>
                        <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{parseBoldText(passage.body || passage.text || "Passage text will appear here.")}</div>
                      </div>
                      <div className="space-y-2">
                        {createReadingGroups(reading.questions, index + 1).map((group) => (
                          <QuestionRenderer
                            key={group.id}
                            group={group as any}
                            answers={previewAnswers}
                            onAnswer={answerPreviewQuestion}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </PreviewSection>
            )}

            {visible("writing") && (
              <PreviewSection number={3} title="Writing" icon={IconPencil}>
                <div className="space-y-8">
                  {writing.tasks.map((task, index) => (
                    <section key={index} className="rounded border border-slate-300 bg-white p-5">
                      <div dangerouslySetInnerHTML={{ __html: task.instruction || `<h3>WRITING TASK ${index + 1}</h3>` }} />
                      {task.imageUrl && <ExamImageViewer src={task.imageUrl} embedded />}
                    </section>
                  ))}
                </div>
              </PreviewSection>
            )}

            {visible("speaking") && (
              <PreviewSection number={4} title="Speaking" icon={IconMicrophone}>
                <SpeakingQuestionPaper title={speaking.title} parts={speaking.parts} compact />
              </PreviewSection>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewSection({ number, title, icon: Icon, children }: { number: number; title: string; icon: typeof IconHeadset; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-xl border border-slate-300 bg-[#fffefb] shadow-sm"><div className="flex items-center gap-3 border-b border-slate-300 bg-white px-5 py-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{number}</span><Icon size={19} className="text-slate-600" /><h2 className="font-bold uppercase tracking-wide">{title} Test</h2></div><div className="p-4 sm:p-6">{children}</div></section>;
}

function createReadingGroups(questions: any[], passageIndex: number) {
  const groups: any[] = [];
  questions
    .filter((question) => question.passageIndex === passageIndex)
    .sort((a, b) => a.questionNumber - b.questionNumber)
    .forEach((question) => {
      const previous = groups[groups.length - 1];
      const canJoin = previous && previous.type === question.typeCode && previous.instruction === question.instruction;
      const group = canJoin ? previous : {
        id: `full-preview-${passageIndex}-${groups.length}`,
        passageId: `full-preview-passage-${passageIndex}`,
        type: question.typeCode,
        instruction: question.instruction,
        passageSegment: question.passageSegment,
        options: question.typeCode === "SUMMARY_COMPLETION_WITHOUT_OPTIONS" ? undefined : question.groupOptions,
        imageUrl: question.groupImageUrl,
        order: groups.length + 1,
        questions: [],
      };
      if (!canJoin) groups.push(group);
      group.questions.push({
        id: question.id,
        groupId: group.id,
        questionNumber: question.questionNumber,
        questionText: question.text || question.questionText,
        options: question.options,
      });
    });
  return groups;
}

// Kept as a compact fallback for incomplete legacy preview records.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function RichQuestionLine({ number, text }: { number?: number; text?: string }) {
  if (!text) return <QuestionLine number={number} text={text} />;
  return <div className="flex gap-3 border-b border-slate-100 py-2 text-sm"><span className="flex h-6 min-w-6 items-center justify-center rounded border border-slate-400 bg-white text-xs font-bold">{number ?? "–"}</span><div className="leading-5">{parseBoldText(text || "Question text")}</div></div>;
}

function QuestionLine({ number, text }: { number?: number; text?: string }) {
  return <div className="flex gap-3 border-b border-slate-100 py-2 text-sm"><span className="flex h-6 min-w-6 items-center justify-center rounded border border-slate-400 bg-white text-xs font-bold">{number ?? "–"}</span><div className="leading-5" dangerouslySetInnerHTML={{ __html: text || "Question text" }} /></div>;
}
