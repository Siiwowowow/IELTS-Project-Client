"use client";

import { IconPlus, IconTrash } from "@tabler/icons-react";

interface CueCardFields { topic: string; bullets: string[]; finalPrompt: string }

const text = (value: string) => value.replace(/<br\s*\/?>/gi, "\n").replace(/<(?:p|li|ul)[^>]*>/gi, "\n").replace(/<\/(?:p|li)>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").trim();
const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function parse(value: string): CueCardFields {
  const topic = value.match(/class="cue-topic"[^>]*>([\s\S]*?)<\/p>/i)?.[1];
  const finalPrompt = value.match(/class="cue-final"[^>]*>([\s\S]*?)<\/p>/i)?.[1];
  const list = value.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i)?.[1] || "";
  const bullets = [...list.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((match) => text(match[1]));
  if (topic || finalPrompt) return { topic: text(topic || ""), bullets: bullets.length ? bullets : [""], finalPrompt: text(finalPrompt || "") };
  const lines = text(value).split(/\n+/).map((line) => line.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
  const first = lines.find((line) => !/^you should say:?$/i.test(line)) || "";
  const prompts = lines.filter((line) => line !== first && !/^you should say:?$/i.test(line));
  const finalIndex = prompts.findIndex((line) => /^and explain/i.test(line));
  const final = finalIndex >= 0 ? prompts.splice(finalIndex, 1)[0] : "";
  return { topic: first, bullets: prompts.length ? prompts : [""], finalPrompt: final };
}

function compile(fields: CueCardFields) {
  return `<p class="cue-topic"><strong>${escape(fields.topic)}</strong></p><p class="cue-label"><strong>You should say:</strong></p><ul class="cue-points">${fields.bullets.map((item) => `<li>${escape(item.trim())}</li>`).join("")}</ul><p class="cue-final">${escape(fields.finalPrompt)}</p>`;
}

export function SpeakingCueCardBuilder({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const fields = parse(value);
  const update = (next: CueCardFields) => onChange(compile(next));

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 p-4">
        <label className="mb-1.5 block text-xs font-bold text-slate-600">Main cue-card topic</label>
        <textarea rows={2} value={fields.topic} onChange={(event) => update({ ...fields, topic: event.target.value })} placeholder="Describe a shop near where you live that you sometimes use." className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-rose-500" />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div><p className="text-sm font-bold">You should say:</p><p className="text-[11px] text-slate-500">Points appear with dots and indentation.</p></div>
          <button type="button" onClick={() => update({ ...fields, bullets: [...fields.bullets, ""] })} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-bold hover:bg-slate-50"><IconPlus size={14} /> Add point</button>
        </div>
        {fields.bullets.map((bullet, index) => (
          <div key={index} className="flex items-center gap-2 pl-3">
            <span className="text-lg text-slate-500">•</span>
            <input value={bullet} onChange={(event) => { const bullets = [...fields.bullets]; bullets[index] = event.target.value; update({ ...fields, bullets }); }} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-500" placeholder="what sorts of products or services it sells" />
            {fields.bullets.length > 1 && <button type="button" onClick={() => update({ ...fields, bullets: fields.bullets.filter((_, itemIndex) => itemIndex !== index) })} className="rounded p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><IconTrash size={15} /></button>}
          </div>
        ))}
        <div className="border-t border-slate-100 pt-3">
          <label className="mb-1.5 block text-xs font-bold text-slate-600">Final explanation prompt</label>
          <input value={fields.finalPrompt} onChange={(event) => update({ ...fields, finalPrompt: event.target.value })} placeholder="and explain why you use this shop." className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold outline-none focus:border-rose-500" />
        </div>
      </div>
    </div>
  );
}
