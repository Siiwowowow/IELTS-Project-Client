export const LISTENING_QUESTION_TYPES = [
  { value: "SENTENCE_COMPLETION", label: "Sentence Completion" },
  { value: "MULTIPLE_CHOICE", label: "Single MCQ (One Correct Answer)" },
  { value: "MULTIPLE_CHOICE_MULTIPLE", label: "Double MCQ (Choose Two Answers)" },
  { value: "MATCHING_FEATURES", label: "Matching Features (A-G List)" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "TABLE_COMPLETION", label: "Table Completion" },
  { value: "FLOW_CHART_COMPLETION", label: "Flow Chart Completion" },
  { value: "DIAGRAM_LABELLING", label: "Diagram / Map Labelling" },
  { value: "SUMMARY_COMPLETION", label: "Summary Completion" },
  { value: "NOTES_COMPLETION", label: "Notes Completion" },
] as const;

export type ListeningQuestionType = (typeof LISTENING_QUESTION_TYPES)[number]["value"];

export interface ListeningJsonQuestion {
  questionNumber: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface ListeningJsonQuestionGroup {
  type: ListeningQuestionType;
  instruction: string;
  passageSegment: string;
  options: string[];
  imageUrl: string;
  order: number;
  questions: ListeningJsonQuestion[];
}

export interface ListeningJsonSection {
  title: string;
  audioUrl: string;
  youtubeUrl: string;
  script: string;
  instruction: string;
  order: number;
  questionGroups: ListeningJsonQuestionGroup[];
}

export interface ListeningJsonExam {
  title: string;
  description: string;
  duration: number;
  isPublished: boolean;
  audioUrl: string;
  youtubeUrl: string;
  sections: ListeningJsonSection[];
}

export interface ListeningImportedSection {
  order: number;
  fields: Partial<Omit<ListeningJsonSection, "order" | "questionGroups">>;
  questionGroups: ListeningJsonQuestionGroup[];
}

export interface ListeningImportResult {
  exam: Partial<Omit<ListeningJsonExam, "sections">>;
  sections: ListeningImportedSection[];
  errors: string[];
  warnings: string[];
}

interface ParseOptions {
  fallbackSection: number;
}

type SerializableQuestionGroup = Omit<ListeningJsonQuestionGroup, "type"> & { type: string };
type SerializableListeningExam = Omit<ListeningJsonExam, "sections"> & {
  sections: Array<Omit<ListeningJsonSection, "questionGroups"> & {
    questionGroups: SerializableQuestionGroup[];
  }>;
};

const SECTION_STARTS = [1, 11, 21, 31];

const DEFAULT_INSTRUCTIONS: Record<ListeningQuestionType, [string, string]> = {
  SENTENCE_COMPLETION: ["Complete the sentences below.", "Write NO MORE THAN TWO WORDS for each answer."],
  MULTIPLE_CHOICE: ["Choose the correct letter, A, B or C.", ""],
  MULTIPLE_CHOICE_MULTIPLE: ["Choose TWO letters.", ""],
  MATCHING_FEATURES: ["Choose the correct letter, A-G, for each question.", ""],
  SHORT_ANSWER: ["Answer the questions below.", "Write NO MORE THAN THREE WORDS for each answer."],
  TABLE_COMPLETION: ["Complete the table below.", "Write ONE WORD AND/OR A NUMBER for each answer."],
  FLOW_CHART_COMPLETION: ["Complete the flow-chart below.", "Choose the correct answer for each gap."],
  DIAGRAM_LABELLING: ["Label the plan below.", "Write the correct letter, A-G, next to each question."],
  SUMMARY_COMPLETION: ["Complete the summary below.", "Write NO MORE THAN TWO WORDS for each answer."],
  NOTES_COMPLETION: ["Complete the notes below.", "Write NO MORE THAN TWO WORDS for each answer."],
};

const TYPE_ALIASES: Record<string, ListeningQuestionType> = {
  MCQ: "MULTIPLE_CHOICE",
  SINGLE_MCQ: "MULTIPLE_CHOICE",
  MMCQ: "MULTIPLE_CHOICE_MULTIPLE",
  DOUBLE_MCQ: "MULTIPLE_CHOICE_MULTIPLE",
  SUMMARY: "SUMMARY_COMPLETION",
  NOTES: "NOTES_COMPLETION",
  FLOW: "FLOW_CHART_COMPLETION",
  DIAGRAM: "DIAGRAM_LABELLING",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asString(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function asStringList(value: unknown): string[] {
  const items = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\r?\n/)
      : [];
  return items
    .map((item) => asString(item).trim())
    .filter(Boolean)
    .map(stripOptionPrefix);
}

function stripOptionPrefix(value: string): string {
  return value.replace(/^[A-Z]\s*[.)]\s*/i, "").trim();
}

function toAnswerString(value: unknown): string {
  if (Array.isArray(value)) return value.map(asString).filter(Boolean).join(" / ");
  return asString(value).trim();
}

function normalizeType(value: unknown): ListeningQuestionType | null {
  const normalized = asString(value).trim().toUpperCase().replace(/[\s-]+/g, "_");
  const aliased = TYPE_ALIASES[normalized] ?? normalized;
  return LISTENING_QUESTION_TYPES.some((item) => item.value === aliased)
    ? aliased as ListeningQuestionType
    : null;
}

function questionRange(numbers: number[]): string {
  const sorted = numbers.slice().sort((a, b) => a - b);
  if (sorted.length === 0) return "";
  return sorted[0] === sorted[sorted.length - 1]
    ? `Question ${sorted[0]}`
    : `Questions ${sorted[0]}-${sorted[sorted.length - 1]}`;
}

function buildInstruction(
  type: ListeningQuestionType,
  group: Record<string, unknown>,
  numbers: number[],
): string {
  const instruction = asString(group.instruction).trim();
  if (instruction.includes("|||")) return instruction;

  const [defaultFirst, defaultSecond] = DEFAULT_INSTRUCTIONS[type];
  const first = instruction || defaultFirst;
  const second = asString(group.instruction2).trim() || defaultSecond;
  const heading = asString(group.heading).trim();
  return `${questionRange(numbers)}|||${first}|||${second}|||${heading}`;
}

function readAnswerMap(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) {
    return Object.fromEntries(
      value
        .filter(isRecord)
        .map((item) => [asString(item.number), item.answer ?? item.correctAnswer]),
    );
  }
  return isRecord(value) ? value : {};
}

function findOptionAnswer(answer: string, options: string[]): string {
  const normalized = answer.trim().toUpperCase();
  if (/^[A-Z]$/.test(normalized)) {
    const option = options[normalized.charCodeAt(0) - 65];
    if (option) return option;
  }
  return options.find((option) => option.toLowerCase() === answer.trim().toLowerCase()) ?? answer;
}

function allocateQuestionNumber(
  rawNumber: unknown,
  sectionOrder: number,
  nextNumber: { value: number },
  usedNumbers: Set<number>,
  errors: string[],
  label: string,
): number {
  let number = Number(rawNumber);
  if (rawNumber === undefined || rawNumber === null || rawNumber === "") {
    number = nextNumber.value;
    while (usedNumbers.has(number)) number += 1;
  }
  if (!Number.isInteger(number) || number < 1 || number > 40) {
    errors.push(`${label}: question number must be a whole number from 1 to 40.`);
    return SECTION_STARTS[sectionOrder - 1] ?? 1;
  }
  if (usedNumbers.has(number)) {
    errors.push(`${label}: question ${number} is already used in this import.`);
  }
  usedNumbers.add(number);
  nextNumber.value = Math.max(nextNumber.value, number + 1);
  return number;
}

function parseGroup(
  value: unknown,
  sectionOrder: number,
  groupIndex: number,
  nextNumber: { value: number },
  usedNumbers: Set<number>,
  errors: string[],
): ListeningJsonQuestionGroup | null {
  if (!isRecord(value)) {
    errors.push(`Section ${sectionOrder}, group ${groupIndex + 1}: expected a JSON object.`);
    return null;
  }
  const label = `Section ${sectionOrder}, group ${groupIndex + 1}`;
  const type = normalizeType(value.type);
  if (!type) {
    errors.push(`${label}: unsupported question type "${asString(value.type) || "missing"}".`);
    return null;
  }

  const sourceQuestions = Array.isArray(value.questions)
    ? value.questions.filter(isRecord)
    : [];
  const answerMap = readAnswerMap(value.answers);
  const explanationMap = readAnswerMap(value.explanations);
  const groupOptions = asStringList(value.options);
  const content = asString(value.content ?? value.passageSegment);
  const placeholderNumbers = Array.from(
    new Set(Array.from(content.matchAll(/\[(\d+)\]/g), (match) => Number(match[1]))),
  );
  const isPlaceholderType = [
    "SENTENCE_COMPLETION",
    "TABLE_COMPLETION",
    "FLOW_CHART_COMPLETION",
    "SUMMARY_COMPLETION",
    "NOTES_COMPLETION",
  ].includes(type);

  let questionsToParse = sourceQuestions;
  if (type === "MULTIPLE_CHOICE_MULTIPLE") {
    const firstQuestion = sourceQuestions[0];
    const inlineAnswers = firstQuestion?.answers ?? firstQuestion?.answer;
    const groupAnswers = value.answers ?? value.answer;
    const answersToExpand = Array.isArray(inlineAnswers)
      ? inlineAnswers
      : sourceQuestions.length === 0 && Array.isArray(groupAnswers)
        ? groupAnswers
        : typeof inlineAnswers === "string" && inlineAnswers.includes("/")
          ? inlineAnswers.split("/")
          : [];
    if (answersToExpand.length > 1 && sourceQuestions.length <= 1) {
      const firstNumber = firstQuestion?.number ?? firstQuestion?.questionNumber ?? value.startNumber;
      questionsToParse = answersToExpand.map((answer, index) => ({
        number: firstNumber === undefined ? undefined : Number(firstNumber) + index,
        text: index === 0
          ? firstQuestion?.text ?? firstQuestion?.questionText ?? value.text ?? value.question
          : "",
        answer,
        options: firstQuestion?.options ?? value.options,
        explanation: firstQuestion?.explanation ?? value.explanation,
      }));
    } else if (sourceQuestions.length === 0 && isRecord(groupAnswers)) {
      questionsToParse = Object.entries(groupAnswers).map(([number, answer]) => ({ number, answer }));
    }
    if (questionsToParse.length !== 2) {
      errors.push(`${label}: Double MCQ requires exactly two question entries/answers.`);
    }
  } else if (isPlaceholderType && placeholderNumbers.length > 0) {
    const byNumber = new Map<number, Record<string, unknown>>();
    for (const [index, question] of sourceQuestions.entries()) {
      const number = Number(question.number ?? question.questionNumber);
      if (Number.isInteger(number)) byNumber.set(number, question);
      else if (placeholderNumbers[index] !== undefined) byNumber.set(placeholderNumbers[index], question);
    }
    questionsToParse = placeholderNumbers.map((number) => ({
      ...(byNumber.get(number) ?? {}),
      number,
      answer: byNumber.get(number)?.answer ?? byNumber.get(number)?.correctAnswer ?? answerMap[String(number)],
      explanation: byNumber.get(number)?.explanation ?? explanationMap[String(number)],
    }));
    for (const question of sourceQuestions) {
      const number = Number(question.number ?? question.questionNumber);
      if (Number.isInteger(number) && !placeholderNumbers.includes(number)) {
        questionsToParse.push(question);
      }
    }
  } else if (questionsToParse.length === 0 && value.text !== undefined) {
    questionsToParse = [{
      number: value.number ?? value.startNumber,
      text: value.text,
      answer: value.answer,
      options: value.options,
      explanation: value.explanation,
    }];
  }

  const items: ListeningJsonQuestion[] = [];
  for (const [questionIndex, rawQuestion] of questionsToParse.entries()) {
    const number = allocateQuestionNumber(
      rawQuestion.number ?? rawQuestion.questionNumber ??
        (questionIndex === 0 ? value.startNumber : undefined),
      sectionOrder,
      nextNumber,
      usedNumbers,
      errors,
      `${label}, question ${questionIndex + 1}`,
    );
    const questionOptions = ["MULTIPLE_CHOICE", "MULTIPLE_CHOICE_MULTIPLE"].includes(type)
      ? asStringList(rawQuestion.options ?? value.options)
      : [];
    let correctAnswer = toAnswerString(
      rawQuestion.answer ?? rawQuestion.correctAnswer ??
        (type === "MULTIPLE_CHOICE_MULTIPLE" && Array.isArray(value.answers)
          ? value.answers[questionIndex]
          : answerMap[String(number)]),
    );
    if (["MULTIPLE_CHOICE", "MULTIPLE_CHOICE_MULTIPLE", "FLOW_CHART_COMPLETION", "SUMMARY_COMPLETION"].includes(type)) {
      correctAnswer = findOptionAnswer(
        correctAnswer,
        questionOptions.length > 0 ? questionOptions : groupOptions,
      );
    }
    if (!correctAnswer) {
      errors.push(`${label}: missing answer for Question ${number}.`);
    }
    if (type === "MULTIPLE_CHOICE" &&
      (questionOptions.length < 2 || !questionOptions.includes(correctAnswer))) {
      errors.push(`${label}: Question ${number} needs at least two options and a matching answer.`);
    }
    if (type === "MULTIPLE_CHOICE_MULTIPLE" &&
      (groupOptions.length < 3 || !questionOptions.includes(correctAnswer))) {
      errors.push(`${label}: Double MCQ Question ${number} needs at least three options and an answer from the list.`);
    }
    if (type === "MATCHING_FEATURES" &&
      (groupOptions.length < 2 || !/^[A-Z]$/i.test(correctAnswer) ||
        Number(correctAnswer.toUpperCase().charCodeAt(0) - 65) >= groupOptions.length)) {
      errors.push(`${label}: Matching Features Question ${number} needs a valid option letter.`);
    }
    if (type === "DIAGRAM_LABELLING" &&
      (groupOptions.length < 2 || !/^[A-Z]$/i.test(correctAnswer) ||
        Number(correctAnswer.toUpperCase().charCodeAt(0) - 65) >= groupOptions.length)) {
      errors.push(`${label}: Diagram Labelling Question ${number} needs a valid label letter.`);
    }
    if (["FLOW_CHART_COMPLETION", "SUMMARY_COMPLETION"].includes(type) &&
      groupOptions.length > 0 && !groupOptions.includes(correctAnswer)) {
      errors.push(`${label}: Question ${number} answer must match one of the block options.`);
    }
    const questionText = asString(
      rawQuestion.text ?? rawQuestion.questionText ??
        (type === "MULTIPLE_CHOICE_MULTIPLE" && questionIndex > 0
          ? ""
          : value.text ?? value.question),
    );
    items.push({
      questionNumber: number,
      questionText,
      options: questionOptions,
      correctAnswer,
      explanation: asString(
        rawQuestion.explanation ?? explanationMap[String(number)] ?? value.explanation,
      ),
    });
  }

  if (items.length === 0 && (content.trim() || groupOptions.length > 0 || asString(value.imageUrl))) {
    errors.push(`${label}: add at least one numbered question (or a [number] blank in content).`);
  }
  const questionNumbers = items.map((question) => question.questionNumber);
  const instruction = buildInstruction(type, value, questionNumbers);

  return {
    type,
    instruction,
    passageSegment: content,
    options: groupOptions,
    imageUrl: asString(value.imageUrl),
    order: groupIndex + 1,
    questions: items,
  };
}

export function parseListeningImportJson(
  input: string,
  options: ParseOptions = { fallbackSection: 1 },
): ListeningImportResult {
  const result: ListeningImportResult = { exam: {}, sections: [], errors: [], warnings: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    result.errors.push(error instanceof Error ? `Invalid JSON: ${error.message}` : "Invalid JSON.");
    return result;
  }

  if (!isRecord(parsed)) {
    result.errors.push("JSON must contain an object.");
    return result;
  }
  const root = isRecord(parsed.exam) ? { ...parsed.exam, ...parsed } : parsed;
  for (const field of ["title", "description", "audioUrl", "youtubeUrl"] as const) {
    if (Object.prototype.hasOwnProperty.call(root, field)) result.exam[field] = asString(root[field]);
  }
  if (Object.prototype.hasOwnProperty.call(root, "duration")) {
    const duration = Number(root.duration);
    if (Number.isFinite(duration) && duration > 0) result.exam.duration = duration;
    else result.errors.push("Exam duration must be a positive number.");
  }
  if (Object.prototype.hasOwnProperty.call(root, "isPublished")) {
    result.exam.isPublished = Boolean(root.isPublished);
  }

  const sourceSections = Array.isArray(root.sections)
    ? root.sections
    : root.sectionNumber !== undefined || root.partNumber !== undefined
      ? [root]
      : [];
  if (sourceSections.length === 0) {
    result.errors.push('JSON must include a "sections" array, or a single object with "sectionNumber".');
    return result;
  }

  const usedNumbers = new Set<number>();
  const seenSections = new Set<number>();
  sourceSections.forEach((sectionValue, sectionIndex) => {
    if (!isRecord(sectionValue)) {
      result.errors.push(`Section entry ${sectionIndex + 1} must be an object.`);
      return;
    }
    const sectionOrder = Number(
      sectionValue.sectionNumber ?? sectionValue.partNumber ?? sectionValue.order ??
        (sourceSections.length === 1 ? options.fallbackSection : sectionIndex + 1),
    );
    if (!Number.isInteger(sectionOrder) || sectionOrder < 1 || sectionOrder > 4) {
      result.errors.push(`Section entry ${sectionIndex + 1}: sectionNumber must be from 1 to 4.`);
      return;
    }
    if (seenSections.has(sectionOrder)) {
      result.errors.push(`Section ${sectionOrder} appears more than once in this JSON.`);
      return;
    }
    seenSections.add(sectionOrder);

    const fields: ListeningImportedSection["fields"] = {};
    for (const field of ["title", "audioUrl", "youtubeUrl", "script", "instruction"] as const) {
      if (Object.prototype.hasOwnProperty.call(sectionValue, field)) {
        fields[field] = asString(sectionValue[field]);
      }
    }
    const sourceGroups = Array.isArray(sectionValue.groups)
      ? sectionValue.groups
      : Array.isArray(sectionValue.questionGroups)
        ? sectionValue.questionGroups
        : [];
    const nextNumber = { value: SECTION_STARTS[sectionOrder - 1] };
    const questionGroups = sourceGroups
      .map((group, groupIndex) =>
        parseGroup(group, sectionOrder, groupIndex, nextNumber, usedNumbers, result.errors),
      )
      .filter((group): group is ListeningJsonQuestionGroup => group !== null);
    result.sections.push({ order: sectionOrder, fields, questionGroups });
  });

  if (result.sections.length === 0) result.errors.push("No valid listening sections were found.");
  result.sections.sort((a, b) => a.order - b.order);
  return result;
}

function isConfiguredQuestion(
  question: ListeningJsonQuestion,
  group: Pick<ListeningJsonQuestionGroup, "passageSegment">,
): boolean {
  const referencedNumbers = Array.from(
    group.passageSegment.matchAll(/\[(\d+)\]/g),
    (match) => Number(match[1]),
  );
  return referencedNumbers.includes(question.questionNumber) ||
    Boolean(question.questionText.trim() || question.correctAnswer.trim() || question.explanation.trim()) ||
    question.options.some(Boolean);
}

function serializeQuestionGroup(group: SerializableQuestionGroup): Record<string, unknown> {
  const configuredQuestions = group.questions
    .filter((question) => isConfiguredQuestion(question, group))
    .slice()
    .sort((a, b) => a.questionNumber - b.questionNumber);
  const result: Record<string, unknown> = {
    type: group.type,
    instruction: group.instruction || undefined,
    content: group.passageSegment || undefined,
    options: group.options.length > 0 ? group.options : undefined,
    imageUrl: group.imageUrl || undefined,
  };

  if (["TABLE_COMPLETION", "FLOW_CHART_COMPLETION", "SUMMARY_COMPLETION", "NOTES_COMPLETION"].includes(group.type)) {
    result.answers = Object.fromEntries(configuredQuestions.map((question) => [
      String(question.questionNumber),
      question.correctAnswer,
    ]));
    result.explanations = Object.fromEntries(configuredQuestions.map((question) => [
      String(question.questionNumber),
      question.explanation,
    ]));
  } else if (group.type === "MULTIPLE_CHOICE_MULTIPLE") {
    const options = configuredQuestions[0]?.options ?? [];
    result.text = configuredQuestions[0]?.questionText ?? "";
    result.options = options.length > 0 ? options : group.options;
    result.questions = configuredQuestions.map((question) => ({
      number: question.questionNumber,
      answer: optionAnswerAsLetter(question.correctAnswer, options),
      explanation: question.explanation || undefined,
    }));
  } else {
    result.questions = configuredQuestions.map((question) => ({
      number: question.questionNumber,
      text: question.questionText,
      options: question.options.length > 0 ? question.options : undefined,
      answer: group.type === "MULTIPLE_CHOICE"
        ? optionAnswerAsLetter(question.correctAnswer, question.options)
        : question.correctAnswer,
      explanation: question.explanation || undefined,
    }));
  }

  return result;
}

function optionAnswerAsLetter(answer: string, options: string[]): string {
  const normalized = answer.trim().toLowerCase();
  if (/^[a-z]$/i.test(answer.trim())) return answer.trim().toUpperCase();
  const optionIndex = options.findIndex((option) => option.trim().toLowerCase() === normalized);
  return optionIndex >= 0 ? String.fromCharCode(65 + optionIndex) : answer;
}

export function serializeListeningImportJson(form: SerializableListeningExam): string {
  const sections = form.sections
    .map((section) => {
      const groups = section.questionGroups
        .map(serializeQuestionGroup)
        .filter((group) => {
          const hasQuestions = Array.isArray(group.questions) && group.questions.length > 0;
          const hasAnswers = isRecord(group.answers) && Object.keys(group.answers).length > 0;
          return hasQuestions || hasAnswers;
        });
      const hasSectionContent = groups.length > 0 ||
        Boolean(section.audioUrl || section.youtubeUrl || section.script || section.instruction);
      if (!hasSectionContent) return null;
      return {
        sectionNumber: section.order,
        title: section.title,
        audioUrl: section.audioUrl || form.audioUrl,
        youtubeUrl: section.youtubeUrl || form.youtubeUrl,
        script: section.script,
        instruction: section.instruction,
        groups,
      };
    })
    .filter((section): section is NonNullable<typeof section> => section !== null);

  if (sections.length === 0) return "";
  return JSON.stringify({
    title: form.title,
    description: form.description,
    duration: form.duration,
    isPublished: form.isPublished,
    audioUrl: form.audioUrl,
    youtubeUrl: form.youtubeUrl,
    sections,
  }, null, 2);
}

const LISTENING_IMPORT_TEMPLATE = {
  title: "IELTS Listening Practice Test",
  description: "Listening practice",
  duration: 30,
  audioUrl: "",
  youtubeUrl: "",
  sections: [
    {
      sectionNumber: 1,
      title: "Part 1: Q1-10",
      script: "Paste an original or authorized transcript here.",
      groups: [
        {
          type: "SENTENCE_COMPLETION",
          instruction: "Complete the form below. Write NO MORE THAN TWO WORDS.",
          content: "Name: [1]\nAddress: [2]",
          answers: { "1": "Example name", "2": "Example address" },
          explanations: { "1": "The speaker gives this name.", "2": "The address is stated in the recording." },
        },
        {
          type: "MULTIPLE_CHOICE",
          questions: [{ number: 3, text: "What does the caller need?", options: ["A map", "A ticket", "A receipt"], answer: "B" }],
        },
        {
          type: "MULTIPLE_CHOICE_MULTIPLE",
          text: "Which TWO facilities are available?",
          options: ["Cafe", "Library", "Garden", "Gym"],
          questions: [{ number: 4, answer: "A" }, { number: 5, answer: "D" }],
        },
        {
          type: "MATCHING_FEATURES",
          options: ["North Hall", "West Hall", "East Hall"],
          questions: [{ number: 6, text: "Registration", answer: "A" }],
        },
        {
          type: "SHORT_ANSWER",
          questions: [{ number: 7, text: "What time does the tour begin?", answer: "9:30" }],
        },
        {
          type: "TABLE_COMPLETION",
          content: "| Item | Details |\n|---|---|\n| Cost | [8] |",
          answers: { "8": "£25" },
        },
        {
          type: "FLOW_CHART_COMPLETION",
          options: ["wash", "dry", "pack"],
          content: "First, [9] the samples.",
          answers: { "9": "wash" },
        },
        {
          type: "DIAGRAM_LABELLING",
          imageUrl: "https://example.com/authorized-map.png",
          options: ["A", "B", "C", "D"],
          questions: [{ number: 10, text: "Main entrance", answer: "A" }],
        },
      ],
    },
    {
      sectionNumber: 2,
      title: "Part 2: Q11-20",
      groups: [
        {
          type: "SUMMARY_COMPLETION",
          content: "### The new centre\n\nVisitors can register at the [11].",
          answers: { "11": "front desk" },
        },
        {
          type: "NOTES_COMPLETION",
          content: "### Booking a visit\n\n**Before arrival**\nBring your [12] to reception.",
          answers: { "12": "confirmation email" },
        },
      ],
    },
  ],
};

export const LISTENING_IMPORT_SAMPLE = JSON.stringify(LISTENING_IMPORT_TEMPLATE, null, 2);

export interface ListeningImportPlanRange {
  sectionNumber: 1 | 2 | 3 | 4;
  from: number;
  to: number;
  typeCode: ListeningQuestionType | "";
}

export function getListeningSectionForQuestion(number: number): 1 | 2 | 3 | 4 {
  return Math.min(4, Math.max(1, Math.ceil(number / 10))) as 1 | 2 | 3 | 4;
}

export function createNextListeningImportPlanRange(
  ranges: ListeningImportPlanRange[],
): ListeningImportPlanRange | null {
  if (ranges.length === 0) return null;
  const lastRange = ranges.reduce((last, range) => range.to > last.to ? range : last);
  if (lastRange.to >= 40) return null;
  const from = lastRange.to + 1;
  const sectionNumber = getListeningSectionForQuestion(from);
  return {
    sectionNumber,
    from,
    to: Math.min(from + 4, sectionNumber * 10, 40),
    typeCode: "",
  };
}

function buildListeningQuestionTemplate(type: ListeningQuestionType, number: number): Record<string, unknown> {
  return {
    number,
    text: `[Question ${number} text]`,
    answer: `[Correct answer for Q${number}]`,
    explanation: `[Brief explanation for Q${number}, based on the recording]`,
    ...(type === "MULTIPLE_CHOICE" ? { options: ["[Option A]", "[Option B]", "[Option C]"] } : {}),
  };
}

function buildListeningGroupTemplate(range: ListeningImportPlanRange): Record<string, unknown> {
  const numbers = Array.from({ length: range.to - range.from + 1 }, (_, index) => range.from + index);
  if (range.typeCode === "MULTIPLE_CHOICE_MULTIPLE") {
    return {
      type: range.typeCode,
      text: "[Shared question stem for the two answers]",
      options: ["[Option A]", "[Option B]", "[Option C]", "[Option D]"],
      questions: numbers.map((number) => ({
        number,
        answer: "[Correct option letter]",
        explanation: `[Brief explanation for Q${number}, based on the recording]`,
      })),
    };
  }
  if (["SENTENCE_COMPLETION", "TABLE_COMPLETION", "FLOW_CHART_COMPLETION", "SUMMARY_COMPLETION", "NOTES_COMPLETION"].includes(range.typeCode)) {
    return {
      type: range.typeCode,
      instruction: "[Task instructions and word limit]",
      content: numbers.map((number) => `...[${number}]...`).join("\n"),
      answers: Object.fromEntries(numbers.map((number) => [String(number), `[Correct answer for Q${number}]`])),
      explanations: Object.fromEntries(numbers.map((number) => [String(number), `[Brief explanation for Q${number}]`])),
      ...(range.typeCode === "FLOW_CHART_COMPLETION" ? { options: ["[Option 1]", "[Option 2]", "[Option 3]"] } : {}),
    };
  }
  if (range.typeCode === "MATCHING_FEATURES") {
    return {
      type: range.typeCode,
      options: ["[Option A]", "[Option B]", "[Option C]"],
      questions: numbers.map((number) => ({
        number,
        text: `[Matching statement for Q${number}]`,
        answer: "[Correct option letter]",
        explanation: `[Brief explanation for Q${number}, based on the recording]`,
      })),
    };
  }
  if (range.typeCode === "DIAGRAM_LABELLING") {
    return {
      type: range.typeCode,
      imageUrl: "[Diagram image URL, if available]",
      options: ["A", "B", "C", "D", "E", "F", "G"],
      questions: numbers.map((number) => ({
        number,
        text: `[Diagram label for Q${number}]`,
        answer: "[Correct letter]",
        explanation: `[Brief explanation for Q${number}, based on the recording]`,
      })),
    };
  }
  return {
    type: range.typeCode,
    questions: numbers.map((number) => buildListeningQuestionTemplate(range.typeCode as ListeningQuestionType, number)),
  };
}

export function buildListeningAiPromptTemplate(ranges: ListeningImportPlanRange[]): string {
  const sections = [1, 2, 3, 4].map((sectionNumber) => {
    const groups = ranges
      .filter((range) => range.sectionNumber === sectionNumber)
      .sort((a, b) => a.from - b.from)
      .map(buildListeningGroupTemplate);
    return groups.length > 0
      ? {
          sectionNumber,
          title: `Section ${sectionNumber}`,
          script: `[Paste the Section ${sectionNumber} transcript here]`,
          groups,
        }
      : null;
  }).filter((section) => section !== null);
  const plan = ranges.slice().sort((a, b) => a.from - b.from).map((range) =>
    `Q${range.from}-${range.to} (Section ${range.sectionNumber}): ${LISTENING_QUESTION_TYPES.find((type) => type.value === range.typeCode)?.label ?? range.typeCode}`
  ).join("\n");

  return [
    "Convert the source IELTS Listening material below into JSON for my exam builder. Return ONLY valid JSON.",
    "Keep every planned question number, section, and question type exactly as shown. Include correct answers and concise explanations supported by the recording/transcript.",
    "For notes, summaries, tables, flow charts, and sentence completion, place each blank in content using [question number] and provide answers and explanations keyed by question number.",
    "For multiple choice, include the options on each question and give the answer as a letter. For Double MCQ, include exactly two question entries with separate answers and shared options.",
    "For Matching Features, include a shared options list and answer letters. For Diagram Labelling, include the imageUrl if available, label options, and answer letters.",
    "Use original or authorized questions and transcripts only. Do not copy copyrighted questions or transcripts.",
    "",
    "Question plan:",
    plan,
    "",
    "Replace the placeholders in this JSON template with the supplied source material:",
    JSON.stringify({ sections }, null, 2),
    "",
    "SOURCE MATERIAL (paste original or authorized listening questions, options, answers, and transcript below):",
    "[PASTE SOURCE MATERIAL HERE]",
  ].join("\n");
}
