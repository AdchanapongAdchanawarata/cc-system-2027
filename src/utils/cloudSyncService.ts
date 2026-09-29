import { createClient } from "@/utils/supabase/client";

export const CLOUD_KEYS = {
  WORK_LINKS: "CONFIG_WORK_LINKS_JSON",
  SERVICE_PRICING: "CONFIG_SERVICE_PRICING_JSON",
  TEAM_ACTION_PLAN: "CONFIG_TEAM_ACTION_PLAN_JSON",
  MEETING_TASKS: "CONFIG_MEETING_TASKS_JSON",
  KM_DATA: "CONFIG_KM_DATA_JSON",
  KM_FILES: "CONFIG_KM_FILES_JSON",
  TRAINING_RECORDS: "CONFIG_TRAINING_RECORDS_JSON",
  IDC_RECORDS: "CONFIG_IDC_RECORDS_JSON",
  RSP_PRESS_RECORDS: "CONFIG_RSP_PRESS_RECORDS_JSON",
  ISO_EVIDENCES: "CONFIG_ISO_EVIDENCES_JSON",
  STAKEHOLDER_LOGS: "CONFIG_STAKEHOLDER_LOGS_JSON",
} as const;

/**
 * Fetch a JSON configuration from Supabase okr_settings cloud database
 * Automatically synchronizes with localStorage as local offline cache
 */
export async function getCloudJson<T>(
  configKey: string,
  localFallbackKey?: string,
  defaultValue?: T
): Promise<T | null> {
  // 1. Try Supabase cloud database
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("okr_settings")
      .select("target_value")
      .eq("description", configKey)
      .maybeSingle();

    if (!error && data?.target_value) {
      try {
        const parsed = JSON.parse(data.target_value) as T;
        // Keep local cache fresh
        if (localFallbackKey && typeof window !== "undefined") {
          localStorage.setItem(localFallbackKey, data.target_value);
        }
        return parsed;
      } catch (pe) {
        console.warn(`[CloudSync] JSON parse error for ${configKey}:`, pe);
      }
    }
  } catch (err) {
    console.warn(`[CloudSync] Cloud fetch error for ${configKey}:`, err);
  }

  // 2. Fallback to localStorage cache
  if (localFallbackKey && typeof window !== "undefined") {
    const cached = localStorage.getItem(localFallbackKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as T;
        // If local cache had data but cloud was missing, silently upload to cloud
        saveCloudJsonSilently(configKey, parsed, localFallbackKey);
        return parsed;
      } catch {}
    }
  }

  return defaultValue !== undefined ? defaultValue : null;
}

/**
 * Save a JSON configuration to Supabase okr_settings cloud database
 * Immediately updates localStorage cache for instantaneous response
 */
export async function setCloudJson<T>(
  configKey: string,
  value: T,
  localFallbackKey?: string
): Promise<{ success: boolean; error?: string }> {
  const jsonStr = JSON.stringify(value);

  // 1. Instant local cache update (optimistic UI)
  if (localFallbackKey && typeof window !== "undefined") {
    localStorage.setItem(localFallbackKey, jsonStr);
  }

  // 2. Persist to Supabase okr_settings table
  try {
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("okr_settings")
      .select("id")
      .eq("description", configKey)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase
        .from("okr_settings")
        .update({
          target_value: jsonStr,
          is_active: true,
        })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("okr_settings")
        .insert([
          {
            type: "KR",
            description: configKey,
            target_value: jsonStr,
            is_active: true,
          },
        ]);
      if (error) throw error;
    }

    return { success: true };
  } catch (err: any) {
    console.error(`[CloudSync] Failed to save ${configKey} to cloud:`, err);
    return { success: false, error: err?.message || "Failed to persist to cloud" };
  }
}

/**
 * Fire-and-forget background cloud save
 */
export function saveCloudJsonSilently<T>(
  configKey: string,
  value: T,
  localFallbackKey?: string
) {
  setCloudJson(configKey, value, localFallbackKey).catch((e) => {
    console.warn(`[CloudSync] Silent save notice for ${configKey}:`, e);
  });
}
