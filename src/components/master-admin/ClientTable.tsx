"use client";

import Link from "next/link";
import { Eye, MessageCircle } from "lucide-react";
import type { Client } from "@/lib/types";
import { Avatar } from "./ui/Avatar";
import { RowMenu } from "./ui/RowMenu";
import { formatDate } from "@/lib/format";

export function ClientTable({ clients }: { clients: Client[] }) {
  return (
    <div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/8 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
              <th className="whitespace-nowrap px-3 py-3">Client</th>
              <th className="whitespace-nowrap px-3 py-3">Company</th>
              <th className="whitespace-nowrap px-3 py-3">Phone</th>
              <th className="whitespace-nowrap px-3 py-3">Email</th>
              <th className="whitespace-nowrap px-3 py-3">Total Leads</th>
              <th className="whitespace-nowrap px-3 py-3">Active Projects</th>
              <th className="whitespace-nowrap px-3 py-3">Completed</th>
              <th className="whitespace-nowrap px-3 py-3">Last Contact</th>
              <th className="whitespace-nowrap px-3 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-black/5 transition-colors hover:bg-neutral-50">
                <td className="whitespace-nowrap px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={c.name} color={c.avatarColor} size="sm" />
                    <span className="font-bold text-neutral-800">{c.name}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-neutral-600">{c.company || "—"}</td>
                <td className="whitespace-nowrap px-3 py-3 text-neutral-600">{c.phone}</td>
                <td className="whitespace-nowrap px-3 py-3 text-neutral-600">{c.email || "—"}</td>
                <td className="whitespace-nowrap px-3 py-3 text-neutral-600">{c.totalLeads}</td>
                <td className="whitespace-nowrap px-3 py-3 text-neutral-600">{c.activeProjects}</td>
                <td className="whitespace-nowrap px-3 py-3 text-neutral-600">{c.completedProjects}</td>
                <td className="whitespace-nowrap px-3 py-3 text-xs text-neutral-400">{formatDate(c.lastContact)}</td>
                <td className="whitespace-nowrap px-3 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/master-admin/clients/${c.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
                      <Eye className="h-4 w-4" />
                    </Link>
                    <RowMenu actions={[{ label: "Open WhatsApp", icon: MessageCircle, onClick: () => {} }]} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {clients.map((c) => (
          <Link key={c.id} href={`/master-admin/clients/${c.id}`} className="block rounded-xl border border-black/6 p-3">
            <div className="flex items-center gap-2.5">
              <Avatar name={c.name} color={c.avatarColor} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-neutral-800">{c.name}</p>
                <p className="truncate text-xs text-neutral-400">{c.company || c.phone}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="font-bold text-neutral-800">{c.totalLeads}</p>
                <p className="text-neutral-400">Leads</p>
              </div>
              <div>
                <p className="font-bold text-neutral-800">{c.activeProjects}</p>
                <p className="text-neutral-400">Active</p>
              </div>
              <div>
                <p className="font-bold text-neutral-800">{c.completedProjects}</p>
                <p className="text-neutral-400">Done</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
