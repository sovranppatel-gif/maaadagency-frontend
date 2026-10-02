"use client";

import { Fragment, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Menu, Search } from "lucide-react";
import { getBreadcrumbs } from "@/lib/admin-nav";
import { getNotifications } from "@/lib/api/notifications";
import { getWhatsAppStatus } from "@/lib/api/whatsapp";
import { isMac, useEscape } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import type { AppNotification } from "@/lib/types";
import { ThemeToggle } from "./ThemeToggle";
import { ProfileMenu } from "./ProfileMenu";

const iconButton =
  "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-muted transition-colors duration-150 ease-out hover:bg-surface-2 hover:text-fg";

function Breadcrumbs() {
  const crumbs = getBreadcrumbs(usePathname());
  const current = crumbs[crumbs.length - 1];

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      {/* Phones: just the current page. */}
      <p className="truncate text-sm font-semibold text-fg sm:hidden">{current.label}</p>
      <ol className="hidden min-w-0 items-center gap-1.5 text-13 sm:flex">
        {crumbs.map((crumb, i) => (
          <Fragment key={`${crumb.label}-${i}`}>
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-subtle" aria-hidden />}
            <li className="min-w-0">
              {crumb.href ? (
                <Link href={crumb.href} className="truncate rounded-control text-muted transition-colors duration-150 hover:text-fg">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page" className="truncate font-medium text-fg">
                  {crumb.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

function WhatsAppStatus({ connected }: { connected: boolean | null }) {
  const label = connected === null ? "Checking…" : connected ? "Connected" : "Disconnected";
  return (
    <div
      className="hidden h-8 items-center gap-2 rounded-control border border-border px-2.5 text-2xs font-medium text-muted xl:flex"
      title="WhatsApp Business API"
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", connected === null ? "bg-subtle" : connected ? "bg-success" : "bg-danger")}
        aria-hidden
      />
      <span className="text-fg">WhatsApp</span>
      <span>{label}</span>
    </div>
  );
}

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  useEscape(open, () => setOpen(false));

  useEffect(() => {
    getNotifications().then(setNotifications).catch(() => setNotifications([]));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className={iconButton}
      >
        <Bell className="h-[18px] w-[18px]" aria-hidden />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-num text-[10px] font-semibold leading-none text-accent-fg">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          className="fixed inset-x-4 top-[calc(var(--topbar-h)+4px)] z-50 overflow-hidden rounded-card border border-border bg-surface shadow-float sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-13 font-semibold text-fg">Notifications</p>
            <Link href="/master-admin/notifications" onClick={() => setOpen(false)} className="rounded-control text-2xs font-medium text-accent hover:text-accent-hover">
              View all
            </Link>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && <li className="px-4 py-8 text-center text-13 text-muted">You&apos;re all caught up.</li>}
            {notifications.slice(0, 5).map((n) => (
              <li key={n.id} className="border-b border-border px-4 py-3 transition-colors duration-150 last:border-0 hover:bg-surface-2">
                <div className="flex items-start gap-2.5">
                  <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-accent")} aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-13 font-medium text-fg">{n.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted">{n.description}</p>
                    <p className="mt-1 font-num text-2xs text-subtle">{timeAgo(n.timestamp)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AdminHeader({ onMenuClick, onSearchClick }: { onMenuClick: () => void; onSearchClick: () => void }) {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    getWhatsAppStatus()
      .then((s) => setConnected(s.connected))
      .catch(() => setConnected(false));
  }, []);

  const shortcut = isMac() ? "⌘K" : "Ctrl K";

  return (
    <header className="sticky top-0 z-30 flex h-(--topbar-h) items-center gap-2 border-b border-border bg-surface/85 px-2 backdrop-blur-md supports-[backdrop-filter]:bg-surface/75 sm:gap-3 sm:px-4 lg:px-6">
      <button type="button" onClick={onMenuClick} aria-label="Open navigation menu" className={cn(iconButton, "sm:hidden")}>
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      <Breadcrumbs />

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={onSearchClick}
          aria-label="Search pages and actions"
          aria-keyshortcuts={isMac() ? "Meta+K" : "Control+K"}
          className="hidden h-9 w-56 items-center gap-2 rounded-control border border-border bg-surface-2 px-3 text-13 text-muted transition-colors duration-150 ease-out hover:border-border-strong hover:text-fg md:flex lg:w-72"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="rounded-control border border-border bg-surface px-1.5 font-num text-2xs">{shortcut}</kbd>
        </button>
        <button type="button" onClick={onSearchClick} aria-label="Search pages and actions" className={cn(iconButton, "md:hidden")}>
          <Search className="h-[18px] w-[18px]" aria-hidden />
        </button>

        <WhatsAppStatus connected={connected} />
        <NotificationsBell />
        <ThemeToggle />
        <div className="ml-1 hidden h-6 w-px bg-border sm:block" aria-hidden />
        <ProfileMenu placement="topbar" />
      </div>
    </header>
  );
}
