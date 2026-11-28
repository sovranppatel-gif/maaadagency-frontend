"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { THEME_STORAGE_KEY } from "./theme-script";

export type Theme = "dark" | "light";

const STORAGE_KEY = THEME_STORAGE_KEY;

function preferredTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
    return "light";
  } catch {
    return "light";
  }
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const readTheme = (): Theme => (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const portal = pathname.startsWith("/employee") ? "employee" : "admin";
  // The <html> attribute is the source of truth; React just mirrors it.
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute("data-theme")) root.setAttribute("data-theme", preferredTheme());
    root.setAttribute("data-portal", portal);
    return () => {
      root.removeAttribute("data-theme");
      root.removeAttribute("data-portal");
    };
  }, [portal]);

  const setTheme = useCallback((next: Theme) => {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode / blocked storage: the choice just won't persist.
    }
    window.setTimeout(() => root.classList.remove("theme-transition"), 250);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark") }),
    [theme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
