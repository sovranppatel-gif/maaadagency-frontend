import { cn } from "@/lib/utils";
import type { LeadQuality } from "@/lib/types";

export const LEAD_QUALITIES: LeadQuality[] = ["HOT", "WARM", "COLD", "TRY", "WASTE"];

const styles: Record<LeadQuality | "UNCLASSIFIED", string> = {
  HOT: "bg-red-50 text-red-700 ring-red-600/20",
  WARM: "bg-amber-50 text-amber-700 ring-amber-600/20",
  COLD: "bg-sky-50 text-sky-700 ring-sky-600/20",
  TRY: "bg-violet-50 text-violet-700 ring-violet-600/20",
  WASTE: "bg-neutral-100 text-neutral-600 ring-neutral-500/20",
  UNCLASSIFIED: "bg-neutral-50 text-neutral-400 ring-neutral-300/40",
};

const dots: Record<LeadQuality | "UNCLASSIFIED", string> = {
  HOT: "bg-red-600",
  WARM: "bg-amber-500",
  COLD: "bg-sky-500",
  TRY: "bg-violet-500",
  WASTE: "bg-neutral-500",
  UNCLASSIFIED: "bg-neutral-300",
};

export function QualityBadge({ quality, className }: { quality?: LeadQuality | null; className?: string }) {
  const key = quality ?? "UNCLASSIFIED";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset",
        styles[key],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[key])} />
      {quality ?? "Unclassified"}
    </span>
  );
}
