"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Loader2, Phone, UserRound } from "lucide-react";
import { getLead, updateLeadQuality } from "@/lib/api/leads";
import { EmployeeLeadFollowUpPanel } from "@/components/employee/EmployeeLeadFollowUpPanel";
import { LeadVisitsPanel } from "@/components/visits/LeadVisitsPanel";
import { LeadQuotationPanel } from "@/components/quotations/LeadQuotationPanel";
import { LEAD_QUALITIES, QualityBadge } from "@/components/master-admin/ui/QualityBadge";
import { formatDate, formatDateTime } from "@/lib/format";
import type { Lead, LeadQuality } from "@/lib/types";

function LeadField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl bg-neutral-50 p-3.5">
      <p className="text-[11px] font-semibold text-neutral-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-neutral-800">{value || "—"}</p>
    </div>
  );
}

export default function EmployeeLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [result, setResult] = useState<{ id: string; lead: Lead | null } | null>(null);
  const [requestError, setRequestError] = useState<{ id: string; message: string } | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<LeadQuality | "">("");
  const [qualityReason, setQualityReason] = useState("");
  const [savingQuality, setSavingQuality] = useState(false);
  const [qualityError, setQualityError] = useState("");
  const [qualityNotice, setQualityNotice] = useState("");

  useEffect(() => {
    let active = true;
    getLead(id)
      .then((lead) => {
        if (!active) return;
        setResult({ id, lead: lead ?? null });
        setSelectedQuality(lead?.quality ?? "");
      })
      .catch((reason: unknown) => {
        if (active) setRequestError({ id, message: reason instanceof Error ? reason.message : "Could not load this lead." });
      });
    return () => {
      active = false;
    };
  }, [id]);

  const lead = result?.id === id ? result.lead : undefined;
  const error = requestError?.id === id ? requestError.message : "";
  if (lead === null) notFound();
  if (lead === undefined) {
    return error
      ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>
      : <p className="py-16 text-center text-sm text-neutral-500">Loading lead…</p>;
  }

  async function handleQualitySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lead || !selectedQuality) return;
    setSavingQuality(true);
    setQualityError("");
    setQualityNotice("");
    try {
      const updated = await updateLeadQuality(lead.id, selectedQuality, qualityReason);
      setResult({ id, lead: updated });
      setSelectedQuality(updated.quality ?? "");
      setQualityReason("");
      setQualityNotice(`Lead quality updated to ${updated.quality}.`);
    } catch (reason) {
      setQualityError(reason instanceof Error ? reason.message : "Could not update lead quality.");
    } finally {
      setSavingQuality(false);
    }
  }

  return (
    <div className="space-y-5">
      <Link href="/employee/leads" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-900">
        <ArrowLeft className="h-4 w-4" /> Back to My Leads
      </Link>

      <section className="rounded-2xl border border-black/6 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">{lead.code || "Assigned lead"}</p>
            <h1 className="mt-1 break-words text-xl font-extrabold text-neutral-900 sm:text-2xl">{lead.company || lead.clientName}</h1>
            {lead.contactPersonName && <p className="mt-1 text-sm text-neutral-500">{lead.contactPersonName}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <QualityBadge quality={lead.quality} />
            <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-700">{lead.status}</span>
            <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">{lead.priority}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <LeadField label="Primary mobile" value={lead.phone} />
          <LeadField label="Alternate mobile" value={lead.alternatePhone} />
          <LeadField label="Email" value={lead.email} />
          <LeadField label="Service required" value={lead.service} />
          <LeadField label="Lead source" value={lead.source} />
          <LeadField label="Quantity / size / dimensions" value={lead.quantitySizeDimensions} />
          <LeadField label="Enquiry date" value={formatDate(lead.enquiryDate)} />
          <LeadField label="Expected completion" value={formatDate(lead.deadline)} />
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-bold text-neutral-900">Requirement</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-600">{lead.requirement || lead.description || "No requirement details provided."}</p>
          {lead.description && lead.requirement !== lead.description && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-600">{lead.description}</p>
          )}
        </div>

      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/6 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-neutral-500"><UserRound className="h-4 w-4" /><h2 className="text-sm font-bold text-neutral-900">Assignment</h2></div>
          <p className="mt-3 text-sm text-neutral-600">Assigned {formatDate(lead.assignedDate || lead.createdAt)}</p>
        </div>
        <div className="rounded-2xl border border-black/6 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-neutral-500"><CalendarDays className="h-4 w-4" /><h2 className="text-sm font-bold text-neutral-900">Record timestamps</h2></div>
          <p className="mt-3 text-xs text-neutral-500">Created {formatDateTime(lead.createdAt)}</p>
          <p className="mt-1 text-xs text-neutral-500">Updated {formatDateTime(lead.updatedAt)}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-black/6 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Lead Quality</h2>
            <p className="mt-0.5 text-xs text-neutral-500">Quality is tracked independently of workflow status and does not use a follow-up attempt.</p>
          </div>
          <QualityBadge quality={lead.quality} />
        </div>
        <form onSubmit={handleQualitySubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={selectedQuality}
            onChange={(event) => setSelectedQuality(event.target.value as LeadQuality | "")}
            aria-label="Update lead quality"
            className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-800 sm:w-48"
          >
            <option value="" disabled>Select quality…</option>
            {LEAD_QUALITIES.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
          <input
            value={qualityReason}
            onChange={(event) => setQualityReason(event.target.value)}
            maxLength={500}
            placeholder="Reason for quality change (optional)"
            className="min-w-0 flex-1 rounded-xl border border-black/10 px-3 py-2.5 text-sm text-neutral-800"
          />
          <button
            type="submit"
            disabled={savingQuality || !selectedQuality || selectedQuality === (lead.quality ?? "")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {savingQuality && <Loader2 className="h-4 w-4 animate-spin" />}
            Save quality
          </button>
        </form>
        {qualityError && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{qualityError}</p>}
        {qualityNotice && <p role="status" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{qualityNotice}</p>}
        {Boolean(lead.qualityHistory?.length) && (
          <ol className="mt-4 space-y-2 border-t border-black/5 pt-4 text-xs">
            {[...(lead.qualityHistory ?? [])].reverse().map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-neutral-50 px-3 py-2">
                <span className="font-semibold text-neutral-700">
                  {item.fromQuality ?? "Unclassified"} → {item.toQuality ?? "Unclassified"}
                  {item.reason ? ` · ${item.reason}` : ""}
                </span>
                <span className="text-neutral-400">{formatDateTime(item.timestamp)} · {item.actor}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <EmployeeLeadFollowUpPanel leadId={lead.id} />
      <LeadVisitsPanel leadId={lead.id} defaultContactPerson={lead.contactPersonName} audience="employee" />
      <LeadQuotationPanel leadId={lead.id} audience="employee" />

      <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-neutral-800">
        <Phone className="h-4 w-4" /> Call client
      </a>
    </div>
  );
}
