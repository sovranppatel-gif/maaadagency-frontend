"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { useBodyScrollLock, useEscape } from "@/lib/hooks";
import { BrandMark, NavSections } from "./AdminSidebar";
import { ProfileMenu } from "./ProfileMenu";

/**
 * Off-canvas navigation for phones (<640px). Closes on backdrop tap, Escape
 * or navigation (the shell closes it on route change); keeps Tab inside
 * while open and hands focus back to the opener when it closes.
 */
export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  useBodyScrollLock(open);
  useEscape(open, onClose);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => opener?.focus();
  }, [open]);

  function trapTab(e: React.KeyboardEvent) {
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusables = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }

  const duration = reduceMotion ? 0 : 0.22;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[140] sm:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration, ease: "easeOut" }}
            onClick={onClose}
            className="absolute inset-0 bg-overlay"
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            onKeyDown={trapTab}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration, ease: "easeOut" }}
            className="relative flex h-full w-[min(300px,85vw)] flex-col border-r border-border bg-surface"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border pl-4 pr-2">
              <BrandMark expanded />
              <button
                type="button"
                data-autofocus
                onClick={onClose}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-control text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-fg"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <nav aria-label="Main navigation" className="flex-1 overflow-y-auto">
              <NavSections expanded onNavigate={onClose} />
            </nav>
            <div className="shrink-0 border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <ProfileMenu placement="sidebar" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
