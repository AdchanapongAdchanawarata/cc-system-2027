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
    | "SETTINGS_CHANGE";
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

/**
 * Record an audit log entry in the system:
 * 1. Tries Supabase `audit_logs` table (if migration exists).
 * 2. Fallbacks gracefully to Supabase `okr_settings` (`CONFIG_AUDIT_LOGS_JSON`) + localStorage.
 */
export async function logActivity(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<void> {
  const fullEntry: AuditLogEntry = {
    ...entry,
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const supabase = createClient();

    // 1. Attempt to insert into dedicated audit_logs table
    const { error: dbErr } = await supabase.from("audit_logs").insert([
      {
        task_id: fullEntry.task_id || null,
        task_code: fullEntry.task_code || null,
        action: fullEntry.action,
        actor_name: fullEntry.actor_name,
        actor_email: fullEntry.actor_email,
        actor_role: fullEntry.actor_role,
        details: fullEntry.details || {},
        created_at: fullEntry.timestamp,
      },
    ]);

    // If audit_logs table exists and succeeded, we are done
    if (!dbErr) {
      return;
    }
  } catch (err) {
    // Continue to fallback
  }

  // 2. Fallback to Cloud JSON in okr_settings (keeps last 500 audit logs)
  try {
    const existing = (await getCloudJson<AuditLogEntry[]>(AUDIT_CONFIG_KEY, LOCAL_AUDIT_KEY, [])) || [];
    const updated = [fullEntry, ...existing].slice(0, 500); // keep most recent 500 entries
    await setCloudJson(AUDIT_CONFIG_KEY, updated, LOCAL_AUDIT_KEY);
  } catch (e) {
    console.warn("Failed to persist audit log fallback:", e);
  }
}

/**
 * Fetch all audit logs (recent first)
 */
export async function getAuditLogs(limit: number = 100): Promise<AuditLogEntry[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        task_id: d.task_id,
        task_code: d.task_code,
        action: d.action,
        actor_name: d.actor_name,
        actor_email: d.actor_email,
        actor_role: d.actor_role,
        timestamp: d.created_at,
        details: d.details,
      }));
    }
  } catch (e) {
    // fallback
  }

  // Fallback to okr_settings
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
