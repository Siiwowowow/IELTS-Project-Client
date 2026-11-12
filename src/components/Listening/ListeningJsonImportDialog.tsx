"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { IconAlertCircle, IconCircleCheck, IconCode, IconCopy, IconFileUpload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildListeningAiPromptTemplate,
  createNextListeningImportPlanRange,
  LISTENING_IMPORT_SAMPLE,
  LISTENING_QUESTION_TYPES,
  parseListeningImportJson,
  type ListeningImportResult,
  type ListeningImportPlanRange,
  type ListeningQuestionType,
} from "@/lib/listeningJsonImport";

interface ListeningJsonImportDialogProps {
  activeSection: number;
  jsonText: string;
  onJsonTextChange: (value: string) => void;
  onImport: (result: ListeningImportResult, options: { replaceExisting: boolean }) => void;
}

export function ListeningJsonImportDialog({
  activeSection,
  jsonText,
  onJsonTextChange,
  onImport,
}: ListeningJsonImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [planRanges, setPlanRanges] = useState<ListeningImportPlanRange[]>([
    { sectionNumber: 1, from: 1, to: 5, typeCode: "" },
  ]);
  const [rangeDrafts, setRangeDrafts] = useState<Array<{ from?: string; to?: string }>>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const result = useMemo(() => {
    if (!jsonText.trim()) return null;
    return parseListeningImportJson(jsonText, { fallbackSection: activeSection });
  }, [jsonText, activeSection]);

  const canImport = Boolean(result && result.errors.length === 0 && result.sections.length > 0);

  const planError = useMemo(() => {
    const ordered = planRanges.slice().sort((a, b) => a.from - b.from);
    let expectedNumber = 1;

    for (const range of ordered) {
      if (!Number.isInteger(range.from) || !Number.isInteger(range.to) ||
        range.from < 1 || range.to > 40 || range.from > range.to) {
        return "Each question range must be between 1 and 40, with the start before the end.";
      }
      const sectionStart = (range.sectionNumber - 1) * 10 + 1;
      const sectionEnd = range.sectionNumber * 10;
      if (range.from < sectionStart || range.to > sectionEnd) {
        return `Q${range.from}–Q${range.to} must stay within Section ${range.sectionNumber} (Q${sectionStart}–Q${sectionEnd}).`;
      }
      if (!range.typeCode) return `Select a question type for Q${range.from}–Q${range.to}.`;
      if (range.from !== expectedNumber) {
        return range.from < expectedNumber
          ? `Question ranges overlap at Q${range.from}.`
          : `Question ranges must be continuous; Q${expectedNumber} is missing.`;
      }
      if (range.typeCode === "MULTIPLE_CHOICE_MULTIPLE" && range.to - range.from + 1 !== 2) {
        return "Double MCQ must contain exactly two question numbers.";
      }
      expectedNumber = range.to + 1;
    }

    return expectedNumber === 41 ? "" : `Add a question type for Q${expectedNumber}–Q40.`;
  }, [planRanges]);

  const updatePlanRange = (index: number, patch: Partial<ListeningImportPlanRange>) => {
    setPlanRanges((current) => current.map((range, rangeIndex) =>
      rangeIndex === index ? { ...range, ...patch } : range
    ));
  };

  const updateRangeDraft = (index: number, field: "from" | "to", value: string) => {
    if (!/^\d*$/.test(value)) return;
    setRangeDrafts((current) => {
      const next = current.slice();
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const commitRangeDraft = (index: number, field: "from" | "to") => {
    const range = planRanges[index];
    if (!range) return;
    const rawValue = rangeDrafts[index]?.[field];
    if (rawValue === undefined) return;
    const value = Number(rawValue);
    if (!rawValue || !Number.isInteger(value) || value < 1 || value > 40) {
      setRangeDrafts((current) => {
        const next = current.slice();
        next[index] = { ...next[index], [field]: String(range[field]) };
        return next;
      });
      return;
    }
    updatePlanRange(index, { [field]: value });
    setRangeDrafts((current) => {
      const next = current.slice();
      next[index] = { ...next[index], [field]: String(value) };
      return next;
    });
  };

  const addPlanRange = () => {
    const nextRange = createNextListeningImportPlanRange(planRanges);
    if (!nextRange) {
      toast.error("All 40 question numbers are already assigned.");
      return;
    }
    setPlanRanges((current) => [...current, nextRange]);
    setRangeDrafts([]);
  };

  const removePlanRange = (index: number) => {
    setRangeDrafts([]);
    setPlanRanges((current) => current.length <= 1
      ? current
      : current.filter((_, rangeIndex) => rangeIndex !== index)
    );
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      onJsonTextChange(await file.text());
    } catch (error) {
      toast.error(error instanceof Error ? `Could not read JSON file: ${error.message}` : "Could not read JSON file.");
    } finally {
      event.target.value = "";
    }
  };

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Clipboard not available");
    }
  };

  const handleImport = () => {
    if (!result || !canImport) return;
    onImport(result, { replaceExisting });
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2 border-blue-200 font-bold text-[#1B3A6B] hover:bg-blue-50"
      >
        <IconCode size={16} />
        {jsonText.trim() ? "Edit Bulk JSON" : "Bulk Import (JSON)"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bulk import Listening questions</DialogTitle>
            <DialogDescription>
              Plan your Listening question types first, then paste or upload the JSON. Listening questions are organized into four sections, Q1–10, Q11–20, Q21–30, and Q31–40.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => onJsonTextChange(LISTENING_IMPORT_SAMPLE)}>
              Load sample
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
              <IconFileUpload size={14} /> Upload .json
            </Button>
            <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={handleFile} />
          </div>

          <section className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
            <div>
              <h3 className="text-sm font-bold text-blue-950">Step 1: Plan question types for Q1–Q40</h3>
              <p className="mt-1 text-xs text-blue-900/80">
                Starts with editable Q1–5. Add creates the next range of up to five questions without changing earlier ranges. Each range must stay inside its Listening section; removing a row does not renumber the others.
              </p>
            </div>

            <div className="space-y-2">
              {planRanges.map((range, index) => (
                <div key={`${range.from}-${range.to}-${index}`} className="grid gap-2 rounded-md border border-blue-100 bg-white p-2 sm:grid-cols-[minmax(120px,1fr)_80px_80px_minmax(180px,2fr)_auto] sm:items-end">
                  <label className="text-xs font-semibold text-slate-700">
                    Section
                    <select
                      value={range.sectionNumber}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        if (value >= 1 && value <= 4) {
                          updatePlanRange(index, { sectionNumber: value as 1 | 2 | 3 | 4 });
                        }
                      }}
                      className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
                    >
                      <option value={1}>Section 1</option>
                      <option value={2}>Section 2</option>
                      <option value={3}>Section 3</option>
                      <option value={4}>Section 4</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    From Q
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={rangeDrafts[index]?.from ?? String(range.from)}
                      onChange={(event) => updateRangeDraft(index, "from", event.target.value)}
                      onBlur={() => commitRangeDraft(index, "from")}
                      className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    To Q
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={rangeDrafts[index]?.to ?? String(range.to)}
                      onChange={(event) => updateRangeDraft(index, "to", event.target.value)}
                      onBlur={() => commitRangeDraft(index, "to")}
                      className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Question type
                    <select
                      value={range.typeCode}
                      onChange={(event) => {
                        const typeCode = event.target.value as ListeningQuestionType | "";
                        const nextTo = Math.min(range.from + 1, range.sectionNumber * 10);
                        updatePlanRange(index, {
                          typeCode,
                          ...(typeCode === "MULTIPLE_CHOICE_MULTIPLE"
                            ? { to: nextTo }
                            : {}),
                        });
                        if (typeCode === "MULTIPLE_CHOICE_MULTIPLE") {
                          setRangeDrafts((current) => {
                            const next = current.slice();
                            next[index] = { ...next[index], to: String(nextTo) };
                            return next;
                          });
                        }
                      }}
                      className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
                    >
                      <option value="">Select a question type</option>
                      {LISTENING_QUESTION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={planRanges.length <= 1}
                    onClick={() => removePlanRange(index)}
                    className="text-slate-500 hover:text-red-600"
                    aria-label={`Remove Q${range.from} to Q${range.to} range`}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            {planError && <p role="alert" className="text-xs font-semibold text-red-700">{planError}</p>}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!createNextListeningImportPlanRange(planRanges)}
                onClick={addPlanRange}
              >
                Add question range
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!!planError}
                onClick={() => void copyText(buildListeningAiPromptTemplate(planRanges), "AI prompt and JSON structure")}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <IconCopy size={14} /> Copy AI prompt + JSON structure
              </Button>
            </div>
            <p className="text-xs text-slate-600">
              Paste the copied prompt into your AI tool, add original or authorized listening material, then paste the generated JSON below.
            </p>
          </section>

          <label htmlFor="listening-json-input" className="block text-sm font-bold text-slate-800">
            Step 2: Paste the AI-generated JSON here
          </label>
          <p className="text-xs text-slate-600">
            If the JSON has no section number, it uses the currently selected Section {activeSection}. Explicit question numbers are kept as written.
          </p>
          <textarea
            id="listening-json-input"
            value={jsonText}
            onChange={(event) => onJsonTextChange(event.target.value)}
            spellCheck={false}
            aria-label="Listening exam JSON"
            placeholder={'{\n  "sections": [\n    {\n      "sectionNumber": 1,\n      "groups": []\n    }\n  ]\n}'}
            className="h-72 w-full rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-xs text-gray-900 outline-none focus:border-blue-500"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(event) => setReplaceExisting(event.target.checked)}
                className="size-4 accent-[#1B3A6B]"
              />
              Replace question groups in imported sections
            </label>
          </div>

          {result && result.errors.length > 0 && (
            <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <p className="mb-1 flex items-center gap-1.5 font-bold"><IconAlertCircle size={16} /> Fix these JSON issues before importing</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {result.errors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}
              </ul>
            </div>
          )}

          {result && result.errors.length === 0 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
              <p className="flex items-center gap-1.5">
                <IconCircleCheck size={16} />
                Ready: {result.sections.length} section(s), {result.sections.reduce((total, section) =>
                  total + section.questionGroups.reduce((groupTotal, group) => groupTotal + group.questions.length, 0), 0)} question(s)
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" disabled={!canImport} onClick={handleImport} className="bg-[#1B3A6B] text-white hover:bg-[#152e54]">
              Import Listening JSON
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
