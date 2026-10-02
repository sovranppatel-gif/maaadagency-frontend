import Link from "next/link";
import { Phone } from "lucide-react";
import { primaryPhone, telHref } from "@/data/contact";

export function MobileStickyBar() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch gap-2.5 border-t border-black/10 bg-white/95 p-3 backdrop-blur-xl sm:hidden"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <a
        href={telHref(primaryPhone)}
        className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border-2 border-brand-dark px-4 text-sm font-bold text-brand-dark"
      >
        <Phone className="h-4 w-4" aria-hidden="true" />
        Call Now
      </a>
      <Link
        href="/#contact"
        className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand-red px-4 text-sm font-bold text-white shadow-lg shadow-brand-red/25"
      >
        Start a Project
      </Link>
    </div>
  );
}
