"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Modal } from "./ui/Modal";
import { Avatar } from "./ui/Avatar";
import { StatusBadge } from "./ui/StatusBadge";
import { useDirectory } from "@/lib/directory";
import { cn } from "@/lib/utils";

export function AssignmentModal({
  open,
  onClose,
  title = "Assign Employee",
  description,
  onAssign,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  onAssign: (employeeId: string) => Promise<void> | void;
}) {
  const { employees } = useDirectory();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const isLeadAssignment = title.toLowerCase().includes("lead");

  async function handleAssign() {
    if (!selected) return;
    setSubmitting(true);
    await onAssign(selected);
    setSubmitting(false);
    setDone(true);
    setTimeout(() => {
      setDone(false);
      setSelected(null);
      onClose();
    }, 1100);
  }

  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="md">
      {done ? (
        <div className="flex flex-col items-center py-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Check className="h-7 w-7" strokeWidth={3} />
          </span>
          <p className="mt-4 text-base font-bold text-neutral-900">{isLeadAssignment ? "Lead Assigned!" : "Work Assigned!"}</p>
          <p className="mt-1 text-sm text-neutral-500">The employee has been notified.</p>
        </div>
      ) : (
        <>
          <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto pr-1">
            {employees.map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => setSelected(emp.id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                  selected === emp.id ? "border-brand-red bg-red-50/50" : "border-black/8 hover:bg-neutral-50"
                )}
              >
                <Avatar name={emp.name} color={emp.avatarColor} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-neutral-800">{emp.name}</p>
                  <p className="truncate text-xs text-neutral-500">{emp.role}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge status={emp.availability} />
                  <span className="text-[11px] text-neutral-400">{emp.activeWorks} active</span>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50">
              Cancel
            </button>
            <button
              type="button"
              disabled={!selected || submitting}
              onClick={handleAssign}
              className="flex items-center gap-2 rounded-xl bg-brand-red px-5 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLeadAssignment ? "Assign Lead" : "Assign Work"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
