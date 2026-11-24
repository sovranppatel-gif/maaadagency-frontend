"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { EmployeePagination } from "@/components/employee/EmployeePagination";
import { getLeadsPage } from "@/lib/api/leads";
import { formatDate } from "@/lib/format";
import type { Lead, LeadStatus, Priority } from "@/lib/types";

const pageSize = 12;
const leadStatuses: LeadStatus[] = ["New", "Assigned", "In Progress", "Submitted", "Changes Requested", "Approved", "Completed"];
const priorities: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function PriorityPill({ priority }: { priority: Priority }) {
  const tone = priority === "URGENT" ? "bg-red-100 text-red-800" : priority === "HIGH" ? "bg-orange-100 text-orange-800" : priority === "MEDIUM" ? "bg-amber-100 text-amber-800" : "bg-neutral-100 text-neutral-600";
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${tone}`}>{priority}</span>;
}

export default function EmployeeLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadStatus | "All">("All");
  const [priority, setPriority] = useState<Priority | "All">("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getLeadsPage({ page, limit: pageSize, search: search.trim(), status, priority, sort: "-updatedAt" })
      .then(({ leads: result, meta }) => {
        if (!active) return;
        setLeads(result);
        setTotalPages(meta.totalPages);
        setError("");
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load your leads.");
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
        <h1 className="text-xl font-extrabold text-neutral-900">My Leads</h1>
        <p className="mt-1 text-sm text-neutral-500">Leads assigned to your employee account.</p>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-black/6 bg-white p-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:p-4">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-neutral-100 px-3 py-2.5 sm:min-w-56">
          <Search className="h-4 w-4 shrink-0 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => updateFilter(() => setSearch(event.target.value))}
            placeholder="Search leads..."
            aria-label="Search leads"
            className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
          />
        </label>
        <select value={status} onChange={(event) => updateFilter(() => setStatus(event.target.value as LeadStatus | "All"))} aria-label="Filter leads by status" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-700">
          <option value="All">All statuses</option>
          {leadStatuses.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <select value={priority} onChange={(event) => updateFilter(() => setPriority(event.target.value as Priority | "All"))} aria-label="Filter leads by priority" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-700">
          <option value="All">All priorities</option>
          {priorities.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </section>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <section className="overflow-hidden rounded-2xl border border-black/6 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-4">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-neutral-100" />)}</div>
        ) : leads.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-neutral-500">{search || status !== "All" || priority !== "All" ? "No leads match these filters." : "No leads are assigned to you yet."}</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {leads.map((lead) => (
              <li key={lead.id}>
                <Link href={`/employee/leads/${lead.code ?? lead.id}`} className="block p-4 transition-colors hover:bg-neutral-50 sm:px-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-sm font-bold text-neutral-900">{lead.company || lead.clientName}</h2>
                        <span className="text-xs text-neutral-400">{lead.code}</span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">{lead.service} · {lead.requirement}</p>
                      <p className="mt-1 text-xs text-neutral-500">{lead.phone}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <PriorityPill priority={lead.priority} />
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold text-neutral-600">{lead.status}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-400">
                    <span>Assigned {formatDate(lead.assignedDate || lead.createdAt)}</span>
                    {lead.contactPersonName && <span>Contact: {lead.contactPersonName}</span>}
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
