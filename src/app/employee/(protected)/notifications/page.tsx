"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, ExternalLink, Loader2 } from "lucide-react";
import { EmployeePagination } from "@/components/employee/EmployeePagination";
import { getNotificationsPage, markAllRead, markRead } from "@/lib/api/notifications";
import { formatDateTime, timeAgo } from "@/lib/format";
import type { AppNotification, NotificationCategory } from "@/lib/types";

const pageSize = 15;
type CategoryFilter = NotificationCategory | "All";
type ReadFilter = "All" | "Unread";

function safeEmployeeHref(href?: string) {
  if (!href) return undefined;
  return /^\/employee\/(leads|tasks)\/[A-Za-z0-9_-]+$/.test(href) ? href : undefined;
}

export default function EmployeeNotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unread, setUnread] = useState(0);
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [readFilter, setReadFilter] = useState<ReadFilter>("All");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [savingAll, setSavingAll] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getNotificationsPage({
      page,
      limit: pageSize,
      category,
      unreadOnly: readFilter === "Unread",
    })
      .then(({ notifications: result, meta }) => {
        if (!active) return;
        setNotifications(result);
        setTotalPages(meta.totalPages);
        setUnread(meta.unread);
        setError("");
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load notifications.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, category, readFilter]);

  function reloadAfterFilter(update: () => void) {
    setPage(1);
    setLoading(true);
    setError("");
    update();
  }

  async function toggleRead(notification: AppNotification) {
    setSavingId(notification.id);
    setError("");
    try {
      await markRead(notification.id, !notification.read);
      window.dispatchEvent(new Event("employee-notifications-updated"));
      setLoading(true);
      const { notifications: result, meta } = await getNotificationsPage({
        page,
        limit: pageSize,
        category,
        unreadOnly: readFilter === "Unread",
      });
      setNotifications(result);
      setTotalPages(meta.totalPages);
      setUnread(meta.unread);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update notification.");
    } finally {
      setSavingId("");
      setLoading(false);
    }
  }

  async function readAll() {
    setSavingAll(true);
    setError("");
    try {
      await markAllRead();
      window.dispatchEvent(new Event("employee-notifications-updated"));
      setLoading(true);
      const { notifications: result, meta } = await getNotificationsPage({
        page,
        limit: pageSize,
        category,
        unreadOnly: readFilter === "Unread",
      });
      setNotifications(result);
      setTotalPages(meta.totalPages);
      setUnread(meta.unread);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not mark notifications as read.");
    } finally {
      setSavingAll(false);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-900">Notifications</h1>
          <p className="mt-1 text-sm text-neutral-500">{unread} unread notification{unread === 1 ? "" : "s"} addressed to your account.</p>
        </div>
        <button type="button" onClick={readAll} disabled={savingAll || unread === 0} className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">
          {savingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
          Mark all read
        </button>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-black/6 bg-white p-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:p-4">
        <label className="sr-only" htmlFor="notification-category">Filter by category</label>
        <select id="notification-category" value={category} onChange={(event) => reloadAfterFilter(() => setCategory(event.target.value as CategoryFilter))} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-700">
          <option value="All">All categories</option>
          <option value="Work">Work</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="System">System</option>
        </select>
        <label className="sr-only" htmlFor="notification-read-state">Filter by read status</label>
        <select id="notification-read-state" value={readFilter} onChange={(event) => reloadAfterFilter(() => setReadFilter(event.target.value as ReadFilter))} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-700">
          <option value="All">All notifications</option>
          <option value="Unread">Unread only</option>
        </select>
      </section>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <section className="overflow-hidden rounded-2xl border border-black/6 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading notifications…</div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <Bell className="mx-auto h-7 w-7 text-neutral-300" />
            <p className="mt-3 text-sm font-semibold text-neutral-700">You’re all caught up</p>
            <p className="mt-1 text-xs text-neutral-500">New assignments and updates for you will appear here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-black/5">
            {notifications.map((notification) => {
              const href = safeEmployeeHref(notification.href);
              return (
                <li key={notification.id} className={`p-4 sm:px-5 ${notification.read ? "" : "bg-red-50/40"}`}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${notification.read ? "bg-neutral-100 text-neutral-500" : "bg-red-100 text-red-700"}`}>
                      <Bell className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-bold text-neutral-900">{notification.title}</h2>
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-500">{notification.category}</span>
                        {!notification.read && <span className="h-2 w-2 rounded-full bg-red-600" aria-label="Unread" />}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-neutral-600">{notification.description}</p>
                      <p className="mt-2 text-[11px] text-neutral-400" title={formatDateTime(notification.timestamp)}>{timeAgo(notification.timestamp)}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {href && <Link href={href} className="inline-flex items-center gap-1 text-xs font-bold text-red-700 hover:text-red-800">Open assigned item <ExternalLink className="h-3 w-3" /></Link>}
                        <button type="button" onClick={() => void toggleRead(notification)} disabled={savingId === notification.id || savingAll} className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-900 disabled:opacity-50">
                          {savingId === notification.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          Mark as {notification.read ? "unread" : "read"}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {!loading && totalPages > 1 && <EmployeePagination page={page} totalPages={totalPages} onChange={(nextPage) => { setLoading(true); setPage(nextPage); }} />}
      </section>
    </div>
  );
}
