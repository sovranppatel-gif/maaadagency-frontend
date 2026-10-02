import { Check } from "lucide-react";
import type { ActivityItem } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <ol className="relative ml-3 border-l-2 border-neutral-100">
      {items.map((item, i) => (
        <li key={item.id} className="relative pb-6 pl-6 last:pb-0">
          <span
            className={
              i === items.length - 1
                ? "absolute -left-[9px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-red text-white ring-4 ring-white"
                : "absolute -left-[9px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-200 text-neutral-500 ring-4 ring-white"
            }
          >
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </span>
          <p className="text-sm font-bold text-neutral-800">{item.label}</p>
          {item.description && <p className="mt-0.5 text-xs text-neutral-500">{item.description}</p>}
          <p className="mt-1 text-[11px] font-medium text-neutral-400">
            {formatDateTime(item.timestamp)}
            {item.actor ? ` · ${item.actor}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}
