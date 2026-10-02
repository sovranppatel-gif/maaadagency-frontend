"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Search, Layers, UserX, UserCheck, Activity, Send, RefreshCcw, CheckCircle2 } from "lucide-react";
import { WorkTable } from "@/components/master-admin/WorkTable";
import { AssignmentModal } from "@/components/master-admin/AssignmentModal";
import { CreateWorkModal } from "@/components/master-admin/CreateWorkModal";
import { Card } from "@/components/master-admin/ui/Card";
import { Pagination } from "@/components/master-admin/ui/Pagination";
import { EmptyState } from "@/components/master-admin/ui/EmptyState";
import { useToast } from "@/components/master-admin/ui/ToastProvider";
import { usePagination } from "@/lib/usePagination";
import { getWorks, assignWork, createWork, markCompleted, type WorkFilters } from "@/lib/api/works";
import { useDirectory } from "@/lib/directory";
import type { Work, WorkStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusTabs: { label: string; value: WorkStatus | "All"; icon: typeof Layers }[] = [
  { label: "All Work", value: "All", icon: Layers },
  { label: "Unassigned", value: "UNASSIGNED", icon: UserX },
  { label: "Assigned", value: "ASSIGNED", icon: UserCheck },
  { label: "In Progress", value: "IN_PROGRESS", icon: Activity },
  { label: "Submitted", value: "SUBMITTED", icon: Send },
  { label: "Changes Requested", value: "CHANGES_REQUESTED", icon: RefreshCcw },
  { label: "Completed", value: "COMPLETED", icon: CheckCircle2 },
];

function WorkPageInner() {
  const searchParams = useSearchParams();
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<WorkStatus | "All">((searchParams.get("status") as WorkStatus) || "All");
  const [assignTarget, setAssignTarget] = useState<Work | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const { push } = useToast();
  const { employeeById } = useDirectory();

  const filters: WorkFilters = useMemo(() => ({ search, status }), [search, status]);

  useEffect(() => {
    getWorks(filters).then((data) => {
      setWorks(data);
      setLoading(false);
    });
  }, [filters]);

  const { page, setPage, totalPages, pageItems, totalItems, pageSize } = usePagination(works, 8);

  async function refreshAll() {
    const data = await getWorks(filters);
    setWorks(data);
  }

  async function handleAssign(employeeId: string) {
    if (!assignTarget) return;
    await assignWork(assignTarget.id, employeeId);
    await refreshAll();
    const emp = employeeById(employeeId);
    push({ kind: "success", title: "Work assigned", description: `${assignTarget.title} assigned to ${emp?.name}.` });
  }

  async function handleComplete(work: Work) {
    await markCompleted(work.id);
    await refreshAll();
    push({ kind: "success", title: "Marked completed", description: `${work.title} has been marked as completed.` });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {statusTabs.map((tab) => {
          const count = tab.value === "All" ? works.length : works.filter((w) => w.status === tab.value).length;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatus(tab.value)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition-colors",
                status === tab.value ? "border-brand-red bg-red-50/50" : "border-black/6 bg-white hover:bg-neutral-50"
              )}
            >
              <tab.icon className={cn("h-4 w-4", status === tab.value ? "text-brand-red" : "text-neutral-400")} />
              <span className="text-xl font-extrabold text-neutral-900">{count}</span>
              <span className="text-[11px] font-semibold leading-tight text-neutral-500">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <Card padded={false} className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl bg-neutral-100 px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search work by title, client, ID..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="ml-auto flex items-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            Create Work
          </button>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="py-20 text-center text-sm text-neutral-400">Loading work…</div>
        ) : works.length === 0 ? (
          <EmptyState icon={Layers} title="No work items found" description="Try a different filter or create a new work item." />
        ) : (
          <>
            <WorkTable works={pageItems} onAssign={setAssignTarget} onComplete={handleComplete} />
            <div className="pt-4">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
            </div>
          </>
        )}
      </Card>

      <AssignmentModal
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        title={assignTarget?.employeeId ? "Reassign Work" : "Assign Work"}
        description={assignTarget ? `Assign "${assignTarget.title}" to an employee.` : undefined}
        onAssign={handleAssign}
      />
      <CreateWorkModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={async (data) => {
          await createWork(data);
          await refreshAll();
          push({ kind: "success", title: "Work created", description: `"${data.title}" has been created.` });
        }}
      />
    </div>
  );
}

export default function WorkPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-neutral-400">Loading…</div>}>
      <WorkPageInner />
    </Suspense>
  );
}
