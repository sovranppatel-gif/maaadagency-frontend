"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { QuotationEditor } from "@/components/quotations/QuotationEditor";

function NewQuotationContent() {
  const searchParams = useSearchParams();
  return <QuotationEditor audience="admin" initialLeadId={searchParams.get("leadId") ?? undefined} />;
}

export default function NewMasterAdminQuotationPage() {
  return <Suspense fallback={<div className="py-16 text-center text-sm text-neutral-500">Loading quotation editor…</div>}>
    <NewQuotationContent />
  </Suspense>;
}
