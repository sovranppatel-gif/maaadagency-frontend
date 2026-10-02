"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, MessageCircle, ClipboardList, Settings2, CheckCheck } from "lucide-react";
import { Card } from "@/components/master-admin/ui/Card";
import { EmptyState } from "@/components/master-admin/ui/EmptyState";
import { useToast } from "@/components/master-admin/ui/ToastProvider";
import { getNotifications, markAllRead, markRead } from "@/lib/api/notifications";
import { formatDateTime } from "@/lib/format";
import type { AppNotification, NotificationCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const tabs: { label: string; value: NotificationCategory | "All" | "Unread" }[] = [
  { label: "All", value: "All" },
  { label: "Unread", value: "Unread" },
  { label: "Work", value: "Work" },
  { label: "WhatsApp", value: "WhatsApp" },
  { label: "System", value: "System" },
];

const categoryIcon: Record<NotificationCategory, typeof Bell> = {
  Work: ClipboardList,
  WhatsApp: MessageCircle,
  System: Settings2,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [tab, setTab] = useState<(typeof tabs)[number]["value"]>("All");
  const { push } = useToast();

  function fetchForTab() {
    return tab === "Unread" ? getNotifications("All", true) : getNotifications(tab as NotificationCategory | "All");
  }

  useEffect(() => {
    fetchForTab().then(setNotifications);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function handleMarkAll() {
    await markAllRead();
    setNotifications(await fetchForTab());
    push({ kind: "success", title: "All notifications marked as read" });
  }

  async function handleClick(n: AppNotification) {
    if (!n.read) {
      await markRead(n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
  }

  return (
    <div className="space-y-6">
      <Card padded={false} className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
                  tab === t.value ? "bg-brand-red text-white" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleMarkAll}
            className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all as read
          </button>
        </div>
      </Card>

      <Card>
        {notifications.length === 0 ? (
          <EmptyState icon={Bell} title="You're all caught up" description="No notifications to show here." />
        ) : (
          <ul className="divide-y divide-black/5">
            {notifications.map((n) => {
              const Icon = categoryIcon[n.category];
              const content = (
                <div
                  className={cn(
                    "flex items-start gap-3 px-2 py-3.5 transition-colors hover:bg-neutral-50 sm:px-3",
                    !n.read && "bg-red-50/30"
                  )}
                >
                  <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", !n.read ? "bg-brand-red/10 text-brand-red" : "bg-neutral-100 text-neutral-400")}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm", !n.read ? "font-bold text-neutral-900" : "font-semibold text-neutral-600")}>{n.title}</p>
                      {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red" />}
                    </div>
                    <p className="mt-0.5 text-sm text-neutral-500">{n.description}</p>
                    <p className="mt-1 text-xs text-neutral-400">{formatDateTime(n.timestamp)}</p>
                  </div>
                </div>
              );
              return (
                <li key={n.id} onClick={() => handleClick(n)}>
                  {n.href ? (
                    <Link href={n.href} className="block">
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
