"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  Flame,
  Inbox,
  MapPin,
  MessageCircle,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/master-admin/StatCard";
import { WorkflowPanel } from "@/components/master-admin/WorkflowPanel";
import { WhatsAppOverviewCard } from "@/components/master-admin/WhatsAppOverviewCard";
import { LeadTable } from "@/components/master-admin/LeadTable";
import { AssignmentModal } from "@/components/master-admin/AssignmentModal";
import { Card, CardHeader } from "@/components/master-admin/ui/Card";
import { LEAD_QUALITIES, QualityBadge } from "@/components/master-admin/ui/QualityBadge";
import { useToast } from "@/components/master-admin/ui/ToastProvider";
import { useDirectory } from "@/lib/directory";
import { useAuth } from "@/lib/auth-context";
import { assignLead, getLeads, getLeadStats, type LeadStats } from "@/lib/api/leads";
import { getDashboardSummary, type DashboardSummary } from "@/lib/api/analytics";
import { getWhatsAppStatus } from "@/lib/api/whatsapp";
import { getFollowUpReport, type FollowUpReport } from "@/lib/api/followUps";
import { getVisitStats, type VisitStats } from "@/lib/api/visits";
import type { Lead, LeadQuality } from "@/lib/types";

const qualityBarColors: Record<LeadQuality | "UNCLASSIFIED", string> = {
  HOT: "bg-danger",
  WARM: "bg-warning",
  COLD: "bg-info",
  TRY: "bg-accent",
  WASTE: "bg-neutral-400",
  UNCLASSIFIED: "bg-border-strong",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);
  const [visitStats, setVisitStats] = useState<VisitStats | null>(null);
  const [connected, setConnected] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Lead | null>(null);
  const [followUpReport, setFollowUpReport] = useState<FollowUpReport | null>(null);
  const [followUpError, setFollowUpError] = useState("");
  const { push } = useToast();
  const { employeeById } = useDirectory();

  useEffect(() => {
    getLeads()
      .then((data) => {
        setLeads(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    getDashboardSummary().then(setSummary).catch(() => setSummary(null));
    getLeadStats().then(setLeadStats).catch(() => setLeadStats(null));
    getVisitStats().then(setVisitStats).catch(() => setVisitStats(null));
    getWhatsAppStatus()
      .then((s) => setConnected(s.connected))
      .catch(() => setConnected(false));
    getFollowUpReport()
      .then(setFollowUpReport)
      .catch((reason: unknown) =>
        setFollowUpError(reason instanceof Error ? reason.message : "Could not load follow-up overview.")
      );
  }, []);

  const newLeads = summary?.newLeads ?? leads.filter((l) => l.status === "New").length;
  const totalLeadsCount = summary?.totalLeads ?? leadStats?.total ?? leads.length;

  async function handleAssign(employeeId: string) {
    if (!assignTarget) return;
    const updated = await assignLead(assignTarget.id, employeeId);
    if (updated) {
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      const emp = employeeById(employeeId);
      push({ kind: "success", title: "Lead assigned", description: `${assignTarget.clientName} assigned to ${emp?.name}.` });
    }
  }

  const qualityTotal = leadStats ? Math.max(1, leadStats.total) : 1;
  const qualityBuckets: Array<{ key: LeadQuality | "UNCLASSIFIED"; label: string; count: number }> = [
    ...LEAD_QUALITIES.map((q) => ({ key: q, label: q, count: leadStats?.byQuality?.[q] ?? 0 })),
    { key: "UNCLASSIFIED" as const, label: "Unclassified", count: leadStats?.byQuality?.UNCLASSIFIED ?? 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Command Header with Quick Actions */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent-soft blur-3xl"
        />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                {user?.role === "MASTER_ADMIN" ? "Master Admin" : "Admin"} Overview
              </span>
              <span className="text-xs text-muted">Live Agency Operations &amp; Pipeline</span>
            </div>
            <h1 className="mt-2 text-xl font-extrabold tracking-tight text-fg sm:text-2xl">
              Welcome back{user?.name ? `, ${user.name}` : ""}
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              Monitor lead intake, quality mix, follow-ups, site visits, and team delivery from one workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/master-admin/leads"
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-bold text-accent-fg transition-colors hover:bg-accent-hover"
            >
              <Plus className="h-3.5 w-3.5" />
              Manage Leads
            </Link>
            <Link
              href="/master-admin/visits"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-bold text-fg hover:border-border-strong"
            >
              <MapPin className="h-3.5 w-3.5 text-muted" />
              Visits
            </Link>
            <Link
              href="/master-admin/quotations/new"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-bold text-fg hover:border-border-strong"
            >
              <FileText className="h-3.5 w-3.5 text-muted" />
              New Quote
            </Link>
            {user?.role !== "EMPLOYEE" && (
              <Link
                href="/master-admin/leads/import-export"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-bold text-fg hover:border-border-strong"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-accent" />
                Excel Import / Export
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Tier 1: Spacious 4-Column Primary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Inbox} label="Total Leads" value={totalLeadsCount} tone="red" href="/master-admin/leads" index={0} />
        <StatCard icon={Sparkles} label="New Leads" value={newLeads} href="/master-admin/leads?status=New" index={1} />
        <StatCard icon={Activity} label="Active Work" value={summary?.activeWork ?? 0} href="/master-admin/work" index={2} />
        <StatCard icon={Clock} label="Pending Review" value={summary?.pendingReview ?? 0} href="/master-admin/work?status=SUBMITTED" index={3} />
      </div>

      {/* Tier 2: Compact Secondary Agency Counts */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/master-admin/work?status=COMPLETED"
          className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3.5 transition-colors hover:border-border-strong"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-soft text-success">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-medium text-muted">Completed Work</p>
              <p className="font-num text-lg font-extrabold text-fg tabular-nums">{summary?.completed ?? 0}</p>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted" />
        </Link>

        <Link
          href="/master-admin/employees"
          className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3.5 transition-colors hover:border-border-strong"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-info-soft text-info">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-medium text-muted">Active Employees</p>
              <p className="font-num text-lg font-extrabold text-fg tabular-nums">{summary?.employees ?? 0}</p>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted" />
        </Link>

        <Link
          href="/master-admin/whatsapp"
          className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3.5 transition-colors hover:border-border-strong"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <MessageCircle className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-medium text-muted">WhatsApp Chats</p>
              <p className="font-num text-lg font-extrabold text-fg tabular-nums">
                {summary?.whatsappChats ?? 0}
                {(summary?.unreadMessages ?? 0) > 0 && (
                  <span className="ml-2 text-xs font-semibold text-accent">({summary?.unreadMessages} unread)</span>
                )}
              </p>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted" />
        </Link>
      </div>

      <WorkflowPanel leads={leads} />

      {/* Operational Insights Row: Lead Quality Mix + Customer Visits + Follow-ups */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Card 1: Lead Quality Breakdown */}
        <Card>
          <CardHeader
            title="Lead Quality Mix"
            subtitle="Click a category to filter Leads."
            action={
              <Link href="/master-admin/leads" className="text-xs font-bold text-accent hover:underline">
                All leads →
              </Link>
            }
          />
          {!leadStats ? (
            <div className="space-y-3">
              <div className="skeleton h-3 w-full" />
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton h-12" />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                {qualityBuckets.map((b) =>
                  b.count > 0 ? (
                    <div
                      key={b.key}
                      title={`${b.label}: ${b.count}`}
                      className={qualityBarColors[b.key]}
                      style={{ width: `${(b.count / qualityTotal) * 100}%` }}
                    />
                  ) : null
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {qualityBuckets.map((b) => (
                  <Link
                    key={b.key}
                    href={`/master-admin/leads?quality=${b.key}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface-2/60 px-3 py-2 transition-colors hover:border-border-strong"
                  >
                    {b.key === "UNCLASSIFIED" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted">
                        <Flame className="h-3 w-3 opacity-60" /> Unclassified
                      </span>
                    ) : (
                      <QualityBadge quality={b.key} />
                    )}
                    <span className="font-num text-sm font-extrabold text-fg tabular-nums">{b.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Card 2: Customer Visits Today */}
        <Card>
          <CardHeader
            title="Customer Visits"
            subtitle="Scheduled site visits &amp; client meetings."
            action={
              <Link href="/master-admin/visits" className="text-xs font-bold text-accent hover:underline">
                Open visits →
              </Link>
            }
          />
          {!visitStats ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-16" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Today", value: visitStats.today, cls: "bg-accent-soft text-accent border-accent/25" },
                { label: "Upcoming", value: visitStats.upcoming, cls: "bg-info-soft text-info border-info/25" },
                { label: "Overdue", value: visitStats.overdue, cls: "bg-danger-soft text-danger border-danger/25" },
                { label: "Completed", value: visitStats.completed, cls: "bg-success-soft text-success border-success/25" },
              ].map((stat) => (
                <Link
                  key={stat.label}
                  href="/master-admin/visits"
                  className={`rounded-xl border p-3 transition-opacity hover:opacity-90 ${stat.cls}`}
                >
                  <p className="text-[11px] font-semibold opacity-85">{stat.label}</p>
                  <p className="mt-1 font-num text-2xl font-extrabold tabular-nums">{stat.value}</p>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Card 3: Follow-up Overview */}
        <Card>
          <CardHeader
            title="Follow-up Overview"
            subtitle="Sales call queue &amp; review triggers."
            action={
              <Link href="/master-admin/follow-ups" className="text-xs font-bold text-accent hover:underline">
                View report →
              </Link>
            }
          />
          {followUpError ? (
            <p role="status" className="rounded-xl bg-warning-soft p-3 text-xs text-warning">
              Follow-up overview unavailable: {followUpError}
            </p>
          ) : followUpReport ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Never contacted", value: followUpReport.leadsNeverContacted, cls: "bg-surface-2/70 text-fg border-border" },
                { label: "Due today", value: followUpReport.dueToday, cls: "bg-warning-soft text-warning border-warning/25" },
                { label: "Overdue", value: followUpReport.overdue, cls: "bg-danger-soft text-danger border-danger/25" },
                { label: "Review required", value: followUpReport.reviewRequired, cls: "bg-info-soft text-info border-info/25" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href="/master-admin/follow-ups"
                  className={`rounded-xl border p-3 transition-opacity hover:opacity-90 ${item.cls}`}
                >
                  <p className="text-[11px] font-semibold opacity-85">{item.label}</p>
                  <p className="mt-1 font-num text-2xl font-extrabold tabular-nums">{item.value}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-16" />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Leads & WhatsApp Activity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader
              title="Recent Leads"
              subtitle="Newest enquiries across WhatsApp, website and manual entry."
              action={
                <Link
                  href="/master-admin/leads"
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-muted hover:bg-surface-2 hover:text-fg"
                >
                  <CalendarClock className="h-3.5 w-3.5" />
                  View All
                </Link>
              }
            />
            {loading ? (
              <div className="space-y-2.5 py-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="skeleton h-12 w-full" />
                ))}
              </div>
            ) : (
              <LeadTable leads={leads.slice(0, 6)} compact onAssign={setAssignTarget} />
            )}
          </Card>
        </div>
        <WhatsAppOverviewCard
          connected={connected}
          messagesToday={summary?.messagesToday ?? 0}
          activeChats={summary?.whatsappChats ?? 0}
          newLeads={newLeads}
          unread={summary?.unreadMessages ?? 0}
        />
      </div>

      <Link
        href="/master-admin/work"
        className="fixed bottom-[calc(56px+1rem+env(safe-area-inset-bottom))] right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-fg shadow-xl transition-transform hover:scale-105 sm:bottom-6 sm:right-6 lg:hidden"
        aria-label="Create work"
      >
        <Plus className="h-5 w-5" />
      </Link>

      <AssignmentModal
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        title="Assign Lead"
        description={assignTarget ? `Assign ${assignTarget.clientName}'s requirement to an employee.` : undefined}
        onAssign={handleAssign}
      />
    </div>
  );
}
