"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, ExternalLink, Phone, UserPlus } from "lucide-react";
import type { Lead, WhatsAppConversation } from "@/lib/types";
import { Avatar } from "../ui/Avatar";
import { StatusBadge } from "../ui/StatusBadge";
import { getLead } from "@/lib/api/leads";
import { useDirectory } from "@/lib/directory";
import { formatDate } from "@/lib/format";

export function ClientDetailsPanel({
  conversation,
  onBack,
  onAssign,
}: {
  conversation: WhatsAppConversation | null;
  onBack?: () => void;
  onAssign?: () => void;
}) {
  const { clientById, employeeById } = useDirectory();
  const [lead, setLead] = useState<Lead | undefined>(undefined);

  useEffect(() => {
    if (!conversation?.leadId) {
      setLead(undefined);
      return;
    }
    let active = true;
    getLead(conversation.leadId).then((l) => {
      if (active) setLead(l);
    });
    return () => {
      active = false;
    };
  }, [conversation?.leadId]);

  if (!conversation) {
    return <div className="flex h-full items-center justify-center p-6 text-center text-sm text-neutral-400">Select a conversation</div>;
  }

  const client = clientById(conversation.clientId);
  const employee = employeeById(conversation.assignedEmployeeId);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-center gap-2 border-b border-black/6 px-4 py-3">
        {onBack && (
          <button type="button" onClick={onBack} className="text-neutral-400 hover:text-neutral-700 lg:hidden" aria-label="Back to chat">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <p className="text-sm font-bold text-neutral-800">Client Details</p>
      </div>

      <div className="flex flex-col items-center border-b border-black/6 p-6 text-center">
        <Avatar name={conversation.clientName} color={conversation.avatarColor} size="lg" />
        <p className="mt-3 text-base font-bold text-neutral-900">{conversation.clientName}</p>
        <p className="text-sm text-neutral-500">{conversation.phone}</p>
        {client?.company && <p className="mt-1 flex items-center gap-1 text-xs text-neutral-400"><Building2 className="h-3 w-3" />{client.company}</p>}
        <div className="mt-3 flex gap-2">
          <a href={`tel:${conversation.phone.replace(/\s+/g, "")}`} className="flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-neutral-50">
            <Phone className="h-3.5 w-3.5" />
            Call
          </a>
          {client && (
            <Link href={`/master-admin/clients/${client.id}`} className="flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-neutral-50">
              <ExternalLink className="h-3.5 w-3.5" />
              Profile
            </Link>
          )}
        </div>
      </div>

      {lead && (
        <div className="border-b border-black/6 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-400">Requirement</p>
          <p className="text-sm font-semibold text-neutral-800">{lead.requirement}</p>
          <p className="mt-1 text-xs text-neutral-500">{lead.service}</p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">{lead.description}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-500">Budget: {lead.budget || "—"}</span>
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-500">Deadline: {formatDate(lead.deadline)}</span>
          </div>
          <div className="mt-3">
            <StatusBadge status={lead.status} />
          </div>
          <Link href={`/master-admin/leads/${lead.id}`} className="mt-3 block text-xs font-bold text-brand-red">
            View full lead →
          </Link>
        </div>
      )}

      <div className="p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-400">Assigned Employee</p>
        {employee ? (
          <div className="flex items-center gap-2.5">
            <Avatar name={employee.name} color={employee.avatarColor} size="sm" />
            <div>
              <p className="text-sm font-bold text-neutral-800">{employee.name}</p>
              <p className="text-xs text-neutral-500">{employee.role}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-400">Not assigned yet.</p>
        )}
        <button
          type="button"
          onClick={onAssign}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-black/15 py-2.5 text-sm font-semibold text-neutral-500 hover:border-brand-red/40 hover:text-brand-red"
        >
          <UserPlus className="h-4 w-4" />
          {employee ? "Reassign" : "Assign Employee"}
        </button>
      </div>
    </div>
  );
}
