"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  History,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Upload,
  XCircle,
} from "lucide-react";
import { Card, CardHeader } from "@/components/master-admin/ui/Card";
import { StatCard } from "@/components/master-admin/StatCard";
import { LEAD_QUALITIES, QualityBadge } from "@/components/master-admin/ui/QualityBadge";
import { useToast } from "@/components/master-admin/ui/ToastProvider";
import { useDirectory } from "@/lib/directory";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/http";
import { formatDateTime } from "@/lib/format";
import {
  confirmLeadsImport,
  downloadLeadsExport,
  getImportJob,
  getImportJobs,
  previewLeadsImport,
  type ImportErrorSummary,
  type ImportJob,
  type ImportMode,
  type ImportPreviewResult,
} from "@/lib/api/importExport";
import type { LeadQuality, LeadSource, LeadStatus, Priority } from "@/lib/types";

const statuses: (LeadStatus | "All")[] = ["All", "New", "Assigned", "In Progress", "Submitted", "Changes Requested", "Approved", "Completed"];
const priorities: (Priority | "All")[] = ["All", "LOW", "MEDIUM", "HIGH", "URGENT"];
const qualities: (LeadQuality | "UNCLASSIFIED" | "All")[] = ["All", ...LEAD_QUALITIES, "UNCLASSIFIED"];
const sources: (LeadSource | "All")[] = ["All", "WhatsApp", "Website", "Manual", "Referral", "Phone Call", "Office Walk-in", "Other"];

function makeIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `imp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function escapeCsvCell(value: unknown): string {
  let str = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
  if (/[",\r\n]/.test(str)) return `"${str.replaceAll('"', '""')}"`;
  return str;
}

function downloadErrorSummaryCsv(job: ImportJob) {
  const header = ["Code", "Sheet", "Row", "Message"].join(",");
  const lines = (job.errorSummaries ?? []).map((item: ImportErrorSummary) =>
    [
      escapeCsvCell(item.code ?? ""),
      escapeCsvCell(item.sheet ?? ""),
      escapeCsvCell(item.rowNumber ?? ""),
      escapeCsvCell(item.message ?? ""),
    ].join(",")
  );
  const blob = new Blob([`\uFEFF${[header, ...lines].join("\r\n")}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${job.code ?? "import-job"}-summary.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function LeadImportExportPage() {
  const { user } = useAuth();
  const { employees } = useDirectory();
  const { push } = useToast();

  const notify = (title: string, kind: "success" | "error" = "success") => {
    push({ kind, title });
  };

  const isAdmin = user?.role === "MASTER_ADMIN" || user?.role === "ADMIN";

  // Import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [rowFilter, setRowFilter] = useState<"ALL" | "VALID" | "DUPLICATE" | "INVALID">("ALL");
  const [importMode, setImportMode] = useState<ImportMode>("CREATE_SKIP_DUPLICATES");
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [lastCompletedJob, setLastCompletedJob] = useState<ImportJob | null>(null);
  const [importError, setImportError] = useState("");

  // Job history state
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [activeJobModal, setActiveJobModal] = useState<ImportJob | null>(null);

  // Export state
  const [exportFormat, setExportFormat] = useState<"xlsx" | "csv">("xlsx");
  const [exportStatus, setExportStatus] = useState<LeadStatus | "All">("All");
  const [exportPriority, setExportPriority] = useState<Priority | "All">("All");
  const [exportQuality, setExportQuality] = useState<LeadQuality | "UNCLASSIFIED" | "All">("All");
  const [exportSource, setExportSource] = useState<LeadSource | "All">("All");
  const [exportEmployeeId, setExportEmployeeId] = useState("All");
  const [exportSearch, setExportSearch] = useState("");
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [includeFollowUps, setIncludeFollowUps] = useState(true);
  const [includeVisits, setIncludeVisits] = useState(true);
  const [exporting, setExporting] = useState(false);

  const refreshJobs = useCallback(async () => {
    if (!isAdmin) return;
    setJobsLoading(true);
    try {
      const res = await getImportJobs(1, 10);
      setJobs(res.data ?? []);
    } catch {
      // ignore load errors when unauthorized
    } finally {
      setJobsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    getImportJobs(1, 10)
      .then((res) => {
        if (active) setJobs(res.data ?? []);
      })
      .catch(() => {
        // ignore initial load failures when unauthorized
      })
      .finally(() => {
        if (active) setJobsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isAdmin]);

  const validateSelectedFile = (file: File | null): string | null => {
    if (!file) return "Select an .xlsx or .csv file first.";
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".xlsx") && !lower.endsWith(".csv")) {
      return "Only .xlsx and .csv files are supported.";
    }
    if (file.size > 5 * 1024 * 1024) {
      return "File exceeds the 5 MB upload limit.";
    }
    if (file.size === 0) {
      return "Selected file is empty.";
    }
    return null;
  };

  const handleFileChange = (file: File | null) => {
    setImportError("");
    setLastCompletedJob(null);
    setConfirmChecked(false);
    setPreview(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const err = validateSelectedFile(file);
    if (err) {
      setImportError(err);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const runPreview = async (overrideSheets?: string[]) => {
    const err = validateSelectedFile(selectedFile);
    if (err || !selectedFile) {
      setImportError(err ?? "Select a file first.");
      return;
    }
    setPreviewLoading(true);
    setImportError("");
    setConfirmChecked(false);
    try {
      const result = await previewLeadsImport(selectedFile, overrideSheets);
      setPreview(result);
      setSelectedSheets(result.selectedSheets);
      setLastCompletedJob(null);
      notify(`Previewed ${result.summary.totalRows} row(s) from ${result.fileName}`);
    } catch (e) {
      setImportError(e instanceof ApiError ? e.message : "Could not preview spreadsheet.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleSheet = (sheetName: string) => {
    setSelectedSheets((prev) =>
      prev.includes(sheetName) ? prev.filter((item) => item !== sheetName) : [...prev, sheetName]
    );
  };

  const handleConfirmImport = async () => {
    if (!preview) return;
    if (selectedSheets.length === 0) {
      setImportError("Select at least one worksheet to confirm import.");
      return;
    }
    if (!confirmChecked) {
      setImportError("Tick the confirmation checkbox before running the import.");
      return;
    }
    setConfirming(true);
    setImportError("");
    try {
      const job = await confirmLeadsImport(
        {
          previewToken: preview.previewToken,
          selectedSheets,
          importMode,
        },
        makeIdempotencyKey()
      );
      setLastCompletedJob(job);
      setPreview(null);
      setConfirmChecked(false);
      await refreshJobs();
      notify(
        importMode === "DRY_RUN"
          ? `Dry run finished: ${job.createdCount} lead(s) would be created.`
          : `Imported ${job.createdCount} lead(s) (${job.duplicateCount} duplicate(s) skipped).`
      );
    } catch (e) {
      setImportError(e instanceof ApiError ? e.message : "Import confirmation failed.");
    } finally {
      setConfirming(false);
    }
  };

  const handleOpenJob = async (id: string) => {
    try {
      const detail = await getImportJob(id);
      setActiveJobModal(detail);
    } catch (e) {
      notify(e instanceof ApiError ? e.message : "Could not load import job details", "error");
    }
  };

  const handleExport = async (event: React.FormEvent) => {
    event.preventDefault();
    setExporting(true);
    try {
      const filename = await downloadLeadsExport({
        format: exportFormat,
        search: exportSearch.trim() || undefined,
        status: exportStatus,
        priority: exportPriority,
        quality: exportQuality,
        source: exportSource,
        employeeId: exportEmployeeId,
        from: exportFrom || undefined,
        to: exportTo || undefined,
        includeFollowUps: exportFormat === "xlsx" ? includeFollowUps : false,
        includeVisits: exportFormat === "xlsx" ? includeVisits : false,
      });
      notify(`Downloaded ${filename}`);
    } catch (e) {
      notify(e instanceof ApiError ? e.message : "Export failed", "error");
    } finally {
      setExporting(false);
    }
  };

  const filteredPreviewRows = useMemo(() => {
    if (!preview) return [];
    const sheetSet = new Set(selectedSheets);
    return preview.rows.filter((row) => {
      if (!sheetSet.has(row.sheetName)) return false;
      if (rowFilter === "VALID") return row.previewStatus === "IMPORTABLE";
      if (rowFilter === "DUPLICATE") {
        return row.previewStatus === "DUPLICATE_EXISTING" || row.previewStatus === "DUPLICATE_WORKBOOK";
      }
      if (rowFilter === "INVALID") return row.previewStatus === "INVALID";
      return true;
    });
  }, [preview, rowFilter, selectedSheets]);

  if (!isAdmin) {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600" />
          <div>
            <h2 className="text-base font-bold text-neutral-900">Administrator Access Required</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Bulk Excel lead imports are restricted to Master Admin and Admin accounts.
            </p>
            <Link href="/master-admin/leads" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-brand-red hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to Leads
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-900">Excel Import &amp; Export</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Migrate Excel / CSV tracking workbooks safely with mandatory preview, duplicate detection, and IST audit trails.
          </p>
        </div>
        <Link
          href="/master-admin/leads"
          className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </Link>
      </div>

      {/* Step 1: Upload & Preview */}
      <Card>
        <CardHeader
          title="1. Upload & Preview Workbook"
          subtitle="Supports .xlsx and .csv files up to 5 MB (max 10 sheets, 5,000 rows). No database records are written during preview."
        />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFileChange(e.dataTransfer.files?.[0] ?? null);
          }}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
            dragOver ? "border-brand-red bg-brand-red/5" : "border-black/15 bg-neutral-50/70"
          }`}
        >
          <FileSpreadsheet className="h-9 w-9 text-brand-red" />
          <p className="mt-2 text-sm font-bold text-neutral-800">
            {selectedFile ? `${selectedFile.name} (${Math.max(1, Math.round(selectedFile.size / 1024))} KB)` : "Drag & drop an Excel (.xlsx) or CSV file here"}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Detects sheets like MAY 2026 ALL LEADS &amp; FILTER LEADS, title banners, duplicate STATUS headers, and date columns.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <label className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50">
              Choose File
              <input
                type="file"
                accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                className="sr-only"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
            </label>
            <button
              type="button"
              onClick={() => runPreview()}
              disabled={!selectedFile || previewLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-red px-4 py-2 text-xs font-bold text-white hover:opacity-95 disabled:opacity-50"
            >
              {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload &amp; Preview
            </button>
          </div>
        </div>

        {importError && (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{importError}</span>
          </div>
        )}
      </Card>

      {/* Step 2: Preview Summary, Sheet Mapping & Rows */}
      {preview && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard icon={FileSpreadsheet} label="Total Rows" value={preview.summary.totalRows} tone="neutral" index={0} />
            <StatCard icon={CheckCircle2} label="Importable" value={preview.summary.validRows} tone="red" index={1} />
            <StatCard icon={RefreshCw} label="Duplicates" value={preview.summary.duplicateCount} tone="neutral" index={2} />
            <StatCard icon={XCircle} label="Invalid" value={preview.summary.invalidRows} tone="neutral" index={3} />
            <StatCard icon={History} label="Follow-up Calls" value={preview.summary.followUpHistoryCount} tone="neutral" index={4} />
            <StatCard icon={AlertTriangle} label="Visit Candidates / Warns" value={`${preview.summary.visitCandidateCount} / ${preview.summary.visitWarningCount}`} tone="neutral" index={5} />
          </div>

          <Card>
            <CardHeader
              title="2. Worksheet Selection & Column Mapping"
              subtitle={`Preview token expires ${formatDateTime(preview.previewExpiresAt)}. Inspect detected headers before confirming.`}
              action={
                <button
                  type="button"
                  onClick={() => runPreview(selectedSheets)}
                  disabled={previewLoading || selectedSheets.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Re-run Preview for Selected Sheets
                </button>
              }
            />

            <div className="grid gap-3 md:grid-cols-2">
              {preview.sheets.map((sheet) => {
                const checked = selectedSheets.includes(sheet.sheetName);
                const mappedCols = sheet.columnMapping.filter((item) => item.mappedTo !== "unmapped");
                return (
                  <div
                    key={sheet.sheetName}
                    className={`rounded-xl border p-4 ${checked ? "border-brand-red/30 bg-red-50/20" : "border-black/10 bg-neutral-50"}`}
                  >
                    <label className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSheet(sheet.sheetName)}
                          className="h-4 w-4 accent-brand-red"
                        />
                        {sheet.sheetName}
                      </span>
                      <span className="text-xs font-semibold text-neutral-500">
                        Header row {sheet.headerRowNumber ?? "—"} · {sheet.rowCount} row(s)
                      </span>
                    </label>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {mappedCols.map((col, idx) => (
                        <span key={`${col.header}-${idx}`} className="rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-neutral-700 ring-1 ring-black/10">
                          <span className="font-bold">{col.mappedTo}</span> ← {col.header}
                        </span>
                      ))}
                    </div>
                    {sheet.unmappedHeaders.length > 0 && (
                      <p className="mt-2 text-[11px] text-amber-700">
                        Unmapped headers: {sheet.unmappedHeaders.join(", ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="3. Row-Level Validation Preview"
              subtitle="Valid rows with duplicate flags are skipped cleanly; existing CRM leads and employee assignments are preserved."
              action={
                <div className="flex flex-wrap gap-1.5">
                  {(["ALL", "VALID", "DUPLICATE", "INVALID"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setRowFilter(tab)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                        rowFilter === tab ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              }
            />

            <div className="max-h-96 overflow-auto rounded-xl border border-black/10">
              <table className="min-w-full divide-y divide-black/6 text-left text-xs">
                <thead className="sticky top-0 bg-neutral-50 text-[11px] font-bold uppercase text-neutral-500">
                  <tr>
                    <th className="px-3 py-2.5">Sheet / Row</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Customer &amp; Phone</th>
                    <th className="px-3 py-2.5">Requirement</th>
                    <th className="px-3 py-2.5">Quality</th>
                    <th className="px-3 py-2.5">Calls / Visits</th>
                    <th className="px-3 py-2.5">Notes / Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/6 bg-white">
                  {filteredPreviewRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-neutral-500">
                        No rows match this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPreviewRows.slice(0, 200).map((row) => {
                      const isInvalid = row.previewStatus === "INVALID";
                      const isDup =
                        row.previewStatus === "DUPLICATE_EXISTING" ||
                        row.previewStatus === "DUPLICATE_WORKBOOK";
                      return (
                        <tr
                          key={`${row.sheetName}-${row.sourceRow}-${row.phone || "empty"}`}
                          className={isInvalid ? "bg-red-50/40" : isDup ? "bg-amber-50/40" : ""}
                        >
                          <td className="px-3 py-2.5 whitespace-nowrap text-neutral-600">
                            <span className="font-semibold text-neutral-900">{row.sheetName}</span> #{row.sourceRow}
                            {row.sourceSerial ? <span className="block text-[11px] text-neutral-400">SR {row.sourceSerial}</span> : null}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {isInvalid ? (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 font-bold text-red-700">Invalid</span>
                            ) : isDup ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-800">Duplicate</span>
                            ) : (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">Importable</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-semibold text-neutral-900">{row.clientName || "—"}</p>
                            <p className="text-[11px] text-neutral-600">
                              {row.phone || "—"}
                              {row.alternatePhone ? ` / ${row.alternatePhone}` : ""}
                            </p>
                          </td>
                          <td className="max-w-xs px-3 py-2.5 text-neutral-700">
                            <p className="truncate font-medium">{row.requirement || "—"}</p>
                            <p className="text-[11px] text-neutral-400">{row.rawSource || row.source}</p>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <QualityBadge quality={row.quality ?? null} />
                            {row.rawQuality && !row.quality && (
                              <span className="block text-[10px] text-amber-700">raw: {row.rawQuality}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-neutral-600">
                            <span>{row.historicalFollowUps?.length ?? 0} call(s)</span>
                            {row.visitCandidate ? (
                              <span className="block text-[11px] text-emerald-700">+1 visit ({row.visitCandidate.status})</span>
                            ) : row.rawVisitNote ? (
                              <span className="block text-[11px] text-amber-700">visit note only</span>
                            ) : null}
                          </td>
                          <td className="max-w-xs px-3 py-2.5 text-[11px]">
                            {row.errors.map((err, i) => (
                              <p key={`e-${i}`} className="font-semibold text-red-700">{err}</p>
                            ))}
                            {row.duplicateReason && <p className="text-amber-800">{row.duplicateReason}</p>}
                            {row.warnings.map((warn, i) => (
                              <p key={`w-${i}`} className="text-amber-700">{warn}</p>
                            ))}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {filteredPreviewRows.length > 200 && (
              <p className="mt-2 text-xs text-neutral-500">
                Showing first 200 of {filteredPreviewRows.length} matching rows. All rows are processed on confirmation.
              </p>
            )}

            {/* Step 4: Confirm Import */}
            <div className="mt-5 space-y-3 rounded-xl border border-black/10 bg-neutral-50 p-4">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-bold text-neutral-800">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === "CREATE_SKIP_DUPLICATES"}
                    onChange={() => setImportMode("CREATE_SKIP_DUPLICATES")}
                    className="accent-brand-red"
                  />
                  Create New Leads &amp; Skip Duplicates
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-neutral-800">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === "DRY_RUN"}
                    onChange={() => setImportMode("DRY_RUN")}
                    className="accent-brand-red"
                  />
                  Dry Run (Simulate without writing leads)
                </label>
              </div>

              <label className="flex items-center gap-2 text-xs text-neutral-700">
                <input
                  type="checkbox"
                  checked={confirmChecked}
                  onChange={(e) => setConfirmChecked(e.target.checked)}
                  className="h-4 w-4 accent-brand-red"
                />
                I have reviewed the column mapping, duplicate rows, and warnings above and want to proceed.
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={confirming || !confirmChecked || selectedSheets.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 text-xs font-bold text-white hover:opacity-95 disabled:opacity-50"
                >
                  {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {importMode === "DRY_RUN" ? "Run Dry-Run Simulation" : "Confirm & Import Leads"}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Result Banner */}
      {lastCompletedJob && (
        <Card>
          <CardHeader
            title={`Import ${lastCompletedJob.importMode === "DRY_RUN" ? "Dry Run " : ""}Complete · ${lastCompletedJob.code ?? lastCompletedJob.id}`}
            subtitle={`Completed ${formatDateTime(lastCompletedJob.completedAt ?? lastCompletedJob.createdAt)}`}
            action={
              lastCompletedJob.errorSummaries?.length > 0 ? (
                <button
                  type="button"
                  onClick={() => downloadErrorSummaryCsv(lastCompletedJob)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50"
                >
                  <Download className="h-3.5 w-3.5" /> Download Row Report CSV
                </button>
              ) : undefined
            }
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-xl bg-emerald-50 p-3">
              <p className="text-[11px] font-bold uppercase text-emerald-700">Created</p>
              <p className="mt-1 text-xl font-extrabold text-emerald-900">{lastCompletedJob.createdCount}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-[11px] font-bold uppercase text-amber-700">Duplicates Skipped</p>
              <p className="mt-1 text-xl font-extrabold text-amber-900">{lastCompletedJob.duplicateCount}</p>
            </div>
            <div className="rounded-xl bg-red-50 p-3">
              <p className="text-[11px] font-bold uppercase text-red-700">Failed / Invalid</p>
              <p className="mt-1 text-xl font-extrabold text-red-900">{lastCompletedJob.failedCount}</p>
            </div>
            <div className="rounded-xl bg-neutral-100 p-3">
              <p className="text-[11px] font-bold uppercase text-neutral-600">Imported Calls</p>
              <p className="mt-1 text-xl font-extrabold text-neutral-900">{lastCompletedJob.followUpHistoryCount}</p>
            </div>
            <div className="rounded-xl bg-neutral-100 p-3">
              <p className="text-[11px] font-bold uppercase text-neutral-600">Visits / Warns</p>
              <p className="mt-1 text-xl font-extrabold text-neutral-900">
                {lastCompletedJob.visitHistoryCount} / {lastCompletedJob.visitWarningCount}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Dedicated Export Section */}
      <Card>
        <CardHeader
          title="Export Filtered CRM Leads"
          subtitle="Downloads clean .xlsx or .csv workbooks with IST dates, preserved phone strings, formula escaping, Follow-up History, and Customer Visits."
        />
        <form onSubmit={handleExport} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-semibold text-neutral-600">
            Format
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as "xlsx" | "csv")}
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-neutral-800"
            >
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-neutral-600">
            Search
            <input
              value={exportSearch}
              onChange={(e) => setExportSearch(e.target.value)}
              placeholder="Client, phone, requirement..."
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-neutral-800"
            />
          </label>
          <label className="text-xs font-semibold text-neutral-600">
            Status
            <select
              value={exportStatus}
              onChange={(e) => setExportStatus(e.target.value as LeadStatus | "All")}
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-neutral-800"
            >
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-neutral-600">
            Quality
            <select
              value={exportQuality}
              onChange={(e) => setExportQuality(e.target.value as LeadQuality | "UNCLASSIFIED" | "All")}
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-neutral-800"
            >
              {qualities.map((q) => <option key={q} value={q}>{q === "All" ? "All Qualities" : q}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-neutral-600">
            Priority
            <select
              value={exportPriority}
              onChange={(e) => setExportPriority(e.target.value as Priority | "All")}
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-neutral-800"
            >
              {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-neutral-600">
            Source
            <select
              value={exportSource}
              onChange={(e) => setExportSource(e.target.value as LeadSource | "All")}
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-neutral-800"
            >
              {sources.map((src) => <option key={src} value={src}>{src}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-neutral-600">
            Assigned Employee
            <select
              value={exportEmployeeId}
              onChange={(e) => setExportEmployeeId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-neutral-800"
            >
              <option value="All">All Employees</option>
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold text-neutral-600">
              From
              <input type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} className="mt-1 w-full rounded-xl border border-black/10 px-2.5 py-2 text-sm text-neutral-800" />
            </label>
            <label className="text-xs font-semibold text-neutral-600">
              To
              <input type="date" value={exportTo} onChange={(e) => setExportTo(e.target.value)} className="mt-1 w-full rounded-xl border border-black/10 px-2.5 py-2 text-sm text-neutral-800" />
            </label>
          </div>

          {exportFormat === "xlsx" && (
            <div className="flex flex-wrap gap-4 sm:col-span-2 lg:col-span-4">
              <label className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                <input type="checkbox" checked={includeFollowUps} onChange={(e) => setIncludeFollowUps(e.target.checked)} className="h-4 w-4 accent-brand-red" />
                Include Follow-up History sheet
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                <input type="checkbox" checked={includeVisits} onChange={(e) => setIncludeVisits(e.target.checked)} className="h-4 w-4 accent-brand-red" />
                Include Customer Visits sheet
              </label>
            </div>
          )}

          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export Filtered Leads
            </button>
          </div>
        </form>
      </Card>

      {/* Audit History */}
      <Card>
        <CardHeader
          title="Recent Import Jobs"
          subtitle="Audit log of Excel/CSV previews and completed historical migrations."
        />
        {jobsLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading import jobs…
          </div>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-neutral-500">No import jobs recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-black/6 text-left text-xs">
              <thead className="bg-neutral-50 text-[11px] font-bold uppercase text-neutral-500">
                <tr>
                  <th className="px-3 py-2.5">Job</th>
                  <th className="px-3 py-2.5">File</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Created / Dup / Failed</th>
                  <th className="px-3 py-2.5">By &amp; Time</th>
                  <th className="px-3 py-2.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/6 bg-white">
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="px-3 py-2.5 font-bold text-neutral-900">{job.code ?? job.id.slice(-6)}</td>
                    <td className="px-3 py-2.5 text-neutral-700">
                      <span className="font-medium">{job.fileName}</span>
                      <span className="block text-[11px] text-neutral-400">
                        {job.importMode} · {(job.selectedSheets ?? []).join(", ") || "All"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-bold text-neutral-800">{job.status}</span>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-neutral-700">
                      {job.createdCount} / {job.duplicateCount} / {job.failedCount}
                    </td>
                    <td className="px-3 py-2.5 text-neutral-500">
                      {job.importedByName || "Admin"} · {formatDateTime(job.completedAt ?? job.createdAt)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenJob(job.id)}
                        className="rounded-lg border border-black/10 px-2.5 py-1 text-xs font-bold text-neutral-700 hover:bg-neutral-50"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Job Details Modal */}
      {activeJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">
                  Import Job {activeJobModal.code ?? ""} — {activeJobModal.fileName}
                </h3>
                <p className="text-xs text-neutral-500">
                  {activeJobModal.status} · {activeJobModal.importMode} · Created {activeJobModal.createdCount}, Duplicates {activeJobModal.duplicateCount}, Failed {activeJobModal.failedCount}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveJobModal(null)}
                className="rounded-lg border border-black/10 px-2.5 py-1 text-xs font-bold text-neutral-600"
              >
                Close
              </button>
            </div>
            {(activeJobModal.errorSummaries?.length ?? 0) > 0 ? (
              <div className="mt-4 space-y-2">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => downloadErrorSummaryCsv(activeJobModal)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50"
                  >
                    <Download className="h-3.5 w-3.5" /> Export Issues CSV
                  </button>
                </div>
                <ul className="divide-y divide-black/6 rounded-xl border border-black/10 text-xs">
                  {activeJobModal.errorSummaries.map((item, idx) => (
                    <li key={idx} className="p-2.5">
                      <span className="font-bold">{item.code ?? "ROW"}</span> · {item.sheet} #{item.rowNumber}:{" "}
                      <span className="text-neutral-700">{item.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-4 text-sm text-neutral-500">No row errors recorded for this job.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
