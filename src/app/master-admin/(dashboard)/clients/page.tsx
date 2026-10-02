"use client";

import { useEffect, useState } from "react";
import { Building2, Search, FolderKanban, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/master-admin/StatCard";
import { ClientTable } from "@/components/master-admin/ClientTable";
import { Card } from "@/components/master-admin/ui/Card";
import { Pagination } from "@/components/master-admin/ui/Pagination";
import { usePagination } from "@/lib/usePagination";
import { getClients } from "@/lib/api/clients";
import type { Client } from "@/lib/types";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getClients().then(setClients);
  }, []);

  const filtered = clients.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.company || "").toLowerCase().includes(search.toLowerCase())
  );
  const { page, setPage, totalPages, pageItems, totalItems, pageSize } = usePagination(filtered, 8);

  const activeProjects = clients.reduce((a, c) => a + c.activeProjects, 0);
  const completedProjects = clients.reduce((a, c) => a + c.completedProjects, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={Building2} label="Total Clients" value={clients.length} tone="red" index={0} />
        <StatCard icon={FolderKanban} label="Active Projects" value={activeProjects} index={1} />
        <StatCard icon={CheckCircle2} label="Completed Projects" value={completedProjects} index={2} />
      </div>

      <Card padded={false} className="p-4 sm:p-5">
        <div className="flex items-center gap-2 rounded-xl bg-neutral-100 px-3 py-2.5 sm:max-w-sm">
          <Search className="h-4 w-4 shrink-0 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
          />
        </div>
      </Card>

      <Card>
        <ClientTable clients={pageItems} />
        <div className="pt-4">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
        </div>
      </Card>
    </div>
  );
}
