// Work API client — talks to the real Node/Express + MongoDB backend.

import type { Priority, Work, WorkStatus } from "@/lib/types";
import { http, toQueryString, ApiError } from "../http";

export interface WorkFilters {
  search?: string;
  status?: WorkStatus | "All";
  priority?: Priority | "All";
  employeeId?: string | "All";
}

export async function getWorks(filters: WorkFilters = {}): Promise<Work[]> {
  const qs = toQueryString({ ...filters, limit: 100 });
  return http.get<Work[]>(`/works${qs}`);
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

export async function updateWorkProgress(id: string, progress: number): Promise<Work | undefined> {
  try {
    return await http.patch<Work>(`/works/${id}/progress`, { progress });
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
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) return undefined;
    throw err;
  }
}
