"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CalendarClock, CheckCircle2, Loader2, MessageSquarePlus } from "lucide-react";
import { HistoricalFollowUpsList } from "@/components/leads/HistoricalFollowUpsList";
import {
  CALL_RESPONSE_OPTIONS,
  callResponseLabel,
  createLeadFollowUp,
  getLeadFollowUps,
  type CallResponse,
  type FollowUpCommunicationType,
  type FollowUpInterestLevel,
  type FollowUpInput,
  type FollowUpPageMeta,
  type LeadFollowUp,
} from "@/lib/api/followUps";
import { formatDateTime } from "@/lib/format";

const communicationTypes: FollowUpCommunicationType[] = ["Call", "WhatsApp", "Meeting", "Email"];
const interestLevels: FollowUpInterestLevel[] = ["Interested", "Not Interested", "Neutral", "Unsure"];

function localDateTimeValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export function EmployeeLeadFollowUpPanel({ leadId }: { leadId: string }) {
  const [followUps, setFollowUps] = useState<LeadFollowUp[]>([]);
  const [meta, setMeta] = useState<FollowUpPageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const idempotencyKey = useRef<string | null>(null);
  const [communicationType, setCommunicationType] = useState<FollowUpCommunicationType>("Call");
  const [callResponse, setCallResponse] = useState<CallResponse>("NOT_PICKED");
  const [contactedAt, setContactedAt] = useState("");
  const [customerResponse, setCustomerResponse] = useState("");
  const [discussionNotes, setDiscussionNotes] = useState("");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [interestLevel, setInterestLevel] = useState<FollowUpInterestLevel>("Unsure");
  const [quotationRequired, setQuotationRequired] = useState(false);
  const [employeeRemarks, setEmployeeRemarks] = useState("");

  useEffect(() => {
    let active = true;
    getLeadFollowUps(leadId)
      .then(({ followUps: result, meta: pageMeta }) => {
        if (!active) return;
        setFollowUps(result);
        setMeta(pageMeta);
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
  }, [leadId, refreshKey]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const contactDate = new Date(contactedAt);
    if (!contactedAt || Number.isNaN(contactDate.getTime()) || contactDate.getTime() > Date.now()) {
      setError("Enter a valid contact date and time that is not in the future.");
      return;
    }
    const nextDate = nextFollowUpAt ? new Date(nextFollowUpAt) : null;
    if (nextDate && (Number.isNaN(nextDate.getTime()) || nextDate <= contactDate)) {
      setError("The next follow-up must be scheduled after the contact date and time.");
      return;
    }
    const key = idempotencyKey.current ?? crypto.randomUUID();
    idempotencyKey.current = key;
    setSubmitting(true);

    const input: FollowUpInput = {
      communicationType,
      callResponse,
      contactedAt: contactDate.toISOString(),
      customerResponse,
      discussionNotes,
      nextFollowUpAt: nextDate?.toISOString(),
      interestLevel,
      quotationRequired,
      employeeRemarks,
    };

    try {
      const saved = await createLeadFollowUp(leadId, input, key);
      idempotencyKey.current = null;
      setNotice(`Saved as follow-up attempt ${saved.attemptNumber}.`);
      setCallResponse("NOT_PICKED");
      setCustomerResponse("");
      setDiscussionNotes("");
      setNextFollowUpAt("");
      setQuotationRequired(false);
      setEmployeeRemarks("");
      setContactedAt("");
      setRefreshKey((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this follow-up. Retry safely; duplicate submissions are protected.");
    } finally {
      setSubmitting(false);
    }
  }

  const isClosed = Boolean(meta?.closed);
  const needsReview = Boolean(meta?.reviewRequired);
  const attempts = meta?.attempts ?? followUps.length;
  const maxAttempts = meta?.maxAttempts ?? 4;

  return (
    <section className="space-y-5 rounded-2xl border border-black/6 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="text-base font-extrabold text-neutral-900">Lead follow-ups</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {attempts} of {maxAttempts} authorized attempt{maxAttempts === 1 ? "" : "s"} recorded. Contact dates are employee-reported.
        </p>
      </div>

      {needsReview && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">The attempt limit has been reached. Further follow-ups require Admin review.</p>}
      {isClosed && <p className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">The follow-up sequence has been closed by Admin.</p>}

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading history…</div>
      ) : followUps.length === 0 ? (
        <p className="rounded-xl bg-neutral-50 px-4 py-5 text-sm text-neutral-500">No follow-ups have been recorded for this lead.</p>
      ) : (
        <ol className="space-y-3">
          {followUps.map((followUp) => (
            <li key={followUp.id} className="rounded-xl border border-black/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-neutral-900">Attempt {followUp.attemptNumber} · {followUp.communicationType}</p>
                  {followUp.callResponse && (
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                      {callResponseLabel(followUp.callResponse)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400">{formatDateTime(followUp.contactedAt)}</p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">{followUp.discussionNotes}</p>
              {followUp.customerResponse && <p className="mt-2 text-sm text-neutral-600"><span className="font-semibold">Customer response:</span> {followUp.customerResponse}</p>}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-500">
                <span>Interest: {followUp.interestLevel}</span>
                {followUp.nextFollowUpAt && <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> Next: {localDateTimeValue(followUp.nextFollowUpAt)}</span>}
                {followUp.quotationRequired && <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Quotation requested</span>}
              </div>
              {followUp.employeeRemarks && <p className="mt-2 text-xs text-neutral-500">Employee remarks: {followUp.employeeRemarks}</p>}
            </li>
          ))}
        </ol>
      )}

      {!loading && <HistoricalFollowUpsList items={meta?.historicalFollowUps} />}

      {!loading && !isClosed && !needsReview && (
        <form onSubmit={submit} className="space-y-4 border-t border-black/5 pt-5">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4 text-red-700" />
            <h3 className="text-sm font-bold text-neutral-900">Record a follow-up</h3>
          </div>
          <p className="text-xs text-neutral-500">This records what you report; it does not initiate a call, message, or meeting automatically.</p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-neutral-600">
              Communication type
              <select value={communicationType} onChange={(event) => setCommunicationType(event.target.value as FollowUpCommunicationType)} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-normal text-neutral-800">
                {communicationTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-neutral-600">
              Call response
              <select required value={callResponse} onChange={(event) => setCallResponse(event.target.value as CallResponse)} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-normal text-neutral-800">
                {CALL_RESPONSE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-neutral-600 sm:col-span-2">
              Contact date and time
              <input required type="datetime-local" value={contactedAt} onChange={(event) => setContactedAt(event.target.value)} className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm font-normal text-neutral-800" />
            </label>
            <label className="text-xs font-semibold text-neutral-600 sm:col-span-2">
              Discussion notes
              <textarea required minLength={1} maxLength={5000} rows={3} value={discussionNotes} onChange={(event) => setDiscussionNotes(event.target.value)} className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm font-normal text-neutral-800" />
            </label>
            <label className="text-xs font-semibold text-neutral-600 sm:col-span-2">
              Customer response
              <textarea maxLength={3000} rows={2} value={customerResponse} onChange={(event) => setCustomerResponse(event.target.value)} className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm font-normal text-neutral-800" />
            </label>
            <label className="text-xs font-semibold text-neutral-600">
              Interest level
              <select value={interestLevel} onChange={(event) => setInterestLevel(event.target.value as FollowUpInterestLevel)} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-normal text-neutral-800">
                {interestLevels.map((level) => <option key={level}>{level}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-neutral-600">
              Next follow-up date and time
              <input type="datetime-local" value={nextFollowUpAt} onChange={(event) => setNextFollowUpAt(event.target.value)} className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm font-normal text-neutral-800" />
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-700 sm:col-span-2">
              <input type="checkbox" checked={quotationRequired} onChange={(event) => setQuotationRequired(event.target.checked)} className="h-4 w-4 accent-red-700" />
              Customer requested a quotation
            </label>
            <label className="text-xs font-semibold text-neutral-600 sm:col-span-2">
              Employee remarks
              <textarea maxLength={2000} rows={2} value={employeeRemarks} onChange={(event) => setEmployeeRemarks(event.target.value)} className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm font-normal text-neutral-800" />
            </label>
          </div>

          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
          <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-60">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save follow-up
          </button>
        </form>
      )}
      {!loading && (isClosed || needsReview) && error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </section>
  );
}
