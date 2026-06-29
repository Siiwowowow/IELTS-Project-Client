export interface ISpeakingQuestion {
  id: string;
  partId: string;
  questionText: string;
  audioUrl?: string | null;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ISpeakingPart {
  id: string;
  examId: string;
  partNumber: number;
  title: string;
  instruction?: string | null;
  preparationTime: number;
  speakingTime: number;
  order: number;
  questions: ISpeakingQuestion[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ISpeakingExam {
  id: string;
  title: string;
  description?: string | null;
  duration: number;
  isPublished: boolean;
  creatorEmail?: string | null;
  parts?: ISpeakingPart[];
  _count?: {
    parts: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ISpeakingAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  audioUrl?: string | null;
  fluencyScore?: number | null;
  lexicalScore?: number | null;
  grammarScore?: number | null;
  pronunciationScore?: number | null;
  bandScore?: number | null;
  feedback?: string | null;
  question?: ISpeakingQuestion;
  createdAt?: string;
  updatedAt?: string;
}

export interface ISpeakingAttempt {
  id: string;
  userId: string;
  examId: string;
  startTime: string;
  endTime?: string | null;
  status: 'IN_PROGRESS' | 'SUBMITTED';
  bandScore?: number | null;
  answers?: ISpeakingAnswer[];
  exam?: {
    title: string;
    duration: number;
  };
  createdAt?: string;
  updatedAt?: string;
}
