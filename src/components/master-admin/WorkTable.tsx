"use client";

import Link from "next/link";
import { Eye, UserPlus, CheckCircle2 } from "lucide-react";
import type { Work } from "@/lib/types";
import { Avatar } from "./ui/Avatar";
import { StatusBadge } from "./ui/StatusBadge";
import { PriorityBadge } from "./ui/PriorityBadge";
import { RowMenu } from "./ui/RowMenu";
import { useDirectory } from "@/lib/directory";
import { formatDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-100">
        <div
          className={cn("h-full rounded-full", value === 100 ? "bg-emerald-500" : "bg-brand-red")}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-neutral-500">{value}%</span>
    </div>
  );
}

export function WorkTable({
  works,
  onAssign,
  onComplete,
}: {
  works: Work[];
  onAssign?: (work: Work) => void;
  onComplete?: (work: Work) => void;
}) {
  const { employeeById } = useDirectory();
  return (
    <div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/8 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
              <th className="whitespace-nowrap px-3 py-3">Work ID</th>
              <th className="whitespace-nowrap px-3 py-3">Client / Requirement</th>
              <th className="whitespace-nowrap px-3 py-3">Employee</th>
              <th className="whitespace-nowrap px-3 py-3">Priority</th>
              <th className="whitespace-nowrap px-3 py-3">Deadline</th>
              <th className="whitespace-nowrap px-3 py-3">Progress</th>
              <th className="whitespace-nowrap px-3 py-3">Status</th>
              <th className="whitespace-nowrap px-3 py-3">Last Update</th>
              <th className="whitespace-nowrap px-3 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {works.map((work) => {
              const employee = employeeById(work.employeeId);
              return (
                <tr key={work.id} className="border-b border-black/5 transition-colors hover:bg-neutral-50">
                  <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-neutral-400">{work.id}</td>
                  <td className="px-3 py-3">
                    <p className="max-w-[220px] truncate font-bold text-neutral-800">{work.title}</p>
                    <p className="text-xs text-neutral-400">{work.clientName}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {employee ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={employee.name} size="xs" color={employee.avatarColor} />
                        <span className="text-neutral-700">{employee.name.split(" ")[0]}</span>
                      </div>
                    ) : (
                      <span className="text-neutral-400">Unassigned</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <PriorityBadge priority={work.priority} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-neutral-600">{formatDate(work.deadline)}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <ProgressBar value={work.progress} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <StatusBadge status={work.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-neutral-400">{timeAgo(work.updatedAt)}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/master-admin/work/${work.id}`}
                        aria-label="View work"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <RowMenu
                        actions={[
                          { label: employee ? "Reassign" : "Assign Employee", icon: UserPlus, onClick: () => onAssign?.(work) },
                          ...(work.status !== "COMPLETED"
                            ? [{ label: "Mark Completed", icon: CheckCircle2, onClick: () => onComplete?.(work) }]
                            : []),
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {works.map((work) => {
          const employee = employeeById(work.employeeId);
          return (
            <div key={work.id} className="rounded-xl border border-black/6 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-neutral-800">{work.title}</p>
                  <p className="text-xs text-neutral-400">{work.clientName}</p>
                </div>
                <StatusBadge status={work.status} />
              </div>
              <div className="mt-3">
                <ProgressBar value={work.progress} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={work.priority} />
                  <span className="text-xs text-neutral-400">{formatDate(work.deadline)}</span>
                </div>
                <Link
                  href={`/master-admin/work/${work.id}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
                >
                  <Eye className="h-4 w-4" />
                </Link>
              </div>
              {employee && <p className="mt-2 text-xs text-neutral-400">Assigned to {employee.name}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
