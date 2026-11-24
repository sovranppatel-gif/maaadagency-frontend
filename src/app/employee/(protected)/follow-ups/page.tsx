"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Clock3, Loader2 } from "lucide-react";
import { EmployeePagination } from "@/components/employee/EmployeePagination";
import { getFollowUpsPage, type FollowUpBucket, type LeadFollowUp } from "@/lib/api/followUps";
import { formatDateTime } from "@/lib/format";

const pageSize = 20;

const buckets: Array<{ value: FollowUpBucket; label: string }> = [
  { value: "All", label: "All scheduled" },
  { value: "upcoming", label: "Upcoming" },
  { value: "today", label: "Due today" },
  { value: "overdue", label: "Overdue" },
];

function FollowUpCard({ followUp, currentTime }: { followUp: LeadFollowUp; currentTime: number | null }) {
  const isOverdue = Boolean(followUp.nextFollowUpAt && currentTime !== null && new Date(followUp.nextFollowUpAt).getTime() < currentTime);
  return (
    <article className="rounded-2xl border border-black/6 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href={`/employee/leads/${followUp.lead?.code ?? followUp.leadId}`} className="text-sm font-extrabold text-neutral-900 hover:text-red-700">
            {followUp.lead?.clientName ?? "Assigned lead"}
          </Link>
          <p className="mt-1 truncate text-xs text-neutral-500">{followUp.lead?.code} · {followUp.lead?.requirement}</p>
        </div>
        <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${isOverdue ? "bg-red-100 text-red-800" : "bg-blue-50 text-blue-800"}`}>
          {isOverdue ? <Clock3 className="h-3 w-3" /> : <CalendarClock className="h-3 w-3" />}
          {isOverdue ? "Overdue" : "Scheduled"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-500">
        <span className="font-semibold text-neutral-700">Attempt {followUp.attemptNumber}</span>
        <span>{followUp.communicationType}</span>
        {followUp.nextFollowUpAt && <span className="font-semibold text-neutral-700">Due {formatDateTime(followUp.nextFollowUpAt)}</span>}
      </div>
      {followUp.discussionNotes && <p className="mt-3 line-clamp-2 text-sm text-neutral-600">{followUp.discussionNotes}</p>}
      {followUp.lead?.followUpReviewRequired && <p className="mt-3 text-xs font-semibold text-amber-800">Awaiting Admin review; further attempts are paused.</p>}
    </article>
  );
}

export default function EmployeeFollowUpsPage() {
  const [followUps, setFollowUps] = useState<LeadFollowUp[]>([]);
  const [bucket, setBucket] = useState<FollowUpBucket>("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  useEffect(() => {
    const updateTime = () => setCurrentTime(Date.now());
    updateTime();
    const timer = window.setInterval(updateTime, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    getFollowUpsPage({ page, limit: pageSize, bucket })
      .then(({ followUps: result, meta }) => {
        if (!active) return;
        setFollowUps(result);
        setTotalPages(meta.totalPages);
        setError("");
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load follow-ups.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, bucket]);

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-xl font-extrabold text-neutral-900">My Follow-ups</h1>
        <p className="mt-1 text-sm text-neutral-500">The latest scheduled follow-up for each lead currently assigned to you.</p>
      </section>

      <p className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-900">
        Due notifications are created when this list loads while a follow-up is due. There is no server-side background reminder scheduler.
      </p>

      <section className="flex flex-wrap gap-2" aria-label="Follow-up schedule filters">
        {buckets.map(({ value, label }) => (
          <button key={value} type="button" onClick={() => { setBucket(value); setPage(1); setLoading(true); }} aria-pressed={bucket === value} className={`rounded-xl px-3.5 py-2 text-xs font-bold ${bucket === value ? "bg-neutral-950 text-white" : "border border-black/10 bg-white text-neutral-600 hover:bg-neutral-50"}`}>
            {label}
          </button>
        ))}
      </section>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading follow-ups…</div>
      ) : followUps.length === 0 ? (
        <p className="rounded-2xl border border-black/6 bg-white px-4 py-12 text-center text-sm text-neutral-500">No scheduled follow-ups in this view.</p>
      ) : (
        <section className="space-y-3">
          {followUps.map((followUp) => <FollowUpCard key={followUp.id} followUp={followUp} currentTime={currentTime} />)}
        </section>
      )}

      {!loading && totalPages > 1 && <div className="overflow-hidden rounded-2xl border border-black/6 bg-white"><EmployeePagination page={page} totalPages={totalPages} onChange={(nextPage) => { setLoading(true); setPage(nextPage); }} /></div>}
    </div>
  );
}
