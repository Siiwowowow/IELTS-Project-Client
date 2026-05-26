// src/services/reading.services.ts
import { httpClient } from '@/lib/axios/httpClient';
import {
  IAttemptHistory,
  IAttemptResult,
  IExam,
  ISubmitAttempt,
} from '@/types/reading.types';

export const readingService = {
  /** GET /reading/exams  – published exams for students */
  getAllExams: () => httpClient.get<IExam[]>('/reading/exams'),

  /** GET /reading/exams/:id  – full exam (answers stripped for students) */
  getExamById: (id: string) => httpClient.get<IExam>(`/reading/exams/${id}`),

  /** POST /reading/exams/:id/submit */
  submitAttempt: (examId: string, payload: ISubmitAttempt) =>
    httpClient.post<IAttemptResult>(`/reading/exams/${examId}/submit`, payload),

  /** GET /reading/attempts/:attemptId/review */
  getAttemptReview: (attemptId: string) =>
    httpClient.get<IAttemptResult>(`/reading/attempts/${attemptId}/review`),

  /** GET /reading/exams/history  – student's past attempts */
  getAttemptHistory: () =>
    httpClient.get<IAttemptHistory[]>('/reading/exams/history'),
};
