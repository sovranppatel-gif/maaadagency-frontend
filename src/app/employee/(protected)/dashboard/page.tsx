"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, ClipboardList, Clock3, Inbox, ListTodo, Loader2 } from "lucide-react";
import { getEmployee } from "@/lib/api/employees";
import { getLeadStats } from "@/lib/api/leads";
import { getUnreadCount } from "@/lib/api/notifications";
import { getFollowUpSummary, type FollowUpSummary } from "@/lib/api/followUps";
import { getWorkStats, getWorksPage } from "@/lib/api/works";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import type { EmployeeProfile, Work } from "@/lib/types";
import type { LeadStats } from "@/lib/api/leads";
import type { WorkStats } from "@/lib/api/works";

interface DashboardData {
  employee: EmployeeProfile;
  leads: LeadStats;
  works: WorkStats;
  upcoming: Work[];
  upcomingCount: number;
  unread: number;
}

function MetricCard({ label, value, description, icon: Icon }: {
  label: string;
  value: number;
  description: string;
  icon: typeof Inbox;
}) {
  return (
    <article className="rounded-2xl border border-black/6 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-neutral-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-neutral-900">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700"><Icon className="h-5 w-5" /></span>
      </div>
      <p className="mt-3 text-xs text-neutral-400">{description}</p>
    </article>
  );
}

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [followUpSummary, setFollowUpSummary] = useState<FollowUpSummary | null>(null);
  const [followUpError, setFollowUpError] = useState("");

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
    return () => {
      active = false;
    };
  }, [user?.employeeId]);

  if (!user?.employeeId) {
    return <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">No employee profile is linked to this account. Contact your Master Admin.</p>;
  }

  if (loading) {
    return <div className="flex items-center justify-center gap-2 py-24 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading your dashboard…</div>;
  }

  if (error || !data) {
    return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error || "Dashboard data is unavailable."}</div>;
  }

  const activeLeads = Math.max(
    0,
    data.leads.total - (data.leads.byStatus.Approved ?? 0) - (data.leads.byStatus.Completed ?? 0)
  );
  const metrics = [
    { label: "Assigned leads", value: data.leads.total, description: "Leads currently assigned to you", icon: Inbox },
    { label: "Active leads", value: activeLeads, description: "Assigned leads not yet completed", icon: ListTodo },
    { label: "Assigned tasks", value: data.works.total, description: "Tasks assigned to your employee profile", icon: ClipboardList },
    { label: "In progress", value: data.works.IN_PROGRESS, description: "Tasks you have started", icon: Clock3 },
    { label: "Pending review", value: data.works.SUBMITTED, description: "Tasks submitted for admin review", icon: ClipboardList },
    { label: "Completed tasks", value: data.works.COMPLETED, description: "Tasks marked complete", icon: CheckCircle2 },
    { label: "Unread notifications", value: data.unread, description: "Updates addressed to your account", icon: Inbox },
    { label: "Upcoming deadlines", value: data.upcomingCount, description: "Open tasks due from today onward", icon: CalendarDays },
  ];

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-2xl bg-neutral-950 p-6 text-white sm:p-8">
        <p className="text-sm text-neutral-300">Welcome back, {data.employee.name}.</p>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Your work, all in one place</h1>
        <p className="mt-2 text-sm text-neutral-400">
          {data.employee.code ?? "Employee ID"}{data.employee.department ? ` · ${data.employee.department}` : ""} · {data.employee.role}
        </p>
      </section>

      <section aria-label="Work overview" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </section>

      <section className="rounded-2xl border border-black/6 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Follow-up schedule</h2>
            <p className="mt-1 text-xs text-neutral-500">Reminders are generated when due items are loaded; there is no background scheduler.</p>
          </div>
          <Link href="/employee/follow-ups" className="text-xs font-bold text-red-700 hover:text-red-800">Open follow-ups</Link>
        </div>
        {followUpError ? (
          <p role="status" className="mt-3 text-xs text-amber-700">Follow-up summary unavailable: {followUpError}</p>
        ) : followUpSummary ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Upcoming", followUpSummary.upcoming],
              ["Due today", followUpSummary.dueToday],
              ["Overdue", followUpSummary.overdue],
              ["Awaiting Admin review", followUpSummary.reviewRequired],
            ].map(([label, count]) => (
              <div key={label} className="rounded-xl bg-neutral-50 p-3">
                <p className="text-[11px] font-semibold text-neutral-500">{label}</p>
                <p className="mt-1 text-xl font-extrabold text-neutral-900">{count}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-neutral-400">Loading follow-up counters…</p>
        )}
      </section>

      <section className="rounded-2xl border border-black/6 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Upcoming deadlines</h2>
            <p className="mt-0.5 text-sm text-neutral-500">Your next open tasks, ordered by deadline.</p>
          </div>
          <Link href="/employee/tasks" className="text-sm font-bold text-red-700 hover:text-red-800">View all tasks</Link>
        </div>
        {data.upcoming.length === 0 ? (
          <p className="rounded-xl bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">No upcoming task deadlines.</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {data.upcoming.map((work) => (
              <li key={work.id}>
                <Link href={`/employee/tasks/${work.code ?? work.id}`} className="flex flex-col gap-2 py-3 hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between sm:px-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-neutral-800">{work.title}</span>
                    <span className="mt-0.5 block text-xs text-neutral-500">{work.code ?? "Task"} · {work.clientName}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-neutral-600">Due {formatDate(work.deadline)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
