export type WritingAssessmentRequest = {
  examType: "ACADEMIC" | "GENERAL_TRAINING";
  taskType: "TASK_1" | "TASK_2";
  prompt: string;
  essay: string;
  minWords: number;
  imageUrl?: string | null;
};

export type CriterionAssessment = {
  score: number;
  rationaleBn: string;
  strengths: string[];
  improvements: string[];
};

export type WritingCorrection = {
  original: string;
  corrected: string;
  explanationBn: string;
  improvedVersion: string;
};

export type SpellingCorrection = {
  original: string;
  corrected: string;
  explanationBn: string;
};

export type RelevanceIssue = {
  excerpt: string;
  reasonBn: string;
  issueType: "IRRELEVANT" | "INACCURATE_DATA" | "UNSUPPORTED_CLAIM" | "MISSED_KEY_FEATURE";
};

export type LanguageIssue = {
  original: string;
  corrected: string;
  explanationBn: string;
};

export type SentenceAnalysis = {
  simpleCount: number;
  compoundCount: number;
  complexCount: number;
  compoundComplexCount: number;
  fragmentCount: number;
  runOnCount: number;
  feedbackBn: string;
};

export type CohesionAnalysis = {
  effectiveConnectors: string[];
  misusedOrOverusedConnectors: LanguageIssue[];
  feedbackBn: string;
};

export type WritingAssessment = {
  [x: string]: any;
  taskType: "TASK_1" | "TASK_2";
  wordCount: number;
  taskBandScore: number;
  taskAchievement: CriterionAssessment;
  coherenceCohesion: CriterionAssessment;
  lexicalResource: CriterionAssessment;
  grammaticalRangeAccuracy: CriterionAssessment;
  grammarErrors: WritingCorrection[];
  spellingErrors: SpellingCorrection[];
  vocabularyErrors: LanguageIssue[];
  punctuationErrors: LanguageIssue[];
  relevanceIssues: RelevanceIssue[];
  sentenceAnalysis: SentenceAnalysis;
  cohesionAnalysis: CohesionAnalysis;
  summaryBn: string;
  bandImprovementAdviceBn: string[];
  correctedEssay: string;
  higherBandSample: string;
  disclaimerBn: string;
};

export type StoredWritingAssessment = {
  version: 1;
  attemptId: string;
  createdAt: string;
  overallBand: number;
  tasks: Record<string, WritingAssessment>;
};

export type PendingWritingAssessment = {
  version: 1;
  attemptId: string;
  tasks: Array<{
    taskId: string;
    request: WritingAssessmentRequest;
  }>;
};

export const writingAssessmentStorageKey = (attemptId: string) =>
  `ielts-writing-ai-assessment:${attemptId}`;

export const pendingWritingAssessmentStorageKey = (attemptId: string) =>
  `ielts-writing-ai-pending:${attemptId}`;
