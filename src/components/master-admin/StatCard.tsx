"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  change,
  tone = "neutral",
  href,
  index = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: { value: string; positive: boolean };
  tone?: "red" | "neutral";
  href?: string;
  index?: number;
}) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      whileHover={href ? { y: -3 } : undefined}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-black/6 bg-white p-4 shadow-sm transition-shadow sm:p-5",
        href && "cursor-pointer hover:shadow-lg hover:shadow-black/5"
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            tone === "red" ? "bg-brand-red text-white" : "bg-neutral-100 text-neutral-600"
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        {change && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold",
              change.positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-brand-red"
            )}
          >
            {change.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {change.value}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-medium text-neutral-500">{label}</p>
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
