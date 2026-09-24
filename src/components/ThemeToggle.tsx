"use client";

import { useEffect } from "react";

export type ThemeMode = "light" | "dark" | "system";

/**
 * Enforces Light Mode across the application per user requirement:
 * "หยุดการพัฒนา dark mode ไว้ก่อนและซ่อนเมนูไว้ ให้ระบบบังคับการเปิดทุกอุปกรณ์ต้องเป็นแบบ light mode เท่านั้น"
 */
export function applyTheme(mode: ThemeMode = "light") {
  if (typeof window === "undefined") return;

  // Always force light mode
  document.documentElement.classList.remove("dark");
  document.documentElement.setAttribute("data-theme", "light");
  document.documentElement.style.colorScheme = "light";
  localStorage.setItem("cc_theme_mode", "light");

  window.dispatchEvent(
    new CustomEvent("cc_theme_changed", {
      detail: { mode: "light", isDark: false }
    })
  );
}

/**
 * ThemeToggle component is hidden per user request to pause dark mode development.
 * It ensures light mode is applied on mount, and renders nothing in the UI.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  useEffect(() => {
    applyTheme("light");
  }, []);

  // Hidden from UI
  return null;
}
