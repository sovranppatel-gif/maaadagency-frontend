"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
import { Card } from "@/components/master-admin/ui/Card";
import { Modal } from "@/components/master-admin/ui/Modal";
import { ConfirmDialog } from "@/components/master-admin/ui/ConfirmDialog";
import { useToast } from "@/components/master-admin/ui/ToastProvider";
import { getServices, toggleServiceStatus, createService, deleteService } from "@/lib/api/services";
import { getIcon } from "@/lib/icon-map";
import type { ServiceItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { push } = useToast();

  useEffect(() => {
    getServices().then(setServices);
  }, []);

  async function handleToggle(id: string) {
    const updated = await toggleServiceStatus(id);
    if (updated) {
      setServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
      push({ kind: "success", title: `Service ${updated.status === "Active" ? "enabled" : "disabled"}` });
    }
  }

  async function handleCreate() {
    if (!name.trim()) return;
    const svc = await createService({ name, description });
    setServices((prev) => [...prev, svc]);
    push({ kind: "success", title: "Service added", description: name });
    setName("");
    setDescription("");
    setAddOpen(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteService(deleteTarget.id);
    setServices((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    push({ kind: "success", title: "Service deleted" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">{services.length} services · {services.filter((s) => s.status === "Active").length} active</p>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {services.map((s) => {
          const Icon = getIcon(s.icon);
          return (
            <Card key={s.id} className={cn("relative", s.status === "Disabled" && "opacity-60")}>
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gray text-brand-red">
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    s.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"
                  )}
                >
                  {s.status}
                </span>
              </div>
              <p className="mt-3 text-sm font-bold text-neutral-900">{s.name}</p>
              <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{s.description}</p>
              <p className="mt-3 text-xs font-semibold text-neutral-400">{s.leadsCount} leads generated</p>
              <div className="mt-4 flex items-center gap-1.5 border-t border-black/6 pt-3">
                <button
                  type="button"
                  onClick={() => handleToggle(s.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold text-neutral-500 hover:bg-neutral-100"
                >
                  <Power className="h-3.5 w-3.5" />
                  {s.status === "Active" ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  onClick={() => push({ kind: "info", title: "Edit service", description: "Editing UI coming soon." })}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold text-neutral-500 hover:bg-neutral-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(s)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold text-brand-red hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Service" size="sm">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Service Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Packaging Design"
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Short description shown to clients"
              className="w-full resize-none rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setAddOpen(false)} className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50">
              Cancel
            </button>
            <button type="button" onClick={handleCreate} disabled={!name.trim()} className="rounded-xl bg-brand-red px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">
              Add Service
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this service?"
        description={`"${deleteTarget?.name}" will be permanently removed from your services list.`}
        confirmLabel="Delete Service"
      />
    </div>
  );
}
