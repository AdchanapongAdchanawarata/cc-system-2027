import { createClient } from "@supabase/supabase-js";

// In-memory cache for group IDs (fallback if env/db)
let cachedNotyGroupId = process.env.LINE_NOTY_GROUP_ID || "";
let cachedExecGroupId = process.env.LINE_EXECUTIVE_GROUP_ID || process.env.LINE_GROUP_ID || "";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Get Group IDs
 */
export async function getLineGroupIds(): Promise<{ notyGroupId: string; execGroupId: string }> {
  // If already in memory or env, return
  if (cachedNotyGroupId && cachedExecGroupId) {
    return { notyGroupId: cachedNotyGroupId, execGroupId: cachedExecGroupId };
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("system_settings")
        .select("key, value")
        .in("key", ["line_noty_group_id", "line_exec_group_id"]);

      if (data && data.length > 0) {
        data.forEach((row: any) => {
          if (row.key === "line_noty_group_id" && row.value) cachedNotyGroupId = row.value;
          if (row.key === "line_exec_group_id" && row.value) cachedExecGroupId = row.value;
        });
      }
    } catch {
      // Table might not exist, ignore and use env/cached
    }
  }

  return {
    notyGroupId: cachedNotyGroupId || process.env.LINE_NOTY_GROUP_ID || "",
    execGroupId: cachedExecGroupId || process.env.LINE_EXECUTIVE_GROUP_ID || process.env.LINE_GROUP_ID || "",
  };
}

/**
 * Save Group ID for a specific group role
 */
export async function saveLineGroupId(role: "noty" | "exec", groupId: string): Promise<boolean> {
  if (role === "noty") cachedNotyGroupId = groupId;
  if (role === "exec") cachedExecGroupId = groupId;

  const supabase = getSupabase();
  if (supabase) {
    try {
      const key = role === "noty" ? "line_noty_group_id" : "line_exec_group_id";
      await supabase.from("system_settings").upsert({ key, value: groupId, updated_at: new Date().toISOString() });
    } catch (e) {
      console.warn("Could not persist group id to database:", e);
    }
  }

  return true;
}
