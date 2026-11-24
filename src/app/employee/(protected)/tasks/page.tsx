"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { EmployeePagination } from "@/components/employee/EmployeePagination";
import { getWorksPage } from "@/lib/api/works";
import { formatDate } from "@/lib/format";
import type { Priority, Work, WorkStatus } from "@/lib/types";

const pageSize = 12;
const workStatuses: WorkStatus[] = ["ASSIGNED", "IN_PROGRESS", "SUBMITTED", "CHANGES_REQUESTED", "APPROVED", "COMPLETED"];
const priorities: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function WorkStatusPill({ status }: { status: WorkStatus }) {
  const tone = status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : status === "SUBMITTED" ? "bg-blue-100 text-blue-800" : status === "CHANGES_REQUESTED" ? "bg-amber-100 text-amber-800" : "bg-neutral-100 text-neutral-700";
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${tone}`}>{status.replaceAll("_", " ")}</span>;
}

export default function EmployeeTasksPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<WorkStatus | "All">("All");
  const [priority, setPriority] = useState<Priority | "All">("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getWorksPage({ page, limit: pageSize, search: search.trim(), status, priority, sort: "deadline" })
      .then(({ works: result, meta }) => {
        if (!active) return;
        setWorks(result);
        setTotalPages(meta.totalPages);
        setError("");
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load your tasks.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, search, status, priority]);

  function updateFilter(update: () => void) {
    setPage(1);
    setLoading(true);
    setError("");
    update();
  }

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-xl font-extrabold text-neutral-900">My Tasks</h1>
        <p className="mt-1 text-sm text-neutral-500">Read-only view of work assigned to you.</p>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-black/6 bg-white p-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:p-4">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-neutral-100 px-3 py-2.5 sm:min-w-56">
          <Search className="h-4 w-4 shrink-0 text-neutral-400" />
          <input type="search" value={search} onChange={(event) => updateFilter(() => setSearch(event.target.value))} placeholder="Search tasks..." aria-label="Search tasks" className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400" />
        </label>
        <select value={status} onChange={(event) => updateFilter(() => setStatus(event.target.value as WorkStatus | "All"))} aria-label="Filter tasks by status" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-700">
          <option value="All">All statuses</option>
          {workStatuses.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
        </select>
        <select value={priority} onChange={(event) => updateFilter(() => setPriority(event.target.value as Priority | "All"))} aria-label="Filter tasks by priority" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-700">
          <option value="All">All priorities</option>
          {priorities.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </section>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <section className="overflow-hidden rounded-2xl border border-black/6 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-4">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-neutral-100" />)}</div>
        ) : works.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-neutral-500">{search || status !== "All" || priority !== "All" ? "No tasks match these filters." : "No tasks are assigned to you yet."}</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {works.map((work) => (
              <li key={work.id}>
                <Link href={`/employee/tasks/${work.code ?? work.id}`} className="block p-4 transition-colors hover:bg-neutral-50 sm:px-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-sm font-bold text-neutral-900">{work.title}</h2>
                        <span className="text-xs text-neutral-400">{work.code ?? "Task"}</span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">{work.clientName}{work.service ? ` · ${work.service}` : ""}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold uppercase text-neutral-600">{work.priority}</span>
                      <WorkStatusPill status={work.status} />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                    <span className="text-xs text-neutral-500">Due {formatDate(work.deadline)}</span>
                    <span className="text-xs font-semibold text-neutral-600">{work.progress}% complete</span>
                    <span className="h-1.5 min-w-24 flex-1 overflow-hidden rounded-full bg-neutral-100">
                      <span className="block h-full rounded-full bg-red-700" style={{ width: `${Math.min(100, Math.max(0, work.progress))}%` }} />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {!loading && totalPages > 1 && <EmployeePagination page={page} totalPages={totalPages} onChange={(nextPage) => { setLoading(true); setPage(nextPage); }} />}
      </section>
    </div>
  );
}
