export type SpeakingCriterionAssessment = {
  score: number;
  rationaleBn: string;
  strengths: string[];
  improvements: string[];
};

export type SpeakingGrammarCorrection = {
  original: string;
  corrected: string;
  explanationBn: string;
  improvedVersion?: string;
};

export type SpeakingVocabularyImprovement = {
  original: string;
  suggested: string;
  explanationBn: string;
};

export type SpeakingPronunciationTip = {
  wordOrPhrase: string;
  phoneticTipBn: string;
};

export type SpeakingQuestionAssessment = {
  questionId: string;
  answerId: string;
  transcript: string;
  fluencyScore: number;
  lexicalScore: number;
  grammarScore: number;
  pronunciationScore: number;
  bandScore: number;
  feedbackBn: string;
  grammarErrors: SpeakingGrammarCorrection[];
  vocabularyImprovements: SpeakingVocabularyImprovement[];
  pronunciationNotes: SpeakingPronunciationTip[];
  modelAnswer: string;
};

export type SpeakingAssessmentRequest = {
  questionId: string;
  answerId: string;
  audioUrl?: string | null;
  partNumber: number;
  partTitle: string;
  questionText: string;
  instruction?: string | null;
};

export type StoredSpeakingAssessment = {
  version: 1;
  attemptId: string;
  createdAt: string;
  overallBand: number;
  fluencyScore: number;
  lexicalScore: number;
  grammarScore: number;
  pronunciationScore: number;
  fluencyCoherence: SpeakingCriterionAssessment;
  lexicalResource: SpeakingCriterionAssessment;
  grammaticalRangeAccuracy: SpeakingCriterionAssessment;
  pronunciation: SpeakingCriterionAssessment;
  summaryBn: string;
  bandImprovementAdviceBn: string[];
  disclaimerBn: string;
  answers: Record<string, SpeakingQuestionAssessment>;
};

export type PendingSpeakingAssessment = {
  version: 1;
  attemptId: string;
  examId: string;
  questions: SpeakingAssessmentRequest[];
};

export const speakingAssessmentStorageKey = (attemptId: string) =>
  `ielts-speaking-ai-assessment:${attemptId}`;

export const pendingSpeakingAssessmentStorageKey = (attemptId: string) =>
  `ielts-speaking-ai-pending:${attemptId}`;
