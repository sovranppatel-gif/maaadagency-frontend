"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { adminNavItems, isNavActive, mobileTabHrefs } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

const SHORT_LABEL: Record<string, string> = {
  "WhatsApp Inbox": "WhatsApp",
  "Work Management": "Work",
};

/** Phone-only bottom navigation: the four main sections plus the full menu. */
export function MobileTabBar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const tabs = mobileTabHrefs.map((href) => adminNavItems.find((i) => i.href === href)!).filter(Boolean);

  const tabClass = "flex h-14 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors duration-150";

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
    >
      {tabs.map((item) => {
        const active = isNavActive(item, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(tabClass, active ? "text-accent" : "text-muted hover:text-fg")}
          >
            <item.icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            {SHORT_LABEL[item.label] ?? item.label}
          </Link>
        );
      })}
      <button type="button" onClick={onMenu} aria-label="Open full menu" className={cn(tabClass, "text-muted hover:text-fg")}>
        <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        Menu
      </button>
    </nav>
  );
}
