"use client";

import { useEffect, useState } from "react";
import { FolderKanban, Search } from "lucide-react";
import { ProjectCard } from "@/components/master-admin/ProjectCard";
import { Card } from "@/components/master-admin/ui/Card";
import { EmptyState } from "@/components/master-admin/ui/EmptyState";
import { getProjects } from "@/lib/api/projects";
import type { Project, ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statuses: (ProjectStatus | "All")[] = ["All", "Planning", "Active", "Review", "Completed", "On Hold"];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "All">("All");

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  const filtered = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "All" || p.status === status;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <Card padded={false} className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl bg-neutral-100 px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                  status === s ? "bg-brand-red text-white" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects found" description="Try a different filter or search term." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
