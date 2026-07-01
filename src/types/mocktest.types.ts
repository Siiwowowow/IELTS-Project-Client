// src/types/mocktest.types.ts
import { IExam } from "./reading.types";
import { IListeningExam } from "./listening.types";
import { IWritingExam } from "./writing.types";
import { ISpeakingExam } from "./speaking.types";

export interface IMockTest {
  id: string;
  title: string;
  description?: string;
  isPublished: boolean;
  isPremium: boolean;
  readingExamId?: string | null;
  readingExam?: IExam | null;
  listeningExamId?: string | null;
  listeningExam?: IListeningExam | null;
  writingExamId?: string | null;
  writingExam?: IWritingExam | null;
  speakingExamId?: string | null;
  speakingExam?: ISpeakingExam | null;
  createdAt: string;
  updatedAt: string;
  creatorEmail?: string | null;
}

export interface IUserMockAttempt {
  id: string;
  userId: string;
  mockTestId: string;
  mockTest: IMockTest;
  readingAttemptId?: string | null;
  listeningAttemptId?: string | null;
  writingAttemptId?: string | null;
  speakingAttemptId?: string | null;
  status: "IN_PROGRESS" | "SUBMITTED";
  createdAt: string;
  updatedAt: string;

  // Rich response fields calculated on the backend
  readingAttempt?: any | null;
  listeningAttempt?: any | null;
  writingAttempt?: any | null;
  speakingAttempt?: any | null;
  allSectionsCompleted?: boolean;
  allSectionsGraded?: boolean;
  overallBandScore?: number | null;
}
