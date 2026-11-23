"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  FileText,
  Info,
  Paperclip,
  Phone,
  Send,
  Smile,
  Sparkles,
} from "lucide-react";
import type { WhatsAppConversation, WhatsAppMessage } from "@/lib/types";
import { Avatar } from "../ui/Avatar";
import { useDirectory } from "@/lib/directory";
import { quickReplies } from "@/lib/mock-data/bot-flow";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

function Ticks({ status }: { status: WhatsAppMessage["status"] }) {
  if (status === "sent") return <Check className="h-3.5 w-3.5 text-neutral-400" />;
  if (status === "delivered") return <CheckCheck className="h-3.5 w-3.5 text-neutral-400" />;
  if (status === "read") return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
  return <span className="text-[10px] text-brand-red">failed</span>;
}

export function ChatWindow({
  conversation,
  messages,
  onSend,
  onBack,
  onShowDetails,
  sending = false,
}: {
  conversation: WhatsAppConversation | null;
  messages: WhatsAppMessage[];
  onSend: (text: string) => void;
  onBack?: () => void;
  onShowDetails?: () => void;
  sending?: boolean;
}) {
  const { employeeById } = useDirectory();
  const [text, setText] = useState("");
  const [quickOpen, setQuickOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const employee = employeeById(conversation?.assignedEmployeeId);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, conversation?.id]);

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-neutral-400">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
          <Send className="h-6 w-6" />
        </span>
        <p className="text-sm font-medium">Select a conversation to start chatting</p>
      </div>
    );
  }

  function handleSend() {
    if (!text.trim() || sending) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-black/6 px-4 py-3">
        {onBack && (
          <button type="button" onClick={onBack} className="text-neutral-400 hover:text-neutral-700 lg:hidden" aria-label="Back to conversations">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <Avatar name={conversation.clientName} color={conversation.avatarColor} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-neutral-800">{conversation.clientName}</p>
          <p className="truncate text-xs text-neutral-400">
            {conversation.phone} · {conversation.online ? <span className="text-emerald-600">online</span> : conversation.lastSeen}
          </p>
        </div>
        {employee && (
          <div className="hidden items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600 sm:flex">
            <Avatar name={employee.name} size="xs" color={employee.avatarColor} />
            {employee.name.split(" ")[0]}
          </div>
        )}
        <a href={`tel:${conversation.phone.replace(/\s+/g, "")}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100" aria-label="Call client">
          <Phone className="h-4 w-4" />
        </a>
        <button type="button" onClick={onShowDetails} className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 xl:hidden" aria-label="Client details">
          <Info className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-[#efeae2] bg-[radial-gradient(#00000008_1px,transparent_1px)] bg-[size:16px_16px] px-4 py-4">
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn("flex", m.direction === "outbound" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm sm:max-w-[65%]",
                m.direction === "outbound" ? "rounded-tr-sm bg-[#dcf8c6] text-neutral-800" : "rounded-tl-sm bg-white text-neutral-800"
              )}
            >
              {m.messageType === "image" && m.mediaUrl && (
                <div className="mb-1.5 overflow-hidden rounded-lg">
                  <Image src={m.mediaUrl} alt={m.mediaName || "shared image"} width={280} height={180} className="h-auto w-full object-cover" />
                </div>
              )}
              {m.messageType === "document" && (
                <div className="mb-1.5 flex items-center gap-2 rounded-lg bg-black/5 px-2.5 py-2">
                  <FileText className="h-4 w-4 text-neutral-500" />
                  <span className="text-xs font-semibold text-neutral-700">{m.mediaName}</span>
                </div>
              )}
              {m.message && <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>}
              <div className="mt-1 flex items-center justify-end gap-1">
                <span className="text-[10px] text-neutral-400">{formatTime(m.timestamp)}</span>
                {m.direction === "outbound" && <Ticks status={m.status} />}
              </div>
            </div>
          </motion.div>
        ))}
        {messages.length === 0 && (
          <p className="py-10 text-center text-xs text-neutral-400">No messages yet in this conversation.</p>
        )}
      </div>

      <div className="relative border-t border-black/6 bg-white p-3">
        <AnimatePresence>
          {quickOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-full left-3 right-3 mb-2 flex flex-wrap gap-1.5 rounded-xl border border-black/8 bg-white p-2.5 shadow-xl"
            >
              {quickReplies.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setText(q.message);
                    setQuickOpen(false);
                  }}
                  className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-red-50 hover:text-brand-red"
                >
                  {q.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setQuickOpen((v) => !v)}
            className={cn(
              "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold",
              quickOpen ? "bg-brand-red text-white" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Quick Replies
          </button>
          <button type="button" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100" aria-label="Attach file">
            <Paperclip className="h-4 w-4" />
          </button>
          <button type="button" className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 sm:flex" aria-label="Emoji">
            <Smile className="h-4 w-4" />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !sending && handleSend()}
            disabled={sending}
            placeholder="Type a message..."
            className="min-w-0 flex-1 rounded-full bg-neutral-100 px-4 py-2.5 text-sm outline-none placeholder:text-neutral-400 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-red text-white disabled:opacity-40"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
