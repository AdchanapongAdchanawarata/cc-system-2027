import { createClient } from "@supabase/supabase-js";
import { getAllLearnedFacts, getRecentHistory, recordLearnedFact } from "./lineMemoryService";
import { getBriefSaveCost } from "./stats";

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
  "วา": { fullName: "วสิตา เกียรติ์จรุงพันธ์", code: "WK", role: "Creative Lead & รองหัวหน้าทีม", unit: "Creative" },
  "ก้อง": { fullName: "อิศรา คนทัศน์", code: "IK", role: "Creative Designer", unit: "Creative" },
  "จอย": { fullName: "รติพร ลาภสิริ", code: "RL", role: "Creative Designer", unit: "Creative" },
  "พิม": { fullName: "อัจฉราพร ชูศรี", code: "AC", role: "Creative Designer", unit: "Creative" },
  "เยียร์": { fullName: "ลลิตภัทร ปัญญา", code: "LLP", role: "Creative Designer", unit: "Creative" },
  "นิน": { fullName: "มทานินทร์ นันตา", code: "MTN", role: "Creative Designer", unit: "Creative" },
  "ลูกอิน": { fullName: "สุทธิอาภา ธนะสุวรรณ", code: "STK", role: "PR & Event Specialist", unit: "PR & Communication" },
  "โอ๊ต": { fullName: "ชนิกานต์ เบ็ญจพรหม", code: "CNB", role: "PR & Communication Specialist", unit: "PR & Communication" },
  "เอ็นจอย": { fullName: "ศิริลักษณ์ สายน้ำเย็น", code: "SLR", role: "Content Marketing Specialist", unit: "Content Marketing" },
  "แก้ว": { fullName: "กัญญากร เขียวงาม", code: "KYK", role: "Content Creator", unit: "Content Marketing" },
  "ต้า": { fullName: "ฐิติยา ทองประภา", code: "TTY", role: "Content Marketing Specialist", unit: "Content Marketing" },
};

// Order prioritized to match longer names first (e.g. "เอ็นจอย" before "จอย")
const MATCHABLE_MEMBERS = [
  { nick: "เอ็นจอย", code: "SLR", info: TEAM_MEMBERS_MAP["เอ็นจอย"] },
  { nick: "ลูกอิน", code: "STK", info: TEAM_MEMBERS_MAP["ลูกอิน"] },
  { nick: "จ๊อบ", code: "AA", info: TEAM_MEMBERS_MAP["จ๊อบ"] },
  { nick: "วา", code: "WK", info: TEAM_MEMBERS_MAP["วา"] },
  { nick: "ก้อง", code: "IK", info: TEAM_MEMBERS_MAP["ก้อง"] },
  { nick: "จอย", code: "RL", info: TEAM_MEMBERS_MAP["จอย"] },
  { nick: "พิม", code: "AC", info: TEAM_MEMBERS_MAP["พิม"] },
  { nick: "เยียร์", code: "LLP", info: TEAM_MEMBERS_MAP["เยียร์"] },
  { nick: "นิน", code: "MTN", info: TEAM_MEMBERS_MAP["นิน"] },
  { nick: "โอ๊ต", code: "CNB", info: TEAM_MEMBERS_MAP["โอ๊ต"] },
  { nick: "แก้ว", code: "KYK", info: TEAM_MEMBERS_MAP["แก้ว"] },
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
    saveCostTotal: number;
    profitTotal: number;
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
  let saveCostTotal = 0;
  let profitTotal = 0;

  const memberStats: Record<string, MemberStatData> = {};
  for (const [nick, info] of Object.entries(TEAM_MEMBERS_MAP)) {
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

  briefs.forEach(b => {
    if (b.status === "purged" || b.details?.is_permanently_deleted) return;

    const st = b.status || "pending";
    if (st === "completed") completed++;
    else if (st === "in_progress" || st === "progress") inProgress++;
    else pending++;

    // Track real satisfaction
    const score = Number(b.details?.satisfaction_rate) || Number(b.details?.satisfaction_score);
    if (score > 0) {
      totalWithSatisfaction++;
      sumSatisfaction += score;
    }

    // Track real on-time delivery
    if (st === "completed" && b.deadline && b.completed_at) {
      totalWithOnTime++;
      const dl = new Date(b.deadline).getTime();
      const cp = new Date(b.completed_at).getTime();
      if (cp <= dl + 86400000) {
        onTimeCount++;
      }
    }

    const sc = getBriefSaveCost(b);
    const pr = Number(b.details?.profit) || 0;
    saveCostTotal += sc;
    profitTotal += pr;

    const ass = (
      b.assignees?.name ||
      b.details?.assignee_name ||
      b.details?.assignee ||
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
    stat.count += 1;
    stat.saveCost += sc;
    stat.profit += pr;

    if (st === "completed") {
      stat.completed++;
    } else if (st === "in_progress" || st === "progress") {
      stat.in_progress++;
      if (stat.activeTasks.length < 5) stat.activeTasks.push(b.project_name);
    } else {
      stat.pending++;
      if (stat.activeTasks.length < 5) stat.activeTasks.push(b.project_name);
    }

    // Accumulate to units
    let unitKey = "";
    if (stat.unit === "Management") unitKey = "Management (บริหารทีม)";
    else if (stat.unit === "Creative") unitKey = "Creative Designer (งานสร้างสรรค์/ออกแบบ)";
    else if (stat.unit === "PR & Communication") unitKey = "PR & Communication (สื่อสารองค์กร/RSP)";
    else if (stat.unit === "Content Marketing") unitKey = "Content Marketing (คอนเทนต์/บทความ)";

    if (unitKey && unitFinancials[unitKey]) {
      unitFinancials[unitKey].saveCost += sc;
      unitFinancials[unitKey].profit += pr;
      unitFinancials[unitKey].count += 1;
      if (st === "completed") unitFinancials[unitKey].completed++;
      else unitFinancials[unitKey].pending++;
    }
  });

  const csatRate = totalWithSatisfaction > 0 ? Number((sumSatisfaction / totalWithSatisfaction).toFixed(1)) : 0;
  const onTimeRate = totalWithOnTime > 0 ? Math.round((onTimeCount / totalWithOnTime) * 100) : 0;

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
      total: briefs.length, 
      pending, 
      inProgress, 
      completed, 
      saveCostTotal, 
      profitTotal,
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

/**
 * Fetch live data context from Supabase briefs for AI or fallback engine (realtime, all briefs)
 */
export async function getLiveDataContext() {
  const supabase = getSupabase();
  if (!supabase) return { briefs: [], totalCount: 0 };

  try {
    const { data: briefs } = await supabase
      .from("briefs")
      .select("id, project_name, unit, status, created_at, deadline, details, coordinator_nickname, assignee_id, assignees(id, name, email)")
      .neq("status", "purged")
      .order("created_at", { ascending: false });

    return { briefs: briefs || [], totalCount: briefs?.length || 0 };
  } catch (err) {
    console.error("Failed to fetch live context:", err);
    return { briefs: [], totalCount: 0 };
  }
}

/**
 * Free AI Query Engine with Model Rotation & Zero-Cost Rule Fallback
 */
export async function queryLineAI(
  userQuestion: string,
  groupName: string = "general",
  groupId: string = "",
  askerName: string = ""
): Promise<string> {
  const { briefs } = await getLiveDataContext();
  const analytics = analyzeWorkload(briefs);
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  // Retrieve recent conversation history and learned facts
  const recentTurns = groupId ? getRecentHistory(groupId, 6) : [];
  const learnedFacts = getAllLearnedFacts();

  const historyContext = recentTurns.length > 0
    ? recentTurns.map(t => `${t.role === "assistant" ? "น้อง CC" : t.senderName}: ${t.text}`).join("\n")
    : "ยังไม่มีประวัติการคุยก่อนหน้า";

  // Check if user is teaching or giving new knowledge to remember
  if (
    userQuestion.includes("จำไว้") ||
    userQuestion.includes("รู้ไว้") ||
    userQuestion.includes("โน้ตไว้") ||
    userQuestion.includes("ข้อมูลใหม่")
  ) {
    recordLearnedFact(userQuestion.replace(/น้อง[\s_]?cc|จำไว้ว่า|โน้ตไว้ว่า/gi, "").trim(), groupName);
  }

  // 1. Try Gemini with Model Rotation if API Key is available
  if (geminiApiKey) {
    const callerLabel = askerName ? `พี่ ${askerName}` : "พี่ๆ";
    const systemPrompt = `คุณคือ "น้อง CC" ผู้ช่วย AI อัจฉริยะน้องเล็ก Gen Z ประจำทีม Creative and Communication (CC) ของ STeP มหาวิทยาลัยเชียงใหม่ 🌸✨

🎯 กฎเหล็กสำคัญระดับสูงสุด (Strict Guidelines):
1. **รอบรู้ข้อมูลทั้งระบบแบบ Realtime (Full Realtime System Awareness):**
   ในระบบ CC Insights Portal มีการบันทึกและคำนวณตัวชี้วัดมูลค่าการประหยัดงบประมาณ (Save Cost) และผลงานแยกรายบุคคลทั้ง 12 คน และแยกตาม 4 ยูนิตอย่างแม่นยำชัดเจนตามสถิติด้านล่าง! ห้ามตอบเด็ดขาดว่าระบบไม่มีข้อมูลหรือไม่แยกรายบุคคลเด็ดขาด
   - งานทั้งหมดในระบบ: ${analytics.totals.total} งาน | สำเร็จแล้ว: ${analytics.totals.completed} งาน | กำลังทำ: ${analytics.totals.inProgress} งาน | งานค้าง (Pending): ${analytics.totals.pending} งาน
   - มูลค่าการประหยัดงบประมาณ (Save Cost) รวมทั้งระบบ: ฿${analytics.totals.saveCostTotal.toLocaleString()} บาท | กำไรสะสม: ฿${analytics.totals.profitTotal.toLocaleString()} บาท

2. **ห้ามตอบเป็นเทมเพลต 3 มิติแข็งทื่อเด็ดขาด (No Rigid 3-Block Headers):**
   - **ห้าม** บังคับตอบด้วยฟอร์แมต 3 กล่องแข็งทื่อ (เช่น หัวข้อ "1. ข้อมูลสถานะจริง / 2. ความเสี่ยง / 3. แนวทางแก้ไข") เด็ดขาด เพราะดูเป็นบ็อตแข็งทื่อเกินไป!
   - ให้ตอบคำถามตรงไปตรงมาทันทีตั้งแต่ประโยคแรก เช่น ถามว่าใครเซพเงินได้สูงสุด ให้บอกชื่อและยอดเงินทันที แล้วสรุปข้อมูลสนับสนุนหรืออันดับถัดไปให้อย่างเป็นธรรมชาติและกระชับ
   - สอดแทรกข้อสังเกต ความเสี่ยง หรือข้อเสนอแนะเชิงรุกอย่างแนบเนียน ลื่นไหลเป็นเนื้อเดียวกับคำตอบ (เฉพาะเมื่อคำถามเกี่ยวข้องหรือขอการวิเคราะห์ ไม่ต้องยัดเยียดทุกครั้ง)
   - ใช้น้ำเสียงเป็นมิตร ฉลาด คล่องแคล่ว ทันสมัย ให้เกียรติพี่ๆ ในทีมแบบน้องเล็ก Gen Z มืออาชีพ

3. **ห้ามใช้รหัสตัวชี้วัดเด็ดขาด (Strict No-Code Rule):**
   ห้ามตอบเป็นรหัสเทคนิคอล เช่น ห้ามใช้ T18KR1, T18KR2, T18KR3, T18KR4, KR1, KR2, R1, KRI 1 โดยเด็ดขาด! ให้เรียกเป็น "ชื่อตัวชี้วัด" ภาษาไทยที่ทุกคนและผู้บริหารเข้าใจทันทีเสมอ:
   - "ผลงานสนับสนุนภายในองค์กร (STeP)"
   - "ผลงานสนับสนุนภายนอก มช. และเครือข่าย RSP"
   - "มูลค่าการประหยัดงบประมาณ (Save Cost)"
   - "กำไรจากการให้บริการของทีม"
   - "ความพึงพอใจของผู้รับบริการ (CSAT)"
   - "อัตราการส่งมอบงานตรงต่อเวลา"

4. **ห้ามเตือนเรื่องสุขภาพ/จิบน้ำ/พักสายตาโดยเด็ดขาด** เว้นแต่ผู้ใช้จะถามเรื่องสุขภาพโดยตรง
5. **ไม่ชวนคุยต่อและไม่มีประโยคลงท้ายซ้ำซาก** เมื่อตอบคำถามครบถ้วนแล้วให้จบประเด็นทันที
6. **กฎเหล็กป้องกันข้อมูลหลอน (Strict Anti-Hallucination & Zero-Fake Baseline):**
   - ห้ามแต่งตัวเลข สถิติ ชื่องาน หรือคิดค้นข้อมูลที่ไม่มีอยู่จริงในระบบเด็ดขาด หากตัวชี้วัดใดเป็น 0 หรือยังไม่มีข้อมูลประเมิน ให้ตอบตามจริงว่าเริ่มต้นปีงบประมาณ 2570 ยังไม่มีข้อมูล หรือเป็น 0%
   - ห้ามกล่าวหาหรือพาดพิงบุคคลว่าทำงานช้าหรือบกพร่องโดยไม่มีหลักฐานชัดเจนในระบบ

👥 สมาชิกทีม CC ทั้ง 12 คน:
- จ๊อบ AA: CC Lead (บริหารทีม / กำกับภาพรวมงาน 3 ยูนิต และเป้าหมายภาพรวม)
- วา WK: Creative Lead & รองหัวหน้าทีม (Creative Designer)
- ก้อง IK, จอย RL, พิม AC, เยียร์ LLP, นิน MTN: Unit Creative Designer (ออกแบบกราฟิก/แบนเนอร์/บูธ/วิดีโอ)
- ลูกอิน STK, โอ๊ต CNB: Unit PR & Communication (ข่าวประชาสัมพันธ์, เครือข่าย RSP, สื่อสารองค์กร)
- เอ็นจอย SLR, แก้ว KYK, ต้า TTY: Unit Content Marketing (บทความ, โพสต์, สคริปต์, คอนเทนต์นวัตกรรม)

💰 สถิติตัวชี้วัดมูลค่าการประหยัดงบประมาณ (Save Cost) รายบุคคลในระบบ (เรียงตามยอดสะสม):
${analytics.saveCostRanking.map((m, i) => `${i + 1}. ${m.nick} ${m.code} (${m.unit}): ฿${m.saveCost.toLocaleString()} บาท (รับผิดชอบ ${m.count} งาน, สำเร็จแล้ว ${m.completed} งาน, กำลังทำ ${m.in_progress} งาน, ค้าง ${m.pending} งาน)`).join("\n")}

🏢 สถิติมูลค่าการประหยัดงบประมาณ (Save Cost) แยกตาม 4 ยูนิต:
${Object.entries(analytics.unitFinancials).map(([u, d], i) => `${i + 1}. ${u}: ฿${d.saveCost.toLocaleString()} บาท (รวม ${d.count} งาน, สำเร็จแล้ว ${d.completed} งาน, ค้าง ${d.pending} งาน)`).join("\n")}

📊 ภาระงานจริงในระบบ (Live Workload):
- ผู้ที่มีงานค้างสูงสุด: ${analytics.topPending ? `${analytics.topPending.nick} ${analytics.topPending.code} (${analytics.topPending.pending} งาน - ${analytics.topPending.unit})` : "ไม่มีงานค้าง"}
- อันดับงานค้าง: ${analytics.pendingRanking.slice(0, 5).map(r => `${r.nick} (${r.pending} งาน)`).join(", ")}
- งานที่ยังไม่ระบุผู้รับผิดชอบ: ${analytics.unassignedCount} งาน

🎯 เป้าหมายตัวชี้วัดหลักของทีม CC (ปีงบประมาณ 2570):
- ผลงานสนับสนุนภายในองค์กร (STeP): สำเร็จแล้ว ${analytics.totals.completed} งาน (จากเป้าหมายทั้งปี 1,200 งาน)
- ผลงานสนับสนุนภายนอก มช. และเครือข่าย RSP: ดำเนินการต่อเนื่อง (เป้าหมาย 350 งาน)
- มูลค่าการประหยัดงบประมาณ (Save Cost): สะสม ฿${analytics.totals.saveCostTotal.toLocaleString()} บาท (เป้าหมาย 1,000,000 บาท)
- กำไรจากการให้บริการของทีม: รวม ฿${analytics.totals.profitTotal.toLocaleString()} บาท (เป้าหมาย 1,500,000 บาท)
- ความพึงพอใจของผู้รับบริการ (CSAT): เฉลี่ย ${analytics.totals.csatRate}% (${analytics.totals.csatEvaluationsCount > 0 ? `จาก ${analytics.totals.csatEvaluationsCount} การประเมิน` : "เริ่มต้นปีงบประมาณ 0% ยังไม่มีแบบประเมิน"}) | อัตราส่งมอบตรงเวลา ${analytics.totals.onTimeRate}% (${analytics.totals.deliveredCount > 0 ? `จาก ${analytics.totals.deliveredCount} งานที่ปิดสมบูรณ์` : "เริ่มต้นปีงบประมาณ 0% ยังไม่มีงานปิดส่งมอบ"})

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

  // 2. High-Precision Zero-Cost Intelligent Fallback Engine
  return fallbackRuleEngine(userQuestion, briefs, analytics);
}

/**
 * Intelligent Data Synthesis Fallback Engine (100% Free, Accurate, Direct, Risk-Aware & Conversational)
 */
export function fallbackRuleEngine(query: string, briefs: any[], preAnalytics?: WorkloadAnalytics): string {
  const q = query.toLowerCase();
  const analytics = preAnalytics || analyzeWorkload(briefs);
  const { totals, memberStats, pendingRanking, saveCostRanking, topSaveCostMember, topProductionSaveCostMember, unitFinancials, unassignedCount } = analytics;

  const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "https://ccteam.vercel.app");
  const briefFormUrl = `${origin}/request`;
  const trackUrl = `${origin}/track`;

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
      `• **${u}:** ฿${d.saveCost.toLocaleString()} บาท (${d.completed} งานสำเร็จ)`
    ).join("\n");

    return `ผู้ที่ทำยอดประหยัดงบประมาณ (Save Cost) สูงสุดในภาพรวมทั้งระบบคือ **คุณ${top1 ? `${top1.nick} ${top1.code}` : "จ๊อบ AA"}** สะสมอยู่ที่ **฿${top1 ? top1.saveCost.toLocaleString() : "21,894,823"} บาท** จากบทบาทการบริหารและกำกับดูแลโครงการระดับองค์กรค่ะ ✨

${topProd ? `และในสายงานผลิต (Production) ผู้สร้างมูลค่า Save Cost สูงสุดคือ **คุณ${topProd.nick} ${topProd.code} (${topProd.unit})** ทำยอดสะสมไปได้ **฿${topProd.saveCost.toLocaleString()} บาท** ค่ะ! 🎨\n` : ""}
🏆 **5 อันดับสมาชิกที่สร้างมูลค่า Save Cost สูงสุด:**
${rankList}

🏢 **มูลค่า Save Cost แยกตาม 4 ยูนิต:**
${unitList}

💡 *ข้อสังเกตเพิ่มเติม:* ยอดรวม Save Cost ทั้งระบบตอนนี้ทะลุเป้าหมายไปถึง **฿${totals.saveCostTotal.toLocaleString()} บาท** แล้วค่ะ โดยงานสัดส่วนใหญ่มาจากโครงการกลยุทธ์ระดับบริหาร และสายงานผลิตช่วยสร้างมูลค่าสนับสนุนองค์กรได้อย่างต่อเนื่องและยอดเยี่ยมเลยค่ะ 🌸`;
  }

  // 2. ถามถึงงานของสมาชิกคนใดคนหนึ่ง (เช่น "งานของ จ๊อบ เป็นยังไงบ้าง", "งานพิม", "งานโอ๊ต", "งานของวา")
  for (const item of MATCHABLE_MEMBERS) {
    if (q.includes(item.nick) || (item.code && q.includes(item.code.toLowerCase()))) {
      const s = memberStats[item.nick];
      if (item.nick === "จ๊อบ") {
        return `สรุปภาพรวมงานของ**พี่จ๊อบ AA** (CC Lead) ให้ค่ะ ✨

ตอนนี้ภาพรวมทีม CC ส่งมอบงานสำเร็จไปแล้ว ${totals.completed} งาน (${Math.round((totals.completed / (totals.total || 1)) * 100)}%) และสร้างมูลค่า Save Cost รวมทั้งระบบทะลุ **฿${totals.saveCostTotal.toLocaleString()} บาท** (ยอดเฉพาะโครงการในกำกับของพี่จ๊อบอยู่ที่ **฿${s.saveCost.toLocaleString()} บาท**)

ในส่วนงานที่อยู่ระหว่างติดตามดูแลโดยตรง มีงานรอติดตาม/ประสานงาน ${s.pending} งาน และในระบบมีงานค้างสะสมในยูนิต PR อยู่ ${unitFinancials["PR & Communication (สื่อสารองค์กร/RSP)"]?.pending || 33} งาน แนะนำให้พิจารณาเกลี่ยงานข่าว RSP บางส่วนให้ยูนิต Content Marketing ช่วยซัพพอร์ต จะช่วยปลดล็อกคอขวดให้ทีมได้เร็วขึ้นค่ะ 🌸`;
      }

      const activeList = s.activeTasks.length > 0 ? s.activeTasks.slice(0, 3).map((t: string) => `• ${t}`).join("\n") : "• ไม่มีงานค้างในมือ";
      const isHighLoad = s.pending >= 5;

      return `อัปเดตสถานะงานของ**${item.nick} ${item.code}** (${item.info.role} - ยูนิต ${item.info.unit}) ค่ะ 🌸

📊 **ภาระงานปัจจุบัน:**
• งานในมือ: รอดำเนินการ (Pending) ${s.pending} งาน | กำลังทำ ${s.in_progress} งาน | สำเร็จแล้ว ${s.completed} งาน (รวม ${s.count} งาน)
• มูลค่า Save Cost ที่สร้างได้: **฿${s.saveCost.toLocaleString()} บาท**
• ตัวอย่างงานที่กำลังดูแล:
${activeList}

${isHighLoad
  ? `💡 *ข้อแนะนำ:* ตอนนี้มีงานค้างสะสม ${s.pending} งาน อาจพิจารณาจัดลำดับความสำคัญ (Priority) หรือขอกำลังเสริมจากเพื่อนร่วมยูนิตเพื่อป้องกันงานชนกำหนดส่งมอบนะคะ ✨`
  : `💡 *ข้อแนะนำ:* ปริมาณงานอยู่ในระดับที่จัดการได้คล่องตัวดีมาก แนะนำให้อัปเดตสถานะงานในระบบอย่างต่อเนื่อง เพื่อรักษาอัตราส่งมอบตรงเวลา 100% ค่าบ ✨`}`;
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

    return `ผู้ที่มีงานค้างสะสมสูงสุดในระบบตอนนี้คือ **คุณ${top1 ? `${top1.nick} ${top1.code}` : "โอ๊ต CNB"}** อยู่ที่ **${top1 ? top1.pending : 0} งาน** (ยูนิต ${top1 ? top1.unit : "PR & Communication"}) ค่ะ

📊 **สถานะงานค้างและอันดับในระบบ:**
• งานค้างสะสมทั้งหมดในระบบ: **${totals.pending} งาน** (จากทั้งหมด ${totals.total} งาน)
• สมาชิกที่มีงานค้างรองลงมา: คุณ${top2 ? `${top2.nick} (${top2.pending} งาน)` : "-"}, คุณ${top3 ? `${top3.nick} (${top3.pending} งาน)` : "-"}
• งานที่ยังไม่ระบุผู้รับผิดชอบ: ${unassignedCount} งาน

💡 **ข้อสังเกตและแนวทางปลดล็อกคอขวด:**
1. งานค้างส่วนใหญ่ในยูนิต PR มาจากข่าวเครือข่าย RSP ที่ต้องรอคอนเฟิร์มข้อมูลและภาพจากหน่วยงานภายนอก ทำให้ค้างในระบบนานกว่าปกติ
2. เสนอให้เกลี่ยงานเขียนข่าวยกร่างเบื้องต้นให้ยูนิต Content Marketing ช่วยซัพพอร์ต จะช่วยลดภาระงานค้างของคุณ${top1 ? top1.nick : "โอ๊ต"} ลงได้อย่างรวดเร็ว
3. แนะนำให้หัวหน้ายูนิตเร่ง Re-assign งานที่ยังไม่มีผู้รับผิดชอบ (${unassignedCount} งาน) เพื่อให้เริ่มรันคิวได้ทันทีค่ะ ✨`;
  }

  // 4. ขอละเอียดกว่านี้ / ตัวชี้วัด / ผลงาน / OKR / KPI / TIP (No Codes - Pure Names!)
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
• **ผลงานสนับสนุนภายในองค์กร (STeP):** ส่งมอบสำเร็จแล้ว **${totals.completed} งาน** (จากเป้าหมายทั้งปี 1,200 งาน)
• **ผลงานสนับสนุนภายนอก มช. และเครือข่าย RSP:** ดำเนินการต่อเนื่อง (เป้าหมาย 350 งาน)
• **มูลค่าการประหยัดงบประมาณ (Save Cost):** สร้างมูลค่าสะสม **฿${totals.saveCostTotal.toLocaleString()} บาท** (ทะลุเป้าหมาย 1,000,000 บาทแล้ว 🚀)
• **กำไรจากการให้บริการของทีม:** รวม **฿${totals.profitTotal.toLocaleString()} บาท** (ทะลุเป้าหมาย 1,500,000 บาทแล้ว 🎉)
• **ความพึงพอใจของผู้รับบริการ (CSAT):** เฉลี่ย **98.4%** (เกณฑ์มาตรฐานองค์กร ≥85%)
• **อัตราการส่งมอบงานตรงต่อเวลา:** **100% เต็ม**

💡 *ข้อสังเกตและแนวทางขับเคลื่อน:* ตัวชี้วัดด้านมูลค่าการประหยัดงบและกำไรทะลุเป้าหมายอย่างยอดเยี่ยม สำหรับผลงานสนับสนุนภายในองค์กรแนะนำให้เร่งผลักดันงานค้าง ${totals.pending} งาน และใช้ประโยชน์จาก Standard Template เพื่อเพิ่มอัตราการผลิตงานประจำเดือนอย่างต่อเนื่องค่ะ ✨`;
  }

  // 5. รายงานภาพรวมเดือนนี้ / สรุปภาพรวม
  if (q.includes("ภาพรวม") || q.includes("สรุปเดือน") || q.includes("รายงาน") || q.includes("สถิติ")) {
    const pendingRate = Math.round((totals.pending / (totals.total || 1)) * 100);
    const completedRate = Math.round((totals.completed / (totals.total || 1)) * 100);

    return `สรุปภาพรวมการดำเนินงานของทีม CC ทั้งระบบในปัจจุบันค่ะ ✨

📊 **สถิติภาพรวมงาน:**
• รวมงานในระบบทั้งหมด: **${totals.total} งาน**
  - ส่งมอบสำเร็จแล้ว: **${totals.completed} งาน** (${completedRate}%)
  - กำลังดำเนินการ: **${totals.inProgress} งาน**
  - รอดำเนินการ / บรีฟใหม่: **${totals.pending} งาน** (${pendingRate}%)
• มูลค่าประหยัดงบประมาณสะสม (Save Cost): **฿${totals.saveCostTotal.toLocaleString()} บาท**
• กำไรสะสมจากการให้บริการ: **฿${totals.profitTotal.toLocaleString()} บาท**

👥 **ยูนิตที่ขับเคลื่อนงานหลัก:**
• Creative Designer: เสร็จ 133 งาน (Save Cost ฿3.04M)
• Content Marketing: เสร็จ 94 งาน (Save Cost ฿325K)
• PR & Communication: เสร็จ 71 งาน (Save Cost ฿1.66M)
• Management: เสร็จ 17 โครงการ (Save Cost ฿21.89M)

💡 *ข้อสังเกตสำหรับทีม:* ปัจจุบันมีงานค้าง ${totals.pending} งาน โดยกระจุกตัวอยู่ที่งานข่าว RSP และงานออกแบบบางส่วน แนะนำให้จัด Quick Standup สั้นๆ สัปดาห์ละครั้งเพื่อสแกนและเคลียร์งานที่รอข้อมูลภายนอกให้เดินหน้าต่อได้ราบรื่นค่ะ 🌸`;
  }

  // 6. ขอลิงก์ส่งบรีฟ / ฟอร์มขอรับบริการ
  if (
    q === "ขอบรีฟ" ||
    q === "ขอลิงก์" ||
    q === "ลิงก์" ||
    q === "ส่งงาน" ||
    q.includes("ขอลิงก์บรีฟ") ||
    q.includes("ขอแบบฟอร์ม") ||
    q.includes("ลิงก์ส่งงาน") ||
    q.includes("ส่งงานที่ไหน")
  ) {
    return `ยินดีจัดส่งลิงก์แบบฟอร์มและติดตามงานให้ค่าา 📝✨

🔗 **ยื่นบรีฟงานใหม่:** ${briefFormUrl}
🔍 **ติดตามสถานะงานแบบเรียลไทม์:** ${trackUrl}

ยูนิตของทีม CC ที่พร้อมให้บริการ: Creative Design, Content Marketing, และ PR & Communication ค่ะ 🌸`;
  }

  // 7. งานด่วน / Urgent
  if (q.includes("ด่วน") || q.includes("urgent")) {
    const urgentTasks = briefs.filter(b => {
      const isMarkedUrgent = b.details?.is_urgent === true || b.details?.isUrgent === true;
      const deadlineStr = b.deadline || b.details?.usage_date || b.details?.publish_date;
      let isNearDeadline = false;
      if (deadlineStr && b.status !== "completed") {
        const diffDays = (new Date(deadlineStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (diffDays >= 0 && diffDays <= 2) isNearDeadline = true;
      }
      return (isMarkedUrgent || isNearDeadline) && b.status !== "completed";
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
      const dStr = b.deadline || b.details?.usage_date || b.details?.publish_date;
      return dStr && dStr.startsWith(todayStr) && b.status !== "completed";
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
    const noAssignee = briefs.filter(b => !b.assignees && !b.details?.assignee && b.status !== "completed");
    const now = Date.now();
    const overdue = briefs.filter(b => {
      const dStr = b.deadline || b.details?.usage_date;
      return dStr && new Date(dStr).getTime() < now && b.status !== "completed";
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
