import { createClient } from "@/utils/supabase/client";
import { getCloudJson, setCloudJson } from "./cloudSyncService";

export interface AuditLogEntry {
  id: string;
  task_id?: string;
  task_code?: string;
  project_name?: string;
  action: 
    | "TASK_CREATE" 
    | "STATUS_CHANGE" 
    | "ASSIGNEE_CHANGE" 
    | "DEADLINE_CHANGE" 
    | "BUDGET_CHANGE" 
    | "TASK_EDIT" 
    | "TASK_DELETE" 
    | "TASK_RESTORE" 
    | "TASK_PURGE"
    | "SYSTEM_BACKUP"
    | "SETTINGS_CHANGE"
    | "DAILY_MISSION_ACK";
  actor_name: string;
  actor_email: string;
  actor_role: string;
  timestamp: string;
  details?: {
    field?: string;
    old_value?: any;
    new_value?: any;
    notes?: string;
    [key: string]: any;
  };
}

const AUDIT_CONFIG_KEY = "CONFIG_AUDIT_LOGS_JSON";
const LOCAL_AUDIT_KEY = "cc_audit_logs_cache_v1";
const MAX_AUDIT_ENTRIES = 200;

/**
 * Sanitize audit log details so large nested payloads (e.g. full brief details or base64 strings)
 * never bloat the CONFIG_AUDIT_LOGS_JSON row in Supabase.
 */
function sanitizeAuditDetails(details?: Record<string, any>): Record<string, any> {
  if (!details || typeof details !== "object") return {};
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(details)) {
    if (k === "updates" && v && typeof v === "object") {
      const u: Record<string, any> = {};
      for (const [uk, uv] of Object.entries(v)) {
        if (uk === "details" && uv && typeof uv === "object") {
          u.details_keys = Object.keys(uv).slice(0, 15);
        } else if (typeof uv !== "object" || uv === null) {
          u[uk] = String(uv).slice(0, 150);
        }
      }
      clean.updates = u;
    } else if (typeof v === "string") {
      clean[k] = v.length > 200 ? `${v.slice(0, 200)}...` : v;
    } else if (typeof v === "number" || typeof v === "boolean" || v === null) {
      clean[k] = v;
    } else if (Array.isArray(v)) {
      clean[k] = v.slice(0, 15).map((item) => (typeof item === "object" ? "[Object]" : String(item).slice(0, 80)));
    }
  }
  return clean;
}

/**
 * Record an audit log entry in Supabase `okr_settings` (`CONFIG_AUDIT_LOGS_JSON`) + localStorage.
 * Automatically sanitizes nested objects and caps history to MAX_AUDIT_ENTRIES.
 */
export async function logActivity(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<void> {
  const fullEntry: AuditLogEntry = {
    ...entry,
    project_name: entry.project_name ? String(entry.project_name).slice(0, 150) : undefined,
    details: sanitizeAuditDetails(entry.details),
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const existing = (await getCloudJson<AuditLogEntry[]>(AUDIT_CONFIG_KEY, LOCAL_AUDIT_KEY, [])) || [];
    const updated = [fullEntry, ...existing].slice(0, MAX_AUDIT_ENTRIES);
    await setCloudJson(AUDIT_CONFIG_KEY, updated, LOCAL_AUDIT_KEY);
  } catch (e) {
    console.warn("Failed to persist audit log:", e);
  }
}

/**
 * Fetch all audit logs (recent first)
 */
export async function getAuditLogs(limit: number = 100): Promise<AuditLogEntry[]> {
  const logs = await getCloudJson<AuditLogEntry[]>(AUDIT_CONFIG_KEY, LOCAL_AUDIT_KEY, []);
  return (logs || []).slice(0, limit);
}

/**
 * Helper to get current logged in user actor info
 */
export function getCurrentActor(): { name: string; email: string; role: string } {
  if (typeof window === "undefined") {
    return { name: "System", email: "system@step.cmu.ac.th", role: "system" };
  }
  const name = localStorage.getItem("cc_user_name") || "ผู้ใช้งาน";
  let role = localStorage.getItem("cc_user_role") || "assignee";
  const email = (localStorage.getItem("cc_user_email") || "").toLowerCase();

  // วา ไม่ได้อยู่ในสถานะ แอดมิน (Always 'assignee', never 'admin')
  if (name.includes("วา") || email.includes("wasita")) {
    if (role === "admin") {
      role = "assignee";
      try {
        localStorage.setItem("cc_user_role", "assignee");
      } catch {}
    }
  }

  return {
    name,
    email: localStorage.getItem("cc_user_email") || "staff@step.cmu.ac.th",
    role,
  };
}
