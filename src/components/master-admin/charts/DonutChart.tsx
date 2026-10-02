"use client";

import { motion } from "motion/react";

export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({ data, size = 160, thickness = 24 }: { data: DonutDatum[]; size?: number; thickness?: number }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  // Precompute each slice's dash length and cumulative offset functionally
  // (no mutation of an outer variable across iterations).
  const slices = data.reduce<Array<DonutDatum & { dash: number; offset: number }>>((acc, d) => {
    const dash = (d.value / total) * circumference;
    const offset = acc.length ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0;
    return [...acc, { ...d, dash, offset }];
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f1f1" strokeWidth={thickness} />
        {slices.map((d, i) => (
          <motion.circle
            key={d.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={d.color}
            strokeWidth={thickness}
            strokeDasharray={`${d.dash} ${circumference - d.dash}`}
            strokeDashoffset={-d.offset}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <ul className="space-y-1.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-neutral-600">{d.label}</span>
            <span className="font-bold text-neutral-800">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
