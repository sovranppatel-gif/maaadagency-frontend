"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function EmployeePagination({
  page,
  totalPages,
  disabled,
  onChange,
}: {
  page: number;
  totalPages: number;
  disabled?: boolean;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-black/5 px-4 py-3 sm:px-5">
      <p className="text-xs text-neutral-500">Page {page} of {totalPages}</p>
      <div className="flex gap-2">
        <button type="button" aria-label="Previous page" disabled={disabled || page <= 1} onClick={() => onChange(page - 1)} className="rounded-lg border border-black/10 p-2 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Next page" disabled={disabled || page >= totalPages} onClick={() => onChange(page + 1)} className="rounded-lg border border-black/10 p-2 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
