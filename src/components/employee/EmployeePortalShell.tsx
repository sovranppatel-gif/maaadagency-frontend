"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
  MapPin,
  Menu,
  Moon,
  Sun,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getUnreadCount } from "@/lib/api/notifications";
import { ThemeToggle } from "@/components/master-admin/ThemeToggle";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
  { label: "My Leads", href: "/employee/leads", icon: Users },
  { label: "My Tasks", href: "/employee/tasks", icon: ClipboardList },
  { label: "My Follow-ups", href: "/employee/follow-ups", icon: CalendarClock },
  { label: "My Visits", href: "/employee/visits", icon: MapPin },
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
    <span className="ml-auto min-w-5 rounded-full bg-accent px-1.5 py-0.5 text-center text-[10px] font-bold text-accent-fg tabular-nums">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function EmployeePortalShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

  const initials =
    user?.name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "E";

  return (
    <div className="min-h-screen bg-bg text-fg">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-68 flex-col border-r border-border bg-surface text-fg transition-transform duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-4">
          <Link
            href="/employee/dashboard"
            onClick={() => {
              setMobileOpen(false);
              setProfileOpen(false);
            }}
            aria-label="Maa Ad Agency Employee Workspace home"
            className="flex min-w-0 items-center gap-2.5"
          >
            <Image
              src="/images/logo.png"
              alt="Maa Ad Agency"
              width={900}
              height={424}
              priority
              className="h-9 w-auto shrink-0 object-contain"
            />
            <span className="min-w-0 border-l border-border pl-2.5 text-[10px] font-semibold uppercase leading-tight tracking-[0.08em] text-muted">
              Employee
              <span className="block">Portal</span>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="ml-auto rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-3 mt-4 rounded-xl border border-border bg-surface-2/70 px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">Signed in as</p>
          <p className="mt-1 truncate text-sm font-bold text-fg">{user?.name ?? "Employee"}</p>
          <p className="mt-0.5 truncate text-xs text-muted">{user?.email}</p>
        </div>

        <nav aria-label="Employee navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
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
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "border border-accent/25 bg-accent-soft text-accent"
                    : "border border-transparent text-muted hover:bg-surface-2 hover:text-fg"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
                {href === "/employee/notifications" && <UnreadBadge count={unreadCount} />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-68">
        <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg border border-border p-2 text-muted hover:bg-surface-2 hover:text-fg lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold uppercase tracking-widest text-muted">
                  Employee Workspace
                </p>
                <p className="truncate text-sm font-bold text-fg">{user?.name ?? "Employee"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />

              <Link
                href="/employee/notifications"
                aria-label="Notifications"
                title={notificationError || "Notifications"}
                onClick={() => {
                  setMobileOpen(false);
                  setProfileOpen(false);
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                <Bell className="h-4 w-4" />
                {unreadCount !== null && unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-accent px-1 text-center text-[9px] font-bold leading-4 text-accent-fg tabular-nums">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  aria-expanded={profileOpen}
                  aria-label="Open profile menu"
                  className="flex items-center gap-2 rounded-lg border border-border bg-surface p-1 pr-2.5 transition-colors hover:bg-surface-2"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-soft text-xs font-bold text-accent">
                    {initials}
                  </span>
                  <span className="hidden max-w-32 truncate text-xs font-bold text-fg sm:block">
                    {user?.name ?? "Employee"}
                  </span>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-surface p-1.5 shadow-xl">
                    <Link
                      href="/employee/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-fg hover:bg-surface-2"
                    >
                      <BriefcaseBusiness className="h-4 w-4 text-muted" />
                      My Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        toggleTheme();
                        setProfileOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-fg hover:bg-surface-2"
                    >
                      {theme === "dark" ? (
                        <Sun className="h-4 w-4 text-warning" />
                      ) : (
                        <Moon className="h-4 w-4 text-muted" />
                      )}
                      {theme === "dark" ? "Light mode" : "Dark mode"}
                    </button>
                    <div className="my-1 border-t border-border" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-danger hover:bg-danger-soft"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {notificationError && (
            <p role="status" className="mb-4 rounded-xl border border-warning/30 bg-warning-soft px-3.5 py-2 text-xs text-warning">
              Notification count unavailable: {notificationError}
            </p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
