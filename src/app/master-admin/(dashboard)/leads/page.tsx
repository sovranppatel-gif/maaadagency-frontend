"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Search, SlidersHorizontal, Inbox, Sparkles, UserCheck, Activity, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/master-admin/StatCard";
import { LeadTable } from "@/components/master-admin/LeadTable";
import { AssignmentModal } from "@/components/master-admin/AssignmentModal";
import { ConfirmDialog } from "@/components/master-admin/ui/ConfirmDialog";
import { Card } from "@/components/master-admin/ui/Card";
import { Pagination } from "@/components/master-admin/ui/Pagination";
import { EmptyState } from "@/components/master-admin/ui/EmptyState";
import { useToast } from "@/components/master-admin/ui/ToastProvider";
import { LeadFormModal } from "@/components/master-admin/LeadFormModal";
import { usePagination } from "@/lib/usePagination";
import { getLeads, createLead, assignLead, deleteLead, type LeadFilters, type LeadInput } from "@/lib/api/leads";
import { useDirectory } from "@/lib/directory";
import { useAuth } from "@/lib/auth-context";
import type { Lead, LeadStatus, Priority } from "@/lib/types";

const statuses: (LeadStatus | "All")[] = ["All", "New", "Assigned", "In Progress", "Submitted", "Changes Requested", "Approved", "Completed"];
const priorities: (Priority | "All")[] = ["All", "LOW", "MEDIUM", "HIGH", "URGENT"];

function LeadsPageInner() {
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadStatus | "All">((searchParams.get("status") as LeadStatus) || "All");
  const [priority, setPriority] = useState<Priority | "All">("All");
  const [service, setService] = useState("All");
  const [employeeId, setEmployeeId] = useState("All");
  const [assignTarget, setAssignTarget] = useState<Lead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const { push } = useToast();
  const { employees, services: serviceList, employeeById } = useDirectory();
  const { user } = useAuth();
  const canManageLeads = user?.role !== "EMPLOYEE";

  const filters: LeadFilters = useMemo(
    () => ({ search, status, priority, service, employeeId }),
    [search, status, priority, service, employeeId]
  );

  useEffect(() => {
    let active = true;
    getLeads(filters)
      .then((data) => {
        if (active) setLeads(data);
      })
      .catch((error) => {
        if (active) push({ kind: "error", title: "Failed to load leads", description: error instanceof Error ? error.message : "Please try again." });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters, push]);

  const { page, setPage, totalPages, pageItems, totalItems, pageSize } = usePagination(leads, 8);

  async function handleAssign(empId: string) {
    if (!assignTarget) return;
    const updated = await assignLead(assignTarget.id, empId);
    if (updated) {
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      const emp = employeeById(empId);
      push({ kind: "success", title: "Lead assigned", description: `${assignTarget.clientName} assigned to ${emp?.name}.` });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteLead(deleteTarget.id);
    setLeads((prev) => prev.filter((l) => l.id !== deleteTarget.id));
    push({ kind: "success", title: "Lead deleted" });
  }

  async function handleCreate(data: LeadInput, idempotencyKey?: string) {
    const created = await createLead(data, idempotencyKey);
    try {
      setLeads(await getLeads(filters));
    } catch (error) {
      setLeads((current) => [created, ...current.filter((lead) => lead.id !== created.id)]);
      push({
        kind: "error",
        title: "Lead created, but list refresh failed",
        description: error instanceof Error ? error.message : "Refresh the page to see the latest list.",
      });
    }
  }

  const total = leads.length;
  const newCount = leads.filter((l) => l.status === "New").length;
  const assignedCount = leads.filter((l) => l.status === "Assigned").length;
  const progressCount = leads.filter((l) => l.status === "In Progress").length;
  const convertedCount = leads.filter((l) => l.status === "Completed" || l.status === "Approved").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard icon={Inbox} label="Total Leads" value={total} tone="red" index={0} />
        <StatCard icon={Sparkles} label="New" value={newCount} index={1} />
        <StatCard icon={UserCheck} label="Assigned" value={assignedCount} index={2} />
        <StatCard icon={Activity} label="In Progress" value={progressCount} index={3} />
        <StatCard icon={CheckCircle2} label="Converted" value={convertedCount} index={4} />
      </div>

      <Card padded={false} className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl bg-neutral-100 px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads by client, ID, phone..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
          </div>
          <SlidersHorizontal className="hidden h-4 w-4 text-neutral-400 sm:block" />
          <select value={service} onChange={(e) => setService(e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-700 outline-none">
            <option value="All">All Services</option>
            {serviceList.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as LeadStatus | "All")} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-700 outline-none">
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All Statuses" : s}
              </option>
            ))}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority | "All")} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-700 outline-none">
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p === "All" ? "All Priorities" : p}
              </option>
            ))}
          </select>
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-700 outline-none">
            <option value="All">All Employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          {canManageLeads && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="ml-auto flex items-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4" />
              New Lead
            </button>
          )}
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="py-20 text-center text-sm text-neutral-400">Loading leads…</div>
        ) : leads.length === 0 ? (
          <EmptyState icon={Search} title="No leads found" description="Try adjusting your filters or search term." />
        ) : (
          <>
            <LeadTable
              leads={pageItems}
              onAssign={canManageLeads ? setAssignTarget : undefined}
              onDelete={canManageLeads ? setDeleteTarget : undefined}
            />
            <div className="pt-4">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
            </div>
          </>
        )}
      </Card>

      <AssignmentModal
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        title="Assign Lead"
        description={assignTarget ? `Assign ${assignTarget.clientName}'s requirement to an employee.` : undefined}
        onAssign={handleAssign}
      />
      {canManageLeads && createOpen && (
        <LeadFormModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSave={handleCreate}
        />
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this lead?"
        description={`This will permanently remove ${deleteTarget?.clientName}'s lead. This action cannot be undone.`}
        confirmLabel="Delete Lead"
      />
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-neutral-400">Loading…</div>}>
      <LeadsPageInner />
    </Suspense>
  );
}
