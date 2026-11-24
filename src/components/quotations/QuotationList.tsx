"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FilePlus2, Search, TriangleAlert } from "lucide-react";
import { EmployeePagination } from "@/components/employee/EmployeePagination";
import { EmptyState } from "@/components/master-admin/ui/EmptyState";
import { Pagination } from "@/components/master-admin/ui/Pagination";
import {
  formatPaise,
  formatQuotationDate,
  getQuotationSummary,
  getQuotationsPage,
  type Quotation,
  type QuotationStatus,
} from "@/lib/api/quotations";

const pageSize = 20;
const statuses: Array<QuotationStatus | "All"> = [
  "All",
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "REVISION_REQUESTED",
];

function statusTone(status: QuotationStatus) {
  if (status === "APPROVED" || status === "ACCEPTED") return "bg-emerald-50 text-emerald-700";
  if (status === "PENDING_APPROVAL" || status === "REVISION_REQUESTED") return "bg-amber-50 text-amber-800";
  if (status === "REJECTED" || status === "EXPIRED") return "bg-red-50 text-red-700";
  return "bg-neutral-100 text-neutral-700";
}

function rowHref(audience: "admin" | "employee", quote: Quotation) {
  return `${audience === "admin" ? "/master-admin" : "/employee"}/quotations/${quote.id}`;
}

export function QuotationList({ audience }: { audience: "admin" | "employee" }) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<QuotationStatus | "All">("All");
  const [expiringOnly, setExpiringOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [expiringSoon, setExpiringSoon] = useState(0);
  const [expired, setExpired] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      getQuotationsPage({
        page,
        limit: pageSize,
        search: search.trim(),
        status: expiringOnly ? "SENT" : status,
        expiringOnly: expiringOnly ? "true" : undefined,
      }),
      getQuotationSummary(),
    ])
      .then(([result, summary]) => {
        if (!active) return;
        setQuotations(result.quotations);
        setTotal(result.meta.total);
        setTotalPages(result.meta.totalPages);
        setExpiringSoon(summary.expiringSoon);
        setExpired(summary.expired);
        setError("");
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load quotations.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, search, status, expiringOnly]);

  function changeFilter(update: () => void) {
    setPage(1);
    setLoading(true);
    update();
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-neutral-500">Search, review, and track quotation versions independently of lead and work status.</p>
        </div>
        <Link href={`${audience === "admin" ? "/master-admin" : "/employee"}/quotations/new`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800">
          <FilePlus2 className="h-4 w-4" /> New quotation
        </Link>
      </section>

      {(expiringSoon > 0 || expired > 0) && (
        <section className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5 text-amber-950">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="text-sm">
              <p className="font-bold">Quotation expiry reminder</p>
              <p className="mt-0.5 text-xs text-amber-800">
                {expiringSoon} sent quote(s) expire in the next 7 days · {expired} sent quote(s) are past their validity date.
              </p>
            </div>
          </div>
          <button type="button" onClick={() => changeFilter(() => setExpiringOnly((value) => !value))} className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100">
            {expiringOnly ? "Show all quotes" : "Show expiring"}
          </button>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-2xl border border-black/6 bg-white p-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:p-4">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-neutral-100 px-3 py-2.5 sm:min-w-56">
          <Search className="h-4 w-4 shrink-0 text-neutral-400" />
          <input value={search} onChange={(event) => changeFilter(() => setSearch(event.target.value))} placeholder="Search number, client, or lead…" aria-label="Search quotations" className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400" />
        </label>
        <select value={status} onChange={(event) => changeFilter(() => setStatus(event.target.value as QuotationStatus | "All"))} aria-label="Filter quotations by status" disabled={expiringOnly} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-700 disabled:bg-neutral-100">
          {statuses.map((item) => <option key={item} value={item}>{item === "All" ? "All statuses" : item.replaceAll("_", " ")}</option>)}
        </select>
      </section>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <section className="overflow-hidden rounded-2xl border border-black/6 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-4">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-neutral-100" />)}</div>
        ) : quotations.length === 0 ? (
          <EmptyState icon={Search} title="No quotations found" description="Create a draft from an existing lead or client, or adjust the filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-neutral-50 text-[11px] uppercase tracking-wide text-neutral-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Quotation</th>
                    <th className="px-4 py-3 font-semibold">Client / Lead</th>
                    <th className="px-4 py-3 font-semibold">Version</th>
                    <th className="px-4 py-3 font-semibold">Valid until</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {quotations.map((quote) => (
                    <tr key={quote.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3"><Link href={rowHref(audience, quote)} className="font-bold text-neutral-900 hover:text-brand-red">{quote.quotationNumber}</Link></td>
                      <td className="px-4 py-3">
                        <Link href={rowHref(audience, quote)} className="block font-semibold text-neutral-800 hover:text-brand-red">{quote.clientDetails.company || quote.clientDetails.name}</Link>
                        {quote.leadCode && <span className="text-xs text-neutral-400">{quote.leadCode}</span>}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">v{quote.version}</td>
                      <td className="px-4 py-3 text-neutral-600">{formatQuotationDate(quote.validUntil)}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusTone(quote.status)}`}>{quote.status.replaceAll("_", " ")}</span></td>
                      <td className="px-4 py-3 text-right font-bold text-neutral-900">{formatPaise(quote.totals.grandTotalPaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {audience === "admin" ? (
              <div className="px-4 pb-4"><Pagination page={page} totalPages={totalPages} totalItems={total} pageSize={pageSize} onChange={(next) => { setLoading(true); setPage(next); }} /></div>
            ) : totalPages > 1 ? (
              <EmployeePagination page={page} totalPages={totalPages} onChange={(next) => { setLoading(true); setPage(next); }} />
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
