type JsonRecord = Record<string, unknown>;

interface FullMockQuestion {
  questionNumber: number;
  questionText: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

interface FullMockQuestionGroup {
  type: string;
  instruction?: string;
  passageSegment?: string;
  options?: string[];
  imageUrl?: string;
  order?: number;
  questions: FullMockQuestion[];
}

const LISTENING_QUESTION_TYPES = new Set([
  "SENTENCE_COMPLETION",
  "MULTIPLE_CHOICE",
  "MULTIPLE_CHOICE_MULTIPLE",
  "MATCHING_FEATURES",
  "SHORT_ANSWER",
  "TABLE_COMPLETION",
  "FLOW_CHART_COMPLETION",
  "DIAGRAM_LABELLING",
  "SUMMARY_COMPLETION",
  "NOTES_COMPLETION",
]);

const READING_QUESTION_TYPES = new Set([
  "TRUE_FALSE_NOT_GIVEN",
  "YES_NO_NOT_GIVEN",
  "MULTIPLE_CHOICE",
  "MULTIPLE_CHOICE_MULTIPLE",
  "MATCHING_HEADINGS",
  "MATCHING_INFORMATION",
  "MATCHING_FEATURES",
  "MATCHING_SENTENCE_ENDINGS",
  "SENTENCE_COMPLETION",
  "SUMMARY_COMPLETION_WITH_OPTIONS",
  "SUMMARY_COMPLETION_WITHOUT_OPTIONS",
  "NOTES_COMPLETION",
  "TABLE_COMPLETION",
  "FLOW_CHART_COMPLETION",
  "DIAGRAM_LABELLING",
  "SHORT_ANSWER",
]);

interface ListeningSection {
  title?: string;
  audioUrl?: string;
  youtubeUrl?: string;
  script?: string;
  instruction?: string;
  order?: number;
  questionGroups: FullMockQuestionGroup[];
}

interface ReadingPassage {
  title?: string;
  subtitle?: string;
  text?: string;
  body?: string;
  instruction?: string;
  pdfUrl?: string;
  imageUrl?: string;
  order?: number;
  questionGroups: FullMockQuestionGroup[];
}

interface WritingTask {
  taskType: "TASK_1" | "TASK_2";
  instruction: string;
  imageUrl?: string;
  pdfUrl?: string;
  minWords?: number;
  modelAnswer?: string;
  order?: number;
}

interface SpeakingQuestion {
  questionText: string;
  audioUrl?: string;
  order?: number;
}

interface SpeakingPart {
  partNumber?: number;
  title?: string;
  instruction?: string;
  preparationTime?: number;
  speakingTime?: number;
  order?: number;
  questions: SpeakingQuestion[];
}

export interface FullMockJsonPayload {
  title: string;
  description: string;
  isPublished: boolean;
  isPremium: boolean;
  listeningExam: {
    title?: string;
    description?: string;
    duration?: number;
    audioUrl?: string;
    youtubeUrl?: string;
    sections: ListeningSection[];
  };
  readingExam: {
    title?: string;
    description?: string;
    duration?: number;
    passages: ReadingPassage[];
  };
  writingExam: {
    title?: string;
    description?: string;
    duration?: number;
    examType?: string;
    tasks: WritingTask[];
  };
  speakingExam: {
    title?: string;
    description?: string;
    duration?: number;
    parts: SpeakingPart[];
  };
}

export type FullMockModuleJsonKey = "writingExam" | "speakingExam";
export type FullMockModuleJsonPayload =
  | FullMockJsonPayload["writingExam"]
  | FullMockJsonPayload["speakingExam"];

export interface FullMockJsonParseResult {
  data: FullMockJsonPayload | null;
  errors: string[];
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getArray(value: unknown, path: string, errors: string[], expectedLength?: number): JsonRecord[] {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array.`);
    return [];
  }
  if (expectedLength !== undefined && value.length !== expectedLength) {
    errors.push(`${path} must contain exactly ${expectedLength} entries.`);
  }
  return value.map((item, index) => {
    if (!isRecord(item)) {
      errors.push(`${path}[${index}] must be an object.`);
      return {};
    }
    return item;
  });
}

function optionalString(source: JsonRecord, field: string, path: string, errors: string[]): string | undefined {
  const value = source[field];
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    errors.push(`${path}.${field} must be a string.`);
    return undefined;
  }
  return value;
}

function optionalNumber(source: JsonRecord, field: string, path: string, errors: string[]): number | undefined {
  const value = source[field];
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push(`${path}.${field} must be a number.`);
    return undefined;
  }
  return value;
}

function optionalStringArray(source: JsonRecord, field: string, path: string, errors: string[]): string[] | undefined {
  const value = source[field];
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    errors.push(`${path}.${field} must be an array of strings.`);
    return undefined;
  }
  return value;
}

function normalizeQuestionGroups(
  value: unknown,
  path: string,
  errors: string[],
  supportedTypes: ReadonlySet<string>,
): FullMockQuestionGroup[] {
  return getArray(value, path, errors).map((group, groupIndex) => {
    const groupPath = `${path}[${groupIndex}]`;
    const type = optionalString(group, "type", groupPath, errors);
    if (!type?.trim()) errors.push(`${groupPath}.type is required.`);
    else if (!supportedTypes.has(type)) errors.push(`${groupPath}.type is not supported for this module.`);
    const questions = getArray(group.questions, `${groupPath}.questions`, errors).map((question, questionIndex) => {
      const questionPath = `${groupPath}.questions[${questionIndex}]`;
      const questionNumber = optionalNumber(question, "questionNumber", questionPath, errors);
      if (questionNumber === undefined || !Number.isInteger(questionNumber) || questionNumber < 1) {
        errors.push(`${questionPath}.questionNumber must be a positive whole number.`);
      }
      const questionText = optionalString(question, "questionText", questionPath, errors);
      if (questionText === undefined) errors.push(`${questionPath}.questionText is required.`);
      const correctAnswer = optionalString(question, "correctAnswer", questionPath, errors);
      if (correctAnswer === undefined) errors.push(`${questionPath}.correctAnswer is required.`);
      return {
        questionNumber: questionNumber ?? 1,
        questionText: questionText ?? "",
        options: optionalStringArray(question, "options", questionPath, errors),
        correctAnswer: correctAnswer ?? "",
        explanation: optionalString(question, "explanation", questionPath, errors),
      };
    });
    return {
      type: type || "",
      instruction: optionalString(group, "instruction", groupPath, errors),
      passageSegment: optionalString(group, "passageSegment", groupPath, errors),
      options: optionalStringArray(group, "options", groupPath, errors),
      imageUrl: optionalString(group, "imageUrl", groupPath, errors),
      order: optionalNumber(group, "order", groupPath, errors),
      questions,
    };
  });
}

function normalizeListeningExam(value: unknown, errors: string[]): FullMockJsonPayload["listeningExam"] {
  if (!isRecord(value)) {
    errors.push("listeningExam must be an object.");
    return { sections: [] };
  }
  const sections = getArray(value.sections, "listeningExam.sections", errors, 4).map((section, index) => {
    const path = `listeningExam.sections[${index}]`;
    return {
      title: optionalString(section, "title", path, errors),
      audioUrl: optionalString(section, "audioUrl", path, errors),
      youtubeUrl: optionalString(section, "youtubeUrl", path, errors),
      script: optionalString(section, "script", path, errors),
      instruction: optionalString(section, "instruction", path, errors),
      order: optionalNumber(section, "order", path, errors) ?? index + 1,
      questionGroups: normalizeQuestionGroups(
        section.questionGroups,
        `${path}.questionGroups`,
        errors,
        LISTENING_QUESTION_TYPES,
      ),
    };
  });
  return {
    title: optionalString(value, "title", "listeningExam", errors),
    description: optionalString(value, "description", "listeningExam", errors),
    duration: optionalNumber(value, "duration", "listeningExam", errors),
    audioUrl: optionalString(value, "audioUrl", "listeningExam", errors),
    youtubeUrl: optionalString(value, "youtubeUrl", "listeningExam", errors),
    sections,
  };
}

function normalizeReadingExam(value: unknown, errors: string[]): FullMockJsonPayload["readingExam"] {
  if (!isRecord(value)) {
    errors.push("readingExam must be an object.");
    return { passages: [] };
  }
  const passages = getArray(value.passages, "readingExam.passages", errors, 3).map((passage, index) => {
    const path = `readingExam.passages[${index}]`;
    return {
      title: optionalString(passage, "title", path, errors),
      subtitle: optionalString(passage, "subtitle", path, errors),
      text: optionalString(passage, "text", path, errors),
      body: optionalString(passage, "body", path, errors),
      instruction: optionalString(passage, "instruction", path, errors),
      pdfUrl: optionalString(passage, "pdfUrl", path, errors),
      imageUrl: optionalString(passage, "imageUrl", path, errors),
      order: optionalNumber(passage, "order", path, errors) ?? index + 1,
      questionGroups: normalizeQuestionGroups(
        passage.questionGroups,
        `${path}.questionGroups`,
        errors,
        READING_QUESTION_TYPES,
      ),
    };
  });
  return {
    title: optionalString(value, "title", "readingExam", errors),
    description: optionalString(value, "description", "readingExam", errors),
    duration: optionalNumber(value, "duration", "readingExam", errors),
    passages,
  };
}

function normalizeWritingExam(value: unknown, errors: string[]): FullMockJsonPayload["writingExam"] {
  if (!isRecord(value)) {
    errors.push("writingExam must be an object.");
    return { tasks: [] };
  }
  const tasks = getArray(value.tasks, "writingExam.tasks", errors, 2).map((task, index) => {
    const path = `writingExam.tasks[${index}]`;
    const taskType = task.taskType;
    if (taskType !== "TASK_1" && taskType !== "TASK_2") {
      errors.push(`${path}.taskType must be TASK_1 or TASK_2.`);
    }
    const instruction = optionalString(task, "instruction", path, errors);
    if (instruction === undefined) errors.push(`${path}.instruction is required.`);
    return {
      taskType: taskType === "TASK_2" ? "TASK_2" as const : "TASK_1" as const,
      instruction: instruction ?? "",
      imageUrl: optionalString(task, "imageUrl", path, errors),
      pdfUrl: optionalString(task, "pdfUrl", path, errors),
      minWords: optionalNumber(task, "minWords", path, errors),
      modelAnswer: optionalString(task, "modelAnswer", path, errors),
      order: optionalNumber(task, "order", path, errors) ?? index + 1,
    };
  });
  if (tasks.length === 2 && (tasks[0].taskType !== "TASK_1" || tasks[1].taskType !== "TASK_2")) {
    errors.push("writingExam.tasks must list TASK_1 before TASK_2.");
  }
  return {
    title: optionalString(value, "title", "writingExam", errors),
    description: optionalString(value, "description", "writingExam", errors),
    duration: optionalNumber(value, "duration", "writingExam", errors),
    examType: optionalString(value, "examType", "writingExam", errors),
    tasks,
  };
}

function normalizeSpeakingExam(value: unknown, errors: string[]): FullMockJsonPayload["speakingExam"] {
  if (!isRecord(value)) {
    errors.push("speakingExam must be an object.");
    return { parts: [] };
  }
  const parts = getArray(value.parts, "speakingExam.parts", errors, 3).map((part, index) => {
    const path = `speakingExam.parts[${index}]`;
    const questions = getArray(part.questions, `${path}.questions`, errors).map((question, questionIndex) => {
      const questionPath = `${path}.questions[${questionIndex}]`;
      const questionText = optionalString(question, "questionText", questionPath, errors);
      if (questionText === undefined) errors.push(`${questionPath}.questionText is required.`);
      return {
        questionText: questionText ?? "",
        audioUrl: optionalString(question, "audioUrl", questionPath, errors),
        order: optionalNumber(question, "order", questionPath, errors) ?? questionIndex + 1,
      };
    });
    const partNumber = optionalNumber(part, "partNumber", path, errors);
    if (partNumber !== undefined && partNumber !== index + 1) {
      errors.push(`${path}.partNumber must be ${index + 1}.`);
    }
    return {
      partNumber: partNumber ?? index + 1,
      title: optionalString(part, "title", path, errors),
      instruction: optionalString(part, "instruction", path, errors),
      preparationTime: optionalNumber(part, "preparationTime", path, errors),
      speakingTime: optionalNumber(part, "speakingTime", path, errors),
      order: optionalNumber(part, "order", path, errors) ?? index + 1,
      questions,
    };
  });
  return {
    title: optionalString(value, "title", "speakingExam", errors),
    description: optionalString(value, "description", "speakingExam", errors),
    duration: optionalNumber(value, "duration", "speakingExam", errors),
    parts,
  };
}

export function parseFullMockJson(input: string): FullMockJsonParseResult {
  const errors: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    return {
      data: null,
      errors: [error instanceof Error ? `Invalid JSON: ${error.message}` : "Invalid JSON."],
    };
  }

  if (!isRecord(parsed)) {
    return { data: null, errors: ["Full Mock JSON must be a JSON object."] };
  }
  const source = isRecord(parsed.mockTest) ? parsed.mockTest : parsed;
  if (typeof source.title !== "string" || !source.title.trim()) {
    errors.push("title is required.");
  }
  if (typeof source.description !== "string") {
    errors.push("description must be a string.");
  }
  if (typeof source.isPublished !== "boolean") {
    errors.push("isPublished must be true or false.");
  }
  if (typeof source.isPremium !== "boolean") {
    errors.push("isPremium must be true or false.");
  }

  const data: FullMockJsonPayload = {
    title: typeof source.title === "string" ? source.title : "",
    description: typeof source.description === "string" ? source.description : "",
    isPublished: Boolean(source.isPublished),
    isPremium: Boolean(source.isPremium),
    listeningExam: normalizeListeningExam(source.listeningExam, errors),
    readingExam: normalizeReadingExam(source.readingExam, errors),
    writingExam: normalizeWritingExam(source.writingExam, errors),
    speakingExam: normalizeSpeakingExam(source.speakingExam, errors),
  };

  return { data: errors.length === 0 ? data : null, errors };
}

export function serializeFullMockJson(payload: FullMockJsonPayload): string {
  return JSON.stringify(payload, null, 2);
}

export const FULL_MOCK_JSON_SAMPLE = `{
  "title": "IELTS Academic Full Mock Test 1",
  "description": "Complete Listening, Reading, Writing and Speaking practice.",
  "isPublished": false,
  "isPremium": false,
  "listeningExam": {
    "title": "Listening Test 1",
    "description": "Four listening sections.",
    "duration": 30,
    "audioUrl": "",
    "youtubeUrl": "",
    "sections": [
      { "title": "Section 1", "audioUrl": "", "youtubeUrl": "", "script": "", "instruction": "", "order": 1, "questionGroups": [] },
      { "title": "Section 2", "audioUrl": "", "youtubeUrl": "", "script": "", "instruction": "", "order": 2, "questionGroups": [] },
      { "title": "Section 3", "audioUrl": "", "youtubeUrl": "", "script": "", "instruction": "", "order": 3, "questionGroups": [] },
      { "title": "Section 4", "audioUrl": "", "youtubeUrl": "", "script": "", "instruction": "", "order": 4, "questionGroups": [] }
    ]
  },
  "readingExam": {
    "title": "Reading Test 1",
    "description": "Three reading passages.",
    "duration": 60,
    "passages": [
      { "title": "Passage 1", "body": "Original or authorized passage text.", "instruction": "", "order": 1, "questionGroups": [] },
      { "title": "Passage 2", "body": "Original or authorized passage text.", "instruction": "", "order": 2, "questionGroups": [] },
      { "title": "Passage 3", "body": "Original or authorized passage text.", "instruction": "", "order": 3, "questionGroups": [] }
    ]
  },
  "writingExam": {
    "title": "Writing Test 1",
    "description": "",
    "duration": 60,
    "examType": "ACADEMIC",
    "tasks": [
      { "taskType": "TASK_1", "instruction": "Describe the chart. Write at least 150 words.", "imageUrl": "", "pdfUrl": "", "minWords": 150, "modelAnswer": "", "order": 1 },
      { "taskType": "TASK_2", "instruction": "Discuss the issue. Write at least 250 words.", "imageUrl": "", "pdfUrl": "", "minWords": 250, "modelAnswer": "", "order": 2 }
    ]
  },
  "speakingExam": {
    "title": "Speaking Test 1",
    "description": "",
    "duration": 15,
    "parts": [
      { "partNumber": 1, "title": "Part 1", "instruction": "Introduction and interview.", "preparationTime": 0, "speakingTime": 60, "order": 1, "questions": [{ "questionText": "What do you enjoy about your hometown?", "order": 1 }] },
      { "partNumber": 2, "title": "Part 2", "instruction": "<p>Describe a place you enjoy visiting.</p>", "preparationTime": 60, "speakingTime": 120, "order": 2, "questions": [{ "questionText": "Cue Card Long Turn Response", "order": 1 }] },
      { "partNumber": 3, "title": "Part 3", "instruction": "Discussion questions.", "preparationTime": 0, "speakingTime": 60, "order": 3, "questions": [{ "questionText": "How do public places benefit communities?", "order": 1 }] }
    ]
  }
}`;

export function parseFullMockModuleJson(
  module: FullMockModuleJsonKey,
  input: string,
): { data: FullMockModuleJsonPayload | null; errors: string[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    return {
      data: null,
      errors: [error instanceof Error ? `Invalid JSON: ${error.message}` : "Invalid JSON."],
    };
  }
  if (!isRecord(parsed)) {
    return { data: null, errors: ["Module JSON must be a JSON object."] };
  }

  const moduleValue = isRecord(parsed[module]) ? parsed[module] : parsed;
  const sample = JSON.parse(FULL_MOCK_JSON_SAMPLE) as FullMockJsonPayload;
  const result = parseFullMockJson(JSON.stringify({ ...sample, [module]: moduleValue }));
  return {
    data: result.data ? result.data[module] : null,
    errors: result.errors,
  };
}

export function buildFullMockModuleAiPrompt(module: FullMockModuleJsonKey): string {
  const isWriting = module === "writingExam";
  const sample = JSON.parse(FULL_MOCK_JSON_SAMPLE) as FullMockJsonPayload;
  const moduleName = isWriting ? "Writing" : "Speaking";
  const jsonKey = module;
  const formatGuide = [
    "FORMATTING GUIDE FOR THE INSTRUCTIONS:",
    "- Bold text: wrap only the words to emphasize in <strong>...</strong>.",
    "- Center a title or heading: use <h2 style=\"text-align:center\">Heading</h2>.",
    "- Add a paragraph gap: use separate <p>...</p> blocks; for a small line break use <br/>.",
    "- Show bullet dots: use <ul><li>First point</li><li>Second point</li></ul>.",
    "- Show numbered points: use <ol><li>First point</li><li>Second point</li></ol>.",
    "- Do not show bullet dots: use plain text or separate <p>...</p> lines; do not begin lines with -, *, or •.",
    "- Keep the tags balanced and keep formatting inside instruction fields, not answer keys or URLs.",
  ];

  const moduleRules = isWriting
    ? [
        "Return a writingExam object with exactly two tasks in order: TASK_1 then TASK_2.",
        "Each task needs instruction, minWords, modelAnswer, order, and imageUrl/pdfUrl when relevant.",
        "Keep task instructions in HTML if formatting is needed. Use original or authorized prompts only.",
      ]
    : [
        "Return a speakingExam object with exactly three parts in order, numbered 1, 2, and 3.",
        "Each part needs title, instruction, preparationTime, speakingTime, order, and questions.",
        "Put the Part 2 cue card and its bullet points in that part's instruction. Include the standard question text \"Cue Card Long Turn Response\" in Part 2.",
        "Put every Part 1 and Part 3 prompt in questions with questionText, order, and audioUrl when supplied.",
      ];

  return [
    `Create the ${moduleName} module for my IELTS Full Mock Test builder. Return ONLY valid JSON for "${jsonKey}".`,
    ...moduleRules,
    "Preserve the provided task/part ordering and all supplied information. Do not invent missing answers or media URLs.",
    ...formatGuide,
    "",
    "Use this JSON structure as a template and replace every placeholder:",
    JSON.stringify(sample[module], null, 2),
    "",
    "SOURCE MATERIAL (paste original or authorized material here):",
    "[PASTE SOURCE MATERIAL HERE]",
  ].join("\n");
}

export const FULL_MOCK_AI_PROMPT = `Create a complete IELTS Full Mock Test as JSON for my exam builder. Return ONLY valid JSON.

The JSON must contain all four modules: listeningExam, readingExam, writingExam, and speakingExam. Use the exact API field names and structure below. Do not remove section, passage, task, or part order.

Listening: include 4 sections. Each section has questionGroups; each group has type, instruction, passageSegment, options, imageUrl, order, and questions. Supported types: SENTENCE_COMPLETION, MULTIPLE_CHOICE, MULTIPLE_CHOICE_MULTIPLE, MATCHING_FEATURES, SHORT_ANSWER, TABLE_COMPLETION, FLOW_CHART_COMPLETION, DIAGRAM_LABELLING, SUMMARY_COMPLETION, NOTES_COMPLETION. For blanks use [question number] in passageSegment and give each question its questionNumber, correctAnswer, and explanation.

Reading: include 3 passages with title, body, instruction, order, and questionGroups. Use the official reading type codes: TRUE_FALSE_NOT_GIVEN, YES_NO_NOT_GIVEN, MULTIPLE_CHOICE, MULTIPLE_CHOICE_MULTIPLE, MATCHING_HEADINGS, MATCHING_INFORMATION, MATCHING_FEATURES, MATCHING_SENTENCE_ENDINGS, SENTENCE_COMPLETION, SUMMARY_COMPLETION_WITH_OPTIONS, SUMMARY_COMPLETION_WITHOUT_OPTIONS, NOTES_COMPLETION, TABLE_COMPLETION, FLOW_CHART_COMPLETION, DIAGRAM_LABELLING, SHORT_ANSWER. Each question needs questionNumber, questionText, correctAnswer, and explanation. Group options, passageSegment, and imageUrl go on their questionGroup.

Writing: include exactly two tasks, TASK_1 and TASK_2, with instruction, minWords, modelAnswer, imageUrl/pdfUrl when needed, and order. Preserve HTML in instructions if required by the editor.

Speaking: include exactly 3 parts. Each part has partNumber, title, instruction, preparationTime, speakingTime, order, and questions containing questionText, audioUrl when supplied, and order. For Part 2 keep the cue-card content in instruction and include the standard "Cue Card Long Turn Response" question.

Include top-level title, description, isPublished, and isPremium. Add correct answers and short explanations for all Listening and Reading questions. Use original or authorized source material only; do not copy copyrighted questions, passages, or audio transcripts.

Replace the sample content with the supplied material:
${FULL_MOCK_JSON_SAMPLE}

SOURCE MATERIAL:
[PASTE ORIGINAL OR AUTHORIZED LISTENING, READING, WRITING AND SPEAKING MATERIAL HERE]`;
