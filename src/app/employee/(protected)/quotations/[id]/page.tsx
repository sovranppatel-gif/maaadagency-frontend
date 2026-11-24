"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { getQuotation, type Quotation } from "@/lib/api/quotations";
import { QuotationDetail } from "@/components/quotations/QuotationDetail";

export default function EmployeeQuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [result, setResult] = useState<{ id: string; quotation: Quotation | null } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getQuotation(id)
      .then((quotation) => {
        if (active) setResult({ id, quotation: quotation ?? null });
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load this quotation.");
      });
    return () => {
      active = false;
    };
  }, [id]);

  const quotation = result?.id === id ? result.quotation : undefined;
  if (quotation === null) notFound();
  if (!quotation) return error
    ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>
    : <p className="py-16 text-center text-sm text-neutral-500">Loading quotation…</p>;

  return <QuotationDetail initialQuotation={quotation} audience="employee" />;
}
