"use client";

import { useRef, useState } from "react";
import { CalendarClock, ExternalLink, Loader2, MapPin, Video } from "lucide-react";
import { Modal } from "@/components/master-admin/ui/Modal";
import { VisitStatusBadge } from "./VisitStatusBadge";
import {
  cancelVisit,
  completeVisit,
  istDateTimeInputToIso,
  rescheduleVisit,
  scheduleLeadVisit,
  toIstDateTimeLocalValue,
  VISIT_LOCATION_OPTIONS,
  VISIT_OUTCOME_OPTIONS,
  VISIT_TYPE_OPTIONS,
  visitLocationLabel,
  visitOutcomeLabel,
  visitTypeLabel,
} from "@/lib/api/visits";
import { formatDateTime } from "@/lib/format";
import type { Employee, Lead, LeadVisit, VisitLocationType, VisitOutcome, VisitType } from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500";

export function ScheduleVisitModal({
  open,
  onClose,
  onSaved,
  fixedLeadId,
  defaultContactPerson,
  leads = [],
  employees = [],
  allowEmployeeSelect = false,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (visit: LeadVisit) => void;
  fixedLeadId?: string;
  defaultContactPerson?: string;
  leads?: Lead[];
  employees?: Employee[];
  allowEmployeeSelect?: boolean;
}) {
  const [leadId, setLeadId] = useState(fixedLeadId ?? "");
  const [visitType, setVisitType] = useState<VisitType>("SITE_VISIT");
  const [title, setTitle] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [locationType, setLocationType] = useState<VisitLocationType>("CUSTOMER_LOCATION");
  const [locationAddress, setLocationAddress] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [customerContactPerson, setCustomerContactPerson] = useState(defaultContactPerson ?? "");
  const [assignedEmployeeId, setAssignedEmployeeId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const idempotencyKey = useRef<string | null>(null);

  const isVirtual = visitType === "VIRTUAL_MEETING" || locationType === "VIRTUAL";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const targetLeadId = fixedLeadId || leadId;
    if (!targetLeadId) {
      setError("Please select a lead.");
      return;
    }
    if (!scheduledStart) {
      setError("Please choose the scheduled start date and time.");
      return;
    }
    const startIso = istDateTimeInputToIso(scheduledStart);
    const endIso = scheduledEnd ? istDateTimeInputToIso(scheduledEnd) : undefined;
    if (endIso && new Date(endIso) <= new Date(startIso)) {
      setError("End time must be after start time.");
      return;
    }

    const key = idempotencyKey.current ?? crypto.randomUUID();
    idempotencyKey.current = key;
    setSubmitting(true);
    try {
      const saved = await scheduleLeadVisit(
        targetLeadId,
        {
          visitType,
          title: title.trim(),
          scheduledStart: startIso,
          scheduledEnd: endIso,
          timezone: "Asia/Kolkata",
          locationType: visitType === "VIRTUAL_MEETING" ? "VIRTUAL" : locationType,
          locationAddress: isVirtual ? "" : locationAddress.trim(),
          meetingLink: isVirtual ? meetingLink.trim() : "",
          customerContactPerson: customerContactPerson.trim() || undefined,
          notes: notes.trim() || undefined,
          ...(allowEmployeeSelect && assignedEmployeeId ? { assignedEmployeeId } : {}),
        },
        key
      );
      idempotencyKey.current = null;
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not schedule visit.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={submitting ? () => {} : onClose} title="Schedule Customer Visit" description="All times are interpreted in Asia/Kolkata (IST)." size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

        {!fixedLeadId && (
          <div>
            <label className={labelClass} htmlFor="visit-lead">Lead *</label>
            <select id="visit-lead" required value={leadId} onChange={(e) => setLeadId(e.target.value)} className={inputClass}>
              <option value="">Select a lead…</option>
              {leads.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code ? `${item.code} · ` : ""}{item.clientName} ({item.requirement})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="visit-type">Visit Type *</label>
            <select
              id="visit-type"
              value={visitType}
              onChange={(e) => {
                const next = e.target.value as VisitType;
                setVisitType(next);
                if (next === "VIRTUAL_MEETING") setLocationType("VIRTUAL");
                else if (locationType === "VIRTUAL") setLocationType("CUSTOMER_LOCATION");
              }}
              className={inputClass}
            >
              {VISIT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="visit-title">Visit Title *</label>
            <input id="visit-title" required minLength={2} maxLength={160} placeholder="e.g. Site measurement & branding survey" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="visit-start">Scheduled Start (IST) *</label>
            <input id="visit-start" type="datetime-local" required value={scheduledStart} onChange={(e) => setScheduledStart(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="visit-end">Scheduled End (optional)</label>
            <input id="visit-end" type="datetime-local" value={scheduledEnd} onChange={(e) => setScheduledEnd(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="visit-loc-type">Location Type *</label>
            <select id="visit-loc-type" value={visitType === "VIRTUAL_MEETING" ? "VIRTUAL" : locationType} onChange={(e) => setLocationType(e.target.value as VisitLocationType)} className={inputClass}>
              {VISIT_LOCATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="visit-contact">Customer Contact Person</label>
            <input id="visit-contact" maxLength={120} value={customerContactPerson} onChange={(e) => setCustomerContactPerson(e.target.value)} className={inputClass} />
          </div>
        </div>

        {isVirtual ? (
          <div>
            <label className={labelClass} htmlFor="visit-link">Meeting Link *</label>
            <input id="visit-link" type="url" required placeholder="https://meet.google.com/..." value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} className={inputClass} />
          </div>
        ) : (
          <div>
            <label className={labelClass} htmlFor="visit-address">Location Address *</label>
            <input id="visit-address" required minLength={3} maxLength={500} placeholder="Full site, office, or client address" value={locationAddress} onChange={(e) => setLocationAddress(e.target.value)} className={inputClass} />
          </div>
        )}

        {allowEmployeeSelect && (
          <div>
            <label className={labelClass} htmlFor="visit-employee">Assigned Employee (defaults to lead assignee)</label>
            <select id="visit-employee" value={assignedEmployeeId} onChange={(e) => setAssignedEmployeeId(e.target.value)} className={inputClass}>
              <option value="">Use lead assignee</option>
              {employees.filter((emp) => emp.isActive !== false).map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={labelClass} htmlFor="visit-notes">Notes</label>
          <textarea id="visit-notes" rows={3} maxLength={3000} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
        </div>

        <div className="flex justify-end gap-3 border-t border-black/6 pt-4">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50">Cancel</button>
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-brand-red px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Schedule Visit
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function RescheduleVisitModal({
  visit,
  onClose,
  onSaved,
}: {
  visit: LeadVisit | null;
  onClose: () => void;
  onSaved: (visit: LeadVisit) => void;
}) {
  const [scheduledStart, setScheduledStart] = useState(() => toIstDateTimeLocalValue(visit?.scheduledStart));
  const [scheduledEnd, setScheduledEnd] = useState(() => toIstDateTimeLocalValue(visit?.scheduledEnd));
  const [locationAddress, setLocationAddress] = useState(visit?.locationAddress ?? "");
  const [meetingLink, setMeetingLink] = useState(visit?.meetingLink ?? "");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!visit) return null;
  const isVirtual = visit.visitType === "VIRTUAL_MEETING" || visit.locationType === "VIRTUAL";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!visit) return;
    setError("");
    setSubmitting(true);
    try {
      const updated = await rescheduleVisit(visit.id, {
        scheduledStart: istDateTimeInputToIso(scheduledStart),
        scheduledEnd: scheduledEnd ? istDateTimeInputToIso(scheduledEnd) : undefined,
        ...(isVirtual ? { meetingLink: meetingLink.trim() } : { locationAddress: locationAddress.trim() }),
        reason: reason.trim(),
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reschedule visit.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={submitting ? () => {} : onClose} title={`Reschedule ${visit.code ?? "Visit"}`} description="Previous schedule is preserved in visit history.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div>
          <label className={labelClass} htmlFor="resched-start">New Start Date & Time (IST) *</label>
          <input id="resched-start" type="datetime-local" required value={scheduledStart} onChange={(e) => setScheduledStart(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="resched-end">New End Date & Time (optional)</label>
          <input id="resched-end" type="datetime-local" value={scheduledEnd} onChange={(e) => setScheduledEnd(e.target.value)} className={inputClass} />
        </div>
        {isVirtual ? (
          <div>
            <label className={labelClass} htmlFor="resched-link">Meeting Link</label>
            <input id="resched-link" type="url" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} className={inputClass} />
          </div>
        ) : (
          <div>
            <label className={labelClass} htmlFor="resched-addr">Location Address</label>
            <input id="resched-addr" maxLength={500} value={locationAddress} onChange={(e) => setLocationAddress(e.target.value)} className={inputClass} />
          </div>
        )}
        <div>
          <label className={labelClass} htmlFor="resched-reason">Reschedule Reason *</label>
          <textarea id="resched-reason" required minLength={2} maxLength={1000} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} />
        </div>
        <div className="flex justify-end gap-3 border-t border-black/6 pt-4">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-bold text-neutral-700">Back</button>
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Reschedule
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function CompleteVisitModal({
  visit,
  onClose,
  onSaved,
}: {
  visit: LeadVisit | null;
  onClose: () => void;
  onSaved: (visit: LeadVisit) => void;
}) {
  const [outcome, setOutcome] = useState<VisitOutcome>("INTERESTED");
  const [customerResponse, setCustomerResponse] = useState("");
  const [notes, setNotes] = useState(visit?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!visit) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!visit) return;
    setError("");
    if (!customerResponse.trim() && !notes.trim()) {
      setError("Please add customer response or visit remarks.");
      return;
    }
    setSubmitting(true);
    try {
      const updated = await completeVisit(visit.id, {
        outcome,
        customerResponse: customerResponse.trim(),
        notes: notes.trim(),
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete visit.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={submitting ? () => {} : onClose} title={`Mark ${visit.code ?? "Visit"} Done`} description="Does not alter Lead Quality or Workflow Status automatically.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div>
          <label className={labelClass} htmlFor="complete-outcome">Outcome *</label>
          <select id="complete-outcome" value={outcome} onChange={(e) => setOutcome(e.target.value as VisitOutcome)} className={inputClass}>
            {VISIT_OUTCOME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="complete-response">Customer Response</label>
          <textarea id="complete-response" rows={3} maxLength={3000} value={customerResponse} onChange={(e) => setCustomerResponse(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="complete-notes">Visit Remarks *</label>
          <textarea id="complete-notes" rows={3} maxLength={3000} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
        </div>
        <div className="flex justify-end gap-3 border-t border-black/6 pt-4">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-bold text-neutral-700">Cancel</button>
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Mark Visit Done
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function CancelVisitModal({
  visit,
  onClose,
  onSaved,
}: {
  visit: LeadVisit | null;
  onClose: () => void;
  onSaved: (visit: LeadVisit) => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!visit) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!visit) return;
    setError("");
    setSubmitting(true);
    try {
      const updated = await cancelVisit(visit.id, reason.trim());
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel visit.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={submitting ? () => {} : onClose} title={`Cancel ${visit.code ?? "Visit"}`} description="Visit history is preserved; cancelled visits cannot be reopened.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div>
          <label className={labelClass} htmlFor="cancel-reason">Cancellation Reason *</label>
          <textarea id="cancel-reason" required minLength={2} maxLength={1000} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} />
        </div>
        <div className="flex justify-end gap-3 border-t border-black/6 pt-4">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-bold text-neutral-700">Back</button>
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-brand-red px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm Cancellation
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function VisitDetailModal({
  visit,
  onClose,
  onReschedule,
  onComplete,
  onCancel,
}: {
  visit: LeadVisit | null;
  onClose: () => void;
  onReschedule?: (visit: LeadVisit) => void;
  onComplete?: (visit: LeadVisit) => void;
  onCancel?: (visit: LeadVisit) => void;
}) {
  if (!visit) return null;
  const isActive = visit.status === "SCHEDULED" || visit.status === "RESCHEDULED";

  return (
    <Modal open onClose={onClose} title={`${visit.code ?? "Visit"} · ${visit.title}`} description={visit.lead ? `${visit.lead.clientName} (${visit.lead.code ?? ""})` : undefined} size="lg">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <VisitStatusBadge status={visit.status} />
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">{visitTypeLabel(visit.visitType)}</span>
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">{visitLocationLabel(visit.locationType)}</span>
          </div>
          {isActive && (
            <div className="flex flex-wrap gap-2">
              {onReschedule && <button type="button" onClick={() => onReschedule(visit)} className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50">Reschedule</button>}
              {onComplete && <button type="button" onClick={() => onComplete(visit)} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800">Mark Done</button>}
              {onCancel && <button type="button" onClick={() => onCancel(visit)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-brand-red hover:bg-red-50">Cancel</button>}
            </div>
          )}
        </div>

        <dl className="grid grid-cols-1 gap-3 rounded-xl bg-neutral-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-neutral-400">Scheduled (IST)</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-neutral-800">
              <CalendarClock className="h-4 w-4 text-neutral-400" />
              {formatDateTime(visit.scheduledStart)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-400">Assigned Employee</dt>
            <dd className="mt-0.5 font-semibold text-neutral-800">{visit.assignedEmployee?.name ?? "Unassigned"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-neutral-400">Location / Meeting</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-neutral-800">
              {visit.meetingLink ? (
                <>
                  <Video className="h-4 w-4 text-blue-600" />
                  <a href={visit.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 underline">
                    {visit.meetingLink} <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 text-neutral-400" />
                  {visit.locationAddress || "—"}
                </>
              )}
            </dd>
          </div>
          {visit.customerContactPerson && (
            <div>
              <dt className="text-xs text-neutral-400">Contact Person</dt>
              <dd className="mt-0.5 font-semibold text-neutral-800">{visit.customerContactPerson}</dd>
            </div>
          )}
          {visit.outcome && (
            <div>
              <dt className="text-xs text-neutral-400">Outcome</dt>
              <dd className="mt-0.5 font-semibold text-emerald-700">{visitOutcomeLabel(visit.outcome)}</dd>
            </div>
          )}
          {visit.customerResponse && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-neutral-400">Customer Response</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-neutral-700">{visit.customerResponse}</dd>
            </div>
          )}
          {visit.notes && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-neutral-400">Notes</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-neutral-700">{visit.notes}</dd>
            </div>
          )}
          {visit.cancellationReason && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-neutral-400">Cancellation Reason</dt>
              <dd className="mt-0.5 text-red-700">{visit.cancellationReason}</dd>
            </div>
          )}
        </dl>

        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Event History</h3>
          <ol className="space-y-2">
            {[...(visit.history ?? [])].reverse().map((item) => (
              <li key={item.id} className="rounded-xl border border-black/6 p-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-neutral-800">
                    {item.eventType}
                    {item.previousStatus && item.newStatus ? ` (${item.previousStatus} → ${item.newStatus})` : ""}
                  </span>
                  <span className="text-neutral-400">{formatDateTime(item.timestamp)} · {item.actorName}</span>
                </div>
                {item.previousSchedule?.start && item.newSchedule?.start && (
                  <p className="mt-1 text-neutral-600">
                    {formatDateTime(item.previousSchedule.start)} → {formatDateTime(item.newSchedule.start)}
                  </p>
                )}
                {item.note && <p className="mt-1 text-neutral-600">{item.note}</p>}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Modal>
  );
}
