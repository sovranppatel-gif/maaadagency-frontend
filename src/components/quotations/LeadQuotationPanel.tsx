"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { getQuotationsPage, formatPaise, formatQuotationDate, type Quotation } from "@/lib/api/quotations";

export function LeadQuotationPanel({
  leadId,
  audience,
}: {
  leadId: string;
  audience: "admin" | "employee";
}) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const root = audience === "admin" ? "/master-admin" : "/employee";

  useEffect(() => {
    let active = true;
    getQuotationsPage({ leadId, page: 1, limit: 10 })
      .then(({ quotations: result }) => {
        if (!active) return;
        setQuotations(result);
        setError("");
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load linked quotations.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [leadId]);

  return (
    <section className="space-y-3 rounded-2xl border border-black/6 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-neutral-900">Linked quotations</h2>
          <p className="mt-1 text-xs text-neutral-500">Quotation status is tracked separately from Lead sales status.</p>
        </div>
        <Link href={`${root}/quotations/new?leadId=${encodeURIComponent(leadId)}`} className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50">
          <FilePlus2 className="h-3.5 w-3.5" /> New quote
        </Link>
      </div>

      {error && <p role="status" className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">{error}</p>}
      {loading ? <p className="py-3 text-sm text-neutral-400">Loading quotations…</p> : quotations.length === 0 ? (
        <p className="rounded-xl bg-neutral-50 px-4 py-5 text-sm text-neutral-500">No quotations linked to this lead.</p>
      ) : (
        <ul className="divide-y divide-black/5">
          {quotations.map((quote) => (
            <li key={quote.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <Link href={`${root}/quotations/${quote.id}`} className="font-semibold text-neutral-800 hover:text-red-700">
                {quote.quotationNumber} · v{quote.version} · {quote.status.replaceAll("_", " ")}
                <span className="mt-0.5 block text-xs font-normal text-neutral-500">Valid until {formatQuotationDate(quote.validUntil)}</span>
              </Link>
              <span className="text-sm font-bold text-neutral-900">{formatPaise(quote.totals.grandTotalPaise)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
