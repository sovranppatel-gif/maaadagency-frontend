"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Loader2, MapPin, Plus, Video } from "lucide-react";
import { getLeadVisits, visitOutcomeLabel, visitTypeLabel } from "@/lib/api/visits";
import { formatDateTime } from "@/lib/format";
import type { Employee, LeadVisit } from "@/lib/types";
import { VisitStatusBadge } from "./VisitStatusBadge";
import {
  CancelVisitModal,
  CompleteVisitModal,
  RescheduleVisitModal,
  ScheduleVisitModal,
  VisitDetailModal,
} from "./VisitModals";

export function LeadVisitsPanel({
  leadId,
  defaultContactPerson,
  audience,
  employees = [],
}: {
  leadId: string;
  defaultContactPerson?: string;
  audience: "admin" | "employee";
  employees?: Employee[];
}) {
  const [visits, setVisits] = useState<LeadVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<LeadVisit | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<LeadVisit | null>(null);
  const [completeTarget, setCompleteTarget] = useState<LeadVisit | null>(null);
  const [cancelTarget, setCancelTarget] = useState<LeadVisit | null>(null);

  useEffect(() => {
    let active = true;
    getLeadVisits(leadId)
      .then(({ visits: rows }) => {
        if (!active) return;
        setVisits(rows);
        setError("");
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load customer visits.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [leadId, refreshKey]);

  function onVisitUpdated(message: string) {
    setNotice(message);
    setRefreshKey((k) => k + 1);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-black/6 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-neutral-900">Customer Visits</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Independent customer meetings & site visits. Completing or cancelling a visit does not alter Lead Quality or Status.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setScheduleOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-red px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Schedule Visit
        </button>
      </div>

      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{notice}</p>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading visits…
        </div>
      ) : visits.length === 0 ? (
        <p className="rounded-xl bg-neutral-50 px-4 py-5 text-sm text-neutral-500">No customer visits scheduled for this lead.</p>
      ) : (
        <ul className="space-y-3">
          {visits.map((visit) => {
            const isActive = visit.status === "SCHEDULED" || visit.status === "RESCHEDULED";
            return (
              <li key={visit.id} className="rounded-xl border border-black/6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <button
                      type="button"
                      onClick={() => setDetailTarget(visit)}
                      className="text-left text-sm font-bold text-neutral-900 hover:text-brand-red"
                    >
                      {visit.code ? `${visit.code} · ` : ""}{visit.title}
                    </button>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {visitTypeLabel(visit.visitType)}
                      {visit.assignedEmployee ? ` · ${visit.assignedEmployee.name}` : ""}
                    </p>
                  </div>
                  <VisitStatusBadge status={visit.status} />
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-neutral-600">
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <CalendarClock className="h-3.5 w-3.5 text-neutral-400" />
                    {formatDateTime(visit.scheduledStart)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    {visit.meetingLink ? <Video className="h-3.5 w-3.5 text-blue-600" /> : <MapPin className="h-3.5 w-3.5 text-neutral-400" />}
                    {visit.meetingLink || visit.locationAddress || "—"}
                  </span>
                  {visit.outcome && <span className="font-semibold text-emerald-700">Outcome: {visitOutcomeLabel(visit.outcome)}</span>}
                </div>

                {visit.cancellationReason && (
                  <p className="mt-2 text-xs text-red-700">Cancelled: {visit.cancellationReason}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setDetailTarget(visit)} className="rounded-lg border border-black/10 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
                    View / History
                  </button>
                  {isActive && (
                    <>
                      <button type="button" onClick={() => setRescheduleTarget(visit)} className="rounded-lg border border-black/10 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
                        Reschedule
                      </button>
                      <button type="button" onClick={() => setCompleteTarget(visit)} className="rounded-lg bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-800">
                        Mark Done
                      </button>
                      <button type="button" onClick={() => setCancelTarget(visit)} className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-brand-red hover:bg-red-50">
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {scheduleOpen && (
        <ScheduleVisitModal
          open
          onClose={() => setScheduleOpen(false)}
          onSaved={(v) => onVisitUpdated(`Visit ${v.code ?? ""} scheduled.`)}
          fixedLeadId={leadId}
          defaultContactPerson={defaultContactPerson}
          employees={employees}
          allowEmployeeSelect={audience === "admin"}
        />
      )}

      <VisitDetailModal
        visit={detailTarget}
        onClose={() => setDetailTarget(null)}
        onReschedule={(v) => { setDetailTarget(null); setRescheduleTarget(v); }}
        onComplete={(v) => { setDetailTarget(null); setCompleteTarget(v); }}
        onCancel={(v) => { setDetailTarget(null); setCancelTarget(v); }}
      />

      {rescheduleTarget && (
        <RescheduleVisitModal
          visit={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onSaved={(v) => onVisitUpdated(`Visit ${v.code ?? ""} rescheduled.`)}
        />
      )}

      {completeTarget && (
        <CompleteVisitModal
          visit={completeTarget}
          onClose={() => setCompleteTarget(null)}
          onSaved={(v) => onVisitUpdated(`Visit ${v.code ?? ""} marked done.`)}
        />
      )}

      {cancelTarget && (
        <CancelVisitModal
          visit={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onSaved={(v) => onVisitUpdated(`Visit ${v.code ?? ""} cancelled.`)}
        />
      )}
    </section>
  );
}
