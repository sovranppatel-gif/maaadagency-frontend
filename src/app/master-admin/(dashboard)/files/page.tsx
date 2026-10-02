"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, FileImage, FileText, File as FileIcon, FileArchive, Eye, Download, Trash2 } from "lucide-react";
import { Card } from "@/components/master-admin/ui/Card";
import { EmptyState } from "@/components/master-admin/ui/EmptyState";
import { Pagination } from "@/components/master-admin/ui/Pagination";
import { RowMenu } from "@/components/master-admin/ui/RowMenu";
import { useToast } from "@/components/master-admin/ui/ToastProvider";
import { usePagination } from "@/lib/usePagination";
import { getFiles } from "@/lib/api/files";
import { formatDate } from "@/lib/format";
import type { FileCategory, FileRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

const categories: (FileCategory | "All")[] = [
  "All",
  "Client Files",
  "Employee Reports",
  "Project Files",
  "Screenshots",
  "Designs",
  "Documents",
];

const typeIcon: Record<FileRecord["type"], typeof FileIcon> = {
  image: FileImage,
  pdf: FileText,
  doc: FileText,
  zip: FileArchive,
  other: FileIcon,
};

export default function FilesPage() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [category, setCategory] = useState<FileCategory | "All">("All");
  const [search, setSearch] = useState("");
  const { push } = useToast();

  useEffect(() => {
    getFiles(category, search).then(setFiles);
  }, [category, search]);

  const { page, setPage, totalPages, pageItems, totalItems, pageSize } = usePagination(files, 10);

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: files.length };
    return map;
  }, [files]);

  return (
    <div className="space-y-6">
      <Card padded={false} className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl bg-neutral-100 px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files by name, client, project..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                category === c ? "bg-brand-red text-white" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
              )}
            >
              {c} {c === "All" ? `(${counts.All})` : ""}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        {files.length === 0 ? (
          <EmptyState icon={FileIcon} title="No files found" description="Try a different category or search term." />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-black/8 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    <th className="whitespace-nowrap px-3 py-3">File</th>
                    <th className="whitespace-nowrap px-3 py-3">Type</th>
                    <th className="whitespace-nowrap px-3 py-3">Client</th>
                    <th className="whitespace-nowrap px-3 py-3">Project</th>
                    <th className="whitespace-nowrap px-3 py-3">Uploaded By</th>
                    <th className="whitespace-nowrap px-3 py-3">Date</th>
                    <th className="whitespace-nowrap px-3 py-3">Size</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((f) => {
                    const Icon = typeIcon[f.type];
                    return (
                      <tr key={f.id} className="border-b border-black/5 hover:bg-neutral-50">
                        <td className="whitespace-nowrap px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="max-w-[200px] truncate font-semibold text-neutral-800">{f.name}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-neutral-500">{f.category}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-neutral-600">{f.clientName || "—"}</td>
                        <td className="max-w-[160px] truncate px-3 py-3 text-neutral-600">{f.projectName || "—"}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-neutral-600">{f.uploadedBy}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-neutral-400">{formatDate(f.uploadedAt)}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-neutral-400">{f.size}</td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => push({ kind: "info", title: "Preview", description: `Previewing ${f.name}` })}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                              aria-label="Preview file"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <RowMenu
                              actions={[
                                { label: "Download", icon: Download, onClick: () => push({ kind: "success", title: "Download started", description: f.name }) },
                                { label: "Delete", icon: Trash2, destructive: true, onClick: () => push({ kind: "success", title: "File deleted" }) },
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 md:hidden">
              {pageItems.map((f) => {
                const Icon = typeIcon[f.type];
                return (
                  <div key={f.id} className="rounded-xl border border-black/6 p-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-neutral-800">{f.name}</p>
                        <p className="text-xs text-neutral-400">
                          {f.clientName} · {f.size}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
