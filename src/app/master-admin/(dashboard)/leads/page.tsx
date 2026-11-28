"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Download, FileSpreadsheet, Plus, Search, SlidersHorizontal, Inbox, Sparkles, UserCheck, Activity, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/master-admin/StatCard";
import { LeadTable } from "@/components/master-admin/LeadTable";
import { AssignmentModal } from "@/components/master-admin/AssignmentModal";
import { ConfirmDialog } from "@/components/master-admin/ui/ConfirmDialog";
import { Card } from "@/components/master-admin/ui/Card";
import { Pagination } from "@/components/master-admin/ui/Pagination";
import { EmptyState } from "@/components/master-admin/ui/EmptyState";
import { useToast } from "@/components/master-admin/ui/ToastProvider";
import { LeadFormModal } from "@/components/master-admin/LeadFormModal";
import { ExportLeadsModal } from "@/components/leads/ExportLeadsModal";
import { getLeadsPage, getLeadStats, createLead, assignLead, deleteLead, type LeadFilters, type LeadInput, type LeadStats } from "@/lib/api/leads";
import { useDirectory } from "@/lib/directory";
import { useAuth } from "@/lib/auth-context";
import type { Lead, LeadQuality, LeadStatus, Priority } from "@/lib/types";
import { LEAD_QUALITIES, QualityBadge } from "@/components/master-admin/ui/QualityBadge";

const statuses: (LeadStatus | "All")[] = ["All", "New", "Assigned", "In Progress", "Submitted", "Changes Requested", "Approved", "Completed"];
const priorities: (Priority | "All")[] = ["All", "LOW", "MEDIUM", "HIGH", "URGENT"];
const qualities: (LeadQuality | "UNCLASSIFIED" | "All")[] = ["All", ...LEAD_QUALITIES, "UNCLASSIFIED"];

const pageSize = 8;

function LeadsPageInner() {
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadStatus | "All">((searchParams.get("status") as LeadStatus) || "All");
  const [priority, setPriority] = useState<Priority | "All">("All");
  const [quality, setQuality] = useState<LeadQuality | "UNCLASSIFIED" | "All">(
    (searchParams.get("quality") as LeadQuality | "UNCLASSIFIED") || "All"
  );
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
    () => ({ search, status, priority, quality, service, employeeId }),
    [search, status, priority, quality, service, employeeId]
  );

  useEffect(() => {
    let active = true;
    Promise.all([getLeadsPage({ ...filters, page, limit: pageSize }), getLeadStats()])
      .then(([pageRes, statsRes]) => {
        if (!active) return;
        setLeads(pageRes.leads);
        setMeta({ total: pageRes.meta.total, totalPages: pageRes.meta.totalPages });
        setStats(statsRes);
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
  }, [filters, page, version, push]);

  function reloadStats() {
    getLeadStats().then(setStats).catch(() => null);
  }

  async function handleAssign(empId: string) {
    if (!assignTarget) return;
    const updated = await assignLead(assignTarget.id, empId);
    if (updated) {
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      reloadStats();
      const emp = employeeById(empId);
      push({ kind: "success", title: "Lead assigned", description: `${assignTarget.clientName} assigned to ${emp?.name}.` });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteLead(deleteTarget.id);
    setVersion((v) => v + 1);
    push({ kind: "success", title: "Lead deleted" });
  }

  async function handleCreate(data: LeadInput, idempotencyKey?: string) {
    await createLead(data, idempotencyKey);
    setPage(1);
    setVersion((v) => v + 1);
  }

  const total = stats?.total ?? meta.total;
  const newCount = stats?.new ?? 0;
  const assignedCount = stats?.assigned ?? 0;
  const progressCount = stats?.inProgress ?? 0;
  const convertedCount = stats?.converted ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard icon={Inbox} label="Total Leads" value={total} tone="red" index={0} />
        <StatCard icon={Sparkles} label="New" value={newCount} index={1} />
        <StatCard icon={UserCheck} label="Assigned" value={assignedCount} index={2} />
        <StatCard icon={Activity} label="In Progress" value={progressCount} index={3} />
        <StatCard icon={CheckCircle2} label="Converted" value={convertedCount} index={4} />
      </div>

      {stats?.byQuality && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">Quality:</span>
          {([...LEAD_QUALITIES, "UNCLASSIFIED"] as const).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setPage(1);
                setQuality((current) => (current === q ? "All" : q));
              }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                quality === q ? "border-brand-red bg-red-50/60" : "border-black/8 bg-white hover:bg-neutral-50"
              }`}
            >
              <QualityBadge quality={q === "UNCLASSIFIED" ? null : q} />
              <span className="font-bold text-neutral-700">{stats.byQuality?.[q] ?? 0}</span>
            </button>
          ))}
        </div>
      )}

      <Card padded={false} className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl bg-neutral-100 px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              placeholder="Search leads by client, ID, phone..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
          </div>
          <SlidersHorizontal className="hidden h-4 w-4 text-neutral-400 sm:block" />
          <select value={service} onChange={(e) => { setPage(1); setService(e.target.value); }} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-700 outline-none">
            <option value="All">All Services</option>
            {serviceList.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value as LeadStatus | "All"); }} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-700 outline-none">
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All Statuses" : s}
              </option>
            ))}
          </select>
          <select value={priority} onChange={(e) => { setPage(1); setPriority(e.target.value as Priority | "All"); }} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-700 outline-none">
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p === "All" ? "All Priorities" : p}
              </option>
            ))}
          </select>
          <select value={quality} onChange={(e) => { setPage(1); setQuality(e.target.value as LeadQuality | "UNCLASSIFIED" | "All"); }} aria-label="Filter by lead quality" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-700 outline-none">
            {qualities.map((q) => (
              <option key={q} value={q}>
                {q === "All" ? "All Qualities" : q === "UNCLASSIFIED" ? "Unclassified" : q}
              </option>
            ))}
          </select>
          <select value={employeeId} onChange={(e) => { setPage(1); setEmployeeId(e.target.value); }} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-700 outline-none">
            <option value="All">All Employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {canManageLeads && (
              <Link
                href="/master-admin/leads/import-export"
                className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50"
              >
                <FileSpreadsheet className="h-4 w-4 text-brand-red" />
                Excel Import
              </Link>
            )}
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            {canManageLeads && (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.02]"
              >
                <Plus className="h-4 w-4" />
                New Lead
              </button>
            )}
          </div>
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
              leads={leads}
              onAssign={canManageLeads ? setAssignTarget : undefined}
              onDelete={canManageLeads ? setDeleteTarget : undefined}
            />
            <div className="pt-4">
              <Pagination page={page} totalPages={meta.totalPages} onChange={setPage} totalItems={meta.total} pageSize={pageSize} />
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
      <ExportLeadsModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        audience="admin"
        initialFilters={{ search, status, priority, quality, employeeId }}
        employees={employees}
        onSuccess={(msg) => push({ kind: "success", title: msg })}
        onError={(msg) => push({ kind: "error", title: msg })}
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
