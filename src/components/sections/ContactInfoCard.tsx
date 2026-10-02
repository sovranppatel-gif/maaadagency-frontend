import type { LucideIcon } from "lucide-react";

export function ContactInfoCard({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-black/[0.08] bg-white p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h4 className="text-xs font-bold uppercase tracking-wide text-black/45">{label}</h4>
        <div className="mt-1 text-sm font-semibold text-brand-dark [overflow-wrap:anywhere]">{children}</div>
      </div>
    </div>
  );
}
