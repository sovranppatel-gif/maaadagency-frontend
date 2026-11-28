import { cn } from "@/lib/utils";
import type { VisitStatus } from "@/lib/types";
import { visitStatusLabel } from "@/lib/api/visits";

const styles: Record<VisitStatus, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700 ring-blue-600/20",
  RESCHEDULED: "bg-amber-50 text-amber-800 ring-amber-600/20",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  CANCELLED: "bg-neutral-100 text-neutral-600 ring-neutral-500/20",
};

const dots: Record<VisitStatus, string> = {
  SCHEDULED: "bg-blue-600",
  RESCHEDULED: "bg-amber-500",
  COMPLETED: "bg-emerald-600",
  CANCELLED: "bg-neutral-500",
};

export function VisitStatusBadge({ status, className }: { status: VisitStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset",
        styles[status] ?? "bg-neutral-100 text-neutral-600 ring-neutral-500/20",
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[status] ?? "bg-neutral-400")} />
      {visitStatusLabel(status)}
    </span>
  );
}
