"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { QuotationEditor } from "@/components/quotations/QuotationEditor";

function NewEmployeeQuotationContent() {
  const searchParams = useSearchParams();
  return <QuotationEditor audience="employee" initialLeadId={searchParams.get("leadId") ?? undefined} />;
}

export default function NewEmployeeQuotationPage() {
  return <Suspense fallback={<div className="py-16 text-center text-sm text-neutral-500">Loading quotation editor…</div>}>
    <NewEmployeeQuotationContent />
  </Suspense>;
}
