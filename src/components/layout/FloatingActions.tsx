"use client";

import { useEffect, useState } from "react";
import { ArrowUp, MessageCircle } from "lucide-react";
import { site } from "@/data/site";
import { primaryPhone, whatsappHref } from "@/data/contact";
import { cn } from "@/lib/utils";

export function FloatingActions() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShowTop(window.scrollY > 700);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-24 right-5 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-8">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        tabIndex={showTop ? 0 : -1}
        aria-hidden={!showTop}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-brand-dark shadow-lg shadow-black/10 transition duration-300 hover:scale-105",
          showTop ? "pointer-events-auto translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        )}
      >
        <ArrowUp className="h-5 w-5" aria-hidden="true" />
      </button>

      <a
        href={whatsappHref(primaryPhone, `Hi ${site.name}, I'd like to know more about your services.`)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform duration-200 hover:scale-105"
      >
        <MessageCircle className="h-6 w-6" fill="currentColor" strokeWidth={0} aria-hidden="true" />
      </a>
    </div>
  );
}
