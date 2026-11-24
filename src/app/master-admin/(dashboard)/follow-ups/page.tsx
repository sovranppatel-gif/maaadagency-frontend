"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Clock3, Loader2, MessageSquare, ShieldAlert, Users } from "lucide-react";
import { getFollowUpReport, type FollowUpReport } from "@/lib/api/followUps";

function ReportMetric({ label, value, icon: Icon, tone = "neutral" }: {
  label: string;
  value: number;
  icon: typeof Users;
  tone?: "neutral" | "red" | "amber";
}) {
  const iconTone = tone === "red" ? "bg-red-50 text-red-700" : tone === "amber" ? "bg-amber-50 text-amber-800" : "bg-neutral-100 text-neutral-600";
  return (
    <article className="rounded-2xl border border-black/6 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-neutral-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-neutral-900">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconTone}`}><Icon className="h-5 w-5" /></span>
      </div>
    </article>
  );
}

export default function MasterAdminFollowUpsPage() {
  const [report, setReport] = useState<FollowUpReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getFollowUpReport()
      .then((result) => {
        if (!active) return;
        setReport(result);
        setError("");
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load the follow-up report.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <div className="flex items-center justify-center gap-2 py-24 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading follow-up report…</div>;
  if (error || !report) return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error || "Report unavailable."}</p>;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-xl font-extrabold text-neutral-900">Follow-up Overview</h1>
        <p className="mt-1 text-sm text-neutral-500">Sales follow-up activity is tracked separately from work and review statuses.</p>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <ReportMetric label="Leads never contacted" value={report.leadsNeverContacted} icon={Users} />
        <ReportMetric label="Due today" value={report.dueToday} icon={CalendarClock} tone="amber" />
        <ReportMetric label="Overdue follow-ups" value={report.overdue} icon={Clock3} tone="red" />
        <ReportMetric label="Four attempts completed" value={report.fourAttemptsCompleted} icon={MessageSquare} />
        <ReportMetric label="Awaiting review" value={report.reviewRequired} icon={ShieldAlert} tone="amber" />
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-black/6 bg-white shadow-sm">
          <div className="border-b border-black/5 px-4 py-4 sm:px-5">
            <h2 className="text-sm font-bold text-neutral-900">Employee-wise follow-ups</h2>
            <p className="mt-1 text-xs text-neutral-500">Total submitted records per employee.</p>
          </div>
          {!report.employeeWise.length ? (
            <p className="px-4 py-10 text-center text-sm text-neutral-500">No follow-ups recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px] text-left text-sm">
                <thead className="bg-neutral-50 text-[11px] uppercase tracking-wide text-neutral-400">
                  <tr><th className="px-4 py-3 font-semibold">Employee</th><th className="px-4 py-3 font-semibold">Employee ID</th><th className="px-4 py-3 text-right font-semibold">Follow-ups</th></tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {report.employeeWise.map((row) => (
                    <tr key={row.employeeId}>
                      <td className="px-4 py-3 font-semibold text-neutral-800">{row.name || "Employee record unavailable"}</td>
                      <td className="px-4 py-3 text-xs text-neutral-500">{row.code || "—"}</td>
                      <td className="px-4 py-3 text-right font-bold text-neutral-900">{row.followUps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-black/6 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-bold text-neutral-900">Latest customer interest</h2>
          <p className="mt-1 text-xs text-neutral-500">Based on each lead’s most recent recorded follow-up.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {(["Interested", "Not Interested", "Neutral", "Unsure"] as const).map((level) => (
              <div key={level} className="rounded-xl bg-neutral-50 p-3">
                <p className="text-xs text-neutral-500">{level}</p>
                <p className="mt-1 text-xl font-extrabold text-neutral-900">{report.interest[level] ?? 0}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
