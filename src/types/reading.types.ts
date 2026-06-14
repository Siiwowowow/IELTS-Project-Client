// src/types/reading.types.ts

export type QuestionGroupType =
  | 'TRUE_FALSE_NOT_GIVEN'
  | 'YES_NO_NOT_GIVEN'
  | 'MULTIPLE_CHOICE'
  | 'SHORT_ANSWER'
  | 'SENTENCE_COMPLETION'
  | 'SUMMARY_COMPLETION'
  | 'MATCHING_HEADINGS'
  | 'MATCHING_FEATURES'
  | 'MATCHING_SENTENCE_ENDINGS'
  | 'DIAGRAM_LABELLING'
  | 'FLOW_CHART_COMPLETION'
  | 'TABLE_COMPLETION'
  | 'MATCHING_INFORMATION'
  | 'SUMMARY_COMPLETION_WITH_OPTIONS'
  | 'SUMMARY_COMPLETION_WITHOUT_OPTIONS'
  | 'NOTES_COMPLETION';

export interface IQuestion {
  id: string;
  groupId: string;
  questionNumber: number;
  questionText?: string;
  options?: string[];
  correctAnswer?: string; // stripped for students on exam fetch
  explanation?: string;   // stripped for students on exam fetch
}

export interface IQuestionGroup {
  id: string;
  passageId: string;
  type: QuestionGroupType;
  instruction?: string;
  passageSegment?: string;
  options?: string[];       // heading list / feature list etc.
  imageUrl?: string;
  order: number;
  questions: IQuestion[];
}

export interface IPassage {
  id: string;
  examId: string;
  title: string;
  text?: string;
  pdfUrl?: string;
  imageUrl?: string;
  order: number;
  questionGroups: IQuestionGroup[];
}

export interface IExam {
  id: string;
  title: string;
  description?: string;
  duration: number;           // minutes
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  passages?: IPassage[];
  _count?: { passages: number };
}

// ---------- Submission ----------

export interface ISubmitAnswer {
  questionId: string;
  submittedAnswer: string;
}

export interface ISubmitAttempt {
  answers: ISubmitAnswer[];
}

// ---------- Attempt / Review ----------

export interface IAnswerWithQuestion {
  id: string;
  attemptId: string;
  questionId: string;
  submittedAnswer: string;
  isCorrect: boolean;
  question: IQuestion & {
    group: IQuestionGroup & {
      passage: { title: string };
    };
  };
}

export interface IAttemptResult {
  id: string;
  userId: string;
  examId: string;
  startTime: string;
  endTime: string;
  status: string;
  score: number;
  bandScore: number;
  answers: IAnswerWithQuestion[];
  exam: { title: string; duration: number };
}

export interface IAttemptHistory {
  id: string;
  examId: string;
  score: number;
  bandScore: number;
  status: string;
  createdAt: string;
  exam: { title: string; duration: number };
}
