import { http, toQueryString } from "../http";

export type FollowUpCommunicationType = "Call" | "WhatsApp" | "Meeting" | "Email";
export type FollowUpInterestLevel = "Interested" | "Not Interested" | "Neutral" | "Unsure";
export type FollowUpBucket = "All" | "upcoming" | "today" | "overdue";

export interface LeadFollowUp {
  id: string;
  leadId: string;
  attemptNumber: number;
  communicationType: FollowUpCommunicationType;
  contactedAt: string;
  customerResponse: string;
  discussionNotes: string;
  nextFollowUpAt?: string;
  interestLevel: FollowUpInterestLevel;
  quotationRequired: boolean;
  employeeRemarks: string;
  createdAt: string;
  employee?: { id: string; name: string; code?: string };
  lead?: { id: string; code?: string; clientName: string; requirement: string; followUpReviewRequired?: boolean };
}

export interface FollowUpInput {
  communicationType: FollowUpCommunicationType;
  contactedAt: string;
  customerResponse: string;
  discussionNotes: string;
  nextFollowUpAt?: string;
  interestLevel: FollowUpInterestLevel;
  quotationRequired: boolean;
  employeeRemarks: string;
}

export interface FollowUpPageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  attempts?: number;
  maxAttempts?: number;
  reviewRequired?: boolean;
  closed?: boolean;
}

export interface FollowUpSummary {
  upcoming: number;
  dueToday: number;
  overdue: number;
  reviewRequired: number;
  withoutFollowUp: number;
}

export interface FollowUpReport {
  employeeWise: Array<{ employeeId: string; name?: string; code?: string; followUps: number }>;
  leadsNeverContacted: number;
  dueToday: number;
  overdue: number;
  fourAttemptsCompleted: number;
  reviewRequired: number;
  interest: Partial<Record<FollowUpInterestLevel, number>>;
}

export async function getLeadFollowUps(
  leadId: string,
  page = 1,
  limit = 100
): Promise<{ followUps: LeadFollowUp[]; meta: FollowUpPageMeta }> {
  const response = await http.get<{ data: LeadFollowUp[]; meta: FollowUpPageMeta }>(
    `/leads/${encodeURIComponent(leadId)}/follow-ups${toQueryString({ page, limit })}`,
    { withMeta: true, cache: "no-store" }
  );
  return { followUps: response.data, meta: response.meta };
}

export async function createLeadFollowUp(
  leadId: string,
  data: FollowUpInput,
  idempotencyKey: string
): Promise<LeadFollowUp> {
  return http.post<LeadFollowUp>(`/leads/${encodeURIComponent(leadId)}/follow-ups`, data, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

export async function closeLeadFollowUps(leadId: string): Promise<{ closed: boolean }> {
  return http.post(`/leads/${encodeURIComponent(leadId)}/follow-ups/close`);
}

export async function authorizeMoreFollowUps(leadId: string, additionalAttempts: number): Promise<{ followUpLimit: number }> {
  return http.post(`/leads/${encodeURIComponent(leadId)}/follow-ups/authorize-more`, { additionalAttempts });
}

export async function getFollowUpsPage(filters: {
  page?: number;
  limit?: number;
  bucket?: FollowUpBucket;
} = {}): Promise<{ followUps: LeadFollowUp[]; meta: FollowUpPageMeta }> {
  const response = await http.get<{ data: LeadFollowUp[]; meta: FollowUpPageMeta }>(
    `/follow-ups${toQueryString(filters)}`,
    { withMeta: true, cache: "no-store" }
  );
  return { followUps: response.data, meta: response.meta };
}

export async function getFollowUpSummary(): Promise<FollowUpSummary> {
  return http.get<FollowUpSummary>("/follow-ups/summary", { cache: "no-store" });
}

export async function getFollowUpReport(): Promise<FollowUpReport> {
  return http.get<FollowUpReport>("/follow-ups/report", { cache: "no-store" });
}
