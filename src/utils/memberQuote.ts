// src/utils/memberQuote.ts
// Helper utility to read and persist member custom quotes across Supabase and LocalStorage

import { createClient } from "@/utils/supabase/client";

const LOCAL_STORAGE_KEY = "cc_member_custom_quotes";

export function getLocalCustomQuotes(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getMemberCustomQuote(identifier: string): string | null {
  if (!identifier) return null;
  const localMap = getLocalCustomQuotes();
  const trimmed = identifier.trim();

  if (localMap[trimmed] && localMap[trimmed].trim()) {
    return localMap[trimmed].trim();
  }

  // Check aliases
  for (const [key, val] of Object.entries(localMap)) {
    if (key.includes(trimmed) || trimmed.includes(key)) {
      if (val && val.trim()) return val.trim();
    }
  }

  return null;
}

export async function saveMemberCustomQuote(identifier: string, quote: string): Promise<boolean> {
  const trimmedName = identifier.trim();
  const trimmedQuote = quote.trim();

  // 1. Save to local storage immediately
  if (typeof window !== "undefined") {
    try {
      const current = getLocalCustomQuotes();
      current[trimmedName] = trimmedQuote;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
      window.dispatchEvent(
        new CustomEvent("cc_quote_updated", { detail: { member: trimmedName, quote: trimmedQuote } })
      );
    } catch (e) {
      console.warn("Failed to save quote locally:", e);
    }
  }

  // 2. Persist to Supabase assignees table (metaObj.customQuote)
  try {
    const supabase = createClient();
    const { data: memberList } = await supabase.from("assignees").select("id, name, unit");
    const matched = memberList?.find(
      (m) => m.name === trimmedName || m.id === trimmedName || m.name?.includes(trimmedName)
    );

    if (matched) {
      const parts = (matched.unit || "creative").split("|");
      const cleanUnit = parts[0] || "creative";
      const role = parts[1] || "assignee";
      let metaObj: any = {};
      if (parts[2]) {
        try {
          metaObj = JSON.parse(decodeURIComponent(parts[2]));
        } catch {
          metaObj = {};
        }
      }
      metaObj.customQuote = trimmedQuote;
      const encodedUnit = `${cleanUnit}|${role}|${encodeURIComponent(JSON.stringify(metaObj))}`;

      await supabase.from("assignees").update({ unit: encodedUnit }).eq("id", matched.id);
      return true;
    }
  } catch (err) {
    console.error("Failed to persist quote to Supabase:", err);
  }

  return true;
}

export function syncCustomQuotesFromAssignees(assignees: any[]) {
  if (!Array.isArray(assignees) || typeof window === "undefined") return;
  try {
    const current = getLocalCustomQuotes();
    let changed = false;

    assignees.forEach((a) => {
      const name = a.name?.trim();
      if (!name) return;
      const rawUnit = a.unit || "";
      if (rawUnit.includes("|")) {
        const parts = rawUnit.split("|");
        if (parts[2]) {
          try {
            const meta = JSON.parse(decodeURIComponent(parts[2]));
            if (meta.customQuote && meta.customQuote.trim()) {
              if (current[name] !== meta.customQuote.trim()) {
                current[name] = meta.customQuote.trim();
                changed = true;
              }
            }
          } catch {
            // ignore
          }
        }
      }
    });

    if (changed) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
      window.dispatchEvent(new CustomEvent("cc_quote_updated", { detail: current }));
    }
  } catch (e) {
    // ignore
  }
}
