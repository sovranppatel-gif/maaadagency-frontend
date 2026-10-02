"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Modal } from "./ui/Modal";
import type { Priority } from "@/lib/types";

const priorities: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export function RevisionModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (notes: string, priority: Priority, deadline?: string) => Promise<void> | void;
}) {
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!notes.trim()) return;
    setSubmitting(true);
    await onSubmit(notes.trim(), priority, deadline || undefined);
    setSubmitting(false);
    setNotes("");
    setDeadline("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Request Changes" description="Let the employee know what needs to change." size="md">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">
            What changes are required?
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Describe the changes needed in detail..."
            className="w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">New Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50">
            Cancel
          </button>
          <button
            type="button"
            disabled={!notes.trim() || submitting}
            onClick={handleSubmit}
            className="flex items-center gap-2 rounded-xl bg-brand-red px-5 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Revision Request
          </button>
        </div>
      </div>
    </Modal>
  );
}
