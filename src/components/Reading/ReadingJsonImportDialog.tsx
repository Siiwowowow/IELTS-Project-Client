'use client'

import React, { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { IconCode, IconCopy, IconFileUpload, IconAlertCircle, IconCircleCheck } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  buildReadingAiPromptTemplate,
  createNextReadingImportPlanRange,
  parseReadingImportJson,
  READING_IMPORT_SAMPLE,
  type ReadingImportPlanRange,
  type ReadingImportResult,
  type ReadingTypeDef,
} from '@/lib/readingJsonImport'

interface ReadingJsonImportDialogProps {
  activePassage: 1 | 2 | 3
  nextQuestionNumber: number
  typeCatalog: ReadingTypeDef[]
  defaultInstructions: Record<string, string>
  jsonText: string
  onJsonTextChange: (value: string) => void
  onImport: (result: ReadingImportResult, opts: { replaceExisting: boolean }) => void
}

export function ReadingJsonImportDialog({
  activePassage,
  nextQuestionNumber,
  typeCatalog,
  defaultInstructions,
  jsonText,
  onJsonTextChange,
  onImport,
}: ReadingJsonImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [replaceExisting, setReplaceExisting] = useState(false)
  const [planRanges, setPlanRanges] = useState<ReadingImportPlanRange[]>([
    { passageNumber: 1, from: 1, to: 5, typeCode: '' },
  ])
  const [rangeDrafts, setRangeDrafts] = useState<Array<{ from?: string; to?: string }>>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const result = useMemo(() => {
    if (!jsonText.trim()) return null
    return parseReadingImportJson(jsonText, {
      fallbackPassage: activePassage,
      nextNumber: nextQuestionNumber,
      typeCatalog,
      defaultInstructions,
    })
  }, [jsonText, activePassage, nextQuestionNumber, typeCatalog, defaultInstructions])

  const canImport = !!result && result.errors.length === 0 &&
    (result.questions.length > 0 || Object.keys(result.passages).length > 0)

  const planError = useMemo(() => {
    const ordered = planRanges.slice().sort((a, b) => a.from - b.from)
    let expectedNumber = 1

    for (const range of ordered) {
      if (!Number.isInteger(range.from) || !Number.isInteger(range.to) ||
        range.from < 1 || range.to > 40 || range.from > range.to) {
        return 'Each question range must be between 1 and 40, with the start before the end.'
      }
      if (!range.typeCode) return `Select a question type for Q${range.from}–Q${range.to}.`
      if (range.from !== expectedNumber) {
        return range.from < expectedNumber
          ? `Question ranges overlap at Q${range.from}.`
          : `Question ranges must be continuous; Q${expectedNumber} is missing.`
      }
      if (range.typeCode === 'R-MMCQ' && ![2, 3].includes(range.to - range.from + 1)) {
        return 'Choose 2 or 3 question numbers for a “Choose TWO/THREE” group.'
      }
      expectedNumber = range.to + 1
    }

    return expectedNumber === 41 ? '' : `Add a question type for Q${expectedNumber}–Q40.`
  }, [planRanges])

  const updatePlanRange = (index: number, patch: Partial<ReadingImportPlanRange>) => {
    setPlanRanges((current) => current.map((range, rangeIndex) =>
      rangeIndex === index ? { ...range, ...patch } : range
    ))
  }

  const updateRangeDraft = (index: number, field: 'from' | 'to', value: string) => {
    if (!/^\d*$/.test(value)) return
    setRangeDrafts((current) => {
      const next = current.slice()
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const commitRangeDraft = (index: number, field: 'from' | 'to') => {
    const range = planRanges[index]
    if (!range) return

    const rawValue = rangeDrafts[index]?.[field]
    if (rawValue === undefined) return

    const value = Number(rawValue)
    if (!rawValue || !Number.isInteger(value) || value < 1 || value > 40) {
      setRangeDrafts((current) => {
        const next = current.slice()
        next[index] = { ...next[index], [field]: String(range[field]) }
        return next
      })
      return
    }

    updatePlanRange(index, { [field]: value })
    setRangeDrafts((current) => {
      const next = current.slice()
      next[index] = { ...next[index], [field]: String(value) }
      return next
    })
  }

  const addPlanRange = () => {
    const nextRange = createNextReadingImportPlanRange(planRanges)
    if (!nextRange) {
      toast.error('All 40 question numbers are already assigned.')
      return
    }

    setPlanRanges((current) => [...current, nextRange])
    setRangeDrafts([])
  }

  const removePlanRange = (index: number) => {
    setRangeDrafts([])
    setPlanRanges((current) =>
      current.length <= 1 ? current : current.filter((_, rangeIndex) => rangeIndex !== index)
    )
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onJsonTextChange(await file.text())
    e.target.value = ''
  }

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied`)
    } catch {
      toast.error('Clipboard not available')
    }
  }

  const handleImport = () => {
    if (!result || !canImport) return
    onImport(result, { replaceExisting })
    setOpen(false)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-11 gap-2 border-indigo-200 font-bold text-indigo-700 hover:bg-indigo-50"
      >
        <IconCode size={16} /> {jsonText.trim() ? 'Edit Bulk JSON' : 'Bulk Import (JSON)'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bulk import Reading questions</DialogTitle>
            <DialogDescription>
              Paste JSON for one passage (defaults to Passage {activePassage}) or a full test using{' '}
              <code>{'"passages": [...]'}</code>. The JSON is saved with your local draft, so you can reopen and edit it later.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => onJsonTextChange(READING_IMPORT_SAMPLE)}>
              Load sample
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
              <IconFileUpload size={14} /> Upload .json
            </Button>
            <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={handleFile} />
          </div>

          <section className="space-y-3 rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
            <div>
              <h3 className="text-sm font-bold text-indigo-950">Step 1: Plan question types for Q1–Q40</h3>
              <p className="mt-1 text-xs text-indigo-900/80">
                Starts with editable Q1–5. Add creates the next range of up to five questions without changing earlier ranges, using the passage from the previous range. Remove deletes only that row; other question numbers stay unchanged.
              </p>
            </div>

            <div className="space-y-2">
              {planRanges.map((range, index) => (
                <div key={`${range.from}-${range.to}-${index}`} className="grid gap-2 rounded-md border border-indigo-100 bg-white p-2 sm:grid-cols-[minmax(120px,1fr)_90px_90px_minmax(180px,2fr)_auto] sm:items-end">
                  <label className="text-xs font-semibold text-slate-700">
                    Passage
                    <select
                      value={range.passageNumber}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        if (value === 1 || value === 2 || value === 3) {
                          updatePlanRange(index, { passageNumber: value })
                        }
                      }}
                      className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
                    >
                      <option value={1}>Passage 1</option>
                      <option value={2}>Passage 2</option>
                      <option value={3}>Passage 3</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    From Q
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={rangeDrafts[index]?.from ?? String(range.from)}
                      onChange={(event) => updateRangeDraft(index, 'from', event.target.value)}
                      onBlur={() => commitRangeDraft(index, 'from')}
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
                      onChange={(event) => updateRangeDraft(index, 'to', event.target.value)}
                      onBlur={() => commitRangeDraft(index, 'to')}
                      className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Question type
                    <select
                      value={range.typeCode}
                      onChange={(event) => updatePlanRange(index, { typeCode: event.target.value })}
                      className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
                    >
                      <option value="">Select a question type</option>
                      {typeCatalog.map((type, index) => (
                        <option key={`${type.code}-${index}`} value={type.code}>{type.title}</option>
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
                disabled={!createNextReadingImportPlanRange(planRanges)}
                onClick={addPlanRange}
              >
                Add question range
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!!planError}
                onClick={() => copy(buildReadingAiPromptTemplate(planRanges, typeCatalog), 'AI prompt and JSON template')}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <IconCopy size={14} /> Copy AI prompt + JSON structure
              </Button>
            </div>
            <p className="text-xs text-slate-600">
              Paste the copied prompt into your AI tool, add your passage, questions, options, and answer key under “SOURCE MATERIAL”, then paste the AI’s JSON below.
            </p>
          </section>

          <label htmlFor="reading-json-input" className="block text-sm font-bold text-slate-800">
            Step 2: Paste the AI-generated JSON here
          </label>
          <p className="text-xs text-slate-600">
            Imported JSON stays here when you close the dialog. Edit it and import again to update matching question numbers.
            To remove or renumber questions, use “Replace existing questions” for the affected passage(s); that replaces all their questions with the JSON you import.
          </p>
          <textarea
            id="reading-json-input"
            value={jsonText}
            onChange={(e) => onJsonTextChange(e.target.value)}
            spellCheck={false}
            placeholder='{ "groups": [ { "type": "TFNG", "questions": [ { "number": 1, "text": "...", "answer": "TRUE" } ] } ] }'
            className="h-72 w-full rounded-lg border border-gray-300 bg-slate-50 p-3 font-mono text-xs text-gray-900 outline-none focus:border-indigo-500"
          />

          {result && (
            <div className="space-y-3 text-sm">
              {result.errors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                  <p className="mb-1 flex items-center gap-1.5 font-bold"><IconAlertCircle size={16} /> Fix these before importing</p>
                  <ul className="list-disc space-y-0.5 pl-5 text-xs">
                    {result.errors.slice(0, 15).map((err, i) => <li key={i}>{err}</li>)}
                    {result.errors.length > 15 && <li>…and {result.errors.length - 15} more</li>}
                  </ul>
                </div>
              )}

              {result.groups.length > 0 && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
                  <p className="mb-1 flex items-center gap-1.5 font-bold">
                    <IconCircleCheck size={16} /> {result.questions.length} questions in {result.groups.length} groups
                  </p>
                  <ul className="space-y-0.5 text-xs">
                    {result.groups.map((g, i) => (
                      <li key={i}>
                        Passage {g.passageIndex} · Q{g.from}{g.to !== g.from ? `–${g.to}` : ''} · {g.title}
                      </li>
                    ))}
                  </ul>
                  {Object.keys(result.passages).length > 0 && (
                    <p className="mt-1 text-xs">Passage text will be updated for: {Object.keys(result.passages).map((p) => `Passage ${p}`).join(', ')}</p>
                  )}
                </div>
              )}

              {result.warnings.length > 0 && (
                <ul className="list-disc rounded-lg border border-amber-200 bg-amber-50 p-3 pl-7 text-xs text-amber-800">
                  {result.warnings.slice(0, 8).map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              )}
            </div>
          )}

          <DialogFooter className="items-center gap-3 sm:justify-between">
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <input type="checkbox" checked={replaceExisting} onChange={(e) => setReplaceExisting(e.target.checked)} />
                Replace existing questions in the imported passage(s)
              </label>
              {replaceExisting && (
                <p className="text-xs font-medium text-amber-700">
                  Warning: all existing questions in the selected passage(s) will be removed before importing.
                </p>
              )}
            </div>
            <Button type="button" disabled={!canImport} onClick={handleImport} className="bg-indigo-600 font-bold text-white hover:bg-indigo-700">
              {jsonText.trim() ? 'Import / update questions' : 'Import questions'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
