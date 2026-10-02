"use client";

import { motion } from "motion/react";

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

export function BarChart({
  data,
  height = 180,
  color = "#C5161D",
}: {
  data: BarDatum[];
  height?: number;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {data.map((d, i) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(d.value / max) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="w-full rounded-t-md"
              style={{ backgroundColor: d.color || color, minHeight: d.value > 0 ? 4 : 0 }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
          <span className="text-center text-[10px] font-semibold leading-tight text-neutral-500">{d.label}</span>
          <span className="text-xs font-bold text-neutral-800">{d.value}</span>
        </div>
      ))}
    </div>
  );
}
