import { createClient } from "@/utils/supabase/client";

export const FISCAL_YEAR = "70"; // ปีงบประมาณ 2570 (เริ่ม 1 ต.ค. 2569)

export type TaskPrefix = "DS" | "CT" | "PR" | "IT" | "IDC" | "RSP" | "QT";

export interface TaskSequenceCounters {
  DS: number;
  CT: number;
  PR: number;
  IT: number;
  IDC: number;
  RSP: number;
  QT: number;
}

const DEFAULT_COUNTERS: TaskSequenceCounters = {
  DS: 0,
  CT: 0,
  PR: 0,
  IT: 0,
  IDC: 0,
  RSP: 0,
  QT: 0,
};

const SEQUENCE_CONFIG_KEY = "CONFIG_TASK_SEQUENCES_JSON";
const LOCAL_STORAGE_SEQUENCE_KEY = "cc_task_sequences_fy70_v1";

/**
 * Determine task code prefix based on unit and category
 */
export function getUnitPrefix(unit?: string | null, category?: string | null): TaskPrefix {
  const cat = (category || "").toString().toLowerCase();
  if (cat.includes("idc") || cat.includes("ให้คำปรึกษา / รับโจทย์") || cat.includes("ศูนย์ออกแบบนวัตกรรม")) {
    return "IDC";
  }
  if (cat.includes("rsp") || cat.includes("press release")) {
    return "RSP";
  }
  if (cat.includes("ใบเสนอราคา") || cat.includes("quotation")) {
    return "QT";
  }

  const u = (unit || "internal").toLowerCase().trim();
  if (u === "creative" || u === "design") return "DS";
  if (u === "content") return "CT";
  if (u === "pr") return "PR";
  if (u === "internal") return "IT";

  return "IT";
}

/**
 * Fetch persistent sequence counters from Supabase okr_settings / localStorage
 */
export async function getPersistentCounters(): Promise<TaskSequenceCounters> {
  let counters: TaskSequenceCounters = { ...DEFAULT_COUNTERS };

  // 1. Try local storage cache first
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_SEQUENCE_KEY);
      if (cached) {
        counters = { ...DEFAULT_COUNTERS, ...JSON.parse(cached) };
      }
    } catch (e) {
      console.warn("Failed to parse local task sequences:", e);
    }
  }

  // 2. Fetch from Supabase okr_settings (Source of Truth)
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("okr_settings")
      .select("target_value")
      .eq("description", SEQUENCE_CONFIG_KEY)
      .maybeSingle();

    if (data?.target_value) {
      const parsed = JSON.parse(data.target_value);
      counters = {
        DS: Math.max(counters.DS || 0, parsed.DS || 0),
        CT: Math.max(counters.CT || 0, parsed.CT || 0),
        PR: Math.max(counters.PR || 0, parsed.PR || 0),
        IT: Math.max(counters.IT || 0, parsed.IT || 0),
        IDC: Math.max(counters.IDC || 0, parsed.IDC || 0),
        RSP: Math.max(counters.RSP || 0, parsed.RSP || 0),
        QT: Math.max(counters.QT || 0, parsed.QT || 0),
      };
    }
  } catch (err) {
    console.warn("Could not fetch remote task sequences:", err);
  }

  return counters;
}

/**
 * Save persistent sequence counters to Supabase okr_settings and localStorage
 */
export async function savePersistentCounters(counters: TaskSequenceCounters): Promise<void> {
  try {
    const supabase = createClient();
    // Check if row exists and merge with latest cloud state
    const { data: existing } = await supabase
      .from("okr_settings")
      .select("id, target_value")
      .eq("description", SEQUENCE_CONFIG_KEY)
      .maybeSingle();

    let merged: TaskSequenceCounters = { ...counters };
    if (existing?.target_value) {
      try {
        const remote = JSON.parse(existing.target_value);
        merged = {
          DS: Math.max(merged.DS || 0, remote.DS || 0),
          CT: Math.max(merged.CT || 0, remote.CT || 0),
          PR: Math.max(merged.PR || 0, remote.PR || 0),
          IT: Math.max(merged.IT || 0, remote.IT || 0),
          IDC: Math.max(merged.IDC || 0, remote.IDC || 0),
          RSP: Math.max(merged.RSP || 0, remote.RSP || 0),
          QT: Math.max(merged.QT || 0, remote.QT || 0),
        };
      } catch {}
    }

    const jsonStr = JSON.stringify(merged);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_STORAGE_SEQUENCE_KEY, jsonStr);
      } catch {}
    }

    if (existing?.id) {
      await supabase
        .from("okr_settings")
        .update({
          target_value: jsonStr,
          is_active: true,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("okr_settings").insert([
        {
          type: "KR",
          description: SEQUENCE_CONFIG_KEY,
          target_value: jsonStr,
          is_active: true,
        },
      ]);
    }
  } catch (err) {
    console.warn("Could not persist task sequences to cloud:", err);
  }
}

/**
 * Generate next sequential task code:
 * Guaranteed to ONLY RUN FORWARD continuously (e.g. IT70-1, IT70-2, IT70-3...)
 * Even if prior tasks were deleted or purged, the sequence NEVER shifts or rolls back!
 */
export async function generateNextTaskCode(prefix: TaskPrefix): Promise<string> {
  const counters = await getPersistentCounters();
  let maxNumber = Number(counters[prefix]) || 0;

  // Double check active briefs in database to ensure we never collide with any existing code
  try {
    const supabase = createClient();
    const { data: existingBriefs } = await supabase
      .from("briefs")
      .select("details")
      .neq("status", "purged")
      .order("created_at", { ascending: false });

    if (existingBriefs && existingBriefs.length > 0) {
      for (const b of existingBriefs) {
        if (b.details?.is_deleted || b.details?.is_permanently_deleted) continue;
        const candidate = (
          b.details?.task_code ||
          b.details?.idc_code ||
          b.details?.rsp_code ||
          ""
        ).toString().toUpperCase();

        const pattern = new RegExp(`^${prefix}${FISCAL_YEAR}-(\\d+)$`);
        const match = candidate.match(pattern);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }
  } catch (err) {
    console.warn("Error scanning existing briefs for sequence:", err);
  }

  const nextSeq = maxNumber + 1;
  counters[prefix] = nextSeq;

  // Persist the updated counter so the next request gets nextSeq + 1
  await savePersistentCounters(counters);

  return `${prefix}${FISCAL_YEAR}-${nextSeq}`;
}

/**
 * Authoritatively resolve task code for any brief:
 * 1. Returns saved immutable `brief.details.task_code` if present.
 * 2. Checks saved `idc_code` or `rsp_code` if formatted for FY70.
 * 3. Fallback: calculates deterministic code so it remains stable even if other tasks are deleted.
 */
export function resolveTaskCode(
  brief: {
    unit?: string | null;
    id?: string | null;
    created_at?: string | null;
    details?: any;
  },
  allBriefs?: any[]
): string {
  if (!brief) return "";

  // 1. Direct saved immutable task code
  if (brief.details?.task_code) {
    return brief.details.task_code;
  }
  if (brief.details?.idc_code && brief.details.idc_code.includes(`${FISCAL_YEAR}-`)) {
    return brief.details.idc_code;
  }
  if (brief.details?.rsp_code && brief.details.rsp_code.includes(`${FISCAL_YEAR}-`)) {
    return brief.details.rsp_code;
  }

  const prefix = getUnitPrefix(brief.unit, brief.details?.category);

  // 2. Stable fallback using allBriefs ordered by created_at (including deleted)
  if (allBriefs && allBriefs.length > 0 && brief.id) {
    const sameUnit = allBriefs
      .filter((b) => getUnitPrefix(b.unit, b.details?.category) === prefix)
      .sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        if (timeA !== timeB) return timeA - timeB;
        return (a.id || "").localeCompare(b.id || "");
      });

    const index = sameUnit.findIndex((b) => b.id === brief.id);
    if (index >= 0) {
      return `${prefix}${FISCAL_YEAR}-${index + 1}`;
    }
  }

  return `${prefix}${FISCAL_YEAR}-1`;
}
