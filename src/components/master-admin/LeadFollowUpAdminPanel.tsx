"use client";

import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, Loader2, LockKeyhole, ShieldAlert } from "lucide-react";
import { EmployeePagination } from "@/components/employee/EmployeePagination";
import { HistoricalFollowUpsList } from "@/components/leads/HistoricalFollowUpsList";
import {
  authorizeMoreFollowUps,
  CALL_RESPONSE_OPTIONS,
  callResponseLabel,
  closeLeadFollowUps,
  getLeadFollowUps,
  type CallResponse,
  type FollowUpPageMeta,
  type LeadFollowUp,
} from "@/lib/api/followUps";
import { formatDateTime } from "@/lib/format";

export function LeadFollowUpAdminPanel({ leadId }: { leadId: string }) {
  const [followUps, setFollowUps] = useState<LeadFollowUp[]>([]);
  const [meta, setMeta] = useState<FollowUpPageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [callResponseFilter, setCallResponseFilter] = useState<CallResponse | "All">("All");
  const [additionalAttempts, setAdditionalAttempts] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    getLeadFollowUps(leadId, page, 50, callResponseFilter)
      .then(({ followUps: result, meta: pageMeta }) => {
        if (!active) return;
        setFollowUps(result);
        setMeta(pageMeta);
        setTotalPages(pageMeta.totalPages);
        setError("");
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load follow-up history.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [leadId, page, callResponseFilter, refreshKey]);

  async function authorizeMore() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await authorizeMoreFollowUps(leadId, additionalAttempts);
      setNotice(`${additionalAttempts} additional attempt(s) authorized.`);
      setPage(1);
      setRefreshKey((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not authorize more follow-ups.");
    } finally {
      setSaving(false);
    }
  }

  async function closeSequence() {
    if (!window.confirm("Close further follow-ups for this lead? Existing history will remain available.")) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await closeLeadFollowUps(leadId);
      setNotice("The follow-up sequence is closed. Existing history is preserved.");
      setPage(1);
      setRefreshKey((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not close follow-ups.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-black/6 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-neutral-900">Lead follow-up history</h2>
          <p className="mt-1 text-sm text-neutral-500">
            {meta?.attempts ?? 0} recorded · {meta?.maxAttempts ?? 4} authorized attempt(s)
          </p>
        </div>
        {meta?.reviewRequired && !meta.closed && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900"><ShieldAlert className="h-3.5 w-3.5" /> Review required</span>
        )}
        {meta?.closed && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-600"><LockKeyhole className="h-3.5 w-3.5" /> Closed</span>
        )}
      </div>

      {meta?.reviewRequired && !meta.closed && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-end">
          <label className="text-xs font-semibold text-amber-950">
            Authorize additional attempts (1–4)
            <select value={additionalAttempts} onChange={(event) => setAdditionalAttempts(Number(event.target.value))} className="mt-1.5 block rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-neutral-800">
              {[1, 2, 3, 4].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <button type="button" onClick={authorizeMore} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-900 disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Authorize more
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {!meta?.closed && <button type="button" onClick={closeSequence} disabled={saving} className="rounded-xl border border-neutral-200 px-3.5 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-50 disabled:opacity-60">Close follow-ups</button>}
        <select
          value={callResponseFilter}
          onChange={(event) => {
            setPage(1);
            setLoading(true);
            setCallResponseFilter(event.target.value as CallResponse | "All");
          }}
          aria-label="Filter follow-ups by call response"
          className="ml-auto rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-neutral-700"
        >
          <option value="All">All call responses</option>
          {CALL_RESPONSE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading follow-ups…</div>
      ) : followUps.length === 0 ? (
        <p className="rounded-xl bg-neutral-50 p-5 text-sm text-neutral-500">No follow-ups recorded.</p>
      ) : (
        <ol className="space-y-3">
          {followUps.map((followUp) => (
            <li key={followUp.id} className="rounded-xl border border-black/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-neutral-900">Attempt {followUp.attemptNumber} · {followUp.communicationType}</p>
                    {followUp.callResponse && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                        {callResponseLabel(followUp.callResponse)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">{followUp.employee?.name ?? "Employee"}{followUp.employee?.code ? ` · ${followUp.employee.code}` : ""}</p>
                </div>
                <p className="text-xs text-neutral-400">{formatDateTime(followUp.contactedAt)}</p>
              </div>
              {followUp.customerResponse && <p className="mt-3 text-sm text-neutral-700"><span className="font-semibold">Customer response:</span> {followUp.customerResponse}</p>}
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-600">{followUp.discussionNotes}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-500">
                <span>Interest: {followUp.interestLevel}</span>
                {followUp.nextFollowUpAt && <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> Next: {formatDateTime(followUp.nextFollowUpAt)}</span>}
                {followUp.quotationRequired && <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Quotation requested</span>}
              </div>
              {followUp.employeeRemarks && <p className="mt-2 text-xs text-neutral-500">Employee remarks: {followUp.employeeRemarks}</p>}
            </li>
          ))}
        </ol>
      )}
      {!loading && totalPages > 1 && <EmployeePagination page={page} totalPages={totalPages} disabled={saving} onChange={(nextPage) => { setPage(nextPage); setLoading(true); }} />}

      {!loading && <HistoricalFollowUpsList items={meta?.historicalFollowUps} />}
    </section>
  );
}
