"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, CalendarClock, CheckCircle2, Clock3, LayoutList, Loader2, MapPin, Plus, Search, Video } from "lucide-react";
import { EmployeePagination } from "@/components/employee/EmployeePagination";
import { VisitStatusBadge } from "@/components/visits/VisitStatusBadge";
import { VisitCalendar } from "@/components/visits/VisitCalendar";
import {
  CancelVisitModal,
  CompleteVisitModal,
  RescheduleVisitModal,
  ScheduleVisitModal,
  VisitDetailModal,
} from "@/components/visits/VisitModals";
import {
  getVisitsPage,
  getVisitStats,
  visitOutcomeLabel,
  visitTypeLabel,
  type VisitBucket,
  type VisitStats,
} from "@/lib/api/visits";
import { getLeads } from "@/lib/api/leads";
import { formatDateTime } from "@/lib/format";
import type { Lead, LeadVisit } from "@/lib/types";

const pageSize = 15;

const buckets: Array<{ value: VisitBucket; label: string }> = [
  { value: "All", label: "All" },
  { value: "today", label: "Today's" },
  { value: "upcoming", label: "Upcoming" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
];

export default function EmployeeVisitsPage() {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [visits, setVisits] = useState<LeadVisit[]>([]);
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [bucket, setBucket] = useState<VisitBucket>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [version, setVersion] = useState(0);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<LeadVisit | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<LeadVisit | null>(null);
  const [completeTarget, setCompleteTarget] = useState<LeadVisit | null>(null);
  const [cancelTarget, setCancelTarget] = useState<LeadVisit | null>(null);

  const filters = useMemo(() => ({ bucket, search: search.trim() }), [bucket, search]);

  useEffect(() => {
    let active = true;
    Promise.all([
      getVisitsPage({ ...filters, page: view === "calendar" ? 1 : page, limit: view === "calendar" ? 100 : pageSize }),
      getVisitStats(),
    ])
      .then(([pageRes, statsRes]) => {
        if (!active) return;
        setVisits(pageRes.visits);
        setTotalPages(pageRes.meta.totalPages);
        setStats(statsRes);
        setError("");
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load your visits.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters, page, view, version]);

  useEffect(() => {
    if (scheduleOpen && leads.length === 0) {
      getLeads().then(setLeads).catch(() => null);
    }
  }, [scheduleOpen, leads.length]);

  function reload(message: string) {
    setNotice(message);
    setVersion((v) => v + 1);
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-900">My Visits</h1>
          <p className="mt-1 text-sm text-neutral-500">Customer meetings and site visits for your assigned leads (IST).</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-black/10 bg-white p-1">
            <button type="button" onClick={() => setView("list")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${view === "list" ? "bg-neutral-950 text-white" : "text-neutral-600"}`}>
              <LayoutList className="h-3.5 w-3.5" /> List
            </button>
            <button type="button" onClick={() => setView("calendar")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${view === "calendar" ? "bg-neutral-950 text-white" : "text-neutral-600"}`}>
              <Calendar className="h-3.5 w-3.5" /> Calendar
            </button>
          </div>
          <button type="button" onClick={() => setScheduleOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-red-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-600">
            <Plus className="h-4 w-4" /> Schedule Visit
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Today's Visits", value: stats?.today ?? 0, icon: Calendar },
          { label: "Upcoming", value: stats?.upcoming ?? 0, icon: CalendarClock },
          { label: "Overdue", value: stats?.overdue ?? 0, icon: Clock3 },
          { label: "Completed", value: stats?.completed ?? 0, icon: CheckCircle2 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-black/6 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-neutral-500">{label}</p>
              <Icon className="h-4 w-4 text-red-700" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-neutral-900">{value}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-black/6 bg-white p-3.5 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-neutral-100 px-3 py-2 sm:min-w-52">
          <Search className="h-4 w-4 shrink-0 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            placeholder="Search customer, visit ref, location..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {buckets.map((b) => (
            <button
              key={b.value}
              type="button"
              onClick={() => { setBucket(b.value); setPage(1); setLoading(true); }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold ${bucket === b.value ? "bg-neutral-950 text-white" : "border border-black/10 bg-white text-neutral-600 hover:bg-neutral-50"}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </section>

      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{notice}</p>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading visits…
        </div>
      ) : view === "calendar" ? (
        <div className="rounded-2xl border border-black/6 bg-white p-4 shadow-sm">
          <VisitCalendar visits={visits} onSelectVisit={setDetailTarget} />
        </div>
      ) : visits.length === 0 ? (
        <p className="rounded-2xl border border-black/6 bg-white px-4 py-12 text-center text-sm text-neutral-500">No visits found in this view.</p>
      ) : (
        <section className="space-y-3">
          {visits.map((visit) => {
            const active = visit.status === "SCHEDULED" || visit.status === "RESCHEDULED";
            return (
              <article key={visit.id} className="rounded-2xl border border-black/6 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-neutral-900">
                      {visit.code ? `${visit.code} · ` : ""}{visit.title}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {visitTypeLabel(visit.visitType)}
                      {visit.lead && (
                        <>
                          {" · "}
                          <Link href={`/employee/leads/${visit.lead.code ?? visit.lead.id}`} className="font-semibold text-red-700 hover:underline">
                            {visit.lead.clientName} ({visit.lead.code ?? ""})
                          </Link>
                        </>
                      )}
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

                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setDetailTarget(visit)} className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50">
                    Open Visit
                  </button>
                  {visit.lead && (
                    <Link href={`/employee/leads/${visit.lead.code ?? visit.lead.id}`} className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50">
                      Open Lead
                    </Link>
                  )}
                  {active && (
                    <>
                      <button type="button" onClick={() => setRescheduleTarget(visit)} className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50">
                        Reschedule
                      </button>
                      <button type="button" onClick={() => setCompleteTarget(visit)} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800">
                        Mark Done
                      </button>
                      <button type="button" onClick={() => setCancelTarget(visit)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-brand-red hover:bg-red-50">
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {!loading && view === "list" && totalPages > 1 && (
        <div className="overflow-hidden rounded-2xl border border-black/6 bg-white">
          <EmployeePagination page={page} totalPages={totalPages} onChange={(nextPage) => { setLoading(true); setPage(nextPage); }} />
        </div>
      )}

      {scheduleOpen && (
        <ScheduleVisitModal
          open
          onClose={() => setScheduleOpen(false)}
          onSaved={(v) => reload(`Visit ${v.code ?? ""} scheduled.`)}
          leads={leads}
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
          onSaved={(v) => reload(`Visit ${v.code ?? ""} rescheduled.`)}
        />
      )}

      {completeTarget && (
        <CompleteVisitModal
          visit={completeTarget}
          onClose={() => setCompleteTarget(null)}
          onSaved={(v) => reload(`Visit ${v.code ?? ""} marked done.`)}
        />
      )}

      {cancelTarget && (
        <CancelVisitModal
          visit={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onSaved={(v) => reload(`Visit ${v.code ?? ""} cancelled.`)}
        />
      )}
    </div>
  );
}
