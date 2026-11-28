import type {
  LeadVisit,
  VisitLocationType,
  VisitOutcome,
  VisitStatus,
  VisitType,
} from "@/lib/types";
import { http, toQueryString } from "../http";

export const VISIT_TYPE_OPTIONS: Array<{ value: VisitType; label: string }> = [
  { value: "SITE_VISIT", label: "Site Visit" },
  { value: "OFFICE_MEETING", label: "Office Meeting" },
  { value: "CLIENT_MEETING", label: "Client Meeting" },
  { value: "FIELD_VISIT", label: "Field Visit" },
  { value: "VIRTUAL_MEETING", label: "Virtual Meeting" },
  { value: "OTHER", label: "Other" },
];

export const VISIT_LOCATION_OPTIONS: Array<{ value: VisitLocationType; label: string }> = [
  { value: "CUSTOMER_LOCATION", label: "Customer Location" },
  { value: "OFFICE", label: "Agency Office" },
  { value: "PROJECT_SITE", label: "Project Site" },
  { value: "VIRTUAL", label: "Virtual / Online" },
  { value: "OTHER", label: "Other" },
];

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  SCHEDULED: "Visit Planned",
  RESCHEDULED: "Visit Rescheduled",
  COMPLETED: "Visit Done",
  CANCELLED: "Visit Cancelled",
};

export const VISIT_OUTCOME_OPTIONS: Array<{ value: VisitOutcome; label: string }> = [
  { value: "INTERESTED", label: "Interested" },
  { value: "FOLLOW_UP_REQUIRED", label: "Follow-up Required" },
  { value: "QUOTATION_REQUESTED", label: "Quotation Requested" },
  { value: "NOT_INTERESTED", label: "Not Interested" },
  { value: "OTHER", label: "Other" },
];

export function visitTypeLabel(type: VisitType | string): string {
  return VISIT_TYPE_OPTIONS.find((item) => item.value === type)?.label ?? type;
}

export function visitLocationLabel(type: VisitLocationType | string): string {
  return VISIT_LOCATION_OPTIONS.find((item) => item.value === type)?.label ?? type;
}

export function visitStatusLabel(status: VisitStatus | string): string {
  return VISIT_STATUS_LABELS[status as VisitStatus] ?? status;
}

export function visitOutcomeLabel(outcome?: VisitOutcome | string | null): string {
  if (!outcome) return "—";
  return VISIT_OUTCOME_OPTIONS.find((item) => item.value === outcome)?.label ?? outcome;
}

export function istDateTimeInputToIso(value: string): string {
  const normalized = value.length === 16 ? `${value}:00` : value;
  return new Date(`${normalized}+05:30`).toISOString();
}

export function toIstDateKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function toIstDateTimeLocalValue(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const hour = map.hour === "24" ? "00" : map.hour;
  return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}`;
}

export type VisitBucket = "All" | "upcoming" | "today" | "overdue" | "completed" | "cancelled";

export interface VisitFilters {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  leadId?: string;
  status?: VisitStatus | "All";
  visitType?: VisitType | "All";
  employeeId?: string | "All";
  bucket?: VisitBucket;
  from?: string;
  to?: string;
}

export interface VisitPageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface VisitStats {
  total: number;
  scheduled: number;
  rescheduled: number;
  completed: number;
  cancelled: number;
  upcoming: number;
  today: number;
  overdue: number;
}

export interface VisitReport {
  totals: {
    total: number;
    scheduled: number;
    rescheduled: number;
    completed: number;
    cancelled: number;
    overdue: number;
    completionRate: number;
  };
  byEmployee: Array<{
    employeeId: string | null;
    name?: string;
    code?: string;
    total: number;
    completed: number;
    cancelled: number;
    upcoming: number;
  }>;
  byDate: Array<{ date: string; total: number; completed: number; cancelled: number }>;
  byOutcome: Partial<Record<VisitOutcome, number>>;
  byType: Partial<Record<VisitType, number>>;
}

export interface CreateVisitInput {
  visitType: VisitType;
  title: string;
  scheduledStart: string;
  scheduledEnd?: string;
  timezone?: "Asia/Kolkata";
  locationType: VisitLocationType;
  locationAddress?: string;
  meetingLink?: string;
  customerContactPerson?: string;
  notes?: string;
  assignedEmployeeId?: string;
}

export interface RescheduleVisitInput {
  scheduledStart: string;
  scheduledEnd?: string;
  locationType?: VisitLocationType;
  locationAddress?: string;
  meetingLink?: string;
  reason: string;
}

export interface CompleteVisitInput {
  outcome: VisitOutcome;
  customerResponse?: string;
  notes?: string;
}

export async function getVisitsPage(filters: VisitFilters = {}): Promise<{ visits: LeadVisit[]; meta: VisitPageMeta }> {
  const response = await http.get<{ data: LeadVisit[]; meta: VisitPageMeta }>(
    `/visits${toQueryString({ ...filters })}`,
    { withMeta: true, cache: "no-store" }
  );
  return { visits: response.data, meta: response.meta };
}

export async function getLeadVisits(leadId: string, page = 1, limit = 50): Promise<{ visits: LeadVisit[]; meta: VisitPageMeta }> {
  const response = await http.get<{ data: LeadVisit[]; meta: VisitPageMeta }>(
    `/leads/${encodeURIComponent(leadId)}/visits${toQueryString({ page, limit })}`,
    { withMeta: true, cache: "no-store" }
  );
  return { visits: response.data, meta: response.meta };
}

export async function getVisitStats(): Promise<VisitStats> {
  return http.get<VisitStats>("/visits/stats", { cache: "no-store" });
}

export async function getVisitReport(filters: { from?: string; to?: string; employeeId?: string } = {}): Promise<VisitReport> {
  return http.get<VisitReport>(`/visits/report${toQueryString(filters)}`, { cache: "no-store" });
}

export async function getVisit(id: string): Promise<LeadVisit> {
  return http.get<LeadVisit>(`/visits/${encodeURIComponent(id)}`, { cache: "no-store" });
}

export async function scheduleLeadVisit(
  leadId: string,
  data: CreateVisitInput,
  idempotencyKey: string
): Promise<LeadVisit> {
  return http.post<LeadVisit>(`/leads/${encodeURIComponent(leadId)}/visits`, data, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

export async function rescheduleVisit(id: string, data: RescheduleVisitInput): Promise<LeadVisit> {
  return http.patch<LeadVisit>(`/visits/${encodeURIComponent(id)}/reschedule`, data);
}

export async function completeVisit(id: string, data: CompleteVisitInput): Promise<LeadVisit> {
  return http.patch<LeadVisit>(`/visits/${encodeURIComponent(id)}/complete`, data);
}

export async function cancelVisit(id: string, cancellationReason: string): Promise<LeadVisit> {
  return http.patch<LeadVisit>(`/visits/${encodeURIComponent(id)}/cancel`, { cancellationReason });
}
