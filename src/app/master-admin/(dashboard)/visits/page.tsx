"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock3,
  LayoutList,
  MapPin,
  Plus,
  Search,
  Video,
  XCircle,
} from "lucide-react";
import { StatCard } from "@/components/master-admin/StatCard";
import { Card, CardHeader } from "@/components/master-admin/ui/Card";
import { Pagination } from "@/components/master-admin/ui/Pagination";
import { EmptyState } from "@/components/master-admin/ui/EmptyState";
import { useToast } from "@/components/master-admin/ui/ToastProvider";
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
  getVisitReport,
  getVisitsPage,
  getVisitStats,
  VISIT_OUTCOME_OPTIONS,
  VISIT_TYPE_OPTIONS,
  visitOutcomeLabel,
  visitTypeLabel,
  type VisitBucket,
  type VisitReport,
  type VisitStats,
} from "@/lib/api/visits";
import { getLeads } from "@/lib/api/leads";
import { useDirectory } from "@/lib/directory";
import { formatDateTime } from "@/lib/format";
import type { Lead, LeadVisit, VisitStatus, VisitType } from "@/lib/types";

const pageSize = 12;

const buckets: Array<{ value: VisitBucket; label: string }> = [
  { value: "All", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "today", label: "Today" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function MasterAdminVisitsPage() {
  const { employees } = useDirectory();
  const { push } = useToast();

  const [view, setView] = useState<"list" | "calendar" | "reports">("list");
  const [visits, setVisits] = useState<LeadVisit[]>([]);
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [report, setReport] = useState<VisitReport | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  const [search, setSearch] = useState("");
  const [bucket, setBucket] = useState<VisitBucket>("All");
  const [status, setStatus] = useState<VisitStatus | "All">("All");
  const [visitType, setVisitType] = useState<VisitType | "All">("All");
  const [employeeId, setEmployeeId] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<LeadVisit | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<LeadVisit | null>(null);
  const [completeTarget, setCompleteTarget] = useState<LeadVisit | null>(null);
  const [cancelTarget, setCancelTarget] = useState<LeadVisit | null>(null);

  const filters = useMemo(
    () => ({
      search: search.trim(),
      bucket,
      status,
      visitType,
      employeeId,
      from: from || undefined,
      to: to || undefined,
    }),
    [search, bucket, status, visitType, employeeId, from, to]
  );

  useEffect(() => {
    let active = true;
    Promise.all([
      getVisitsPage({ ...filters, page: view === "calendar" ? 1 : page, limit: view === "calendar" ? 100 : pageSize }),
      getVisitStats(),
      getVisitReport({ from: from || undefined, to: to || undefined, employeeId }),
    ])
      .then(([pageRes, statsRes, reportRes]) => {
        if (!active) return;
        setVisits(pageRes.visits);
        setMeta({ total: pageRes.meta.total, totalPages: pageRes.meta.totalPages });
        setStats(statsRes);
        setReport(reportRes);
      })
      .catch((err) => {
        if (active) push({ kind: "error", title: "Could not load visits", description: err instanceof Error ? err.message : "Please try again." });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters, page, view, from, to, employeeId, version, push]);

  useEffect(() => {
    if (scheduleOpen && leads.length === 0) {
      getLeads().then(setLeads).catch(() => null);
    }
  }, [scheduleOpen, leads.length]);

  function reload(message: string) {
    push({ kind: "success", title: message });
    setVersion((v) => v + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-900">Customer Visits</h1>
          <p className="mt-1 text-xs text-neutral-500">
            Schedule and track site visits and client meetings (Asia/Kolkata). Due/overdue reminders sync when visits load.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-black/10 bg-white p-1">
            <button type="button" onClick={() => setView("list")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${view === "list" ? "bg-neutral-950 text-white" : "text-neutral-600"}`}>
              <LayoutList className="h-3.5 w-3.5" /> List
            </button>
            <button type="button" onClick={() => setView("calendar")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${view === "calendar" ? "bg-neutral-950 text-white" : "text-neutral-600"}`}>
              <Calendar className="h-3.5 w-3.5" /> Calendar
            </button>
            <button type="button" onClick={() => setView("reports")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${view === "reports" ? "bg-neutral-950 text-white" : "text-neutral-600"}`}>
              <BarChart3 className="h-3.5 w-3.5" /> Reports
            </button>
          </div>
          <button type="button" onClick={() => setScheduleOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700">
            <Plus className="h-4 w-4" />
            Schedule Visit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={MapPin} label="Total Visits" value={stats?.total ?? 0} tone="red" index={0} />
        <StatCard icon={CalendarClock} label="Upcoming" value={stats?.upcoming ?? 0} index={1} />
        <StatCard icon={Calendar} label="Today's Visits" value={stats?.today ?? 0} index={2} />
        <StatCard icon={CheckCircle2} label="Completed" value={stats?.completed ?? 0} index={3} />
        <StatCard icon={XCircle} label="Cancelled" value={stats?.cancelled ?? 0} index={4} />
        <StatCard icon={Clock3} label="Overdue" value={stats?.overdue ?? 0} index={5} />
      </div>

      <Card padded={false} className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          {buckets.map((b) => (
            <button
              key={b.value}
              type="button"
              onClick={() => { setPage(1); setBucket(b.value); }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold ${bucket === b.value ? "bg-neutral-950 text-white" : "border border-black/10 bg-white text-neutral-600 hover:bg-neutral-50"}`}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl bg-neutral-100 px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              placeholder="Search customer, visit ID, title, address..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
          </div>
          <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value as VisitStatus | "All"); }} aria-label="Filter by visit status" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-700">
            <option value="All">All Statuses</option>
            <option value="SCHEDULED">Visit Planned</option>
            <option value="RESCHEDULED">Visit Rescheduled</option>
            <option value="COMPLETED">Visit Done</option>
            <option value="CANCELLED">Visit Cancelled</option>
          </select>
          <select value={visitType} onChange={(e) => { setPage(1); setVisitType(e.target.value as VisitType | "All"); }} aria-label="Filter by visit type" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-700">
            <option value="All">All Types</option>
            {VISIT_TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <select value={employeeId} onChange={(e) => { setPage(1); setEmployeeId(e.target.value); }} aria-label="Filter by employee" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-700">
            <option value="All">All Employees</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <input type="date" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} aria-label="From date" className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-neutral-700" />
          <input type="date" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} aria-label="To date" className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-neutral-700" />
        </div>
      </Card>

      {view === "reports" && report && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card><p className="text-xs text-neutral-500">Scheduled Visits</p><p className="mt-1 text-2xl font-extrabold text-neutral-900">{report.totals.total}</p></Card>
            <Card><p className="text-xs text-neutral-500">Completed</p><p className="mt-1 text-2xl font-extrabold text-emerald-700">{report.totals.completed}</p></Card>
            <Card><p className="text-xs text-neutral-500">Completion Rate</p><p className="mt-1 text-2xl font-extrabold text-neutral-900">{report.totals.completionRate}%</p></Card>
            <Card><p className="text-xs text-neutral-500">Overdue Active</p><p className="mt-1 text-2xl font-extrabold text-brand-red">{report.totals.overdue}</p></Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Employee-wise Visits" subtitle="Aggregated directly in MongoDB" />
              {!report.byEmployee.length ? (
                <p className="text-sm text-neutral-400">No employee visit records.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-black/8 text-xs uppercase text-neutral-400">
                    <tr><th className="py-2">Employee</th><th className="py-2 text-right">Total</th><th className="py-2 text-right">Done</th><th className="py-2 text-right">Upcoming</th><th className="py-2 text-right">Cancelled</th></tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {report.byEmployee.map((row, idx) => (
                      <tr key={row.employeeId ?? idx}>
                        <td className="py-2 font-semibold text-neutral-800">{row.name ?? "Unassigned"}</td>
                        <td className="py-2 text-right font-bold">{row.total}</td>
                        <td className="py-2 text-right text-emerald-700">{row.completed}</td>
                        <td className="py-2 text-right text-blue-700">{row.upcoming}</td>
                        <td className="py-2 text-right text-neutral-500">{row.cancelled}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card>
              <CardHeader title="Outcome Distribution" subtitle="Completed customer visits" />
              <div className="grid grid-cols-2 gap-3">
                {VISIT_OUTCOME_OPTIONS.map((opt) => (
                  <div key={opt.value} className="rounded-xl bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">{opt.label}</p>
                    <p className="mt-1 text-xl font-extrabold text-neutral-900">{report.byOutcome[opt.value] ?? 0}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Date-wise Activity (Asia/Kolkata)" subtitle="Recent 30 active visit dates" />
            {!report.byDate.length ? (
              <p className="text-sm text-neutral-400">No date activity recorded.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {report.byDate.map((row) => (
                  <div key={row.date} className="rounded-xl bg-neutral-50 p-3 text-xs">
                    <p className="font-bold text-neutral-800">{row.date}</p>
                    <p className="mt-1 text-neutral-600">Total: {row.total} · Done: {row.completed}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {view === "calendar" && (
        <Card>
          {loading ? (
            <div className="py-16 text-center text-sm text-neutral-400">Loading calendar…</div>
          ) : (
            <VisitCalendar visits={visits} onSelectVisit={setDetailTarget} />
          )}
        </Card>
      )}

      {view === "list" && (
        <Card>
          {loading ? (
            <div className="py-16 text-center text-sm text-neutral-400">Loading visits…</div>
          ) : visits.length === 0 ? (
            <EmptyState icon={MapPin} title="No customer visits found" description="Schedule a customer visit or adjust your filters." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-black/8 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      <th className="px-3 py-3">Visit Ref</th>
                      <th className="px-3 py-3">Customer / Lead</th>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Assigned</th>
                      <th className="px-3 py-3">Schedule (IST)</th>
                      <th className="px-3 py-3">Location</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Outcome</th>
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {visits.map((visit) => {
                      const active = visit.status === "SCHEDULED" || visit.status === "RESCHEDULED";
                      return (
                        <tr key={visit.id} className="hover:bg-neutral-50">
                          <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-neutral-500">{visit.code ?? visit.id}</td>
                          <td className="px-3 py-3">
                            <p className="font-bold text-neutral-900">{visit.title}</p>
                            {visit.lead && (
                              <Link href={`/master-admin/leads/${visit.lead.code ?? visit.lead.id}`} className="text-xs text-brand-red hover:underline">
                                {visit.lead.clientName} ({visit.lead.code ?? ""})
                              </Link>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs text-neutral-600">{visitTypeLabel(visit.visitType)}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs text-neutral-700">{visit.assignedEmployee?.name ?? "Unassigned"}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-neutral-800">{formatDateTime(visit.scheduledStart)}</td>
                          <td className="max-w-[200px] truncate px-3 py-3 text-xs text-neutral-600">
                            <span className="inline-flex items-center gap-1">
                              {visit.meetingLink ? <Video className="h-3.5 w-3.5 text-blue-600" /> : <MapPin className="h-3.5 w-3.5 text-neutral-400" />}
                              {visit.meetingLink || visit.locationAddress || "—"}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3"><VisitStatusBadge status={visit.status} /></td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs text-neutral-600">{visitOutcomeLabel(visit.outcome)}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button type="button" onClick={() => setDetailTarget(visit)} className="rounded-lg border border-black/10 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100">View</button>
                              {active && (
                                <>
                                  <button type="button" onClick={() => setRescheduleTarget(visit)} className="rounded-lg border border-black/10 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100">Reschedule</button>
                                  <button type="button" onClick={() => setCompleteTarget(visit)} className="rounded-lg bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-800">Done</button>
                                  <button type="button" onClick={() => setCancelTarget(visit)} className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-brand-red hover:bg-red-50">Cancel</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="pt-4">
                <Pagination page={page} totalPages={meta.totalPages} onChange={setPage} totalItems={meta.total} pageSize={pageSize} />
              </div>
            </>
          )}
        </Card>
      )}

      {scheduleOpen && (
        <ScheduleVisitModal
          open
          onClose={() => setScheduleOpen(false)}
          onSaved={(v) => reload(`Visit ${v.code ?? ""} scheduled.`)}
          leads={leads}
          employees={employees}
          allowEmployeeSelect
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
          onSaved={(v) => reload(`Visit ${v.code ?? ""} completed.`)}
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
