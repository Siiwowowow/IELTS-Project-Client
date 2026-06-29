/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/speaking.services.ts
import { httpClient } from '@/lib/axios/httpClient';
import { ISpeakingExam } from '@/types/speaking.types';

export const speakingService = {
  /** POST /speaking/exams – Create a full speaking exam with parts (Teacher/Admin) */
  createExam: (payload: any) =>
    httpClient.post<ISpeakingExam>('/speaking/exams', payload),

  /** GET /speaking/exams – Fetch all speaking exams */
  getAllExams: (params?: any) =>
    httpClient.get<ISpeakingExam[]>('/speaking/exams', { params }),

  /** GET /speaking/exams/:id – Fetch single speaking exam with parts & questions */
  getExamById: (id: string) =>
    httpClient.get<ISpeakingExam>(`/speaking/exams/${id}`),

  /** PATCH /speaking/exams/:id – Update speaking exam (Teacher/Admin) */
  updateExam: (id: string, payload: any) =>
    httpClient.patch<ISpeakingExam>(`/speaking/exams/${id}`, payload),

  /** DELETE /speaking/exams/:id – Delete speaking exam (Teacher/Admin) */
  deleteExam: (id: string) =>
    httpClient.delete<void>(`/speaking/exams/${id}`),

  /** POST /speaking/upload – Upload recorded audio response */
  uploadAudio: (formData: FormData) =>
    httpClient.post<{ url: string }>('/speaking/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 600000, // 10 minutes timeout for large files
    }),

  /** POST /speaking/exams/:id/submit – Submit speaking exam attempt audio responses */
  submitAttempt: (examId: string, payload: { answers: { questionId: string; audioUrl: string | null }[] }) =>
    httpClient.post<any>(`/speaking/exams/${examId}/submit`, payload),

  /** POST /speaking/attempts/:attemptId/grade – Grade student speaking answers */
  gradeAttempt: (attemptId: string, payload: { grades: { answerId: string; fluencyScore: number; lexicalScore: number; grammarScore: number; pronunciationScore: number; feedback?: string }[] }) =>
    httpClient.post<any>(`/speaking/attempts/${attemptId}/grade`, payload),

  /** GET /speaking/attempts/:attemptId/review – Retrieve review with grades and feedback */
  getAttemptReview: (attemptId: string) =>
    httpClient.get<any>(`/speaking/attempts/${attemptId}/review`),

  /** GET /speaking/exams/history – Student's list of speaking attempts */
  getStudentAttemptHistory: () =>
    httpClient.get<any>('/speaking/exams/history'),
};
