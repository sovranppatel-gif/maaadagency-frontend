"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { getClients } from "@/lib/api/clients";
import { getEmployeesPage } from "@/lib/api/employees";
import { getLeadsPage } from "@/lib/api/leads";
import {
  calculatePreviewLine,
  createQuotation,
  formatPaise,
  getQuotationCatalog,
  parseQuantityToMilli,
  parseRateToBps,
  parseRupeesToPaise,
  submitQuotation,
  updateQuotationDraft,
  type CreateQuotationInput,
  type Quotation,
  type QuotationDraftInput,
  type QuotationLineItemInput,
} from "@/lib/api/quotations";
import type { Client, Employee, Lead } from "@/lib/types";

type EditorLine = {
  serviceId: string;
  serviceName: string;
  description: string;
  quantity: string;
  unit: string;
  rate: string;
  discount: string;
  tax: string;
};

const blankLine = (): EditorLine => ({
  serviceId: "",
  serviceName: "",
  description: "",
  quantity: "1",
  unit: "each",
  rate: "0.00",
  discount: "0",
  tax: "0",
});

function numberAsMoney(value: number) {
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, "0")}`;
}

function rateAsPercent(value: number) {
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, "0")}`;
}

function dateInput(value?: string) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function editorLineFromQuote(item: Quotation["lineItems"][number]): EditorLine {
  return {
    serviceId: item.serviceId ?? "",
    serviceName: item.serviceName,
    description: item.description,
    quantity: `${Math.floor(item.quantityMilli / 1000)}.${String(item.quantityMilli % 1000).padStart(3, "0")}`.replace(/\.?0+$/, ""),
    unit: item.unit,
    rate: numberAsMoney(item.unitRatePaise),
    discount: rateAsPercent(item.discountBps),
    tax: rateAsPercent(item.taxRateBps),
  };
}

export function QuotationEditor({
  audience,
  quotation,
  initialLeadId,
  onSaved,
}: {
  audience: "admin" | "employee";
  quotation?: Quotation;
  initialLeadId?: string;
  onSaved?: (quotation: Quotation) => void;
}) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [salesEmployees, setSalesEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Array<{ id: string; name: string }>>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState(quotation?.leadId ?? initialLeadId ?? "");
  const [selectedClientId, setSelectedClientId] = useState(quotation?.clientId ?? "");
  const [assignedSalesEmployeeId, setAssignedSalesEmployeeId] = useState(quotation?.assignedSalesEmployeeId ?? "");
  const [lines, setLines] = useState<EditorLine[]>(quotation?.lineItems.map(editorLineFromQuote) ?? [blankLine()]);
  const [validFrom, setValidFrom] = useState(dateInput(quotation?.validFrom));
  const [validUntil, setValidUntil] = useState(dateInput(quotation?.validUntil));
  const [paymentTerms, setPaymentTerms] = useState(quotation?.paymentTerms ?? "");
  const [termsAndConditions, setTermsAndConditions] = useState(quotation?.termsAndConditions ?? "");
  const [internalNotes, setInternalNotes] = useState(quotation?.internalNotes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const createKey = useRef<string | null>(null);
  const transitionKey = useRef<string | null>(null);
  const [draftId, setDraftId] = useState(quotation?.id);

  useEffect(() => {
    let active = true;
    const requests: Array<Promise<unknown>> = [
      getQuotationCatalog(),
      getLeadsPage({ page: 1, limit: 100, sort: "-updatedAt" }),
    ];
    if (audience === "admin") {
      requests.push(getClients(), getEmployeesPage({ page: 1, limit: 100, status: "Active", department: "Sales" }));
    }

    Promise.all(requests)
      .then((results) => {
        if (!active) return;
        const [catalog, leadPage, clientList, employeePage] = results as [
          Array<{ id: string; name: string }>,
          { leads: Lead[] },
          Client[] | undefined,
          { employees: Employee[] } | undefined,
        ];
        setServices(catalog);
        setLeads(leadPage.leads);
        if (clientList) setClients(clientList);
        if (employeePage) setSalesEmployees(employeePage.employees);
        if (initialLeadId && !quotation) {
          const lead = leadPage.leads.find((item) => item.id === initialLeadId);
          if (lead) {
            setSelectedClientId(lead.clientId);
            setLines((current) => current.map((line, index) =>
              index === 0 && !line.serviceName ? { ...line, serviceName: lead.service } : line
            ));
          }
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load quotation options.");
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    return () => {
      active = false;
    };
  }, [audience, initialLeadId, quotation]);

  function updateLine(index: number, patch: Partial<EditorLine>) {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));
  }

  function buildPayload(): QuotationDraftInput {
    if (!validFrom || !validUntil) throw new Error("Choose both the valid-from and valid-until dates.");
    if (validUntil < validFrom) throw new Error("Valid until must be on or after valid from.");
    if (lines.length === 0) throw new Error("Add at least one service line.");

    const lineItems: QuotationLineItemInput[] = lines.map((line, index) => {
      const quantityMilli = parseQuantityToMilli(line.quantity);
      const unitRatePaise = parseRupeesToPaise(line.rate);
      const discountBps = parseRateToBps(line.discount);
      const taxRateBps = parseRateToBps(line.tax);
      if (!line.serviceName.trim()) throw new Error(`Enter a service for line ${index + 1}.`);
      if (quantityMilli === null) throw new Error(`Line ${index + 1}: quantity must be greater than zero with up to 3 decimals.`);
      if (unitRatePaise === null) throw new Error(`Line ${index + 1}: rate must be a non-negative INR amount with up to 2 decimals.`);
      if (discountBps === null || taxRateBps === null) throw new Error(`Line ${index + 1}: discount and tax must be between 0% and 100%.`);
      return {
        serviceId: line.serviceId || undefined,
        serviceName: line.serviceName.trim(),
        description: line.description.trim(),
        quantityMilli,
        unit: line.unit.trim() || "each",
        unitRatePaise,
        discountBps,
        taxRateBps,
      };
    });

    return {
      lineItems,
      validFrom: `${validFrom}T00:00:00.000Z`,
      validUntil: `${validUntil}T23:59:59.999Z`,
      currency: "INR",
      paymentTerms: paymentTerms.trim(),
      termsAndConditions: termsAndConditions.trim(),
      internalNotes: internalNotes.trim(),
    };
  }

  const preview = lines.map((line) => {
    const quantityMilli = parseQuantityToMilli(line.quantity);
    const unitRatePaise = parseRupeesToPaise(line.rate);
    const discountBps = parseRateToBps(line.discount);
    const taxRateBps = parseRateToBps(line.tax);
    if (!quantityMilli || unitRatePaise === null || discountBps === null || taxRateBps === null) return null;
    try {
      return calculatePreviewLine({ quantityMilli, unitRatePaise, discountBps, taxRateBps });
    } catch {
      return null;
    }
  });
  const previewTotals = preview.every(Boolean)
    ? (() => {
        const totals = preview.reduce((acc, item) => ({
          subtotalPaise: acc.subtotalPaise + BigInt(item!.subtotalPaise),
          discountPaise: acc.discountPaise + BigInt(item!.discountPaise),
          taxPaise: acc.taxPaise + BigInt(item!.taxPaise),
          grandTotalPaise: acc.grandTotalPaise + BigInt(item!.totalPaise),
        }), { subtotalPaise: BigInt(0), discountPaise: BigInt(0), taxPaise: BigInt(0), grandTotalPaise: BigInt(0) });
        const maxSafe = BigInt(Number.MAX_SAFE_INTEGER);
        if (Object.values(totals).some((amount) => amount > maxSafe)) return null;
        return {
          subtotalPaise: Number(totals.subtotalPaise),
          discountPaise: Number(totals.discountPaise),
          taxPaise: Number(totals.taxPaise),
          grandTotalPaise: Number(totals.grandTotalPaise),
        };
      })()
    : null;

  async function saveDraft(submitForApproval: boolean) {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const draft = buildPayload();
      let saved: Quotation;
      if (draftId) {
        saved = await updateQuotationDraft(draftId, draft);
      } else {
        if (audience === "admin" && !selectedLeadId && !selectedClientId) {
          throw new Error("Select an existing lead or client.");
        }
        createKey.current ??= crypto.randomUUID();
        const input: CreateQuotationInput = {
          ...draft,
          leadId: selectedLeadId || undefined,
          clientId: selectedClientId || undefined,
          assignedSalesEmployeeId: assignedSalesEmployeeId || undefined,
        };
        saved = await createQuotation(input, createKey.current);
        createKey.current = null;
        setDraftId(saved.id);
      }

      if (submitForApproval) {
        transitionKey.current ??= crypto.randomUUID();
        saved = await submitQuotation(saved.id, transitionKey.current);
        transitionKey.current = null;
      }

      onSaved?.(saved);
      setNotice(submitForApproval ? "Quotation submitted for approval." : `Draft saved as ${saved.quotationNumber}.`);
      if (!quotation) router.push(`${audience === "employee" ? "/employee" : "/master-admin"}/quotations/${saved.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this quotation.");
    } finally {
      setLoading(false);
    }
  }

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId);
  const canEditLinks = audience === "admin" && !quotation;

  if (catalogLoading) {
    return <div className="flex items-center justify-center gap-2 py-16 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading quote options…</div>;
  }

  return (
    <div className="space-y-5">
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      {canEditLinks && (
        <section className="grid gap-3 rounded-2xl border border-black/6 bg-white p-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-neutral-600">
            Existing lead
            <select
              value={selectedLeadId}
              onChange={(event) => {
                const nextId = event.target.value;
                const lead = leads.find((item) => item.id === nextId);
                setSelectedLeadId(nextId);
                if (lead) {
                  setSelectedClientId(lead.clientId);
                  setLines((current) => current.map((line, index) =>
                    index === 0 && !line.serviceName ? { ...line, serviceName: lead.service } : line
                  ));
                }
              }}
              className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-normal text-neutral-800"
            >
              <option value="">No lead — create from client</option>
              {leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.code} · {lead.company || lead.clientName}</option>)}
            </select>
          </label>
          {!selectedLeadId && (
            <label className="text-xs font-semibold text-neutral-600">
              Existing client
              <select value={selectedClientId} onChange={(event) => setSelectedClientId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-normal text-neutral-800">
                <option value="">Select a client</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.company || client.name}</option>)}
              </select>
            </label>
          )}
          {selectedLeadId && (
            <div className="rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600">
              Client is linked from {selectedLead?.code ?? "the selected lead"}; the existing client record will be reused.
            </div>
          )}
          <label className="text-xs font-semibold text-neutral-600 sm:col-span-2">
            Assigned Sales employee (optional)
            <select value={assignedSalesEmployeeId} onChange={(event) => setAssignedSalesEmployeeId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-normal text-neutral-800 sm:max-w-md">
              <option value="">Admin-managed quotation</option>
              {salesEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} · {employee.code}</option>)}
            </select>
          </label>
        </section>
      )}

      {!quotation && audience === "employee" && (
        <section className="rounded-2xl border border-black/6 bg-white p-4">
          <label className="text-xs font-semibold text-neutral-600">
            Assigned lead
            <select
              required
              value={selectedLeadId}
              onChange={(event) => {
                const nextId = event.target.value;
                const lead = leads.find((item) => item.id === nextId);
                setSelectedLeadId(nextId);
                if (lead) {
                  setLines((current) => current.map((line, index) =>
                    index === 0 && !line.serviceName ? { ...line, serviceName: lead.service } : line
                  ));
                }
              }}
              className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-normal text-neutral-800"
            >
              <option value="">Select a currently assigned lead</option>
              {leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.code} · {lead.company || lead.clientName}</option>)}
            </select>
          </label>
          {selectedLead && <p className="mt-2 text-xs text-neutral-500">The existing client record for {selectedLead.company || selectedLead.clientName} will be reused.</p>}
        </section>
      )}

      {quotation && (
        <section className="rounded-2xl border border-black/6 bg-white p-4 text-sm">
          <p className="font-bold text-neutral-900">{quotation.quotationNumber} · Version {quotation.version}</p>
          <p className="mt-1 text-xs text-neutral-500">
            {quotation.leadCode ? `${quotation.leadCode} · ` : ""}{quotation.clientDetails.company || quotation.clientDetails.name}
          </p>
        </section>
      )}

      <section className="space-y-4 rounded-2xl border border-black/6 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold text-neutral-900">Service items</h2>
            <p className="mt-1 text-xs text-neutral-500">Amounts use INR paise; tax and discount are configured per line.</p>
          </div>
          <button type="button" onClick={() => setLines((current) => [...current, blankLine()])} className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50">
            <Plus className="h-3.5 w-3.5" /> Add line
          </button>
        </div>

        <div className="space-y-4">
          {lines.map((line, index) => {
            const selectedService = services.find((service) => service.id === line.serviceId);
            return (
              <article key={index} className="rounded-xl border border-black/6 bg-neutral-50 p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Line {index + 1}</p>
                  {lines.length > 1 && <button type="button" aria-label={`Remove line ${index + 1}`} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))} className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-neutral-600">
                    Service catalog
                    <select
                      value={line.serviceId}
                      onChange={(event) => {
                        const service = services.find((item) => item.id === event.target.value);
                        updateLine(index, { serviceId: service?.id ?? "", serviceName: service?.name ?? line.serviceName });
                      }}
                      className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-normal text-neutral-800"
                    >
                      <option value="">Custom service name</option>
                      {line.serviceId && !selectedService && <option value={line.serviceId}>{line.serviceName} · saved service</option>}
                      {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-neutral-600">
                    Service name
                    <input value={line.serviceName} readOnly={Boolean(line.serviceId)} onChange={(event) => updateLine(index, { serviceName: event.target.value })} maxLength={160} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-normal text-neutral-800 read-only:bg-neutral-100" />
                  </label>
                  <label className="text-xs font-semibold text-neutral-600 sm:col-span-2">
                    Description
                    <textarea value={line.description} onChange={(event) => updateLine(index, { description: event.target.value })} rows={2} maxLength={2000} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-normal text-neutral-800" />
                  </label>
                  <label className="text-xs font-semibold text-neutral-600">
                    Quantity
                    <input type="number" min="0.001" max="1000000" step="0.001" value={line.quantity} onChange={(event) => updateLine(index, { quantity: event.target.value })} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-normal text-neutral-800" />
                  </label>
                  <label className="text-xs font-semibold text-neutral-600">
                    Unit
                    <input value={line.unit} onChange={(event) => updateLine(index, { unit: event.target.value })} maxLength={40} placeholder="each, hour, sq ft…" className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-normal text-neutral-800" />
                  </label>
                  <label className="text-xs font-semibold text-neutral-600">
                    Unit rate (INR)
                    <input type="number" min="0" step="0.01" value={line.rate} onChange={(event) => updateLine(index, { rate: event.target.value })} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-normal text-neutral-800" />
                  </label>
                  <label className="text-xs font-semibold text-neutral-600">
                    Discount (%)
                    <input type="number" min="0" max="100" step="0.01" value={line.discount} onChange={(event) => updateLine(index, { discount: event.target.value })} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-normal text-neutral-800" />
                  </label>
                  <label className="text-xs font-semibold text-neutral-600">
                    Tax rate (%)
                    <input type="number" min="0" max="100" step="0.01" value={line.tax} onChange={(event) => updateLine(index, { tax: event.target.value })} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-normal text-neutral-800" />
                  </label>
                  <div className="flex items-end justify-between rounded-xl bg-white px-3 py-2.5 text-xs sm:col-span-2">
                    <span className="font-semibold text-neutral-500">Line total including tax</span>
                    <span className="font-extrabold text-neutral-900">{preview[index] ? formatPaise(preview[index]!.totalPaise) : "Check quantity / amount"}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4 rounded-2xl border border-black/6 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-neutral-600">Valid from<input required type="date" value={validFrom} onChange={(event) => setValidFrom(event.target.value)} className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm font-normal" /></label>
            <label className="text-xs font-semibold text-neutral-600">Valid until<input required type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm font-normal" /></label>
          </div>
          <label className="block text-xs font-semibold text-neutral-600">Payment terms<textarea value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} rows={2} maxLength={3000} placeholder="Enter applicable payment terms." className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm font-normal" /></label>
          <label className="block text-xs font-semibold text-neutral-600">Terms and conditions<textarea value={termsAndConditions} onChange={(event) => setTermsAndConditions(event.target.value)} rows={3} maxLength={8000} placeholder="Enter terms for this quotation; no default legal terms are assumed." className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm font-normal" /></label>
          {audience === "admin" && <label className="block text-xs font-semibold text-neutral-600">Internal notes<textarea value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} rows={2} maxLength={3000} className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm font-normal" /></label>}
        </div>
        <aside className="h-fit rounded-2xl border border-black/6 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-extrabold text-neutral-900">Amount preview</h2>
          {previewTotals ? (
            <dl className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between gap-3"><dt className="text-neutral-500">Subtotal</dt><dd className="font-semibold">{formatPaise(previewTotals.subtotalPaise)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-neutral-500">Discount</dt><dd className="font-semibold">− {formatPaise(previewTotals.discountPaise)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-neutral-500">Tax</dt><dd className="font-semibold">{formatPaise(previewTotals.taxPaise)}</dd></div>
              <div className="flex justify-between gap-3 border-t border-black/8 pt-3 text-sm"><dt className="font-bold">Grand total</dt><dd className="font-extrabold">{formatPaise(previewTotals.grandTotalPaise)}</dd></div>
            </dl>
          ) : <p className="mt-3 text-xs text-amber-700">Complete each item with supported quantity and amounts to preview totals.</p>}
          <p className="mt-4 text-[11px] leading-5 text-neutral-400">Server recalculates and validates all totals. Tax is per item; no default tax rate is applied.</p>
        </aside>
      </section>

      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={() => void saveDraft(false)} disabled={loading || catalogLoading || !previewTotals} className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">
          {loading && <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />}Save draft
        </button>
        <button type="button" onClick={() => void saveDraft(true)} disabled={loading || catalogLoading || !previewTotals} className="rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50">
          Submit for approval
        </button>
      </div>
    </div>
  );
}
