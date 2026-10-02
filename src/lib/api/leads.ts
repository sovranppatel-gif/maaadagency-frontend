// Lead API client — talks to the real Node/Express + MongoDB backend.
// Function names and signatures match what the dashboard components expect.

import type { Lead, LeadStatus, Priority } from "@/lib/types";
import { http, toQueryString, ApiError } from "../http";

export interface LeadFilters {
  search?: string;
  service?: string;
  status?: LeadStatus | "All";
  priority?: Priority | "All";
  employeeId?: string | "All";
  source?: string | "All";
}

export async function getLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  const qs = toQueryString({ ...filters, limit: 100 });
  return http.get<Lead[]>(`/leads${qs}`);
}

export async function getLead(id: string): Promise<Lead | undefined> {
  try {
    return await http.get<Lead>(`/leads/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

export async function assignLead(id: string, employeeId: string): Promise<Lead | undefined> {
  try {
    return await http.post<Lead>(`/leads/${id}/assign`, { employeeId });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<Lead | undefined> {
  try {
    return await http.patch<Lead>(`/leads/${id}/status`, { status });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

export async function createLead(data: Partial<Lead>): Promise<Lead> {
  return http.post<Lead>("/leads", data);
}

export async function deleteLead(id: string): Promise<boolean> {
  try {
    const res = await http.del<{ id: string; deleted: boolean }>(`/leads/${id}`);
    return Boolean(res?.deleted);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return false;
    throw err;
  }
}
