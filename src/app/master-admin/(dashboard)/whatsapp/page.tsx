"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Inbox as InboxIcon, AlertCircle, Loader } from "lucide-react";
import { ConversationList } from "@/components/master-admin/whatsapp/ConversationList";
import { ChatWindow } from "@/components/master-admin/whatsapp/ChatWindow";
import { ClientDetailsPanel } from "@/components/master-admin/whatsapp/ClientDetailsPanel";
import { BotFlowPanel } from "@/components/master-admin/whatsapp/BotFlowPanel";
import { AiSettingsCard } from "@/components/master-admin/whatsapp/AiSettingsCard";
import { FaqPanel } from "@/components/master-admin/whatsapp/FaqPanel";
import { AssignmentModal } from "@/components/master-admin/AssignmentModal";
import { useToast } from "@/components/master-admin/ui/ToastProvider";
import { getConversations, getMessages, sendMessage, markConversationRead } from "@/lib/api/whatsapp";
import { assignLead } from "@/lib/api/leads";
import type { ConversationFilter, WhatsAppConversation, WhatsAppMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

type MobileView = "list" | "chat" | "details";

export default function WhatsAppInboxPage() {
  const [tab, setTab] = useState<"inbox" | "bot">("inbox");
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ConversationFilter>("All");
  const [activeId, setActiveId] = useState<string | undefined>();
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [mobileView, setMobileView] = useState<MobileView>("list");
  const [assignOpen, setAssignOpen] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const { push } = useToast();

  useEffect(() => {
    loadConversationsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search]);

  async function loadConversationsData() {
    setLoadingConversations(true);
    setConversationsError(null);
    try {
      const data = await getConversations(filter, search);
      setConversations(data);
      if (!activeId && data[0]) setActiveId(data[0].id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load conversations";
      setConversationsError(message);
      push({ kind: "error", title: "Failed to load conversations", description: message });
    } finally {
      setLoadingConversations(false);
    }
  }

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    loadMessagesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  async function loadMessagesData() {
    setLoadingMessages(true);
    setMessagesError(null);
    try {
      const data = await getMessages(activeId!);
      setMessages(data);
      await markConversationRead(activeId!).then(() => {
        setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c)));
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load messages";
      setMessagesError(message);
      push({ kind: "error", title: "Failed to load messages", description: message });
    } finally {
      setLoadingMessages(false);
    }
  }

  const active = useMemo(() => conversations.find((c) => c.id === activeId) ?? null, [conversations, activeId]);

  function selectConversation(c: WhatsAppConversation) {
    setActiveId(c.id);
    setMobileView("chat");
  }

  async function handleSend(text: string) {
    if (!activeId) return;
    setSendingMessage(true);
    try {
      const msg = await sendMessage(activeId, text);
      setMessages((prev) => [...prev, msg]);
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, lastMessage: text, lastMessageAt: msg.timestamp } : c))
      );
      push({ kind: "success", title: "Message sent" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message";
      push({ kind: "error", title: "Failed to send message", description: message });
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleAssign(employeeId: string) {
    if (!active?.leadId) {
      push({ kind: "info", title: "No linked lead", description: "This conversation isn't linked to a lead yet." });
      return;
    }
    try {
      const updated = await assignLead(active.leadId, employeeId);
      if (updated) {
        setConversations((prev) => prev.map((c) => (c.id === active.id ? { ...c, assignedEmployeeId: employeeId } : c)));
        push({ kind: "success", title: "Employee assigned" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to assign employee";
      push({ kind: "error", title: "Failed to assign employee", description: message });
    }
  }

  return (
    <div className="flex h-[calc(100dvh-var(--chrome-h,6rem))] min-h-[520px] flex-col gap-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("inbox")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors",
            tab === "inbox" ? "bg-brand-red text-white" : "bg-white text-neutral-500 hover:bg-neutral-100"
          )}
        >
          <InboxIcon className="h-4 w-4" />
          Inbox
        </button>
        <button
          type="button"
          onClick={() => setTab("bot")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors",
            tab === "bot" ? "bg-brand-red text-white" : "bg-white text-neutral-500 hover:bg-neutral-100"
          )}
        >
          <Bot className="h-4 w-4" />
          Bot Flow
        </button>
      </div>

      {tab === "bot" ? (
        <div className="flex-1 space-y-4 overflow-y-auto">
          <AiSettingsCard />
          <BotFlowPanel />
          <FaqPanel />
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-1 overflow-hidden rounded-2xl border border-black/6 bg-white shadow-sm lg:grid-cols-[320px_1fr_320px]">
          <div className={cn("min-h-0 border-black/6 lg:block lg:border-r", mobileView === "list" ? "block" : "hidden")}>
            {loadingConversations ? (
              <div className="flex h-full items-center justify-center text-neutral-400">
                <div className="text-center">
                  <Loader className="mx-auto mb-2 h-5 w-5 animate-spin" />
                  <p className="text-sm">Loading conversations…</p>
                </div>
              </div>
            ) : conversationsError ? (
              <div className="flex h-full items-center justify-center p-4">
                <div className="text-center">
                  <AlertCircle className="mx-auto mb-2 h-5 w-5 text-brand-red" />
                  <p className="text-sm font-semibold text-neutral-800">Failed to load</p>
                  <p className="mt-1 text-xs text-neutral-500">{conversationsError}</p>
                  <button
                    type="button"
                    onClick={loadConversationsData}
                    className="mt-3 rounded-lg bg-brand-red px-3 py-1.5 text-xs font-bold text-white hover:scale-[1.02] transition-transform"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <ConversationList
                conversations={conversations}
                activeId={activeId}
                onSelect={selectConversation}
                search={search}
                onSearch={setSearch}
                filter={filter}
                onFilter={setFilter}
              />
            )}
          </div>
          <div className={cn("min-h-0 lg:block", mobileView === "chat" ? "block" : "hidden")}>
            {loadingMessages ? (
              <div className="flex h-full items-center justify-center text-neutral-400">
                <div className="text-center">
                  <Loader className="mx-auto mb-2 h-5 w-5 animate-spin" />
                  <p className="text-sm">Loading messages…</p>
                </div>
              </div>
            ) : messagesError ? (
              <div className="flex h-full items-center justify-center p-4">
                <div className="text-center">
                  <AlertCircle className="mx-auto mb-2 h-5 w-5 text-brand-red" />
                  <p className="text-sm font-semibold text-neutral-800">Failed to load messages</p>
                  <p className="mt-1 text-xs text-neutral-500">{messagesError}</p>
                  <button
                    type="button"
                    onClick={loadMessagesData}
                    className="mt-3 rounded-lg bg-brand-red px-3 py-1.5 text-xs font-bold text-white hover:scale-[1.02] transition-transform"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <ChatWindow
                conversation={active}
                messages={messages}
                onSend={handleSend}
                onBack={() => setMobileView("list")}
                onShowDetails={() => setMobileView("details")}
                sending={sendingMessage}
              />
            )}
          </div>
          <div className={cn("min-h-0 border-black/6 lg:block lg:border-l", mobileView === "details" ? "block" : "hidden")}>
            <ClientDetailsPanel conversation={active} onBack={() => setMobileView("chat")} onAssign={() => setAssignOpen(true)} />
          </div>
        </div>
      )}

      <AssignmentModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign Conversation"
        description={active ? `Assign ${active.clientName}'s requirement to an employee.` : undefined}
        onAssign={handleAssign}
      />
    </div>
  );
}
