import { cn } from "@/lib/utils";

export function PortfolioFilters<T extends string>({
  filters,
  active,
  counts,
  onChange,
}: {
  filters: readonly T[];
  active: T;
  counts: Record<string, number>;
  onChange: (filter: T) => void;
}) {
  return (
    // Scrolls sideways on small screens instead of wrapping into a tall block.
    <div className="no-scrollbar -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <div role="group" aria-label="Filter projects by category" className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
        {filters.map((filter) => {
          const isActive = filter === active;
          return (
            <button
              key={filter}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(filter)}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-colors",
                isActive
                  ? "border-brand-dark bg-brand-dark text-white"
                  : "border-black/10 bg-white text-brand-dark/75 hover:border-brand-dark/40 hover:text-brand-dark"
              )}
            >
              {filter}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] font-bold",
                  isActive ? "bg-white/15 text-white" : "bg-brand-gray text-black/50"
                )}
              >
                {counts[filter]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
