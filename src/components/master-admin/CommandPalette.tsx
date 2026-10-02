"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CornerDownLeft, LogOut, Moon, PanelLeft, Search, Sun, type LucideIcon } from "lucide-react";
import { navItemsForRole } from "@/lib/admin-nav";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";
import { useBodyScrollLock } from "@/lib/hooks";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  label: string;
  section: "Pages" | "Actions";
  icon: LucideIcon;
  hint?: string;
  terms: string;
  run: () => void;
}

function score(command: Command, query: string): number {
  if (!query) return 1;
  const label = command.label.toLowerCase();
  if (label.startsWith(query)) return 3;
  if (label.includes(query)) return 2;
  return command.terms.includes(query) ? 1 : 0;
}

function Palette({ onClose, onToggleSidebar }: { onClose: () => void; onToggleSidebar?: () => void }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  useBodyScrollLock(true);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => opener?.focus();
  }, []);

  const commands = useMemo<Command[]>(() => {
    const pages: Command[] = navItemsForRole(user?.role).map((item) => ({
      id: `page:${item.href}`,
      label: item.label,
      section: "Pages",
      icon: item.icon,
      hint: item.group,
      terms: `${item.label} ${item.group} ${item.keywords ?? ""}`.toLowerCase(),
      run: () => router.push(item.href),
    }));
    const actions: Command[] = [
      {
        id: "action:theme",
        label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
        section: "Actions",
        icon: theme === "dark" ? Sun : Moon,
        terms: "theme dark light mode appearance",
        run: toggleTheme,
      },
      ...(onToggleSidebar
        ? [
            {
              id: "action:sidebar",
              label: "Toggle sidebar",
              section: "Actions" as const,
              icon: PanelLeft,
              hint: "Ctrl/⌘ B",
              terms: "sidebar collapse expand navigation",
              run: onToggleSidebar,
            },
          ]
        : []),
      {
        id: "action:logout",
        label: "Log out",
        section: "Actions",
        icon: LogOut,
        terms: "logout sign out exit",
        run: async () => {
          await logout();
          router.replace("/master-admin/login");
        },
      },
    ];
    return [...pages, ...actions];
  }, [user?.role, theme, router, toggleTheme, onToggleSidebar, logout]);

  const q = query.trim().toLowerCase();
  const results = commands
    .map((c) => ({ c, s: score(c, q) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => (a.c.section === b.c.section ? b.s - a.s : a.c.section === "Pages" ? -1 : 1))
    .map((r) => r.c);
  const current = Math.min(active, Math.max(results.length - 1, 0));

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${current}"]`)?.scrollIntoView({ block: "nearest" });
  }, [current]);

  function runAt(index: number) {
    const command = results[index];
    if (!command) return;
    onClose();
    command.run();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((current + 1) % Math.max(results.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((current - 1 + results.length) % Math.max(results.length, 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(results.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      runAt(current);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "Tab") {
      // Single-field dialog: keep focus on the input.
      e.preventDefault();
    }
  }

  const reduceMotion = useReducedMotion();
  const optionId = (i: number) => `${listId}-option-${i}`;

  return (
    <div className="fixed inset-0 z-[160] flex items-start justify-center px-4 pt-[12vh]" onKeyDown={onKeyDown}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.15 }}
        className="absolute inset-0 bg-overlay"
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: reduceMotion ? 0 : 0.16, ease: "easeOut" }}
        className="relative w-full max-w-xl overflow-hidden rounded-card border border-border bg-surface shadow-float"
      >
        <div className="flex h-12 items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results.length ? optionId(current) : undefined}
            aria-autocomplete="list"
            aria-label="Search pages and actions"
            data-focus-ring="none"
            placeholder="Search pages and actions…"
            className="h-full flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-muted"
          />
          <kbd className="rounded-control border border-border px-1.5 py-0.5 font-num text-2xs text-muted">Esc</kbd>
        </div>

        <ul ref={listRef} id={listId} role="listbox" aria-label="Results" className="max-h-[min(360px,55vh)] overflow-y-auto p-1.5">
          {results.length === 0 && <li className="px-3 py-8 text-center text-13 text-muted">No results for “{query}”</li>}
          {results.map((command, i) => {
            const heading = i === 0 || results[i - 1].section !== command.section ? command.section : null;
            return (
              <li key={command.id} role="presentation">
                {heading && <p className="label-caps px-2.5 pb-1 pt-2">{heading}</p>}
                <div
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === current}
                  data-index={i}
                  onMouseMove={() => setActive(i)}
                  onClick={() => runAt(i)}
                  className={cn(
                    "flex h-10 cursor-pointer items-center gap-3 rounded-control px-2.5 text-13 transition-colors duration-100",
                    i === current ? "bg-accent-soft text-fg" : "text-muted"
                  )}
                >
                  <command.icon className={cn("h-4 w-4 shrink-0", i === current ? "text-accent" : "text-muted")} aria-hidden />
                  <span className="flex-1 truncate text-fg">{command.label}</span>
                  {command.hint && <span className="text-2xs text-muted">{command.hint}</span>}
                  {i === current && <CornerDownLeft className="h-3.5 w-3.5 text-muted" aria-hidden />}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-4 border-t border-border px-4 py-2 text-2xs text-muted sm:flex">
          <span>
            <kbd className="font-num">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="font-num">↵</kbd> open
          </span>
          <span>
            <kbd className="font-num">esc</kbd> close
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export function CommandPalette({
  open,
  onClose,
  onToggleSidebar,
}: {
  open: boolean;
  onClose: () => void;
  onToggleSidebar?: () => void;
}) {
  return <AnimatePresence>{open && <Palette onClose={onClose} onToggleSidebar={onToggleSidebar} />}</AnimatePresence>;
}
