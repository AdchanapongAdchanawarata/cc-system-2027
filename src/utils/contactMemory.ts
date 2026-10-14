/**
 * Contact Profile Memory Service
 * Manages auto-fill, caching, and history of contact info across all CC forms:
 * - Brief Form (/request)
 * - Internal Task Form (/internal)
 * - Innovation Design Center Form (/idc-form)
 * - RSP Press Release Form (/rsp-press-form)
 * - Satisfaction Survey (/survey)
 * - Internal Task Modal (/dashboard)
 */

export interface ContactProfile {
  nickname: string;          // ชื่อเล่น (ภาษาไทย) เช่น "แชมป์"
  team: string;              // ทีม เช่น "MKT", "BD", "CC", "NMCO"
  email: string;             // อีเมล เช่น name@step.cmu.ac.th
  phone: string;             // เบอร์โทรศัพท์ เช่น 089xxxxxxx
  fullName?: string;         // ชื่อ-นามสกุล (ถ้ามี)
  updatedAt: number;         // Unix timestamp
}

const STORAGE_KEY_CURRENT = "cc_saved_contact_profile_v1";
const STORAGE_KEY_HISTORY = "cc_saved_contact_history_v1";
const EVENT_NAME = "cc-contact-memory-updated";

/**
 * Get current primary saved contact profile
 */
export function getSavedContact(): ContactProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        nickname: parsed.nickname || "",
        team: parsed.team || "",
        email: parsed.email || "",
        phone: parsed.phone || "",
        fullName: parsed.fullName || "",
        updatedAt: parsed.updatedAt || Date.now()
      };
    }
  } catch (e) {
    console.warn("Failed to load saved contact:", e);
  }
  return null;
}

/**
 * Get list of recent contacts (up to 5 profiles)
 */
export function getRecentContacts(): ContactProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!raw) {
      const current = getSavedContact();
      return current ? [current] : [];
    }
    const list = JSON.parse(raw);
    if (Array.isArray(list)) {
      return list.filter(item => item && (item.nickname || item.email));
    }
  } catch (e) {
    console.warn("Failed to load contact history:", e);
  }
  return [];
}

/**
 * Save / Update contact profile
 * Updates both current active profile and recent contacts list
 */
export function saveContact(profile: Partial<ContactProfile>): ContactProfile {
  if (typeof window === "undefined") {
    return {
      nickname: profile.nickname || "",
      team: profile.team || "",
      email: profile.email || "",
      phone: profile.phone || "",
      fullName: profile.fullName || "",
      updatedAt: Date.now()
    };
  }

  const existing = getSavedContact();
  const updated: ContactProfile = {
    nickname: (profile.nickname !== undefined ? profile.nickname : existing?.nickname || "").trim(),
    team: (profile.team !== undefined ? profile.team : existing?.team || "").trim(),
    email: (profile.email !== undefined ? profile.email : existing?.email || "").trim(),
    phone: (profile.phone !== undefined ? profile.phone : existing?.phone || "").trim(),
    fullName: (profile.fullName !== undefined ? profile.fullName : existing?.fullName || "").trim(),
    updatedAt: Date.now()
  };

  // Only save if there is at least a nickname, email, or phone
  if (updated.nickname || updated.email || updated.phone) {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(updated));

      // Update history (max 5 items, deduplicated by nickname or email)
      const currentHistory = getRecentContacts();
      const filtered = currentHistory.filter(c => {
        const matchEmail = updated.email && c.email && c.email.toLowerCase() === updated.email.toLowerCase();
        const matchNickname = updated.nickname && c.nickname && c.nickname.trim() === updated.nickname.trim();
        return !matchEmail && !matchNickname;
      });

      const newHistory = [updated, ...filtered].slice(0, 5);
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(newHistory));

      // Notify other components
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));
    } catch (e) {
      console.warn("Failed to save contact profile:", e);
    }
  }

  return updated;
}

/**
 * Clear saved contact profile (resets active profile)
 */
export function clearSavedContact(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY_CURRENT);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: null }));
  } catch (e) {
    console.warn("Failed to clear saved contact:", e);
  }
}

/**
 * Remove a specific contact profile from history
 */
export function removeContactFromHistory(identifier: string): void {
  if (typeof window === "undefined") return;
  try {
    const list = getRecentContacts();
    const target = identifier.trim().toLowerCase();
    const updated = list.filter(c => 
      c.nickname.toLowerCase() !== target && 
      c.email.toLowerCase() !== target
    );
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));

    // If current was deleted, set next available or clear
    const current = getSavedContact();
    if (current && (current.nickname.toLowerCase() === target || current.email.toLowerCase() === target)) {
      if (updated.length > 0) {
        localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(updated[0]));
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT);
      }
    }

    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated[0] || null }));
  } catch (e) {
    console.warn("Failed to remove contact from history:", e);
  }
}

/**
 * Listen for contact profile changes
 */
export function onContactMemoryChange(callback: (profile: ContactProfile | null) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (e: any) => {
    callback(e.detail);
  };

  window.addEventListener(EVENT_NAME, handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
  };
}
