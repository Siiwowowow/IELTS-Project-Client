/* eslint-disable @typescript-eslint/no-explicit-any */
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
  getAllExams: (params?: any) => httpClient.get<IExam[]>('/reading/exams', { params }),

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

  /** POST /reading/exams – Create a full exam (Teacher/Admin) */
  createExam: (payload: any) =>
    httpClient.post<IExam>('/reading/exams', payload),

  /** PATCH /reading/exams/:id – Update an exam (Teacher/Admin) */
  updateExam: (id: string, payload: any) =>
    httpClient.patch<IExam>(`/reading/exams/${id}`, payload),

  /** DELETE /reading/exams/:id – Delete an exam (Teacher/Admin) */
  deleteExam: (id: string) =>
    httpClient.delete<void>(`/reading/exams/${id}`),

  /** POST /reading/upload – Upload exam file (PDF/Image) */
  uploadFile: (formData: FormData) =>
    httpClient.post<{ url: string }>('/reading/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};
