"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, MessageCircle, FolderKanban } from "lucide-react";
import { Card, CardHeader } from "@/components/master-admin/ui/Card";
import { Avatar } from "@/components/master-admin/ui/Avatar";
import { StatusBadge } from "@/components/master-admin/ui/StatusBadge";
import { LeadTable } from "@/components/master-admin/LeadTable";
import { WorkTable } from "@/components/master-admin/WorkTable";
import { getClientDetail, type ClientDetail } from "@/lib/api/clients";
import { formatDate } from "@/lib/format";

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null | undefined>(undefined);

  useEffect(() => {
    getClientDetail(id).then((data) => setClient(data ?? null));
  }, [id]);

  if (client === null) notFound();
  if (client === undefined) return <div className="py-20 text-center text-sm text-neutral-400">Loading…</div>;

  const clientLeads = client.leads;
  const clientWorks = client.works;
  const clientProjects = client.projects;

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800">
        <ArrowLeft className="h-4 w-4" />
        Back to Clients
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center text-center lg:col-span-1">
          <Avatar name={client.name} color={client.avatarColor} size="lg" />
          <h2 className="mt-3 text-lg font-extrabold text-neutral-900">{client.name}</h2>
          {client.company && <p className="text-sm text-neutral-500">{client.company}</p>}
          <div className="mt-5 w-full space-y-2 border-t border-black/6 pt-4 text-left text-sm">
            <p className="flex items-center gap-2 text-neutral-600">
              <Phone className="h-4 w-4 text-neutral-400" /> {client.phone}
            </p>
            {client.email && (
              <p className="flex items-center gap-2 text-neutral-600">
                <Mail className="h-4 w-4 text-neutral-400" /> {client.email}
              </p>
            )}
            <p className="text-xs text-neutral-400">Client since {formatDate(client.createdAt)}</p>
          </div>
          {client.conversationId && (
            <Link
              href="/master-admin/whatsapp"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red py-2.5 text-sm font-bold text-white hover:scale-[1.02] transition-transform"
            >
              <MessageCircle className="h-4 w-4" />
              Open WhatsApp Chat
            </Link>
          )}
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center">
              <p className="text-2xl font-extrabold text-neutral-900">{client.totalLeads}</p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">Total Leads</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-extrabold text-neutral-900">{client.activeProjects}</p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">Active Projects</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-extrabold text-neutral-900">{client.completedProjects}</p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">Completed</p>
            </Card>
          </div>

          {clientProjects.length > 0 && (
            <Card>
              <CardHeader title="Projects" />
              <div className="space-y-2">
                {clientProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/master-admin/projects/${p.id}`}
                    className="flex items-center justify-between rounded-xl border border-black/6 p-3 hover:bg-neutral-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderKanban className="h-4 w-4 text-neutral-400" />
                      <span className="text-sm font-semibold text-neutral-800">{p.name}</span>
                    </div>
                    <StatusBadge status={p.status} />
                  </Link>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Requirements / Leads" />
            {clientLeads.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-400">No leads yet.</p>
            ) : (
              <LeadTable leads={clientLeads} compact />
            )}
          </Card>

          <Card>
            <CardHeader title="Work History" />
            {clientWorks.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-400">No work history yet.</p>
            ) : (
              <WorkTable works={clientWorks} />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
