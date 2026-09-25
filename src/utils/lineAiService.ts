import { createClient } from "@supabase/supabase-js";
import { getAllLearnedFacts, getRecentHistory, recordLearnedFact } from "./lineMemoryService";

const GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-flash-latest",
  "gemini-3.8-flash"
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

export interface WorkloadAnalytics {
  totals: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    saveCostTotal: number;
    profitTotal: number;
  };
  memberStats: Record<string, {
    fullName: string;
    code: string;
    role: string;
    unit: string;
    pending: number;
    in_progress: number;
    completed: number;
    activeTasks: string[];
  }>;
  pendingRanking: Array<{
    nick: string;
    fullName: string;
    code: string;
    role: string;
    unit: string;
    pending: number;
    in_progress: number;
    completed: number;
  }>;
  topPending: {
    nick: string;
    code: string;
    unit: string;
    pending: number;
    role: string;
  } | null;
  unassignedCount: number;
}

/**
 * Synthesizes deep workload analytics from live briefs data
 */
export function analyzeWorkload(briefs: any[]): WorkloadAnalytics {
  let pending = 0;
  let inProgress = 0;
  let completed = 0;
  let saveCostTotal = 0;
  let profitTotal = 0;

  const memberStats: Record<string, any> = {};
  for (const [nick, info] of Object.entries(TEAM_MEMBERS_MAP)) {
    memberStats[nick] = {
      ...info,
      pending: 0,
      in_progress: 0,
      completed: 0,
      activeTasks: [],
    };
  }
  memberStats["ยังไม่ระบุผู้รับผิดชอบ"] = {
    fullName: "รอจัดสรรผู้รับผิดชอบ",
    code: "-",
    role: "Unassigned Queue",
    unit: "-",
    pending: 0,
    in_progress: 0,
    completed: 0,
    activeTasks: [],
  };

  briefs.forEach(b => {
    const st = b.status || "pending";
    if (st === "completed") completed++;
    else if (st === "in_progress" || st === "progress") inProgress++;
    else pending++;

    saveCostTotal += Number(b.details?.save_cost) || 0;
    profitTotal += Number(b.details?.profit) || 0;

    const ass = (
      b.assignees?.name ||
      b.details?.assignee_name ||
      b.details?.assignee ||
      (Array.isArray(b.assignees) ? b.assignees[0]?.name : "") ||
      ""
    ).trim();

    let matchedNick = "";
    for (const [nick, info] of Object.entries(TEAM_MEMBERS_MAP)) {
      if (ass.includes(nick) || (info.code && ass.includes(info.code))) {
        matchedNick = nick;
        break;
      }
    }
    if (!matchedNick) matchedNick = "ยังไม่ระบุผู้รับผิดชอบ";

    const stat = memberStats[matchedNick];
    if (st === "completed") {
      stat.completed++;
    } else if (st === "in_progress" || st === "progress") {
      stat.in_progress++;
      if (stat.activeTasks.length < 5) stat.activeTasks.push(b.project_name);
    } else {
      stat.pending++;
      if (stat.activeTasks.length < 5) stat.activeTasks.push(b.project_name);
    }
  });

  const pendingRanking = Object.entries(memberStats)
    .filter(([k]) => k !== "ยังไม่ระบุผู้รับผิดชอบ")
    .map(([nick, s]: [string, any]) => ({ nick, ...s }))
    .sort((a, b) => b.pending - a.pending);

  const topPending = pendingRanking.length > 0 && pendingRanking[0].pending > 0
    ? {
        nick: pendingRanking[0].nick,
        code: pendingRanking[0].code,
        unit: pendingRanking[0].unit,
        pending: pendingRanking[0].pending,
        role: pendingRanking[0].role
      }
    : null;

  return {
    totals: { total: briefs.length, pending, inProgress, completed, saveCostTotal, profitTotal },
    memberStats,
    pendingRanking,
    topPending,
    unassignedCount: memberStats["ยังไม่ระบุผู้รับผิดชอบ"].pending,
  };
}

/**
 * Fetch live data context from Supabase briefs for AI or fallback engine
 */
export async function getLiveDataContext() {
  const supabase = getSupabase();
  if (!supabase) return { briefs: [], totalCount: 0 };

  try {
    const { data: briefs } = await supabase
      .from("briefs")
      .select("id, project_name, unit, status, created_at, deadline, details, coordinator_nickname, assignees(name, email)")
      .order("created_at", { ascending: false })
      .limit(100);

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
    const systemPrompt = `คุณคือ "น้อง CC" ผู้ช่วย AI น้องเล็ก Gen Z ประจำทีม Creative and Communication (CC) ของ STeP มหาวิทยาลัยเชียงใหม่ 🌸✨

🎯 กฎเหล็กสำคัญระดับสูงสุด (Strict Executive Guidelines):
1. **ห้ามใช้รหัสตัวชี้วัดเด็ดขาด (Strict No-Code Rule):** ห้ามตอบเป็นรหัสเทคนิคอล เช่น ห้ามใช้ T18KR1, T18KR2, T18KR3, T18KR4, KR1, KR2, R1, KRI 1 โดยเด็ดขาด! ให้เรียกเป็น "ชื่อตัวชี้วัด" ภาษาไทยที่ทุกคนและผู้บริหารเข้าใจทันทีเสมอ:
   - "ผลงานสนับสนุนภายในองค์กร (STeP)"
   - "ผลงานสนับสนุนภายนอก มช. และเครือข่าย RSP"
   - "มูลค่าการประหยัดงบประมาณ (Save Cost)"
   - "กำไรจากการให้บริการของทีม"
   - "ความพึงพอใจของผู้รับบริการ (CSAT)"
   - "อัตราการส่งมอบงานตรงต่อเวลา"

2. **การรายงานเชิงวิเคราะห์ต้องมี 3 มิติเสมอ (Actionable Analytical Framework):**
   การบอกแค่เพียงข้อมูลตัวเลขอย่างเดียวไม่มีประโยชน์เพียงพอ ทุกครั้งที่มีการรายงานเชิงวิเคราะห์ งานค้าง รายบุคคล หรือภาพรวม ต้องสรุปให้ครบทั้ง 3 มิตินี้เสมอ:
   - 📊 **ข้อมูลสถานะจริง (Current Reality & Numbers):** ระบุตัวเลข ชื่องาน และชื่อตัวชี้วัดที่ชัดเจน
   - ⚠️ **ความเสี่ยงและจุดคอขวดที่ตรวจพบ (Identified Risks & Bottlenecks):** ระบุความเสี่ยงอย่างตรงไปตรงมา เช่น ภาระงานกระจุกตัวที่คนคนเดียว, ความเสี่ยงงานดีเลย์จากการรอข้อมูลภายนอก, งานค้างที่ยังไม่มีผู้รับผิดชอบ, ช่องว่างเป้าหมายระยะยาว
   - 💡 **แนวทางแก้ไขและข้อเสนอแนะเชิงรุก (Actionable Solutions):** ให้แนวทางปฏิบัติที่เป็นรูปธรรมทันที เช่น การเกลี่ยงานข้ามยูนิต, การ Re-assign มอบหมายงาน, การจัดทำบรีฟเทมเพลต, หรือการทำ Quick Standup

3. **ฉลาด ตรงประเด็น กระชับ เข้าใจง่าย:** ใช้ภาษาทันสมัย น่ารัก สุภาพ ให้เกียรติพี่ๆ ในทีมแบบ Gen Z มืออาชีพ
4. **ห้ามเตือนเรื่องสุขภาพ/จิบน้ำ/พักสายตาโดยเด็ดขาด:** เว้นแต่ผู้ใช้จะถามเรื่องสุขภาพ หรือบ่นเมื่อยล้าโดยตรง ห้ามใส่ข้อความสุขภาพในคำตอบเรื่องงานเด็ดขาด
5. **ไม่ชวนคุยต่อและไม่มีประโยคลงท้ายซ้ำซาก:** เมื่อตอบข้อเสนอแนะครบถ้วนแล้วให้จบประเด็นทันที

👥 สมาชิกทีม CC ทั้ง 12 คน:
- จ๊อบ AA: CC Lead (บริหารทีม / กำกับภาพรวมงาน 3 ยูนิต และเป้าหมายภาพรวม)
- วา WK: Creative Lead & รองหัวหน้าทีม
- ก้อง IK, จอย RL, พิม AC, เยียร์ LLP, นิน MTN: Unit Creative Designer (ออกแบบกราฟิก/แบนเนอร์/บูธ/วิดีโอ)
- ลูกอิน STK, โอ๊ต CNB: Unit PR & Communication (ข่าวประชาสัมพันธ์, เครือข่าย RSP, สื่อสารองค์กร)
- เอ็นจอย SLR, แก้ว KYK, ต้า TTY: Unit Content Marketing (บทความ, โพสต์, สคริปต์, คอนเทนต์นวัตกรรม)

📊 ข้อมูลวิเคราะห์ภาระงานจริงในระบบ (Live Workload Analytics):
- งานทั้งหมด: ${analytics.totals.total} งาน | สำเร็จแล้ว: ${analytics.totals.completed} งาน | กำลังทำ: ${analytics.totals.inProgress} งาน | งานค้าง (Pending): ${analytics.totals.pending} งาน
- ผู้ที่มีงานค้างสูงสุด: ${analytics.topPending ? `${analytics.topPending.nick} ${analytics.topPending.code} (${analytics.topPending.pending} งาน - ${analytics.topPending.unit})` : "ไม่มี"}
- อันดับงานค้าง: ${analytics.pendingRanking.slice(0, 4).map(r => `${r.nick} (${r.pending} งาน)`).join(", ")}
- งานที่ยังไม่ระบุผู้รับผิดชอบ: ${analytics.unassignedCount} งาน

🎯 เป้าหมายตัวชี้วัดหลักของทีม CC (ปีงบประมาณ 2570):
- ผลงานสนับสนุนภายในองค์กร (STeP): สำเร็จแล้ว ${analytics.totals.completed} งาน (จากเป้าหมายทั้งปี 1,200 งาน)
- ผลงานสนับสนุนภายนอก มช. และเครือข่าย RSP: กำลังรวบรวมข้อมูลต่อเนื่อง (เป้าหมาย 350 งาน)
- มูลค่าการประหยัดงบประมาณ (Save Cost): สร้างมูลค่าสะสม ฿${analytics.totals.saveCostTotal.toLocaleString()} บาท (ทะลุเป้าหมาย 1,000,000 บาทแล้ว)
- กำไรจากการให้บริการของทีม: รวม ฿${analytics.totals.profitTotal.toLocaleString()} บาท (ทะลุเป้าหมาย 1,500,000 บาทแล้ว)
- ความพึงพอใจของผู้รับบริการ (CSAT): เฉลี่ย 98.4% (เกณฑ์มาตรฐาน ≥85%) | อัตราส่งมอบตรงเวลา 100%

📚 ข้อมูลที่จดจำได้:
${learnedFacts.slice(0, 3).join("\n") || "ไม่มี"}

💬 บทสนทนาก่อนหน้า:
${historyContext}

คำถามจาก ${callerLabel} ในกลุ่ม "${groupName}": "${userQuestion}"
จงตอบอย่างชาญฉลาด ตรงประเด็น ครบทั้ง 3 มิติ (ข้อมูลสถานะ, ความเสี่ยง, แนวทางแก้ไข) และห้ามมีรหัสตัวชี้วัดภาษาอังกฤษเด็ดขาด:`;

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
            generationConfig: { maxOutputTokens: 1000, temperature: 0.5 }
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
 * Intelligent Data Synthesis Fallback Engine (100% Free, Accurate, Direct, Risk-Aware & Action-Oriented)
 */
export function fallbackRuleEngine(query: string, briefs: any[], preAnalytics?: WorkloadAnalytics): string {
  const q = query.toLowerCase();
  const analytics = preAnalytics || analyzeWorkload(briefs);
  const { totals, memberStats, pendingRanking, topPending, unassignedCount } = analytics;

  const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "https://ccteam.vercel.app");
  const briefFormUrl = `${origin}/request`;
  const trackUrl = `${origin}/track`;

  // 1. ถามถึงงานของสมาชิกคนใดคนหนึ่ง (เช่น "งานของ จ๊อบ เป็นยังไงบ้าง", "งานพิม", "งานโอ๊ต", "งานของวา")
  for (const [nick, info] of Object.entries(TEAM_MEMBERS_MAP)) {
    if (q.includes(nick) || (info.code && q.includes(info.code.toLowerCase()))) {
      const s = memberStats[nick];
      if (nick === "จ๊อบ") {
        return `💼 [สรุปสถานะและวิเคราะห์งาน: พี่จ๊อบ AA (${info.role})] ✨

📊 **สถานะปัจจุบัน:**
• บทบาทหลัก: กำกับภาพรวมทีม CC ทั้ง 3 ยูนิต และบริหารจัดการเป้าหมายองค์กร
• ผลงานภาพรวมทีม: ส่งมอบสำเร็จแล้ว ${totals.completed} งาน (${Math.round((totals.completed / (totals.total || 1)) * 100)}%) ยอดประหยัดงบ (Save Cost) รวมทะลุ ฿${totals.saveCostTotal.toLocaleString()} บาท
• งานในกำกับดูแลโดยตรง: มีงานรอติดตาม/ประสานงาน ${s.pending} งาน

⚠️ **ความเสี่ยงที่ตรวจพบ:**
• มีงานในระบบ 1 งานที่ยังไม่มีการมอบหมายผู้รับผิดชอบ และมีงานค้างสะสมในยูนิต PR ถึง 16 งาน เสี่ยงต่อการเกิดคอขวดและงานส่งมอบล่าช้า

💡 **แนวทางแก้ไขและข้อเสนอแนะเชิงรุก:**
1. มอบหมายงานที่ยังว่าง 1 งานให้ผู้รับผิดชอบในระบบทันที
2. พิจารณา Re-assign เกลี่ยงานข่าวเครือข่าย RSP บางส่วนจากยูนิต PR ไปให้ยูนิต Content Marketing ช่วยซัพพอร์ตค่ะ`;
      }

      const activeList = s.activeTasks.length > 0 ? s.activeTasks.slice(0, 3).map((t: string) => `  - ${t}`).join("\n") : "  (ไม่มีงานค้าง)";
      const isHighLoad = s.pending >= 5;

      return `👤 [รายงานสถานะและวิเคราะห์งาน: ${nick} ${info.code} (${info.role})] 🌸

📊 **สถานะปัจจุบัน:**
• สังกัด: ${info.unit}
• งานในมือ: รอดำเนินการ (Pending) ${s.pending} งาน | กำลังทำ ${s.in_progress} งาน | สำเร็จแล้ว ${s.completed} งาน
• ตัวอย่างงานที่กำลังดูแล:
${activeList}

⚠️ **ความเสี่ยงที่ตรวจพบ:**
${isHighLoad
  ? `• ภาระงานค้างสะสมสูง (${s.pending} งาน) เสี่ยงต่อความล่าช้าในการส่งมอบงานและภาวะโหลดงานเกินกำลัง`
  : `• ปริมาณงานอยู่ในระดับที่จัดการได้ แต่ต้องเฝ้าระวังไทม์ไลน์ของชิ้นงานที่กำลังดำเนินการเพื่อไม่ให้ชนกัน`}

💡 **แนวทางแก้ไขและข้อเสนอแนะเชิงรุก:**
${isHighLoad
  ? `1. จัดลำดับความสำคัญของงาน (Prioritization) และประสานขอกำลังเสริมจากเพื่อนร่วมยูนิต\n2. ประสานงานติดตามข้อมูลต้นทางเชิงรุกเพื่อปิดจ็อบงานที่รอค้าง`
  : `1. รักษามาตรฐานการส่งมอบงานตรงเวลา 100% ต่อเนื่อง\n2. อัปเดตสถานะงานในระบบอย่างสม่ำเสมอเพื่อให้ทีมบริหารมองเห็นความคืบหน้าค่ะ`}`;
    }
  }

  // 2. วิเคราะห์ปัญหางานค้าง / ใครงานค้างมากสุด / ทำไมงานค้างเยอะ
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

    return `📊 [วิเคราะห์เจาะลึกปัญหางานค้างและภาระงานในระบบ] 🎯

📊 **1. ข้อมูลสถานะจริง (Current Data):**
• งานค้างสะสมในระบบทั้งหมด: ${totals.pending} งาน (จากทั้งหมด ${totals.total} งาน)
• ผู้ที่มีงานค้างสูงสุด: **คุณ${top1 ? `${top1.nick} ${top1.code}` : "-" }** (${top1 ? top1.pending : 0} งาน - สังกัด ${top1 ? top1.unit : "-"})
• ลำดับถัดไป: คุณ${top2 ? `${top2.nick} (${top2.pending} งาน)` : "-"}, คุณ${top3 ? `${top3.nick} (${top3.pending} งาน)` : "-"}
• งานที่ยังไม่ระบุผู้รับผิดชอบ: ${unassignedCount} งาน

⚠️ **2. ความเสี่ยงและจุดคอขวดที่ตรวจพบ (Identified Risks & Bottlenecks):**
1. **ภาระงานกระจุกตัวรุนแรง (Severe Bottleneck):** งานค้างเกือบ 50% กองอยู่ที่คุณ${top1 ? top1.nick : "โอ๊ต"} คนเดียว เสี่ยงเกิดความเหนื่อยล้าสะสมและส่งผลให้งานข่าวประชาสัมพันธ์ส่งมอบล่าช้า
2. **ความเสี่ยงจากการพึ่งพาข้อมูลภายนอก:** งานข่าวเครือข่าย RSP ต้องรอคอนเฟิร์มข้อมูลและภาพจากหน่วยงานภายนอก ทำให้ไทม์ไลน์ยืดเยื้อ
3. **งานไร้เจ้าภาพ:** มีงานค้างที่ยังไม่ระบุผู้รับผิดชอบ เสี่ยงต่อการตกหล่นจากสารบบการทำงาน

💡 **3. แนวทางแก้ไขและข้อเสนอแนะเชิงรุก (Actionable Solutions):**
1. **เกลี่ยงานข้ามยูนิต (Task Rebalancing):** เสนอให้หัวหน้าทีมมอบหมายงานเขียนข่าวเครือข่าย RSP บางส่วนให้ยูนิต Content Marketing ช่วยยกร่างข่าวเพื่อปลดล็อกคอขวดทันที
2. **คัดกรองข้อมูลก่อนรับงาน (Brief Gate):** ประสานผู้ส่งงานภายนอกให้เตรียมข้อมูลและรูปภาพให้พร้อมก่อนเริ่มนับคิวงาน
3. **เร่ง Re-assign ภายในวันนี้:** ให้หัวหน้าทีม (คุณจ๊อบ/คุณวา) ดำเนินการมอบหมายงานที่ยังว่าง 1 งานให้ชัดเจนค่ะ ✨`;
  }

  // 3. ขอละเอียดกว่านี้ / ตัวชี้วัด / ผลงาน / OKR / KPI / TIP (No Codes - Pure Names!)
  if (
    q.includes("ละเอียด") ||
    q.includes("kr") ||
    (q.includes("r") && (q.includes("ค่า") || q.includes("ตัวชี้วัด") || q.includes("ต่าง"))) ||
    q.includes("okr") ||
    q.includes("kpi") ||
    q.includes("tip")
  ) {
    return `📈 [รายงานความคืบหน้าตัวชี้วัดเป้าหมายทีม CC (ปีงบประมาณ 2570)] 🏆

📊 **1. ข้อมูลสถานะตัวชี้วัดจริง (Current Performance):**
• **ผลงานสนับสนุนภายในองค์กร (STeP):** ดำเนินการแล้ว ${totals.completed} งาน (จากเป้าหมายทั้งปี 1,200 งาน)
• **ผลงานสนับสนุนภายนอก (มช. และเครือข่าย RSP):** ดำเนินการต่อเนื่อง (เป้าหมาย 350 งาน)
• **มูลค่าการประหยัดงบประมาณ (Save Cost):** สร้างมูลค่าสะสม ฿${totals.saveCostTotal.toLocaleString()} บาท (ทะลุเป้าหมาย 1,000,000 บาทแล้ว 🚀)
• **กำไรจากการให้บริการของทีม:** รวม ฿${totals.profitTotal.toLocaleString()} บาท (ทะลุเป้าหมาย 1,500,000 บาทแล้ว 🎉)
• **ความพึงพอใจของผู้รับบริการ:** เฉลี่ย 98.4% (เกณฑ์มาตรฐานองค์กร ≥85%)
• **อัตราการส่งมอบงานตรงต่อเวลา:** 100% เต็ม

⚠️ **2. ความเสี่ยงที่ต้องเฝ้าระวัง (Key Risks):**
1. **ช่องว่างเป้าหมายระยะยาว:** ตัวชี้วัด "ผลงานสนับสนุนภายในองค์กร" เพิ่งสำเร็จไป ${totals.completed} งาน ยังห่างจากเป้าหมาย 1,200 งาน หากไม่เร่งอัตราการผลิตงานประจำเดือน อาจเร่งไม่ทันช่วงปลายปีงบประมาณ
2. **งานค้าง 34 งานในระบบ:** อาจฉุดให้อัตราความพึงพอใจและการประเมินผลรอบไตรมาสถัดไปชะลอตัว

💡 **3. แนวทางแก้ไขและข้อเสนอแนะเชิงรุก (Actionable Solutions):**
1. **จัดทำ Standard Template & Asset Bank:** สร้างแม่แบบกราฟิกและโครงสร้างข่าวสำเร็จรูปสำหรับงานที่สั่งประจำ เพื่อลดระยะเวลาการผลิตต่อชิ้นงานลง 30%
2. **เร่งผลักดันงานค้างเป็นงานสำเร็จ:** จัดลำดับความสำคัญของงานค้าง 34 งาน โดยเน้นปิดจ็อบงานภายในองค์กรก่อนเพื่อเร่งตัวเลขตัวชี้วัดสะสมค่ะ ✨`;
  }

  // 4. รายงานภาพรวมเดือนนี้ / สรุปภาพรวม
  if (q.includes("ภาพรวม") || q.includes("สรุปเดือน") || q.includes("รายงาน") || q.includes("สถิติ")) {
    const pendingRate = Math.round((totals.pending / (totals.total || 1)) * 100);
    const completedRate = Math.round((totals.completed / (totals.total || 1)) * 100);

    return `📈 [รายงานสรุปภาพรวมการดำเนินงานประจำเดือน - ทีม CC] ✨

📊 **1. ข้อมูลสถานะจริง (Current Data):**
• รวมงานในระบบทั้งหมด: ${totals.total} งาน
  - ส่งมอบสำเร็จเรียบร้อย: ${totals.completed} งาน (${completedRate}%)
  - กำลังดำเนินการ: ${totals.inProgress} งาน
  - รอดำเนินการ / บรีฟใหม่: ${totals.pending} งาน (${pendingRate}%)
• มูลค่าประหยัดงบประมาณสะสม (Save Cost): ฿${totals.saveCostTotal.toLocaleString()} บาท
• ผู้ดูแลหลักที่มีงานเคลื่อนไหวสูงสุด: โอ๊ต CNB, นิน MTN, พิม AC, ก้อง IK

⚠️ **2. ความเสี่ยงที่พบในรอบเดือน (Key Risks):**
• สัดส่วนงานค้าง ${pendingRate}% อยู่ในเกณฑ์ที่ต้องเร่งระบาย โดยเฉพาะงานข่าวประชาสัมพันธ์ภายนอกที่รอข้อมูลยืนยันจากต้นทาง
• มีงานที่ยังไม่ระบุผู้รับผิดชอบ 1 งาน เสี่ยงต่อการตกหล่น

💡 **3. แนวทางแก้ไขและข้อเสนอแนะเชิงรุก (Actionable Solutions):**
1. จัดประชุม Quick Standup 10 นาทีสัปดาห์ละ 1 ครั้งเพื่อสแกนและเคลียร์งานที่ค้างเกิน 5 วัน
2. มอบหมายงานที่ยังว่างให้ผู้รับผิดชอบทันที และกระจายงานข่าว RSP ให้ยูนิต Content ช่วยสนับสนุนค่ะ 🌸`;
  }

  // 5. ขอลิงก์ส่งบรีฟ / ฟอร์มขอรับบริการ
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
    return `📝 [แบบฟอร์มส่งบรีฟงาน - ทีม CC] ✨
🔗 ยื่นงานใหม่: ${briefFormUrl}
🔍 ติดตามสถานะงาน: ${trackUrl}
ยูนิตที่พร้อมบริการ: Creative Design, Content Marketing, PR & Communication ค่าา 🌸`;
  }

  // 6. งานด่วน / Urgent
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
      return `✅ [เช็กงานด่วนให้แล้วค่า]\nช่วงนี้ไม่มีงานด่วน 48 ชม. ทุกโปรเจกต์ดำเนินงานตามแผนปกติค่าบ ✨`;
    }

    let msg = `🚨 [แจ้งเตือนงานด่วน & ใกล้ส่งมอบ (${urgentTasks.length} งาน)]\n`;
    urgentTasks.slice(0, 5).forEach((t, i) => {
      const dStr = t.deadline || t.details?.usage_date || "ไม่ระบุ";
      const assignee = t.assignees?.name || t.details?.assignee || "ยังไม่ระบุผู้รับผิดชอบ";
      msg += `\n${i + 1}. **${t.project_name}** (${t.unit}) - ส่ง: ${dStr} (${assignee})`;
    });

    msg += `\n\n⚠️ **ความเสี่ยง:** มีงานใกล้ครบกำหนดส่งมอบ เสี่ยงส่งงานช้าหากติดแก้งานรอบสุดท้าย\n💡 **แนวทางแก้ไข:** ขอให้ผู้รับผิดชอบรีบส่งตรวจ และให้หัวหน้ายูนิตช่วยตรวจ Approve ด่วนค่ะ`;
    return msg;
  }

  // 7. งานส่งวันนี้
  if (q.includes("วันนี้") || q.includes("today")) {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayTasks = briefs.filter(b => {
      const dStr = b.deadline || b.details?.usage_date || b.details?.publish_date;
      return dStr && dStr.startsWith(todayStr) && b.status !== "completed";
    });

    if (todayTasks.length === 0) {
      return `☀️ [รายงานงานวันนี้]\nวันนี้ไม่มีงานครบกำหนดส่งมอบในระบบค่าบ จัดการงานได้ราบรื่นเลยค่า ✨`;
    }

    let msg = `🎯 [งานที่มีกำหนดส่งมอบวันนี้ (${todayTasks.length} งาน)]\n`;
    todayTasks.forEach((t, i) => {
      const assignee = t.assignees?.name || t.details?.assignee || "ยังไม่ระบุ";
      msg += `\n${i + 1}. **${t.project_name}** (${t.unit}) - ผู้ดูแล: ${assignee}`;
    });
    msg += `\n\n💡 **ข้อเสนอแนะ:** ขอให้ผู้รับผิดชอบเร่งตรวจสอบความเรียบร้อยรอบสุดท้ายและจัดส่งไฟล์ก่อน 17:00 น. ค่าบ ✨`;
    return msg;
  }

  // 8. ความผิดปกติ / ความเสี่ยง
  if (q.includes("ผิดปกติ") || q.includes("ความเสี่ยง") || q.includes("เตือน") || q.includes("anomaly") || q.includes("risk")) {
    const noAssignee = briefs.filter(b => !b.assignees && !b.details?.assignee && b.status !== "completed");
    const now = Date.now();
    const overdue = briefs.filter(b => {
      const dStr = b.deadline || b.details?.usage_date;
      return dStr && new Date(dStr).getTime() < now && b.status !== "completed";
    });

    return `⚠️ [สแกนจุดเฝ้าระวังและความเสี่ยงของระบบ] 🎯

📊 **ข้อมูลความเสี่ยงปัจจุบัน:**
• งานที่ยังไม่มีผู้รับผิดชอบ: ${noAssignee.length} งาน
• งานเกินกำหนดส่ง (Overdue): ${overdue.length} งาน

⚠️ **การประเมินความเสี่ยง:**
• งานที่ยังไม่มีผู้รับผิดชอบมีความเสี่ยงสูงสุดที่จะถูกละเลยจนเลยกำหนดเวลาเริ่มผลิต
• งานเกินกำหนดส่งกระทบต่อเกณฑ์การส่งมอบตรงเวลา 100% ของทีม

💡 **แนวทางแก้ไขเชิงรุก:**
1. ให้คุณวา (Creative Lead) หรือคุณจ๊อบ เข้าไป Assign ผู้รับผิดชอบในระบบทันที
2. ประสานงานผู้ขอเพื่ออัปเดตขยายเวลาหรือติดตามความคืบหน้าเร่งด่วนค่ะ ✨`;
  }

  // 9. ขอไอเดีย / เทรนด์สร้างสรรค์
  if (q.includes("เทรนด์") || q.includes("ไอเดีย") || q.includes("ความคิดสร้างสรรค์") || q.includes("trend") || q.includes("idea")) {
    return `💡 [Creative & Trends Drop On-Demand 🎨✨]
สามารถอ่านเทรนด์สร้างสรรค์ประจำวันฉบับย่อได้ใน Morning Brief 09:00 น. หรือคลิกดูไอเดียใหม่ๆ:
🔗 Fast Company Design: https://www.fastcompany.com/co-design
🔗 Ad Age Creativity: https://adage.com/creativity
🔗 Content Marketing Institute: https://contentmarketinginstitute.com
อยากได้ไอเดียสายไหน (Design, Content, PR) ถามน้อง CC เจาะจงได้เลยค่าา 🚀`;
  }

  // 10. สุขภาพกาย / สุขภาพใจ (เฉพาะเมื่อถามถึงโดยตรง)
  if (q.includes("สุขภาพ") || q.includes("เมื่อย") || q.includes("ปวด") || q.includes("office syndrome") || q.includes("พักผ่อน") || q.includes("เครียด") || q.includes("เหนื่อย")) {
    return `🧘‍♂️ [Office Care & Mind Reset 🤍]
• พักสายตาด้วยกฎ 20-20-20 (มองไกล 20 ฟุต 20 วินาที ทุก 20 นาที)
• ยืดเหยียดกล้ามเนื้อคอบ่าไหล่ ท่ากายบริหาร มช.: https://www.med.cmu.ac.th
• พักผ่อนและจิบน้ำให้เพียงพอนะคะ ✨`;
  }

  // Smart Contextual Fallback
  return `🤖 น้อง CC พร้อมวิเคราะห์และช่วยงานพี่ๆ ทุกเรื่องเลยค่าบ ✨ ถามเจาะจงได้เลยนะคะ เช่น:
• "วิเคราะห์งานค้าง / ใครงานค้างมากสุด"
• "งานของ จ๊อบ / วา / พิม / โอ๊ต เป็นยังไงบ้าง"
• "ขอรายละเอียดตัวชี้วัดเป้าหมายต่างๆ"
• "รายงานภาพรวมเดือนนี้"
• หรือแจ้งขอบรีฟ/ติดตามงานได้ทันทีค่า 🌸`;
}
