/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/readingJsonImport.ts
//
// Converts a simple, teacher-friendly JSON document into the flat
// `QuestionItem[]` list used by the Reading creator (teacher/dashboard).
// One JSON paste can create every question group of a passage (or of the
// whole test) at once instead of adding questions one by one.

export interface ImportedQuestionItem {
  id: string;
  passageIndex: number;
  type: string;
  typeCode: string;
  questionNumber: number;
  text: string;
  instruction: string;
  correctAnswer: string;
  explanation?: string;
  options?: string[];
  groupOptions?: string[];
  passageSegment?: string;
  groupImageUrl?: string;
}

export interface ImportedPassageFields {
  title?: string;
  subtitle?: string;
  body?: string;
  instruction?: string;
}

export interface ImportGroupSummary {
  passageIndex: number;
  typeCode: string;
  title: string;
  from: number;
  to: number;
  count: number;
}

export interface ReadingImportResult {
  questions: ImportedQuestionItem[];
  passages: Partial<Record<1 | 2 | 3, ImportedPassageFields>>;
  groups: ImportGroupSummary[];
  errors: string[];
  warnings: string[];
}

export interface ReadingTypeDef {
  code: string;
  title: string;
  type: string;
}

// Friendly aliases → internal creator codes (R-*)
const TYPE_ALIASES: Record<string, string> = {
  MCQ: "R-MCQ", MULTIPLE_CHOICE: "R-MCQ",
  MMCQ: "R-MMCQ", MULTIPLE_CHOICE_MULTIPLE: "R-MMCQ", CHOOSE_TWO: "R-MMCQ", CHOOSE_THREE: "R-MMCQ",
  TFNG: "R-TFN", TFN: "R-TFN", TRUE_FALSE_NOT_GIVEN: "R-TFN",
  YNNG: "R-YNN", YNN: "R-YNN", YES_NO_NOT_GIVEN: "R-YNN",
  HEADINGS: "R-MHDG", MHDG: "R-MHDG", MATCHING_HEADINGS: "R-MHDG", LIST_OF_HEADINGS: "R-MHDG",
  MATCHING_INFO: "R-MINF", MINF: "R-MINF", MATCHING_INFORMATION: "R-MINF",
  NAME_MATCHING: "R-NMATCH", NMATCH: "R-NMATCH",
  MATCHING_FEATURES: "R-MFT", MFT: "R-MFT", FEATURES: "R-MFT",
  SENTENCE_ENDINGS: "R-MSE", MSE: "R-MSE", MATCHING_SENTENCE_ENDINGS: "R-MSE",
  SENTENCE_COMPLETION: "R-SCOMP", SCOMP: "R-SCOMP",
  SUMMARY_WITH_OPTIONS: "R-SCO", SCO: "R-SCO", SUMMARY_COMPLETION_WITH_OPTIONS: "R-SCO",
  SUMMARY: "R-SCWO", SCWO: "R-SCWO", SUMMARY_COMPLETION: "R-SCWO", SUMMARY_COMPLETION_WITHOUT_OPTIONS: "R-SCWO",
  NOTES: "R-NCOMP", NCOMP: "R-NCOMP", NOTES_COMPLETION: "R-NCOMP",
  TABLE: "R-TABLE", TABLE_COMPLETION: "R-TABLE",
  FLOW: "R-FLOW", FLOW_CHART: "R-FLOW", FLOW_CHART_COMPLETION: "R-FLOW",
  DIAGRAM: "R-DIAG", DIAG: "R-DIAG", DIAGRAM_LABELLING: "R-DIAG",
  SHORT_ANSWER: "R-SAQ", SAQ: "R-SAQ",
};

const NUMBER_WORDS: Record<number, string> = { 1: "ONE", 2: "TWO", 3: "THREE", 4: "FOUR", 5: "FIVE" };

function resolveTypeCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const key = raw.trim().toUpperCase().replace(/[\s/-]+/g, "_");
  if (key.startsWith("R_")) return `R-${key.slice(2)}`;
  return TYPE_ALIASES[key] ?? null;
}

function toRoman(value: number): string {
  const numerals: Array<[number, string]> = [
    [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"],
  ];
  let remaining = value;
  let out = "";
  for (const [amount, numeral] of numerals) {
    while (remaining >= amount) { out += numeral; remaining -= amount; }
  }
  return out;
}

const LETTER_PREFIX = /^([A-Z])(\s+|\.|\))/;
const ROMAN_PREFIX = /^([ivxlcdm]+)(\s+|\.|\))/i;

function prefixLetters(options: string[]): string[] {
  return options.map((opt, i) =>
    LETTER_PREFIX.test(opt) ? opt : `${String.fromCharCode(65 + i)}  ${opt}`
  );
}

function prefixRoman(options: string[]): string[] {
  return options.map((opt, i) => (ROMAN_PREFIX.test(opt) ? opt : `${toRoman(i + 1)}  ${opt}`));
}

function stripLetterPrefix(opt: string): string {
  return opt.replace(/^[A-G](\.|\))\s*/, "").trim();
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v ?? "").trim()).filter(Boolean);
  if (typeof value === "string") return value.split("\n").map((v) => v.trim()).filter(Boolean);
  return [];
}

/** "B" / "iv" / exact option text → the full option string stored by the creator. */
function resolveOption(answer: string, options: string[]): string | null {
  const a = answer.trim();
  if (!a) return null;
  const exact = options.find((o) => o.trim().toLowerCase() === a.toLowerCase());
  if (exact) return exact;
  const byLabel = options.find((o) => {
    const m = o.trim().match(/^([ivxlcdm]+|[A-Z])(\s+|\.|\))/i);
    return m ? m[1].toLowerCase() === a.toLowerCase() : false;
  });
  if (byLabel) return byLabel;
  if (/^[A-Z]$/i.test(a)) {
    const idx = a.toUpperCase().charCodeAt(0) - 65;
    if (options[idx]) return options[idx];
  }
  return null;
}

function answerToString(value: unknown): string {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean).join(" / ");
  return value === undefined || value === null ? "" : String(value).trim();
}

function placeholderNumbers(content: string): number[] {
  const nums = Array.from(content.matchAll(/\[\s*(\d+)\s*\]/g)).map((m) => Number(m[1]));
  return Array.from(new Set(nums)).sort((a, b) => a - b);
}

function tableToMarkdown(rows: unknown): string {
  if (!Array.isArray(rows) || rows.length === 0) return "";
  const grid = rows.map((r) => (Array.isArray(r) ? r.map((c) => String(c ?? "").trim()) : [String(r)]));
  const width = Math.max(...grid.map((r) => r.length));
  const line = (r: string[]) => `| ${Array.from({ length: width }, (_, i) => r[i] || " ").join(" | ")} |`;
  return [line(grid[0]), `| ${Array.from({ length: width }, () => "---").join(" | ")} |`, ...grid.slice(1).map(line)].join("\n");
}

function buildInstruction(
  code: string,
  from: number,
  to: number,
  defaults: Record<string, string>,
  custom?: { instruction?: string; instruction2?: string }
): string {
  const range = from === to ? `Question ${from}` : `Questions ${from}–${to}`;
  const parts = (defaults[code] || "|||||||||").split("|||");
  while (parts.length < 4) parts.push("");
  parts[0] = range;
  if (custom?.instruction) parts[1] = custom.instruction;
  if (custom?.instruction2) parts[2] = custom.instruction2;
  return parts.join("|||");
}

let idCounter = 0;
function newId(): string {
  idCounter += 1;
  return `q-json-${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Parse the JSON text pasted by the teacher.
 * @param fallbackPassage passage used when the JSON does not specify one
 * @param nextNumber      first question number used when numbers are omitted
 */
export function parseReadingImportJson(
  rawText: string,
  opts: {
    fallbackPassage: 1 | 2 | 3;
    nextNumber: number;
    typeCatalog: ReadingTypeDef[];
    defaultInstructions: Record<string, string>;
  }
): ReadingImportResult {
  const result: ReadingImportResult = { questions: [], passages: {}, groups: [], errors: [], warnings: [] };

  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch (err: any) {
    result.errors.push(`Invalid JSON: ${err?.message ?? "could not parse"}`);
    return result;
  }

  // Accept: { passages: [...] } | { groups: [...] } | [ ...groups ]
  const passageBlocks: any[] = Array.isArray(data)
    ? [{ groups: data }]
    : Array.isArray(data?.passages)
    ? data.passages
    : [data];

  let runningNumber = opts.nextNumber;

  passageBlocks.forEach((block, blockIdx) => {
    const pNum = Number(block?.passageNumber ?? block?.passage?.number ?? (passageBlocks.length > 1 ? blockIdx + 1 : opts.fallbackPassage));
    if (![1, 2, 3].includes(pNum)) {
      result.errors.push(`Passage block ${blockIdx + 1}: passageNumber must be 1, 2 or 3.`);
      return;
    }
    const passageIndex = pNum as 1 | 2 | 3;

    const p = block?.passage ?? {};
    const fields: ImportedPassageFields = {};
    for (const key of ["title", "subtitle", "body", "instruction"] as const) {
      const val = p[key] ?? block[key];
      if (typeof val === "string" && val.trim()) fields[key] = val;
      if (key === "body" && Array.isArray(val)) fields.body = val.join("\n\n");
    }
    if (Object.keys(fields).length > 0) result.passages[passageIndex] = fields;

    const groups: any[] = Array.isArray(block?.groups) ? block.groups : [];
    if (groups.length === 0 && Object.keys(fields).length === 0) {
      result.warnings.push(`Passage ${passageIndex}: no "groups" found.`);
    }

    groups.forEach((group, gIdx) => {
      const label = `Passage ${passageIndex} › group ${gIdx + 1}`;
      const code = resolveTypeCode(group?.type);
      const typeDef = code ? opts.typeCatalog.find((t) => t.code === code) : undefined;
      if (!typeDef) {
        result.errors.push(`${label}: unknown type "${group?.type}".`);
        return;
      }
      const ctx: GroupCtx = {
        group, label, code: typeDef.code, typeDef, passageIndex,
        nextNumber: () => runningNumber,
        defaults: opts.defaultInstructions,
      };
      const created = buildGroup(ctx, result);
      if (created.length === 0) return;

      const nums = created.map((q) => q.questionNumber);
      runningNumber = Math.max(runningNumber, ...nums.map((n) => n + 1));
      result.questions.push(...created);
      result.groups.push({
        passageIndex,
        typeCode: typeDef.code,
        title: typeDef.title,
        from: Math.min(...nums),
        to: Math.max(...nums),
        count: created.length,
      });
    });
  });

  // Duplicate number check inside the import itself
  const seen = new Set<string>();
  for (const q of result.questions) {
    const key = `${q.passageIndex}-${q.questionNumber}`;
    if (seen.has(key)) result.errors.push(`Question ${q.questionNumber} appears twice in Passage ${q.passageIndex}.`);
    seen.add(key);
  }

  return result;
}

export function serializeReadingImportJson(
  questions: ImportedQuestionItem[],
  passages: Partial<Record<1 | 2 | 3, ImportedPassageFields>>
): string {
  const questionsByPassage = new Map<number, ImportedQuestionItem[]>();
  for (const question of questions) {
    const passageQuestions = questionsByPassage.get(question.passageIndex) ?? [];
    passageQuestions.push(question);
    questionsByPassage.set(question.passageIndex, passageQuestions);
  }

  const passageBlocks = ([1, 2, 3] as const)
    .map((passageNumber) => {
      const passage = passages[passageNumber] ?? {};
      const passageQuestions = (questionsByPassage.get(passageNumber) ?? [])
        .slice()
        .sort((a, b) => a.questionNumber - b.questionNumber);
      const hasPassageContent = Boolean(
        passage.title?.trim() || passage.subtitle?.trim() || passage.body?.trim()
      );
      if (passageQuestions.length === 0 && !hasPassageContent) return null;

      const groups = new Map<string, ImportedQuestionItem[]>();
      for (const question of passageQuestions) {
        const type = getSerializableQuestionType(question);
        const groupKey = JSON.stringify([
          type,
          question.instruction.split("|||").slice(1),
          question.passageSegment ?? "",
          question.groupOptions ?? [],
          question.groupImageUrl ?? "",
          question.options ?? [],
          type === "MULTIPLE_CHOICE_MULTIPLE" ? question.text : "",
        ]);
        const groupQuestions = groups.get(groupKey) ?? [];
        groupQuestions.push(question);
        groups.set(groupKey, groupQuestions);
      }

      return {
        passageNumber,
        passage: {
          title: passage.title || undefined,
          subtitle: passage.subtitle || undefined,
          body: passage.body || undefined,
          instruction: passage.instruction || undefined,
        },
        groups: Array.from(groups.values()).map(serializeQuestionGroup),
      };
    })
    .filter((passage): passage is NonNullable<typeof passage> => passage !== null);

  return passageBlocks.length > 0
    ? JSON.stringify({ passages: passageBlocks }, null, 2)
    : "";
}

function getSerializableQuestionType(question: ImportedQuestionItem): string {
  if (question.typeCode === "MATCHING_FEATURES" &&
    parseGroupMetadata(question.passageSegment).variant === "NAME_MATCHING") {
    return "NAME_MATCHING";
  }
  return question.typeCode;
}

function serializeQuestionGroup(questions: ImportedQuestionItem[]): Record<string, unknown> {
  const firstQuestion = questions[0];
  const type = getSerializableQuestionType(firstQuestion);
  const instructionParts = firstQuestion.instruction.split("|||");
  const group: Record<string, unknown> = {
    type,
    instruction: instructionParts[1] || undefined,
    instruction2: instructionParts[2] || undefined,
    imageUrl: firstQuestion.groupImageUrl || undefined,
  };
  const code = resolveTypeCode(type);

  if (code === "R-MMCQ") {
    const options = (firstQuestion.options ?? []).map(stripLetterPrefix);
    const answerParts = Array.from(new Set(
      questions.flatMap((question) => question.correctAnswer.split("/").map((answer) => answer.trim()))
    ));
    const answers = options.flatMap((option, index) => {
      const letter = String.fromCharCode(65 + index);
      const normalizedOption = stripLetterPrefix(option).toLowerCase();
      const isCorrect = answerParts.some((answer) =>
        answer.toUpperCase() === letter || stripLetterPrefix(answer).toLowerCase() === normalizedOption
      );
      return isCorrect ? [letter] : [];
    });

    return {
      ...group,
      startNumber: questions[0].questionNumber,
      text: firstQuestion.text,
      options,
      answers,
      explanation: firstQuestion.explanation || undefined,
      questions: questions.map((question) => ({
        number: question.questionNumber,
        text: question.text,
        explanation: question.explanation || undefined,
      })),
    };
  }

  if (["R-SCWO", "R-SCO", "R-NCOMP", "R-TABLE"].includes(code ?? "")) {
    group.content = firstQuestion.passageSegment || "";
    group.answers = Object.fromEntries(questions.map((question) => [
      String(question.questionNumber),
      question.correctAnswer,
    ]));
    group.explanations = Object.fromEntries(questions.map((question) => [
      String(question.questionNumber),
      question.explanation || "",
    ]));
    if (code === "R-SCO") group.options = firstQuestion.groupOptions ?? [];
    return group;
  }

  if (code === "R-MHDG") {
    group.headings = firstQuestion.groupOptions ?? [];
    const metadata = parseGroupMetadata(firstQuestion.passageSegment);
    group.mode = metadata.mode === "WITHOUT_CLUES" ? "WITHOUT_CLUES" : "WITH_CLUES";
    if (typeof metadata.introText === "string") group.introText = metadata.introText;
    if (typeof metadata.exampleParagraph === "string" || typeof metadata.exampleAnswer === "string") {
      group.example = {
        paragraph: typeof metadata.exampleParagraph === "string" ? metadata.exampleParagraph : "",
        answer: typeof metadata.exampleAnswer === "string" ? metadata.exampleAnswer : "",
      };
    }
  } else if (["R-MINF", "R-NMATCH", "R-MFT", "R-MSE", "R-SCOMP"].includes(code ?? "")) {
    if (firstQuestion.groupOptions?.length) group.options = firstQuestion.groupOptions;
  }

  group.questions = questions.map((question) => ({
    number: question.questionNumber,
    text: question.text,
    answer: question.correctAnswer,
    explanation: question.explanation || undefined,
    options: code === "R-MCQ" ? question.options : undefined,
  }));
  return group;
}

function parseGroupMetadata(value?: string): Record<string, unknown> {
  if (!value) return {};
  try {
    const metadata: unknown = JSON.parse(value);
    return metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? metadata as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

interface GroupCtx {
  group: any;
  label: string;
  code: string;
  typeDef: ReadingTypeDef;
  passageIndex: number;
  nextNumber: () => number;
  defaults: Record<string, string>;
}

function buildGroup(ctx: GroupCtx, result: ReadingImportResult): ImportedQuestionItem[] {
  const { group, label, code, typeDef, passageIndex } = ctx;
  const custom = { instruction: group.instruction, instruction2: group.instruction2 };
  const imageUrl: string | undefined = group.imageUrl || undefined;

  const base = (num: number, extra: Partial<ImportedQuestionItem>): ImportedQuestionItem => ({
    id: newId(),
    passageIndex,
    type: typeDef.title,
    typeCode: typeDef.type,
    questionNumber: num,
    text: "",
    instruction: "",
    correctAnswer: "",
    groupImageUrl: imageUrl,
    ...extra,
  });

  // ── Multiple choice, choose TWO/THREE ──────────────────────────────
  if (code === "R-MMCQ") {
    const options = asStringList(group.options).map(stripLetterPrefix);
    const letters = asStringList(group.answers ?? group.answer).map((a) => a.toUpperCase());
    if (options.length < 3) { result.errors.push(`${label}: needs at least 3 "options".`); return []; }
    if (letters.length < 2 || letters.length > 3) { result.errors.push(`${label}: "answers" must list 2 or 3 letters, e.g. ["B","D"].`); return []; }
    const bad = letters.find((l) => !/^[A-Z]$/.test(l) || !options[l.charCodeAt(0) - 65]);
    if (bad) { result.errors.push(`${label}: answer "${bad}" does not match any option.`); return []; }
    const start = Number(group.startNumber ?? group.number ?? ctx.nextNumber());
    const count = letters.length;
    const rawQuestions: any[] = Array.isArray(group.questions) ? group.questions : [];
    if (rawQuestions.length > 0 && rawQuestions.length !== count) {
      result.errors.push(`${label}: "questions" must contain one entry for each answer.`);
      return [];
    }
    const questionNumbers = rawQuestions.length > 0
      ? rawQuestions.map((question, index) => Number(question?.number ?? start + index))
      : Array.from({ length: count }, (_, index) => start + index);
    if (questionNumbers.some((number) => !Number.isInteger(number) || number < 1 || number > 40) ||
      new Set(questionNumbers).size !== questionNumbers.length) {
      result.errors.push(`${label}: question numbers must be unique whole numbers from 1 to 40.`);
      return [];
    }
    const lastLetter = String.fromCharCode(64 + Math.max(options.length, count + 2, 5));
    const instruction =
      `Questions ${questionNumbers[0]}–${questionNumbers[questionNumbers.length - 1]}|||` +
      `${group.instruction || `Choose ${NUMBER_WORDS[count] ?? count} letters, A–${lastLetter}.`}|||` +
      `${group.instruction2 || `Write your answers in boxes ${questionNumbers[0]}–${questionNumbers[questionNumbers.length - 1]} on your answer sheet.`}|||`;
    const texts = letters.map((l) => options[l.charCodeAt(0) - 65]);
    const key = Array.from(new Set([...letters, ...texts])).join(" / ");
    return Array.from({ length: count }, (_, i) =>
      base(questionNumbers[i], {
        text: String(rawQuestions[i]?.text ?? group.text ?? group.question ?? ""),
        instruction,
        correctAnswer: key,
        explanation: rawQuestions[i]?.explanation || group.explanation || "",
        options,
      })
    );
  }

  // ── Placeholder based: summary / notes / table ─────────────────────
  if (["R-SCWO", "R-SCO", "R-NCOMP", "R-TABLE"].includes(code)) {
    let content = "";
    if (code === "R-TABLE" && Array.isArray(group.table)) content = tableToMarkdown(group.table);
    else if (Array.isArray(group.content)) content = group.content.join("\n");
    else content = String(group.content ?? group.text ?? "");
    if (!content.trim()) { result.errors.push(`${label}: "content" is required (use [14] style blanks).`); return []; }

    const nums = placeholderNumbers(content);
    if (nums.length === 0) { result.errors.push(`${label}: no blanks found. Write blanks as [14], [15] …`); return []; }

    let groupOptions: string[] | undefined;
    if (code === "R-SCO") {
      groupOptions = prefixLetters(asStringList(group.options));
      if (groupOptions.length < 2) { result.errors.push(`${label}: "options" (word list) is required.`); return []; }
    }

    const answers = normaliseAnswerMap(group.answers);
    const instruction = buildInstruction(code, nums[0], nums[nums.length - 1], ctx.defaults, custom);
    const items: ImportedQuestionItem[] = [];
    for (const num of nums) {
      let ans = answers[num] ?? "";
      if (!ans) result.errors.push(`${label}: missing answer for Question ${num}.`);
      if (groupOptions && ans) {
        const resolved = resolveOption(ans, groupOptions);
        if (!resolved) result.errors.push(`${label}: answer "${ans}" (Q${num}) is not in the options list.`);
        ans = resolved ?? ans;
      }
      items.push(base(num, {
        instruction,
        correctAnswer: ans,
        passageSegment: content,
        groupOptions,
        explanation: normaliseAnswerMap(group.explanations)[num] || "",
      }));
    }
    return items;
  }

  // ── Per-question types ─────────────────────────────────────────────
  const rawQs: any[] = Array.isArray(group.questions) ? group.questions : [];
  if (rawQs.length === 0) { result.errors.push(`${label}: "questions" array is empty.`); return []; }

  let groupOptions: string[] | undefined;
  let passageSegment: string | undefined;

  if (code === "R-MHDG") {
    groupOptions = prefixRoman(asStringList(group.headings ?? group.options));
    if (groupOptions.length < 2) { result.errors.push(`${label}: "headings" list is required.`); return []; }
    const example = group.example ?? {};
    const exampleAnswer = example.answer ? resolveOption(String(example.answer), groupOptions) ?? "" : "";
    passageSegment = JSON.stringify({
      mode: group.mode === "WITHOUT_CLUES" ? "WITHOUT_CLUES" : "WITH_CLUES",
      introText: group.introText || "",
      exampleParagraph: example.paragraph || "",
      exampleAnswer,
    });
  } else if (code === "R-MINF") {
    const opts = asStringList(group.options ?? group.paragraphs);
    groupOptions = opts.length > 0 ? opts : ["A", "B", "C", "D", "E", "F", "G"];
  } else if (["R-NMATCH", "R-MFT", "R-MSE"].includes(code)) {
    groupOptions = prefixLetters(asStringList(group.options));
    if (groupOptions.length < 2) { result.errors.push(`${label}: "options" list is required.`); return []; }
    if (code === "R-NMATCH") passageSegment = JSON.stringify({ variant: "NAME_MATCHING" });
  } else if (code === "R-SCOMP" && group.options) {
    groupOptions = prefixLetters(asStringList(group.options));
  }

  const numbered = rawQs.map((q, i) => ({ q, num: Number(q?.number ?? group.startNumber + i) }));
  let cursor = ctx.nextNumber();
  for (const item of numbered) {
    if (!Number.isFinite(item.num) || item.num <= 0) item.num = cursor;
    cursor = item.num + 1;
  }
  const nums = numbered.map((n) => n.num);
  const instruction = buildInstruction(code, Math.min(...nums), Math.max(...nums), ctx.defaults, custom);

  return numbered.map(({ q, num }) => {
    const qLabel = `${label} › Q${num}`;
    const text = String(q?.text ?? q?.question ?? "");
    let answer = answerToString(q?.answer);
    let options: string[] | undefined;

    if (!answer) result.errors.push(`${qLabel}: "answer" is missing.`);

    if (code === "R-MCQ") {
      options = asStringList(q?.options).map(stripLetterPrefix);
      if (options.length < 2) result.errors.push(`${qLabel}: MCQ needs "options".`);
      const resolved = resolveOption(answer, options);
      if (!resolved && answer) result.errors.push(`${qLabel}: answer "${answer}" does not match an option.`);
      answer = resolved ?? answer;
    } else if (code === "R-TFN" || code === "R-YNN") {
      const up = answer.toUpperCase().replace(/_/g, " ");
      const map: Record<string, string> = { T: "TRUE", F: "FALSE", Y: "YES", N: "NO", NG: "NOT GIVEN" };
      answer = map[up] ?? up;
      const allowed = code === "R-TFN" ? ["TRUE", "FALSE", "NOT GIVEN"] : ["YES", "NO", "NOT GIVEN"];
      if (answer && !allowed.includes(answer)) result.errors.push(`${qLabel}: answer must be ${allowed.join(" / ")}.`);
    } else if (groupOptions && code !== "R-MINF") {
      const resolved = resolveOption(answer, groupOptions);
      if (!resolved && answer) result.errors.push(`${qLabel}: answer "${answer}" is not in the options list.`);
      answer = resolved ?? answer;
    } else if (code === "R-MINF" && groupOptions) {
      answer = resolveOption(answer, groupOptions) ?? answer.toUpperCase();
    }

    if (!text.trim() && !["R-DIAG"].includes(code)) {
      result.warnings.push(`${qLabel}: question text is empty.`);
    }

    return base(num, {
      text,
      instruction,
      correctAnswer: answer,
      explanation: q?.explanation || "",
      options: options && options.length > 0 ? options : undefined,
      groupOptions,
      passageSegment,
    });
  });
}

function normaliseAnswerMap(value: unknown): Record<number, string> {
  const map: Record<number, string> = {};
  if (Array.isArray(value)) {
    value.forEach((item: any) => {
      if (item && typeof item === "object" && "number" in item) map[Number(item.number)] = answerToString(item.answer);
    });
  } else if (value && typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([k, v]) => { map[Number(k)] = answerToString(v); });
  }
  return map;
}

export interface ReadingImportPlanRange {
  passageNumber: 1 | 2 | 3;
  from: number;
  to: number;
  typeCode: string;
}

export function createNextReadingImportPlanRange(
  ranges: ReadingImportPlanRange[]
): ReadingImportPlanRange | null {
  if (ranges.length === 0) return null;

  const lastRange = ranges.reduce((last, range) => range.to > last.to ? range : last);
  if (lastRange.to >= 40) return null;

  const from = lastRange.to + 1;
  return {
    passageNumber: lastRange.passageNumber,
    from,
    to: Math.min(from + 4, 40),
    typeCode: "",
  };
}

function buildQuestionTemplate(typeCode: string, number: number): Record<string, unknown> {
  const question = {
    number,
    text: `[Question ${number} text]`,
    answer: `[Correct answer for Q${number}]`,
    explanation: `[Brief explanation for Q${number}, supported by the passage]`,
  };

  if (typeCode === "R-MCQ") {
    return {
      ...question,
      options: ["[Option A]", "[Option B]", "[Option C]", "[Option D]"],
    };
  }

  if (typeCode === "R-MHDG") {
    return { ...question, text: `[Paragraph/section for Q${number}]`, answer: "[Heading number, e.g. ii]" };
  }

  if (typeCode === "R-MINF") {
    return { ...question, answer: "[Paragraph letter, e.g. C]" };
  }

  if (["R-NMATCH", "R-MFT", "R-MSE"].includes(typeCode)) {
    return { ...question, answer: "[Option letter, e.g. B]" };
  }

  if (typeCode === "R-TFN") {
    return { ...question, answer: "[TRUE, FALSE, or NOT GIVEN]" };
  }

  if (typeCode === "R-YNN") {
    return { ...question, answer: "[YES, NO, or NOT GIVEN]" };
  }

  if (typeCode === "R-SCOMP" || typeCode === "R-FLOW" || typeCode === "R-DIAG") {
    return { ...question, text: `[Question ${number} text with ______ blank]` };
  }

  return question;
}

function buildGroupTemplate(range: ReadingImportPlanRange): Record<string, unknown> {
  const numbers = Array.from({ length: range.to - range.from + 1 }, (_, index) => range.from + index);
  const questions = numbers.map((number) => buildQuestionTemplate(range.typeCode, number));

  if (range.typeCode === "R-MMCQ") {
    return {
      type: range.typeCode,
      startNumber: range.from,
      text: "[Shared question stem for the selected answers]",
      options: ["[Option A]", "[Option B]", "[Option C]", "[Option D]", "[Option E]"],
      answers: numbers.map((_, index) => `[Correct option letter ${index + 1}]`),
      explanation: "[Brief explanation for why the selected options are correct]",
    };
  }

  if (range.typeCode === "R-MHDG") {
    return {
      type: range.typeCode,
      headings: ["[Heading i]", "[Heading ii]", "[Heading iii]", "[Heading iv]"],
      questions,
    };
  }

  if (range.typeCode === "R-MINF") {
    return {
      type: range.typeCode,
      options: ["A", "B", "C", "D", "E", "F", "G"],
      questions,
    };
  }

  if (["R-NMATCH", "R-MFT", "R-MSE"].includes(range.typeCode)) {
    return {
      type: range.typeCode,
      options: ["[Option A]", "[Option B]", "[Option C]", "[Option D]"],
      questions,
    };
  }

  if (["R-SCO", "R-SCWO", "R-NCOMP", "R-TABLE"].includes(range.typeCode)) {
    const instructions: Record<string, [string, string]> = {
      "R-SCO": [
        "Complete the summary using the word list below.",
        "Choose the correct option for each answer.",
      ],
      "R-SCWO": [
        "Complete the summary below.",
        "Choose **NO MORE THAN TWO WORDS** from the passage for each answer.",
      ],
      "R-NCOMP": [
        "Complete the notes below.",
        "Choose **NO MORE THAN TWO WORDS** from the passage for each answer.",
      ],
      "R-TABLE": [
        "Complete the table below.",
        "Choose **NO MORE THAN TWO WORDS** from the passage for each answer.",
      ],
    };
    const [instruction, instruction2] = instructions[range.typeCode];
    const group: Record<string, unknown> = {
      type: range.typeCode,
      instruction,
      instruction2,
      content: [
        range.typeCode === "R-NCOMP" ? "### [Notes title]" : "### [Section title]",
        "",
        "**[Section heading]**",
        ...numbers.map((number) => `[Text containing the answer] [${number}]`),
      ].join("\n"),
      answers: Object.fromEntries(numbers.map((number) => [
        String(number),
        range.typeCode === "R-SCO" ? "[Correct option letter, e.g. C]" : `[Correct answer for Q${number}]`,
      ])),
      explanations: Object.fromEntries(numbers.map((number) => [
        String(number),
        `[Brief explanation for Q${number}, supported by the passage]`,
      ])),
    };

    if (range.typeCode === "R-SCO") {
      group.options = ["[Option A]", "[Option B]", "[Option C]", "[Option D]"];
    }

    return group;
  }

  return { type: range.typeCode, questions };
}

export function buildReadingAiPromptTemplate(
  ranges: ReadingImportPlanRange[],
  typeCatalog: ReadingTypeDef[]
): string {
  const passages = [1, 2, 3]
    .map((passageNumber) => {
      const groups = ranges
        .filter((range) => range.passageNumber === passageNumber)
        .sort((a, b) => a.from - b.from)
        .map(buildGroupTemplate);

      return groups.length > 0
        ? {
            passageNumber,
            passage: {
              title: `[Passage ${passageNumber} title]`,
              subtitle: `[Passage ${passageNumber} subtitle, if any]`,
              body: `[Paste the full Passage ${passageNumber} text here]`,
            },
            groups,
          }
        : null;
    })
    .filter((passage) => passage !== null);

  const typePlan = ranges
    .slice()
    .sort((a, b) => a.from - b.from)
    .map((range) => {
      const type = typeCatalog.find((item) => item.code === range.typeCode);
      return `Q${range.from}-${range.to} (Passage ${range.passageNumber}): ${type?.title ?? range.typeCode}`;
    })
    .join("\n");

  return [
    "Convert the source IELTS Reading material below into JSON for my exam builder.",
    "Return ONLY valid JSON. Follow the template exactly: keep all question numbers, passage numbers, and question types as shown.",
    "Use the supplied passage and question material. Determine each correct answer from the passage, and include a concise explanation supported by it. Do not guess; if required information is missing, ask for it instead of returning incomplete JSON.",
    "For questions with blanks, use [question number] in the content. Never write labels such as Q19: before a note or summary line; the app displays the number beside the blank automatically.",
    "For Notes Completion, set type to NOTES. Put the title on a line starting with ### so it is centered and bold, then include one blank line before the notes begin. Section headings should be between **double asterisks** (for example **Influences and experiments**). Keep each note sentence on a separate plain line without a leading -, *, or + so it has no bullet dot.",
    "The app automatically shows the question range (for example Questions 8–13) in bold. Do not repeat that range or add Q8:, Q9:, etc. inside content; use only [8], [9], etc. at each blank.",
    "Use Markdown **bold** around important instruction limits, for example **NO MORE THAN TWO WORDS**. Add an answer and a short explanation for every question: use explanation on each question, explanations keyed by question number for notes/summary/table groups, or explanation for a shared MMCQ group.",
    "Treat any supplied image/PDF as a layout reference only. Do not copy or closely paraphrase copyrighted passages or questions; use original content or material the user is authorized to reproduce.",
    "",
    "Question plan:",
    typePlan,
    "",
    "Replace the placeholders in this JSON template with the source material:",
    JSON.stringify({ passages }, null, 2),
    "",
    "AI INSTRUCTIONS (follow these rules while filling the JSON above):",
    "- Keep the question numbers, passage assignments, and question types exactly as planned.",
    "- For notes or summaries, do not add labels like Q19: before the text. Put only [19] at the answer blank; the app adds the question number automatically.",
    "- Keep notes/summary titles on a ### line, section headings between **double asterisks**, and each note or sentence on its own line.",
    "- Put task directions in instruction and instruction2, not in content. Use Markdown bold for important limits, such as **NO MORE THAN TWO WORDS**.",
    "",
    "CONTENT FORMATTING CHEAT SHEET (inside a NOTES group's content string):",
    "- Centered, bold title: start a line with ### followed by the title, e.g. ### The Discovery of Johnston's Diaries. The app centers and bolds this title automatically; do not wrap the title in **.",
    "- Bold section heading: wrap the whole heading in **, e.g. **Influences and experiments**.",
    "- Add a visible blank gap: put an empty line between blocks. In the JSON string, represent a line break as \\n and a blank line as \\n\\n.",
    "- No bullet dot: write a note as a plain line with no prefix, e.g. The diaries were returned by an anonymous source.",
    "- Add a bullet dot: start a note line with - , * , or + followed by a space. Indent a line with 2 or 4 leading spaces for a nested dash bullet.",
    "- Add a question blank: put only [32] where the answer belongs. The app renders the question number and answer box; never type Q32:.",
    "- Bold words inside an instruction or sentence: wrap them in **, e.g. Choose **NO MORE THAN TWO WORDS** from the passage.",
    "- Add a horizontal divider: put --- on a line by itself.",
    "- Show an italic example line: start it with > followed by a space.",
    "- Keep all formatting markers inside content; keep answers and explanations in their dedicated JSON fields.",
    "- Supply a correct answer and a brief explanation for every question, grounded in the passage. Use explanation on each question, explanations keyed by question number for notes/summary/table, or explanation for the shared MMCQ group.",
    "- Use an attached image or PDF only as a layout reference. Do not copy or closely paraphrase copyrighted wording; use original or authorized source material.",
    "- Return only valid JSON with no Markdown fences. If the source is missing information needed for a reliable answer, ask for it instead of guessing.",
    "",
    "SOURCE MATERIAL (paste original or authorized passage(s), questions, and options below):",
    "[PASTE SOURCE MATERIAL HERE]",
  ].join("\n");
}

// ─── Template shown in the import dialog ────────────────────────────────
export const READING_IMPORT_SAMPLE = `{
  "passageNumber": 1,
  "passage": {
    "title": "The history of glass",
    "subtitle": "From accidental discovery to everyday object",
    "body": "A  Paragraph A text...\\n\\nB  Paragraph B text..."
  },
  "groups": [
    {
      "type": "TFNG",
      "questions": [
        { "number": 1, "text": "Glass was first made in Egypt.", "answer": "FALSE" },
        { "number": 2, "text": "Early glass was expensive.", "answer": "TRUE" },
        { "number": 3, "text": "The Romans exported glass to China.", "answer": "NOT GIVEN" }
      ]
    },
    {
      "type": "MCQ",
      "questions": [
        {
          "number": 4,
          "text": "What is the main idea of paragraph B?",
          "options": ["Cost of glass", "Uses of glass", "Origins of glass", "Future of glass"],
          "answer": "C"
        }
      ]
    },
    {
      "type": "HEADINGS",
      "headings": ["The spread of glassmaking", "A lucky accident", "Modern techniques"],
      "questions": [
        { "number": 5, "text": "Paragraph A", "answer": "ii" },
        { "number": 6, "text": "Paragraph B", "answer": "i" }
      ]
    },
    {
      "type": "NOTES",
      "instruction": "Complete the notes below.",
      "instruction2": "Choose **NO MORE THAN TWO WORDS** from the passage for each answer.",
      "content": "### Glass production\\n\\n**Materials and production**\\nThe main ingredient for glass is [7].\\nGlass was heated in a [8].",
      "answers": { "7": "sand", "8": "furnace" },
      "explanations": {
        "7": "The passage identifies sand as the main ingredient for glass.",
        "8": "The passage says the mixture was heated in a furnace."
      }
    },
    {
      "type": "MMCQ",
      "startNumber": 9,
      "text": "Which TWO advantages of glass are mentioned?",
      "options": ["cheap", "transparent", "light", "recyclable", "strong"],
      "answers": ["B", "D"]
    },
    {
      "type": "SENTENCE_COMPLETION",
      "questions": [
        { "number": 11, "text": "Glass blowing was invented by the ______.", "answer": ["Syrians", "Syrian craftsmen"] }
      ]
    }
  ]
}`;

export const READING_IMPORT_AI_PROMPT = `Convert the IELTS Reading questions below into JSON for my exam builder. Output ONLY valid JSON.

Shape: { "passageNumber": 1, "passage": { "title", "subtitle", "body" }, "groups": [ ... ] }
For a full test use: { "passages": [ { "passageNumber": 1, ... }, { "passageNumber": 2, ... } ] }

Group types and fields:
- TFNG / YNNG: questions[{number,text,answer:"TRUE|FALSE|NOT GIVEN" or "YES|NO|NOT GIVEN"}]
- MCQ: questions[{number,text,options:[4 texts without letters],answer:"B"}]
- MMCQ (choose TWO/THREE): startNumber,text,options:[...],answers:["A","D"]
- HEADINGS: headings:[texts without numerals], questions[{number,text:"Paragraph A",answer:"iv"}]
- MATCHING_INFO: options:["A","B",...paragraph letters], questions[{number,text,answer:"C"}]
- NAME_MATCHING / MATCHING_FEATURES / SENTENCE_ENDINGS: options:[texts without letters], questions[{number,text,answer:"B"}]
- SENTENCE_COMPLETION / SHORT_ANSWER / DIAGRAM / FLOW: questions[{number,text (use ______ for the blank),answer:"word" or ["alt1","alt2"]}]
- SUMMARY (no word list) / NOTES / TABLE: content (markdown, blanks as [14]), answers:{"14":"word"}
  TABLE may use "table": [["Header1","Header2"],["cell","[15]"]] instead of content.
- SUMMARY_WITH_OPTIONS: content with [n] blanks, options:[word list], answers:{"20":"C"}
Optional on any group: "instruction" (e.g. "Choose NO MORE THAN TWO WORDS from the passage for each answer.").

Questions:
`;
