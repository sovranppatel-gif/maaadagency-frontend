"use client";

import Link from "next/link";
import { Eye, UserPlus, MessageCircle, Trash2 } from "lucide-react";
import type { Lead } from "@/lib/types";
import { Avatar } from "./ui/Avatar";
import { StatusBadge } from "./ui/StatusBadge";
import { PriorityBadge } from "./ui/PriorityBadge";
import { RowMenu } from "./ui/RowMenu";
import { useDirectory } from "@/lib/directory";
import { timeAgo } from "@/lib/format";

export function LeadTable({
  leads,
  compact = false,
  onAssign,
  onDelete,
}: {
  leads: Lead[];
  compact?: boolean;
  onAssign?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
}) {
  const { employeeById } = useDirectory();
  return (
    <div>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/8 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
              {!compact && <th className="whitespace-nowrap px-3 py-3">Lead ID</th>}
              <th className="whitespace-nowrap px-3 py-3">Client</th>
              <th className="whitespace-nowrap px-3 py-3">Phone</th>
              <th className="whitespace-nowrap px-3 py-3">Service</th>
              <th className="whitespace-nowrap px-3 py-3">Requirement</th>
              {!compact && <th className="whitespace-nowrap px-3 py-3">Source</th>}
              <th className="whitespace-nowrap px-3 py-3">Assigned To</th>
              <th className="whitespace-nowrap px-3 py-3">Priority</th>
              <th className="whitespace-nowrap px-3 py-3">Status</th>
              <th className="whitespace-nowrap px-3 py-3">Received</th>
              <th className="whitespace-nowrap px-3 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const employee = employeeById(lead.assignedEmployeeId);
              return (
                <tr key={lead.id} className="group border-b border-black/5 transition-colors hover:bg-neutral-50">
                  {!compact && (
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-neutral-400">{lead.id}</td>
                  )}
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={lead.clientName} size="sm" />
                      <div>
                        <p className="font-bold text-neutral-800">{lead.clientName}</p>
                        {lead.company && lead.company !== lead.clientName && (
                          <p className="text-xs text-neutral-400">{lead.company}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-neutral-600">{lead.phone}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-neutral-600">{lead.service}</td>
                  <td className="max-w-[180px] truncate px-3 py-3 text-neutral-600">{lead.requirement}</td>
                  {!compact && <td className="whitespace-nowrap px-3 py-3 text-neutral-600">{lead.source}</td>}
                  <td className="whitespace-nowrap px-3 py-3">
                    {employee ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={employee.name} size="xs" color={employee.avatarColor} />
                        <span className="text-neutral-700">{employee.name.split(" ")[0]}</span>
                      </div>
                    ) : (
                      <span className="text-neutral-400">Unassigned</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <PriorityBadge priority={lead.priority} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-neutral-400">{timeAgo(lead.createdAt)}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/master-admin/leads/${lead.id}`}
                        aria-label="View lead"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <RowMenu
                        actions={[
                          { label: "Assign Employee", icon: UserPlus, onClick: () => onAssign?.(lead) },
                          { label: "Open WhatsApp", icon: MessageCircle, onClick: () => {} },
                          ...(onDelete ? [{ label: "Delete Lead", icon: Trash2, destructive: true, onClick: () => onDelete(lead) }] : []),
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {leads.map((lead) => {
          const employee = employeeById(lead.assignedEmployeeId);
          return (
            <div key={lead.id} className="rounded-xl border border-black/6 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Avatar name={lead.clientName} size="sm" />
                  <div>
                    <p className="text-sm font-bold text-neutral-800">{lead.clientName}</p>
                    <p className="text-xs text-neutral-400">{lead.phone}</p>
                  </div>
                </div>
                <StatusBadge status={lead.status} />
              </div>
              <p className="mt-2.5 text-sm text-neutral-600">
                <span className="font-semibold text-neutral-800">{lead.service}</span> · {lead.requirement}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={lead.priority} />
                  <span className="text-xs text-neutral-400">{timeAgo(lead.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/master-admin/leads/${lead.id}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => onAssign?.(lead)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {employee && <p className="mt-2 text-xs text-neutral-400">Assigned to {employee.name}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
