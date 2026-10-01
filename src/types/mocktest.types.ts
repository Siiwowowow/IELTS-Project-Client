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
  attempts?: IUserMockAttempt[];
  _count?: {
    attempts?: number;
  };
}

interface IMockModuleAttempt {
  id: string;
  status: "IN_PROGRESS" | "SUBMITTED" | "GRADED" | string;
  bandScore?: number | null;
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
  readingAttempt?: IMockModuleAttempt | null;
  listeningAttempt?: IMockModuleAttempt | null;
  writingAttempt?: IMockModuleAttempt | null;
  speakingAttempt?: IMockModuleAttempt | null;
  allSectionsCompleted?: boolean;
  allSectionsGraded?: boolean;
  overallBandScore?: number | null;
}

export type DashboardModule = "reading" | "listening" | "writing" | "speaking";

export interface IStudentDashboard {
  overview: {
    mockTestsStarted: number;
    mockTestsCompleted: number;
    practiceAttempts: number;
    overallBandScore: number | null;
  };
  moduleStats: Array<{
    module: DashboardModule;
    totalAttempts: number;
    completedAttempts: number;
    averageBandScore: number | null;
    latestBandScore: number | null;
    change: number | null;
  }>;
  mockHistory: Array<{
    id: string;
    mockTestId: string;
    title: string;
    status: "IN_PROGRESS" | "SUBMITTED";
    startedAt: string;
    completedAt: string | null;
    overallBandScore: number | null;
    sectionScores: Record<DashboardModule, number | null>;
    gradedSections: number;
    expectedSections: number;
  }>;
}
