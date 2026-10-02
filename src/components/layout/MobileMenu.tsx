"use client";

import { useEffect, useRef } from "react";
import { X, Phone } from "lucide-react";
import { navLinks } from "@/data/site";
import { contactInfo, formatPhone, telHref } from "@/data/contact";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { socialLinks } from "@/components/ui/SocialIcons";
import { cn } from "@/lib/utils";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MobileMenu({
  open,
  onClose,
  activeId,
  returnFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  activeId: string;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Lock page scroll, move focus in, trap Tab, close on Escape, restore focus.
  useEffect(() => {
    if (!open) return;
    const returnTo = returnFocusRef.current;
    document.body.style.overflow = "hidden";
    // Wait a frame so `inert`/`visibility` have been lifted before focusing.
    const frame = requestAnimationFrame(() => closeRef.current?.focus());

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    // Close if the viewport grows to the desktop layout while open.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onDesktop = (e: MediaQueryListEvent) => e.matches && onClose();

    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onDesktop);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onDesktop);
      returnTo?.focus();
    };
  }, [open, onClose, returnFocusRef]);

  return (
    <div
      ref={panelRef}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      inert={!open}
      className={cn(
        "fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-brand-dark text-white duration-300 lg:hidden",
        // Visibility flips instantly on open (so focus can land) and only
        // transitions on close (so the fade-out is still visible).
        open ? "visible opacity-100 transition-opacity" : "invisible opacity-0 transition-[opacity,visibility]"
      )}
    >
      <div className="flex h-20 shrink-0 items-center justify-between px-5 sm:px-8">
        <Logo onClick={onClose} imageClassName="h-11 w-auto" />
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <nav aria-label="Mobile" className="px-5 pt-4 sm:px-8">
        <ul>
          {navLinks.map((link, i) => (
            <li
              key={link.id}
              style={{ transitionDelay: open ? `${60 + i * 40}ms` : "0ms" }}
              className={cn(
                "transition-[opacity,transform] duration-300 motion-reduce:transition-none",
                open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              )}
            >
              <a
                href={link.href}
                onClick={onClose}
                aria-current={activeId === link.id ? "true" : undefined}
                className={cn(
                  "block border-b border-white/10 py-4 font-display text-2xl font-bold tracking-tight xs:text-3xl",
                  activeId === link.id ? "text-brand-red" : "text-white"
                )}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8 flex flex-col gap-4 px-5 pb-10 sm:px-8">
        <ButtonLink href="/#contact" onClick={onClose}>
          Start a Project
        </ButtonLink>
        {contactInfo.phones.map((phone) => (
          <a
            key={phone}
            href={telHref(phone)}
            className="flex min-h-11 items-center gap-2 text-sm font-semibold text-white/80"
          >
            <Phone className="h-4 w-4 text-brand-red" aria-hidden="true" />
            {formatPhone(phone)}
          </a>
        ))}
        <div className="mt-2 flex items-center gap-3">
          {socialLinks.map(({ Icon, href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/70"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
