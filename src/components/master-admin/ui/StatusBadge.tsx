import { cn } from "@/lib/utils";
import type { Availability, LeadStatus, ProjectStatus, WorkStatus } from "@/lib/types";

type AnyStatus = LeadStatus | WorkStatus | ProjectStatus | Availability | string;

const styles: Record<string, string> = {
  // Lead statuses
  New: "bg-blue-50 text-blue-700 ring-blue-600/15",
  Assigned: "bg-violet-50 text-violet-700 ring-violet-600/15",
  "In Progress": "bg-amber-50 text-amber-700 ring-amber-600/15",
  Submitted: "bg-cyan-50 text-cyan-700 ring-cyan-600/15",
  "Changes Requested": "bg-orange-50 text-orange-700 ring-orange-600/15",
  Approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  Completed: "bg-neutral-100 text-neutral-600 ring-neutral-500/15",

  // Work statuses
  UNASSIGNED: "bg-neutral-100 text-neutral-600 ring-neutral-500/15",
  ASSIGNED: "bg-violet-50 text-violet-700 ring-violet-600/15",
  IN_PROGRESS: "bg-amber-50 text-amber-700 ring-amber-600/15",
  SUBMITTED: "bg-cyan-50 text-cyan-700 ring-cyan-600/15",
  CHANGES_REQUESTED: "bg-orange-50 text-orange-700 ring-orange-600/15",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  COMPLETED: "bg-neutral-800 text-white ring-neutral-800/15",

  // Project statuses
  Planning: "bg-neutral-100 text-neutral-600 ring-neutral-500/15",
  Active: "bg-blue-50 text-blue-700 ring-blue-600/15",
  Review: "bg-amber-50 text-amber-700 ring-amber-600/15",
  "On Hold": "bg-orange-50 text-orange-700 ring-orange-600/15",

  // Availability
  Available: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  Busy: "bg-amber-50 text-amber-700 ring-amber-600/15",
  "On Leave": "bg-neutral-100 text-neutral-600 ring-neutral-500/15",
};

const labelOverrides: Record<string, string> = {
  UNASSIGNED: "Unassigned",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  SUBMITTED: "Submitted",
  CHANGES_REQUESTED: "Changes Requested",
  APPROVED: "Approved",
  COMPLETED: "Completed",
};

export function StatusBadge({ status, className }: { status: AnyStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset",
        styles[status] ?? "bg-neutral-100 text-neutral-600 ring-neutral-500/15",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labelOverrides[status] ?? status}
    </span>
  );
}
