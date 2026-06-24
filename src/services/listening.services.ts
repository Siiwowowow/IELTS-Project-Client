/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/listening.services.ts
import { httpClient } from '@/lib/axios/httpClient';
import {
  IListeningAttemptHistory,
  IListeningAttemptResult,
  IListeningExam,
  IListeningSubmitAttempt,
} from '@/types/listening.types';

export const listeningService = {
  /** GET /listening/exams  – published listening exams for students */
  getAllExams: (params?: any) => httpClient.get<IListeningExam[]>('/listening/exams', { params }),

  /** GET /listening/exams/:id  – full exam details (answers stripped for students) */
  getExamById: (id: string) => httpClient.get<IListeningExam>(`/listening/exams/${id}`),

  /** POST /listening/exams/:id/submit – submit answers */
  submitAttempt: (examId: string, payload: IListeningSubmitAttempt) =>
    httpClient.post<IListeningAttemptResult>(`/listening/exams/${examId}/submit`, payload),

  /** GET /listening/attempts/:attemptId/review – review student answers */
  getAttemptReview: (attemptId: string) =>
    httpClient.get<IListeningAttemptResult>(`/listening/attempts/${attemptId}/review`),

  /** GET /listening/exams/history  – student's past attempts */
  getAttemptHistory: () =>
    httpClient.get<IListeningAttemptHistory[]>('/listening/exams/history'),

  /** POST /listening/exams – Create a full listening exam (Teacher/Admin) */
  createExam: (payload: any) =>
    httpClient.post<IListeningExam>('/listening/exams', payload),

  /** PATCH /listening/exams/:id – Update exam (Teacher/Admin) */
  updateExam: (id: string, payload: any) =>
    httpClient.patch<IListeningExam>(`/listening/exams/${id}`, payload),

  /** DELETE /listening/exams/:id – Delete exam (Teacher/Admin) */
  deleteExam: (id: string) =>
    httpClient.delete<void>(`/listening/exams/${id}`),

  /** POST /listening/upload – Upload audio file (Teacher/Admin) */
  uploadAudio: (formData: FormData) =>
    httpClient.post<{ url: string }>('/listening/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 600000, // 10 minutes timeout for large audio files
    }),
};
