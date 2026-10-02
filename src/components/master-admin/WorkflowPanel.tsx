"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";
import { Card, CardHeader } from "./ui/Card";

const statusOrder: Record<LeadStatus, number> = {
  New: 0,
  Assigned: 1,
  "In Progress": 2,
  Submitted: 3,
  "Changes Requested": 3,
  Approved: 4,
  Completed: 5,
};

const stages: { label: string; minOrder: number; status?: LeadStatus }[] = [
  { label: "New Lead", minOrder: 0, status: "New" },
  { label: "Requirement Collected", minOrder: 0 },
  { label: "Assigned", minOrder: 1, status: "Assigned" },
  { label: "In Progress", minOrder: 2, status: "In Progress" },
  { label: "Submitted", minOrder: 3, status: "Submitted" },
  { label: "Admin Review", minOrder: 3 },
  { label: "Approved", minOrder: 4, status: "Approved" },
  { label: "Completed", minOrder: 5, status: "Completed" },
];

export function WorkflowPanel({ leads }: { leads: Lead[] }) {
  const counts = stages.map((s) => leads.filter((l) => statusOrder[l.status] >= s.minOrder).length);
  const max = Math.max(...counts, 1);

  return (
    <Card>
      <CardHeader title="Work Flow Pipeline" subtitle="From first contact to a completed, approved project." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {stages.map((stage, i) => {
          const href = stage.status ? `/master-admin/leads?status=${encodeURIComponent(stage.status)}` : "/master-admin/leads";
          return (
            <Link key={stage.label} href={href} className="group relative">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
                className="flex h-full flex-col justify-between rounded-xl border border-black/6 bg-neutral-50/60 p-3 transition-colors group-hover:border-brand-red/30 group-hover:bg-red-50/40"
              >
                <p className="text-2xl font-extrabold text-neutral-900">{counts[i]}</p>
                <p className="mt-1 text-xs font-semibold leading-tight text-neutral-500">{stage.label}</p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-neutral-200">
                  <div className="h-full rounded-full bg-brand-red" style={{ width: `${(counts[i] / max) * 100}%` }} />
                </div>
              </motion.div>
              {i < stages.length - 1 && (
                <ChevronRight className="absolute -right-2.5 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 text-neutral-300 lg:block" />
              )}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
