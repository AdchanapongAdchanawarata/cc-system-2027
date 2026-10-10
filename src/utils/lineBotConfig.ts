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

/**
 * Query LINE OA Quota, Consumption, and Real-Time Group Member Counts
 */
export async function getLineQuotaStatus(): Promise<{
  total: number;
  used: number;
  remaining: number;
  notyMembers: number;
  execMembers: number;
}> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return { total: 0, used: 0, remaining: 0, notyMembers: 12, execMembers: 17 };

  try {
    const headers = { Authorization: `Bearer ${token}` };
    const { notyGroupId, execGroupId } = await getLineGroupIds();

    const fetchMemberCount = async (gid: string, fallback: number) => {
      if (!gid) return fallback;
      try {
        const res = await fetch(`https://api.line.me/v2/bot/group/${gid}/members/count`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.count === 'number' && data.count > 0) return data.count;
        }
      } catch (e) {}
      return fallback;
    };

    const [quotaRes, usageRes, notyCount, execCount] = await Promise.all([
      fetch("https://api.line.me/v2/bot/message/quota", { headers }),
      fetch("https://api.line.me/v2/bot/message/quota/consumption", { headers }),
      fetchMemberCount(notyGroupId, 12),
      fetchMemberCount(execGroupId, 17),
    ]);

    const quotaData = await quotaRes.json();
    const usageData = await usageRes.json();

    const total = quotaData?.value || 300;
    const used = usageData?.totalUsage || 0;
    const remaining = Math.max(0, total - used);

    return {
      total,
      used,
      remaining,
      notyMembers: notyCount,
      execMembers: execCount,
    };
  } catch (e) {
    return { total: 300, used: 0, remaining: 300, notyMembers: 12, execMembers: 17 };
  }
}

/**
 * Intelligent Morning Brief Pacing / Balancing Strategy
 * Dynamically balances available Morning Brief dispatches across remaining workweeks.
 * If quota is tight, it automatically adapts from 4 days/week (Mon-Thu) down to 3 days (Mon, Wed, Thu) or 2 days (Mon, Wed)
 * so that notifications are evenly spaced and NEVER run out prematurely.
 */
export async function shouldSendMorningBriefToday(targetDate: Date = new Date()): Promise<{
  allowed: boolean;
  reason: string;
  allowedDays: number[]; // e.g. [1, 2, 3, 4] for Mon-Thu, [1, 3] for Mon & Wed
  quotaInfo: any;
}> {
  const day = targetDate.getDay(); // 0=Sun, 1=Mon, ..., 4=Thu, 5=Fri, 6=Sat
  if (day < 1 || day > 4) {
    return {
      allowed: false,
      reason: 'Morning Brief ส่งเฉพาะวันจันทร์ถึงพฤหัสบดี (วันศุกร์มีสรุปผู้บริหารรอบเย็นแทน)',
      allowedDays: [],
      quotaInfo: null,
    };
  }

  const qStatus = await getLineQuotaStatus();
  const notyCost = qStatus.notyMembers || 12;
  const execCost = qStatus.execMembers || 17;

  // Calculate remaining workdays and Fridays in the month
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const curDate = targetDate.getDate();
  const lastDate = new Date(year, month + 1, 0).getDate();

  let remainingFridays = 0;
  let remainingMonToThu = 0;

  for (let d = curDate; d <= lastDate; d++) {
    const checkDay = new Date(year, month, d).getDay();
    if (checkDay === 5) remainingFridays++;
    if (checkDay >= 1 && checkDay <= 4) remainingMonToThu++;
  }

  // Mandatory Executive Reports quota reservation:
  // (Remaining Fridays * execCost) + 1 Monthly Report + safety margin (at least 15 messages)
  const reservedForExecutive = (remainingFridays * execCost) + execCost + 15;
  const quotaForMorningBrief = Math.max(0, qStatus.remaining - reservedForExecutive);

  // How many Morning Brief pushes can we safely afford?
  const maxAffordableDispatches = Math.floor(quotaForMorningBrief / notyCost);

  // Remaining workweeks count (including current week)
  const daysLeftInMonth = (lastDate - curDate) + 1;
  const weeksLeft = Math.max(1, Math.ceil(daysLeftInMonth / 7));

  // Determine balanced days per week
  const maxDispatchesPerWeek = Math.floor(maxAffordableDispatches / weeksLeft);

  let allowedDays: number[] = [1, 2, 3, 4]; // Default: Mon, Tue, Wed, Thu (4 days)

  if (maxDispatchesPerWeek >= 4 && maxAffordableDispatches >= remainingMonToThu) {
    allowedDays = [1, 2, 3, 4]; // Full capacity: Mon, Tue, Wed, Thu
  } else if (maxDispatchesPerWeek >= 3 || maxAffordableDispatches >= (weeksLeft * 3)) {
    allowedDays = [1, 2, 4]; // Balanced 3 days: Mon, Tue, Thu
  } else if (maxDispatchesPerWeek >= 2 || maxAffordableDispatches >= (weeksLeft * 2)) {
    allowedDays = [1, 3]; // Balanced 2 days: Mon, Wed (กระจายสมดุลต้นสัปดาห์และกลางสัปดาห์)
  } else if (maxDispatchesPerWeek >= 1 || maxAffordableDispatches >= 1) {
    allowedDays = [1]; // Minimal 1 day: Mon (เปิดสัปดาห์)
  } else {
    allowedDays = []; // Quota exhausted / Guard strictly locked
  }

  const isDayAllowed = allowedDays.includes(day);

  const dayNames: Record<number, string> = { 1: 'จันทร์', 2: 'อังคาร', 3: 'พุธ', 4: 'พฤหัสบดี' };
  const scheduleDesc = allowedDays.length > 0 
    ? allowedDays.map(d => dayNames[d]).join(', ')
    : 'ระงับชั่วคราวเพื่อสำรองโควต้าผู้บริหาร';

  return {
    allowed: isDayAllowed,
    reason: isDayAllowed
      ? `โควต้าสมดุล (ส่งรอบวัน${dayNames[day]} • รอบที่เกลี่ยให้เดือนนี้: ทุกวัน${scheduleDesc})`
      : `ระบบเกลี่ยโควต้าสมดุลเฉลี่ยต่อสัปดาห์ (รอบที่ส่ง: ทุกวัน${scheduleDesc} • วันนี้ขอข้ามเพื่อไม่ให้โควต้าหมดก่อนสิ้นเดือน)`,
    allowedDays,
    quotaInfo: {
      ...qStatus,
      reservedForExecutive,
      quotaForMorningBrief,
      maxAffordableDispatches,
      weeksLeft,
      scheduleDesc,
    },
  };
}


