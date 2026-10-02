"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { CalendarClock } from "lucide-react";
import type { Project } from "@/lib/types";
import { StatusBadge } from "./ui/StatusBadge";
import { Avatar } from "./ui/Avatar";
import { useDirectory } from "@/lib/directory";
import { formatDate } from "@/lib/format";

export function ProjectCard({ project, index = 0 }: { project: Project; index?: number }) {
  const { employeeById } = useDirectory();
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04, duration: 0.35 }}>
      <Link
        href={`/master-admin/projects/${project.id}`}
        className="block rounded-2xl border border-black/6 bg-white p-4 shadow-sm transition-shadow hover:shadow-lg hover:shadow-black/5"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-neutral-900">{project.name}</p>
            <p className="text-xs text-neutral-500">{project.clientName}</p>
          </div>
          <StatusBadge status={project.status} />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.services.map((s) => (
            <span key={s} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-500">
              {s}
            </span>
          ))}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Progress</span>
            <span className="font-bold text-neutral-700">{project.progress}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-brand-red" style={{ width: `${project.progress}%` }} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex -space-x-2">
            {project.teamIds.slice(0, 3).map((id) => {
              const emp = employeeById(id);
              return emp ? <Avatar key={id} name={emp.name} color={emp.avatarColor} size="xs" className="ring-2 ring-white" /> : null;
            })}
          </div>
          <span className="flex items-center gap-1 text-xs text-neutral-400">
            <CalendarClock className="h-3.5 w-3.5" />
            {formatDate(project.deadline)}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
