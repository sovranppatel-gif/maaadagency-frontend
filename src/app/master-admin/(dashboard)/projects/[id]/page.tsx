"use client";

import { use, useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, CheckSquare, Paperclip, Square } from "lucide-react";
import { Card, CardHeader } from "@/components/master-admin/ui/Card";
import { Avatar } from "@/components/master-admin/ui/Avatar";
import { StatusBadge } from "@/components/master-admin/ui/StatusBadge";
import { getProject } from "@/lib/api/projects";
import { useDirectory } from "@/lib/directory";
import { formatDate, formatDateTime } from "@/lib/format";
import type { Project } from "@/lib/types";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const { employeeById } = useDirectory();

  useEffect(() => {
    getProject(id).then((data) => setProject(data ?? null));
  }, [id]);

  if (project === null) notFound();
  if (project === undefined) return <div className="py-20 text-center text-sm text-neutral-400">Loading…</div>;

  const doneCount = project.tasks.filter((t) => t.done).length;

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800">
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-neutral-900">{project.name}</h2>
          <p className="mt-1 text-sm text-neutral-500">Client: {project.clientName}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Overview" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-neutral-400">Progress</p>
                <p className="text-sm font-bold text-neutral-800">{project.progress}%</p>
              </div>
              <div className="flex items-start gap-1.5">
                <CalendarClock className="mt-0.5 h-3.5 w-3.5 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-400">Deadline</p>
                  <p className="text-sm font-bold text-neutral-800">{formatDate(project.deadline)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-neutral-400">Services</p>
                <p className="text-sm font-bold text-neutral-800">{project.services.join(", ")}</p>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full rounded-full bg-brand-red" style={{ width: `${project.progress}%` }} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Tasks" subtitle={`${doneCount} of ${project.tasks.length} complete`} />
            <ul className="space-y-2">
              {project.tasks.map((t) => {
                const assignee = employeeById(t.assigneeId);
                return (
                  <li key={t.id} className="flex items-center gap-3 rounded-xl border border-black/6 p-3">
                    {t.done ? <CheckSquare className="h-4 w-4 shrink-0 text-emerald-600" /> : <Square className="h-4 w-4 shrink-0 text-neutral-300" />}
                    <span className={t.done ? "flex-1 text-sm text-neutral-400 line-through" : "flex-1 text-sm text-neutral-800"}>{t.title}</span>
                    {assignee && <Avatar name={assignee.name} color={assignee.avatarColor} size="xs" />}
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Files" />
            {project.files.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-neutral-400">
                <Paperclip className="h-4 w-4" /> No files uploaded yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {project.files.map((f) => (
                  <li key={f.id} className="flex items-center gap-2 rounded-lg border border-black/6 px-3 py-2 text-sm">
                    <Paperclip className="h-4 w-4 text-neutral-400" />
                    {f.name}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Comments" />
            {project.comments.length === 0 ? (
              <p className="text-sm text-neutral-400">No comments yet.</p>
            ) : (
              <ul className="space-y-3">
                {project.comments.map((c) => (
                  <li key={c.id} className="rounded-xl bg-neutral-50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-neutral-800">{c.author}</p>
                      <p className="text-xs text-neutral-400">{formatDateTime(c.timestamp)}</p>
                    </div>
                    <p className="mt-1 text-sm text-neutral-600">{c.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Team" />
            <ul className="space-y-3">
              {project.teamIds.map((id) => {
                const emp = employeeById(id);
                if (!emp) return null;
                return (
                  <li key={id} className="flex items-center gap-3">
                    <Avatar name={emp.name} color={emp.avatarColor} />
                    <div>
                      <p className="text-sm font-bold text-neutral-800">{emp.name}</p>
                      <p className="text-xs text-neutral-500">{emp.role}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Timeline" />
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Created</span>
                <span className="font-semibold text-neutral-800">{formatDate(project.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Deadline</span>
                <span className="font-semibold text-neutral-800">{formatDate(project.deadline)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Status</span>
                <StatusBadge status={project.status} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
