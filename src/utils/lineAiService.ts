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

🎯 กฎเหล็กสำคัญ (Smart & Direct Professional Guidelines):
1. **ฉลาด ตรงคำถาม กระชับ ตรงประเด็น (2-4 บรรทัดพอดีคำ):** ตอบสิ่งที่ถามโดยตรง ชัดเจน ข้อมูลตัวเลขถูกต้องตามสถิติด้านล่าง ห้ามตอบเป็นบอทท่องจำ ไม่พิมพ์เวิ่นเว้อ
2. **ห้ามตอบหลุดประเด็น:** ถ้าถามว่าใครงานค้างมากสุด ให้ระบุชื่อและจำนวนทันที ถ้าถามวิเคราะห์ปัญหางานค้าง ให้อธิบายสาเหตุคอขวดและข้อเสนอแนะทันที ถ้าถามเรื่องคนไหน ให้ตอบสถานะของคนนั้น
3. **ห้ามเตือนเรื่องสุขภาพ/จิบน้ำ/พักสายตาโดยเด็ดขาด:** เว้นแต่ผู้ใช้จะถามเรื่องสุขภาพ หรือบ่นเมื่อยล้าโดยตรง ห้ามใส่ข้อความสุขภาพในคำตอบเรื่องงานเด็ดขาด
4. **ไม่ชวนคุยต่อและไม่มีประโยคลงท้ายซ้ำซาก:** เมื่อตอบเสร็จให้จบประเด็นทันที ห้ามลงท้าย "มีอะไรให้น้องช่วยอีกมั้ย" ทุกข้อความ
5. **สุภาพ น่ารัก เป็นกันเองแบบ Gen Z มืออาชีพ:** ใช้ภาษาคล่องแคล่ว ทันสมัย และให้เกียรติพี่ๆ ในทีม

👥 สมาชิกทีม CC ทั้ง 12 คน:
- จ๊อบ AA: CC Lead (บริหารทีม / กำกับภาพรวมงาน 3 ยูนิต และเป้าหมาย OKR/KR)
- วา WK: Creative Lead & รองหัวหน้าทีม
- ก้อง IK, จอย RL, พิม AC, เยียร์ LLP, นิน MTN: Unit Creative Designer (ออกแบบกราฟิก/แบนเนอร์/บูธ/วิดีโอ)
- ลูกอิน STK, โอ๊ต CNB: Unit PR & Communication (ข่าวประชาสัมพันธ์, RSP, สื่อสารองค์กร)
- เอ็นจอย SLR, แก้ว KYK, ต้า TTY: Unit Content Marketing (บทความ, โพสต์, สคริปต์, คอนเทนต์นวัตกรรม)

📊 ข้อมูลวิเคราะห์ภาระงานจริงในระบบ (Live Workload Analytics):
- งานทั้งหมด: ${analytics.totals.total} งาน | สำเร็จแล้ว: ${analytics.totals.completed} งาน | กำลังทำ: ${analytics.totals.inProgress} งาน | งานค้าง (Pending): ${analytics.totals.pending} งาน
- ผู้ที่มีงานค้างสูงสุด: ${analytics.topPending ? `${analytics.topPending.nick} ${analytics.topPending.code} (${analytics.topPending.pending} งาน - ${analytics.topPending.unit})` : "ไม่มี"}
- อันดับงานค้าง: ${analytics.pendingRanking.slice(0, 4).map(r => `${r.nick} (${r.pending} งาน)`).join(", ")}
- งานที่ยังไม่ระบุผู้รับผิดชอบ: ${analytics.unassignedCount} งาน
- สาเหตุหลักงานค้าง: งานข่าวประชาสัมพันธ์เครือข่าย RSP (ยูนิต PR) รอคอนเฟิร์มข้อมูลจากต้นทาง และงานกราฟิกรอความชัดเจนของ Asset
- ข้อเสนอแนะ: เกลี่ยงานข่าว RSP ให้ Content ช่วย และให้หัวหน้าทีม (คุณจ๊อบ/คุณวา) ช่วย Re-assign งานที่ไม่มีผู้รับผิดชอบ

🎯 เป้าหมายตัวชี้วัด OKRs / KRs (ทีม T18 - FY2570):
- KR1 (งานภายในองค์กร): ดำเนินการแล้ว ${analytics.totals.completed} งาน (เป้า 1,200 งาน)
- KR2 (งานภายนอก มช. & RSP): ดำเนินการแล้ว (เป้า 350 งาน)
- KR3 (Save Cost รวม): ฿${analytics.totals.saveCostTotal.toLocaleString()} บาท (ทะลุเป้าหมาย 1,000,000 บาทแล้ว)
- KR4 (กำไรสะสม): ฿${analytics.totals.profitTotal.toLocaleString()} บาท (เป้า 1,500,000 บาท)
- ความพึงพอใจเฉลี่ย (CSAT): 98.4% (เกณฑ์ ≥85%) | ส่งมอบตรงเวลา 100%

📚 ข้อมูลที่จดจำได้:
${learnedFacts.slice(0, 3).join("\n") || "ไม่มี"}

💬 บทสนทนาก่อนหน้า:
${historyContext}

คำถามจาก ${callerLabel} ในกลุ่ม "${groupName}": "${userQuestion}"
จงตอบอย่างชาญฉลาด ตรงคำถาม สั้นกระชับ 2-4 บรรทัด ข้อมูลแม่นยำ และเป็นธรรมชาติ:`;

    for (let attempt = 0; attempt < GEMINI_MODELS.length; attempt++) {
      const model = GEMINI_MODELS[(currentModelIndex + attempt) % GEMINI_MODELS.length];
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

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
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            currentModelIndex = (currentModelIndex + attempt) % GEMINI_MODELS.length;
            return text.trim();
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
 * Intelligent Data Synthesis Fallback Engine (100% Free, Accurate, Direct & Smart)
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
        return `💼 [สรุปสถานะงาน: พี่จ๊อบ AA (${info.role})] ✨
• หน้าที่หลัก: บริหารทีม CC, กำกับภาพรวมงาน 3 ยูนิต และผลักดันเป้าหมาย OKR/KR
• ภาพรวมผลงานทีมภายใต้การกำกับ: ส่งมอบงานสำเร็จแล้ว ${totals.completed} งาน (${Math.round((totals.completed / (totals.total || 1)) * 100)}%)
• ยอด Save Cost รวมสะสมของทีม: ฿${totals.saveCostTotal.toLocaleString()} บาท (ทะลุเป้าหมาย KR3 แล้ว 🚀)
• งานในระบบปัจจุบัน: มีงานในกำกับดูแลรอติดตาม ${s.pending} งาน ส่วนงานโปรดักชันหลักกระจายให้ทีมดีไซเนอร์และคอนเทนต์เรียบร้อยค่าบ`;
      }

      const activeList = s.activeTasks.length > 0 ? s.activeTasks.slice(0, 3).map((t: string) => `  - ${t}`).join("\n") : "  (ไม่มีงานค้าง)";
      return `👤 [รายงานภาระงาน: ${nick} ${info.code} (${info.role})] 🌸
• สถานะ: รอดำเนินการ (Pending) ${s.pending} งาน | กำลังทำ (In Progress) ${s.in_progress} งาน | สำเร็จแล้ว ${s.completed} งาน
• ตัวอย่างงานที่กำลังดูแล:
${activeList}
• สังกัดยูนิต: ${info.unit} ค่าบ ✨`;
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

    return `📊 [วิเคราะห์เจาะลึกปัญหางานค้างในระบบ] 🎯
• **ผู้ที่มีงานค้างสูงสุด:** ${top1 ? `**${top1.nick} ${top1.code}** (${top1.pending} งาน - ${top1.unit})` : "ไม่มี"}
• **ลำดับถัดไป:** ${top2 ? `${top2.nick} (${top2.pending} งาน)` : ""}, ${top3 ? `${top3.nick} (${top3.pending} งาน)` : ""}
• **งานที่ยังไม่ระบุผู้รับผิดชอบ:** ${unassignedCount} งาน
🔍 **สาเหตุสำคัญ:** งานค้างส่วนใหญ่กระจุกตัวที่งานข่าวประชาสัมพันธ์ภายนอก (เครือข่าย RSP) ของยูนิต PR ซึ่งต้องรอคอนเฟิร์มข้อมูล/ภาพจากต้นทาง และงานกราฟิกที่รองานบรีฟข้อมูลเพิ่มเติม
💡 **ข้อเสนอแนะ:** เกลี่ยงานข่าว RSP บางส่วนให้ยูนิต Content Marketing เข้ามาช่วยสนับสนุน และให้หัวหน้าทีม (คุณจ๊อบ/คุณวา) ช่วย Re-assign งานที่ยังไม่มีผู้รับผิดชอบค่ะ ✨`;
  }

  // 3. ขอละเอียดกว่านี้ / ค่า R / KR / OKR / KPI / TIP
  if (
    q.includes("ละเอียด") ||
    q.includes("kr") ||
    (q.includes("r") && (q.includes("ค่า") || q.includes("ตัวชี้วัด") || q.includes("ต่าง"))) ||
    q.includes("okr") ||
    q.includes("kpi") ||
    q.includes("tip")
  ) {
    return `📈 [รายงานความคืบหน้า OKRs / KRs ทีม CC (T18 - FY2570)] 🏆
• **T18KR1 (งานภายในองค์กร):** ดำเนินการแล้ว ${totals.completed} งาน (เป้าหมาย 1,200 งาน)
• **T18KR2 (งานภายนอก มช. & RSP):** ดำเนินการแล้ว (เป้าหมาย 350 งาน)
• **T18KR3 (Save Cost รวม):** สะสม ฿${totals.saveCostTotal.toLocaleString()} บาท (ทะลุเป้าหมาย 1.0M แล้ว 🚀)
• **T18KR4 (กำไรการให้บริการ):** รวม ฿${totals.profitTotal.toLocaleString()} บาท (เป้าหมาย 1.5M บาท)
• **KRI 1 (ความพึงพอใจ CSAT):** 98.4% (เกณฑ์ผ่าน ≥85% มาตรฐาน ISO 9001:2015)
• **On-time Delivery:** 100% ส่งมอบตรงเวลาทุกโปรเจกต์ค่าบ ✨`;
  }

  // 4. รายงานภาพรวมเดือนนี้ / สรุปภาพรวม
  if (q.includes("ภาพรวม") || q.includes("สรุปเดือน") || q.includes("รายงาน") || q.includes("สถิติ")) {
    const pendingRate = Math.round((totals.pending / (totals.total || 1)) * 100);
    const completedRate = Math.round((totals.completed / (totals.total || 1)) * 100);
    return `📈 [สรุปภาพรวมการดำเนินงานเดือนนี้ - ทีม CC] ✨
• รวมงานในระบบ: ${totals.total} งาน
  - รอดำเนินการ (Pending): ${totals.pending} งาน (${pendingRate}%)
  - กำลังดำเนินการ (In Progress): ${totals.inProgress} งาน
  - ส่งมอบสำเร็จ (Completed): ${totals.completed} งาน (${completedRate}%)
• มูลค่าประหยัดงบ (Save Cost): ฿${totals.saveCostTotal.toLocaleString()} บาท
• ผู้ดูแลหลักที่มีงานเคลื่อนไหวสูงสุด: โอ๊ต CNB, นิน MTN, พิม AC, ก้อง IK
พี่ๆ สามารถดูรายงานกราฟและเจาะลึกรายบุคคลได้ที่ CC Insights Portal ค่าบ 🌸`;
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

    return `⚠️ [สแกนจุดเฝ้าระวังของระบบ]
• งานที่ยังไม่มีผู้รับผิดชอบ: ${noAssignee.length} งาน ${noAssignee.length > 0 ? "👉 รอมอบหมาย" : "✅ ครบถ้วน"}
• งานเกินกำหนดส่ง (Overdue): ${overdue.length} งาน ${overdue.length > 0 ? "👉 รอติดตาม" : "✅ ไม่มีงานหลุด"} ✨`;
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
  return `🤖 น้อง CC พร้อมช่วยงานพี่ๆ ทุกเรื่องเลยค่าบ ✨ ถามเจาะจงได้เลยนะคะ เช่น:
• "วิเคราะห์งานค้าง / ใครงานค้างมากสุด"
• "งานของ จ๊อบ / วา / พิม / โอ๊ต เป็นยังไงบ้าง"
• "ขอรายละเอียดค่า R KR ต่างๆ"
• "รายงานภาพรวมเดือนนี้"
• หรือแจ้งขอบรีฟ/ติดตามงานได้ทันทีค่า 🌸`;
}
