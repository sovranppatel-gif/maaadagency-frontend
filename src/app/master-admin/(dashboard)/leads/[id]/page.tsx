"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Globe,
  Wallet,
  CalendarClock,
  MessageCircle,
  UserPlus,
  ClipboardPlus,
  Pencil,
  Paperclip,
} from "lucide-react";
import { Card, CardHeader } from "@/components/master-admin/ui/Card";
import { StatusBadge } from "@/components/master-admin/ui/StatusBadge";
import { PriorityBadge } from "@/components/master-admin/ui/PriorityBadge";
import { Avatar } from "@/components/master-admin/ui/Avatar";
import { ActivityTimeline } from "@/components/master-admin/ActivityTimeline";
import { AssignmentModal } from "@/components/master-admin/AssignmentModal";
import { CreateWorkModal } from "@/components/master-admin/CreateWorkModal";
import { LeadFormModal } from "@/components/master-admin/LeadFormModal";
import { LeadFollowUpAdminPanel } from "@/components/master-admin/LeadFollowUpAdminPanel";
import { LeadQuotationPanel } from "@/components/quotations/LeadQuotationPanel";
import { useToast } from "@/components/master-admin/ui/ToastProvider";
import { getLead, assignLead, updateLead, type LeadInput } from "@/lib/api/leads";
import { createWork } from "@/lib/api/works";
import { useDirectory } from "@/lib/directory";
import { useAuth } from "@/lib/auth-context";
import { formatDate, formatDateTime } from "@/lib/format";
import type { Lead } from "@/lib/types";

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null | undefined>(undefined);
  const [assignOpen, setAssignOpen] = useState(false);
  const [createWorkOpen, setCreateWorkOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { push } = useToast();
  const { employeeById } = useDirectory();
  const { user } = useAuth();
  const canManageLeads = user?.role !== "EMPLOYEE";

  useEffect(() => {
    getLead(id).then((data) => setLead(data ?? null));
  }, [id]);

  if (lead === null) notFound();
  if (lead === undefined) {
    return <div className="py-20 text-center text-sm text-neutral-400">Loading lead…</div>;
  }

  const employee = employeeById(lead.assignedEmployeeId);

  async function handleAssign(employeeId: string) {
    const updated = await assignLead(lead!.id, employeeId);
    if (updated) {
      setLead(updated);
      const emp = employeeById(employeeId);
      push({ kind: "success", title: "Lead assigned", description: `Assigned to ${emp?.name}.` });
    }
  }

  async function handleSave(data: LeadInput) {
    const updated = await updateLead(lead!.id, {
      contactPersonName: data.contactPersonName ?? "",
      alternatePhone: data.alternatePhone ?? "",
      email: data.email ?? "",
      service: data.service,
      requirement: data.requirement,
      description: data.description ?? "",
      quantitySizeDimensions: data.quantitySizeDimensions ?? "",
      budget: data.budget ?? "",
      source: data.source,
      priority: data.priority,
      enquiryDate: data.enquiryDate ?? "",
      deadline: data.deadline ?? "",
      internalRemarks: data.internalRemarks ?? "",
    });
    setLead(updated);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </button>
        <div className="flex flex-wrap gap-2">
          {canManageLeads && (
            <button
              type="button"
              onClick={() => setAssignOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-sm font-bold text-neutral-700 hover:bg-neutral-50"
            >
              <UserPlus className="h-4 w-4" />
              {employee ? "Reassign" : "Assign Employee"}
            </button>
          )}
          <Link
            href="/master-admin/whatsapp"
            className="flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-sm font-bold text-neutral-700 hover:bg-neutral-50"
          >
            <MessageCircle className="h-4 w-4" />
            Open WhatsApp
          </Link>
          {canManageLeads && (
            <>
              <button
                type="button"
                onClick={() => setCreateWorkOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-brand-red px-4 py-2 text-sm font-bold text-white hover:scale-[1.02] transition-transform"
              >
                <ClipboardPlus className="h-4 w-4" />
                Create Work
              </button>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-sm font-bold text-neutral-700 hover:bg-neutral-50"
              >
                <Pencil className="h-4 w-4" />
                Edit Lead
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Avatar name={lead.clientName} size="lg" />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold text-neutral-900">{lead.requirement}</h2>
            <span className="font-mono text-xs text-neutral-400">{lead.id}</span>
          </div>
          <p className="text-sm text-neutral-500">
            {lead.clientName} · {lead.service}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <PriorityBadge priority={lead.priority} />
          <StatusBadge status={lead.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Client Information" />
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-2.5">
                <Building2 className="mt-0.5 h-4 w-4 text-neutral-400" />
                <div>
                  <dt className="text-xs text-neutral-400">Name / Company</dt>
                  <dd className="text-sm font-semibold text-neutral-800">
                    {lead.clientName}
                    {lead.company && lead.company !== lead.clientName ? ` — ${lead.company}` : ""}
                  </dd>
                </div>
                {lead.contactPersonName && (
                  <div>
                    <dt className="text-xs text-neutral-400">Contact Person</dt>
                    <dd className="text-sm font-semibold text-neutral-800">{lead.contactPersonName}</dd>
                  </div>
                )}
              </div>
              {lead.alternatePhone && (
                <div className="flex items-start gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 text-neutral-400" />
                  <div>
                    <dt className="text-xs text-neutral-400">Alternate Mobile</dt>
                    <dd className="text-sm font-semibold text-neutral-800">{lead.alternatePhone}</dd>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 text-neutral-400" />
                <div>
                  <dt className="text-xs text-neutral-400">Phone</dt>
                  <dd className="text-sm font-semibold text-neutral-800">{lead.phone}</dd>
                </div>
              </div>
              {lead.email && (
                <div className="flex items-start gap-2.5">
                  <Mail className="mt-0.5 h-4 w-4 text-neutral-400" />
                  <div>
                    <dt className="text-xs text-neutral-400">Email</dt>
                    <dd className="text-sm font-semibold text-neutral-800">{lead.email}</dd>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2.5">
                <Globe className="mt-0.5 h-4 w-4 text-neutral-400" />
                <div>
                  <dt className="text-xs text-neutral-400">Source</dt>
                  <dd className="text-sm font-semibold text-neutral-800">{lead.source}</dd>
                </div>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Requirement" />
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-neutral-400">Service</dt>
                <dd className="text-sm font-semibold text-neutral-800">{lead.service}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-400">Title</dt>
                <dd className="text-sm font-semibold text-neutral-800">{lead.requirement}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-neutral-400">Description</dt>
                <dd className="mt-1 text-sm leading-relaxed text-neutral-700">{lead.description}</dd>
              </div>
              {lead.quantitySizeDimensions && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-neutral-400">Quantity / Size / Dimensions</dt>
                  <dd className="mt-1 text-sm text-neutral-700">{lead.quantitySizeDimensions}</dd>
                </div>
              )}
              {lead.referenceWebsite && (
                <div>
                  <dt className="text-xs text-neutral-400">Reference Website</dt>
                  <dd className="text-sm font-semibold text-blue-600">{lead.referenceWebsite}</dd>
                </div>
              )}
              <div className="flex items-start gap-2.5">
                <CalendarClock className="mt-0.5 h-4 w-4 text-neutral-400" />
                <div>
                  <dt className="text-xs text-neutral-400">Expected Completion</dt>
                  <dd className="text-sm font-semibold text-neutral-800">{formatDate(lead.deadline)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Wallet className="mt-0.5 h-4 w-4 text-neutral-400" />
                <div>
                  <dt className="text-xs text-neutral-400">Budget</dt>
                  <dd className="text-sm font-semibold text-neutral-800">{lead.budget || "Not specified"}</dd>
                </div>
              </div>
            </dl>
            {lead.internalRemarks && (
              <div className="mt-4 rounded-xl bg-amber-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Internal Remarks</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{lead.internalRemarks}</p>
              </div>
            )}
          </Card>

          <LeadFollowUpAdminPanel leadId={lead.id} />
          <LeadQuotationPanel leadId={lead.id} audience="admin" />

          <Card>
            <CardHeader title="WhatsApp Conversation" subtitle="Preview of the latest messages." action={
              <Link href="/master-admin/whatsapp" className="text-xs font-bold text-brand-red">
                Open full conversation →
              </Link>
            } />
            <div className="rounded-xl bg-[#e5ddd5]/40 p-4">
              <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-[#dcf8c6] px-3.5 py-2 text-sm text-neutral-800 shadow-sm">
                {lead.description}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Attachments" />
            {lead.attachments.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-neutral-400">
                <Paperclip className="h-4 w-4" /> No attachments shared yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {lead.attachments.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 rounded-lg border border-black/6 px-3 py-2 text-sm">
                    <Paperclip className="h-4 w-4 text-neutral-400" />
                    {a.name}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Assignment" />
            {employee ? (
              <div className="flex items-center gap-3">
                <Avatar name={employee.name} color={employee.avatarColor} />
                <div>
                  <p className="text-sm font-bold text-neutral-800">{employee.name}</p>
                  <p className="text-xs text-neutral-500">{employee.role}</p>
                  <p className="mt-1 text-[11px] text-neutral-400">Assigned {formatDate(lead.assignedDate)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-400">Not yet assigned to an employee.</p>
            )}
            <button
              type="button"
              onClick={() => setAssignOpen(true)}
              className="mt-4 w-full rounded-xl border border-dashed border-black/15 py-2.5 text-sm font-semibold text-neutral-500 hover:border-brand-red/40 hover:text-brand-red"
            >
              {employee ? "Reassign Employee" : "Assign Employee"}
            </button>
          </Card>

          <Card>
            <CardHeader title="Activity Timeline" />
            <ActivityTimeline items={lead.activity} />
          </Card>
          <Card>
            <CardHeader title="Record Timestamps" />
            <div className="space-y-2 text-sm">
              <p className="flex justify-between gap-3"><span className="text-neutral-500">Enquiry received</span><span className="font-semibold text-neutral-800">{formatDateTime(lead.enquiryDate ?? lead.createdAt)}</span></p>
              <p className="flex justify-between gap-3"><span className="text-neutral-500">Created</span><span className="font-semibold text-neutral-800">{formatDateTime(lead.createdAt)}</span></p>
              <p className="flex justify-between gap-3"><span className="text-neutral-500">Last updated</span><span className="font-semibold text-neutral-800">{formatDateTime(lead.updatedAt)}</span></p>
            </div>
          </Card>
        </div>
      </div>

      <AssignmentModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign Lead"
        description={`Assign ${lead.clientName}'s requirement to an employee.`}
        onAssign={handleAssign}
      />
      {canManageLeads && editOpen && (
        <LeadFormModal
          open={editOpen}
          lead={lead}
          onClose={() => setEditOpen(false)}
          onSave={handleSave}
        />
      )}
      <CreateWorkModal
        open={createWorkOpen}
        onClose={() => setCreateWorkOpen(false)}
        onCreate={async (data) => {
          await createWork({
            ...data,
            leadId: lead.id,
            clientId: lead.clientId,
            clientName: lead.clientName,
            title: data.title || lead.requirement,
            service: lead.service,
            description: data.description || lead.description,
            deadline: data.deadline || lead.deadline,
          });
          push({ kind: "success", title: "Work created", description: "New work item created from this lead." });
        }}
      />
    </div>
  );
}
