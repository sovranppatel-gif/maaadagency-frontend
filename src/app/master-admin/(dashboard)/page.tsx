"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Inbox, Sparkles, Activity, Clock, CheckCircle2, Users, MessageCircle, Plus } from "lucide-react";
import { StatCard } from "@/components/master-admin/StatCard";
import { WorkflowPanel } from "@/components/master-admin/WorkflowPanel";
import { WhatsAppOverviewCard } from "@/components/master-admin/WhatsAppOverviewCard";
import { LeadTable } from "@/components/master-admin/LeadTable";
import { AssignmentModal } from "@/components/master-admin/AssignmentModal";
import { Card, CardHeader } from "@/components/master-admin/ui/Card";
import { useToast } from "@/components/master-admin/ui/ToastProvider";
import { useDirectory } from "@/lib/directory";
import { getLeads, assignLead } from "@/lib/api/leads";
import { getDashboardSummary, type DashboardSummary } from "@/lib/api/analytics";
import { getWhatsAppStatus } from "@/lib/api/whatsapp";
import { getFollowUpReport, type FollowUpReport } from "@/lib/api/followUps";
import type { Lead } from "@/lib/types";

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [connected, setConnected] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Lead | null>(null);
  const [followUpReport, setFollowUpReport] = useState<FollowUpReport | null>(null);
  const [followUpError, setFollowUpError] = useState("");
  const { push } = useToast();
  const { employeeById } = useDirectory();

  useEffect(() => {
    getLeads().then((data) => {
      setLeads(data);
      setLoading(false);
    });
    getDashboardSummary().then(setSummary).catch(() => setSummary(null));
    getWhatsAppStatus()
      .then((s) => setConnected(s.connected))
      .catch(() => setConnected(false));
    getFollowUpReport()
      .then(setFollowUpReport)
      .catch((reason: unknown) => setFollowUpError(reason instanceof Error ? reason.message : "Could not load follow-up overview."));
  }, []);

  const newLeads = summary?.newLeads ?? leads.filter((l) => l.status === "New").length;

  async function handleAssign(employeeId: string) {
    if (!assignTarget) return;
    const updated = await assignLead(assignTarget.id, employeeId);
    if (updated) {
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      const emp = employeeById(employeeId);
      push({ kind: "success", title: "Lead assigned", description: `${assignTarget.clientName} assigned to ${emp?.name}.` });
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard icon={Inbox} label="Total Leads" value={summary?.totalLeads ?? leads.length} tone="red" href="/master-admin/leads" index={0} change={{ value: "12%", positive: true }} />
        <StatCard icon={Sparkles} label="New Leads" value={newLeads} href="/master-admin/leads?status=New" index={1} change={{ value: "8%", positive: true }} />
        <StatCard icon={Activity} label="Active Work" value={summary?.activeWork ?? 0} href="/master-admin/work" index={2} change={{ value: "4%", positive: true }} />
        <StatCard icon={Clock} label="Pending Review" value={summary?.pendingReview ?? 0} href="/master-admin/work?status=SUBMITTED" index={3} change={{ value: "2%", positive: false }} />
        <StatCard icon={CheckCircle2} label="Completed" value={summary?.completed ?? 0} href="/master-admin/work?status=COMPLETED" index={4} change={{ value: "19%", positive: true }} />
        <StatCard icon={Users} label="Employees" value={summary?.employees ?? 0} href="/master-admin/employees" index={5} />
        <StatCard icon={MessageCircle} label="WhatsApp Chats" value={summary?.whatsappChats ?? 0} href="/master-admin/whatsapp" index={6} change={{ value: "6%", positive: true }} />
      </div>

      <WorkflowPanel leads={leads} />

      <Card>
        <CardHeader
          title="Follow-up Overview"
          subtitle="Sales follow-up monitoring, separate from Work Management status."
          action={<Link href="/master-admin/follow-ups" className="text-xs font-bold text-brand-red">View report →</Link>}
        />
        {followUpError ? (
          <p role="status" className="text-sm text-amber-700">Follow-up overview unavailable: {followUpError}</p>
        ) : followUpReport ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Never contacted", followUpReport.leadsNeverContacted],
              ["Due today", followUpReport.dueToday],
              ["Overdue", followUpReport.overdue],
              ["Review required", followUpReport.reviewRequired],
            ].map(([label, count]) => (
              <div key={label} className="rounded-xl bg-neutral-50 p-3">
                <p className="text-xs text-neutral-500">{label}</p>
                <p className="mt-1 text-xl font-extrabold text-neutral-900">{count}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-400">Loading follow-up overview…</p>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader
              title="Recent Leads"
              subtitle="Newest enquiries across WhatsApp, website and manual entry."
              action={
                <Link
                  href="/master-admin/leads"
                  className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
                >
                  View All
                </Link>
              }
            />
            {loading ? (
              <div className="py-16 text-center text-sm text-neutral-400">Loading leads…</div>
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
        className="fixed bottom-[calc(56px+1rem+env(safe-area-inset-bottom))] right-4 z-30 flex h-12 w-12 sm:bottom-6 sm:right-6 items-center justify-center rounded-full bg-brand-red text-white shadow-xl shadow-brand-red/30 transition-transform hover:scale-105 lg:hidden"
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
