"use client";

interface SpeakingQuestion {
  id?: string;
  questionText: string;
  order: number;
}

interface SpeakingPart {
  id?: string;
  partNumber: number;
  title: string;
  instruction?: string | null;
  questions: SpeakingQuestion[];
}

interface SpeakingQuestionPaperProps {
  title?: string;
  parts: SpeakingPart[];
  compact?: boolean;
}

export function SpeakingQuestionPaper({ title, parts, compact = false }: SpeakingQuestionPaperProps) {
  const sortedParts = [...parts].sort((a, b) => a.partNumber - b.partNumber);

  return (
    <article className={`mx-auto w-full max-w-4xl bg-[#fffefb] font-sans text-slate-950 ${compact ? "p-5 sm:p-7" : "p-6 sm:p-10"}`}>
      {title && (
        <div className="mb-7 border-b border-slate-300 pb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">IELTS Speaking Test</p>
          <h1 className="mt-1 text-sm font-bold text-slate-800">{title}</h1>
        </div>
      )}

      <div className="space-y-7">
        {sortedParts.map((part) => {
          const questions = [...(part.questions || [])]
            .sort((a, b) => a.order - b.order)
            .filter((question) => question.questionText.trim() !== "Cue Card Long Turn Response");

          return (
            <section key={part.id || part.partNumber} className="space-y-2">
              <h2 className="text-lg font-extrabold uppercase tracking-[0.08em] text-slate-900">Part {part.partNumber}</h2>

              {part.partNumber === 2 ? (
                <div className="grid items-stretch gap-4 md:grid-cols-[minmax(0,1.25fr)_minmax(210px,0.75fr)]">
                  <div className="border-2 border-slate-700 bg-white p-5 text-sm leading-5">
                    <div className="speaking-paper-content" dangerouslySetInnerHTML={{ __html: part.instruction || "Add the Part 2 cue-card topic and prompts." }} />
                  </div>
                  <div className="flex items-center bg-white px-1 text-sm leading-5 text-slate-700">
                    <p>
                      You will have to talk about the topic for one to two minutes.<br />
                      You have one minute to think about what you are going to say.<br />
                      You can make some notes to help you if you wish.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {part.instruction && (
                    <div className="speaking-paper-content max-w-3xl text-sm leading-5 text-slate-700" dangerouslySetInnerHTML={{ __html: part.instruction }} />
                  )}
                  {part.partNumber === 1 && <h3 className="pt-1 text-sm font-extrabold uppercase tracking-wide">Example questions</h3>}
                  {part.partNumber === 3 && <h3 className="pt-1 text-sm font-bold italic">Discussion topics and example questions</h3>}
                  {questions.length > 0 ? (
                    <ul className="space-y-1 pl-5 text-sm leading-5">
                      {questions.map((question) => (
                        <li key={question.id || `${part.partNumber}-${question.order}`} className="list-disc pl-1" dangerouslySetInnerHTML={{ __html: question.questionText }} />
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm italic text-slate-400">Questions will appear here as you add them.</p>
                  )}
                </>
              )}
            </section>
          );
        })}
      </div>
    </article>
  );
}
