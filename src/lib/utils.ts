import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseBoldText(text: string): React.ReactNode[] {
  if (!text) return [];
  const tokenPattern = /(\{color:#[0-9a-fA-F]{6}\}[\s\S]+?\{\/color\}|\*\*[\s\S]+?\*\*|__[\s\S]+?__|(?<!\*)\*(?!\*)[^*]+?\*(?!\*)|<b>[\s\S]+?<\/b>|<strong>[\s\S]+?<\/strong>|<u>[\s\S]+?<\/u>|<i>[\s\S]+?<\/i>|<em>[\s\S]+?<\/em>)/gi;
  const parts = text.split(tokenPattern);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return React.createElement(
        'strong',
        { key: index, className: 'font-extrabold' },
        parseBoldText(part.slice(2, -2))
      );
    }
    if ((part.toLowerCase().startsWith('<b>') && part.toLowerCase().endsWith('</b>')) ||
        (part.toLowerCase().startsWith('<strong>') && part.toLowerCase().endsWith('</strong>'))) {
      const inner = part.toLowerCase().startsWith('<b>') ? part.slice(3, -4) : part.slice(8, -9);
      return React.createElement(
        'strong',
        { key: index, className: 'font-extrabold' },
        parseBoldText(inner)
      );
    }
    if (part.startsWith('__') && part.endsWith('__')) {
      return React.createElement(
        'u',
        { key: index, className: 'underline underline-offset-2' },
        parseBoldText(part.slice(2, -2))
      );
    }
    if (part.toLowerCase().startsWith('<u>') && part.toLowerCase().endsWith('</u>')) {
      return React.createElement(
        'u',
        { key: index, className: 'underline underline-offset-2' },
        parseBoldText(part.slice(3, -4))
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return React.createElement(
        'em',
        { key: index, className: 'italic' },
        parseBoldText(part.slice(1, -1))
      );
    }
    if ((part.toLowerCase().startsWith('<i>') && part.toLowerCase().endsWith('</i>')) ||
        (part.toLowerCase().startsWith('<em>') && part.toLowerCase().endsWith('</em>'))) {
      const inner = part.toLowerCase().startsWith('<i>') ? part.slice(3, -4) : part.slice(4, -5);
      return React.createElement(
        'em',
        { key: index, className: 'italic' },
        parseBoldText(inner)
      );
    }
    const colorMatch = part.match(/^\{color:(#[0-9a-fA-F]{6})\}([\s\S]*?)\{\/color\}$/i);
    if (colorMatch) {
      return React.createElement(
        'span',
        { key: index, style: { color: colorMatch[1] } },
        parseBoldText(colorMatch[2])
      );
    }
    return part;
  });
}

export function getOptionLabel(opt: string): string {
  if (!opt) return "";
  // Extract Roman numerals (i, ii, iii, iv, v, vi, vii, viii, ix, x) or letters (A, B, C...) at the start
  const match = opt.trim().match(/^([ivxldcba0-9]+|[A-Z])(\s+|\.|\))/i);
  if (match) {
    return match[1].toUpperCase(); // Return the Roman numeral / letter prefix
  }
  return opt; // Fallback to full option text
}

export function formatPassageText(text: string): string {
  if (!text) return "";
  // Check if it already has common HTML tags
  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(text);
  if (hasHtml) {
    // Replace hard line breaks inside paragraphs with a space to merge fragmented text lines
    return text.replace(/<br\s*\/?>/gi, " ");
  }
  // Replace double newlines with paragraphs, and single newlines inside paragraphs with space
  return text
    .split(/\n\s*\n/)
    .map((para) => `<p>${para.trim().replace(/\n/g, " ").replace(/\s+/g, " ")}</p>`)
    .join("");
}

export function parseGroupInstruction(instruction?: string) {
  if (!instruction) {
    return { range: "", inst1: "", inst2: "", inst3: "", heading: "", listItems: [] as string[] };
  }
  if (instruction.includes("|||")) {
    const parts = instruction.split("|||");
    let inst3 = "";
    const listItems: string[] = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.startsWith("INST3:")) {
        inst3 = part.replace(/^INST3:\s*/, "");
      } else if (i >= 4) {
        listItems.push(part);
      }
    }

    return {
      range: parts[0]?.startsWith("INST3:") ? "" : (parts[0] || ""),
      inst1: parts[1]?.startsWith("INST3:") ? "" : (parts[1] || ""),
      inst2: parts[2]?.startsWith("INST3:") ? "" : (parts[2] || ""),
      inst3,
      heading: parts[3]?.startsWith("INST3:") ? "" : (parts[3] || ""),
      listItems: listItems.filter(Boolean),
    };
  }
  return { range: "", inst1: instruction, inst2: "", inst3: "", heading: "", listItems: [] as string[] };
}

export function areInstructionsCompatible(instA?: string, instB?: string): boolean {
  if (!instA || !instB) return true;
  const aTrim = instA.trim();
  const bTrim = instB.trim();
  if (aTrim === bTrim) return true;
  if (!aTrim || !bTrim) return true;

  const pA = parseGroupInstruction(aTrim);
  const pB = parseGroupInstruction(bTrim);

  // Compare core content (ignoring range)
  const coreA = [
    (pA.inst1 || "").trim(),
    (pA.inst2 || "").trim(),
    (pA.inst3 || "").trim(),
    (pA.heading || "").trim(),
    (pA.listItems || []).map((x) => x.trim()).join("|"),
  ].join("|||");

  const coreB = [
    (pB.inst1 || "").trim(),
    (pB.inst2 || "").trim(),
    (pB.inst3 || "").trim(),
    (pB.heading || "").trim(),
    (pB.listItems || []).map((x) => x.trim()).join("|"),
  ].join("|||");

  if (coreA === coreB) return true;
  if (!coreA || !coreB) return true;

  // Also check if primary instructions match (ignoring case and whitespace)
  if (
    pA.inst1 &&
    pB.inst1 &&
    pA.inst1.trim().toLowerCase() === pB.inst1.trim().toLowerCase()
  ) {
    return true;
  }

  return false;
}

export function canMergeQuestionGroups(
  prev?: {
    type: string;
    instruction?: string;
    passageSegment?: string;
    options?: string[];
    imageUrl?: string;
  },
  curr?: {
    type: string;
    instruction?: string;
    passageSegment?: string;
    options?: string[];
    imageUrl?: string;
  }
): boolean {
  if (!prev || !curr) return false;
  if (prev.type !== curr.type) return false;

  // Passage segments:
  // If both have non-empty passage segments and they are different, don't merge
  if (
    prev.passageSegment &&
    curr.passageSegment &&
    prev.passageSegment.trim() !== curr.passageSegment.trim()
  ) {
    return false;
  }

  // Options: for MATCHING types or SUMMARY types with options, if options differ, don't merge
  if (
    prev.options &&
    curr.options &&
    prev.options.length > 0 &&
    curr.options.length > 0 &&
    JSON.stringify(prev.options) !== JSON.stringify(curr.options)
  ) {
    return false;
  }

  // Image: if both have different images, don't merge
  if (
    prev.imageUrl &&
    curr.imageUrl &&
    prev.imageUrl.trim() !== curr.imageUrl.trim()
  ) {
    return false;
  }

  return areInstructionsCompatible(prev.instruction, curr.instruction);
}

export function mergeQuestionGroups<
  T extends {
    type: string;
    instruction?: string;
    passageSegment?: string;
    options?: string[];
    imageUrl?: string;
    order?: number;
    questions?: Q[];
  },
  Q extends { id?: string; questionNumber?: number } = { id?: string; questionNumber?: number }
>(groups: T[]): T[] {
  if (!groups || groups.length <= 1) return groups ?? [];
  const merged: T[] = [];

  for (const group of groups) {
    if (merged.length === 0) {
      merged.push({ ...group, questions: [...(group.questions ?? [])] });
      continue;
    }

    const last = merged[merged.length - 1];
    const canMerge = canMergeQuestionGroups(last, group);

    if (canMerge) {
      const combinedQuestions = [...(last.questions ?? []), ...(group.questions ?? [])];
      // Deduplicate questions by id or questionNumber if any duplicates
      const seen = new Set<string | number>();
      const dedupedQuestions = combinedQuestions.filter((q) => {
        const key = q.id || q.questionNumber;
        if (key !== undefined && key !== null) {
          if (seen.has(key)) return false;
          seen.add(key);
        }
        return true;
      });
      dedupedQuestions.sort((a, b) => (a.questionNumber ?? 0) - (b.questionNumber ?? 0));

      const baseInstruction =
        last.instruction && last.instruction.trim().length >= (group.instruction?.trim().length || 0)
          ? last.instruction
          : group.instruction || last.instruction || "";

      const parsed = parseGroupInstruction(baseInstruction);
      const qStart = dedupedQuestions[0]?.questionNumber;
      const qEnd = dedupedQuestions[dedupedQuestions.length - 1]?.questionNumber;
      const autoRange =
        qStart !== undefined && qEnd !== undefined
          ? qStart === qEnd
            ? `Question ${qStart}`
            : `Questions ${qStart}–${qEnd}`
          : "";

      const inst3Part = parsed.inst3 ? `|||INST3:${parsed.inst3}` : "";
      const listPart = parsed.listItems.length > 0 ? "|||" + parsed.listItems.join("|||") : "";
      const updatedInstruction = autoRange
        ? `${autoRange}|||${parsed.inst1}|||${parsed.inst2}|||${parsed.heading}${inst3Part}${listPart}`
        : baseInstruction;

      last.questions = dedupedQuestions as Q[];
      last.instruction = updatedInstruction;
      if (!last.options || last.options.length === 0) {
        last.options = group.options;
      }
      if (!last.passageSegment) {
        last.passageSegment = group.passageSegment;
      }
      if (!last.imageUrl) {
        last.imageUrl = group.imageUrl;
      }
    } else {
      merged.push({ ...group, questions: [...(group.questions ?? [])] as Q[] });
    }
  }

  // Final pass: ensure all groups have correct auto-range if they have questions
  return merged.map((g, idx): T => {
    if (g.questions && g.questions.length > 0) {
      const qStart = g.questions[0]?.questionNumber;
      const qEnd = g.questions[g.questions.length - 1]?.questionNumber;
      const autoRange =
        qStart !== undefined && qEnd !== undefined
          ? qStart === qEnd
            ? `Question ${qStart}`
            : `Questions ${qStart}–${qEnd}`
          : "";
      if (autoRange && g.instruction) {
        const parsed = parseGroupInstruction(g.instruction);
        if (
          !parsed.range ||
          (g.questions.length > 1 && /^Question\s+\d+$/i.test(parsed.range.trim()))
        ) {
          const inst3Part = parsed.inst3 ? `|||INST3:${parsed.inst3}` : "";
          const listPart = parsed.listItems.length > 0 ? "|||" + parsed.listItems.join("|||") : "";
          g.instruction = `${autoRange}|||${parsed.inst1}|||${parsed.inst2}|||${parsed.heading}${inst3Part}${listPart}`;
        }
      }
    }
    return { ...g, order: idx + 1 };
  });
}
