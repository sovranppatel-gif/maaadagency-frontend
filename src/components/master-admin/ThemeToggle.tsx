"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="relative flex h-10 w-10 items-center justify-center rounded-control text-muted transition-colors duration-150 ease-out hover:bg-surface-2 hover:text-fg"
    >
      <Sun
        className="absolute h-[18px] w-[18px] transition-[opacity,transform] duration-200 ease-out"
        style={{ opacity: theme === "light" ? 1 : 0, transform: theme === "light" ? "rotate(0deg)" : "rotate(-45deg)" }}
        aria-hidden
      />
      <Moon
        className="absolute h-[18px] w-[18px] transition-[opacity,transform] duration-200 ease-out"
        style={{ opacity: theme === "dark" ? 1 : 0, transform: theme === "dark" ? "rotate(0deg)" : "rotate(45deg)" }}
        aria-hidden
      />
    </button>
  );
}
