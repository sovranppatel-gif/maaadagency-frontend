"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, Moon, Settings, Sun } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

export const ROLE_LABEL: Record<Role, string> = {
  MASTER_ADMIN: "Master Admin",
  ADMIN: "Admin",
  EMPLOYEE: "Employee",
};

type Placement = "sidebar" | "rail" | "topbar";

export function UserAvatar({ name, color, className }: { name?: string; color?: string; className?: string }) {
  return (
    <span
      className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white", className)}
      style={{ backgroundColor: color ?? "var(--accent)" }}
      aria-hidden
    >
      {initials(name ?? "?")}
    </span>
  );
}

/**
 * Account menu: settings, theme, log out. Keyboard: Enter/Space/ArrowDown
 * opens and focuses the first item, arrows move, Escape closes and returns
 * focus to the trigger, Tab closes.
 */
export function ProfileMenu({ placement, onTooltip }: { placement: Placement; onTooltip?: (el: HTMLElement | null, label: string) => void }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const items = () => Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function openAndFocus(index: 0 | -1) {
    setOpen(true);
    requestAnimationFrame(() => {
      const list = items();
      list.at(index)?.focus();
    });
  }

  function onTriggerKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openAndFocus(0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openAndFocus(-1);
    }
  }

  function onMenuKey(e: React.KeyboardEvent) {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      list[(i + 1) % list.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      list[(i - 1 + list.length) % list.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      list[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      list.at(-1)?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  async function handleLogout() {
    setOpen(false);
    await logout();
    router.replace("/master-admin/login");
  }

  const roleLabel = user ? ROLE_LABEL[user.role] : "";
  const itemClass =
    "flex h-10 w-full items-center gap-2.5 rounded-control px-2.5 text-left text-13 text-fg transition-colors duration-150 ease-out hover:bg-surface-2 focus-visible:bg-surface-2";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Account menu for ${user?.name ?? "user"}`}
        onClick={() => {
          onTooltip?.(null, "");
          setOpen((v) => !v);
        }}
        onKeyDown={onTriggerKey}
        onMouseEnter={(e) => placement === "rail" && onTooltip?.(e.currentTarget, user?.name ?? "Account")}
        onMouseLeave={() => onTooltip?.(null, "")}
        onFocus={(e) => placement === "rail" && onTooltip?.(e.currentTarget, user?.name ?? "Account")}
        onBlur={() => onTooltip?.(null, "")}
        className={cn(
          "flex items-center rounded-control transition-colors duration-150 ease-out hover:bg-surface-2",
          placement === "sidebar" && "h-12 w-full gap-2.5 px-2 text-left",
          placement === "rail" && "mx-auto h-11 w-11 justify-center",
          placement === "topbar" && "h-10 w-10 justify-center"
        )}
      >
        <UserAvatar name={user?.name} color={user?.avatarColor} />
        {placement === "sidebar" && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-13 font-medium text-fg">{user?.name ?? "Account"}</span>
              <span className="block truncate text-2xs text-muted">{roleLabel}</span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          </>
        )}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          onKeyDown={onMenuKey}
          className={cn(
            "absolute z-50 w-60 rounded-card border border-border bg-surface p-1 shadow-float",
            placement === "sidebar" && "bottom-full left-0 mb-2 w-full",
            placement === "rail" && "bottom-0 left-full ml-3",
            placement === "topbar" && "right-0 top-full mt-2"
          )}
        >
          <div className="border-b border-border px-2.5 pb-2 pt-1.5">
            <p className="truncate text-13 font-medium text-fg">{user?.name}</p>
            <p className="truncate text-2xs text-muted">{user?.email}</p>
          </div>
          <div className="pt-1">
            {user?.role === "MASTER_ADMIN" && (
              <Link href="/master-admin/settings" role="menuitem" tabIndex={-1} onClick={() => setOpen(false)} className={itemClass}>
                <Settings className="h-4 w-4 text-muted" aria-hidden />
                Settings
              </Link>
            )}
            <button type="button" role="menuitem" tabIndex={-1} onClick={toggleTheme} className={itemClass}>
              {theme === "dark" ? <Sun className="h-4 w-4 text-muted" aria-hidden /> : <Moon className="h-4 w-4 text-muted" aria-hidden />}
              {theme === "dark" ? "Light theme" : "Dark theme"}
            </button>
            <button type="button" role="menuitem" tabIndex={-1} onClick={handleLogout} className={cn(itemClass, "text-danger")}>
              <LogOut className="h-4 w-4" aria-hidden />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
