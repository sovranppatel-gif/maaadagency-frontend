// Work API client — talks to the real Node/Express + MongoDB backend.

import type { Priority, Work, WorkStatus } from "@/lib/types";
import { http, toQueryString, ApiError } from "../http";

export interface WorkFilters {
  search?: string;
  status?: WorkStatus | "All";
  priority?: Priority | "All";
  employeeId?: string | "All";
  page?: number;
  limit?: number;
  sort?: string;
  upcomingOnly?: "true" | "false";
}

export interface WorkStats {
  total: number;
  UNASSIGNED: number;
  ASSIGNED: number;
  IN_PROGRESS: number;
  SUBMITTED: number;
  CHANGES_REQUESTED: number;
  APPROVED: number;
  COMPLETED: number;
}

export interface WorkPageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface WorkProgressUpdate {
  progress?: number;
  start?: boolean;
  progressNote?: string;
  blockedReason?: string;
}

export async function getWorks(filters: WorkFilters = {}): Promise<Work[]> {
  const qs = toQueryString({ ...filters, limit: 100 });
  return http.get<Work[]>(`/works${qs}`);
}

export async function getWorksPage(filters: WorkFilters = {}): Promise<{ works: Work[]; meta: WorkPageMeta }> {
  const response = await http.get<{ data: Work[]; meta: WorkPageMeta }>(
    `/works${toQueryString({ ...filters })}`,
    { withMeta: true, cache: "no-store" }
  );
  return { works: response.data, meta: response.meta };
}

export async function getWorkStats(): Promise<WorkStats> {
  return http.get<WorkStats>("/works/stats", { cache: "no-store" });
}

export async function getWork(id: string): Promise<Work | undefined> {
  try {
    return await http.get<Work>(`/works/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

export async function createWork(data: Partial<Work>): Promise<Work> {
  return http.post<Work>("/works", {
    ...data,
    employeeId: data.employeeId || undefined,
  });
}

export async function assignWork(id: string, employeeId: string): Promise<Work | undefined> {
  try {
    return await http.post<Work>(`/works/${id}/assign`, { employeeId });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

export async function approveWork(id: string): Promise<Work | undefined> {
  try {
    return await http.post<Work>(`/works/${id}/approve`);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) return undefined;
    throw err;
  }
}

export async function requestRevision(
  id: string,
  notes: string,
  priority: Priority,
  deadline?: string
): Promise<Work | undefined> {
  try {
    return await http.post<Work>(`/works/${id}/request-changes`, { notes, priority, deadline });
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) return undefined;
    throw err;
  }
}

export async function markCompleted(id: string): Promise<Work | undefined> {
  try {
    return await http.post<Work>(`/works/${id}/complete`);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) return undefined;
    throw err;
  }
}

export async function updateWorkProgress(id: string, update: WorkProgressUpdate): Promise<Work | undefined> {
  try {
    return await http.patch<Work>(`/works/${id}/progress`, update);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

export async function submitWork(
  id: string,
  summary: string,
  remarks = "",
  timeSpent = ""
): Promise<Work | undefined> {
  try {
    return await http.post<Work>(`/works/${id}/submit`, { summary, remarks, timeSpent });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}
