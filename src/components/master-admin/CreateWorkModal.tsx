"use client";

import { useState } from "react";
import { Check, Loader2, Paperclip } from "lucide-react";
import { Modal } from "./ui/Modal";
import { Avatar } from "./ui/Avatar";
import { StatusBadge } from "./ui/StatusBadge";
import { useDirectory } from "@/lib/directory";
import type { Priority, Work } from "@/lib/types";
import { cn } from "@/lib/utils";

const priorities: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export function CreateWorkModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: Partial<Work>) => Promise<void> | void;
}) {
  const { clients, employees, services } = useDirectory();
  const [clientId, setClientId] = useState("");
  const [service, setService] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [employeeId, setEmployeeId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function reset() {
    setClientId("");
    setService("");
    setTitle("");
    setDescription("");
    setDeadline("");
    setPriority("MEDIUM");
    setEmployeeId("");
  }

  async function handleSubmit() {
    const client = clients.find((c) => c.id === clientId);
    setSubmitting(true);
    await onCreate({
      clientId,
      clientName: client?.company || client?.name || "New Client",
      service,
      title,
      description,
      deadline,
      priority,
      employeeId: employeeId || undefined,
    });
    setSubmitting(false);
    setDone(true);
    setTimeout(() => {
      setDone(false);
      reset();
      onClose();
    }, 1100);
  }

  const valid = clientId && service && title && deadline;

  return (
    <Modal open={open} onClose={onClose} title="Create Work" description="Create and optionally assign a new work item." size="lg">
      {done ? (
        <div className="flex flex-col items-center py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Check className="h-7 w-7" strokeWidth={3} />
          </span>
          <p className="mt-4 text-base font-bold text-neutral-900">Work Created!</p>
          <p className="mt-1 text-sm text-neutral-500">
            {employeeId ? "The employee has been notified." : "You can assign it later from the Work Management page."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Client</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company || c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Service</label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
              >
                <option value="">Select service</option>
                {services.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Requirement Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. E-commerce Homepage UI"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add any relevant details for the assigned employee..."
              className="w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Assign Employee (optional)</label>
            <div className="grid max-h-44 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => setEmployeeId(employeeId === emp.id ? "" : emp.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors",
                    employeeId === emp.id ? "border-brand-red bg-red-50/50" : "border-black/8 hover:bg-neutral-50"
                  )}
                >
                  <Avatar name={emp.name} color={emp.avatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-neutral-800">{emp.name}</p>
                    <p className="truncate text-[11px] text-neutral-500">{emp.role}</p>
                  </div>
                  <StatusBadge status={emp.availability} className="shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-black/15 py-3 text-sm font-semibold text-neutral-400 hover:border-neutral-300 hover:text-neutral-500"
          >
            <Paperclip className="h-4 w-4" />
            Attach reference files (optional)
          </button>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50">
              Cancel
            </button>
            <button
              type="button"
              disabled={!valid || submitting}
              onClick={handleSubmit}
              className="flex items-center gap-2 rounded-xl bg-brand-red px-5 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {employeeId ? "Create & Assign Work" : "Create Work"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
