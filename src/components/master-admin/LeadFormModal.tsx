"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Lead, LeadSource, Priority } from "@/lib/types";
import type { LeadInput } from "@/lib/api/leads";
import { useDirectory } from "@/lib/directory";
import { useToast } from "@/components/master-admin/ui/ToastProvider";
import { Modal } from "@/components/master-admin/ui/Modal";

const sources: LeadSource[] = ["Phone Call", "Office Walk-in", "Referral", "Website", "Other"];
const priorities: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

interface LeadFormValues {
  clientName: string;
  contactPersonName: string;
  phone: string;
  alternatePhone: string;
  email: string;
  service: string;
  requirement: string;
  quantitySizeDimensions: string;
  budget: string;
  source: LeadSource;
  assignedEmployeeId: string;
  priority: Priority;
  enquiryDate: string;
  deadline: string;
  internalRemarks: string;
}

function localDateInput(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateInput(value?: string) {
  return value ? value.slice(0, 10) : "";
}

export function LeadFormModal({
  open,
  lead,
  onClose,
  onSave,
}: {
  open: boolean;
  lead?: Lead | null;
  onClose: () => void;
  onSave: (data: LeadInput, idempotencyKey?: string) => Promise<void>;
}) {
  const { employees, services } = useDirectory();
  const { push } = useToast();
  const [values, setValues] = useState<LeadFormValues>(() => ({
    clientName: lead?.clientName ?? "",
    contactPersonName: lead?.contactPersonName ?? "",
    phone: lead?.phone ?? "",
    alternatePhone: lead?.alternatePhone ?? "",
    email: lead?.email ?? "",
    service: lead?.service ?? "",
    requirement: lead?.description || lead?.requirement || "",
    quantitySizeDimensions: lead?.quantitySizeDimensions ?? "",
    budget: lead?.budget ?? "",
    source: lead?.source ?? "Phone Call",
    assignedEmployeeId: "",
    priority: lead?.priority ?? "MEDIUM",
    enquiryDate: dateInput(lead?.enquiryDate ?? lead?.createdAt) || localDateInput(),
    deadline: dateInput(lead?.deadline),
    internalRemarks: lead?.internalRemarks ?? "",
  }));
  const [submitting, setSubmitting] = useState(false);
  const submissionKey = useRef<string | null>(null);
  const submitLock = useRef(false);

  function set<K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;

    const data: LeadInput = {
      clientName: values.clientName.trim(),
      contactPersonName: values.contactPersonName.trim() || undefined,
      phone: values.phone.trim(),
      alternatePhone: values.alternatePhone.trim() || undefined,
      company: values.clientName.trim(),
      email: values.email.trim() || undefined,
      service: values.service,
      requirement: values.requirement.trim(),
      description: values.requirement.trim(),
      quantitySizeDimensions: values.quantitySizeDimensions.trim() || undefined,
      budget: values.budget.trim() || undefined,
      source: values.source,
      assignedEmployeeId: values.assignedEmployeeId || undefined,
      priority: values.priority,
      enquiryDate: values.enquiryDate || undefined,
      deadline: values.deadline || undefined,
      internalRemarks: values.internalRemarks.trim() || undefined,
    };

    if (!lead && !submissionKey.current) submissionKey.current = crypto.randomUUID();
    const requestKey = lead ? undefined : submissionKey.current ?? undefined;
    submitLock.current = true;
    setSubmitting(true);
    try {
      await onSave(data, requestKey);
      push({ kind: "success", title: lead ? "Lead updated" : "Lead created" });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save this lead. Please try again.";
      push({ kind: "error", title: lead ? "Lead update failed" : "Lead creation failed", description: message });
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  const title = lead ? "Edit Lead" : "New Lead";
  const serviceOptions = services.filter((service) => service.status === "Active");
  if (lead?.service && !serviceOptions.some((service) => service.name === lead.service)) {
    serviceOptions.push({ id: lead.service, name: lead.service, description: "", icon: "", status: "Disabled", leadsCount: 0 });
  }

  return (
    <Modal
      open={open}
      onClose={submitting ? () => {} : onClose}
      title={title}
      description="Capture the enquiry details and assign it to your team."
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Client / Business Name *</span>
            <input
              required
              maxLength={160}
              value={values.clientName}
              onChange={(event) => set("clientName", event.target.value)}
              readOnly={!!lead}
              className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 read-only:bg-neutral-50"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Contact Person Name</span>
            <input
              maxLength={120}
              value={values.contactPersonName}
              onChange={(event) => set("contactPersonName", event.target.value)}
              className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Primary Mobile Number *</span>
            <input
              required
              type="tel"
              minLength={6}
              maxLength={30}
              autoComplete="tel"
              value={values.phone}
              onChange={(event) => set("phone", event.target.value)}
              readOnly={!!lead}
              className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 read-only:bg-neutral-50"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Alternate Mobile Number</span>
            <input
              type="tel"
              maxLength={30}
              value={values.alternatePhone}
              onChange={(event) => set("alternatePhone", event.target.value)}
              className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Email Address</span>
            <input
              type="email"
              maxLength={254}
              value={values.email}
              onChange={(event) => set("email", event.target.value)}
              className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Service Required *</span>
            <select
              required
              value={values.service}
              onChange={(event) => set("service", event.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
            >
              <option value="">Select a service</option>
              {serviceOptions.map((service) => (
                <option key={service.id} value={service.name}>
                  {service.name}{service.status === "Disabled" ? " (disabled)" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Requirement Description *</span>
          <textarea
            required
            minLength={3}
            maxLength={5000}
            rows={4}
            value={values.requirement}
            onChange={(event) => set("requirement", event.target.value)}
            className="w-full resize-y rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Quantity / Size / Dimensions</span>
            <input
              maxLength={300}
              value={values.quantitySizeDimensions}
              onChange={(event) => set("quantitySizeDimensions", event.target.value)}
              className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Estimated Budget (₹)</span>
            <input
              inputMode="decimal"
              maxLength={50}
              placeholder="e.g. 25000"
              value={values.budget}
              onChange={(event) => set("budget", event.target.value)}
              className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Lead Source *</span>
            <select
              required
              value={values.source}
              onChange={(event) => set("source", event.target.value as LeadSource)}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
            >
              {[...sources, ...(lead && !sources.includes(lead.source) ? [lead.source] : [])].map((source) => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Lead Priority *</span>
            <select
              value={values.priority}
              onChange={(event) => set("priority", event.target.value as Priority)}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>{priority.charAt(0) + priority.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </label>
          {!lead && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Assigned Sales Employee</span>
              <select
                value={values.assignedEmployeeId}
                onChange={(event) => set("assignedEmployeeId", event.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
              >
                <option value="">Unassigned</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Enquiry Date</span>
            <input
              type="date"
              value={values.enquiryDate}
              onChange={(event) => set("enquiryDate", event.target.value)}
              className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Expected Completion Date</span>
            <input
              type="date"
              value={values.deadline}
              onChange={(event) => set("deadline", event.target.value)}
              className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Internal Remarks</span>
          <textarea
            maxLength={2000}
            rows={3}
            value={values.internalRemarks}
            onChange={(event) => set("internalRemarks", event.target.value)}
            className="w-full resize-y rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
          />
        </label>

        <div className="flex justify-end gap-3 border-t border-black/6 pt-4">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-xl bg-brand-red px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {lead ? "Save Changes" : "Create Lead"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
