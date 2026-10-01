import { httpClient } from "@/lib/axios/httpClient";

export type ManagedRole = "STUDENT" | "TEACHER";
export type ManagedStatus = "ACTIVE" | "PENDING_VERIFICATION" | "BLOCKED" | "DELETED";
export type ManagedUser = { id: string; name: string | null; email: string; image: string | null; role: ManagedRole; status: ManagedStatus; emailVerified: boolean; isPremium: boolean; isDeleted: boolean; createdAt: string; updatedAt: string };
export type AdminOverview = {
  total: number;
  students: number;
  teachers: number;
  active: number;
  pending: number;
  blocked: number;
  deleted: number;
  contentCounts: {
    reading: number;
    listening: number;
    writing: number;
    speaking: number;
    mockTests: number;
    vocabulary: number;
  };
};

export const adminService = {
  getOverview: () => httpClient.get<AdminOverview>("/admin/management/overview"),
  getUsers: (params: { search?: string; role?: string; status?: string; includeDeleted?: boolean; limit?: number }) => httpClient.get<ManagedUser[]>("/admin/management/users", { params }),
  updateStatus: (id: string, status: ManagedStatus) => httpClient.patch<ManagedUser>(`/admin/management/users/${id}/status`, { status }),
  deleteUser: (id: string) => httpClient.delete<ManagedUser>(`/admin/management/users/${id}`),
};
