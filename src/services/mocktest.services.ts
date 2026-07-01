/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/mocktest.services.ts
import { httpClient } from '@/lib/axios/httpClient';
import { IMockTest, IUserMockAttempt } from '@/types/mocktest.types';

export const mockTestService = {
  /** Create a Full Mock Test (Teacher/Admin) */
  createMockTest: (payload: any) =>
    httpClient.post<IMockTest>('/mock-tests', payload),

  /** Create a Full Mock Test with modules created on the fly (Teacher/Admin) */
  createFullMockTest: (payload: any) =>
    httpClient.post<IMockTest>('/mock-tests/create-full', payload),

  /** Get All Full Mock Tests */
  getAllMockTests: (params?: any) =>
    httpClient.get<IMockTest[]>('/mock-tests', { params }),

  /** Get Full Mock Test by ID */
  getMockTestById: (id: string) =>
    httpClient.get<IMockTest>(`/mock-tests/${id}`),

  /** Update Full Mock Test (Teacher/Admin) */
  updateMockTest: (id: string, payload: any) =>
    httpClient.patch<IMockTest>(`/mock-tests/${id}`, payload),

  /** Delete Full Mock Test (Teacher/Admin) */
  deleteMockTest: (id: string) =>
    httpClient.delete<void>(`/mock-tests/${id}`),

  /** Start a Mock Test Attempt (Student) */
  createAttempt: (mockTestId: string) =>
    httpClient.post<IUserMockAttempt>(`/mock-tests/${mockTestId}/attempts`, {}),

  /** Fetch Mock Test Attempt Details with sub-attempts (Student/Teacher/Admin) */
  getAttemptById: (attemptId: string) =>
    httpClient.get<IUserMockAttempt>(`/mock-tests/attempts/${attemptId}`),

  /** Update/Link sub-attempt to the Mock Test Attempt */
  updateAttempt: (attemptId: string, payload: { readingAttemptId?: string; listeningAttemptId?: string; writingAttemptId?: string; speakingAttemptId?: string }) =>
    httpClient.patch<IUserMockAttempt>(`/mock-tests/attempts/${attemptId}`, payload),
};
