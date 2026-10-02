"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, Menu } from "lucide-react";
import { navLinks } from "@/data/site";
import { formatPhone, primaryPhone, telHref } from "@/data/contact";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { cn } from "@/lib/utils";
import { MobileMenu } from "./MobileMenu";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-spy: highlight the link for the section in the middle of the viewport.
  useEffect(() => {
    const sections = ["home", ...navLinks.map((l) => l.id)]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300",
          scrolled
            ? "bg-white/90 shadow-[0_1px_0_0_rgba(0,0,0,0.06),0_10px_30px_-15px_rgba(0,0,0,0.15)] backdrop-blur-xl"
            : "bg-white/0"
        )}
      >
        <nav
          aria-label="Main"
          className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-10"
        >
          <Logo eager />

          <ul className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const isActive = activeId === link.id;
              return (
                <li key={link.id}>
                  <a
                    href={link.href}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "relative block rounded-md px-3 py-2 text-sm font-semibold transition-colors xl:px-4",
                      "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-brand-red after:transition-transform after:duration-300 xl:after:inset-x-4",
                      isActive
                        ? "text-brand-red after:scale-x-100"
                        : "text-brand-dark/80 after:scale-x-0 hover:text-brand-red"
                    )}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="hidden items-center gap-5 lg:flex">
            <a
              href={telHref(primaryPhone)}
              className="hidden items-center gap-2 rounded-md text-sm font-semibold text-brand-dark/80 transition-colors hover:text-brand-red xl:flex"
            >
              <Phone className="h-4 w-4 text-brand-red" strokeWidth={2.5} aria-hidden="true" />
              {formatPhone(primaryPhone)}
            </a>
            <ButtonLink href="/#contact" size="sm">
              Start a Project
            </ButtonLink>
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label="Open menu"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-brand-dark lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </nav>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={closeMenu}
        activeId={activeId}
        returnFocusRef={menuButtonRef}
      />
    </>
  );
}
