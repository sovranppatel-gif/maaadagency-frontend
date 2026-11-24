"use client";

import { FormEvent, use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, CalendarDays, FileText, Loader2, Play, Save, Send } from "lucide-react";
import { getWork, submitWork, updateWorkProgress } from "@/lib/api/works";
import { formatDate, formatDateTime } from "@/lib/format";
import type { Work } from "@/lib/types";

export default function EmployeeTaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [result, setResult] = useState<{ id: string; work: Work | null } | null>(null);
  const [requestError, setRequestError] = useState<{ id: string; message: string } | null>(null);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [progressDraft, setProgressDraft] = useState<{
    workId: string;
    progress: number;
    progressNote: string;
    blocked: boolean;
    blockedReason: string;
  } | null>(null);
  const [reportSummary, setReportSummary] = useState("");
  const [reportRemarks, setReportRemarks] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [savingAction, setSavingAction] = useState<"progress" | "start" | "submit" | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState("");

  useEffect(() => {
    let active = true;
    getWork(id)
      .then((result) => {
        if (active) setResult({ id, work: result ?? null });
      })
      .catch((reason: unknown) => {
        if (active) setRequestError({ id, message: reason instanceof Error ? reason.message : "Could not load this task." });
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    const updateTime = () => setCurrentTime(Date.now());
    updateTime();
    const timer = window.setInterval(updateTime, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const work = result?.id === id ? result.work : undefined;
  const error = requestError?.id === id ? requestError.message : "";
  if (work === null) notFound();
  if (work === undefined) {
    return error
      ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>
      : <p className="py-16 text-center text-sm text-neutral-500">Loading task…</p>;
  }

  const workId = work.id;
  const canUpdateWork = ["ASSIGNED", "IN_PROGRESS", "CHANGES_REQUESTED"].includes(work.status);
  const draft = progressDraft?.workId === work.id
    ? progressDraft
    : {
        workId: work.id,
        progress: work.progress,
        progressNote: work.progressNote ?? "",
        blocked: Boolean(work.blockedReason),
        blockedReason: work.blockedReason ?? "",
      };
  const isOverdue = currentTime !== null && new Date(work.deadline).getTime() < currentTime && !["APPROVED", "COMPLETED"].includes(work.status);

  function updateDraft(patch: Partial<typeof draft>) {
    setProgressDraft({ ...draft, ...patch });
  }

  async function saveProgress() {
    if (draft.blocked && !draft.blockedReason.trim()) {
      setActionError("Add a reason before marking this task as blocked.");
      return;
    }
    setSavingAction("progress");
    setActionError("");
    setActionNotice("");
    try {
      const updated = await updateWorkProgress(workId, {
        progress: draft.progress,
        progressNote: draft.progressNote,
        blockedReason: draft.blocked ? draft.blockedReason.trim() : "",
      });
      if (!updated) throw new Error("Task not found.");
      setResult({ id, work: updated });
      setProgressDraft(null);
      setActionNotice("Progress saved.");
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Could not save progress.");
    } finally {
      setSavingAction(null);
    }
  }

  async function startWork() {
    setSavingAction("start");
    setActionError("");
    setActionNotice("");
    try {
      const updated = await updateWorkProgress(workId, {
        start: true,
        progress: draft.progress,
        progressNote: draft.progressNote,
      });
      if (!updated) throw new Error("Task not found.");
      setResult({ id, work: updated });
      setProgressDraft(null);
      setActionNotice("Work started.");
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Could not start this task.");
    } finally {
      setSavingAction(null);
    }
  }

  async function submitForReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingAction("submit");
    setActionError("");
    setActionNotice("");
    try {
      const updated = await submitWork(workId, reportSummary.trim(), reportRemarks.trim(), timeSpent.trim());
      if (!updated) throw new Error("Task not found.");
      setResult({ id, work: updated });
      setReportSummary("");
      setReportRemarks("");
      setTimeSpent("");
      setActionNotice("Report submitted. The task is now pending Admin review.");
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Could not submit the work report.");
    } finally {
      setSavingAction(null);
    }
  }

  const canStart = work.status === "ASSIGNED" || work.status === "CHANGES_REQUESTED";

  return (
    <div className="space-y-5">
      <Link href="/employee/tasks" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-900">
        <ArrowLeft className="h-4 w-4" /> Back to My Tasks
      </Link>

      <section className="rounded-2xl border border-black/6 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">{work.code ?? "Assigned task"}</p>
            <h1 className="mt-1 text-xl font-extrabold text-neutral-900 sm:text-2xl">{work.title}</h1>
            <p className="mt-2 text-sm text-neutral-500">{work.clientName}{work.project?.name ? ` · ${work.project.name}` : ""}</p>
          </div>
          <span className="w-fit rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-700">{work.status.replaceAll("_", " ")}</span>
        </div>

        {isOverdue && <p className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-800"><AlertTriangle className="h-4 w-4" /> This task is overdue.</p>}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-neutral-50 p-3">
            <p className="text-[11px] font-semibold text-neutral-400">Priority</p>
            <p className="mt-1 text-sm font-bold text-neutral-800">{work.priority}</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3">
            <p className="text-[11px] font-semibold text-neutral-400">Deadline</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-neutral-800"><CalendarDays className="h-3.5 w-3.5" />{formatDate(work.deadline)}</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3">
            <p className="text-[11px] font-semibold text-neutral-400">Service</p>
            <p className="mt-1 text-sm font-bold text-neutral-800">{work.service}</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3">
            <p className="text-[11px] font-semibold text-neutral-400">Progress</p>
            <p className="mt-1 text-sm font-bold text-neutral-800">{work.progress}%</p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-bold text-neutral-900">Work description</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-600">{work.description || "No description provided."}</p>
        </div>
      </section>

      {actionError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{actionError}</p>}
      {actionNotice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{actionNotice}</p>}

      {canUpdateWork && (
        <section className="space-y-5 rounded-2xl border border-black/6 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-neutral-900">Work progress</h2>
              <p className="mt-1 text-sm text-neutral-500">Progress updates are recorded in the task activity history.</p>
            </div>
            {canStart && (
              <button type="button" onClick={startWork} disabled={savingAction !== null} className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-60">
                {savingAction === "start" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {work.status === "CHANGES_REQUESTED" ? "Resume work" : "Start work"}
              </button>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="work-progress" className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span>Progress</span><span>{draft.progress}%</span>
            </label>
            <input id="work-progress" type="range" min={0} max={100} step={5} value={draft.progress} onChange={(event) => updateDraft({ progress: Number(event.target.value) })} className="w-full accent-red-700" />
          </div>
          <label className="block text-xs font-semibold text-neutral-600">
            Progress note
            <textarea maxLength={2000} rows={2} value={draft.progressNote} onChange={(event) => updateDraft({ progressNote: event.target.value })} placeholder="What changed since the last update?" className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm font-normal text-neutral-800" />
          </label>
          <div className="space-y-3 rounded-xl bg-neutral-50 p-3.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
              <input type="checkbox" checked={draft.blocked} onChange={(event) => updateDraft({ blocked: event.target.checked, blockedReason: event.target.checked ? draft.blockedReason : "" })} className="h-4 w-4 accent-red-700" />
              This task is blocked
            </label>
            {draft.blocked && (
              <label className="block text-xs font-semibold text-neutral-600">
                Blocked reason
                <textarea required maxLength={1000} rows={2} value={draft.blockedReason} onChange={(event) => updateDraft({ blockedReason: event.target.value })} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-normal text-neutral-800" />
              </label>
            )}
          </div>
          {work.blockedReason && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>Blocked:</strong> {work.blockedReason}</p>}
          {work.progressNote && <p className="text-xs text-neutral-500">Latest note: {work.progressNote}</p>}
          <button type="button" onClick={saveProgress} disabled={savingAction !== null} className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60">
            {savingAction === "progress" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save progress
          </button>
        </section>
      )}

      {work.employeeReport && (
        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-6">
          <h2 className="text-sm font-bold text-blue-950">{work.status === "SUBMITTED" ? "Pending Admin review" : "Latest submission"}</h2>
          <p className="mt-1 text-xs text-blue-800">Submitted {formatDateTime(work.employeeReport.submittedAt)} · Recorded by the server</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-blue-950">{work.employeeReport.summary}</p>
          {work.employeeReport.remarks && <p className="mt-2 whitespace-pre-wrap text-sm text-blue-900">{work.employeeReport.remarks}</p>}
          {work.status === "APPROVED" && <p className="mt-3 text-xs font-semibold text-blue-900">Approved by Admin. Admin will mark the work complete.</p>}
        </section>
      )}

      {canUpdateWork && (
        <form onSubmit={submitForReview} className="space-y-4 rounded-2xl border border-black/6 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-base font-extrabold text-neutral-900">Submit work for review</h2>
            <p className="mt-1 text-sm text-neutral-500">Submission records the current server time and sends the report to Admin review.</p>
          </div>
          <label className="block text-xs font-semibold text-neutral-600">
            Work summary
            <textarea required minLength={1} maxLength={5000} rows={4} value={reportSummary} onChange={(event) => setReportSummary(event.target.value)} className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm font-normal text-neutral-800" />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-neutral-600">
              Remarks
              <textarea maxLength={3000} rows={2} value={reportRemarks} onChange={(event) => setReportRemarks(event.target.value)} className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm font-normal text-neutral-800" />
            </label>
            <label className="text-xs font-semibold text-neutral-600">
              Time spent (employee-reported)
              <input maxLength={100} value={timeSpent} onChange={(event) => setTimeSpent(event.target.value)} placeholder="e.g. 3 hours" className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm font-normal text-neutral-800" />
            </label>
          </div>
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            File attachments are unavailable in this flow: the current upload storage is local/public, and Vercel uses temporary storage. The report can be submitted without files; no upload is presented as durable or private.
          </p>
          <button type="submit" disabled={savingAction !== null || !reportSummary.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60">
            {savingAction === "submit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit for Admin review
          </button>
        </form>
      )}

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/6 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-neutral-400" />
            <h2 className="text-sm font-bold text-neutral-900">Attachments</h2>
          </div>
          {!work.attachments?.length ? (
            <p className="mt-4 text-sm text-neutral-500">No attachments on this task.</p>
          ) : (
            <ul className="mt-3 divide-y divide-black/5">
              {work.attachments.map((file) => (
                <li key={file.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0 truncate text-sm font-semibold text-neutral-700">{file.name}</span>
                  <span className="text-xs text-neutral-400">{file.type.toUpperCase()} · {file.size} · {file.uploadedBy} · {formatDate(file.uploadedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-black/6 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900">Review and revision history</h2>
          {!work.revisionHistory?.length ? (
            <p className="mt-4 text-sm text-neutral-500">No revision requests yet.</p>
          ) : (
            <ol className="mt-3 space-y-3">
              {work.revisionHistory.map((revision) => (
                <li key={revision.id} className="rounded-xl bg-neutral-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-neutral-700">{revision.priority} priority</span>
                    <span className="text-xs text-neutral-400">{formatDateTime(revision.requestedAt)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-600">{revision.notes}</p>
                  {revision.deadline && <p className="mt-2 text-xs text-neutral-500">Requested deadline: {formatDate(revision.deadline)}</p>}
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {work.activity?.length > 0 && (
        <section className="rounded-2xl border border-black/6 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900">Task activity</h2>
          <ol className="mt-3 divide-y divide-black/5">
            {[...work.activity].reverse().slice(0, 20).map((activity) => (
              <li key={activity.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-neutral-800">{activity.label}</p>
                  <p className="text-xs text-neutral-400">{formatDateTime(activity.timestamp)}</p>
                </div>
                {(activity.description || activity.actor) && (
                  <p className="mt-1 text-xs text-neutral-500">
                    {activity.description}{activity.description && activity.actor ? " · " : ""}{activity.actor}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
        Admin controls approval, change requests, and final completion. Employees cannot approve or complete their own work.
      </p>
    </div>
  );
}
