// src/types/listening.types.ts
import { QuestionGroupType } from './reading.types';

export interface IListeningQuestion {
  id: string;
  groupId: string;
  questionNumber: number;
  questionText?: string;
  options?: string[];
  correctAnswer?: string; // stripped for students on exam fetch
  explanation?: string;   // stripped for students on exam fetch
}

export interface IListeningQuestionGroup {
  id: string;
  sectionId: string;
  type: QuestionGroupType;
  instruction?: string;
  passageSegment?: string;
  options?: string[];       // heading list / feature list etc.
  imageUrl?: string;
  order: number;
  questions: IListeningQuestion[];
}

export interface IListeningSection {
  id: string;
  examId: string;
  title: string;
  audioUrl: string;
  youtubeUrl?: string;
  script?: string;
  instruction?: string;
  order: number;
  questionGroups: IListeningQuestionGroup[];
}

export interface IListeningExam {
  id: string;
  title: string;
  description?: string;
  duration: number;           // minutes
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  sections?: IListeningSection[];
  _count?: { sections: number };
}

// ---------- Submission ----------

export interface IListeningSubmitAnswer {
  questionId: string;
  submittedAnswer: string;
}

export interface IListeningSubmitAttempt {
  answers: IListeningSubmitAnswer[];
}

// ---------- Attempt / Review ----------

export interface IListeningAnswerWithQuestion {
  id: string;
  attemptId: string;
  questionId: string;
  submittedAnswer: string;
  isCorrect: boolean;
  question: IListeningQuestion & {
    group: IListeningQuestionGroup & {
      section: { title: string };
    };
  };
}

export interface IListeningAttemptResult {
  id: string;
  userId: string;
  examId: string;
  startTime: string;
  endTime: string;
  status: string;
  score: number;
  bandScore: number;
  answers: IListeningAnswerWithQuestion[];
  exam: {
    title: string;
    duration: number;
    sections?: {
      id: string;
      title: string;
      youtubeUrl?: string | null;
      script?: string | null;
      order: number;
    }[];
  };
}

export interface IListeningAttemptHistory {
  id: string;
  examId: string;
  score: number;
  bandScore: number;
  status: string;
  createdAt: string;
  exam: { title: string; duration: number };
}
