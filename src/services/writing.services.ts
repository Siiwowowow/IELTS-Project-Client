/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/writing.services.ts
import { httpClient } from '@/lib/axios/httpClient';
import { IWritingExam } from '@/types/writing.types';

export const writingService = {
  /** POST /writing/exams – Create a full writing exam with tasks (Teacher/Admin) */
  createExam: (payload: any) =>
    httpClient.post<IWritingExam>('/writing/exams', payload),

  /** GET /writing/exams – Fetch all writing exams */
  getAllExams: (params?: any) =>
    httpClient.get<IWritingExam[]>('/writing/exams', { params }),

  /** GET /writing/exams/:id – Fetch single writing exam with tasks */
  getExamById: (id: string) =>
    httpClient.get<IWritingExam>(`/writing/exams/${id}`),

  /** PATCH /writing/exams/:id – Update writing exam (Teacher/Admin) */
  updateExam: (id: string, payload: any) =>
    httpClient.patch<IWritingExam>(`/writing/exams/${id}`, payload),

  /** DELETE /writing/exams/:id – Delete writing exam (Teacher/Admin) */
  deleteExam: (id: string) =>
    httpClient.delete<void>(`/writing/exams/${id}`),

  /** POST /writing/upload – Upload image/PDF stimulus (Teacher/Admin) */
  uploadFile: (formData: FormData) =>
    httpClient.post<{ url: string }>('/writing/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 600000, // 10 minutes timeout for large files
    }),

  /** POST /writing/exams/:id/submit – Submit writing exam attempt responses */
  submitAttempt: (examId: string, payload: { responses: { taskId: string; essay: string; wordCount?: number }[] }) =>
    httpClient.post<any>(`/writing/exams/${examId}/submit`, payload),

  /** POST /writing/attempts/:attemptId/grade – Grade student writing responses */
  gradeAttempt: (attemptId: string, payload: { grades: { responseId: string; taskAchievement: number; coherenceCohesion: number; lexicalResource: number; grammaticalRange: number; feedback?: string }[] }) =>
    httpClient.post<any>(`/writing/attempts/${attemptId}/grade`, payload),

  /** GET /writing/attempts/:attemptId/review – Retrieve review with grades and feedback */
  getAttemptReview: (attemptId: string) =>
    httpClient.get<any>(`/writing/attempts/${attemptId}/review`),

  /** GET /writing/exams/history – Student's list of attempts */
  getStudentAttemptHistory: () =>
    httpClient.get<any>('/writing/exams/history'),
};

