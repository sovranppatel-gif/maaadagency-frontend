"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  ClipboardList,
  CalendarClock,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getUnreadCount } from "@/lib/api/notifications";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
  { label: "My Leads", href: "/employee/leads", icon: Users },
  { label: "My Tasks", href: "/employee/tasks", icon: ClipboardList },
  { label: "My Follow-ups", href: "/employee/follow-ups", icon: CalendarClock },
  { label: "My Quotations", href: "/employee/quotations", icon: FileText },
  { label: "Notifications", href: "/employee/notifications", icon: Bell },
  { label: "My Profile", href: "/employee/profile", icon: UserRound },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/employee/dashboard" && pathname.startsWith(`${href}/`));
}

function UnreadBadge({ count }: { count: number | null }) {
  if (count === null || count === 0) return null;
  return (
    <span className="ml-auto min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function EmployeePortalShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [notificationError, setNotificationError] = useState("");

  useEffect(() => {
    let active = true;
    async function refreshUnread() {
      try {
        const count = await getUnreadCount();
        if (!active) return;
        setUnreadCount(count);
        setNotificationError("");
      } catch (error) {
        if (!active) return;
        setUnreadCount(null);
        setNotificationError(error instanceof Error ? error.message : "Could not load notifications.");
      }
    }

    void refreshUnread();
    const interval = window.setInterval(() => void refreshUnread(), 30_000);
    window.addEventListener("employee-notifications-updated", refreshUnread);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("employee-notifications-updated", refreshUnread);
    };
  }, []);

  async function handleLogout() {
    await logout();
    router.replace("/employee/login");
  }

  const initials = user?.name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "E";

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-neutral-950 text-white transition-transform duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-700 text-lg font-black">M</span>
          <div>
            <p className="text-sm font-extrabold tracking-wide">MAAAD AGENCY</p>
            <p className="mt-0.5 text-[11px] text-neutral-400">Employee Portal</p>
          </div>
          <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} className="ml-auto rounded-lg p-2 text-neutral-400 hover:bg-white/10 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-white/10 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Signed in as</p>
          <p className="mt-1 truncate text-sm font-bold">{user?.name ?? "Employee"}</p>
          <p className="mt-0.5 truncate text-xs text-neutral-400">{user?.email}</p>
        </div>

        <nav aria-label="Employee navigation" className="flex-1 space-y-1 px-3 py-5">
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = isActivePath(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => {
                  setMobileOpen(false);
                  setProfileOpen(false);
                }}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors",
                  active ? "bg-red-700 text-white" : "text-neutral-300 hover:bg-white/8 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
                {href === "/employee/notifications" && <UnreadBadge count={unreadCount} />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-neutral-300 hover:bg-white/8 hover:text-white">
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-black/5 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" aria-label="Open navigation" onClick={() => setMobileOpen(true)} className="rounded-lg border border-black/10 p-2 text-neutral-700 hover:bg-neutral-50 lg:hidden">
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold uppercase tracking-wider text-neutral-400">Employee Workspace</p>
                <p className="truncate text-sm font-bold text-neutral-900">{user?.name ?? "Employee"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/employee/notifications" aria-label="Notifications" title={notificationError || "Notifications"} onClick={() => { setMobileOpen(false); setProfileOpen(false); }} className="relative rounded-xl border border-black/10 p-2.5 text-neutral-600 hover:bg-neutral-50">
                <Bell className="h-4 w-4" />
                {unreadCount !== null && unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-600 px-1 text-center text-[9px] font-bold leading-4 text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
              <div className="relative">
                <button type="button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} aria-label="Open profile menu" className="flex items-center gap-2 rounded-xl border border-black/10 p-1.5 pr-2.5 hover:bg-neutral-50">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">{initials}</span>
                  <span className="hidden max-w-32 truncate text-xs font-bold sm:block">{user?.name ?? "Employee"}</span>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-black/10 bg-white p-1.5 shadow-xl">
                    <Link href="/employee/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
                      <BriefcaseBusiness className="h-4 w-4" /> My Profile
                    </Link>
                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-700 hover:bg-red-50">
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {notificationError && (
            <p role="status" className="mb-4 text-xs text-amber-700">Notification count unavailable: {notificationError}</p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
