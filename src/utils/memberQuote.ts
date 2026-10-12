// src/utils/memberQuote.ts
// Helper utility to read and persist member custom quotes across Supabase and LocalStorage

import { createClient } from "@/utils/supabase/client";
import { resolveCanonicalMemberKey } from "@/utils/avatar3dPresets";

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

/**
 * Gets the custom quote set specifically by the team member.
 * Resolves aliases, IDs, and nicknames to ensure the exact same quote is returned
 * across all tasks, boards, and modals.
 */
export function getMemberCustomQuote(identifier: string): string | null {
  if (!identifier) return null;
  const localMap = getLocalCustomQuotes();
  const trimmed = identifier.trim();
  const canonical = resolveCanonicalMemberKey(trimmed);

  // 1. Direct match on canonical key (e.g. "เอ็นจอย SLR", "จ๊อบ AA")
  if (canonical && localMap[canonical] && localMap[canonical].trim()) {
    return localMap[canonical].trim();
  }

  // 2. Direct match on trimmed identifier (e.g. exact name or id)
  if (localMap[trimmed] && localMap[trimmed].trim()) {
    return localMap[trimmed].trim();
  }

  // 3. Match across any keys in the map using canonical equivalence or alias lookup
  for (const [key, val] of Object.entries(localMap)) {
    if (!val || !val.trim()) continue;
    const keyCanonical = resolveCanonicalMemberKey(key);
    if (canonical && keyCanonical && canonical === keyCanonical) {
      return val.trim();
    }
    if (
      key.toLowerCase() === trimmed.toLowerCase() ||
      (trimmed.length >= 2 && key.toLowerCase().includes(trimmed.toLowerCase())) ||
      (key.length >= 2 && trimmed.toLowerCase().includes(key.toLowerCase()))
    ) {
      return val.trim();
    }
  }

  return null;
}

/**
 * Saves the custom quote set by the member.
 * Persists to both LocalStorage (under canonical, name, and id) and Supabase assignees table.
 */
export async function saveMemberCustomQuote(identifier: string, quote: string): Promise<boolean> {
  const trimmedName = identifier.trim();
  const trimmedQuote = quote.trim();
  const canonical = resolveCanonicalMemberKey(trimmedName) || trimmedName;

  // 1. Save to local storage immediately under multiple keys for instant multi-task sync
  if (typeof window !== "undefined") {
    try {
      const current = getLocalCustomQuotes();
      if (canonical) current[canonical] = trimmedQuote;
      current[trimmedName] = trimmedQuote;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
      window.dispatchEvent(
        new CustomEvent("cc_quote_updated", {
          detail: { member: canonical, rawMember: trimmedName, quote: trimmedQuote },
        })
      );
    } catch (e) {
      console.warn("Failed to save quote locally:", e);
    }
  }

  // 2. Persist to Supabase assignees table (metaObj.customQuote)
  try {
    const supabase = createClient();
    const { data: memberList } = await supabase.from("assignees").select("id, name, unit");
    const matched = memberList?.find((m) => {
      const mCanonical = resolveCanonicalMemberKey(m.name || m.id);
      return (
        m.name === trimmedName ||
        m.id === trimmedName ||
        (canonical && (m.name === canonical || mCanonical === canonical)) ||
        (m.name && (m.name.includes(trimmedName) || trimmedName.includes(m.name)))
      );
    });

    if (matched) {
      // Also cache under matched.id and matched.name in localStorage
      if (typeof window !== "undefined") {
        try {
          const current = getLocalCustomQuotes();
          if (matched.id) current[matched.id] = trimmedQuote;
          if (matched.name) current[matched.name] = trimmedQuote;
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
        } catch {}
      }

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

/**
 * Synchronizes custom quotes loaded from Supabase assignees table into LocalStorage.
 * Ensures all tasks and avatar badges have immediate access to quotes across all identifiers.
 */
export function syncCustomQuotesFromAssignees(assignees: any[]) {
  if (!Array.isArray(assignees) || typeof window === "undefined") return;
  try {
    const current = getLocalCustomQuotes();
    let changed = false;

    assignees.forEach((a) => {
      const name = a.name?.trim();
      const id = a.id?.trim();
      if (!name && !id) return;
      const rawUnit = a.unit || "";
      if (rawUnit.includes("|")) {
        const parts = rawUnit.split("|");
        if (parts[2]) {
          try {
            const meta = JSON.parse(decodeURIComponent(parts[2]));
            if (meta.customQuote !== undefined) {
              const quoteVal = (meta.customQuote || "").trim();
              const canonical = resolveCanonicalMemberKey(name || id) || name;
              if (canonical && current[canonical] !== quoteVal) {
                current[canonical] = quoteVal;
                changed = true;
              }
              if (name && current[name] !== quoteVal) {
                current[name] = quoteVal;
                changed = true;
              }
              if (id && current[id] !== quoteVal) {
                current[id] = quoteVal;
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
