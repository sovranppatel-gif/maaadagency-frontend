"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { adminNavItems, getBreadcrumbs, getPageTitle, isNavActive } from "@/lib/admin-nav";
import { useMediaQuery } from "@/lib/hooks";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { MobileDrawer } from "./MobileDrawer";
import { MobileTabBar } from "./MobileTabBar";
import { CommandPalette } from "./CommandPalette";
import { ToastProvider } from "./ui/ToastProvider";

const COLLAPSED_KEY = "oxide-sidebar-collapsed";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function PageHeader() {
  const pathname = usePathname();
  const crumbs = getBreadcrumbs(pathname);
  // Detail pages: parent section ("Leads" over "Lead Details").
  // Section pages: their nav group ("Pipeline" over "Leads").
  const eyebrow =
    crumbs.length >= 3
      ? crumbs[crumbs.length - 2].label
      : (adminNavItems.find((i) => isNavActive(i, pathname))?.group ?? "Master Admin");

  return (
    <div className="mb-6">
      <p className="label-caps">{eyebrow}</p>
      <h1 className="mt-1 text-xl font-semibold leading-7 tracking-[-0.02em] text-fg lg:text-[28px] lg:leading-9">
        {getPageTitle(pathname)}
      </h1>
    </div>
  );
}

/**
 * Admin chrome.
 *   <640px     off-canvas drawer + bottom tab bar
 *   640-1023   68px icon rail; expanding floats over the content
 *   >=1024     248px sidebar, collapsible to the rail (persisted)
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [railOpen, setRailOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Close transient navigation UI whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setDrawerOpen(false);
    setRailOpen(false);
  }

  const expanded = isDesktop ? !collapsed : railOpen;

  const toggleSidebar = useCallback(() => {
    if (!isDesktop) {
      setRailOpen((open) => !open);
      return;
    }
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      // Storage unavailable: preference lasts for this session only.
    }
  }, [isDesktop, collapsed]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      const key = e.key.toLowerCase();
      if (key === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      } else if (key === "b" && window.matchMedia("(min-width: 640px)").matches) {
        if ((e.target as HTMLElement)?.isContentEditable) return;
        e.preventDefault();
        toggleSidebar();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [toggleSidebar]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  return (
    <ToastProvider>
      <div
        className="min-h-screen bg-bg font-ui text-sm text-fg"
        style={{ "--sidebar-w": collapsed ? "var(--sidebar-rail)" : "var(--sidebar-expanded)" } as React.CSSProperties}
      >
        <a
          href="#main"
          className="fixed left-3 top-3 z-[200] -translate-y-20 rounded-control bg-accent px-3 py-2 text-13 font-medium text-accent-fg transition-transform focus-visible:translate-y-0"
        >
          Skip to content
        </a>

        <AdminSidebar expanded={expanded} overlay={!isDesktop && railOpen} onToggle={toggleSidebar} />
        {!isDesktop && railOpen && (
          <div className="fixed inset-0 z-[35] hidden bg-overlay sm:block" onClick={() => setRailOpen(false)} aria-hidden />
        )}
        <MobileDrawer open={drawerOpen} onClose={closeDrawer} />

        <div className="flex min-h-screen flex-col transition-[padding] duration-[220ms] ease-out sm:pl-(--sidebar-rail) lg:pl-(--sidebar-w)">
          <AdminHeader onMenuClick={() => setDrawerOpen(true)} onSearchClick={() => setPaletteOpen(true)} />
          {/* --chrome-h: vertical space taken by topbar, page header, paddings
              (and the tab bar on phones) for pages that fill the viewport. */}
          <main
            id="main"
            tabIndex={-1}
            className="flex-1 px-4 pb-[calc(56px+1.5rem+env(safe-area-inset-bottom))] pt-6 outline-none [--chrome-h:14.5rem] sm:px-6 sm:pb-6 sm:[--chrome-h:11rem] lg:[--chrome-h:11.5rem]"
          >
            <PageHeader />
            {children}
          </main>
        </div>

        <MobileTabBar onMenu={() => setDrawerOpen(true)} />
        <CommandPalette open={paletteOpen} onClose={closePalette} onToggleSidebar={toggleSidebar} />
      </div>
    </ToastProvider>
  );
}
