"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Loader2, X } from "lucide-react";
import { downloadLeadsExport } from "@/lib/api/importExport";
import { ApiError } from "@/lib/http";
import type { LeadQuality, LeadSource, LeadStatus, Priority } from "@/lib/types";
import { LEAD_QUALITIES } from "@/components/master-admin/ui/QualityBadge";

interface ExportLeadsModalProps {
  open: boolean;
  onClose: () => void;
  audience?: "admin" | "employee";
  initialFilters?: {
    search?: string;
    status?: LeadStatus | "All";
    priority?: Priority | "All";
    quality?: LeadQuality | "UNCLASSIFIED" | "All";
    source?: LeadSource | "All";
    service?: string;
    employeeId?: string;
  };
  defaultIncludeFollowUps?: boolean;
  defaultIncludeVisits?: boolean;
  employees?: Array<{ id: string; name: string }>;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const statuses: (LeadStatus | "All")[] = ["All", "New", "Assigned", "In Progress", "Submitted", "Changes Requested", "Approved", "Completed"];
const priorities: (Priority | "All")[] = ["All", "LOW", "MEDIUM", "HIGH", "URGENT"];
const qualities: (LeadQuality | "UNCLASSIFIED" | "All")[] = ["All", ...LEAD_QUALITIES, "UNCLASSIFIED"];
const sources: (LeadSource | "All")[] = ["All", "WhatsApp", "Website", "Manual", "Referral", "Phone Call", "Office Walk-in", "Other"];

export function ExportLeadsModal({
  open,
  onClose,
  audience = "admin",
  initialFilters,
  defaultIncludeFollowUps = true,
  defaultIncludeVisits = true,
  employees = [],
  onSuccess,
  onError,
}: ExportLeadsModalProps) {
  const [format, setFormat] = useState<"xlsx" | "csv">("xlsx");
  const [status, setStatus] = useState<LeadStatus | "All">(initialFilters?.status ?? "All");
  const [priority, setPriority] = useState<Priority | "All">(initialFilters?.priority ?? "All");
  const [quality, setQuality] = useState<LeadQuality | "UNCLASSIFIED" | "All">(initialFilters?.quality ?? "All");
  const [source, setSource] = useState<LeadSource | "All">(initialFilters?.source ?? "All");
  const [employeeId, setEmployeeId] = useState<string>(initialFilters?.employeeId ?? "All");
  const [search, setSearch] = useState<string>(initialFilters?.search ?? "");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [includeFollowUps, setIncludeFollowUps] = useState(defaultIncludeFollowUps);
  const [includeVisits, setIncludeVisits] = useState(defaultIncludeVisits);
  const [downloading, setDownloading] = useState(false);
  const [localError, setLocalError] = useState("");

  if (!open) return null;

  const handleDownload = async (event: React.FormEvent) => {
    event.preventDefault();
    setDownloading(true);
    setLocalError("");
    try {
      const filename = await downloadLeadsExport({
        format,
        search: search.trim() || undefined,
        status,
        priority,
        quality,
        source,
        employeeId: audience === "admin" ? employeeId : undefined,
        from: from || undefined,
        to: to || undefined,
        includeFollowUps: format === "xlsx" ? includeFollowUps : false,
        includeVisits: format === "xlsx" ? includeVisits : false,
      });
      onSuccess?.(`Exported ${filename}`);
      onClose();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not export leads.";
      setLocalError(message);
      onError?.(message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-black/10 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-neutral-900">Export Leads</h2>
              <p className="text-xs text-neutral-500">
                {audience === "employee"
                  ? "Exports only leads currently assigned to your account."
                  : "Exports filtered leads in Asia/Kolkata (IST) format (up to 10,000 rows)."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export modal"
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleDownload} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormat("xlsx")}
              className={`rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition ${
                format === "xlsx"
                  ? "border-brand-red bg-brand-red/5 text-brand-red"
                  : "border-black/10 bg-white text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              Excel (.xlsx)
              <span className="mt-0.5 block font-normal text-neutral-500">Multi-sheet workbook</span>
            </button>
            <button
              type="button"
              onClick={() => setFormat("csv")}
              className={`rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition ${
                format === "csv"
                  ? "border-brand-red bg-brand-red/5 text-brand-red"
                  : "border-black/10 bg-white text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              CSV (.csv)
              <span className="mt-0.5 block font-normal text-neutral-500">UTF-8 BOM compatible</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-neutral-600 sm:col-span-2">
              Search filter
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Client name, phone, requirement, code..."
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm font-normal text-neutral-800 outline-none focus:border-brand-red"
              />
            </label>
            <label className="text-xs font-semibold text-neutral-600">
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus | "All")}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-normal text-neutral-800"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-neutral-600">
              Quality
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as LeadQuality | "UNCLASSIFIED" | "All")}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-normal text-neutral-800"
              >
                {qualities.map((q) => (
                  <option key={q} value={q}>{q === "All" ? "All Qualities" : q}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-neutral-600">
              Priority
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority | "All")}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-normal text-neutral-800"
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-neutral-600">
              Source
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource | "All")}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-normal text-neutral-800"
              >
                {sources.map((src) => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </label>
            {audience === "admin" && employees.length > 0 && (
              <label className="text-xs font-semibold text-neutral-600 sm:col-span-2">
                Assigned Employee
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-normal text-neutral-800"
                >
                  <option value="All">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="text-xs font-semibold text-neutral-600">
              From date
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm font-normal text-neutral-800"
              />
            </label>
            <label className="text-xs font-semibold text-neutral-600">
              To date
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm font-normal text-neutral-800"
              />
            </label>
          </div>

          {format === "xlsx" && (
            <div className="space-y-2 rounded-xl border border-black/6 bg-neutral-50 p-3">
              <label className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                <input
                  type="checkbox"
                  checked={includeFollowUps}
                  onChange={(e) => setIncludeFollowUps(e.target.checked)}
                  className="h-4 w-4 accent-brand-red"
                />
                Include &ldquo;Follow-up History&rdquo; sheet (live CRM + imported Excel calls)
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                <input
                  type="checkbox"
                  checked={includeVisits}
                  onChange={(e) => setIncludeVisits(e.target.checked)}
                  className="h-4 w-4 accent-brand-red"
                />
                Include &ldquo;Customer Visits&rdquo; sheet
              </label>
            </div>
          )}

          {localError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{localError}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={downloading}
              className="rounded-xl border border-black/10 px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-red px-4 py-2 text-xs font-bold text-white hover:opacity-95 disabled:opacity-60"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download {format.toUpperCase()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
