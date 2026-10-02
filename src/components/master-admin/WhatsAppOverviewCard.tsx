"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Settings2, Wifi } from "lucide-react";
import { Card } from "./ui/Card";
import { getNotifications } from "@/lib/api/notifications";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";

export function WhatsAppOverviewCard({
  connected,
  messagesToday,
  activeChats,
  newLeads,
  unread,
}: {
  connected: boolean;
  messagesToday: number;
  activeChats: number;
  newLeads: number;
  unread: number;
}) {
  const [activity, setActivity] = useState<AppNotification[]>([]);

  useEffect(() => {
    getNotifications("WhatsApp").then(setActivity).catch(() => setActivity([]));
  }, []);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <MessageCircle className="h-4 w-4" />
            </span>
            <h3 className="text-base font-bold text-neutral-900">WhatsApp Business API</h3>
          </div>
        </div>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase",
            connected ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-brand-red"
          )}
        >
          <Wifi className="h-3 w-3" />
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {[
          { label: "Messages Today", value: messagesToday },
          { label: "Active Chats", value: activeChats },
          { label: "New Leads", value: newLeads },
          { label: "Unread Messages", value: unread },
        ].map((m) => (
          <div key={m.label} className="rounded-xl bg-neutral-50 p-3">
            <p className="text-xl font-extrabold text-neutral-900">{m.value}</p>
            <p className="mt-0.5 text-xs font-medium text-neutral-500">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/master-admin/whatsapp"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-red py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.02]"
        >
          <MessageCircle className="h-4 w-4" />
          Open WhatsApp Inbox
        </Link>
        <Link
          href="/master-admin/settings?tab=whatsapp"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50"
        >
          <Settings2 className="h-4 w-4" />
          Configure API
        </Link>
      </div>

      <div className="mt-5 border-t border-black/6 pt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-400">Live Activity</p>
        <ul className="space-y-3">
          {activity.length === 0 && <li className="text-sm text-neutral-400">No recent activity.</li>}
          {activity.slice(0, 4).map((a) => (
            <li key={a.id} className="flex gap-3 text-sm">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <div>
                <p className="text-neutral-700">{a.title}</p>
                <p className="text-xs text-neutral-400">{formatTime(a.timestamp)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
