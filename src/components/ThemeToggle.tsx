"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";

export type ThemeMode = "light" | "dark" | "system";

export function applyTheme(mode: ThemeMode) {
  if (typeof window === "undefined") return;

  const isDark =
    mode === "dark" ||
    (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (isDark) {
    document.documentElement.classList.add("dark");
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.setAttribute("data-theme", "light");
  }

  localStorage.setItem("cc_theme_mode", mode);
  window.dispatchEvent(new CustomEvent("cc_theme_changed", { detail: { mode, isDark } }));
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem("cc_theme_mode") as ThemeMode) || "system";
    setMode(saved);
    applyTheme(saved);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      const current = (localStorage.getItem("cc_theme_mode") as ThemeMode) || "system";
      if (current === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, []);

  const cycleTheme = () => {
    let next: ThemeMode;
    if (mode === "system") next = "light";
    else if (mode === "light") next = "dark";
    else next = "system";

    setMode(next);
    applyTheme(next);
  };

  const getLabel = () => {
    if (mode === "light") return "โหมดสว่าง (Light)";
    if (mode === "dark") return "โหมดมืด (Dark)";
    return "ตามอุปกรณ์ (Auto)";
  };

  if (!mounted) {
    return (
      <div className={`w-8 h-8 rounded-full border border-surface-border bg-surface ${className}`} />
    );
  }

  return (
    <div className={`relative flex items-center bg-surface border border-surface-border rounded-full p-0.5 shadow-xs ${className}`}>
      <button
        type="button"
        onClick={() => {
          setMode("light");
          applyTheme("light");
        }}
        title="โหมดสว่าง (Light Mode)"
        className={`p-1.5 rounded-full transition-all cursor-pointer ${
          mode === "light"
            ? "bg-amber-500 text-white shadow-2xs scale-105"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
        }`}
      >
        <Sun size={14} className={mode === "light" ? "animate-pulse" : ""} />
      </button>

      <button
        type="button"
        onClick={() => {
          setMode("dark");
          applyTheme("dark");
        }}
        title="โหมดมืด (Dark Mode)"
        className={`p-1.5 rounded-full transition-all cursor-pointer ${
          mode === "dark"
            ? "bg-indigo-600 text-white shadow-2xs scale-105"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
        }`}
      >
        <Moon size={14} />
      </button>

      <button
        type="button"
        onClick={() => {
          setMode("system");
          applyTheme("system");
        }}
        title="ตามอุปกรณ์ (Auto / System)"
        className={`p-1.5 rounded-full transition-all cursor-pointer ${
          mode === "system"
            ? "bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900 shadow-2xs scale-105"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
        }`}
      >
        <Laptop size={14} />
      </button>
    </div>
  );
}
