"use client";

import { use, useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserPlus,
  ThumbsUp,
  MessageSquareWarning,
  CalendarClock,
  Paperclip,
  FileText,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader } from "@/components/master-admin/ui/Card";
import { StatusBadge } from "@/components/master-admin/ui/StatusBadge";
import { PriorityBadge } from "@/components/master-admin/ui/PriorityBadge";
import { Avatar } from "@/components/master-admin/ui/Avatar";
import { ActivityTimeline } from "@/components/master-admin/ActivityTimeline";
import { AssignmentModal } from "@/components/master-admin/AssignmentModal";
import { RevisionModal } from "@/components/master-admin/RevisionModal";
import { useToast } from "@/components/master-admin/ui/ToastProvider";
import { getWork, assignWork, approveWork, requestRevision, markCompleted } from "@/lib/api/works";
import { useDirectory } from "@/lib/directory";
import { formatDate, formatDateTime } from "@/lib/format";
import type { Priority, Work } from "@/lib/types";

export default function WorkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [work, setWork] = useState<Work | null | undefined>(undefined);
  const [assignOpen, setAssignOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const { push } = useToast();
  const { employeeById } = useDirectory();

  useEffect(() => {
    getWork(id).then((data) => setWork(data ?? null));
  }, [id]);

  if (work === null) notFound();
  if (work === undefined) {
    return <div className="py-20 text-center text-sm text-neutral-400">Loading work…</div>;
  }

  const employee = employeeById(work.employeeId);

  async function handleAssign(employeeId: string) {
    const updated = await assignWork(work!.id, employeeId);
    if (updated) {
      setWork(updated);
      push({ kind: "success", title: "Work assigned", description: `Assigned to ${employeeById(employeeId)?.name}.` });
    }
  }

  async function handleApprove() {
    const updated = await approveWork(work!.id);
    if (updated) {
      setWork(updated);
      push({ kind: "success", title: "Work approved", description: "The employee will be notified." });
    }
  }

  async function handleRevision(notes: string, priority: Priority, deadline?: string) {
    const updated = await requestRevision(work!.id, notes, priority, deadline);
    if (updated) {
      setWork(updated);
      push({ kind: "info", title: "Revision requested", description: "The employee will see this in their dashboard." });
    }
  }

  async function handleMarkCompleted() {
    const updated = await markCompleted(work!.id);
    if (updated) {
      setWork(updated);
      push({ kind: "success", title: "Work completed" });
    }
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Work Management
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold text-neutral-900">{work.title}</h2>
            <span className="font-mono text-xs text-neutral-400">{work.id}</span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Client: <span className="font-semibold text-neutral-700">{work.clientName}</span>
          </p>
          <div className="mt-2 flex items-center gap-2">
            <PriorityBadge priority={work.priority} />
            <StatusBadge status={work.status} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAssignOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-sm font-bold text-neutral-700 hover:bg-neutral-50"
          >
            <UserPlus className="h-4 w-4" />
            {employee ? "Reassign" : "Assign"}
          </button>
          {work.status === "SUBMITTED" && (
            <>
              <button
                type="button"
                onClick={() => setRevisionOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700 hover:bg-orange-100"
              >
                <MessageSquareWarning className="h-4 w-4" />
                Request Changes
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
              >
                <ThumbsUp className="h-4 w-4" />
                Approve Work
              </button>
            </>
          )}
          {work.status === "APPROVED" && (
            <button
              type="button"
              onClick={handleMarkCompleted}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-800"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark Completed
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Client Requirement" />
            <p className="text-sm leading-relaxed text-neutral-700">{work.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-neutral-400">Service</p>
                <p className="text-sm font-semibold text-neutral-800">{work.service}</p>
              </div>
              <div className="flex items-start gap-1.5">
                <CalendarClock className="mt-0.5 h-3.5 w-3.5 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-400">Deadline</p>
                  <p className="text-sm font-semibold text-neutral-800">{formatDate(work.deadline)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-neutral-400">Progress</p>
                <p className="text-sm font-semibold text-neutral-800">{work.progress}%</p>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100">
              <div
                className={work.progress === 100 ? "h-full rounded-full bg-emerald-500" : "h-full rounded-full bg-brand-red"}
                style={{ width: `${work.progress}%` }}
              />
            </div>
          </Card>

          {work.attachments.length > 0 && (
            <Card>
              <CardHeader title="Attachments" />
              <ul className="space-y-2">
                {work.attachments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-lg border border-black/6 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-neutral-400" />
                      {a.name}
                    </span>
                    <span className="text-xs text-neutral-400">{a.size}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {work.employeeReport && (
            <Card>
              <CardHeader title="Employee Report" subtitle={`Submitted ${formatDateTime(work.employeeReport.submittedAt)}`} />
              <p className="text-sm leading-relaxed text-neutral-700">{work.employeeReport.summary}</p>
              {work.employeeReport.remarks && (
                <p className="mt-3 rounded-lg bg-neutral-50 p-3 text-sm italic text-neutral-600">
                  &ldquo;{work.employeeReport.remarks}&rdquo;
                </p>
              )}
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-neutral-500">
                <Clock className="h-3.5 w-3.5" />
                Time Spent: {work.employeeReport.timeSpent}
              </div>

              {work.employeeReport.files.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-400">Files</p>
                  <ul className="space-y-2">
                    {work.employeeReport.files.map((f) => (
                      <li key={f.id} className="flex items-center justify-between rounded-lg border border-black/6 px-3 py-2 text-sm">
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-neutral-400" />
                          {f.name}
                        </span>
                        <span className="text-xs text-neutral-400">{f.size}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {work.employeeReport.screenshots.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-400">Screenshots</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {work.employeeReport.screenshots.map((s) => (
                      <div key={s.id} className="flex aspect-video items-center justify-center rounded-lg bg-neutral-100 text-[11px] text-neutral-400">
                        {s.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {work.revisionHistory.length > 0 && (
            <Card>
              <CardHeader title="Revision History" />
              <ul className="space-y-3">
                {work.revisionHistory.map((r) => (
                  <li key={r.id} className="rounded-xl border border-orange-100 bg-orange-50/50 p-3">
                    <div className="flex items-center justify-between">
                      <PriorityBadge priority={r.priority} />
                      <span className="text-xs text-neutral-400">{formatDateTime(r.requestedAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-neutral-700">{r.notes}</p>
                    {r.deadline && <p className="mt-1 text-xs text-neutral-500">New deadline: {formatDate(r.deadline)}</p>}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Employee Assignment" />
            {employee ? (
              <div className="flex items-center gap-3">
                <Avatar name={employee.name} color={employee.avatarColor} />
                <div>
                  <p className="text-sm font-bold text-neutral-800">{employee.name}</p>
                  <p className="text-xs text-neutral-500">{employee.role}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-400">Not yet assigned.</p>
            )}
            <button
              type="button"
              onClick={() => setAssignOpen(true)}
              className="mt-4 w-full rounded-xl border border-dashed border-black/15 py-2.5 text-sm font-semibold text-neutral-500 hover:border-brand-red/40 hover:text-brand-red"
            >
              {employee ? "Reassign Employee" : "Assign Employee"}
            </button>
          </Card>

          <Card>
            <CardHeader title="Activity Timeline" />
            <ActivityTimeline items={work.activity} />
          </Card>
        </div>
      </div>

      <AssignmentModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title={employee ? "Reassign Work" : "Assign Work"}
        description={`Assign "${work.title}" to an employee.`}
        onAssign={handleAssign}
      />
      <RevisionModal open={revisionOpen} onClose={() => setRevisionOpen(false)} onSubmit={handleRevision} />
    </div>
  );
}
