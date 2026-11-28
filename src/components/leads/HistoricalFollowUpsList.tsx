"use client";

import { callResponseLabel } from "@/lib/api/followUps";
import { formatDateTime } from "@/lib/format";
import type { HistoricalFollowUp } from "@/lib/types";

/** Renders read-only imported call attempts from legacy Excel workbooks without affecting live 1–4 counters. */
export function HistoricalFollowUpsList({ items }: { items?: HistoricalFollowUp[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2 border-t border-black/6 pt-4">
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
        Historical Imported Calls (Excel · Read-only)
      </p>
      <ol className="space-y-2">
        {items.map((entry, idx) => (
          <li key={`${entry.rawDateLabel ?? idx}-${idx}`} className="rounded-xl border border-black/5 bg-neutral-50/70 p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-neutral-800">
                  {entry.callDate ? formatDateTime(entry.callDate) : entry.rawDateLabel || "Imported call"}
                </span>
                {entry.callResponse && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                    {callResponseLabel(entry.callResponse)}
                  </span>
                )}
              </div>
              {entry.sourceSheet && (
                <span className="text-[11px] text-neutral-400">
                  {entry.sourceSheet}
                  {entry.sourceRow ? ` #${entry.sourceRow}` : ""}
                </span>
              )}
            </div>
            {entry.rawResponse && <p className="mt-1 text-neutral-700">Excel response: {entry.rawResponse}</p>}
            {entry.note && entry.note !== entry.rawResponse && <p className="mt-0.5 text-neutral-500">{entry.note}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
