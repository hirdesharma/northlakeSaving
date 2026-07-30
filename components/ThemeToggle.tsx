"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
const KEY = "northlake.theme";

/**
 * Light / dark / system. Writes `data-theme` on <html>, which both the CSS
 * tokens and the SVG charts read from, so a switch repaints everything at once.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = window.localStorage.getItem(KEY) as Theme | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    window.localStorage.setItem(KEY, theme);
  }, [theme, mounted]);

  const next: Theme = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
  const labels: Record<Theme, string> = {
    system: "Match system theme",
    light: "Light theme",
    dark: "Dark theme",
  };

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={labels[theme]}
      aria-label={`${labels[theme]}. Switch to ${labels[next].toLowerCase()}`}
      className="rounded-lg border border-line p-2 text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
    >
      {!mounted ? (
        <span className="block h-4 w-4" />
      ) : theme === "dark" ? (
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M13.5 9.4A5.8 5.8 0 016.6 2.5a5.8 5.8 0 106.9 6.9z" strokeLinejoin="round" />
        </svg>
      ) : theme === "light" ? (
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="8" cy="8" r="3.1" />
          <path d="M8 1.4v1.6M8 13v1.6M14.6 8H13M3 8H1.4M12.7 3.3l-1.1 1.1M4.4 11.6l-1.1 1.1M12.7 12.7l-1.1-1.1M4.4 4.4L3.3 3.3" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="1.6" y="3" width="12.8" height="8.6" rx="1.4" />
          <path d="M5.5 13.9h5" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
