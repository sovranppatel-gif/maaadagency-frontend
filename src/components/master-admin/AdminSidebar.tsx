"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { adminNavGroups, isNavActive, navItemsForRole, type AdminNavItem } from "@/lib/admin-nav";
import { useAuth } from "@/lib/auth-context";
import { isMac } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { ProfileMenu } from "./ProfileMenu";

type TipHandler = (el: HTMLElement | null, label: string) => void;

/** Brand lockup: full agency logo when expanded, compact logo emblem when collapsed. */
export function BrandMark({ expanded }: { expanded: boolean }) {
  return (
    <Link href="/master-admin" aria-label="Maa Ad Agency admin home" className="flex min-w-0 items-center gap-2.5 rounded-control">
      <Image
        src="/images/logo.png"
        alt="Maa Ad Agency"
        width={900}
        height={424}
        priority
        className={cn("shrink-0 object-contain", expanded ? "h-9 w-auto" : "h-6 w-10")}
      />
      {expanded && (
        <span className="min-w-0 border-l border-border pl-2.5 leading-tight">
          <span className="block truncate text-[10px] font-semibold uppercase leading-3 tracking-[0.08em] text-muted">
            Master Admin
          </span>
        </span>
      )}
    </Link>
  );
}

function NavLink({
  item,
  active,
  expanded,
  onNavigate,
  onTip,
}: {
  item: AdminNavItem;
  active: boolean;
  expanded: boolean;
  onNavigate?: () => void;
  onTip?: TipHandler;
}) {
  const tip = (e: React.SyntheticEvent<HTMLElement>) => !expanded && onTip?.(e.currentTarget, item.label);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={expanded ? undefined : item.label}
      onMouseEnter={tip}
      onFocus={tip}
      onMouseLeave={() => onTip?.(null, "")}
      onBlur={() => onTip?.(null, "")}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-control text-13 font-medium transition-colors duration-150 ease-out",
        expanded ? "px-3" : "mx-auto w-11 justify-center",
        active ? "bg-accent-soft text-fg" : "text-muted hover:bg-surface-2 hover:text-fg"
      )}
    >
      {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent" aria-hidden />}
      <item.icon
        className={cn("h-[18px] w-[18px] shrink-0", active ? "text-accent" : "text-muted group-hover:text-fg")}
        strokeWidth={1.75}
        aria-hidden
      />
      {expanded && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

/** Grouped navigation, shared by the desktop sidebar and the mobile drawer. */
export function NavSections({ expanded, onNavigate, onTip }: { expanded: boolean; onNavigate?: () => void; onTip?: TipHandler }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const items = navItemsForRole(user?.role);

  return (
    <div className="flex flex-col gap-1 py-3">
      {adminNavGroups.map((group, index) => {
        const groupItems = items.filter((i) => i.group === group);
        if (!groupItems.length) return null;
        return (
          <section key={group} aria-label={group} className={cn("px-3", index > 0 && "mt-3")}>
            {expanded ? (
              <h2 className="label-caps mb-1 px-3">{group}</h2>
            ) : (
              index > 0 && <div className="mx-auto mb-3 h-px w-8 bg-border" aria-hidden />
            )}
            <ul className="flex flex-col gap-0.5">
              {groupItems.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} active={isNavActive(item, pathname)} expanded={expanded} onNavigate={onNavigate} onTip={onTip} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/**
 * Desktop / tablet sidebar. `expanded` = 248px with labels, otherwise a 68px
 * icon rail with hover/focus tooltips. On tablets the expanded state floats
 * over the content (`overlay`).
 */
export function AdminSidebar({
  expanded,
  overlay,
  onToggle,
}: {
  expanded: boolean;
  overlay: boolean;
  onToggle: () => void;
}) {
  const [tip, setTip] = useState<{ label: string; top: number; left: number } | null>(null);

  const onTip = useCallback<TipHandler>(
    (el, label) => {
      if (!el || expanded) return setTip(null);
      const r = el.getBoundingClientRect();
      setTip({ label, top: r.top + r.height / 2, left: r.right + 10 });
    },
    [expanded]
  );

  const shortcut = isMac() ? "⌘B" : "Ctrl B";
  const toggleLabel = expanded ? "Collapse sidebar" : "Expand sidebar";

  return (
    <>
      <aside
        aria-label="Main navigation"
        style={{ width: expanded ? "var(--sidebar-expanded)" : "var(--sidebar-rail)" }}
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-surface transition-[width] duration-[220ms] ease-out sm:flex",
          overlay && "shadow-float"
        )}
      >
        <div className={cn("flex h-14 shrink-0 items-center border-b border-border", expanded ? "px-4" : "justify-center")}>
          <BrandMark expanded={expanded} />
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden" onScroll={() => setTip(null)}>
          <NavSections expanded={expanded} onTip={onTip} />
        </nav>

        <div className="shrink-0 space-y-1 border-t border-border p-3">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={toggleLabel}
            aria-keyshortcuts={isMac() ? "Meta+B" : "Control+B"}
            onMouseEnter={(e) => onTip(e.currentTarget, `${toggleLabel} (${shortcut})`)}
            onFocus={(e) => onTip(e.currentTarget, `${toggleLabel} (${shortcut})`)}
            onMouseLeave={() => setTip(null)}
            onBlur={() => setTip(null)}
            className={cn(
              "flex h-10 items-center gap-3 rounded-control text-13 text-muted transition-colors duration-150 ease-out hover:bg-surface-2 hover:text-fg",
              expanded ? "w-full px-3" : "mx-auto w-11 justify-center"
            )}
          >
            {expanded ? <PanelLeftClose className="h-[18px] w-[18px]" aria-hidden /> : <PanelLeftOpen className="h-[18px] w-[18px]" aria-hidden />}
            {expanded && (
              <>
                <span className="flex-1 text-left">Collapse</span>
                <kbd className="rounded-control border border-border px-1.5 font-num text-2xs text-muted">{shortcut}</kbd>
              </>
            )}
          </button>
          <ProfileMenu placement={expanded ? "sidebar" : "rail"} onTooltip={onTip} />
        </div>
      </aside>

      {tip && !expanded && (
        <div
          role="tooltip"
          style={{ top: tip.top, left: tip.left }}
          className="pointer-events-none fixed z-[60] -translate-y-1/2 whitespace-nowrap rounded-control border border-border bg-surface-2 px-2 py-1 text-xs font-medium text-fg shadow-float"
        >
          {tip.label}
        </div>
      )}
    </>
  );
}
