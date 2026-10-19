import { createClient } from "@supabase/supabase-js";
import { getAllLearnedFacts, getRecentHistory, recordLearnedFact } from "./lineMemoryService";
import { getBriefSaveCost, getTaskFinancialDistribution, isCcPmProject } from "./stats";
import { isR3Task } from "./okrSettings";

const GEMINI_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview"
];

let currentModelIndex = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export interface TeamMemberInfo {
  fullName: string;
  code: string;
  role: string;
  unit: string;
}

export const TEAM_MEMBERS_MAP: Record<string, TeamMemberInfo> = {
  "จ๊อบ": { fullName: "อัจชนะพงษ์ อัจชนะวราทา", code: "AA", role: "CC Lead (บริหารทีม)", unit: "Management" },
  "วา": { fullName: "วสิตา เกียรติ์จรุงพันธ์", code: "WK", role: "Creative Lead & รองหัวหน้าทีม", unit: "Design" },
  "ก้อง": { fullName: "อิศรา แก้วเรือง", code: "IK", role: "Creative Designer", unit: "Design" },
  "จอย": { fullName: "รติพร ลาภสิริ", code: "RL", role: "Creative Designer", unit: "Design" },
  "พิม": { fullName: "อัจฉราพร ชูศรี", code: "AC", role: "Creative Designer", unit: "Design" },
  "เยียร์": { fullName: "ลลิตภัทร ปัญญา", code: "LLP", role: "Creative Designer", unit: "Design" },
  "นิน": { fullName: "มทานินทร์ นันตา", code: "MTN", role: "Creative Designer", unit: "Design" },
  "ลูกอิน": { fullName: "สุทธิอาภา คุ้มครอง", code: "STK", role: "Content Creator", unit: "Content" },
  "โอ๊ต": { fullName: "ชนนิกานต์ บุญแก้ว", code: "CNB", role: "PR", unit: "PR" },
  "เอ็นจอย": { fullName: "ศิริลักษณ์ กันจะนะ", code: "SLR", role: "Content Creator", unit: "Content" },
  "แก้ว": { fullName: "กัลยกร อภิวงศ์", code: "KYK", role: "Content Creator", unit: "Content" },
  "แก้วก่อ": { fullName: "กัลยกร อภิวงศ์", code: "KYK", role: "Content Creator", unit: "Content" },
  "ต้า": { fullName: "ฐิติยา เข็มพล", code: "TTY", role: "PR", unit: "PR" },
};

export const LINE_DISPLAY_TO_HONORIFIC: Record<string, string> = {
  "job": "พี่จ๊อบ",
  "autcha.pim": "พี่พิม",
  "Bao-Suriyah CMU": "อาจารย์บ่าว",
  "Golf-Choncharoen CMU": "อาจารย์กอล์ฟ",
  "Itsara": "พี่ก้อง",
  "Kaewkor 🌻": "พี่แก้วก่อ",
  "Kaewkor": "พี่แก้วก่อ",
  "Lalynn 🐤": "พี่เยียร์",
  "Lalynn": "พี่เยียร์",
  "Leēk ╰innn♡~~": "พี่ลูกอิน",
  "Leēk": "พี่ลูกอิน",
  "Leek": "พี่ลูกอิน",
  "ma.ta.nin": "พี่นิน",
  "Oat 🍉": "พี่โอ๊ต",
  "Oat": "พี่โอ๊ต",
  "RATI.JOY": "พี่จอย",
  "Tanyanuparb": "อาจารย์อ้วน",
  "Tanya Ob-Oon": "อาจารย์อ้วน",
  "T'tar ◡̈ 🍀": "พี่ต้า",
  "T'tar": "พี่ต้า",
  "waweewa 🦋": "พี่วา",
  "waweewa": "พี่วา",
  "Witty Win VVIIV": "อาจารย์วิน",
  "Witty Win": "อาจารย์วิน",
  "น้อง CC": "น้อง CC",
  "น้องจอย": "พี่เอ็นจอย",
  "เอ็นจอย": "พี่เอ็นจอย"
};

/**
 * Resolves a raw LINE display name into the correct respectful Thai honorific title
 */
export function getProperCallerName(rawName?: string): string {
  if (!rawName || !rawName.trim()) return "พี่ๆ";
  const trimmed = rawName.trim();

  if (LINE_DISPLAY_TO_HONORIFIC[trimmed]) {
    return LINE_DISPLAY_TO_HONORIFIC[trimmed];
  }

  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(LINE_DISPLAY_TO_HONORIFIC)) {
    if (lower === key.toLowerCase()) return val;
  }

  if (lower.includes("น้องจอย") || lower.includes("enjoy") || lower.includes("เอ็นจอย")) return "พี่เอ็นจอย";
  if (lower.includes("rati") || lower.includes("จอย")) return "พี่จอย";
  if (lower.includes("tanya") || lower.includes("อ้วน") || lower.includes("ob-oon")) return "อาจารย์อ้วน";
  if (lower.includes("suriyah") || lower.includes("บ่าว")) return "อาจารย์บ่าว";
  if (lower.includes("choncharoen") || lower.includes("golf") || lower.includes("กอล์ฟ")) return "อาจารย์กอล์ฟ";
  if (lower.includes("witty") || lower.includes("win") || lower.includes("อาจารย์วิน")) return "อาจารย์วิน";
  if (lower.includes("job") || lower.includes("จ๊อบ")) return "พี่จ๊อบ";
  if (lower.includes("autcha") || lower.includes("pim") || lower.includes("พิม")) return "พี่พิม";
  if (lower.includes("itsara") || lower.includes("ก้อง")) return "พี่ก้อง";
  if (lower.includes("kaewkor") || lower.includes("แก้วก่อ") || lower.includes("kaew")) return "พี่แก้วก่อ";
  if (lower.includes("lalynn") || lower.includes("เยียร์")) return "พี่เยียร์";
  if (lower.includes("leēk") || lower.includes("leek") || lower.includes("ลูกอิน") || lower.includes("innn")) return "พี่ลูกอิน";
  if (lower.includes("ta.nin") || lower.includes("matanin") || lower.includes("นิน")) return "พี่นิน";
  if (lower.includes("oat") || lower.includes("โอ๊ต")) return "พี่โอ๊ต";
  if (lower.includes("t'tar") || lower.includes("ttar") || lower.includes("ต้า")) return "พี่ต้า";
  if (lower.includes("waweewa") || lower.includes("วา")) return "พี่วา";
  if (lower.includes("น้อง cc") || lower.includes("cc bot")) return "น้อง CC";

  if (trimmed.startsWith("พี่") || trimmed.startsWith("อาจารย์") || trimmed.startsWith("คุณ") || trimmed.startsWith("น้อง")) {
    return trimmed;
  }

  return `พี่${trimmed}`;
}

// Order prioritized to match longer names first (e.g. "เอ็นจอย" before "จอย")
const MATCHABLE_MEMBERS = [
  { nick: "เอ็นจอย", code: "SLR", info: TEAM_MEMBERS_MAP["เอ็นจอย"] },
  { nick: "ลูกอิน", code: "STK", info: TEAM_MEMBERS_MAP["ลูกอิน"] },
  { nick: "แก้วก่อ", code: "KYK", info: TEAM_MEMBERS_MAP["แก้วก่อ"] },
  { nick: "จ๊อบ", code: "AA", info: TEAM_MEMBERS_MAP["จ๊อบ"] },
  { nick: "วา", code: "WK", info: TEAM_MEMBERS_MAP["วา"] },
  { nick: "ก้อง", code: "IK", info: TEAM_MEMBERS_MAP["ก้อง"] },
  { nick: "จอย", code: "RL", info: TEAM_MEMBERS_MAP["จอย"] },
  { nick: "พิม", code: "AC", info: TEAM_MEMBERS_MAP["พิม"] },
  { nick: "เยียร์", code: "LLP", info: TEAM_MEMBERS_MAP["เยียร์"] },
  { nick: "นิน", code: "MTN", info: TEAM_MEMBERS_MAP["นิน"] },
  { nick: "โอ๊ต", code: "CNB", info: TEAM_MEMBERS_MAP["โอ๊ต"] },
  { nick: "แก้วก่อ", code: "KYK", info: TEAM_MEMBERS_MAP["แก้วก่อ"] },
  { nick: "ต้า", code: "TTY", info: TEAM_MEMBERS_MAP["ต้า"] },
];

export interface MemberStatData {
  nick: string;
  fullName: string;
  code: string;
  role: string;
  unit: string;
  saveCost: number;
  profit: number;
  count: number;
  completed: number;
  in_progress: number;
  pending: number;
  activeTasks: string[];
}

export interface WorkloadAnalytics {
  totals: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    r1Completed: number;
    r3Completed: number;
    saveCostTotal: number;
    deliveredSaveCostTotal: number;
    profitTotal: number;
    realizedProfitTotal: number;
    pipelineProfitTotal: number;
    csatRate: number;
    csatEvaluationsCount: number;
    onTimeRate: number;
    deliveredCount: number;
  };
  memberStats: Record<string, MemberStatData>;
  pendingRanking: MemberStatData[];
  topPending: MemberStatData | null;
  saveCostRanking: MemberStatData[];
  topSaveCostMember: MemberStatData | null;
  topProductionSaveCostMember: MemberStatData | null;
  unitFinancials: Record<string, {
    saveCost: number;
    profit: number;
    count: number;
    completed: number;
    pending: number;
  }>;
  topSaveCostUnit: {
    name: string;
    saveCost: number;
  } | null;
  unassignedCount: number;
}

/**
 * Synthesizes deep workload analytics from live briefs data including granular financial metrics
 */
export function analyzeWorkload(briefs: any[]): WorkloadAnalytics {
  let pending = 0;
  let inProgress = 0;
  let completed = 0;
  let r1Completed = 0;
  let r3Completed = 0;
  let saveCostTotal = 0;
  let deliveredSaveCostTotal = 0;
  let profitTotal = 0;
  let realizedProfitTotal = 0;
  let pipelineProfitTotal = 0;

  const memberStats: Record<string, MemberStatData> = {};
  for (const [nick, info] of Object.entries(TEAM_MEMBERS_MAP)) {
    if (nick === "แก้ว") continue; // Canonical key is "แก้วก่อ"
    memberStats[nick] = {
      nick,
      ...info,
      saveCost: 0,
      profit: 0,
      count: 0,
      pending: 0,
      in_progress: 0,
      completed: 0,
      activeTasks: [],
    };
  }
  memberStats["ยังไม่ระบุผู้รับผิดชอบ"] = {
    nick: "ยังไม่ระบุ",
    fullName: "รอจัดสรรผู้รับผิดชอบ",
    code: "-",
    role: "Unassigned Queue",
    unit: "-",
    saveCost: 0,
    profit: 0,
    count: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    activeTasks: [],
  };

  const unitFinancials: Record<string, { saveCost: number; profit: number; count: number; completed: number; pending: number }> = {
    "Management (บริหารทีม)": { saveCost: 0, profit: 0, count: 0, completed: 0, pending: 0 },
    "Creative Designer (งานสร้างสรรค์/ออกแบบ)": { saveCost: 0, profit: 0, count: 0, completed: 0, pending: 0 },
    "PR & Communication (สื่อสารองค์กร/RSP)": { saveCost: 0, profit: 0, count: 0, completed: 0, pending: 0 },
    "Content Marketing (คอนเทนต์/บทความ)": { saveCost: 0, profit: 0, count: 0, completed: 0, pending: 0 },
  };

  let totalWithSatisfaction = 0;
  let sumSatisfaction = 0;
  let totalWithOnTime = 0;
  let onTimeCount = 0;

  const validBriefs = (briefs || []).filter((b: any) => {
    if (!b || b.status === "purged" || b.status === "cancelled") return false;
    const d = b.details || {};
    if (d.is_deleted === true || d.is_permanently_deleted === true || d.is_test === true) return false;
    return true;
  });

  validBriefs.forEach(b => {
    const st = b.status || "pending";
    const details = b.details || {};
    if (st === "completed") {
      completed++;
      if (isR3Task(b)) r3Completed++;
      else r1Completed++;
    } else if (st === "in_progress" || st === "progress") {
      inProgress++;
    } else {
      pending++;
    }

    // Track real satisfaction (Ironclad Rule #4)
    if (st === "completed" && details.survey_status !== "declined") {
      const scores = details.satisfaction_scores;
      let score: number | null = null;
      if (typeof scores?.averagePercent === "number") {
        score = Number(scores.averagePercent);
      } else if (typeof scores?.accuracy === "number") {
        const sum = (scores.accuracy + (scores.timeliness || scores.accuracy) + (scores.quality || scores.accuracy) + (scores.attentiveness || scores.accuracy) + (scores.ownership || scores.accuracy));
        score = Math.round((sum / 25) * 100);
      } else if (details.survey_status === "completed" || (typeof details.satisfaction_rate === "number" && details.satisfaction_rate > 0)) {
        score = Number(details.satisfaction_rate);
      }
      if (score !== null && score > 0) {
        totalWithSatisfaction++;
        sumSatisfaction += score;
      }
    }

    // Track real on-time delivery
    if (st === "completed" && b.completed_at) {
      totalWithOnTime++;
      const dStr = b.deadline || details.usage_date || details.publish_date;
      if (dStr) {
        const dl = new Date(dStr).getTime();
        const cp = new Date(b.completed_at).getTime();
        if (cp <= dl + 86400000) {
          onTimeCount++;
        }
      } else {
        onTimeCount++;
      }
    }

    const { totalSaveCost: sc, ownerShare, assistantShares } = getTaskFinancialDistribution(b);
    const isPM = isCcPmProject(b);
    const pr = isPM
      ? (Number(details.profit) !== undefined && details.profit !== null
          ? Number(details.profit)
          : (Number(details.revenue || 0) - Number(details.cost || 0)))
      : 0;

    saveCostTotal += sc;
    if (st === "completed") deliveredSaveCostTotal += sc;
    if (pr > 0) {
      profitTotal += pr;
      if (st === "completed") realizedProfitTotal += pr;
      else pipelineProfitTotal += pr;
    }

    const ass = (
      b.assignees?.name ||
      details.assignee_name ||
      details.assignee ||
      (Array.isArray(b.assignees) ? b.assignees[0]?.name : "") ||
      ""
    ).trim();

    let matchedNick = "";
    for (const item of MATCHABLE_MEMBERS) {
      if (ass.includes(item.code) || ass.includes(item.nick)) {
        matchedNick = item.nick;
        break;
      }
    }
    if (!matchedNick) matchedNick = "ยังไม่ระบุผู้รับผิดชอบ";

    const stat = memberStats[matchedNick];
    const ownerVal = ownerShare ? ownerShare.save_cost : sc;
    const ownerProfit = isPM && pr > 0 && ownerShare ? Math.round((pr * ownerShare.percentage) / 100) : pr;
    stat.count += 1;
    stat.saveCost += ownerVal;
    stat.profit += ownerProfit;

    if (st === "completed") {
      stat.completed++;
    } else if (st === "in_progress" || st === "progress") {
      stat.in_progress++;
      if (stat.activeTasks.length < 5) stat.activeTasks.push(b.project_name);
    } else {
      stat.pending++;
      if (stat.activeTasks.length < 5) stat.activeTasks.push(b.project_name);
    }

    // Also credit assistants with percentage > 0
    assistantShares.forEach(ast => {
      const rawAst = Array.isArray(b.details?.assistants)
        ? b.details.assistants.find((a: any) => a.assignee_id === ast.assignee_id)
        : null;
      const astName = ((rawAst?.name || rawAst?.assignee_name || "") as string).trim();
      for (const item of MATCHABLE_MEMBERS) {
        if ((astName && (astName.includes(item.code) || astName.includes(item.nick))) ||
            (ast.assignee_id && DEFAULT_ID_TO_NICK[ast.assignee_id] === item.nick)) {
          const astStat = memberStats[item.nick];
          if (astStat) {
            astStat.count += 1;
            astStat.saveCost += ast.save_cost;
            if (isPM && pr > 0) astStat.profit += Math.round((pr * ast.percentage) / 100);
            if (st === "completed") astStat.completed++;
            else if (st === "in_progress" || st === "progress") astStat.in_progress++;
            else astStat.pending++;
          }
          break;
        }
      }
    });

    // Accumulate to units based on task unit or member unit
    const uRaw = (b.unit || "").toLowerCase();
    let unitKey = "";
    if (uRaw === "internal" || stat.unit === "Management") unitKey = "Management (บริหารทีม)";
    else if (uRaw === "creative" || stat.unit === "Design") unitKey = "Creative Designer (งานสร้างสรรค์/ออกแบบ)";
    else if (uRaw === "pr" || stat.unit === "PR") unitKey = "PR & Communication (สื่อสารองค์กร/RSP)";
    else if (uRaw === "content" || stat.unit === "Content") unitKey = "Content Marketing (คอนเทนต์/บทความ)";

    if (unitKey && unitFinancials[unitKey]) {
      unitFinancials[unitKey].saveCost += sc;
      unitFinancials[unitKey].profit += pr;
      unitFinancials[unitKey].count += 1;
      if (st === "completed") unitFinancials[unitKey].completed++;
      else unitFinancials[unitKey].pending++;
    }
  });

  const csatRate = totalWithSatisfaction > 0 ? Number((sumSatisfaction / totalWithSatisfaction).toFixed(1)) : 0;
  const onTimeRate = totalWithOnTime > 0 ? Math.round((onTimeCount / totalWithOnTime) * 100) : 100;

  // Ranking by pending tasks
  const pendingRanking = Object.entries(memberStats)
    .filter(([k]) => k !== "ยังไม่ระบุผู้รับผิดชอบ")
    .map(([, s]) => s)
    .sort((a, b) => b.pending - a.pending);

  const topPending = pendingRanking.length > 0 && pendingRanking[0].pending > 0
    ? pendingRanking[0]
    : null;

  // Ranking by Save Cost
  const saveCostRanking = Object.entries(memberStats)
    .filter(([k]) => k !== "ยังไม่ระบุผู้รับผิดชอบ")
    .map(([, s]) => s)
    .sort((a, b) => b.saveCost - a.saveCost);

  const topSaveCostMember = saveCostRanking.length > 0 ? saveCostRanking[0] : null;

  // Top save cost in operational/production units (excluding Management)
  const topProductionSaveCostMember = saveCostRanking.find(m => m.unit !== "Management") || null;

  // Top unit by Save Cost
  const sortedUnits = Object.entries(unitFinancials).sort((a, b) => b[1].saveCost - a[1].saveCost);
  const topSaveCostUnit = sortedUnits.length > 0 ? { name: sortedUnits[0][0], saveCost: sortedUnits[0][1].saveCost } : null;

  return {
    totals: { 
      total: validBriefs.length, 
      pending, 
      inProgress, 
      completed,
      r1Completed,
      r3Completed,
      saveCostTotal,
      deliveredSaveCostTotal,
      profitTotal,
      realizedProfitTotal,
      pipelineProfitTotal,
      csatRate,
      csatEvaluationsCount: totalWithSatisfaction,
      onTimeRate,
      deliveredCount: totalWithOnTime
    },
    memberStats,
    pendingRanking,
    topPending,
    saveCostRanking,
    topSaveCostMember,
    topProductionSaveCostMember,
    unitFinancials,
    topSaveCostUnit,
    unassignedCount: memberStats["ยังไม่ระบุผู้รับผิดชอบ"].pending,
  };
}

const DEFAULT_ID_TO_NICK: Record<string, string> = {
  "18c2cc99-e677-43fd-bbaf-fcb83e23210e": "จ๊อบ",
  "daca31a4-5efd-475e-80ee-b9f38dd381cb": "วา",
  "fa87becd-45b3-4590-b381-ded430ce7975": "ก้อง",
  "d99de87a-eb50-4383-a050-1f24a52b4620": "จอย",
  "47adfbc2-8d0e-4dc7-87ad-98895be82026": "พิม",
  "7800682c-8aed-45cf-ab31-45473fd16e3d": "เยียร์",
  "82faa669-a2b6-4497-88cf-8856a867176f": "นิน",
  "82faa669-a2b6-4497-88cf-8556a867176f": "นิน",
  "3ab19406-29cc-4430-b4bf-2cfe9a1c29b7": "แก้วก่อ",
  "b04669b5-6e86-4629-9e66-57d464881653": "ลูกอิน",
  "a2cf6e47-fc1c-4c19-b080-fe4b57f4a66a": "เอ็นจอย",
  "e2c2672d-81c4-411d-89e9-bcbb6eb374f5": "โอ๊ต",
  "6984154a-2975-4040-a557-aec9d090377f": "ต้า",
};

/**
 * Fetch live data context from Supabase briefs for AI or fallback engine (realtime, all briefs)
 */
export async function getLiveDataContext() {
  const supabase = getSupabase();
  if (!supabase) return { briefs: [], totalCount: 0 };

  try {
    const { data: briefs } = await supabase
      .from("briefs")
      .select("id, project_name, unit, status, created_at, completed_at, deadline, details, coordinator_nickname, decision_maker, assignee_id, assignees(id, name, email)")
      .neq("status", "purged")
      .order("created_at", { ascending: false });

    const valid = (briefs || []).filter((b: any) => !b.details?.is_deleted && !b.details?.is_permanently_deleted && !b.details?.is_test);
    return { briefs: valid, totalCount: valid.length };
  } catch (err) {
    console.error("Failed to fetch live context:", err);
    return { briefs: [], totalCount: 0 };
  }
}

/**
 * Free AI Query Engine with Model Rotation & Zero-Cost Rule Fallback
 */
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ccteam.vercel.app";

export const SYSTEM_PORTAL_URLS = {
  portal: `${APP_BASE_URL}/dashboard?view=dashboards`,
  okrGoals: `${APP_BASE_URL}/dashboard?view=dashboards&tab=goals`,
  workloads: `${APP_BASE_URL}/dashboard?view=dashboards&tab=workloads`,
  assignments: `${APP_BASE_URL}/dashboard?view=assignments`,
  dataReports: `${APP_BASE_URL}/dashboard?view=data-reports`,
  briefRequest: `${APP_BASE_URL}/request`,
  trackStatus: `${APP_BASE_URL}/track`,
  survey: `${APP_BASE_URL}/survey`,
  idcForm: `${APP_BASE_URL}/idc-form`,
  rspPressForm: `${APP_BASE_URL}/rsp-press-form`,
};

export async function queryLineAI(
  userQuestion: string,
  groupName: string = "general",
  groupId: string = "",
  askerName: string = ""
): Promise<string> {
  const { briefs } = await getLiveDataContext();
  const analytics = analyzeWorkload(briefs);
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const callerLabel = getProperCallerName(askerName);

  const recentTurns = groupId ? getRecentHistory(groupId, 6) : [];
  const learnedFacts = getAllLearnedFacts();

  const historyContext = recentTurns.length > 0
    ? recentTurns.map(t => `${t.role === "assistant" ? "น้อง CC" : t.senderName}: ${t.text}`).join("\n")
    : "ยังไม่มีประวัติการคุยก่อนหน้า";

  if (
    userQuestion.includes("จำไว้") ||
    userQuestion.includes("รู้ไว้") ||
    userQuestion.includes("โน้ตไว้") ||
    userQuestion.includes("ข้อมูลใหม่")
  ) {
    recordLearnedFact(userQuestion.replace(/น้อง[\s_]?cc|จำไว้ว่า|โน้ตไว้ว่า/gi, "").trim(), groupName);
  }

  const qClean = userQuestion.toLowerCase().replace(/น้อง[\s_]?cc|น้องซีซี/gi, "").trim();

  // 1. FAST-PATH DIRECT LINK INTERCEPTORS
  const isAskingForKrR = (
    qClean === "kr / r" ||
    qClean === "kr/r" ||
    qClean === "kr" ||
    qClean === "r" ||
    qClean === "okr" ||
    (qClean.includes("kr") && (qClean.includes("ขอ") || qClean.includes("ลิงก์") || qClean.includes("ลิ้งค์") || qClean.includes("ขอลบิงก์") || qClean.includes("url") || qClean.includes("ดู") || qClean.includes("ที่ไหน"))) ||
    (qClean.includes("เป้าหมาย") && (qClean.includes("ลิงก์") || qClean.includes("ลิ้งค์") || qClean.includes("ขอลบิงก์") || qClean.includes("ขอ") || qClean.includes("ดู")))
  );

  if (isAskingForKrR) {
    return `${callerLabel} สามารถเข้าดูและติดตามตัวชี้วัดเป้าหมาย OKRs & KR/R Metrics (KR1-KR4, R1-R9) ทั้งหมดของทีมได้โดยตรงที่ลิงก์นี้เลยค่ะ 🎯✨\n\n🔗 **ระบบตัวชี้วัดเป้าหมาย OKRs (KR / R):**\n${SYSTEM_PORTAL_URLS.okrGoals}\n\n*(หรือดูแดชบอร์ดภาพรวมทั้งระบบได้ที่: ${SYSTEM_PORTAL_URLS.portal})*`;
  }

  const isAskingForLinksGeneral = (
    qClean === "ขอลิงก์" ||
    qClean === "ขอ ลิ้งค์หน่อย" ||
    qClean === "ขอลิงก์หน่อย" ||
    qClean === "ขอ ลิงก์หน่อย" ||
    qClean === "ขอลิ้งค์หน่อย" ||
    qClean === "ขอ ลิ้งค์" ||
    qClean === "ขอลบิงก์" ||
    qClean === "ขอลิงค์" ||
    qClean === "ลิงก์" ||
    qClean === "ลิ้งค์" ||
    qClean === "ขอลิ้งค์" ||
    qClean === "ขอ link" ||
    qClean === "ขอ url" ||
    qClean.includes("ขอลิงก์ระบบ") ||
    qClean.includes("ขอลบิงก์ระบบ") ||
    qClean.includes("ขอลิ้งค์ระบบ") ||
    qClean.includes("ตรวจสอบรายละเอียดและ insight ได้ที่ไหน") ||
    qClean.includes("ดู insight ได้ที่ไหน") ||
    qClean.includes("ตรวจสอบรายละเอียดและ insight") ||
    qClean.includes("เข้าดูได้ที่ไหน") ||
    qClean.includes("ดูได้ที่ไหน") ||
    qClean.includes("ลิงก์เข้าดู") ||
    qClean.includes("ลิ้งค์เข้าดู")
  );

  if (isAskingForLinksGeneral) {
    return `ยินดีค่ะ${callerLabel}! น้อง CC จัดส่งลิงก์เข้าใช้งานระบบ CC Insights Portal และบริการสำคัญของทีมให้เรียบร้อยแล้วค่ะ 🌸✨\n\n📊 **CC Insights Portal & Dashboard ภาพรวม:**\n${SYSTEM_PORTAL_URLS.portal}\n\n🎯 **ระบบติดตามเป้าหมาย OKRs & KR/R Metrics:**\n${SYSTEM_PORTAL_URLS.okrGoals}\n\n📋 **กระดานบริหารจัดการงานทีม CC (Task Assignments):**\n${SYSTEM_PORTAL_URLS.assignments}\n\n📝 **ฟอร์มส่งบรีฟงานใหม่ (Request Creative Brief):**\n${SYSTEM_PORTAL_URLS.briefRequest}\n\n🔍 **ติดตามสถานะงานแบบเรียลไทม์ (Track Status):**\n${SYSTEM_PORTAL_URLS.trackStatus}\n\n📑 **ศูนย์รายงานข้อมูล ISO/KM/WI:**\n${SYSTEM_PORTAL_URLS.dataReports}\n\nสามารถคลิกที่ลิงก์ด้านบนเพื่อเข้าใช้งานได้ทันทีเลยนะคะ 🚀`;
  }

  // 2. Try Gemini with Model Rotation if API Key is available
  if (geminiApiKey) {
    const systemPrompt = `คุณคือ "น้อง CC" ผู้ช่วย AI อัจฉริยะน้องเล็ก Gen Z ประจำทีม Creative and Communication (CC) ของ STeP มหาวิทยาลัยเชียงใหม่ 🌸✨

🎯 กฎเหล็กสำคัญระดับสูงสุด (Strict Guidelines):
1. **รอบรู้ข้อมูลทั้งระบบแบบ Realtime (Full Realtime System Awareness):**
   ในระบบ CC Insights Portal มีการบันทึกและคำนวณตัวชี้วัดมูลค่าการประหยัดงบประมาณ (Save Cost) และผลงานแยกรายบุคคลทั้ง 12 คน และแยกตาม 4 ยูนิตอย่างแม่นยำชัดเจนตามสถิติด้านล่าง! ห้ามตอบเด็ดขาดว่าระบบไม่มีข้อมูลหรือไม่แยกรายบุคคลเด็ดขาด
   - งานทั้งหมดในระบบ: ${analytics.totals.total} งาน | สำเร็จแล้ว: ${analytics.totals.completed} งาน (ภายใน STeP ${analytics.totals.r1Completed} งาน, ภายนอก มช./RSP ${analytics.totals.r3Completed} งาน) | กำลังทำ: ${analytics.totals.inProgress} งาน | งานค้าง (Pending): ${analytics.totals.pending} งาน
   - มูลค่าการประหยัดงบประมาณ (Portfolio Save Cost) รวมทั้งระบบ: ฿${analytics.totals.saveCostTotal.toLocaleString()} บาท (ส่งมอบสำเร็จแล้ว ฿${analytics.totals.deliveredSaveCostTotal.toLocaleString()} บาท) | กำไรโครงการบริหารจัดการ CC: รับรู้จริง ฿${analytics.totals.realizedProfitTotal.toLocaleString()} บาท (Pipeline อยู่ระหว่างดำเนินการ ฿${analytics.totals.pipelineProfitTotal.toLocaleString()} บาท)

2. **ห้ามตอบเป็นเทมเพลต 3 มิติแข็งทื่อเด็ดขาด (No Rigid 3-Block Headers):**
   - **ห้าม** บังคับตอบด้วยฟอร์แมต 3 กล่องแข็งทื่อ (เช่น หัวข้อ "1. ข้อมูลสถานะจริง / 2. ความเสี่ยง / 3. แนวทางแก้ไข") เด็ดขาด!
   - ให้ตอบคำถามตรงไปตรงมาทันทีตั้งแต่ประโยคแรก
   - ใช้น้ำเสียงเป็นมิตร ฉลาด คล่องแคล่ว ทันสมัย ให้เกียรติพี่ๆ ในทีมแบบน้องเล็ก Gen Z มืออาชีพ

3. **ห้ามใช้รหัสตัวชี้วัดเด็ดขาด (Strict No-Code Rule):**
   ห้ามตอบเป็นรหัสเทคนิคอล เช่น ห้ามใช้ T18KR1, T18KR2, T18KR3, T18KR4, KR1, KR2, R1, KRI 1 โดยเด็ดขาด! ให้เรียกเป็น "ชื่อตัวชี้วัด" ภาษาไทยที่ทุกคนและผู้บริหารเข้าใจทันทีเสมอ

4. **กฎการเรียกชื่อพี่ๆ และอาจารย์ในห้องแชท (LINE Identity & Honorific Names):**
   - "job" -> เรียก "พี่จ๊อบ" (CC Lead / หัวหน้าทีม CC, รหัสประจำตัว AA)
   - "autcha.pim" -> เรียก "พี่พิม" (Creative Designer - Unit Design, รหัสประจำตัว AC)
   - "Bao-Suriyah CMU" -> เรียก "อาจารย์บ่าว" (ผศ.ดร.สุริยะ ทองมุณี รองผู้อำนวยการ STeP, รหัสประจำตัว ST)
   - "Golf-Choncharoen CMU" -> เรียก "อาจารย์กอล์ฟ" (ผู้ช่วยผู้อำนวยการอุทยานวิทยาศาสตร์ภูมิภาค ภาคเหนือ, รหัสประจำตัว CS)
   - "Itsara" -> เรียก "พี่ก้อง" (Creative Designer - Unit Design, รหัสประจำตัว IK)
   - "Kaewkor 🌻" -> เรียก "พี่แก้วก่อ" (Content Creator - Unit Content, รหัสประจำตัว KYK)
   - "Lalynn 🐤" -> เรียก "พี่เยียร์" (Creative Designer - Unit Design, รหัสประจำตัว LLP)
   - "Leēk ╰innn♡~~" -> เรียก "พี่ลูกอิน" (Content Creator - Unit Content, รหัสประจำตัว STK)
   - "ma.ta.nin" -> เรียก "พี่นิน" (Creative Designer - Unit Design, รหัสประจำตัว MTN)
   - "Oat 🍉" -> เรียก "พี่โอ๊ต" (PR - Unit PR, รหัสประจำตัว CNB)
   - "RATI.JOY" -> เรียก "พี่จอย" (Creative Designer - Unit Design, รหัสประจำตัว RL)
   - "Tanyanuparb" หรือ "Tanya Ob-Oon" -> เรียก "อาจารย์อ้วน" (ผู้อำนวยการอุทยานวิทยาศาสตร์ภูมิภาค ภาคเหนือ, รหัสประจำตัว TY)
   - "T'tar ◡̈ 🍀" -> เรียก "พี่ต้า" (PR - Unit PR, รหัสประจำตัว TTY)
   - "waweewa 🦋" -> เรียก "พี่วา" (Creative Lead & ผู้รับผิดชอบ Unit Design, รหัสประจำตัว WK)
   - "Witty Win VVIIV" -> เรียก "อาจารย์วิน" (ผู้บริหาร, รหัสประจำตัว PW)
   - "น้องจอย" -> เรียก "พี่เอ็นจอย" (Content Creator - Unit Content, รหัสประจำตัว SLR)

5. **ห้ามเตือนเรื่องสุขภาพ/จิบน้ำ/พักสายตาโดยเด็ดขาด** เว้นแต่ผู้ใช้จะถามเรื่องสุขภาพโดยตรง
6. **ไม่ชวนคุยต่อและไม่มีประโยคลงท้ายซ้ำซาก**
7. **กฎเหล็กป้องกันข้อมูลหลอน (Strict Anti-Hallucination & Zero-Fake Baseline):**
   - ห้ามแต่งตัวเลข สถิติ ชื่องาน หรือคิดค้นข้อมูลที่ไม่มีอยู่จริงในระบบเด็ดขาด

💰 สถิติตัวชี้วัดมูลค่าการประหยัดงบประมาณ (Save Cost) รายบุคคลในระบบ (เรียงตามยอดสะสม):
${analytics.saveCostRanking.map((m, i) => `${i + 1}. ${m.nick} ${m.code} (${m.unit}): ฿${m.saveCost.toLocaleString()} บาท (รับผิดชอบ ${m.count} งาน, สำเร็จแล้ว ${m.completed} งาน, กำลังทำ ${m.in_progress} งาน, ค้าง ${m.pending} งาน)`).join("\n")}

🏢 สถิติมูลค่าการประหยัดงบประมาณ (Save Cost) แยกตาม 4 ยูนิต:
${Object.entries(analytics.unitFinancials).map(([u, d], i) => `${i + 1}. ${u}: ฿${d.saveCost.toLocaleString()} บาท (รวม ${d.count} งาน, สำเร็จแล้ว ${d.completed} งาน, ค้าง ${d.pending} งาน)`).join("\n")}

📊 ภาระงานจริงในระบบ (Live Workload):
- ผู้ที่มีงานค้างสูงสุด: ${analytics.topPending ? `${analytics.topPending.nick} ${analytics.topPending.code} (${analytics.topPending.pending} งาน - ${analytics.topPending.unit})` : "ไม่มีงานค้าง"}
- อันดับงานค้าง: ${analytics.pendingRanking.slice(0, 5).map(r => `${r.nick} (${r.pending} งาน)`).join(", ")}
- งานที่ยังไม่ระบุผู้รับผิดชอบ: ${analytics.unassignedCount} งาน

🎯 เป้าหมายตัวชี้วัดหลักของทีม CC (ปีงบประมาณ 2570):
- ผลงานสนับสนุนภายในองค์กร (STeP): สำเร็จแล้ว ${analytics.totals.r1Completed} งาน (จากเป้าหมายทั้งปี 1,200 งาน)
- ผลงานสนับสนุนภายนอก มช. และเครือข่าย RSP: สำเร็จแล้ว ${analytics.totals.r3Completed} งาน (จากเป้าหมายทั้งปี 350 งาน)
- มูลค่าการประหยัดงบประมาณ (Save Cost): รวมในระบบ ฿${analytics.totals.saveCostTotal.toLocaleString()} บาท | ส่งมอบสำเร็จแล้ว ฿${analytics.totals.deliveredSaveCostTotal.toLocaleString()} บาท
- กำไรจากการให้บริการของทีม: รับรู้จริง ฿${analytics.totals.realizedProfitTotal.toLocaleString()} บาท | Pipeline อยู่ระหว่างดำเนินงาน ฿${analytics.totals.pipelineProfitTotal.toLocaleString()} บาท (เป้าหมายทั้งปี 4,000,000 บาท)
- ความพึงพอใจของผู้รับบริการ: ${analytics.totals.csatRate}% (ประเมินแล้ว ${analytics.totals.csatEvaluationsCount} งาน • เป้าหมาย ≥ 85%) | อัตราส่งมอบตรงเวลา ${analytics.totals.onTimeRate}% (จาก ${analytics.totals.deliveredCount} งานที่ปิดส่งมอบ)

🌐 ลิงก์ระบบสำคัญทั้งหมดของทีม CC:
- CC Insights Portal & Dashboard ภาพรวม: ${SYSTEM_PORTAL_URLS.portal}
- ระบบตัวชี้วัดเป้าหมาย OKRs & KR/R Metrics: ${SYSTEM_PORTAL_URLS.okrGoals}
- กระดานติดตามและบริหารงานทีม CC: ${SYSTEM_PORTAL_URLS.assignments}
- ฟอร์มส่งบรีฟงานใหม่: ${SYSTEM_PORTAL_URLS.briefRequest}
- ตรวจสอบสถานะงาน: ${SYSTEM_PORTAL_URLS.trackStatus}
- ศูนย์รายงานข้อมูล ISO/KM/WI: ${SYSTEM_PORTAL_URLS.dataReports}

📚 ข้อมูลที่จดจำได้:
${learnedFacts.slice(0, 3).join("\n") || "ไม่มี"}

💬 บทสนทนาก่อนหน้า:
${historyContext}

คำถามจาก ${callerLabel} ในกลุ่ม "${groupName}": "${userQuestion}"
จงตอบอย่างฉลาด เป็นธรรมชาติ ตอบตรงคำถามทันทีในประโยคแรก ห้ามใช้รหัสตัวชี้วัดเด็ดขาด และห้ามตอบเป็นเทมเพลต 3 กล่องแข็งทื่อ:`;

    for (let attempt = 0; attempt < GEMINI_MODELS.length; attempt++) {
      const model = GEMINI_MODELS[(currentModelIndex + attempt) % GEMINI_MODELS.length];
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: { maxOutputTokens: 1200, temperature: 0.5 }
          })
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const parts = data.candidates?.[0]?.content?.parts || [];
          const nonThoughtParts = parts.filter((p: any) => !p.thought && p.text);
          let text = nonThoughtParts.map((p: any) => p.text).join("\n").trim();
          if (!text && parts[0]?.text) {
            text = parts[0].text.trim();
          }
          text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

          if (/\[(?:แทรก|ใส่)?\s*(?:URL|url|ลิงก์|ลิ้งค์|link)[\s\S]*?\]/i.test(text) || text.includes("[แทรก")) {
            const isKrR = userQuestion.toLowerCase().includes("kr") || userQuestion.toLowerCase().includes("okr") || userQuestion.includes("เป้าหมาย");
            const replacementUrl = isKrR ? SYSTEM_PORTAL_URLS.okrGoals : SYSTEM_PORTAL_URLS.portal;
            text = text.replace(/\[(?:แทรก|ใส่)?\s*(?:URL|url|ลิงก์|ลิ้งค์|link)[\s\S]*?\]/gi, replacementUrl);
            text = text.replace(/\[แทรก[\s\S]*?\]/gi, replacementUrl);
          }

          const isValidResponse = text.length > 20 && /[ก-๙]/.test(text) && !text.startsWith(":*");
          if (isValidResponse) {
            currentModelIndex = (currentModelIndex + attempt) % GEMINI_MODELS.length;
            return text;
          }
        } else if (res.status === 429 || res.status === 503) {
          console.warn(`Gemini Model ${model} returned ${res.status}, rotating...`);
          continue;
        }
      } catch (err) {
        console.warn(`Gemini API error with model ${model}:`, err);
      }
    }
  }

  return fallbackRuleEngine(userQuestion, briefs, analytics);
}

/**
 * Intelligent Data Synthesis Fallback Engine (100% Free, Accurate, Direct, Risk-Aware & Conversational)
 */
export function fallbackRuleEngine(query: string, briefs: any[], preAnalytics?: WorkloadAnalytics): string {
  const q = query.toLowerCase();
  const analytics = preAnalytics || analyzeWorkload(briefs);
  const { totals, memberStats, pendingRanking, saveCostRanking, topProductionSaveCostMember, unitFinancials, unassignedCount } = analytics;

  // 1. ใครเซฟเงิน / ใครเซพเงินได้สูงสุด / ยูนิตไหนประหยัดงบได้มากสุด / อันดับ Save Cost
  if (
    q.includes("เซพเงิน") ||
    q.includes("เซฟเงิน") ||
    q.includes("ประหยัดเงิน") ||
    q.includes("ประหยัดงบ") ||
    (q.includes("save cost") && (q.includes("ใคร") || q.includes("สูงสุด") || q.includes("มากสุด") || q.includes("อันดับ") || q.includes("ยูนิต") || q.includes("คนไหน") || q.includes("แต่ละ"))) ||
    (q.includes("ใคร") && (q.includes("เซฟ") || q.includes("เซพ") || q.includes("ประหยัด")))
  ) {
    const top1 = saveCostRanking[0];
    const topProd = topProductionSaveCostMember;

    const rankList = saveCostRanking.slice(0, 5).map((m, idx) => 
      `${idx + 1}. **คุณ${m.nick} ${m.code}** (${m.unit}): ฿${m.saveCost.toLocaleString()} บาท (${m.completed} งานสำเร็จ)`
    ).join("\n");

    const unitList = Object.entries(unitFinancials).map(([u, d]) => 
      `• **${u}:** ฿${d.saveCost.toLocaleString()} บาท (${d.completed} งานสำเร็จ / รวม ${d.count} งาน)`
    ).join("\n");

    return `ผู้ที่ทำยอดประหยัดงบประมาณ (Portfolio Save Cost) สูงสุดในภาพรวมทั้งระบบคือ **คุณ${top1 ? `${top1.nick} ${top1.code}` : "-"}** สะสมอยู่ที่ **฿${top1 ? top1.saveCost.toLocaleString() : "0"} บาท** ค่ะ ✨

${topProd && topProd.nick !== top1?.nick ? `และในสายงานผลิต (Production) ผู้สร้างมูลค่า Save Cost สูงสุดคือ **คุณ${topProd.nick} ${topProd.code} (${topProd.unit})** ทำยอดสะสมไปได้ **฿${topProd.saveCost.toLocaleString()} บาท** ค่ะ! 🎨\n` : ""}
🏆 **5 อันดับสมาชิกที่สร้างมูลค่า Save Cost สูงสุด:**
${rankList}

🏢 **มูลค่า Save Cost แยกตาม 4 ยูนิต:**
${unitList}

💡 *สรุปภาพรวม:* ยอดรวม Portfolio Save Cost ทั้งระบบตอนนี้อยู่ที่ **฿${totals.saveCostTotal.toLocaleString()} บาท** (ส่งมอบสำเร็จแล้ว **฿${totals.deliveredSaveCostTotal.toLocaleString()} บาท**) ค่ะ 🌸`;
  }

  // 2. ถามถึงงานของสมาชิกคนใดคนหนึ่ง
  for (const item of MATCHABLE_MEMBERS) {
    if (q.includes(item.nick) || (item.code && q.includes(item.code.toLowerCase()))) {
      const s = memberStats[item.nick];
      if (!s) continue;
      if (item.nick === "จ๊อบ") {
        return `สรุปภาพรวมงานของ**พี่จ๊อบ AA** (CC Lead) ให้ค่ะ ✨

ตอนนี้ภาพรวมทีม CC ส่งมอบงานสำเร็จไปแล้ว ${totals.completed} งาน (จากทั้งหมด ${totals.total} งาน) สร้างมูลค่า Portfolio Save Cost รวมทั้งระบบ **฿${totals.saveCostTotal.toLocaleString()} บาท** (ส่งมอบสำเร็จแล้ว **฿${totals.deliveredSaveCostTotal.toLocaleString()} บาท**) โดยยอดเฉพาะงานในความรับผิดชอบของพี่จ๊อบอยู่ที่ **฿${s.saveCost.toLocaleString()} บาท** และกำไรโครงการบริหารจัดการ CC สะสม **฿${s.profit.toLocaleString()} บาท** ค่ะ 🌸`;
      }

      const activeList = s.activeTasks.length > 0 ? s.activeTasks.slice(0, 3).map((t: string) => `• ${t}`).join("\n") : "• ไม่มีงานค้างในมือ";
      const isHighLoad = s.pending >= 5;

      return `อัปเดตสถานะงานของ**${item.nick} ${item.code}** (${item.info.role} - ยูนิต ${item.info.unit}) ค่ะ 🌸

📊 **ภาระงานปัจจุบัน:**
• งานในมือ: รอทำ (Pending) ${s.pending} งาน | กำลังทำ ${s.in_progress} งาน | สำเร็จแล้ว ${s.completed} งาน (รวม ${s.count} งาน)
• มูลค่า Save Cost ที่สร้างได้: **฿${s.saveCost.toLocaleString()} บาท**
• ตัวอย่างงานที่กำลังดูแล:
${activeList}

${isHighLoad
  ? `💡 *ข้อแนะนำ:* ตอนนี้มีงานค้างสะสม ${s.pending} งาน อาจพิจารณาจัดลำดับความสำคัญ (Priority) หรือขอกำลังเสริมจากเพื่อนร่วมยูนิตเพื่อป้องกันงานชนกำหนดส่งมอบนะคะ ✨`
  : `💡 *ข้อแนะนำ:* ปริมาณงานอยู่ในระดับที่จัดการได้คล่องตัวดีมาก แนะนำให้อัปเดตสถานะงานในระบบอย่างต่อเนื่อง เพื่อรักษาอัตราส่งมอบตรงเวลา ${totals.onTimeRate}% ค่าบ ✨`}`;
    }
  }

  // 3. วิเคราะห์ปัญหางานค้าง / ใครงานค้างมากสุด / ทำไมงานค้างเยอะ
  if (
    q.includes("ใครงานค้าง") ||
    q.includes("งานค้างมากสุด") ||
    q.includes("ใครค้าง") ||
    (q.includes("วิเคราะห์") && (q.includes("งานค้าง") || q.includes("ค้าง"))) ||
    (q.includes("ทำไม") && (q.includes("งานค้าง") || q.includes("ค้าง")))
  ) {
    const top1 = pendingRanking[0];
    const top2 = pendingRanking[1];
    const top3 = pendingRanking[2];

    return `ผู้ที่มีงานค้างสะสมสูงสุดในระบบตอนนี้คือ **คุณ${top1 ? `${top1.nick} ${top1.code}` : "-"}** อยู่ที่ **${top1 ? top1.pending : 0} งาน** (ยูนิต ${top1 ? top1.unit : "-"}) ค่ะ

📊 **สถานะงานค้างและอันดับในระบบ:**
• งานค้างสะสมทั้งหมดในระบบ: **${totals.pending} งาน** (จากทั้งหมด ${totals.total} งาน)
• สมาชิกที่มีงานค้างรองลงมา: คุณ${top2 ? `${top2.nick} (${top2.pending} งาน)` : "-"}, คุณ${top3 ? `${top3.nick} (${top3.pending} งาน)` : "-"}
• งานที่ยังไม่ระบุผู้รับผิดชอบ: ${unassignedCount} งาน

💡 **ข้อสังเกตและแนวทางบริหารจัดการ:**
1. แนะนำให้หัวหน้ายูนิตตรวจสอบลำดับความสำคัญของงานที่ค้างและช่วยเกลี่ยผู้ช่วย (Assistant) เสริมในงานที่มีสโคปใหญ่
2. หากมีงานที่ยังไม่มีผู้รับผิดชอบ (${unassignedCount} งาน) แนะนำให้เร่ง Assign เพื่อให้เริ่มรันคิวได้ทันทีค่ะ ✨`;
  }

  // 4. ขอละเอียดกว่านี้ / ตัวชี้วัด / ผลงาน / OKR / KPI / TIP
  if (
    q.includes("ละเอียด") ||
    q.includes("kr") ||
    (q.includes("r") && (q.includes("ค่า") || q.includes("ตัวชี้วัด") || q.includes("ต่าง"))) ||
    q.includes("okr") ||
    q.includes("kpi") ||
    q.includes("tip")
  ) {
    return `สรุปความคืบหน้าตัวชี้วัดและผลงานของทีม CC (ปีงบประมาณ 2570) ให้ค่ะ 🏆

📈 **ผลการดำเนินงานเทียบเป้าหมาย:**
• **ผลงานสนับสนุนภายในองค์กร (STeP):** ส่งมอบสำเร็จแล้ว **${totals.r1Completed} งาน** (จากเป้าหมายทั้งปี 1,200 งาน)
• **ผลงานสนับสนุนภายนอก มช. และเครือข่าย RSP:** ส่งมอบสำเร็จแล้ว **${totals.r3Completed} งาน** (จากเป้าหมายทั้งปี 350 งาน)
• **มูลค่าการประหยัดงบประมาณ (Save Cost):** รวมในระบบ **฿${totals.saveCostTotal.toLocaleString()} บาท** (ส่งมอบสำเร็จแล้ว **฿${totals.deliveredSaveCostTotal.toLocaleString()} บาท**)
• **กำไรโครงการบริหารจัดการของทีม:** รับรู้จริง **฿${totals.realizedProfitTotal.toLocaleString()} บาท** | Pipeline อยู่ระหว่างดำเนินงาน **฿${totals.pipelineProfitTotal.toLocaleString()} บาท** (เป้าหมายทั้งปี 4,000,000 บาท)
• **ความพึงพอใจของผู้รับบริการ (CSAT):** **${totals.csatRate}%** (ประเมินแล้ว ${totals.csatEvaluationsCount} งาน • เป้าหมาย ≥ 85%)
• **อัตราการส่งมอบงานตรงต่อเวลา:** **${totals.onTimeRate}%** (จาก ${totals.deliveredCount} งานที่ส่งมอบสำเร็จ)

🔗 **ระบบตัวชี้วัดเป้าหมาย OKRs & KR/R:**
${SYSTEM_PORTAL_URLS.okrGoals}`;
  }

  // 5. รายงานภาพรวมเดือนนี้ / สรุปภาพรวม
  if (q.includes("ภาพรวม") || q.includes("สรุปเดือน") || q.includes("รายงาน") || q.includes("สถิติ")) {
    const pendingRate = Math.round((totals.pending / (totals.total || 1)) * 100);
    const completedRate = Math.round((totals.completed / (totals.total || 1)) * 100);

    const unitLines = Object.entries(unitFinancials)
      .map(([u, d]) => `• ${u}: เสร็จ ${d.completed}/${d.count} งาน (Save Cost ฿${d.saveCost.toLocaleString()} บาท)`)
      .join("\n");

    return `สรุปภาพรวมการดำเนินงานของทีม CC ทั้งระบบในปัจจุบันค่ะ ✨

📊 **สถิติภาพรวมงาน:**
• รวมงานในระบบทั้งหมด: **${totals.total} งาน**
  - ส่งมอบสำเร็จแล้ว: **${totals.completed} งาน** (${completedRate}%) [ภายใน STeP ${totals.r1Completed} งาน • ภายนอก มช./RSP ${totals.r3Completed} งาน]
  - กำลังดำเนินการ: **${totals.inProgress} งาน**
  - รอทำ (Pending): **${totals.pending} งาน** (${pendingRate}%)
  - รอมอบหมาย (Unassigned): **${unassignedCount} งาน**
• มูลค่าประหยัดงบประมาณสะสม (Portfolio Save Cost): **฿${totals.saveCostTotal.toLocaleString()} บาท** (ส่งมอบสำเร็จแล้ว **฿${totals.deliveredSaveCostTotal.toLocaleString()} บาท**)
• กำไรโครงการบริหารจัดการ CC: รับรู้จริง **฿${totals.realizedProfitTotal.toLocaleString()} บาท** | Pipeline อยู่ระหว่างดำเนินงาน **฿${totals.pipelineProfitTotal.toLocaleString()} บาท**
• ความพึงพอใจเฉลี่ย: **${totals.csatRate}%** (ประเมินแล้ว ${totals.csatEvaluationsCount} งาน • เป้าหมาย ≥ 85%)

👥 **ผลงานแยกตาม 4 ยูนิต:**
${unitLines}

🔗 **CC Insights Portal & Dashboard ภาพรวม:**
${SYSTEM_PORTAL_URLS.portal}`;
  }

  // 6. ขอลิงก์ส่งบรีฟ / ฟอร์มขอรับบริการ / ลิงก์ระบบสำคัญ
  if (
    q === "ขอบรีฟ" ||
    q === "ขอลิงก์" ||
    q === "ขอ ลิ้งค์หน่อย" ||
    q === "ขอลิงก์หน่อย" ||
    q === "ขอลิ้งค์หน่อย" ||
    q === "ขอลบิงก์" ||
    q === "ลิงก์" ||
    q === "ลิ้งค์" ||
    q === "ส่งงาน" ||
    q.includes("ขอลิงก์บรีฟ") ||
    q.includes("ขอแบบฟอร์ม") ||
    q.includes("ลิงก์ส่งงาน") ||
    q.includes("ส่งงานที่ไหน") ||
    q.includes("ขอลิงก์ระบบ") ||
    q.includes("ขอลบิงก์ระบบ") ||
    q.includes("ดู insight ได้ที่ไหน") ||
    q.includes("ตรวจสอบรายละเอียดและ insight ได้ที่ไหน")
  ) {
    return `น้อง CC จัดส่งลิงก์เข้าใช้งานระบบ CC Insights Portal และบริการสำคัญของทีมให้เรียบร้อยแล้วค่ะ 🌸✨

📊 **CC Insights Portal & Dashboard ภาพรวม:**
${SYSTEM_PORTAL_URLS.portal}

🎯 **ระบบติดตามเป้าหมาย OKRs & KR/R Metrics:**
${SYSTEM_PORTAL_URLS.okrGoals}

📋 **กระดานบริหารจัดการงานทีม CC (Task Assignments):**
${SYSTEM_PORTAL_URLS.assignments}

📝 **ฟอร์มส่งบรีฟงานใหม่ (Request Creative Brief):**
${SYSTEM_PORTAL_URLS.briefRequest}

🔍 **ติดตามสถานะงานแบบเรียลไทม์ (Track Status):**
${SYSTEM_PORTAL_URLS.trackStatus}

📑 **ศูนย์รายงานข้อมูล ISO/KM/WI:**
${SYSTEM_PORTAL_URLS.dataReports}

สามารถคลิกที่ลิงก์ด้านบนเพื่อเข้าใช้งานได้ทันทีเลยนะคะ 🚀`;
  }

  // 7. งานด่วน / Urgent
  if (q.includes("ด่วน") || q.includes("urgent")) {
    const urgentTasks = briefs.filter(b => {
      if (!b || b.status === "completed" || b.status === "cancelled" || b.status === "purged") return false;
      if (b.details?.is_deleted || b.details?.is_permanently_deleted || b.details?.is_test) return false;
      const isMarkedUrgent = b.details?.is_urgent === true || b.details?.isUrgent === true;
      const deadlineStr = b.deadline || b.details?.usage_date || b.details?.publish_date;
      let isNearDeadline = false;
      if (deadlineStr) {
        const diffDays = (new Date(deadlineStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (diffDays >= 0 && diffDays <= 2) isNearDeadline = true;
      }
      return isMarkedUrgent || isNearDeadline;
    });

    if (urgentTasks.length === 0) {
      return `เช็กงานด่วนให้แล้วค่ะ ตอนนี้ไม่มีงานด่วน 48 ชม. ค้างอยู่ในระบบ ทุกโปรเจกต์ดำเนินงานตามแผนปกติค่าบ ✨`;
    }

    let msg = `🚨 มีงานด่วนและใกล้กำหนดส่งมอบ ${urgentTasks.length} งานในระบบค่ะ:\n`;
    urgentTasks.slice(0, 5).forEach((t, i) => {
      const dStr = t.deadline || t.details?.usage_date || "ไม่ระบุ";
      const assignee = t.assignees?.name || t.details?.assignee || "ยังไม่ระบุผู้รับผิดชอบ";
      msg += `\n${i + 1}. **${t.project_name}** (${t.unit}) - กำหนดส่ง: ${dStr} (ผู้ดูแล: ${assignee})`;
    });

    msg += `\n\n💡 แนะนำให้ผู้รับผิดชอบรีบส่งตรวจรอบสุดท้าย และให้หัวหน้ายูนิตช่วยเร่ง Approve เพื่อให้ส่งมอบทันกำหนดเวลาค่ะ ✨`;
    return msg;
  }

  // 8. งานส่งวันนี้
  if (q.includes("วันนี้") || q.includes("today")) {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayTasks = briefs.filter(b => {
      if (!b || b.status === "completed" || b.status === "cancelled" || b.status === "purged") return false;
      if (b.details?.is_deleted || b.details?.is_permanently_deleted || b.details?.is_test) return false;
      const dStr = b.deadline || b.details?.usage_date || b.details?.publish_date;
      return dStr && dStr.startsWith(todayStr);
    });

    if (todayTasks.length === 0) {
      return `เช็กให้แล้วค่ะ วันนี้ไม่มีงานที่มีกำหนดส่งมอบในระบบ จัดการงานได้อย่างราบรื่นเลยค่า ✨`;
    }

    let msg = `🎯 มีงานที่มีกำหนดส่งมอบวันนี้ ${todayTasks.length} งานในระบบค่ะ:\n`;
    todayTasks.forEach((t, i) => {
      const assignee = t.assignees?.name || t.details?.assignee || "ยังไม่ระบุ";
      msg += `\n${i + 1}. **${t.project_name}** (${t.unit}) - ผู้ดูแล: ${assignee}`;
    });
    msg += `\n\n💡 ขอให้ผู้รับผิดชอบเร่งตรวจสอบความเรียบร้อยรอบสุดท้ายและจัดส่งไฟล์ตามเวลาที่นัดหมายนะคะ ✨`;
    return msg;
  }

  // 9. ความผิดปกติ / ความเสี่ยง
  if (q.includes("ผิดปกติ") || q.includes("ความเสี่ยง") || q.includes("เตือน") || q.includes("anomaly") || q.includes("risk")) {
    const activeBriefs = briefs.filter(b => b && b.status !== "completed" && b.status !== "cancelled" && b.status !== "purged" && !b.details?.is_deleted && !b.details?.is_permanently_deleted && !b.details?.is_test);
    const noAssignee = activeBriefs.filter(b => !b.assignees && !b.details?.assignee && !b.assignee_id);
    const now = Date.now();
    const overdue = activeBriefs.filter(b => {
      const dStr = b.deadline || b.details?.usage_date || b.details?.publish_date;
      return dStr && new Date(dStr).getTime() < now;
    });

    return `สแกนจุดเฝ้าระวังและความเสี่ยงในระบบ CC ให้เรียบร้อยค่ะ ⚠️

• **งานที่ยังไม่มีผู้รับผิดชอบ:** ${noAssignee.length} งาน (เสี่ยงต่อการเริ่มงานล่าช้า)
• **งานเกินกำหนดส่ง (Overdue):** ${overdue.length} งาน (อาจกระทบต่ออัตราการส่งมอบตรงเวลา)

💡 แนะนำให้คุณวา (Creative Lead) หรือคุณจ๊อบ เข้าไปตรวจสอบและ Assign ผู้รับผิดชอบในระบบ รวมถึงประสานงานผู้ขอเพื่ออัปเดตไทม์ไลน์เชิงรุกนะคะ 🌸`;
  }

  // 10. ขอไอเดีย / เทรนด์สร้างสรรค์
  if (q.includes("เทรนด์") || q.includes("ไอเดีย") || q.includes("ความคิดสร้างสรรค์") || q.includes("trend") || q.includes("idea")) {
    return `💡 [Creative & Trends Drop On-Demand 🎨✨]
สามารถอ่านเทรนด์สร้างสรรค์ประจำวันฉบับย่อได้ใน Morning Brief 09:00 น. หรือคลิกดูไอเดียใหม่ๆ:
🔗 Fast Company Design: https://www.fastcompany.com/co-design
🔗 Ad Age Creativity: https://adage.com/creativity
🔗 Content Marketing Institute: https://contentmarketinginstitute.com
อยากได้ไอเดียสายไหน (Design, Content, PR) ถามน้อง CC เจาะจงได้เลยค่าา 🚀`;
  }

  // 11. สุขภาพกาย / สุขภาพใจ (เฉพาะเมื่อถามถึงโดยตรง)
  if (q.includes("สุขภาพ") || q.includes("เมื่อย") || q.includes("ปวด") || q.includes("office syndrome") || q.includes("พักผ่อน") || q.includes("เครียด") || q.includes("เหนื่อย")) {
    return `🧘‍♂️ [Office Care & Mind Reset 🤍]
• พักสายตาด้วยกฎ 20-20-20 (มองไกล 20 ฟุต 20 วินาที ทุก 20 นาที)
• ยืดเหยียดกล้ามเนื้อคอบ่าไหล่ ท่ากายบริหาร มช.: https://www.med.cmu.ac.th
• พักผ่อนและจิบน้ำให้เพียงพอนะคะ ✨`;
  }

  // Smart Contextual Fallback
  return `🤖 น้อง CC พร้อมช่วยงานพี่ๆ ทุกเรื่องเลยค่าบ ✨ ถามเจาะจงได้ทันทีนะคะ เช่น:
• "ใครเซพเงินได้สูงสุด / อันดับ Save Cost รายบุคคลและยูนิต"
• "วิเคราะห์งานค้าง / ใครงานค้างมากสุด"
• "งานของ จ๊อบ / วา / พิม / โอ๊ต เป็นยังไงบ้าง"
• "ขอรายละเอียดตัวชี้วัดเป้าหมายต่างๆ"
• "รายงานภาพรวมเดือนนี้"
• หรือขอบรีฟ/ติดตามงานได้ทันทีค่า 🌸`;
}

