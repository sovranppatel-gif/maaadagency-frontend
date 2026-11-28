import { http, toQueryString } from "../http";
import type { CallResponse, LeadQuality, LeadSource, LeadStatus, Priority } from "../types";

export interface ImportColumnMappingItem {
  header: string;
  mappedTo: string;
  followUpDate?: string | null;
}

export interface ImportSheetSummary {
  sheetName: string;
  normalizedName: string;
  headerRowNumber: number | null;
  headers: string[];
  columnMapping: ImportColumnMappingItem[];
  unmappedHeaders: string[];
  rowCount: number;
}

export interface ImportPreviewVisitCandidate {
  title: string;
  scheduledStart: string;
  locationType: string;
  locationAddress: string;
  status: string;
  notes?: string;
}

export type PreviewRowStatus = "IMPORTABLE" | "DUPLICATE_EXISTING" | "DUPLICATE_WORKBOOK" | "INVALID";

export interface ImportPreviewRow {
  sheetName: string;
  sourceRow: number;
  sourceSerial?: string;
  clientName: string;
  phone: string;
  alternatePhone?: string;
  service: string;
  requirement: string;
  source: LeadSource;
  rawSource?: string;
  quality: LeadQuality | null;
  rawQuality?: string;
  enquiryDate?: string | null;
  historicalFollowUps: Array<{
    callDate?: string | null;
    rawDateLabel?: string;
    callResponse?: CallResponse | null;
    rawResponse?: string;
    note?: string;
  }>;
  visitCandidate: ImportPreviewVisitCandidate | null;
  rawVisitNote?: string;
  previewStatus: PreviewRowStatus;
  duplicateReason?: string | null;
  errors: string[];
  warnings: string[];
}

export interface ImportPreviewSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateCount: number;
  ambiguousCount: number;
  followUpHistoryCount: number;
  visitCandidateCount: number;
  visitWarningCount: number;
}

export interface ImportPreviewResult {
  jobId: string;
  jobCode?: string;
  previewToken: string;
  previewExpiresAt: string;
  fileName: string;
  fileFormat: "xlsx" | "csv";
  worksheetNames: string[];
  selectedSheets: string[];
  sheets: ImportSheetSummary[];
  summary: ImportPreviewSummary;
  rows: ImportPreviewRow[];
}

export interface ImportErrorSummary {
  sheet?: string;
  rowNumber?: number;
  code?: string;
  message: string;
}

export type ImportMode = "CREATE_SKIP_DUPLICATES" | "DRY_RUN";
export type ImportJobStatus = "PREVIEW" | "PROCESSING" | "COMPLETED" | "PARTIAL" | "FAILED";

export interface ImportJob {
  id: string;
  code?: string;
  fileName: string;
  fileFormat: "xlsx" | "csv";
  fileSizeBytes: number;
  worksheetNames: string[];
  selectedSheets: string[];
  importedByName: string;
  status: ImportJobStatus;
  importMode: ImportMode;
  startedAt?: string;
  completedAt?: string;
  totalRows: number;
  validRows: number;
  createdCount: number;
  duplicateCount: number;
  skippedCount: number;
  failedCount: number;
  followUpHistoryCount: number;
  visitHistoryCount: number;
  visitWarningCount: number;
  errorSummaries: ImportErrorSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface ExportLeadsOptions {
  format: "xlsx" | "csv";
  search?: string;
  status?: LeadStatus | "All";
  priority?: Priority | "All";
  quality?: LeadQuality | "UNCLASSIFIED" | "All";
  source?: LeadSource | "All";
  service?: string;
  employeeId?: string;
  from?: string;
  to?: string;
  includeFollowUps?: boolean;
  includeVisits?: boolean;
}

/** Uploads an .xlsx/.csv file in memory and returns a validated import preview snapshot. */
export function previewLeadsImport(file: File, selectedSheets?: string[]): Promise<ImportPreviewResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (selectedSheets && selectedSheets.length > 0) {
    formData.append("selectedSheets", JSON.stringify(selectedSheets));
  }
  return http.post<ImportPreviewResult>("/leads/import/preview", formData);
}

/** Confirms an unexpired preview token to persist valid leads or run a server dry run. */
export function confirmLeadsImport(
  input: {
    previewToken: string;
    selectedSheets?: string[];
    importMode: ImportMode;
  },
  idempotencyKey?: string
): Promise<ImportJob> {
  return http.post<ImportJob>("/leads/import/confirm", input, {
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
  });
}

export function getImportJobs(page = 1, limit = 10) {
  return http.get<{ data: ImportJob[]; meta: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean } }>(
    `/leads/import/jobs${toQueryString({ page, limit })}`,
    { withMeta: true }
  );
}

export function getImportJob(id: string): Promise<ImportJob> {
  return http.get<ImportJob>(`/leads/import/jobs/${encodeURIComponent(id)}`);
}

/** Downloads filtered leads as an .xlsx or .csv file from the backend export endpoint. */
export async function downloadLeadsExport(options: ExportLeadsOptions): Promise<string> {
  const qs = toQueryString({
    format: options.format,
    search: options.search,
    status: options.status,
    priority: options.priority,
    quality: options.quality,
    source: options.source,
    service: options.service,
    employeeId: options.employeeId,
    from: options.from,
    to: options.to,
    includeFollowUps: options.includeFollowUps ? "true" : undefined,
    includeVisits: options.includeVisits ? "true" : undefined,
  });
  const blob = await http.getBlob(`/leads/export${qs}`);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `maaad-leads-${stamp}.${options.format}`;
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
  return filename;
}
