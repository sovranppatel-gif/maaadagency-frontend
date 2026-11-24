"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowLeft, FileText, Loader2, RotateCcw, Send, ShieldCheck } from "lucide-react";
import { QuotationEditor } from "./QuotationEditor";
import {
  approveQuotation,
  expireQuotation,
  formatPaise,
  formatQuotationDate,
  getQuotationPdf,
  recordCustomerDecision,
  recordQuotationSent,
  rejectQuotation,
  requestQuotationRevision,
  startQuotationRevision,
  type Quotation,
} from "@/lib/api/quotations";
import { formatDate, formatDateTime } from "@/lib/format";

function isEditable(quote: Quotation) {
  return quote.status === "DRAFT" || quote.status === "REVISION_REQUESTED";
}

function canOpenPdf(quote: Pick<Quotation, "status" | "approvalStatus">) {
  return quote.approvalStatus === "APPROVED" && ["APPROVED", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"].includes(quote.status);
}

function statusColor(status: Quotation["status"]) {
  if (status === "APPROVED" || status === "ACCEPTED") return "bg-emerald-50 text-emerald-800";
  if (status === "PENDING_APPROVAL" || status === "REVISION_REQUESTED") return "bg-amber-50 text-amber-900";
  if (status === "REJECTED" || status === "EXPIRED") return "bg-red-50 text-red-800";
  return "bg-neutral-100 text-neutral-700";
}

export function QuotationDetail({
  initialQuotation,
  audience,
}: {
  initialQuotation: Quotation;
  audience: "admin" | "employee";
}) {
  const [quotation, setQuotation] = useState(initialQuotation);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reason, setReason] = useState("");
  const [sentMethod, setSentMethod] = useState<NonNullable<Quotation["sentMethod"]>>("EMAIL");
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfVersion, setPdfVersion] = useState(quotation.version);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const actionKeys = useRef(new Map<string, string>());
  const isAdmin = audience === "admin";
  const quotePath = isAdmin ? "/master-admin/quotations" : "/employee/quotations";
  const leadPath = isAdmin ? "/master-admin/leads" : "/employee/leads";

  useEffect(() => {
    const initialTimer = window.setTimeout(() => setCurrentTime(Date.now()), 0);
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  }, [pdfUrl]);

  async function runAction(action: string, operation: (key: string) => Promise<Quotation>, message: string) {
    setWorking(true);
    setError("");
    setNotice("");
    let key = actionKeys.current.get(action);
    if (!key) {
      key = crypto.randomUUID();
      actionKeys.current.set(action, key);
    }
    try {
      const updated = await operation(key);
      actionKeys.current.delete(action);
      setQuotation(updated);
      if (updated.version !== quotation.version) setPdfVersion(updated.version);
      setReason("");
      setNotice(`${message}: ${updated.quotationNumber} · ${updated.status.replaceAll("_", " ")}.`);
    } catch (reasonError) {
      setError(reasonError instanceof Error ? reasonError.message : `Could not ${action.replaceAll("_", " ")}.`);
    } finally {
      setWorking(false);
    }
  }

  async function loadPdf(version = quotation.version, download = false) {
    setPdfLoading(true);
    setError("");
    try {
      const blob = await getQuotationPdf(quotation.id, version === quotation.version ? undefined : version);
      const nextUrl = URL.createObjectURL(blob);
      setPdfUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return nextUrl;
      });
      setPdfVersion(version);
      if (download) {
        const anchor = document.createElement("a");
        anchor.href = nextUrl;
        anchor.download = `${quotation.quotationNumber}-v${version}.pdf`;
        anchor.click();
      }
    } catch (reasonError) {
      setError(reasonError instanceof Error ? reasonError.message : "Could not generate the quotation PDF.");
    } finally {
      setPdfLoading(false);
    }
  }

  const expiryTime = new Date(quotation.validUntil).getTime();
  const isExpiredByDate = currentTime !== null && expiryTime < currentTime;
  const expiresSoon = currentTime !== null && expiryTime >= currentTime && expiryTime < currentTime + 7 * 24 * 60 * 60 * 1000;
  const canStartRevision = ["APPROVED", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"].includes(quotation.status);
  const selectedPdfVersion = pdfVersion === quotation.version
    ? quotation
    : quotation.versions.find((version) => version.version === pdfVersion);
  const canOpenSelectedPdf = Boolean(selectedPdfVersion && canOpenPdf(selectedPdfVersion));

  return (
    <div className="space-y-5">
      <Link href={quotePath} className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-900">
        <ArrowLeft className="h-4 w-4" /> Back to quotations
      </Link>

      <section className="rounded-2xl border border-black/6 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">{quotation.quotationNumber} · Version {quotation.version}</p>
            <h2 className="mt-1 text-xl font-extrabold text-neutral-900">{quotation.clientDetails.company || quotation.clientDetails.name}</h2>
            <p className="mt-1 text-sm text-neutral-500">
              {quotation.leadId && <Link href={`${leadPath}/${quotation.leadId}`} className="font-semibold text-red-700 hover:underline">{quotation.leadCode || "Linked lead"}</Link>}
              {quotation.leadId && " · "}{quotation.clientDetails.phone || quotation.clientDetails.email || "Client contact not supplied"}
            </p>
          </div>
          <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${statusColor(quotation.status)}`}>{quotation.status.replaceAll("_", " ")}</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-neutral-50 p-3"><p className="text-[11px] font-semibold text-neutral-400">Approval</p><p className="mt-1 text-sm font-bold text-neutral-800">{quotation.approvalStatus.replaceAll("_", " ")}</p></div>
          <div className="rounded-xl bg-neutral-50 p-3"><p className="text-[11px] font-semibold text-neutral-400">Valid from</p><p className="mt-1 text-sm font-bold text-neutral-800">{formatQuotationDate(quotation.validFrom)}</p></div>
          <div className="rounded-xl bg-neutral-50 p-3"><p className="text-[11px] font-semibold text-neutral-400">Valid until</p><p className="mt-1 text-sm font-bold text-neutral-800">{formatQuotationDate(quotation.validUntil)}</p></div>
          <div className="rounded-xl bg-neutral-50 p-3"><p className="text-[11px] font-semibold text-neutral-400">Grand total</p><p className="mt-1 text-sm font-extrabold text-neutral-900">{formatPaise(quotation.totals.grandTotalPaise)}</p></div>
        </div>

        {(expiresSoon || (quotation.status === "SENT" && isExpiredByDate)) && (
          <p className={`mt-4 rounded-xl border p-3 text-xs font-semibold ${isExpiredByDate ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
            {isExpiredByDate ? "This sent quotation has passed its validity date. Admin may record it as expired." : "This sent quotation expires within 7 days."}
          </p>
        )}
        {quotation.revisionReason && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>Revision requested:</strong> {quotation.revisionReason}</p>}
        {quotation.rejectionReason && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900"><strong>{quotation.rejectionType === "CUSTOMER" ? "Customer response:" : "Approval decision:"}</strong> {quotation.rejectionReason}</p>}
        {quotation.customerDecision && <p className="mt-3 text-xs text-neutral-500">Customer {quotation.customerDecision.outcome.toLowerCase()} recorded {formatDateTime(quotation.customerDecision.decidedAt)}{quotation.customerDecision.note ? ` · ${quotation.customerDecision.note}` : ""}. Internal approval remains {quotation.approvalStatus.toLowerCase()}.</p>}
        {quotation.approvedAt && <p className="mt-3 flex items-center gap-2 text-xs text-neutral-500"><ShieldCheck className="h-4 w-4 text-emerald-700" /> Approved by {quotation.approvedByName || "Master Admin"} on {formatDateTime(quotation.approvedAt)}.</p>}
        {quotation.sentAt && <p className="mt-1 flex items-center gap-2 text-xs text-neutral-500"><Send className="h-4 w-4" /> Recorded sent by {quotation.sentByName || "Admin"} via {quotation.sentMethod?.replaceAll("_", " ")} on {formatDateTime(quotation.sentAt)}.</p>}
      </section>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      {isEditable(quotation) && (
        <QuotationEditor
          key={`${quotation.id}-${quotation.version}-${quotation.status}`}
          audience={audience}
          quotation={quotation}
          onSaved={setQuotation}
        />
      )}

      {quotation.status === "PENDING_APPROVAL" && isAdmin && (
        <section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <h3 className="text-sm font-extrabold text-amber-950">Approval decision</h3>
          <label className="block text-xs font-semibold text-amber-950">
            Reason for rejection or requested revision
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={2000} rows={3} className="mt-1.5 w-full rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-sm font-normal text-neutral-800" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={working} onClick={() => void runAction("approve", (key) => approveQuotation(quotation.id, key), "Quotation approved")} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Approve</button>
            <button type="button" disabled={working || !reason.trim()} onClick={() => void runAction("revision_requested", (key) => requestQuotationRevision(quotation.id, reason.trim(), key), "Revision requested")} className="rounded-xl border border-amber-400 bg-white px-4 py-2.5 text-sm font-bold text-amber-950 disabled:opacity-50">Request revision</button>
            <button type="button" disabled={working || !reason.trim()} onClick={() => void runAction("reject", (key) => rejectQuotation(quotation.id, reason.trim(), key), "Quotation rejected")} className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-800 disabled:opacity-50">Reject</button>
          </div>
        </section>
      )}

      {quotation.status === "APPROVED" && isAdmin && (
        <section className="flex flex-col gap-3 rounded-2xl border border-black/6 bg-white p-4 sm:flex-row sm:items-end">
          <label className="text-xs font-semibold text-neutral-600">Sent by
            <select value={sentMethod} onChange={(event) => setSentMethod(event.target.value as NonNullable<Quotation["sentMethod"]>)} className="mt-1.5 block rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-normal">
              <option value="EMAIL">Email</option><option value="WHATSAPP">WhatsApp</option><option value="IN_PERSON">In person</option><option value="OTHER">Other</option>
            </select>
          </label>
          <button type="button" disabled={working} onClick={() => void runAction("sent", (key) => recordQuotationSent(quotation.id, sentMethod, key), "Sent date recorded")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" /> Record as sent</button>
        </section>
      )}

      {quotation.status === "SENT" && (
        <section className="flex flex-wrap items-end gap-3 rounded-2xl border border-black/6 bg-white p-4">
          <label className="min-w-56 flex-1 text-xs font-semibold text-neutral-600">Customer response note (optional)
            <input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={2000} className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm font-normal" />
          </label>
          <button type="button" disabled={working} onClick={() => void runAction("customer_accepted", (key) => recordCustomerDecision(quotation.id, "ACCEPTED", reason.trim(), key), "Customer acceptance recorded")} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Record accepted</button>
          <button type="button" disabled={working} onClick={() => void runAction("customer_rejected", (key) => recordCustomerDecision(quotation.id, "REJECTED", reason.trim(), key), "Customer rejection recorded")} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-800 disabled:opacity-50">Record rejected</button>
          {isAdmin && isExpiredByDate && <button type="button" disabled={working} onClick={() => void runAction("expire", (key) => expireQuotation(quotation.id, key), "Quotation marked expired")} className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-bold text-neutral-700 disabled:opacity-50">Mark expired</button>}
        </section>
      )}

      {canStartRevision && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm text-blue-950">Start a new quotation version. The current approved/customer-facing version will remain in history.</p>
          <button type="button" disabled={working} onClick={() => void runAction("revision", (key) => startQuotationRevision(quotation.id, key), "New version created")} className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><RotateCcw className="h-4 w-4" /> Start revision</button>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-black/6 bg-white shadow-sm">
        <div className="border-b border-black/5 px-4 py-4 sm:px-5">
          <h3 className="text-sm font-extrabold text-neutral-900">Quotation amounts · INR</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[660px] text-left text-sm">
            <thead className="bg-neutral-50 text-[11px] uppercase tracking-wide text-neutral-400"><tr><th className="px-4 py-3">Service</th><th className="px-4 py-3 text-right">Quantity</th><th className="px-4 py-3 text-right">Rate</th><th className="px-4 py-3 text-right">Discount</th><th className="px-4 py-3 text-right">Tax</th><th className="px-4 py-3 text-right">Line total</th></tr></thead>
            <tbody className="divide-y divide-black/5">
              {quotation.lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3"><p className="font-semibold text-neutral-800">{item.serviceName}</p>{item.description && <p className="mt-1 max-w-md whitespace-pre-wrap text-xs text-neutral-500">{item.description}</p>}</td>
                  <td className="px-4 py-3 text-right text-neutral-600">{(item.quantityMilli / 1000).toFixed(3).replace(/\.?0+$/, "")} {item.unit}</td>
                  <td className="px-4 py-3 text-right text-neutral-600">{formatPaise(item.unitRatePaise)}</td>
                  <td className="px-4 py-3 text-right text-neutral-600">{formatPaise(item.discountPaise)}</td>
                  <td className="px-4 py-3 text-right text-neutral-600">{formatPaise(item.taxPaise)}</td>
                  <td className="px-4 py-3 text-right font-bold text-neutral-900">{formatPaise(item.totalPaise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="ml-auto max-w-sm space-y-2 border-t border-black/5 p-4 text-xs sm:p-5">
          <div className="flex justify-between gap-3"><dt className="text-neutral-500">Subtotal</dt><dd className="font-semibold">{formatPaise(quotation.totals.subtotalPaise)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-neutral-500">Discount</dt><dd className="font-semibold">− {formatPaise(quotation.totals.discountPaise)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-neutral-500">Tax</dt><dd className="font-semibold">{formatPaise(quotation.totals.taxPaise)}</dd></div>
          <div className="flex justify-between gap-3 border-t border-black/8 pt-3 text-sm"><dt className="font-bold">Grand total</dt><dd className="font-extrabold">{formatPaise(quotation.totals.grandTotalPaise)}</dd></div>
        </dl>
      </section>

      {quotation.internalNotes && isAdmin && <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4"><h3 className="text-xs font-bold uppercase text-amber-800">Internal notes</h3><p className="mt-2 whitespace-pre-wrap text-sm text-amber-950">{quotation.internalNotes}</p></section>}

      <section className="rounded-2xl border border-black/6 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-neutral-900">PDF preview</h3>
            <p className="mt-1 text-xs text-neutral-500">Generated on demand from an approved immutable version. No PDF is stored in temporary or public storage.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {quotation.versions.length > 0 && (
              <select aria-label="PDF version" value={pdfVersion} onChange={(event) => setPdfVersion(Number(event.target.value))} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs">
                {[quotation.version, ...quotation.versions.map((version) => version.version)].sort((a, b) => b - a).map((version) => <option key={version} value={version}>Version {version}</option>)}
              </select>
            )}
            <button type="button" disabled={pdfLoading || !canOpenSelectedPdf} onClick={() => void loadPdf(pdfVersion)} className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-3.5 py-2.5 text-xs font-bold text-neutral-700 disabled:opacity-50">
              {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Preview
            </button>
            <button type="button" disabled={pdfLoading || !canOpenSelectedPdf} onClick={() => void loadPdf(pdfVersion, true)} className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-3.5 py-2.5 text-xs font-bold text-white disabled:opacity-50"><ArrowDownToLine className="h-4 w-4" /> Download</button>
          </div>
        </div>
        {!canOpenSelectedPdf && <p className="mt-3 text-xs text-amber-700">Official PDFs are available only for versions that were approved.</p>}
        {pdfUrl && <iframe title={`${quotation.quotationNumber} PDF preview`} src={pdfUrl} className="mt-4 h-[70vh] w-full rounded-xl border border-black/10" />}
      </section>

      {quotation.versions.length > 0 && (
        <section className="rounded-2xl border border-black/6 bg-white p-4 shadow-sm sm:p-5">
          <h3 className="text-sm font-extrabold text-neutral-900">Immutable version history</h3>
          <ol className="mt-3 divide-y divide-black/5">
            {[...quotation.versions].sort((a, b) => b.version - a.version).map((version) => (
              <li key={version.version} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-bold text-neutral-800">Version {version.version} · {version.status.replaceAll("_", " ")}</p>
                  <p className="mt-1 text-xs text-neutral-500">Captured {formatDate(version.capturedAt)} · {formatPaise(version.totals.grandTotalPaise)}</p>
                </div>
                <button type="button" onClick={() => { setPdfVersion(version.version); void loadPdf(version.version); }} disabled={pdfLoading} className="rounded-lg border border-black/10 px-3 py-2 text-xs font-bold text-neutral-600 disabled:opacity-50">Preview version</button>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="rounded-2xl border border-black/6 bg-white p-4 shadow-sm sm:p-5">
        <h3 className="text-sm font-extrabold text-neutral-900">Approval and audit history</h3>
        {!quotation.history.length ? <p className="mt-3 text-sm text-neutral-500">No history available.</p> : (
          <ol className="mt-3 divide-y divide-black/5">
            {[...quotation.history].reverse().map((entry) => (
              <li key={entry.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-neutral-800">{entry.action.replaceAll("_", " ")} · v{entry.version}</p>
                  <p className="text-xs text-neutral-400">{formatDateTime(entry.at)}</p>
                </div>
                <p className="mt-1 text-xs text-neutral-500">{entry.actorName}{entry.note ? ` · ${entry.note}` : ""}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
