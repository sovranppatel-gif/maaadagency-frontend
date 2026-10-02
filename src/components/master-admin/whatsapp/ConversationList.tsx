"use client";

import { Search } from "lucide-react";
import type { ConversationFilter, WhatsAppConversation } from "@/lib/types";
import { Avatar } from "../ui/Avatar";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const filters: ConversationFilter[] = ["All", "Unread", "New Leads", "Assigned", "Active", "Completed"];

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  search,
  onSearch,
  filter,
  onFilter,
}: {
  conversations: WhatsAppConversation[];
  activeId?: string;
  onSelect: (c: WhatsAppConversation) => void;
  search: string;
  onSearch: (v: string) => void;
  filter: ConversationFilter;
  onFilter: (f: ConversationFilter) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-black/6 p-3">
        <div className="flex items-center gap-2 rounded-xl bg-neutral-100 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
          />
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFilter(f)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors",
                filter === f ? "bg-brand-red text-white" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto">
        {conversations.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c)}
              className={cn(
                "flex w-full items-start gap-3 border-b border-black/5 px-3.5 py-3 text-left transition-colors",
                activeId === c.id ? "bg-red-50/60" : "hover:bg-neutral-50"
              )}
            >
              <div className="relative shrink-0">
                <Avatar name={c.clientName} color={c.avatarColor} />
                {c.online && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-neutral-800">{c.clientName}</p>
                  {c.humanHandoff && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">Needs human</span>
                  )}
                  <span className="ml-auto shrink-0 text-[11px] text-neutral-400">{timeAgo(c.lastMessageAt)}</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-neutral-500">{c.lastMessage}</p>
                  {c.unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </li>
        ))}
        {conversations.length === 0 && (
          <li className="px-4 py-16 text-center text-sm text-neutral-400">No conversations match this filter.</li>
        )}
      </ul>
    </div>
  );
}
