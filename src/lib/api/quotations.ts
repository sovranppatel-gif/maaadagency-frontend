import { ApiError, http, toQueryString } from "../http";

export type QuotationStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "REVISION_REQUESTED";

export type QuotationApprovalStatus =
  | "NOT_SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "REVISION_REQUESTED";

export interface QuotationLineItemInput {
  serviceId?: string;
  serviceName: string;
  description: string;
  quantityMilli: number;
  unit: string;
  unitRatePaise: number;
  discountBps: number;
  taxRateBps: number;
}

export interface QuotationLineItem extends QuotationLineItemInput {
  id: string;
  subtotalPaise: number;
  discountPaise: number;
  taxPaise: number;
  totalPaise: number;
}

export interface QuotationTotals {
  subtotalPaise: number;
  discountPaise: number;
  taxPaise: number;
  grandTotalPaise: number;
}

export interface QuotationHistoryEntry {
  id: string;
  action: string;
  fromStatus?: QuotationStatus;
  toStatus?: QuotationStatus;
  version: number;
  actorId: string;
  actorName: string;
  note?: string;
  at: string;
}

export interface QuotationVersion {
  version: number;
  status: QuotationStatus;
  approvalStatus: QuotationApprovalStatus;
  lineItems: QuotationLineItem[];
  totals: QuotationTotals;
  clientDetails: { name: string; company?: string; phone?: string; email?: string };
  leadCode?: string;
  validFrom: string;
  validUntil: string;
  currency: "INR";
  paymentTerms: string;
  termsAndConditions: string;
  approvedAt?: string;
  approvedByName?: string;
  sentAt?: string;
  sentByName?: string;
  sentMethod?: "EMAIL" | "WHATSAPP" | "IN_PERSON" | "OTHER";
  rejectionType?: "APPROVAL" | "CUSTOMER";
  rejectionReason?: string;
  customerDecision?: {
    outcome: "ACCEPTED" | "REJECTED";
    note: string;
    decidedAt: string;
  };
  capturedAt?: string;
}

export interface Quotation extends QuotationVersion {
  id: string;
  quotationNumber: string;
  leadId?: string;
  clientId: string;
  createdBy: string;
  createdByEmployeeId?: string;
  assignedSalesEmployeeId?: string;
  version: number;
  status: QuotationStatus;
  approvalStatus: QuotationApprovalStatus;
  internalNotes?: string;
  approvedAt?: string;
  approvedBy?: string;
  sentAt?: string;
  sentBy?: string;
  revisionReason?: string;
  revisionRequestedAt?: string;
  rejectionReason?: string;
  rejectionType?: "APPROVAL" | "CUSTOMER";
  versions: QuotationVersion[];
  history: QuotationHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface QuotationDraftInput {
  lineItems: QuotationLineItemInput[];
  validFrom: string;
  validUntil: string;
  currency: "INR";
  paymentTerms: string;
  termsAndConditions: string;
  internalNotes: string;
}

export interface CreateQuotationInput extends QuotationDraftInput {
  leadId?: string;
  clientId?: string;
  assignedSalesEmployeeId?: string;
}

export interface QuotationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface QuotationCatalogService {
  id: string;
  name: string;
}

function actionOptions(idempotencyKey: string) {
  return { headers: { "Idempotency-Key": idempotencyKey } };
}

export async function getQuotationsPage(filters: {
  page?: number;
  limit?: number;
  search?: string;
  status?: QuotationStatus | "All";
  leadId?: string;
  expiringOnly?: "true" | "false";
} = {}): Promise<{ quotations: Quotation[]; meta: QuotationMeta }> {
  const response = await http.get<{ data: Quotation[]; meta: QuotationMeta }>(
    `/quotations${toQueryString(filters)}`,
    { withMeta: true, cache: "no-store" }
  );
  return { quotations: response.data, meta: response.meta };
}

export async function getQuotation(id: string): Promise<Quotation | undefined> {
  try {
    return await http.get<Quotation>(`/quotations/${encodeURIComponent(id)}`, { cache: "no-store" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}

export async function getQuotationSummary(): Promise<{ expiringSoon: number; expired: number }> {
  return http.get("/quotations/summary", { cache: "no-store" });
}

export async function getQuotationCatalog(): Promise<QuotationCatalogService[]> {
  return http.get("/quotations/catalog", { cache: "no-store" });
}

export async function createQuotation(input: CreateQuotationInput, idempotencyKey: string): Promise<Quotation> {
  return http.post("/quotations", input, actionOptions(idempotencyKey));
}

export async function updateQuotationDraft(id: string, input: QuotationDraftInput): Promise<Quotation> {
  return http.patch(`/quotations/${encodeURIComponent(id)}`, input);
}

export async function submitQuotation(id: string, key: string): Promise<Quotation> {
  return http.post(`/quotations/${encodeURIComponent(id)}/submit`, {}, actionOptions(key));
}

export async function approveQuotation(id: string, key: string): Promise<Quotation> {
  return http.post(`/quotations/${encodeURIComponent(id)}/approve`, {}, actionOptions(key));
}

export async function rejectQuotation(id: string, reason: string, key: string): Promise<Quotation> {
  return http.post(`/quotations/${encodeURIComponent(id)}/reject`, { reason }, actionOptions(key));
}

export async function requestQuotationRevision(id: string, reason: string, key: string): Promise<Quotation> {
  return http.post(`/quotations/${encodeURIComponent(id)}/request-revision`, { reason }, actionOptions(key));
}

export async function recordQuotationSent(
  id: string,
  sentMethod: NonNullable<Quotation["sentMethod"]>,
  key: string
): Promise<Quotation> {
  return http.post(`/quotations/${encodeURIComponent(id)}/sent`, { sentMethod }, actionOptions(key));
}

export async function recordCustomerDecision(
  id: string,
  decision: "ACCEPTED" | "REJECTED",
  note: string,
  key: string
): Promise<Quotation> {
  return http.post(`/quotations/${encodeURIComponent(id)}/customer-decision`, { decision, note }, actionOptions(key));
}

export async function expireQuotation(id: string, key: string): Promise<Quotation> {
  return http.post(`/quotations/${encodeURIComponent(id)}/expire`, {}, actionOptions(key));
}

export async function startQuotationRevision(id: string, key: string): Promise<Quotation> {
  return http.post(`/quotations/${encodeURIComponent(id)}/revise`, {}, actionOptions(key));
}

export async function getQuotationPdf(id: string, version?: number): Promise<Blob> {
  return http.getBlob(
    `/quotations/${encodeURIComponent(id)}/pdf${toQueryString({ version })}`,
    { cache: "no-store" }
  );
}

export function formatPaise(paise: number): string {
  const rupees = Math.floor(paise / 100);
  const cents = String(paise % 100).padStart(2, "0");
  return `INR ${new Intl.NumberFormat("en-IN").format(rupees)}.${cents}`;
}

export function formatQuotationDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function parseRupeesToPaise(value: string): number | null {
  const normalized = value.trim().replace(/,/g, "");
  const match = normalized.match(/^(\d{1,12})(?:\.(\d{0,2}))?$/);
  if (!match) return null;
  const paise = BigInt(match[1]) * BigInt(100) + BigInt((match[2] ?? "").padEnd(2, "0") || "0");
  return paise <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(paise) : null;
}

export function parseRateToBps(value: string): number | null {
  const normalized = value.trim();
  const match = normalized.match(/^(\d{1,3})(?:\.(\d{0,2}))?$/);
  if (!match) return null;
  const bps = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0") || "0");
  return bps <= 10_000 ? bps : null;
}

export function parseQuantityToMilli(value: string): number | null {
  const normalized = value.trim();
  const match = normalized.match(/^(\d{1,7})(?:\.(\d{0,3}))?$/);
  if (!match) return null;
  const milli = Number(match[1]) * 1000 + Number((match[2] ?? "").padEnd(3, "0") || "0");
  return milli > 0 && milli <= 1_000_000_000 ? milli : null;
}

export function calculatePreviewLine(item: Pick<QuotationLineItemInput, "quantityMilli" | "unitRatePaise" | "discountBps" | "taxRateBps">) {
  const roundHalfUp = (numerator: bigint, denominator: bigint) =>
    (numerator + denominator / BigInt(2)) / denominator;
  const subtotal = roundHalfUp(BigInt(item.quantityMilli) * BigInt(item.unitRatePaise), BigInt(1000));
  const discount = roundHalfUp(subtotal * BigInt(item.discountBps), BigInt(10_000));
  const tax = roundHalfUp((subtotal - discount) * BigInt(item.taxRateBps), BigInt(10_000));
  const total = subtotal - discount + tax;
  const maxSafe = BigInt(Number.MAX_SAFE_INTEGER);
  if ([subtotal, discount, tax, total].some((amount) => amount > maxSafe)) {
    throw new RangeError("The line amount exceeds the supported quotation total");
  }
  return { subtotalPaise: Number(subtotal), discountPaise: Number(discount), taxPaise: Number(tax), totalPaise: Number(total) };
}
