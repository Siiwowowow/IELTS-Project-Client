"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { IconCode, IconCopy, IconFileUpload } from "@tabler/icons-react";
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
  buildFullMockModuleAiPrompt,
  FULL_MOCK_JSON_SAMPLE,
  parseFullMockModuleJson,
  type FullMockJsonPayload,
  type FullMockModuleJsonKey,
  type FullMockModuleJsonPayload,
} from "@/lib/fullMockJson";

interface FullMockModuleJsonDialogProps {
  module: FullMockModuleJsonKey;
  jsonText: string;
  onJsonTextChange: (value: string) => void;
  onImport: (payload: FullMockModuleJsonPayload) => void;
}

export function FullMockModuleJsonDialog({
  module,
  jsonText,
  onJsonTextChange,
  onImport,
}: FullMockModuleJsonDialogProps) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isWriting = module === "writingExam";
  const moduleTitle = isWriting ? "Writing" : "Speaking";
  const result = useMemo(
    () => jsonText.trim() ? parseFullMockModuleJson(module, jsonText) : null,
    [module, jsonText],
  );
  const sample = useMemo(() => {
    const parsed = JSON.parse(FULL_MOCK_JSON_SAMPLE) as FullMockJsonPayload;
    return JSON.stringify(parsed[module], null, 2);
  }, [module]);

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
    if (!result?.data || result.errors.length > 0) return;
    onImport(result.data);
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2 border-violet-200 font-bold text-violet-800 hover:bg-violet-50"
      >
        <IconCode size={16} />
        {jsonText.trim() ? `Edit ${moduleTitle} JSON` : `Bulk import ${moduleTitle} JSON`}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bulk import {moduleTitle} questions</DialogTitle>
            <DialogDescription>
              This editor changes only the {moduleTitle} module. The other modules stay in the Full Mock builder, and publishing still creates one complete Full Mock Test.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => onJsonTextChange(sample)}>
              Load sample
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
              <IconFileUpload size={14} /> Upload .json
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => void copyText(buildFullMockModuleAiPrompt(module), `${moduleTitle} AI prompt`)}>
              <IconCopy size={14} /> Copy AI prompt + JSON structure
            </Button>
            <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={handleFile} />
          </div>

          <div className="space-y-2 rounded-lg border border-violet-200 bg-violet-50/60 p-3 text-xs leading-relaxed text-slate-700">
            <p className="font-bold text-violet-950">Formatting guide for instructions</p>
            <p><code>&lt;strong&gt;bold text&lt;/strong&gt;</code> bolds text; use <code>&lt;h2 style=&quot;text-align:center&quot;&gt;Title&lt;/h2&gt;</code> for a centered heading.</p>
            <p>Use separate <code>&lt;p&gt;</code> blocks for paragraph gaps. Use <code>&lt;ul&gt;&lt;li&gt;...&lt;/li&gt;&lt;/ul&gt;</code> for bullet dots; use plain text or paragraphs without -, *, or • when no dots are wanted.</p>
            <p>{isWriting
              ? "Writing JSON includes Task 1 and Task 2 instructions, word limits, model answers, and optional chart/PDF URLs."
              : "Speaking JSON includes all 3 parts. Keep the cue-card prompts in Part 2 instruction and its standard response placeholder in questions."}</p>
          </div>

          <textarea
            value={jsonText}
            onChange={(event) => onJsonTextChange(event.target.value)}
            rows={20}
            spellCheck={false}
            aria-label={`${moduleTitle} module JSON`}
            className="w-full rounded-lg border border-slate-300 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-emerald-100 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />

          {result && result.errors.length > 0 && (
            <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <p className="font-bold">Fix these JSON issues before importing:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {result.errors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              type="button"
              disabled={!result?.data || result.errors.length > 0}
              onClick={handleImport}
              className="bg-violet-700 text-white hover:bg-violet-800"
            >
              Import {moduleTitle} into Full Mock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
