"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/master-admin/ui/Card";
import { StatCard } from "@/components/master-admin/StatCard";
import { BarChart } from "@/components/master-admin/charts/BarChart";
import { DonutChart } from "@/components/master-admin/charts/DonutChart";
import { LineChart } from "@/components/master-admin/charts/LineChart";
import { getAnalytics, getWhatsAppWeeklyAnalytics, type AnalyticsData, type WeeklyWhatsAppDatum } from "@/lib/api/analytics";
import { getDashboardSummary } from "@/lib/api/analytics";
import { Inbox, TrendingUp, Users, MessageCircle } from "lucide-react";

const sourceColors: Record<string, string> = {
  WhatsApp: "#25D366",
  Website: "#C5161D",
  Referral: "#7c3aed",
  Manual: "#a3a3a3",
};

const statusColors: Record<string, string> = {
  UNASSIGNED: "#a3a3a3",
  ASSIGNED: "#7c3aed",
  IN_PROGRESS: "#f59e0b",
  SUBMITTED: "#06b6d4",
  CHANGES_REQUESTED: "#f97316",
  APPROVED: "#10b981",
  COMPLETED: "#111111",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [weekly, setWeekly] = useState<WeeklyWhatsAppDatum[]>([]);
  const [whatsappChats, setWhatsappChats] = useState(0);

  useEffect(() => {
    getAnalytics().then(setData).catch(() => setData(null));
    getWhatsAppWeeklyAnalytics().then(setWeekly).catch(() => setWeekly([]));
    getDashboardSummary()
      .then((s) => setWhatsappChats(s.whatsappChats))
      .catch(() => setWhatsappChats(0));
  }, []);

  const leadsByService = data?.leadsByService ?? [];
  const leadsBySource = (data?.leadsBySource ?? []).map((d) => ({ ...d, color: sourceColors[d.label] || "#999" }));
  const workByStatus = (data?.workByStatus ?? []).map((d) => ({
    label: d.label.replace("_", " "),
    value: d.value,
    color: statusColors[d.label] || "#999",
  }));
  const employeePerformance = data?.employeePerformance ?? [];
  const monthlyLeads = data?.monthlyLeads ?? [];
  const monthlyCompleted = data?.monthlyCompleted ?? [];
  const totals = data?.totals;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Inbox} label="Total Leads" value={totals?.totalLeads ?? 0} tone="red" index={0} change={{ value: "14%", positive: true }} />
        <StatCard icon={TrendingUp} label="Conversion Rate" value={totals ? `${totals.conversionRate}%` : "—"} index={1} change={{ value: "3%", positive: true }} />
        <StatCard icon={Users} label="Avg. Completion Time" value={totals ? `${totals.avgCompletionDays} days` : "—"} index={2} change={{ value: "0.8d", positive: true }} />
        <StatCard icon={MessageCircle} label="WhatsApp Response Rate" value="98%" index={3} change={{ value: "1%", positive: true }} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Leads by Service" subtitle="Which services generate the most enquiries" />
          <BarChart data={leadsByService} />
        </Card>
        <Card>
          <CardHeader title="Leads by Source" subtitle="Where your leads are coming from" />
          <DonutChart data={leadsBySource} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Work Status Breakdown" subtitle="Current state of all work items" />
          <DonutChart data={workByStatus} />
        </Card>
        <Card>
          <CardHeader title="Employee Performance" subtitle="Completed work items per employee" />
          <BarChart data={employeePerformance} color="#111111" />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Monthly Leads" />
          <LineChart data={monthlyLeads} />
        </Card>
        <Card>
          <CardHeader title="Monthly Completed Work" />
          <LineChart data={monthlyCompleted} color="#10b981" />
        </Card>
        <Card>
          <CardHeader title="WhatsApp Conversations" subtitle="This week" />
          <LineChart data={weekly} color="#25D366" />
          <p className="mt-2 text-xs text-neutral-400">{whatsappChats} active conversations total</p>
        </Card>
      </div>
    </div>
  );
}
