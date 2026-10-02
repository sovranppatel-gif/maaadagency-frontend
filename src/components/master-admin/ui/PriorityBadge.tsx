import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/types";

const styles: Record<Priority, string> = {
  LOW: "bg-neutral-100 text-neutral-500",
  MEDIUM: "bg-blue-50 text-blue-600",
  HIGH: "bg-orange-50 text-orange-600",
  URGENT: "bg-red-50 text-brand-red",
};

const dots: Record<Priority, string> = {
  LOW: "bg-neutral-400",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-brand-red",
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
        styles[priority],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[priority], priority === "URGENT" && "animate-pulse")} />
      {priority}
    </span>
  );
}
