// src/types/writing.types.ts

export type WritingExamType = 'ACADEMIC' | 'GENERAL_TRAINING';
export type WritingTaskType = 'TASK_1' | 'TASK_2';

export interface IWritingTask {
  id: string;
  examId: string;
  taskType: WritingTaskType;
  instruction: string;
  imageUrl?: string | null;
  pdfUrl?: string | null;
  minWords: number;
  modelAnswer?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface IWritingExam {
  id: string;
  title: string;
  description?: string | null;
  examType: WritingExamType;
  duration: number;
  isPublished: boolean;
  creatorEmail?: string | null;
  tasks: IWritingTask[];
  _count?: {
    tasks: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ICreateWritingTaskPayload {
  taskType: WritingTaskType;
  instruction: string;
  imageUrl?: string;
  pdfUrl?: string;
  minWords?: number;
  modelAnswer?: string;
  order: number;
}

export interface ICreateWritingExamPayload {
  title: string;
  description?: string;
  examType?: WritingExamType;
  duration?: number;
  isPublished?: boolean;
  tasks?: ICreateWritingTaskPayload[];
}

export interface IUserWritingResponse {
  id: string;
  attemptId: string;
  taskId: string;
  essay: string | null;
  wordCount: number | null;
  taskAchievement: number | null;
  coherenceCohesion: number | null;
  lexicalResource: number | null;
  grammaticalRange: number | null;
  taskBandScore: number | null;
  feedback: string | null;
  task: IWritingTask;
  createdAt: string;
  updatedAt: string;
}

export interface IUserWritingAttempt {
  id: string;
  userId: string;
  examId: string;
  startTime: string;
  endTime: string | null;
  status: 'IN_PROGRESS' | 'SUBMITTED';
  bandScore: number | null;
  responses: IUserWritingResponse[];
  exam: IWritingExam;
  createdAt: string;
  updatedAt: string;
}

