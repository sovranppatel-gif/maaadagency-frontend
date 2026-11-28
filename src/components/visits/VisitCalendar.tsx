"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toIstDateKey, visitStatusLabel } from "@/lib/api/visits";
import { formatTime } from "@/lib/format";
import type { LeadVisit } from "@/lib/types";
import { VisitStatusBadge } from "./VisitStatusBadge";

type CalendarMode = "month" | "week" | "day";

function addDays(dateKey: string, days: number): string {
  const base = new Date(`${dateKey}T12:00:00+05:30`);
  base.setUTCDate(base.getUTCDate() + days);
  return toIstDateKey(base);
}

function addMonths(dateKey: string, months: number): string {
  const [y, m] = dateKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + months, 1, 12, 0, 0));
  return toIstDateKey(d);
}

function monthDays(anchorKey: string): string[] {
  const [y, m] = anchorKey.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1, 12, 0, 0));
  const startOffset = first.getUTCDay();
  const gridStart = new Date(first);
  gridStart.setUTCDate(1 - startOffset);
  return Array.from({ length: 42 }, (_, idx) => {
    const d = new Date(gridStart);
    d.setUTCDate(gridStart.getUTCDate() + idx);
    return toIstDateKey(d);
  });
}

function weekDays(anchorKey: string): string[] {
  const d = new Date(`${anchorKey}T12:00:00+05:30`);
  const day = d.getUTCDay();
  const start = addDays(anchorKey, -day);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function headingLabel(mode: CalendarMode, anchorKey: string) {
  const d = new Date(`${anchorKey}T12:00:00+05:30`);
  if (mode === "day") {
    return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  }
  if (mode === "week") {
    const days = weekDays(anchorKey);
    return `${days[0]} to ${days[6]} (IST)`;
  }
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
}

export function VisitCalendar({
  visits,
  onSelectVisit,
}: {
  visits: LeadVisit[];
  onSelectVisit: (visit: LeadVisit) => void;
}) {
  const [mode, setMode] = useState<CalendarMode>("month");
  const [selectedDate, setSelectedDate] = useState(() => toIstDateKey(new Date()));
  const todayKey = toIstDateKey(new Date());

  const byDate = useMemo(() => {
    const map = new Map<string, LeadVisit[]>();
    for (const visit of visits) {
      const key = toIstDateKey(visit.scheduledStart);
      const list = map.get(key) ?? [];
      list.push(visit);
      map.set(key, list);
    }
    return map;
  }, [visits]);

  function step(dir: -1 | 1) {
    if (mode === "day") setSelectedDate((d) => addDays(d, dir));
    else if (mode === "week") setSelectedDate((d) => addDays(d, dir * 7));
    else setSelectedDate((d) => addMonths(d, dir));
  }

  const selectedVisits = byDate.get(selectedDate) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => step(-1)} aria-label="Previous period" className="rounded-lg border border-black/10 p-2 hover:bg-neutral-50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setSelectedDate(todayKey)} className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50">
            Today
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Next period" className="rounded-lg border border-black/10 p-2 hover:bg-neutral-50">
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="ml-2 text-sm font-bold text-neutral-900">{headingLabel(mode, selectedDate)}</span>
        </div>

        <div className="inline-flex rounded-xl border border-black/10 bg-neutral-50 p-1">
          {(["day", "week", "month"] as CalendarMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-lg px-3 py-1 text-xs font-bold capitalize ${mode === m ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-800"}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {mode === "day" && (
        <div className="space-y-2 rounded-2xl border border-black/6 bg-neutral-50/50 p-4">
          {selectedVisits.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">No visits on {selectedDate}.</p>
          ) : (
            selectedVisits.map((visit) => (
              <button
                key={visit.id}
                type="button"
                onClick={() => onSelectVisit(visit)}
                className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-black/6 bg-white p-3.5 text-left hover:border-brand-red/30"
              >
                <div>
                  <p className="text-sm font-bold text-neutral-900">{formatTime(visit.scheduledStart)} · {visit.title}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{visit.lead?.clientName ?? "Lead"} {visit.code ? `· ${visit.code}` : ""}</p>
                </div>
                <VisitStatusBadge status={visit.status} />
              </button>
            ))
          )}
        </div>
      )}

      {mode === "week" && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
          {weekDays(selectedDate).map((dayKey) => {
            const list = byDate.get(dayKey) ?? [];
            const isSelected = dayKey === selectedDate;
            return (
              <div
                key={dayKey}
                onClick={() => setSelectedDate(dayKey)}
                className={`min-h-[140px] cursor-pointer rounded-xl border p-2.5 ${isSelected ? "border-brand-red bg-red-50/20" : "border-black/8 bg-white"}`}
              >
                <p className={`text-xs font-bold ${dayKey === todayKey ? "text-brand-red" : "text-neutral-700"}`}>
                  {dayKey.slice(5)}
                </p>
                <div className="mt-2 space-y-1.5">
                  {list.map((visit) => (
                    <button
                      key={visit.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectVisit(visit);
                      }}
                      title={`${visit.title} (${visitStatusLabel(visit.status)})`}
                      className="block w-full truncate rounded-lg bg-neutral-100 px-2 py-1 text-left text-[11px] font-semibold text-neutral-800 hover:bg-red-50 hover:text-brand-red"
                    >
                      {formatTime(visit.scheduledStart)} {visit.lead?.clientName ?? visit.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mode === "month" && (
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase text-neutral-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {monthDays(selectedDate).map((dayKey) => {
              const list = byDate.get(dayKey) ?? [];
              const inMonth = dayKey.slice(0, 7) === selectedDate.slice(0, 7);
              const isSelected = dayKey === selectedDate;
              return (
                <div
                  key={dayKey}
                  onClick={() => setSelectedDate(dayKey)}
                  className={`min-h-[78px] cursor-pointer rounded-xl border p-1.5 transition-colors ${
                    isSelected ? "border-brand-red bg-red-50/30" : inMonth ? "border-black/8 bg-white hover:bg-neutral-50" : "border-black/4 bg-neutral-50/50 text-neutral-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold ${dayKey === todayKey ? "text-brand-red" : ""}`}>{Number(dayKey.slice(8))}</span>
                    {list.length > 0 && <span className="rounded-full bg-red-100 px-1.5 text-[10px] font-bold text-red-700">{list.length}</span>}
                  </div>
                  <div className="mt-1 space-y-1">
                    {list.slice(0, 2).map((visit) => (
                      <button
                        key={visit.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectVisit(visit);
                        }}
                        className="block w-full truncate rounded bg-neutral-100 px-1.5 py-0.5 text-left text-[10px] font-semibold text-neutral-700 hover:bg-red-50 hover:text-brand-red"
                      >
                        {visit.lead?.clientName ?? visit.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-black/6 bg-neutral-50 p-3.5">
            <p className="text-xs font-bold text-neutral-700">Visits on {selectedDate} (IST)</p>
            {selectedVisits.length === 0 ? (
              <p className="mt-2 text-xs text-neutral-400">No visits scheduled on this date.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {selectedVisits.map((visit) => (
                  <button
                    key={visit.id}
                    type="button"
                    onClick={() => onSelectVisit(visit)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-left text-xs shadow-xs hover:bg-neutral-50"
                  >
                    <span className="font-bold text-neutral-800">{formatTime(visit.scheduledStart)} · {visit.title} ({visit.lead?.clientName ?? "Lead"})</span>
                    <VisitStatusBadge status={visit.status} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
