"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Inbox,
  ListTodo,
  MapPin,
} from "lucide-react";
import { getEmployee } from "@/lib/api/employees";
import { getLeadStats, type LeadStats } from "@/lib/api/leads";
import { getUnreadCount } from "@/lib/api/notifications";
import { getFollowUpSummary, type FollowUpSummary } from "@/lib/api/followUps";
import { getVisitStats, type VisitStats } from "@/lib/api/visits";
import { getWorkStats, getWorksPage, type WorkStats } from "@/lib/api/works";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import type { EmployeeProfile, Work } from "@/lib/types";

interface DashboardData {
  employee: EmployeeProfile;
  leads: LeadStats;
  works: WorkStats;
  upcoming: Work[];
  upcomingCount: number;
  unread: number;
}

type MetricTone = "accent" | "info" | "warning" | "success";

const toneClasses: Record<MetricTone, string> = {
  accent: "bg-accent-soft text-accent",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
  success: "bg-success-soft text-success",
};

function PrimaryKpiCard({
  label,
  value,
  hint,
  href,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  href: string;
  icon: typeof Inbox;
  tone: MetricTone;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted">{label}</p>
          <p className="mt-2 font-mono text-3xl font-bold tracking-tight text-fg tabular-nums">
            {value}
          </p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-subtle">
        <span>{hint}</span>
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="skeleton h-36 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-32 rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-28 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="skeleton h-48 rounded-xl" />
        <div className="skeleton h-48 rounded-xl" />
      </div>
    </div>
  );
}

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [followUpSummary, setFollowUpSummary] = useState<FollowUpSummary | null>(null);
  const [followUpError, setFollowUpError] = useState("");
  const [visitStats, setVisitStats] = useState<VisitStats | null>(null);

  useEffect(() => {
    if (!user?.employeeId) return;
    let active = true;

    Promise.all([
      getEmployee(user.employeeId),
      getLeadStats(),
      getWorkStats(),
      getWorksPage({ page: 1, limit: 5, sort: "deadline", upcomingOnly: "true" }),
      getUnreadCount(),
    ])
      .then(([employee, leads, works, upcomingPage, unread]) => {
        if (!active) return;
        if (!employee) {
          setError("Your employee profile could not be found. Contact your Master Admin.");
          return;
        }
        setData({
          employee,
          leads,
          works,
          upcoming: upcomingPage.works,
          upcomingCount: upcomingPage.meta.total,
          unread,
        });
        setError("");
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load your dashboard.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.employeeId]);

  useEffect(() => {
    if (!user?.employeeId) return;
    let active = true;
    getFollowUpSummary()
      .then((summary) => {
        if (!active) return;
        setFollowUpSummary(summary);
        setFollowUpError("");
      })
      .catch((reason: unknown) => {
        if (active) setFollowUpError(reason instanceof Error ? reason.message : "Could not load follow-up summary.");
      });
    getVisitStats()
      .then((summary) => {
        if (active) setVisitStats(summary);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, [user?.employeeId]);

  if (!user?.employeeId) {
    return (
      <p role="alert" className="rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm text-warning">
        No employee profile is linked to this account. Contact your Master Admin.
      </p>
    );
  }

  if (loading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
        {error || "Dashboard data is unavailable."}
      </div>
    );
  }

  const activeLeads = Math.max(
    0,
    data.leads.total - (data.leads.byStatus.Approved ?? 0) - (data.leads.byStatus.Completed ?? 0)
  );
  const openTasks = Math.max(0, data.works.total - data.works.COMPLETED - data.works.APPROVED);
  const completionPct =
    data.works.total > 0 ? Math.round(((data.works.COMPLETED + data.works.APPROVED) / data.works.total) * 100) : 0;

  const primaryKpis = [
    {
      label: "Assigned Leads",
      value: data.leads.total,
      hint: "Total leads under your account",
      href: "/employee/leads",
      icon: Inbox,
      tone: "accent" as const,
    },
    {
      label: "Active Leads",
      value: activeLeads,
      hint: "Open enquiries in pipeline",
      href: "/employee/leads",
      icon: ListTodo,
      tone: "info" as const,
    },
    {
      label: "Open Tasks",
      value: openTasks,
      hint: `${data.works.IN_PROGRESS} currently in progress`,
      href: "/employee/tasks",
      icon: ClipboardList,
      tone: "warning" as const,
    },
    {
      label: "Upcoming Deadlines",
      value: data.upcomingCount,
      hint: "Open tasks due from today",
      href: "/employee/tasks",
      icon: CalendarDays,
      tone: "success" as const,
    },
  ];

  const taskPipelineStats = [
    { label: "Total Tasks", value: data.works.total, icon: ClipboardList, tint: "text-fg" },
    { label: "In Progress", value: data.works.IN_PROGRESS, icon: Clock3, tint: "text-info" },
    { label: "Pending Review", value: data.works.SUBMITTED, icon: CalendarClock, tint: "text-warning" },
    { label: "Completed", value: data.works.COMPLETED, icon: CheckCircle2, tint: "text-success" },
    { label: "Unread Alerts", value: data.unread, icon: Bell, tint: "text-accent" },
  ];

  return (
    <div className="space-y-6">
      {/* Clean Hero Banner matching MAAAD Agency dark + red aesthetic in both modes */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent-soft blur-3xl" />
          <svg className="absolute inset-0 h-full w-full text-fg opacity-[0.035]">
            <pattern id="emp-hero-grid" width="44" height="44" patternUnits="userSpaceOnUse">
              <path d="M44 0H0V44" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#emp-hero-grid)" />
          </svg>
        </div>

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {data.employee.code && (
                <span className="rounded-md border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-semibold text-muted">
                  {data.employee.code}
                </span>
              )}
              {data.employee.department && (
                <span className="rounded-md bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                  {data.employee.department}
                </span>
              )}
              <span className="rounded-md bg-success-soft px-2.5 py-0.5 text-[11px] font-semibold text-success">
                {data.employee.availability ?? "Available"}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">
              Welcome back, <span className="text-accent">{data.employee.name}</span>
            </h1>
            <p className="mt-1 text-sm text-muted">
              {data.employee.role} · Track leads, follow-ups, visits, and active deliverables cleanly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/employee/leads"
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-fg transition-colors hover:bg-accent-hover"
            >
              <Inbox className="h-3.5 w-3.5" />
              My Leads
            </Link>
            <Link
              href="/employee/follow-ups"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-4 py-2 text-xs font-bold text-fg transition-colors hover:border-border-strong"
            >
              <CalendarClock className="h-3.5 w-3.5 text-muted" />
              Follow-ups
            </Link>
            <Link
              href="/employee/visits"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-4 py-2 text-xs font-bold text-fg transition-colors hover:border-border-strong"
            >
              <MapPin className="h-3.5 w-3.5 text-muted" />
              Visits
            </Link>
          </div>
        </div>
      </section>

      {/* Primary KPI Grid */}
      <section aria-label="Primary metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {primaryKpis.map((kpi) => (
          <PrimaryKpiCard key={kpi.label} {...kpi} />
        ))}
      </section>

      {/* Compact Task Pipeline & Completion Progress */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-fg">Work &amp; Alert Pulse</h2>
            <p className="text-xs text-muted">Snapshot of task workflow progression and unread notices.</p>
          </div>
          <span className="font-mono text-xs font-semibold text-muted tabular-nums">
            {completionPct}% completed
          </span>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${completionPct}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {taskPipelineStats.map(({ label, value, icon: Icon, tint }) => (
            <div key={label} className="rounded-lg border border-border bg-surface-2/50 px-3.5 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-muted">{label}</span>
                <Icon className={`h-3.5 w-3.5 ${tint}`} />
              </div>
              <p className="mt-1 font-mono text-xl font-bold text-fg tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Two-Column Schedule Cards: Follow-ups + Customer Visits */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-fg">Follow-up Schedule</h2>
              <p className="mt-0.5 text-xs text-muted">Live call reminders &amp; review queue.</p>
            </div>
            <Link href="/employee/follow-ups" className="text-xs font-bold text-accent hover:underline">
              View all
            </Link>
          </div>

          {followUpError ? (
            <p role="status" className="mt-4 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
              Follow-up summary unavailable: {followUpError}
            </p>
          ) : followUpSummary ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { label: "Upcoming", count: followUpSummary.upcoming, cls: "bg-surface-2/60 text-fg border-border" },
                { label: "Due today", count: followUpSummary.dueToday, cls: "bg-warning-soft text-warning border-warning/25" },
                { label: "Overdue", count: followUpSummary.overdue, cls: "bg-danger-soft text-danger border-danger/25" },
                { label: "Awaiting review", count: followUpSummary.reviewRequired, cls: "bg-info-soft text-info border-info/25" },
              ].map((item) => (
                <div key={item.label} className={`rounded-lg border p-3.5 ${item.cls}`}>
                  <p className="text-[11px] font-semibold opacity-85">{item.label}</p>
                  <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{item.count}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="skeleton h-16 rounded-lg" />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-fg">Customer Visits</h2>
              <p className="mt-0.5 text-xs text-muted">Site visits &amp; client meetings assigned to you.</p>
            </div>
            <Link href="/employee/visits" className="text-xs font-bold text-accent hover:underline">
              Open visits
            </Link>
          </div>

          {visitStats ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { label: "Today's visits", count: visitStats.today, cls: "bg-accent-soft text-accent border-accent/25" },
                { label: "Upcoming", count: visitStats.upcoming, cls: "bg-info-soft text-info border-info/25" },
                { label: "Overdue", count: visitStats.overdue, cls: "bg-danger-soft text-danger border-danger/25" },
                { label: "Completed", count: visitStats.completed, cls: "bg-success-soft text-success border-success/25" },
              ].map((item) => (
                <div key={item.label} className={`rounded-lg border p-3.5 ${item.cls}`}>
                  <p className="text-[11px] font-semibold opacity-85">{item.label}</p>
                  <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{item.count}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="skeleton h-16 rounded-lg" />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Upcoming Deadlines List */}
      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-fg">Upcoming Deadlines</h2>
            <p className="mt-0.5 text-xs text-muted">Your next open deliverables sorted by nearest due date.</p>
          </div>
          <Link href="/employee/tasks" className="text-xs font-bold text-accent hover:underline">
            View all tasks
          </Link>
        </div>

        {data.upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface-2/40 px-4 py-10 text-center">
            <CheckCircle2 className="mx-auto h-6 w-6 text-success" />
            <p className="mt-2 text-sm font-semibold text-fg">All caught up</p>
            <p className="mt-0.5 text-xs text-muted">No open tasks with upcoming deadlines right now.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {data.upcoming.map((work) => {
              const progress = Math.min(100, Math.max(0, work.progress ?? 0));
              return (
                <li key={work.id}>
                  <Link
                    href={`/employee/tasks/${work.code ?? work.id}`}
                    className="flex flex-col gap-3 rounded-lg px-2 py-3.5 transition-colors hover:bg-surface-2/60 sm:flex-row sm:items-center sm:justify-between sm:px-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-muted">
                          {work.code ?? "TASK"}
                        </span>
                        <span className="truncate text-sm font-bold text-fg">{work.title}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {work.clientName} · {work.service}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-4">
                      <div className="w-24">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-muted">
                          <span>Progress</span>
                          <span className="font-mono tabular-nums">{progress}%</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <span className="rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs font-semibold text-fg tabular-nums">
                        Due {formatDate(work.deadline)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
